"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  Sparkles,
  NotebookPen,
  Layers,
  Target,
  Bot,
  ArrowRight,
  Github,
  Twitter,
  Mail,
} from "lucide-react";
import { LinkButton } from "@/components/ui/LinkButton";
import { authClient } from "@/lib/auth-client";
import { ROUTES, APP_NAME } from "@/lib/constants";

/* ------------------------------------------------------------------ */
/* Data                                                                */
/* ------------------------------------------------------------------ */

const FEATURES = [
  {
    kana: "言",
    Icon: NotebookPen,
    title: "Catatan",
    desc: "Kotoba & bunpou jadi satu. Cari, filter level N5–N1, kelola contoh kalimat lengkap dengan reading.",
    tone: "accent" as const,
  },
  {
    kana: "記",
    Icon: Layers,
    title: "Hafalan",
    desc: "Slide tetap 20 item — mode kotoba/bunpou/mixed/weak, tandai mastery, latih kata yang masih lemah.",
    tone: "lilac" as const,
  },
  {
    kana: "試",
    Icon: Target,
    title: "Quiz",
    desc: "Empat tipe soal dari catatanmu sendiri. Progres tersimpan otomatis per tipe quiz.",
    tone: "leaf" as const,
  },
  {
    kana: "知",
    Icon: Bot,
    title: "AI Tutor",
    desc: "Jelaskan kotoba/bunpou, koreksi kalimat, buat contoh & bulk import — lewat proxy aman di server.",
    tone: "amber" as const,
  },
];

const JLPT = [
  { level: "N5", label: "Pemula", cls: "bg-leaf-50 text-leaf-700 ring-leaf-200 dark:bg-leaf-500/15 dark:text-leaf-300 dark:ring-leaf-400/30" },
  { level: "N4", label: "Dasar", cls: "bg-accent-50 text-accent-700 ring-accent-200 dark:bg-accent-500/15 dark:text-accent-200 dark:ring-accent-400/30" },
  { level: "N3", label: "Menengah", cls: "bg-lilac-50 text-lilac-700 ring-lilac-200 dark:bg-lilac-500/15 dark:text-lilac-300 dark:ring-lilac-400/30" },
  { level: "N2", label: "Mahir", cls: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-200 dark:ring-amber-400/30" },
  { level: "N1", label: "Ahli", cls: "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-500/15 dark:text-rose-200 dark:ring-rose-400/30" },
];

const STEPS = [
  { num: "一", title: "Catat", desc: "Tambah kotoba & bunpou, atau biarkan AI mengisi reading + contoh." },
  { num: "二", title: "Hafal", desc: "Susun jadi slide hafalan dan tandai mana yang sudah lancar." },
  { num: "三", title: "Uji", desc: "Latih lewat quiz otomatis dari catatanmu sampai melekat." },
];

const TONE_CHIP: Record<string, string> = {
  accent: "bg-accent-50 text-accent-600 ring-accent-200/70 dark:bg-accent-500/15 dark:text-accent-200 dark:ring-accent-400/25",
  lilac: "bg-lilac-50 text-lilac-600 ring-lilac-200/70 dark:bg-lilac-500/15 dark:text-lilac-300 dark:ring-lilac-400/25",
  leaf: "bg-leaf-50 text-leaf-600 ring-leaf-200/70 dark:bg-leaf-500/15 dark:text-leaf-300 dark:ring-leaf-400/25",
  amber: "bg-amber-50 text-amber-600 ring-amber-200/70 dark:bg-amber-500/15 dark:text-amber-200 dark:ring-amber-400/25",
};

/* ------------------------------------------------------------------ */
/* Screen                                                              */
/* ------------------------------------------------------------------ */

export function LandingScreen() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (authClient.hasToken()) {
      router.replace(ROUTES.app.home);
      return;
    }
    setChecking(false);
  }, [router]);

  if (checking) {
    return (
      <main className="grid min-h-screen place-items-center bg-paper-50 dark:bg-paper-900">
        <span
          className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-accent-400 border-t-transparent"
          aria-label="Memuat"
        />
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-paper-50 dark:bg-paper-900">
      <KanaBackdrop />

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col px-5 sm:px-8">
        {/* Top bar */}
        <header className="flex items-center justify-between py-6">
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden
              className="grid h-9 w-9 place-items-center rounded-2xl bg-accent-gradient font-jp text-lg text-white shadow-glow-sm"
            >
              ノ
            </span>
            <span className="text-lg font-semibold tracking-tight text-ink-800 dark:text-paper-50">
              {APP_NAME}
            </span>
          </div>
          <Link
            href={ROUTES.login}
            className="text-sm font-medium text-ink-600 underline-offset-4 transition-colors hover:text-accent-600 hover:underline dark:text-paper-50 dark:hover:text-accent-300"
          >
            Masuk
          </Link>
        </header>

        {/* Hero */}
        <Hero />

        {/* Steps */}
        <Steps />

        {/* Features */}
        <Features />

        {/* CTA band */}
        <CtaBand />

        {/* Footer */}
        <SiteFooter />
      </div>
    </main>
  );
}

