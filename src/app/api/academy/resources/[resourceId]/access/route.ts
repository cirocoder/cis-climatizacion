import { NextResponse } from "next/server";
import { ResourceAccessError, requireResourceAccess } from "@/lib/dal/resources";
import { createR2Storage, RESOURCE_URL_TTL_SECONDS } from "@/lib/storage/r2";

export async function GET(request: Request, { params }: { params: Promise<{ resourceId: string }> }) {
  const { resourceId } = await params;
  const timestamp = new Date().toISOString();
  let resolvedUserId: string | null = null;
  try {
    const { user, resource, storage } = await requireResourceAccess(resourceId);
    resolvedUserId = user.id;
    const mode = new URL(request.url).searchParams.get("disposition") === "attachment" ? "attachment" : "inline";
    const r2 = createR2Storage();
    const object = await r2.headObject(storage.key);
    if (object.contentLength === null || object.contentLength < 1 || object.contentLength !== resource.fileSize || object.contentType?.split(";", 1)[0] !== resource.mimeType) {
      throw new ResourceAccessError("NOT_FOUND", user.id);
    }
    const signedUrl = await r2.signGetObject({
      key: storage.key,
      contentType: resource.mimeType!,
      downloadName: resource.downloadName!,
      disposition: mode,
      expiresIn: RESOURCE_URL_TTL_SECONDS,
    });
    console.info(JSON.stringify({ event: "academy_resource_access", resourceId, userId: user.id, timestamp, result: "allowed" }));
    return NextResponse.redirect(signedUrl, 302);
  } catch (error) {
    const code = error instanceof ResourceAccessError ? error.code : "STORAGE_ERROR";
    console.info(JSON.stringify({ event: "academy_resource_access", resourceId, userId: error instanceof ResourceAccessError ? error.userId ?? resolvedUserId : resolvedUserId, timestamp, result: code.toLowerCase() }));
    if (error instanceof ResourceAccessError) {
      return NextResponse.json({ error: error.code === "UNAUTHENTICATED" ? "Necesitás iniciar sesión." : "Recurso no disponible." }, { status: error.code === "UNAUTHENTICATED" ? 401 : 404 });
    }
    return NextResponse.json({ error: "El almacenamiento no está disponible." }, { status: 503 });
  }
}
