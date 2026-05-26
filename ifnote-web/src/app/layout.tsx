import type { Metadata, Viewport } from "next";
import "@/styles/globals.css";
import { Providers } from "@/components/layout/Providers";

export const metadata: Metadata = {
  title: "ifNote — Belajar Bahasa Jepang",
  description:
    "ifNote: catatan, hafalan, dan AI tutor untuk belajar bahasa Jepang dengan tenang. Mendukung mode terang dan gelap.",
  applicationName: "ifNote",
  authors: [{ name: "ifNote" }],
  keywords: ["bahasa jepang", "kotoba", "bunpou", "JLPT", "N5", "N4", "hafalan"],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fdfcf7" },
    { media: "(prefers-color-scheme: dark)",  color: "#15140f" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
