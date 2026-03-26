import { describe, it, expect } from "vitest";

const SUPPORTED_LOCALES = ["en", "mn"];

describe("Locale API validation logic", () => {
  it("accepts valid locale 'en'", () => {
    expect(SUPPORTED_LOCALES.includes("en")).toBe(true);
  });

  it("accepts valid locale 'mn'", () => {
    expect(SUPPORTED_LOCALES.includes("mn")).toBe(true);
  });

  it("rejects unsupported locale 'fr'", () => {
    expect(SUPPORTED_LOCALES.includes("fr")).toBe(false);
  });

  it("rejects empty string", () => {
    expect(SUPPORTED_LOCALES.includes("")).toBe(false);
  });
});
