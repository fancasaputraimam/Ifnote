import type { Metadata, Viewport } from "next";
import { Zen_Kaku_Gothic_New, Zen_Old_Mincho } from "next/font/google";
import "@/styles/globals.css";
import { Providers } from "@/components/layout/Providers";

// Font di-host sendiri oleh Next (diunduh saat build): tidak ada CSS Google Fonts
// yang menahan render, dan browser pengunjung tidak menghubungi Google.
const zenSans = Zen_Kaku_Gothic_New({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-zen-sans",
});
const zenSerif = Zen_Old_Mincho({
  weight: ["400", "600", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-zen-serif",
});

const SITE_URL = "https://ifnote.app";
const TITLE = "ifNote: buku catatan bahasa Jepang yang bisa menguji kamu";
const DESCRIPTION =
  "Catat kotoba dan bunpou, hafalkan lewat slide, uji lewat quiz, dan tanya AI tutor kalau bingung. Untuk orang Indonesia yang belajar bahasa Jepang.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "ifNote: Belajar Bahasa Jepang",
  description:
    "ifNote: buku catatan bahasa Jepang dengan hafalan, quiz, dan AI tutor. Ada mode terang dan gelap.",
  applicationName: "ifNote",
  authors: [{ name: "Imam Fanca Saputra" }],
  keywords: ["bahasa jepang", "kotoba", "bunpou", "JLPT", "N5", "N4", "hafalan"],
  openGraph: {
    type: "website",
    siteName: "ifNote",
    locale: "id_ID",
    url: SITE_URL,
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: "/og.png", width: 1200, height: 630, alt: TITLE }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fdfdfc" },
    { media: "(prefers-color-scheme: dark)", color: "#0f0e0d" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning className={`${zenSans.variable} ${zenSerif.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
