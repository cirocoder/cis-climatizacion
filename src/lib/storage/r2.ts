import "server-only";
import type { Readable } from "node:stream";
import { GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getR2Environment, type R2Environment } from "@/lib/env/server";

export const RESOURCE_URL_TTL_SECONDS = 120;

export type ResourceStorage = {
  putObject(input: { key: string; body: Readable; contentType: string; contentLength: number; downloadName: string }): Promise<void>;
  headObject(key: string): Promise<{ contentLength: number | null; contentType: string | null }>;
  signGetObject(input: { key: string; contentType: string; downloadName: string; disposition: "inline" | "attachment"; expiresIn?: number }): Promise<string>;
};

function safeDownloadName(value: string) {
  const cleaned = value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._ -]/g, "-").replace(/[\r\n"\\/]/g, "-").replace(/\s+/g, " ").trim();
  return cleaned || "recurso-cis";
}

function contentDisposition(mode: "inline" | "attachment", name: string) {
  const ascii = safeDownloadName(name);
  return `${mode}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(name.replace(/[\r\n]/g, "-"))}`;
}

export function createR2Client(environment: R2Environment) {
  return new S3Client({
    region: environment.R2_REGION,
    endpoint: environment.R2_ENDPOINT,
    credentials: {
      accessKeyId: environment.R2_ACCESS_KEY_ID,
      secretAccessKey: environment.R2_SECRET_ACCESS_KEY,
    },
  });
}

export function createR2Storage(environment = getR2Environment()): ResourceStorage {
  const client = createR2Client(environment);
  const bucket = environment.R2_BUCKET_NAME;
  return {
    async putObject(input) {
      await client.send(new PutObjectCommand({
        Bucket: bucket,
        Key: input.key,
        Body: input.body,
        ContentType: input.contentType,
        ContentLength: input.contentLength,
        ContentDisposition: contentDisposition("attachment", input.downloadName),
      }));
    },
    async headObject(key) {
      const result = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
      return { contentLength: result.ContentLength ?? null, contentType: result.ContentType ?? null };
    },
    async signGetObject(input) {
      const expiresIn = input.expiresIn ?? RESOURCE_URL_TTL_SECONDS;
      if (expiresIn < 60 || expiresIn > 300) throw new Error("La expiración del recurso debe estar entre 60 y 300 segundos");
      return getSignedUrl(client, new GetObjectCommand({
        Bucket: bucket,
        Key: input.key,
        ResponseContentType: input.contentType,
        ResponseContentDisposition: contentDisposition(input.disposition, input.downloadName),
      }), { expiresIn });
    },
  };
}
