import { describe, it, expect, beforeEach } from "vitest";
import { MockEmailProvider, NullEmailProvider, ConsoleEmailProvider, setEmailProvider, getEmailProvider } from "@/lib/email";
import { passwordResetEmail } from "@/lib/email/templates/password-reset";

describe("EmailProvider boundary", () => {
  beforeEach(() => setEmailProvider(null));

  it("auto-selects Console when RESEND_API_KEY is absent", () => {
    delete process.env.EMAIL_DRIVER;
    const prev = process.env.RESEND_API_KEY;
    process.env.RESEND_API_KEY = "";
    const p = getEmailProvider();
    expect(p.name).toBe("console");
    process.env.RESEND_API_KEY = prev ?? "";
    setEmailProvider(null);
  });

  it("respects EMAIL_DRIVER=null", () => {
    process.env.EMAIL_DRIVER = "null";
    const p = getEmailProvider();
    expect(p.name).toBe("null");
    expect(p.isConfigured()).toBe(false);
    delete process.env.EMAIL_DRIVER;
    setEmailProvider(null);
  });

  it("setEmailProvider(mock) is honored", async () => {
    const mock = new MockEmailProvider();
    setEmailProvider(mock);
    const p = getEmailProvider();
    expect(p.name).toBe("mock");
    await p.send({ to: "a@b.com", subject: "s", text: "t" });
    expect(mock.sent).toHaveLength(1);
  });
});

describe("MockEmailProvider", () => {
  it("records sends and can be forced to fail", async () => {
    const m = new MockEmailProvider();
    const ok = await m.send({ to: "a@b.com", subject: "s", text: "t" });
    expect(ok.ok).toBe(true);
    m.failNext("boom");
    const bad = await m.send({ to: "a@b.com", subject: "s", text: "t" });
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.reason).toBe("boom");
    m.clear();
    expect(m.sent).toHaveLength(0);
  });
});

describe("NullEmailProvider", () => {
  it("always refuses delivery", async () => {
    const n = new NullEmailProvider();
    const r = await n.send({ to: "a@b.com", subject: "s", text: "t" });
    expect(r.ok).toBe(false);
  });
});

describe("ConsoleEmailProvider", () => {
  it("returns ok but does not touch the network", async () => {
    const c = new ConsoleEmailProvider();
    const r = await c.send({ to: "a@b.com", subject: "s", text: "t" });
    expect(r.ok).toBe(true);
  });
});

describe("password-reset template", () => {
  it("includes link and TTL and sets reply-to", () => {
    const msg = passwordResetEmail({ to: "x@y.com", link: "https://brensta.local/reset?token=abc", validMinutes: 30 });
    expect(msg.subject).toMatch(/reset/i);
    expect(msg.text).toContain("https://brensta.local/reset?token=abc");
    expect(msg.text).toContain("30 minutes");
    expect(msg.replyTo).toMatch(/@/);
  });
  it("never embeds a raw token value as a logging surface in subject or headers", () => {
    const msg = passwordResetEmail({ to: "x@y.com", link: "https://x/reset?token=SECRET", validMinutes: 30 });
    expect(msg.subject).not.toContain("SECRET");
    expect(Object.values(msg.headers ?? {}).join(" ")).not.toContain("SECRET");
  });
});
