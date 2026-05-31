/**
 * Jest global setup — runs before any test file.
 *
 * Memberi env minimal yang dibutuhkan loadEnv() supaya unit test bersifat
 * hermetic: tidak tergantung file .env lokal developer atau shell. Hanya
 * di-set kalau belum ada, jadi test yang sengaja meng-override (mis.
 * ai-client.service.spec) tetap bisa atur nilainya sendiri.
 */
process.env.NODE_ENV = process.env.NODE_ENV ?? "test";
process.env.DATABASE_URL =
  process.env.DATABASE_URL ?? "postgresql://test:test@localhost:5432/test?schema=public";
process.env.JWT_SECRET =
  process.env.JWT_SECRET ?? "test-jwt-secret-that-is-at-least-32-characters-long";
