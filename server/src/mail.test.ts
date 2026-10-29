import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  verify: vi.fn(),
  sendMail: vi.fn(),
  close: vi.fn(),
  createTransport: vi.fn(),
}));
vi.mock("nodemailer", () => ({
  default: { createTransport: mocks.createTransport },
}));
import { sendMail, verifyMailConnection } from "./mail.js";
describe("SMTP connection verification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.verify.mockResolvedValue(true);
    mocks.createTransport.mockReturnValue({
      verify: mocks.verify,
      sendMail: mocks.sendMail,
      close: mocks.close,
    });
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SMTP_HOST", "smtp-relay.brevo.com");
    vi.stubEnv("SMTP_PORT", "2525");
    vi.stubEnv("SMTP_FROM", "");
  });
  afterEach(() => vi.unstubAllEnvs());
  it("authenticates without a sender or sending email, and requires TLS in production", async () => {
    await verifyMailConnection();
    expect(mocks.verify).toHaveBeenCalledOnce();
    expect(mocks.sendMail).not.toHaveBeenCalled();
    expect(mocks.close).toHaveBeenCalledOnce();
    expect(mocks.createTransport).toHaveBeenCalledWith(
      expect.objectContaining({ port: 2525, secure: false, requireTLS: true }),
    );
  });
  it("propagates authentication failure and closes the connection without sending", async () => {
    const failure = Object.assign(new Error("SMTP authentication rejected"), {
      code: "EAUTH",
      responseCode: 535,
    });
    mocks.verify.mockRejectedValueOnce(failure);
    await expect(verifyMailConnection()).rejects.toBe(failure);
    expect(mocks.close).toHaveBeenCalledOnce();
    expect(mocks.sendMail).not.toHaveBeenCalled();
  });
  it("keeps notification delivery disabled while the sender is not configured", async () => {
    expect(
      await sendMail(
        "owner@example.invalid",
        "Connection setup",
        "Technical check",
      ),
    ).toBe(false);
    expect(mocks.createTransport).not.toHaveBeenCalled();
  });
  it("sends a configured verification message to the specified owner and closes transport", async () => {
    vi.stubEnv("SMTP_FROM", "owner@example.invalid");
    mocks.sendMail.mockResolvedValueOnce({});
    expect(
      await sendMail(
        "owner@example.invalid",
        "Setup verification",
        "Technical setup check",
      ),
    ).toBe(true);
    expect(mocks.sendMail).toHaveBeenCalledWith({
      from: "owner@example.invalid",
      to: "owner@example.invalid",
      subject: "Setup verification",
      text: "Technical setup check",
    });
    expect(mocks.close).toHaveBeenCalledOnce();
  });
});
