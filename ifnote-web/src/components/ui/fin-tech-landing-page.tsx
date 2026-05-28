"use client";

import React, { ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, ArrowUpRight, BookOpen, Flame } from "lucide-react";
import { APP_NAME, ROUTES } from "@/lib/constants";

/** ifNote landing page — calm Japanese-notebook aesthetic. */

interface StatProps {
  label: string;
  value: string;
  /** Optional ruby/furigana-style overline for Japanese flavour. */
  hint?: string;
}

const Stat = ({ label, value, hint }: StatProps) => (
  <div className="space-y-1">
    {hint ? (
      <div className="font-jp text-xs tracking-wide text-accent-500">{hint}</div>
    ) : null}
    <div className="text-3xl font-semibold tracking-tight text-ink-800 dark:text-paper-50">
      {value}
    </div>
    <div className="text-sm text-ink-400">{label}</div>
  </div>
);

interface SoftButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

const SoftButton = ({ children, className = "", ...props }: SoftButtonProps) => (
  <button
    className={
      "inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-medium shadow-notebook transition focus:outline-none focus:ring-2 focus:ring-offset-2 " +
      "bg-accent-500 text-white hover:bg-accent-600 focus:ring-accent-400 focus:ring-offset-paper-50 dark:focus:ring-offset-paper-900 " +
      className
    }
    {...props}
  >
    {children}
  </button>
);

