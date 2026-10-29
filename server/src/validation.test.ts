import { describe, it, expect } from "vitest";
import { entrySchema, requestSchema } from "./validation.js";
const base = {
  kind: "post",
  slug: "test-post",
  title: "Test post",
  body: '<p>Safe</p><script>alert(1)</script><img src="x" onerror="alert(1)">',
};
describe("Publishing and request validation", () => {
  it("strips scripts and inline event handlers", () => {
    const data = entrySchema.parse(base);
    expect(data.body).not.toContain("<script");
    expect(data.body).not.toContain("onerror");
  });
  it("rejects unverified published testimonials", () => {
    expect(
      entrySchema.safeParse({
        ...base,
        kind: "testimonial",
        status: "PUBLISHED",
        verified: false,
      }).success,
    ).toBe(false);
  });
  it("allows explicitly labeled sample testimonials without claiming verification", () => {
    const sample = {
      ...base,
      kind: "testimonial",
      status: "PUBLISHED",
      verified: false,
      specs: { sample: true },
    };
    expect(entrySchema.safeParse(sample).success).toBe(true);
    expect(
      entrySchema.safeParse({ ...sample, specs: { sample: "true" } }).success,
    ).toBe(false);
  });
  it("requires published property data", () => {
    expect(
      entrySchema.safeParse({ ...base, kind: "property", status: "PUBLISHED" })
        .success,
    ).toBe(false);
  });
  it("rejects honeypot spam and missing consent", () => {
    const data = {
      kind: "CONTACT",
      name: "Test Person",
      email: "test@example.test",
      phone: "+211924265999",
      message: "Please contact me about a property.",
      consent: true,
    };
    expect(requestSchema.safeParse(data).success).toBe(true);
    expect(
      requestSchema.safeParse({ ...data, website: "spam.example" }).success,
    ).toBe(false);
    expect(requestSchema.safeParse({ ...data, consent: false }).success).toBe(
      false,
    );
  });
  it("rejects executable image URLs", () => {
    expect(
      entrySchema.safeParse({
        ...base,
        images: [{ url: "javascript:alert(1)", alt: "bad" }],
      }).success,
    ).toBe(false);
  });
});
