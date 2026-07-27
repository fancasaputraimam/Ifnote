/** @type {import('next').NextConfig} */

// Backend origin yang dituju oleh rewrite proxy.
// - Dev: backend NestJS (default http://localhost:3003).
// - Vercel: set API_PROXY_TARGET (atau NEXT_PUBLIC_API_BASE_URL) ke URL
//   backend Heroku. Browser tetap memanggil path relatif "/api/..." (same
//   origin), Next yang meneruskan ke backend — jadi httpOnly cookie dari
//   backend ter-set untuk origin frontend dan ikut terkirim balik.
//
// Catatan: di deploy VPS (Nginx) rewrite ini tidak terpakai karena Nginx
// sudah mem-proxy /api → backend sebelum mencapai Next. Aman: kalau target
// kebetulan menunjuk diri sendiri, Nginx yang menang.
const API_PROXY_TARGET = (
  process.env.API_PROXY_TARGET ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:3003"
).replace(/\/+$/, "");

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${API_PROXY_TARGET}/api/:path*` },
      { source: "/health", destination: `${API_PROXY_TARGET}/health` },
    ];
  },
};

module.exports = nextConfig;
