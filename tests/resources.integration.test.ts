import { randomUUID } from "node:crypto";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const getCurrentUserMock = vi.hoisted(() => vi.fn());
const storageMock = vi.hoisted(() => ({
  headObject: vi.fn(),
  signGetObject: vi.fn(),
  putObject: vi.fn(),
}));

function createOpenXmlFixture(entries: string[]) {
  const localFiles: Buffer[] = [];
  const centralEntries: Buffer[] = [];
  let localOffset = 0;

  for (const entry of entries) {
    const name = Buffer.from(entry, "utf8");
    const local = Buffer.alloc(30 + name.length);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(name.length, 26);
    name.copy(local, 30);

    const central = Buffer.alloc(46 + name.length);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt32LE(localOffset, 42);
    name.copy(central, 46);

    localFiles.push(local);
    centralEntries.push(central);
    localOffset += local.length;
  }

  const centralSize = centralEntries.reduce((size, entry) => size + entry.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(localOffset, 16);
  return Buffer.concat([...localFiles, ...centralEntries, end]);
}

vi.mock("@/lib/dal/auth", async importOriginal => ({
  ...await importOriginal<typeof import("@/lib/dal/auth")>(),
  getCurrentUser: getCurrentUserMock,
}));
vi.mock("@/lib/storage/r2", async importOriginal => ({
  ...await importOriginal<typeof import("@/lib/storage/r2")>(),
  createR2Storage: () => storageMock,
}));

describe.sequential("Sprint 4: recursos privados y R2", () => {
  const suffix = randomUUID().slice(0, 8);
  const now = new Date("2026-08-20T20:00:00.000Z");
  const email = `resources-${suffix}@example.com`;
  const noAccessEmail = `resources-empty-${suffix}@example.com`;
  const otherSlug = `other-product-${suffix}`;
  let prisma: ReturnType<typeof import("../src/lib/db/prisma")["getPrisma"]>;
  let userId = "";
  let noAccessUserId = "";
  let productId = "";
  let otherProductId = "";
  let tempDirectory = "";
  let pdfPath = "";
  let docxPath = "";
  let xlsxPath = "";
  let docxSize = 0;
  let xlsxSize = 0;

  beforeAll(async () => {
    process.env.BETTER_AUTH_SECRET = "test-only-secret-with-at-least-thirty-two-characters";
    process.env.BETTER_AUTH_URL = "http://localhost:3000";
    process.env.APP_URL = "http://localhost:3000";
    const [{ getPrisma }, { seedAcademyProducts }] = await Promise.all([
      import("../src/lib/db/prisma"),
      import("../prisma/seed-data"),
    ]);
    prisma = getPrisma();
    await prisma.user.deleteMany({ where: { email: { in: [email, noAccessEmail] } } });
    await prisma.product.deleteMany({ where: { slug: otherSlug } });
    const product = await seedAcademyProducts(prisma);
    productId = product.id;
    const [user, noAccessUser] = await Promise.all([
      prisma.user.create({ data: { id: randomUUID(), name: "Ciro", email, emailVerified: true } }),
      prisma.user.create({ data: { id: randomUUID(), name: "Sin acceso", email: noAccessEmail, emailVerified: true } }),
    ]);
    userId = user.id;
    noAccessUserId = noAccessUser.id;
    const other = await prisma.product.create({ data: { slug: otherSlug, title: "Producto de control", description: "Sólo para autorización local.", type: "KIT", status: "PUBLISHED", accessType: "ONE_TIME" } });
    otherProductId = other.id;
    tempDirectory = await mkdtemp(join(tmpdir(), "cis-resource-test-"));
    pdfPath = join(tempDirectory, "kit.pdf");
    docxPath = join(tempDirectory, "ficha-visita.docx");
    xlsxPath = join(tempDirectory, "hoja-mediciones.xlsx");
    await writeFile(pdfPath, "%PDF-1.7\n1 0 obj\n<<>>\nendobj\n%%EOF\n", "latin1");
    const docx = createOpenXmlFixture(["[Content_Types].xml", "word/document.xml"]);
    const xlsx = createOpenXmlFixture(["[Content_Types].xml", "xl/workbook.xml"]);
    docxSize = docx.length;
    xlsxSize = xlsx.length;
    await Promise.all([writeFile(docxPath, docx), writeFile(xlsxPath, xlsx)]);
    vi.spyOn(console, "info").mockImplementation(() => undefined);
  });

  beforeEach(async () => {
    getCurrentUserMock.mockReset();
    storageMock.headObject.mockReset();
    storageMock.signGetObject.mockReset();
    storageMock.putObject.mockReset();
    await prisma.entitlement.deleteMany({ where: { userId: { in: [userId, noAccessUserId] } } });
    const { seedAcademyProducts } = await import("../prisma/seed-data");
    await seedAcademyProducts(prisma);
    await prisma.resource.updateMany({ where: { productId }, data: { status: "COMING_SOON", storageKey: null, mimeType: null, fileSize: null, downloadName: null } });
    await prisma.resource.deleteMany({ where: { productId: otherProductId } });
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.user.deleteMany({ where: { email: { in: [email, noAccessEmail] } } });
      await prisma.product.deleteMany({ where: { slug: otherSlug } });
      await prisma.resource.updateMany({ where: { productId }, data: { status: "COMING_SOON", storageKey: null, mimeType: null, fileSize: null, downloadName: null } });
      await prisma.$disconnect();
    }
    if (tempDirectory) await rm(tempDirectory, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  async function resourceByPosition(position: number) {
    return prisma.resource.findFirstOrThrow({ where: { productId, position } });
  }

  async function makeAvailable(position: number, type: "PDF" | "VIDEO" = "PDF") {
    const resource = await resourceByPosition(position);
    const extension = type === "VIDEO" ? "mp4" : "pdf";
    return prisma.resource.update({ where: { id: resource.id }, data: {
      status: "AVAILABLE",
      type,
      storageKey: `products/kit-cis-5p/test/${resource.id}.${extension}`,
      mimeType: type === "VIDEO" ? "video/mp4" : "application/pdf",
      fileSize: BigInt(512),
      downloadName: `recurso.${extension}`,
    } });
  }

  async function entitlement(data: { status?: "ACTIVE" | "REVOKED"; startsAt?: Date; expiresAt?: Date | null; revokedAt?: Date | null } = {}) {
    return prisma.entitlement.create({ data: {
      userId,
      productId,
      status: data.status ?? "ACTIVE",
      sourceType: "ADMIN",
      startsAt: data.startsAt ?? new Date(now.getTime() - 60_000),
      expiresAt: data.expiresAt ?? null,
      revokedAt: data.revokedAt ?? null,
    } });
  }

  it("1. permite resolver un recurso AVAILABLE", async () => {
    const resource = await makeAvailable(1);
    await entitlement();
    const { resolveResourceAccess } = await import("../src/lib/resources/access");
    expect((await resolveResourceAccess(userId, resource.id, now, prisma))?.resource.status).toBe("AVAILABLE");
  });

  it("2. no autoriza un recurso COMING_SOON", async () => {
    const resource = await resourceByPosition(2);
    await entitlement();
    const { resolveResourceAccess } = await import("../src/lib/resources/access");
    expect(await resolveResourceAccess(userId, resource.id, now, prisma)).toBeNull();
  });

  it("3. no muestra ni autoriza un recurso DRAFT", async () => {
    const resource = await prisma.resource.update({ where: { id: (await resourceByPosition(2)).id }, data: { status: "DRAFT" } });
    await entitlement();
    const { findAuthorizedProductResources, resolveResourceAccess } = await import("../src/lib/resources/access");
    expect(await resolveResourceAccess(userId, resource.id, now, prisma)).toBeNull();
    expect((await findAuthorizedProductResources(userId, "kit-cis-5p", now, prisma))?.resources.some(item => item.id === resource.id)).toBe(false);
  });

  it("4. no muestra ni autoriza un recurso ARCHIVED", async () => {
    const resource = await prisma.resource.update({ where: { id: (await resourceByPosition(2)).id }, data: { status: "ARCHIVED" } });
    await entitlement();
    const { findAuthorizedProductResources, resolveResourceAccess } = await import("../src/lib/resources/access");
    expect(await resolveResourceAccess(userId, resource.id, now, prisma)).toBeNull();
    expect((await findAuthorizedProductResources(userId, "kit-cis-5p", now, prisma))?.resources.some(item => item.id === resource.id)).toBe(false);
  });

  it("5. el endpoint rechaza a un usuario sin sesión", async () => {
    const resource = await makeAvailable(1);
    getCurrentUserMock.mockResolvedValueOnce(null);
    const { GET } = await import("../src/app/api/academy/resources/[resourceId]/access/route");
    const response = await GET(new Request(`http://localhost/api/academy/resources/${resource.id}/access`), { params: Promise.resolve({ resourceId: resource.id }) });
    expect(response.status).toBe(401);
    expect(storageMock.signGetObject).not.toHaveBeenCalled();
  });

  it("6. rechaza a un usuario sin entitlement", async () => {
    const resource = await makeAvailable(1);
    const { resolveResourceAccess } = await import("../src/lib/resources/access");
    expect(await resolveResourceAccess(noAccessUserId, resource.id, now, prisma)).toBeNull();
  });

  it("7. admite al usuario con entitlement activo", async () => {
    const resource = await makeAvailable(1);
    await entitlement();
    const { resolveResourceAccess } = await import("../src/lib/resources/access");
    expect((await resolveResourceAccess(userId, resource.id, now, prisma))?.product.slug).toBe("kit-cis-5p");
  });

  it("8. un entitlement REVOKED corta acceso", async () => {
    const resource = await makeAvailable(1);
    await entitlement({ status: "REVOKED", revokedAt: new Date(now.getTime() - 1_000) });
    const { resolveResourceAccess } = await import("../src/lib/resources/access");
    expect(await resolveResourceAccess(userId, resource.id, now, prisma)).toBeNull();
  });

  it("9. un entitlement expirado corta acceso aunque diga ACTIVE", async () => {
    const resource = await makeAvailable(1);
    await entitlement({ expiresAt: new Date(now.getTime() - 1_000) });
    const { resolveResourceAccess } = await import("../src/lib/resources/access");
    expect(await resolveResourceAccess(userId, resource.id, now, prisma)).toBeNull();
  });

  it("10. un entitlement futuro todavía no concede acceso", async () => {
    const resource = await makeAvailable(1);
    await entitlement({ startsAt: new Date(now.getTime() + 60_000) });
    const { resolveResourceAccess } = await import("../src/lib/resources/access");
    expect(await resolveResourceAccess(userId, resource.id, now, prisma)).toBeNull();
  });

  it("11. el entitlement de un producto no abre recursos de otro", async () => {
    await entitlement();
    const otherResource = await prisma.resource.create({ data: { productId: otherProductId, title: "Otro manual", type: "PDF", status: "AVAILABLE", storageKey: `products/${otherSlug}/manual.pdf`, mimeType: "application/pdf", fileSize: BigInt(512), downloadName: "manual.pdf", position: 1 } });
    const { resolveResourceAccess } = await import("../src/lib/resources/access");
    expect(await resolveResourceAccess(userId, otherResource.id, now, prisma)).toBeNull();
  });

  it("12. genera URL firmada sólo después de autorizar", async () => {
    const resource = await makeAvailable(1);
    await entitlement({ startsAt: new Date(Date.now() - 60_000) });
    getCurrentUserMock.mockResolvedValueOnce({ id: userId, email });
    storageMock.headObject.mockResolvedValueOnce({ contentLength: 512, contentType: "application/pdf" });
    storageMock.signGetObject.mockResolvedValueOnce("https://signed.r2.example/manual.pdf");
    const { GET } = await import("../src/app/api/academy/resources/[resourceId]/access/route");
    const response = await GET(new Request(`http://localhost/api/academy/resources/${resource.id}/access`), { params: Promise.resolve({ resourceId: resource.id }) });
    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe("https://signed.r2.example/manual.pdf");
  });

  it("13. firma la URL con expiración de 120 segundos", async () => {
    const resource = await makeAvailable(1);
    await entitlement({ startsAt: new Date(Date.now() - 60_000) });
    getCurrentUserMock.mockResolvedValueOnce({ id: userId, email });
    storageMock.headObject.mockResolvedValueOnce({ contentLength: 512, contentType: "application/pdf" });
    storageMock.signGetObject.mockResolvedValueOnce("https://signed.r2.example/manual.pdf");
    const { GET } = await import("../src/app/api/academy/resources/[resourceId]/access/route");
    await GET(new Request(`http://localhost/api/academy/resources/${resource.id}/access`), { params: Promise.resolve({ resourceId: resource.id }) });
    expect(storageMock.signGetObject).toHaveBeenCalledWith(expect.objectContaining({ expiresIn: 120 }));
  });

  it("14. el DTO público nunca expone storageKey", async () => {
    const resource = await makeAvailable(1);
    const { toPublicResourceDto } = await import("../src/lib/resources/access");
    const dto = toPublicResourceDto(resource);
    expect(dto).not.toHaveProperty("storageKey");
    expect(JSON.stringify(dto)).not.toContain(resource.storageKey);
  });

  it("15. el upload valida que el producto exista", async () => {
    const { uploadProductResource } = await import("../scripts/lib/resources");
    await expect(uploadProductResource({ db: prisma, storage: storageMock, productSlug: "inexistente", alias: "manual", filePath: pdfPath })).rejects.toMatchObject({ code: "PRODUCT_NOT_FOUND" });
  });

  it("16. el upload rechaza un archivo inexistente", async () => {
    const { uploadProductResource } = await import("../scripts/lib/resources");
    await expect(uploadProductResource({ db: prisma, storage: storageMock, productSlug: "kit-cis-5p", alias: "manual", filePath: join(tempDirectory, "no-existe.pdf") })).rejects.toMatchObject({ code: "FILE_NOT_FOUND" });
  });

  it("17. el upload crea el Resource y lo habilita tras verificar R2", async () => {
    await prisma.resource.delete({ where: { id: (await resourceByPosition(1)).id } });
    storageMock.putObject.mockImplementationOnce(async input => { input.body.destroy(); });
    storageMock.headObject.mockResolvedValueOnce({ contentLength: 35, contentType: "application/pdf" });
    const { uploadProductResource } = await import("../scripts/lib/resources");
    const result = await uploadProductResource({ db: prisma, storage: storageMock, productSlug: "kit-cis-5p", alias: "manual", filePath: pdfPath });
    expect(result.resource.status).toBe("AVAILABLE");
    expect(result.storageKey).toBe("products/kit-cis-5p/manual/kit-cis-5p.pdf");
  });

  it("18. el upload actualiza sin duplicar el Resource", async () => {
    storageMock.putObject.mockImplementation(async input => { input.body.destroy(); });
    storageMock.headObject.mockResolvedValue({ contentLength: 35, contentType: "application/pdf" });
    const { uploadProductResource } = await import("../scripts/lib/resources");
    await uploadProductResource({ db: prisma, storage: storageMock, productSlug: "kit-cis-5p", alias: "manual", filePath: pdfPath });
    await uploadProductResource({ db: prisma, storage: storageMock, productSlug: "kit-cis-5p", alias: "manual", filePath: pdfPath });
    expect(await prisma.resource.count({ where: { productId, position: 1 } })).toBe(1);
  });

  it("19. autoriza un VIDEO disponible", async () => {
    const resource = await makeAvailable(7, "VIDEO");
    await entitlement();
    const { resolveResourceAccess } = await import("../src/lib/resources/access");
    expect((await resolveResourceAccess(userId, resource.id, now, prisma))?.resource.type).toBe("VIDEO");
  });

  it("20. autoriza un PDF disponible", async () => {
    const resource = await makeAvailable(1, "PDF");
    await entitlement();
    const { resolveResourceAccess } = await import("../src/lib/resources/access");
    expect((await resolveResourceAccess(userId, resource.id, now, prisma))?.resource.mimeType).toBe("application/pdf");
  });

  it("21. Mi Academia sigue listando el producto con acceso", async () => {
    await entitlement();
    const { findMyProducts } = await import("../src/lib/catalog/access");
    expect((await findMyProducts(userId, now, prisma)).map(item => item.product.slug)).toEqual(["kit-cis-5p"]);
  });

  it("22. el producto privado recibe sus ocho recursos en orden", async () => {
    await makeAvailable(1);
    await entitlement();
    const { findAuthorizedProductResources } = await import("../src/lib/resources/access");
    const result = await findAuthorizedProductResources(userId, "kit-cis-5p", now, prisma);
    expect(result?.resources).toHaveLength(8);
    expect(result?.resources.map(resource => resource.position)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it("23. la URL permanente distingue anónimo, comercial y autorizado", async () => {
    const { resolveKitResourcePortal } = await import("../src/lib/resources/portal");
    expect((await resolveKitResourcePortal(null, now, prisma)).state).toBe("ANONYMOUS");
    expect((await resolveKitResourcePortal(noAccessUserId, now, prisma)).state).toBe("COMMERCIAL");
    await entitlement();
    expect((await resolveKitResourcePortal(userId, now, prisma)).state).toBe("AUTHORIZED");
  });

  it("24. adivinar un resourceId no salta la autorización", async () => {
    const resource = await makeAvailable(1);
    await entitlement();
    const { resolveResourceAccess } = await import("../src/lib/resources/access");
    expect(await resolveResourceAccess(noAccessUserId, resource.id, now, prisma)).toBeNull();
    expect(await resolveResourceAccess(userId, randomUUID(), now, prisma)).toBeNull();
  });

  it("25. una URL permanente de video redirige al login sin sesión", async () => {
    getCurrentUserMock.mockResolvedValueOnce(null);
    const { KitVideoResourcePage } = await import("../src/components/academy/KitVideoResourcePage");
    await expect(KitVideoResourcePage({ alias: "unidad-interior", pathname: "/academia/kit-5p/recursos/unidad-interior", heading: "Video — Unidad interior" })).rejects.toThrow("NEXT_REDIRECT");
  });

  it("26. una cuenta sin entitlement recibe estado comercial", async () => {
    const { resolveKitVideoResourcePortal } = await import("../src/lib/resources/portal");
    expect((await resolveKitVideoResourcePortal(noAccessUserId, "unidad-interior", now, prisma)).state).toBe("NO_ACCESS");
  });

  it("27. la URL permanente conserva el estado COMING_SOON autorizado", async () => {
    await entitlement();
    const { resolveKitVideoResourcePortal } = await import("../src/lib/resources/portal");
    const portal = await resolveKitVideoResourcePortal(userId, "unidad-interior", now, prisma);
    expect(portal.state).toBe("AUTHORIZED");
    expect(portal.resource?.status).toBe("COMING_SOON");
  });

  it("28. la URL permanente entrega el VIDEO AVAILABLE sin storageKey público", async () => {
    await makeAvailable(8, "VIDEO");
    await entitlement();
    const { resolveKitVideoResourcePortal } = await import("../src/lib/resources/portal");
    const portal = await resolveKitVideoResourcePortal(userId, "unidad-exterior", now, prisma);
    expect(portal.resource).toMatchObject({ type: "VIDEO", status: "AVAILABLE" });
    expect(portal.resource).not.toHaveProperty("storageKey");
  });

  it("29. los dos videos conservan rutas permanentes distintas", async () => {
    const { getKitResourceDefinition } = await import("../src/data/resources");
    expect(getKitResourceDefinition("unidad-interior")).toMatchObject({ permanentPath: "/academia/kit-5p/recursos/unidad-interior" });
    expect(getKitResourceDefinition("unidad-exterior")).toMatchObject({ permanentPath: "/academia/kit-5p/recursos/unidad-exterior" });
  });

  it("30. el alias ficha-visita acepta DOCX validado por su contenido", async () => {
    storageMock.putObject.mockImplementation(async input => { input.body.destroy(); });
    storageMock.headObject.mockResolvedValue({ contentLength: docxSize, contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
    const { uploadProductResource } = await import("../scripts/lib/resources");
    const result = await uploadProductResource({ db: prisma, storage: storageMock, productSlug: "kit-cis-5p", alias: "ficha-visita", filePath: docxPath });
    expect(result.resource).toMatchObject({ status: "AVAILABLE", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", downloadName: "ficha-de-visita.docx" });
  });

  it("31. el alias mediciones acepta XLSX validado por su contenido", async () => {
    storageMock.putObject.mockImplementation(async input => { input.body.destroy(); });
    storageMock.headObject.mockResolvedValue({ contentLength: xlsxSize, contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const { uploadProductResource } = await import("../scripts/lib/resources");
    const result = await uploadProductResource({ db: prisma, storage: storageMock, productSlug: "kit-cis-5p", alias: "mediciones", filePath: xlsxPath });
    expect(result.resource).toMatchObject({ status: "AVAILABLE", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", downloadName: "hoja-de-mediciones.xlsx" });
  });

  it("32. rechaza un formato válido cuando no corresponde al alias", async () => {
    const { uploadProductResource } = await import("../scripts/lib/resources");
    await expect(uploadProductResource({ db: prisma, storage: storageMock, productSlug: "kit-cis-5p", alias: "mediciones", filePath: docxPath })).rejects.toMatchObject({ code: "INVALID_FILE" });
    expect(storageMock.putObject).not.toHaveBeenCalled();
  });

  it("33. los aliases anteriores resuelven la misma ficha sin crear otra definición", async () => {
    const { getKitResourceDefinition } = await import("../src/data/resources");
    expect(getKitResourceDefinition("hoja-mediciones")).toBe(getKitResourceDefinition("mediciones"));
    expect(getKitResourceDefinition("video-unidad-interior")).toBe(getKitResourceDefinition("unidad-interior"));
    expect(getKitResourceDefinition("video-unidad-exterior")).toBe(getKitResourceDefinition("unidad-exterior"));
  });
});
