import { encryptSecret, decryptSecret, maskSecret } from "./crypto";

const SECRET = "a-server-secret-that-is-long-enough-32chars";

describe("crypto: encryptSecret / decryptSecret", () => {
  it("round-trips a plaintext secret", () => {
    const plain = "sk-proj-abcdef1234567890";
    const packed = encryptSecret(plain, SECRET);
    expect(packed).not.toContain(plain);
    expect(decryptSecret(packed, SECRET)).toBe(plain);
  });

  it("produces a different ciphertext each time (random IV)", () => {
    const plain = "sk-same-input";
    const a = encryptSecret(plain, SECRET);
    const b = encryptSecret(plain, SECRET);
    expect(a).not.toBe(b);
    // ...but both decrypt back to the same plaintext
    expect(decryptSecret(a, SECRET)).toBe(plain);
    expect(decryptSecret(b, SECRET)).toBe(plain);
  });

  it("round-trips unicode / multibyte content", () => {
    const plain = "鍵-키-ключ-🔑";
    expect(decryptSecret(encryptSecret(plain, SECRET), SECRET)).toBe(plain);
  });

  it("fails to decrypt when the secret (KDF input) is wrong", () => {
    const packed = encryptSecret("sk-secret", SECRET);
    expect(() => decryptSecret(packed, "a-different-secret-also-32-chars-long")).toThrow();
  });

  it("fails to decrypt tampered ciphertext (GCM auth tag)", () => {
    const packed = encryptSecret("sk-secret", SECRET);
    const buf = Buffer.from(packed, "base64");
    buf[buf.length - 1] ^= 0xff; // flip last byte of ciphertext
    const tampered = buf.toString("base64");
    expect(() => decryptSecret(tampered, SECRET)).toThrow();
  });

  it("throws on a too-short packed payload", () => {
    expect(() => decryptSecret(Buffer.from("short").toString("base64"), SECRET)).toThrow(
      /too short/,
    );
  });

  it("throws when the server secret is too short to derive a key", () => {
    expect(() => encryptSecret("x", "tiny")).toThrow(/too short/);
  });
});

describe("crypto: maskSecret", () => {
  it("keeps a vendor prefix and last 4 chars", () => {
    expect(maskSecret("sk-proj-abcd1234")).toBe("sk-••••1234");
  });

  it("masks a plain key without a vendor prefix", () => {
    expect(maskSecret("abcd1234")).toBe("••••1234");
  });

  it("never returns the full secret", () => {
    const plain = "ghp_supersecrettoken9999";
    const masked = maskSecret(plain);
    expect(masked).not.toBe(plain);
    expect(masked.endsWith("9999")).toBe(true);
  });

  it("returns empty string for empty input", () => {
    expect(maskSecret("")).toBe("");
  });
});
