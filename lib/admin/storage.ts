import { randomBytes } from "node:crypto";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export const MAX_UPLOAD_MB = Number(process.env.UPLOAD_MAX_MB ?? 8);

export type UploadResult =
  | { ok: true; url: string; path: string; size: number; mime: string }
  | { ok: false; error: string };

/**
 * Storage abstraction. Local disk for dev; Cloudflare R2 (S3-compatible) for
 * production. Both implementations share the same interface so callers never
 * branch on UPLOAD_DRIVER.
 */
export interface Storage {
  save(file: File, prefix?: string): Promise<UploadResult>;
  remove(path: string): Promise<void>;
}

// Shared validation used by every driver — mime, size, magic-byte sniff.
// Returned shape is the error payload or the derived `{ ext, buf }` for save.
async function validate(
  file: File,
): Promise<{ ok: true; ext: string; mime: string; buf: Buffer } | { ok: false; error: string }> {
  const mime = file.type?.toLowerCase() ?? "";
  if (!ALLOWED_MIME.has(mime)) {
    return { ok: false, error: "Unsupported file type. Allowed: JPG, PNG, WEBP, GIF." };
  }
  if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
    return { ok: false, error: `File too large. Max ${MAX_UPLOAD_MB} MB.` };
  }
  if (file.size <= 0) {
    return { ok: false, error: "Empty file." };
  }
  const buf = Buffer.from(await file.arrayBuffer());
  if (!sniffMatches(buf, mime)) {
    return { ok: false, error: "File content does not match its reported type." };
  }
  return { ok: true, ext: EXT_BY_MIME[mime], mime, buf };
}

function buildRelPath(prefix: string, ext: string): string {
  const rand = randomBytes(10).toString("hex");
  const yyyymm = new Date().toISOString().slice(0, 7); // 2026-10
  return path.posix.join(prefix, yyyymm, `${rand}.${ext}`);
}

export class LocalStorage implements Storage {
  constructor(private baseDir = path.join(process.cwd(), "public", "uploads")) {}

  async save(file: File, prefix = "p"): Promise<UploadResult> {
    const v = await validate(file);
    if (!v.ok) return v;
    const relPath = buildRelPath(prefix, v.ext);
    const absDir = path.join(this.baseDir, path.dirname(relPath));
    const absPath = path.join(this.baseDir, relPath);
    await mkdir(absDir, { recursive: true });
    await writeFile(absPath, v.buf, { mode: 0o644 });
    return { ok: true, url: `/uploads/${relPath}`, path: relPath, size: file.size, mime: v.mime };
  }

  async remove(relPath: string): Promise<void> {
    const abs = path.join(this.baseDir, relPath);
    await unlink(abs).catch(() => null);
  }
}

/**
 * Cloudflare R2 driver. R2 exposes an S3-compatible API, so we use the AWS
 * S3 SDK with a custom endpoint and `region: "auto"` (R2 ignores region).
 *
 * Required env vars (set in Vercel for the production/preview environments):
 *   R2_ACCOUNT_ID         — Cloudflare account ID (part of the R2 endpoint)
 *   R2_ACCESS_KEY_ID      — from `Manage R2 API Tokens` with Object R/W on this bucket
 *   R2_SECRET_ACCESS_KEY  — from the same token
 *   R2_BUCKET             — e.g. "brensta-uploads"
 *   R2_PUBLIC_URL         — public read URL base, e.g. "https://pub-<id>.r2.dev"
 *                           Must be the R2.dev subdomain OR a custom domain mapped
 *                           to the bucket. Must NOT end with a trailing slash.
 *
 * Images are served publicly from `${R2_PUBLIC_URL}/${relPath}`. The bucket
 * MUST have public read access enabled in the Cloudflare dashboard (R2 → bucket
 * → Settings → Public Access → R2.dev subdomain).
 */
export class R2Storage implements Storage {
  private client: S3Client;
  constructor(
    private bucket: string,
    private publicBaseUrl: string,
    accountId: string,
    accessKeyId: string,
    secretAccessKey: string,
  ) {
    this.client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    });
  }

  async save(file: File, prefix = "p"): Promise<UploadResult> {
    const v = await validate(file);
    if (!v.ok) return v;
    const relPath = buildRelPath(prefix, v.ext);
    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: relPath,
          Body: v.buf,
          ContentType: v.mime,
          // Long-lived cache — the random filename makes each image immutable.
          CacheControl: "public, max-age=31536000, immutable",
        }),
      );
      return {
        ok: true,
        url: `${this.publicBaseUrl}/${relPath}`,
        path: relPath,
        size: file.size,
        mime: v.mime,
      };
    } catch (err) {
      console.error(`[r2] save failed for ${relPath}:`, err instanceof Error ? err.message : err);
      return { ok: false, error: "Upload to object storage failed. Please try again." };
    }
  }

  async remove(relPath: string): Promise<void> {
    await this.client
      .send(new DeleteObjectCommand({ Bucket: this.bucket, Key: relPath }))
      .catch((err) => {
        console.error(`[r2] remove failed for ${relPath}:`, err instanceof Error ? err.message : err);
      });
  }
}

function sniffMatches(buf: Buffer, mime: string): boolean {
  if (buf.length < 4) return false;
  if (mime === "image/jpeg") return buf[0] === 0xff && buf[1] === 0xd8;
  if (mime === "image/png") return buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
  if (mime === "image/gif") return buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46;
  if (mime === "image/webp") return buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46;
  return false;
}

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`UPLOAD_DRIVER=r2 but ${name} is not set`);
  return v;
}

let singleton: Storage | null = null;
export function storage(): Storage {
  if (!singleton) {
    const driver = (process.env.UPLOAD_DRIVER ?? "local").toLowerCase();
    if (driver === "local") {
      singleton = new LocalStorage();
    } else if (driver === "r2") {
      singleton = new R2Storage(
        requireEnv("R2_BUCKET"),
        requireEnv("R2_PUBLIC_URL").replace(/\/+$/, ""),
        requireEnv("R2_ACCOUNT_ID"),
        requireEnv("R2_ACCESS_KEY_ID"),
        requireEnv("R2_SECRET_ACCESS_KEY"),
      );
    } else {
      throw new Error(`Unknown UPLOAD_DRIVER=${driver}`);
    }
  }
  return singleton;
}

/** Test hook — reset the storage singleton between tests. */
export function _resetStorageSingleton() {
  singleton = null;
}
