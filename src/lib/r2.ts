// Voice AI — R2 Storage Client (Cloudflare R2 / S3-compatible)
// Stores generated artifacts in R2 buckets. Falls back gracefully when not configured.

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "voice-artifacts";
const R2_PUBLIC_BASE = process.env.R2_PUBLIC_BASE_URL; // e.g. https://artifacts.voiceai.playbeat.live

const R2_ENDPOINT = R2_ACCOUNT_ID
  ? `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
  : null;

let _client: S3Client | null = null;
let _checked = false;

function getClient(): S3Client | null {
  if (!R2_ENDPOINT || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    return null;
  }
  if (!_client) {
    _client = new S3Client({
      region: "auto",
      endpoint: R2_ENDPOINT,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    });
  }
  return _client;
}

export function isR2Configured(): boolean {
  if (_checked) return _client !== null;
  _checked = true;
  _client = getClient();
  return _client !== null;
}

export function getR2Config() {
  return {
    configured: isR2Configured(),
    bucket: R2_BUCKET_NAME,
    accountId: R2_ACCOUNT_ID ? `${R2_ACCOUNT_ID.slice(0, 8)}…` : null,
    publicBase: R2_PUBLIC_BASE || null,
  };
}

export async function uploadArtifact(
  key: string,
  content: string | Buffer,
  contentType: string = "text/plain"
): Promise<{ key: string; url: string | null; size: number }> {
  const client = getClient();
  if (!client) {
    throw new Error("R2 is not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY.");
  }

  const body = typeof content === "string" ? Buffer.from(content) : content;

  await client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );

  const url = R2_PUBLIC_BASE ? `${R2_PUBLIC_BASE}/${key}` : null;

  return { key, url, size: body.length };
}

export async function getArtifactUrl(key: string, expiresInSeconds: number = 3600): Promise<string> {
  const client = getClient();
  if (!client) throw new Error("R2 is not configured");

  if (R2_PUBLIC_BASE) {
    return `${R2_PUBLIC_BASE}/${key}`;
  }

  // Generate a presigned URL (valid for expiresInSeconds)
  const command = new GetObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key });
  return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
}

export async function deleteArtifact(key: string): Promise<void> {
  const client = getClient();
  if (!client) throw new Error("R2 is not configured");

  await client.send(
    new DeleteObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key })
  );
}
