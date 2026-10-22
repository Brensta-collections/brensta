import { randomBytes } from "node:crypto";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";

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
 * Storage abstraction. Local disk now; swap for S3/R2 by implementing the same interface.
 */
export interface Storage {
  save(file: File, prefix?: string): Promise<UploadResult>;
  remove(path: string): Promise<void>;
}

export class LocalStorage implements Storage {
  constructor(private baseDir = path.join(process.cwd(), "public", "uploads")) {}

  async save(file: File, prefix = "p"): Promise<UploadResult> {
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
    const ext = EXT_BY_MIME[mime];
    const rand = randomBytes(10).toString("hex");
    const yyyymm = new Date().toISOString().slice(0, 7); // 2026-10
    const relDir = path.posix.join(prefix, yyyymm);
    const relPath = path.posix.join(relDir, `${rand}.${ext}`);
    const absDir = path.join(this.baseDir, relDir);
    const absPath = path.join(this.baseDir, relPath);

    await mkdir(absDir, { recursive: true });
    const buf = Buffer.from(await file.arrayBuffer());
    // Sanity sniff: first 4 bytes should match known magic numbers for the mime.
    if (!sniffMatches(buf, mime)) {
      return { ok: false, error: "File content does not match its reported type." };
    }
    await writeFile(absPath, buf, { mode: 0o644 });
    return { ok: true, url: `/uploads/${relPath}`, path: relPath, size: file.size, mime };
  }

  async remove(relPath: string): Promise<void> {
    const abs = path.join(this.baseDir, relPath);
    await unlink(abs).catch(() => null);
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

let singleton: Storage | null = null;
export function storage(): Storage {
  if (!singleton) {
    const driver = (process.env.UPLOAD_DRIVER ?? "local").toLowerCase();
    if (driver === "local") singleton = new LocalStorage();
    else throw new Error(`Unknown UPLOAD_DRIVER=${driver}`);
  }
  return singleton;
}
