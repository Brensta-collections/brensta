import type { EmailProvider, SendArgs, SendResult } from "./provider";

/**
 * Test-only provider. Records every send; never touches the network.
 * Reset between tests with .clear().
 */
export class MockEmailProvider implements EmailProvider {
  readonly name = "mock";
  readonly sent: Array<SendArgs & { at: Date }> = [];
  private _nextResult: SendResult = { ok: true, providerId: "mock-1" };

  isConfigured(): boolean { return true; }

  async send(args: SendArgs): Promise<SendResult> {
    this.sent.push({ ...args, at: new Date() });
    return this._nextResult;
  }

  /** Force the next send to fail with a given reason — used to test failure handling. */
  failNext(reason: string) {
    this._nextResult = { ok: false, reason };
  }

  succeedNext(providerId = `mock-${this.sent.length + 1}`) {
    this._nextResult = { ok: true, providerId };
  }

  clear() {
    this.sent.length = 0;
    this.succeedNext();
  }
}
