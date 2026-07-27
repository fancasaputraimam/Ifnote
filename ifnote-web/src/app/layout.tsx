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
    { media: "(prefers-color-scheme: light)", color: "#fdfdfc" },
    { media: "(prefers-color-scheme: dark)",  color: "#0f0e0d" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+New:wght@400;500;700&family=Zen+Old+Mincho:wght@400;600;700&display=swap"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
