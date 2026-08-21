import { createReadStream } from "node:fs";
import { open, stat } from "node:fs/promises";
import { extname, resolve } from "node:path";
import type { PrismaClient } from "../../src/generated/prisma/client";
import { getKitResourceDefinition } from "../../src/data/resources";
import type { ResourceStorage } from "../../src/lib/storage/r2";

type Database = Pick<PrismaClient, "product" | "resource">;

export class ResourceUploadError extends Error {
  constructor(public code: "PRODUCT_NOT_FOUND" | "RESOURCE_NOT_FOUND" | "FILE_NOT_FOUND" | "INVALID_FILE" | "UPLOAD_VERIFICATION_FAILED", message: string) {
    super(message);
  }
}

type AcceptedFormat = "pdf" | "docx" | "xlsx" | "mp4" | "webm";

async function detectOpenXmlFormat(handle: Awaited<ReturnType<typeof open>>, fileSize: number): Promise<"docx" | "xlsx" | null> {
  const tailSize = Math.min(fileSize, 65_557);
  const tail = Buffer.alloc(tailSize);
  await handle.read(tail, 0, tailSize, fileSize - tailSize);
  const eocdOffset = tail.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  if (eocdOffset < 0 || eocdOffset + 22 > tail.length) return null;
  const centralSize = tail.readUInt32LE(eocdOffset + 12);
  const centralOffset = tail.readUInt32LE(eocdOffset + 16);
  if (centralSize < 46 || centralSize > 16 * 1024 * 1024 || centralOffset + centralSize > fileSize) return null;

  const central = Buffer.alloc(centralSize);
  await handle.read(central, 0, centralSize, centralOffset);
  const entries = new Set<string>();
  let cursor = 0;
  while (cursor + 46 <= central.length && central.readUInt32LE(cursor) === 0x02014b50) {
    const nameLength = central.readUInt16LE(cursor + 28);
    const extraLength = central.readUInt16LE(cursor + 30);
    const commentLength = central.readUInt16LE(cursor + 32);
    const next = cursor + 46 + nameLength + extraLength + commentLength;
    if (next > central.length) return null;
    entries.add(central.subarray(cursor + 46, cursor + 46 + nameLength).toString("utf8"));
    cursor = next;
  }
  if (!entries.has("[Content_Types].xml")) return null;
  if (entries.has("word/document.xml")) return "docx";
  if (entries.has("xl/workbook.xml")) return "xlsx";
  return null;
}

async function inspectFile(filePath: string, acceptedFormats: readonly AcceptedFormat[]) {
  const absolutePath = resolve(filePath);
  let fileStat;
  try {
    fileStat = await stat(absolutePath);
  } catch {
    throw new ResourceUploadError("FILE_NOT_FOUND", "El archivo indicado no existe");
  }
  if (!fileStat.isFile() || fileStat.size < 1) throw new ResourceUploadError("INVALID_FILE", "El recurso debe ser un archivo no vacío");
  const handle = await open(absolutePath, "r");
  const signature = Buffer.alloc(16);
  const trailer = Buffer.alloc(Math.min(1024, fileStat.size));
  let officeFormat: "docx" | "xlsx" | null = null;
  try {
    await handle.read(signature, 0, signature.length, 0);
    await handle.read(trailer, 0, trailer.length, Math.max(0, fileStat.size - trailer.length));
    if (signature.readUInt32LE(0) === 0x04034b50) officeFormat = await detectOpenXmlFormat(handle, fileStat.size);
  } finally {
    await handle.close();
  }

  let mimeType: string | null = null;
  let extension: string | null = null;
  let format: AcceptedFormat | null = null;
  if (signature.subarray(0, 5).toString("ascii") === "%PDF-") {
    mimeType = "application/pdf";
    extension = ".pdf";
    format = "pdf";
  } else if (officeFormat === "docx") {
    mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    extension = ".docx";
    format = "docx";
  } else if (officeFormat === "xlsx") {
    mimeType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    extension = ".xlsx";
    format = "xlsx";
  } else if (signature.subarray(4, 8).toString("ascii") === "ftyp") {
    mimeType = "video/mp4";
    extension = ".mp4";
    format = "mp4";
  } else if (signature.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]))) {
    mimeType = "video/webm";
    extension = ".webm";
    format = "webm";
  }
  if (!mimeType || !extension || !format) throw new ResourceUploadError("INVALID_FILE", "Formato no admitido. Se aceptan PDF, DOCX, XLSX, MP4 o WebM validados por contenido");
  if (mimeType === "application/pdf" && !trailer.toString("latin1").includes("%%EOF")) throw new ResourceUploadError("INVALID_FILE", "El PDF no contiene un cierre válido");
  if (!acceptedFormats.includes(format)) throw new ResourceUploadError("INVALID_FILE", `El alias requiere uno de estos formatos: ${acceptedFormats.join(", ").toUpperCase()}`);
  if (extname(absolutePath).toLowerCase() !== extension) throw new ResourceUploadError("INVALID_FILE", "La extensión no coincide con el contenido real del archivo");
  return { absolutePath, size: fileStat.size, mimeType, extension, format };
}

export async function uploadProductResource(input: {
  db: Database;
  storage: ResourceStorage;
  productSlug: string;
  alias: string;
  filePath: string;
}) {
  const product = await input.db.product.findUnique({ where: { slug: input.productSlug } });
  if (!product) throw new ResourceUploadError("PRODUCT_NOT_FOUND", "El producto no existe");
  if (input.productSlug !== "kit-cis-5p") throw new ResourceUploadError("RESOURCE_NOT_FOUND", "No hay recursos configurados para ese producto");
  const definition = getKitResourceDefinition(input.alias);
  if (!definition) throw new ResourceUploadError("RESOURCE_NOT_FOUND", "El alias de recurso no existe");
  const file = await inspectFile(input.filePath, definition.formats);
  const downloadName = `${definition.baseName}${file.extension}`;
  const storageKey = `products/${input.productSlug}/${definition.directory}/${downloadName}`;

  const resource = await input.db.resource.upsert({
    where: { productId_title: { productId: product.id, title: definition.title } },
    create: {
      productId: product.id,
      title: definition.title,
      description: definition.description,
      type: definition.type,
      status: "COMING_SOON",
      position: definition.position,
    },
    update: { description: definition.description, type: definition.type, position: definition.position },
  });

  await input.storage.putObject({
    key: storageKey,
    body: createReadStream(file.absolutePath),
    contentType: file.mimeType,
    contentLength: file.size,
    downloadName,
  });
  const uploaded = await input.storage.headObject(storageKey);
  if (uploaded.contentLength !== file.size || uploaded.contentType?.split(";", 1)[0] !== file.mimeType) {
    throw new ResourceUploadError("UPLOAD_VERIFICATION_FAILED", "R2 no confirmó tamaño y MIME del objeto subido");
  }

  const updated = await input.db.resource.update({
    where: { id: resource.id },
    data: {
      status: "AVAILABLE",
      storageKey,
      mimeType: file.mimeType,
      fileSize: BigInt(file.size),
      downloadName,
    },
  });
  return { resource: updated, storageKey };
}