/* ------------------------------------------------------------------ */
/* Hero                                                                */
/* ------------------------------------------------------------------ */

function Hero() {
  const ease = [0.22, 0.61, 0.36, 1] as const;
  return (
    <section className="flex flex-col items-center py-12 text-center sm:py-16">
      {/* Hanko seal eyebrow */}
      <motion.div
        initial={{ opacity: 0, y: -16, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease }}
        className="relative mb-7"
      >
        <span
          aria-hidden
          className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-rose-500 to-rose-700 font-jp text-3xl font-bold text-white shadow-[0_8px_24px_-6px_rgba(225,29,72,0.55)] ring-1 ring-rose-800/40"
        >
          学
        </span>
        <motion.span
          initial={{ scale: 0, rotate: -40 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.4, delay: 0.35, ease }}
          className="absolute -right-2 -top-2 text-amber-400"
          aria-hidden
        >
          <Sparkles className="h-5 w-5" />
        </motion.span>
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1, ease }}
        className="font-jp text-sm tracking-[0.35em] text-accent-500"
      >
        ノート・記憶・AI
      </motion.p>

      <motion.h1
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.18, ease }}
        className="mt-3 font-jp text-6xl font-bold leading-none text-gradient sm:text-7xl"
      >
        日本語
      </motion.h1>
      <motion.span
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.7, delay: 0.4, ease }}
        className="mt-4 h-1 w-28 origin-center rounded-full bg-gradient-to-r from-accent-400 via-rose-400 to-lilac-400"
      />

      <motion.h2
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.3, ease }}
        className="mt-6 max-w-2xl text-3xl font-semibold leading-tight tracking-tight text-ink-800 dark:text-paper-50 sm:text-4xl md:text-5xl"
      >
        Belajar bahasa Jepang dengan tenang
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.4, ease }}
        className="mt-4 max-w-xl text-base leading-relaxed text-ink-400 sm:text-lg"
      >
        Catatan kotoba &amp; bunpou, hafalan terstruktur, quiz, dan AI tutor
        dalam satu tempat. Dirancang untuk pelajar Indonesia level N5–N1.
      </motion.p>

      {/* JLPT chips */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5, ease }}
        className="mt-7 flex flex-wrap items-center justify-center gap-2"
      >
        {JLPT.map((j, i) => (
          <motion.span
            key={j.level}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.55 + i * 0.07, ease }}
            whileHover={{ y: -2 }}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${j.cls}`}
          >
            {j.level}
            <span className="font-normal opacity-70">· {j.label}</span>
          </motion.span>
        ))}
      </motion.div>

      {/* CTAs */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.65, ease }}
        className="mt-9 flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row"
      >
        <LinkButton href={ROUTES.register} size="lg" className="w-full gap-2 sm:w-auto">
          Mulai gratis
          <ArrowRight className="h-4 w-4" />
        </LinkButton>
        <LinkButton
          href={ROUTES.login}
          size="lg"
          variant="secondary"
          className="w-full sm:w-auto"
        >
          Sudah punya akun
        </LinkButton>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.85 }}
        className="mt-6 text-xs text-ink-400"
      >
        Gratis · Tanpa kartu kredit · Data tersimpan aman per akun
      </motion.p>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Steps                                                               */
/* ------------------------------------------------------------------ */

function Steps() {
  return (
    <section aria-label="Cara kerja" className="pb-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {STEPS.map((s, i) => (
          <motion.div
            key={s.num}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: i * 0.1, ease: [0.22, 0.61, 0.36, 1] }}
            className="flex items-start gap-3 rounded-notebook border border-paper-200/80 bg-white/70 p-4 backdrop-blur-sm dark:border-ink-700 dark:bg-ink-800/70"
          >
            <span
              aria-hidden
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-gradient-soft font-jp text-lg font-bold text-accent-600 ring-1 ring-inset ring-accent-200/60 dark:bg-accent-500/10 dark:text-accent-200 dark:ring-accent-400/20"
            >
              {s.num}
            </span>
            <div>
              <h3 className="text-sm font-semibold text-ink-800 dark:text-paper-50">{s.title}</h3>
              <p className="mt-0.5 text-xs leading-relaxed text-ink-400">{s.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Features                                                            */
/* ------------------------------------------------------------------ */

function Features() {
  return (
    <section aria-label="Fitur ifNote" className="py-14">
      <div className="mb-8 text-center">
        <p className="font-jp text-xs tracking-[0.3em] text-accent-500">機能</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink-800 dark:text-paper-50">
          Semua yang kamu butuhkan untuk belajar
        </h2>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f, i) => (
          <motion.article
            key={f.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: i * 0.08, ease: [0.22, 0.61, 0.36, 1] }}
            whileHover={{ y: -4 }}
            className="group relative overflow-hidden rounded-notebook border border-paper-200/80 bg-white p-5 shadow-notebook transition-shadow hover:shadow-notebook-md dark:border-ink-700 dark:bg-ink-800"
          >
            <span
              aria-hidden
              className="pointer-events-none absolute -right-4 -top-3 font-jp text-7xl text-ink-800/[0.04] transition-transform duration-300 group-hover:scale-110 dark:text-paper-50/[0.04]"
            >
              {f.kana}
            </span>
            <span
              className={`relative grid h-11 w-11 place-items-center rounded-xl ring-1 ring-inset ${TONE_CHIP[f.tone]}`}
            >
              <f.Icon className="h-5 w-5" />
            </span>
            <h3 className="relative mt-4 text-base font-semibold text-ink-800 dark:text-paper-50">
              {f.title}
            </h3>
            <p className="relative mt-1 text-sm leading-relaxed text-ink-400">{f.desc}</p>
          </motion.article>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* CTA band                                                            */
/* ------------------------------------------------------------------ */

function CtaBand() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, ease: [0.22, 0.61, 0.36, 1] }}
      className="relative my-6 overflow-hidden rounded-notebook-lg bg-accent-gradient px-6 py-12 text-center shadow-glow sm:px-10"
    >
      <span aria-hidden className="pointer-events-none absolute -left-4 -top-6 font-jp text-[120px] leading-none text-white/10">
        始
      </span>
      <span aria-hidden className="pointer-events-none absolute -bottom-10 -right-2 font-jp text-[120px] leading-none text-white/10">
        め
      </span>
      <h2 className="relative text-2xl font-semibold tracking-tight text-white sm:text-3xl">
        Mulai catatan Jepangmu hari ini
      </h2>
      <p className="relative mx-auto mt-2 max-w-md text-sm text-white/85">
        Buat akun gratis dalam hitungan detik dan rasakan belajar yang tenang &amp; terstruktur.
      </p>
      <div className="relative mt-6 flex justify-center">
        <LinkButton
          href={ROUTES.register}
          size="lg"
          variant="secondary"
          className="gap-2 bg-white text-accent-700 ring-0 hover:bg-paper-100"
        >
          Buat akun gratis
          <ArrowRight className="h-4 w-4" />
        </LinkButton>
      </div>
    </motion.section>
  );
}

/* ------------------------------------------------------------------ */
/* Footer                                                              */
/* ------------------------------------------------------------------ */

const FOOTER_COLS = [
  {
    title: "Produk",
    links: [
      { text: "Catatan", href: ROUTES.login },
      { text: "Hafalan", href: ROUTES.login },
      { text: "Quiz", href: ROUTES.login },
      { text: "AI Tutor", href: ROUTES.login },
    ],
  },
  {
    title: "Belajar",
    links: [
      { text: "JLPT N5–N1", href: ROUTES.register },
      { text: "Kotoba", href: ROUTES.register },
      { text: "Bunpou", href: ROUTES.register },
      { text: "Kanji", href: ROUTES.register },
    ],
  },
  {
    title: "Lainnya",
    links: [
      { text: "Masuk", href: ROUTES.login },
      { text: "Daftar", href: ROUTES.register },
      { text: "Lupa password", href: ROUTES.forgotPassword },
    ],
  },
];

function SiteFooter() {
  return (
    <footer className="mt-6 border-t border-paper-200/80 pt-12 dark:border-ink-700">
      <div className="grid grid-cols-2 gap-8 lg:grid-cols-5">
        <div className="col-span-2 lg:col-span-2">
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden
              className="grid h-9 w-9 place-items-center rounded-2xl bg-accent-gradient font-jp text-lg text-white shadow-glow-sm"
            >
              ノ
            </span>
            <span className="text-lg font-semibold tracking-tight text-ink-800 dark:text-paper-50">
              {APP_NAME}
            </span>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-400">
            <span className="font-jp">静かに学ぶ</span> — catat bahasa Jepang dengan
            tenang. Kotoba, bunpou, hafalan, quiz, dan AI tutor untuk pelajar
            Indonesia.
          </p>
          <div className="mt-5 flex items-center gap-2">
            {[
              { Icon: Github, label: "GitHub" },
              { Icon: Twitter, label: "Twitter" },
              { Icon: Mail, label: "Email" },
            ].map(({ Icon, label }) => (
              <a
                key={label}
                href="#"
                aria-label={label}
                className="grid h-9 w-9 place-items-center rounded-full text-ink-400 ring-1 ring-inset ring-paper-300 transition-colors hover:bg-paper-100 hover:text-accent-600 dark:ring-ink-700 dark:hover:bg-ink-700 dark:hover:text-accent-300"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        {FOOTER_COLS.map((col) => (
          <div key={col.title}>
            <h3 className="text-sm font-semibold text-ink-800 dark:text-paper-50">{col.title}</h3>
            <ul className="mt-4 space-y-3 text-sm">
              {col.links.map((l) => (
                <li key={l.text}>
                  <Link
                    href={l.href}
                    className="text-ink-400 transition-colors hover:text-accent-600 dark:hover:text-accent-300"
                  >
                    {l.text}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-paper-200/80 py-6 text-xs text-ink-400 dark:border-ink-700 sm:flex-row">
        <p>
          © {new Date().getFullYear()} {APP_NAME} · Japanese Notes with AI
        </p>
        <p className="font-jp tracking-widest text-ink-400/80">
          ことば · ぶんぽう · あんき
        </p>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------ */
/* Animated kana backdrop                                              */
/* ------------------------------------------------------------------ */

function KanaBackdrop() {
  const reduce = useReducedMotion();
  const items: {
    c: string;
    top?: string;
    left?: string;
    right?: string;
    bottom?: string;
    size: string;
    cls: string;
    dur: number;
  }[] = [
    { c: "あ", top: "12%", left: "5%", size: "150px", cls: "text-accent-500/[0.06] dark:text-accent-200/[0.05]", dur: 9 },
    { c: "ア", top: "8%", right: "7%", size: "120px", cls: "text-lilac-500/[0.07] dark:text-lilac-400/[0.06]", dur: 11 },
    { c: "漢", bottom: "22%", left: "8%", size: "170px", cls: "text-leaf-500/[0.06] dark:text-leaf-500/[0.05]", dur: 12 },
    { c: "の", bottom: "30%", right: "6%", size: "120px", cls: "text-accent-500/[0.06] dark:text-accent-200/[0.05]", dur: 10 },
    { c: "字", top: "46%", left: "46%", size: "140px", cls: "text-rose-500/[0.05] dark:text-rose-400/[0.05]", dur: 13 },
  ];
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 hidden select-none overflow-hidden sm:block">
      {/* soft accent glow */}
      <div className="absolute left-1/2 top-[-10%] h-[420px] w-[640px] -translate-x-1/2 rounded-full bg-accent-300/20 blur-[120px] dark:bg-accent-500/10" />
      {items.map((it, i) => (
        <motion.span
          key={i}
          className={`absolute font-jp leading-none ${it.cls}`}
          style={{
            top: it.top,
            left: it.left,
            right: it.right,
            bottom: it.bottom,
            fontSize: it.size,
          }}
          animate={reduce ? undefined : { y: [0, -14, 0] }}
          transition={{ duration: it.dur, repeat: Infinity, ease: "easeInOut" }}
        >
          {it.c}
        </motion.span>
      ))}
    </div>
  );
}
