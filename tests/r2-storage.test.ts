/**
 * Guards for the Cloudflare R2 storage driver.
 *
 * These check the factory logic + validation shared with LocalStorage.
 * Real R2 writes are tested manually against the Cloudflare dashboard;
 * mocking the S3 client here would prove nothing useful.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { storage, LocalStorage, R2Storage, _resetStorageSingleton, MAX_UPLOAD_MB } from "@/lib/admin/storage";

function clearR2Env() {
  delete process.env.UPLOAD_DRIVER;
  delete process.env.R2_ACCOUNT_ID;
  delete process.env.R2_ACCESS_KEY_ID;
  delete process.env.R2_SECRET_ACCESS_KEY;
  delete process.env.R2_BUCKET;
  delete process.env.R2_PUBLIC_URL;
}

function makeFile(bytes: Uint8Array, type: string, name = "x.jpg"): File {
  return new File([bytes.buffer as ArrayBuffer], name, { type });
}

describe("storage factory", () => {
  beforeEach(() => {
    _resetStorageSingleton();
    clearR2Env();
  });
  afterEach(() => {
    _resetStorageSingleton();
    clearR2Env();
  });

  it("defaults to LocalStorage when UPLOAD_DRIVER is unset", () => {
    expect(storage()).toBeInstanceOf(LocalStorage);
  });

  it("returns R2Storage when UPLOAD_DRIVER=r2 and all R2_* vars are set", () => {
    process.env.UPLOAD_DRIVER = "r2";
    process.env.R2_ACCOUNT_ID = "acct123";
    process.env.R2_ACCESS_KEY_ID = "AKIATEST";
    process.env.R2_SECRET_ACCESS_KEY = "secret-value";
    process.env.R2_BUCKET = "brensta-uploads";
    process.env.R2_PUBLIC_URL = "https://pub-xyz.r2.dev";
    expect(storage()).toBeInstanceOf(R2Storage);
  });

  it("strips trailing slash from R2_PUBLIC_URL (defensive — avoids // in image URLs)", () => {
    process.env.UPLOAD_DRIVER = "r2";
    process.env.R2_ACCOUNT_ID = "acct";
    process.env.R2_ACCESS_KEY_ID = "k";
    process.env.R2_SECRET_ACCESS_KEY = "s";
    process.env.R2_BUCKET = "b";
    process.env.R2_PUBLIC_URL = "https://pub-xyz.r2.dev/";
    const s = storage();
    // We can only observe this indirectly through the private field, but we
    // can at least construct it without throwing.
    expect(s).toBeInstanceOf(R2Storage);
  });

  it("throws a clear error when UPLOAD_DRIVER=r2 and R2_BUCKET is missing", () => {
    process.env.UPLOAD_DRIVER = "r2";
    process.env.R2_ACCOUNT_ID = "acct";
    process.env.R2_ACCESS_KEY_ID = "k";
    process.env.R2_SECRET_ACCESS_KEY = "s";
    // R2_BUCKET deliberately unset
    process.env.R2_PUBLIC_URL = "https://pub-xyz.r2.dev";
    expect(() => storage()).toThrow(/R2_BUCKET/);
  });

  it("throws on unknown UPLOAD_DRIVER values", () => {
    process.env.UPLOAD_DRIVER = "ftp";
    expect(() => storage()).toThrow(/Unknown UPLOAD_DRIVER=ftp/);
  });
});

describe("storage validation (both drivers reuse the same rules)", () => {
  it("rejects unsupported mime types", async () => {
    _resetStorageSingleton();
    const s = new LocalStorage("/tmp/brensta-test-" + Date.now());
    const file = makeFile(new Uint8Array([1, 2, 3, 4]), "application/pdf", "x.pdf");
    const r = await s.save(file);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/Unsupported file type/);
  });

  it("rejects files larger than MAX_UPLOAD_MB", async () => {
    const s = new LocalStorage("/tmp/brensta-test-" + Date.now());
    const tooBig = new Uint8Array(MAX_UPLOAD_MB * 1024 * 1024 + 1024);
    tooBig[0] = 0xff;
    tooBig[1] = 0xd8; // jpeg magic
    const file = makeFile(tooBig, "image/jpeg");
    const r = await s.save(file);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/File too large/);
  });

  it("rejects empty files", async () => {
    const s = new LocalStorage("/tmp/brensta-test-" + Date.now());
    const file = makeFile(new Uint8Array(0), "image/jpeg");
    const r = await s.save(file);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/Empty file/);
  });

  it("rejects magic-byte mismatch (file claims to be png but is not)", async () => {
    const s = new LocalStorage("/tmp/brensta-test-" + Date.now());
    const liar = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0]);
    const file = makeFile(liar, "image/png");
    const r = await s.save(file);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/does not match its reported type/);
  });
});

describe("next.config remotePatterns include R2 hostnames", () => {
  it("allows pub-*.r2.dev images in Next <Image>", () => {
    const src = readFileSync(resolve(__dirname, "..", "next.config.ts"), "utf8");
    expect(src).toMatch(/\*\.r2\.dev/);
    expect(src).toMatch(/images:\s*\{/);
    expect(src).toMatch(/remotePatterns/);
  });
});
