import { isOwnerUser, pickAiConfigKeys, OWNER_EMAIL } from "./owner";

describe("owner: isOwnerUser", () => {
  it("treats role=owner as owner", () => {
    expect(isOwnerUser({ role: "owner", email: "anyone@example.com" })).toBe(true);
  });

  it("treats matching OWNER_EMAIL as owner (case-insensitive)", () => {
    expect(isOwnerUser({ role: "user", email: OWNER_EMAIL.toUpperCase() })).toBe(true);
  });

  it("treats a normal user as non-owner", () => {
    expect(isOwnerUser({ role: "user", email: "someone@example.com" })).toBe(false);
  });

  it("returns false for null / undefined", () => {
    expect(isOwnerUser(null)).toBe(false);
    expect(isOwnerUser(undefined)).toBe(false);
  });

  it("does not crash on partial objects", () => {
    expect(isOwnerUser({})).toBe(false);
    expect(isOwnerUser({ role: null, email: null })).toBe(false);
  });

  it("trims surrounding whitespace on the owner email", () => {
    expect(isOwnerUser({ role: "user", email: `  ${OWNER_EMAIL}  ` })).toBe(true);
  });
});

describe("owner: pickAiConfigKeys", () => {
  it("detects AI config keys present in a body", () => {
    const keys = pickAiConfigKeys({ aiApiKey: "x", theme: "dark", useRealAi: true });
    expect(keys.sort()).toEqual(["aiApiKey", "useRealAi"].sort());
  });

  it("returns empty array when no AI keys present", () => {
    expect(pickAiConfigKeys({ theme: "dark", jpMode: "beginner" })).toEqual([]);
  });

  it("detects a key even when its value is null (clear intent)", () => {
    expect(pickAiConfigKeys({ aiApiKey: null })).toEqual(["aiApiKey"]);
  });
});
