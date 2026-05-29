"use client";

import React, { ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Sparkles,
  ArrowUpRight,
  BookOpen,
  Layers,
  Target,
  PenLine,
} from "lucide-react";
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
            { label: "Cara kerja", href: "#cara-kerja" },
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
              ノート・きおく・AI
            </span>
            <h1 className="mt-3 text-5xl font-semibold leading-[1.05] tracking-tight text-ink-800 dark:text-paper-50 md:text-6xl">
              Catat bahasa Jepang
              <br />
              dengan tenang.
            </h1>
            <p className="mt-4 max-w-md text-ink-400">
              Simpan kotoba dan bunpou dengan rapi, hafalkan pelan-pelan, lalu
              cek pemahamanmu lewat quiz.
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
            <Stat hint="JLPT" label="Cakupan level" value="N5 → N1" />
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-3 opacity-80">
            <span className="text-xs tracking-widest text-ink-400">DIBANGUN UNTUK</span>
            <div className="flex flex-wrap items-center gap-3 text-ink-400">
              <span className="rounded-full bg-white px-3 py-1 text-xs font-medium ring-1 ring-paper-200 dark:bg-ink-700 dark:ring-ink-700">
                Pelajar JLPT
              </span>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-medium ring-1 ring-paper-200 dark:bg-ink-700 dark:ring-ink-700">
                Belajar otodidak
              </span>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-medium ring-1 ring-paper-200 dark:bg-ink-700 dark:ring-ink-700">
                Catatan harian
              </span>
            </div>
          </div>
        </div>

        {/* Right: animated card grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Bantuan AI card (dark) */}
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
                  Bantuan AI
                </span>
              </div>
              <div className="mt-6 text-xl leading-snug text-paper-50/95">
                Bantu pahami
                <br /> kotoba dan bunpou
                <br /> sebelum disimpan.
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

          {/* Catatan Kotoba & Bunpou card (gradient) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative col-span-1 overflow-hidden rounded-notebook bg-gradient-to-b from-lilac-400 to-accent-500 p-6 text-white shadow-notebook-md"
          >
            <div className="pointer-events-none absolute -right-8 -top-10 opacity-80">
              <KanaOrbit />
            </div>
            <div className="relative mt-24 text-sm text-white/90">
              Catatan Kotoba &amp; Bunpou
            </div>
            <div className="text-xl font-medium leading-snug">
              Simpan kotoba dan bunpou
              <br /> dalam satu tempat.
            </div>
          </motion.div>

          {/* Hafalan card — uses the streak-card visual template, no chart inside */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="col-span-1 rounded-notebook bg-white p-6 text-ink-800 shadow-notebook-md ring-1 ring-paper-200 dark:bg-ink-800 dark:text-paper-50 dark:ring-ink-700"
          >
            <div className="flex items-center justify-between">
              <div className="text-sm text-ink-400">Hafalan</div>
              <Layers className="h-4 w-4 text-leaf-500" />
            </div>
            <div className="mt-2 text-2xl font-semibold tracking-tight">
              Slide tetap{" "}
              <span className="align-middle text-sm font-medium text-ink-400">
                20 item
              </span>
            </div>
            <p className="mt-2 text-sm text-ink-400">
              Ulangi materimu dengan urutan tetap, supaya lebih mudah diingat.
            </p>
            <div className="mt-5 flex items-center gap-2 rounded-xl bg-paper-100 px-3 py-2 text-xs text-ink-700 dark:bg-ink-700 dark:text-paper-50">
              <BookOpen className="h-4 w-4 text-accent-500" />
              <span>Kotoba &amp; bunpou tampil berdampingan.</span>
            </div>
          </motion.div>

          {/* Quiz card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="col-span-1 hidden rounded-notebook bg-paper-100 p-6 text-ink-700 shadow-notebook ring-1 ring-paper-200 dark:bg-ink-700 dark:text-paper-50 dark:ring-ink-700 md:block"
          >
            <Target className="h-5 w-5 text-accent-500" />
            <div className="mt-3 text-sm text-ink-400">Quiz dari catatanmu</div>
            <div className="mt-1 text-base font-medium leading-snug">
              Cek pemahamanmu lewat
              <br /> latihan singkat.
            </div>
          </motion.div>
        </div>
      </div>

      {/* Cara kerja — simple 3-step section to balance layout after streak removal */}
      <section
        id="cara-kerja"
        className="mx-auto w-full max-w-[1180px] px-4 pb-16 md:px-0"
      >
        <div className="mb-6 flex items-baseline justify-between">
          <h2 className="text-2xl font-semibold tracking-tight text-ink-800 dark:text-paper-50">
            Cara kerja ifNote
          </h2>
          <span className="hidden text-sm text-ink-400 md:block">
            Tiga langkah saja.
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StepCard
            stepNumber="01"
            icon={<PenLine className="h-4 w-4" aria-hidden />}
            title="Catat"
            body="Simpan kotoba dan bunpou yang kamu temui hari ini di satu tempat yang rapi."
          />
          <StepCard
            stepNumber="02"
            icon={<Layers className="h-4 w-4" aria-hidden />}
            title="Hafalkan"
            body="Ulangi catatanmu lewat slide tetap, sedikit demi sedikit, tanpa terburu-buru."
          />
          <StepCard
            stepNumber="03"
            icon={<Target className="h-4 w-4" aria-hidden />}
            title="Cek lewat quiz"
            body="Latihan singkat dari catatan sendiri untuk memastikan kamu benar-benar paham."
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-paper-200 bg-paper-50/60 dark:border-ink-700 dark:bg-paper-900">
        <div className="mx-auto w-full max-w-[1180px] px-4 py-10 md:px-0">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {/* Brand block */}
            <div className="col-span-2">
              <div className="flex items-center gap-3">
                <span
                  aria-hidden
                  className="grid h-8 w-8 place-items-center rounded-lg bg-accent-500 font-jp text-base text-white shadow-notebook"
                >
                  ノ
                </span>
                <span className="text-base font-semibold tracking-tight text-ink-800 dark:text-paper-50">
                  {APP_NAME}
                </span>
              </div>
              <p className="mt-3 max-w-xs text-sm text-ink-400">
                Catatan tenang untuk belajar bahasa Jepang.
              </p>
            </div>

            <FooterCol title="Aplikasi">
              <FooterLink href="#fitur">Fitur</FooterLink>
              <FooterLink href="#cara-kerja">Cara kerja</FooterLink>
              <FooterLink href={ROUTES.login}>Masuk</FooterLink>
              <FooterLink href={ROUTES.register}>Daftar</FooterLink>
            </FooterCol>

            <FooterCol title="Belajar">
              <FooterLink href={ROUTES.register}>Kotoba</FooterLink>
              <FooterLink href={ROUTES.register}>Bunpou</FooterLink>
              <FooterLink href={ROUTES.register}>Hafalan</FooterLink>
              <FooterLink href={ROUTES.register}>Quiz</FooterLink>
            </FooterCol>
          </div>

          <div className="mt-10 flex flex-col gap-2 border-t border-paper-200 pt-6 text-xs text-ink-400 dark:border-ink-700 sm:flex-row sm:items-center sm:justify-between">
            <span>
              © {new Date().getFullYear()} {APP_NAME} — dibuat untuk belajar
              Jepang dengan lebih rapi.
            </span>
            <span className="font-jp tracking-widest text-ink-400/80">
              ノート・きおく・AI
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ----------------------------- helpers ----------------------------- */

function StepCard({
  stepNumber,
  icon,
  title,
  body,
}: {
  stepNumber: string;
  icon: ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-notebook bg-white p-6 shadow-notebook ring-1 ring-paper-200 dark:bg-ink-800 dark:ring-ink-700">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-accent-500">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-accent-50 text-accent-600 dark:bg-accent-700/20 dark:text-accent-300">
          {icon}
        </span>
        <span>Langkah {stepNumber}</span>
      </div>
      <h3 className="mt-3 text-lg font-semibold tracking-tight text-ink-800 dark:text-paper-50">
        {title}
      </h3>
      <p className="mt-1 text-sm text-ink-400">{body}</p>
    </div>
  );
}

function FooterCol({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wider text-ink-700 dark:text-paper-50">
        {title}
      </div>
      <ul className="mt-3 space-y-2 text-sm">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: ReactNode }) {
  const isAnchor = href.startsWith("#");
  if (isAnchor) {
    return (
      <li>
        <a
          href={href}
          className="text-ink-400 transition hover:text-ink-800 dark:hover:text-paper-50"
        >
          {children}
        </a>
      </li>
    );
  }
  return (
    <li>
      <Link
        href={href}
        className="text-ink-400 transition hover:text-ink-800 dark:hover:text-paper-50"
      >
        {children}
      </Link>
    </li>
  );
}
