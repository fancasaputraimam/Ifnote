/**
 * Pesan error untuk form masuk dan daftar. Sengaja tanpa import supaya bisa
 * diuji langsung dengan `node --test scripts/auth-errors.test.mjs`.
 *
 * Angka di pesan 429 mengikuti @Throttle di ifnote-api auth.controller.ts:
 * daftar 5 kali per jam, masuk 5 kali per 15 menit.
 */
export type AuthFormKind = "login" | "register";

/** `status` 0 = gagal terhubung (tidak ada respons HTTP). */
export function authErrorMessage(kind: AuthFormKind, status: number): string {
  if (status === 0) return "Koneksi bermasalah. Periksa internetmu lalu coba lagi.";
  if (status === 401 && kind === "login") {
    return "Email atau password salah. Belum punya akun? Buat akun dulu.";
  }
  if (status === 409 && kind === "register") {
    return "Email ini sudah terdaftar. Masuk saja, atau pakai email lain.";
  }
  if (status === 429) {
    return kind === "login"
      ? "Terlalu banyak percobaan masuk. Coba lagi sekitar 15 menit lagi."
      : "Terlalu banyak percobaan daftar. Coba lagi sekitar 1 jam lagi.";
  }
  if (status >= 400 && status < 500) return "Ada isian yang belum benar. Cek lagi lalu kirim ulang.";
  if (status >= 500) return "Server sedang bermasalah. Coba lagi sebentar lagi.";
  return "Terjadi kesalahan. Coba lagi sebentar lagi.";
}
