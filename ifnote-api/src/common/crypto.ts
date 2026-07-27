/**
 * Symmetric AES-256-GCM encryption for per-user secrets stored at rest.
 *
 * Strategy:
 *  - Derive 32-byte key via SHA-256 from JWT_SECRET (must be ≥ 32 chars).
 *  - Random 12-byte IV per encryption.
 *  - Output format: base64(iv | tag | ciphertext).
 *
 * Why JWT_SECRET as KDF input:
 *  - Already required, server-only, set in Heroku Config Vars.
 *  - Keeps the threat model honest: if the secret leaks, JWT auth is
 *    already compromised and re-encrypting saved keys is the right
 *    follow-up. We do NOT pretend this is HSM-grade.
 *
 * For higher trust we'd use a dedicated `AI_KEY_ENC_SECRET` and
 * rotation, but that's out of scope for the MVP.
 */
import { createCipheriv, createDecipheriv, randomBytes, createHash } from "node:crypto";

const ALGO = "aes-256-gcm";
const IV_LEN = 12;
const TAG_LEN = 16;

function deriveKey(secret: string): Buffer {
  if (!secret || secret.length < 16) {
    // Should never happen in production; env loader warns at boot.
    throw new Error("crypto: server secret too short to derive an encryption key");
  }
  return createHash("sha256").update(secret, "utf8").digest();
}

export function encryptSecret(plain: string, secret: string): string {
  const key = deriveKey(secret);
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, key, iv);
  const ct = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ct]).toString("base64");
}

export function decryptSecret(packed: string, secret: string): string {
  const key = deriveKey(secret);
  const buf = Buffer.from(packed, "base64");
  if (buf.length < IV_LEN + TAG_LEN + 1) {
    throw new Error("crypto: packed secret too short");
  }
  const iv = buf.subarray(0, IV_LEN);
  const tag = buf.subarray(IV_LEN, IV_LEN + TAG_LEN);
  const ct = buf.subarray(IV_LEN + TAG_LEN);
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  const pt = Buffer.concat([decipher.update(ct), decipher.final()]);
  return pt.toString("utf8");
}

/**
 * Build a redacted display string for a secret, e.g.
 *   "sk-proj-...1234"  → keeps the prefix up to "-" plus last 4 chars.
 *   "abcd1234"         → "••••1234".
 *
 * Never returns the full secret. Safe for API responses.
 */
export function maskSecret(plain: string): string {
  if (!plain) return "";
  const tail = plain.slice(-4);
  // Keep a vendor-style prefix when present (sk-, az-, ghp_, etc.)
  const prefixMatch = plain.match(/^([A-Za-z]{1,4}[-_])/);
  const prefix = prefixMatch ? prefixMatch[1] : "";
  return `${prefix}••••${tail}`;
}