/** 4-bar growth chart — represents daily hafalan streak. */
function MiniBars() {
  const bars = [
    { h: 28, label: "Sen" },
    { h: 56, label: "Sel" },
    { h: 80, label: "Rab" },
    { h: 104, label: "Kam" },
  ];
  return (
    <div className="mt-6 rounded-xl bg-gradient-to-b from-accent-50 to-white p-4 dark:from-ink-700 dark:to-ink-800">
      <div className="flex h-32 items-end gap-3">
        {bars.map((b, i) => (
          <motion.div
            key={b.label}
            initial={{ height: 0, opacity: 0.6 }}
            animate={{ height: b.h }}
            transition={{ delay: 0.5 + i * 0.15, type: "spring" }}
            className="flex-1 rounded-xl bg-gradient-to-t from-accent-200 to-accent-500 shadow-inner"
          />
        ))}
      </div>
      <div className="mt-2 flex gap-3">
        {bars.map((b) => (
          <div key={b.label} className="flex-1 text-center text-[10px] uppercase tracking-wider text-ink-400">
            {b.label}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Decorative ring of orbiting kana — replaces fintech "planet". */
function KanaOrbit() {
  const items = ["あ", "ア", "漢", "ka", "の"];
  return (
    <motion.div
      initial={{ rotate: -8, opacity: 0 }}
      animate={{ rotate: 0, opacity: 1 }}
      transition={{ duration: 1.2, type: "spring" }}
      className="relative h-[220px] w-[220px]"
      aria-hidden
    >
      <svg width="220" height="220" viewBox="0 0 220 220" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="ifnote-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#b794e8" />
            <stop offset="100%" stopColor="#7c8cf0" />
          </linearGradient>
        </defs>
        <circle cx="110" cy="110" r="56" fill="url(#ifnote-grad)" opacity="0.95" />
        <circle cx="94" cy="98" r="10" fill="white" opacity="0.45" />
        <circle cx="132" cy="126" r="8" fill="white" opacity="0.35" />
        <motion.ellipse
          cx="110"
          cy="110"
          rx="100"
          ry="34"
          stroke="white"
          strokeOpacity="0.6"
          fill="none"
          animate={{ strokeDashoffset: [200, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          strokeDasharray="200 200"
        />
      </svg>

      {/* Floating kana around the orb */}
      {items.map((char, i) => {
        const angle = (i / items.length) * 360;
        return (
          <motion.span
            key={char}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-jp text-base font-semibold text-white drop-shadow"
            style={{
              transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-90px) rotate(-${angle}deg)`,
            }}
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 3, repeat: Infinity, delay: i * 0.4 }}
          >
            {char}
          </motion.span>
        );
      })}
    </motion.div>
  );
}

export default function IfNoteLandingPage() {
  return (
    <div className="min-h-screen w-full bg-paper-50 dark:bg-paper-900">
      {/* Top nav */}
      <nav className="mx-auto flex w-full max-w-[1180px] items-center justify-between px-4 py-6 md:px-0">
        <Link href={ROUTES.landing} className="flex items-center gap-3">
          <span
            aria-hidden
            className="grid h-9 w-9 place-items-center rounded-lg bg-accent-500 font-jp text-lg text-white shadow-notebook"
          >
            ノ
          </span>
          <span className="text-xl font-semibold tracking-tight text-ink-800 dark:text-paper-50">
            {APP_NAME}
          </span>
        </Link>
        <div className="hidden items-center gap-8 md:flex">
          {[
            { label: "Catatan", href: "#fitur" },
            { label: "Hafalan", href: "#fitur" },
            { label: "Quiz", href: "#fitur" },
            { label: "AI Tutor", href: "#fitur" },
          ].map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-sm text-ink-400 transition hover:text-ink-800 dark:hover:text-paper-50"
            >
              {item.label}
            </a>
          ))}
        </div>
        <div className="hidden gap-2 md:flex">
          <Link
            href={ROUTES.login}
            className="rounded-full px-4 py-2 text-sm text-ink-700 transition hover:bg-white dark:text-paper-50 dark:hover:bg-ink-700"
          >
            Masuk
          </Link>
          <Link href={ROUTES.register}>
            <SoftButton>Daftar</SoftButton>
          </Link>
        </div>
      </nav>

      {/* Hero area */}
      <div
        id="fitur"
        className="mx-auto grid w-full max-w-[1180px] grid-cols-1 gap-6 px-4 pb-14 md:grid-cols-2 md:px-0"
      >
        {/* Left: headline */}
        <div className="flex flex-col justify-center space-y-8 pr-2">
          <div>
            <span className="font-jp text-sm tracking-widest text-accent-500">
              ノート・記憶・AI
            </span>
            <h1 className="mt-3 text-5xl font-semibold leading-[1.05] tracking-tight text-ink-800 dark:text-paper-50 md:text-6xl">
              Catat bahasa Jepang
              <br />
              dengan tenang.
            </h1>
            <p className="mt-4 max-w-md text-ink-400">
              Simpan kotoba dan bunpou, hafalkan dengan slide tetap 20 item, ujikan diri
              dengan quiz, dan minta bantuan{" "}
              <span className="font-medium text-ink-800 dark:text-paper-50">AI tutor</span>{" "}
              untuk fokus N5/N4.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Link href={ROUTES.register}>
              <SoftButton>
                Mulai gratis <ArrowUpRight className="h-4 w-4" />
              </SoftButton>
            </Link>
            <Link
              href={ROUTES.login}
              className="text-sm font-medium text-ink-700 underline-offset-4 hover:underline dark:text-paper-50"
            >
              Sudah punya akun
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-8 pt-2 md:max-w-sm">
            <Stat hint="単語" label="Kotoba & bunpou" value="1.000+" />
            <Stat hint="JLPT" label="Cakupan level" value="N5 → N4" />
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-3 opacity-80">
            <span className="text-xs tracking-widest text-ink-400">DIBANGUN UNTUK</span>
            <div className="flex flex-wrap items-center gap-3 text-ink-400">
              <span className="rounded-full bg-white px-3 py-1 text-xs font-medium ring-1 ring-paper-200 dark:bg-ink-700 dark:ring-ink-700">
                Pemula JLPT
              </span>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-medium ring-1 ring-paper-200 dark:bg-ink-700 dark:ring-ink-700">
                Pelajar otodidak
              </span>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-medium ring-1 ring-paper-200 dark:bg-ink-700 dark:ring-ink-700">
                Hafalan harian
              </span>
            </div>
          </div>
        </div>

        {/* Right: animated card grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* AI Tutor card (dark) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative col-span-1 overflow-hidden rounded-notebook bg-gradient-to-b from-accent-700 to-accent-600 p-6 text-paper-50 shadow-notebook-md"
          >
            <div className="absolute inset-0">
              <svg
                className="absolute inset-0 h-full w-full opacity-30"
                viewBox="0 0 400 400"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <radialGradient id="ifnote-rg" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#c7d2fe" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="transparent" />
                  </radialGradient>
                </defs>
                <rect width="400" height="400" fill="url(#ifnote-rg)" />
                {[...Array(12)].map((_, i) => (
                  <circle
                    key={i}
                    cx="200"
                    cy="200"
                    r={20 + i * 14}
                    fill="none"
                    stroke="currentColor"
                    strokeOpacity="0.12"
                  />
                ))}
              </svg>
            </div>

            <div className="relative flex h-full flex-col justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-white/15 p-2 ring-1 ring-white/20">
                  <Sparkles className="h-5 w-5" />
                </div>
                <span className="text-xs uppercase tracking-wider text-accent-200">
                  AI Tutor
                </span>
              </div>
              <div className="mt-6 text-xl leading-snug text-paper-50/95">
                Tanya partikel,
                <br /> contoh kalimat,
                <br /> dan analisis bunpou
              </div>
              <motion.div
                className="absolute right-6 top-6 h-12 w-12 rounded-full bg-lilac-400/40"
                animate={{
                  boxShadow: [
                    "0 0 0 0 rgba(183,148,232,0.45)",
                    "0 0 0 16px rgba(183,148,232,0)",
                  ],
                }}
                transition={{ duration: 2.5, repeat: Infinity }}
              />
            </div>
          </motion.div>

          {/* Kotoba & Kanji card (gradient) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative col-span-1 overflow-hidden rounded-notebook bg-gradient-to-b from-lilac-400 to-accent-500 p-6 text-white shadow-notebook-md"
          >
            <div className="pointer-events-none absolute -right-8 -top-10 opacity-80">
              <KanaOrbit />
            </div>
            <div className="relative mt-24 text-sm text-white/90">Kotoba &amp; Kanji</div>
            <div className="text-xl font-medium leading-snug">
              Ribuan kosakata
              <br /> dalam satu catatan
            </div>
          </motion.div>

          {/* Streak hafalan card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="col-span-1 rounded-notebook bg-white p-6 text-ink-800 shadow-notebook-md ring-1 ring-paper-200 dark:bg-ink-800 dark:text-paper-50 dark:ring-ink-700"
          >
            <div className="flex items-center justify-between">
              <div className="text-sm text-ink-400">Streak hafalan</div>
              <Flame className="h-4 w-4 text-leaf-500" />
            </div>
            <div className="mt-2 text-3xl font-semibold tracking-tight">
              7 hari{" "}
              <span className="align-middle text-sm font-medium text-ink-400">berturut</span>
            </div>
            <div className="mt-1 text-xs text-leaf-500">↑ 20 kotoba/hari</div>
            <MiniBars />
          </motion.div>

          {/* Catatan tip card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="col-span-1 hidden rounded-notebook bg-paper-100 p-6 text-ink-700 shadow-notebook ring-1 ring-paper-200 dark:bg-ink-700 dark:text-paper-50 dark:ring-ink-700 md:block"
          >
            <BookOpen className="h-5 w-5 text-accent-500" />
            <div className="mt-3 text-sm text-ink-400">Slide tetap 20 item</div>
            <div className="mt-1 text-base font-medium leading-snug">
              Hafalan terstruktur,
              <br /> bukan banjir flashcard.
            </div>
          </motion.div>
        </div>
      </div>

      <footer className="mx-auto w-full max-w-[1180px] px-4 pb-10 text-center text-xs text-ink-400 md:px-0">
        © {new Date().getFullYear()} {APP_NAME} — catatan tenang untuk belajar bahasa Jepang.
      </footer>
    </div>
  );
}
