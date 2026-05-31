import { expiresInToMs, AUTH_COOKIE_NAME } from "./auth-cookie";

describe("auth-cookie: expiresInToMs", () => {
  it("parses days", () => {
    expect(expiresInToMs("7d")).toBe(7 * 86_400_000);
  });

  it("parses hours / minutes / seconds", () => {
    expect(expiresInToMs("12h")).toBe(12 * 3_600_000);
    expect(expiresInToMs("30m")).toBe(30 * 60_000);
    expect(expiresInToMs("45s")).toBe(45 * 1_000);
  });

  it("treats a bare number as seconds", () => {
    expect(expiresInToMs("3600")).toBe(3_600_000);
  });

  it("tolerates surrounding whitespace", () => {
    expect(expiresInToMs("  7d  ")).toBe(7 * 86_400_000);
  });

  it("falls back to 7 days on empty or invalid input", () => {
    const sevenDays = 7 * 86_400_000;
    expect(expiresInToMs("")).toBe(sevenDays);
    expect(expiresInToMs("garbage")).toBe(sevenDays);
    expect(expiresInToMs("10x")).toBe(sevenDays);
  });

  it("exposes a stable cookie name", () => {
    expect(AUTH_COOKIE_NAME).toBe("ifnote_token");
  });
});
