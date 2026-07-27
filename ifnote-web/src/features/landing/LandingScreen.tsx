"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  NotebookPen,
  Layers,
  Target,
  Bot,
  ArrowRight,
  Check,
  RotateCcw,
  Github,
  Twitter,
  Mail,
} from "lucide-react";
import { LinkButton } from "@/components/ui/LinkButton";
import {
  BrushStroke,
  fetchKanjiVgPaths,
  STROKE_VIEWBOX,
} from "@/components/japanese/KanjiStrokeKit";
import { authClient } from "@/lib/auth-client";
import { ROUTES, APP_NAME } from "@/lib/constants";

const EASE = [0.22, 0.61, 0.36, 1] as const;

/* ------------------------------------------------------------------ */
/* Data                                                                */
/* ------------------------------------------------------------------ */

const JLPT = [
  { level: "N5", label: "Pemula", cls: "bg-leaf-50 text-leaf-700 ring-leaf-200 dark:bg-leaf-500/15 dark:text-leaf-300 dark:ring-leaf-400/30" },
  { level: "N4", label: "Dasar", cls: "bg-accent-50 text-accent-700 ring-accent-200 dark:bg-accent-500/15 dark:text-accent-200 dark:ring-accent-400/30" },
  { level: "N3", label: "Menengah", cls: "bg-lilac-50 text-lilac-700 ring-lilac-200 dark:bg-lilac-500/15 dark:text-lilac-300 dark:ring-lilac-400/30" },
  { level: "N2", label: "Mahir", cls: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-200 dark:ring-amber-400/30" },
  { level: "N1", label: "Ahli", cls: "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-500/15 dark:text-rose-200 dark:ring-rose-400/30" },
];

const STEPS = [
  { num: "一", title: "Catat", desc: "Tambah kotoba & bunpou — atau biarkan AI mengisi reading dan contoh kalimatnya." },
  { num: "二", title: "Hafal", desc: "Susun jadi slide hafalan 20 item dan tandai mana yang sudah lancar." },
  { num: "三", title: "Uji", desc: "Latih lewat quiz yang dibuat otomatis dari catatanmu sampai melekat." },
];

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
      {/* red margin line — motif buku latihan, sama dengan halaman auth */}
      <div aria-hidden className="absolute inset-y-0 left-5 z-0 hidden w-px bg-accent-500/20 md:block" />
      <div aria-hidden className="absolute inset-y-0 left-[23px] z-0 hidden w-px bg-accent-500/[0.08] md:block" />
      <KanaBackdrop />

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col px-5 sm:px-8">
        <Header />
        <Hero />
        <Steps />
        <Features />
        <ZenStrip />
        <CtaBand />
        <SiteFooter />
      </div>
    </main>
  );
}

/* ------------------------------------------------------------------ */
/* Header                                                              */
/* ------------------------------------------------------------------ */

function Header() {
  return (
    <header className="flex items-center justify-between py-6">
      <div className="flex items-center gap-2.5">
        <span
          aria-hidden
          className="grid h-9 w-9 -rotate-3 place-items-center rounded-[10px] bg-accent-gradient font-serif text-lg text-white shadow-glow-sm"
        >
          ノ
        </span>
        <span className="font-serif text-lg font-semibold tracking-tight text-ink-800 dark:text-paper-50">
          {APP_NAME}
        </span>
      </div>
      <nav className="flex items-center gap-4">
        <Link
          href={ROUTES.login}
          className="text-sm font-medium text-ink-600 underline-offset-4 transition-colors hover:text-accent-600 hover:underline dark:text-paper-50 dark:hover:text-accent-300"
        >
          Masuk
        </Link>
        <LinkButton href={ROUTES.register} size="sm" className="hidden sm:inline-flex">
          Mulai gratis
        </LinkButton>
      </nav>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* Hero — asymmetric: copy kiri, tumpukan kartu catatan kanan          */
/* ------------------------------------------------------------------ */

function Hero() {
  return (
    <section className="grid items-center gap-12 py-10 sm:py-14 lg:grid-cols-[1.02fr_0.98fr] lg:py-20">
      {/* Copy */}
      <div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="flex items-center gap-2"
        >
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-accent-500" />
          <span className="font-jp text-xs tracking-[0.3em] text-accent-600 dark:text-accent-400">
            ノート・記憶・AI
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.1, ease: EASE }}
          className="mt-4 font-serif text-4xl font-bold leading-[1.12] tracking-tight text-ink-800 dark:text-paper-50 sm:text-5xl lg:text-[3.4rem]"
        >
          Catat. Hafal.
          <br />
          Kuasai <span className="text-gradient font-jp font-bold">日本語</span>.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.22, ease: EASE }}
          className="mt-5 max-w-lg text-base leading-relaxed text-ink-400 sm:text-lg"
        >
          Catatan kotoba &amp; bunpou, hafalan terstruktur, quiz, dan AI tutor —
          semuanya di satu buku catatan yang tenang. Dirancang untuk pelajar
          Indonesia level N5–N1.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.34, ease: EASE }}
          className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
        >
          <LinkButton href={ROUTES.register} size="lg" className="gap-2">
            Mulai gratis
            <ArrowRight className="h-4 w-4" />
          </LinkButton>
          <LinkButton href={ROUTES.login} size="lg" variant="secondary">
            Sudah punya akun
          </LinkButton>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="mt-4 text-xs text-ink-400"
        >
          Gratis · Tanpa kartu kredit · Data tersimpan aman per akun
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.55, ease: EASE }}
          className="mt-7 flex flex-wrap items-center gap-2"
        >
          {JLPT.map((j) => (
            <span
              key={j.level}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${j.cls}`}
            >
              {j.level}
              <span className="font-normal opacity-70">· {j.label}</span>
            </span>
          ))}
        </motion.div>
      </div>

      {/* Visual — lembar kaligrafi: 日本語 ditulis goresan demi goresan */}
      <ShodoSheet />
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Hero visual — lembar shodō: 日本語 ditulis goresan demi goresan      */
/* (data KanjiVG, komponen bersama dengan dialog klik-kanji)            */
/* ------------------------------------------------------------------ */

const HERO_CHARS = ["日", "本", "語"] as const;
const HERO_STROKE_SEC = 0.4;
const HERO_GAP_SEC = 0.12;

function ShodoSheet() {
  const reduce = useReducedMotion();
  const [chars, setChars] = useState<string[][] | null>(null);
  const [failed, setFailed] = useState(false);
  /** Jumlah goresan global (lintas 3 karakter) yang sudah digambar. */
  const [drawn, setDrawn] = useState(0);
  const [playKey, setPlayKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    Promise.all(HERO_CHARS.map((c) => fetchKanjiVgPaths(c)))
      .then((all) => {
        if (!cancelled) setChars(all);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const total = chars?.reduce((s, c) => s + c.length, 0) ?? 0;

  // Stepper goresan + loop: selesai menulis → jeda → tulis ulang.
  useEffect(() => {
    setDrawn(0);
    if (!chars || total === 0) return;
    const stepMs = (HERO_STROKE_SEC + HERO_GAP_SEC) * 1000;
    const kick = setTimeout(() => setDrawn(1), 300);
    let i = 1;
    let loopT: ReturnType<typeof setTimeout> | null = null;
    const id = setInterval(() => {
      i += 1;
      setDrawn(Math.min(i, total));
      if (i >= total) {
        clearInterval(id);
        loopT = setTimeout(() => setPlayKey((k) => k + 1), 2400);
      }
    }, stepMs);
    return () => {
      clearTimeout(kick);
      clearInterval(id);
      if (loopT) clearTimeout(loopT);
    };
  }, [chars, total, playKey]);

  return (
    <div className="relative mx-auto hidden w-full max-w-md sm:block lg:max-w-none">
      {/* ensō behind */}
      <svg
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[480px] w-[480px] -translate-x-1/2 -translate-y-1/2"
        viewBox="0 0 200 200"
        fill="none"
      >
        <motion.circle
          cx="100"
          cy="100"
          r="88"
          stroke="currentColor"
          className="text-ink-800/[0.06] dark:text-paper-50/[0.06]"
          strokeWidth="7"
          strokeLinecap="round"
          transform="rotate(-96 100 100)"
          initial={reduce ? { pathLength: 0.93 } : { pathLength: 0 }}
          whileInView={{ pathLength: 0.93 }}
          viewport={{ once: true }}
          transition={{ duration: 1.5, ease: EASE, delay: 0.3 }}
        />
      </svg>

      {/* tategaki di sisi kanan */}
      <motion.p
        aria-hidden
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.6, ease: EASE }}
        className="absolute -right-2 top-1/2 hidden -translate-y-1/2 font-jp text-lg tracking-[0.4em] text-ink-300 [writing-mode:vertical-rl] dark:text-ink-500 xl:block"
      >
        まいにち、すこしずつ。
      </motion.p>

      {/* lembar kaligrafi */}
      <motion.div
        initial={{ opacity: 0, y: 26 }}
        animate={{ opacity: 1, y: 0, rotate: -1 }}
        transition={{ duration: 0.65, delay: 0.2, ease: EASE }}
        className="notebook-rule relative rounded-notebook border border-paper-200 bg-white p-5 shadow-notebook-md dark:border-ink-700 dark:bg-ink-800"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden
              className="grid h-9 w-9 -rotate-3 place-items-center rounded-[9px] bg-accent-gradient font-serif text-base text-white shadow-glow-sm"
            >
              書
            </span>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-ink-700 dark:text-paper-100">
                Urutan goresan
              </div>
              <div className="font-jp text-[10px] tracking-[0.22em] text-ink-400">
                かきじゅん
              </div>
            </div>
          </div>
          {chars ? (
            <button
              type="button"
              onClick={() => setPlayKey((k) => k + 1)}
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium text-accent-600 transition-colors hover:bg-accent-50 dark:text-accent-300 dark:hover:bg-accent-500/10"
            >
              <RotateCcw className="h-3 w-3" aria-hidden /> Tulis ulang
            </button>
          ) : null}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {HERO_CHARS.map((ch, ci) => {
            const offset = chars
              ? chars.slice(0, ci).reduce((s, c) => s + c.length, 0)
              : 0;
            return (
              <div
                key={ch}
                className="rounded-xl bg-paper-50/70 p-1.5 ring-1 ring-inset ring-paper-200/70 dark:bg-ink-900/30 dark:ring-ink-700/60"
              >
                {failed || !chars ? (
                  <div
                    className={
                      failed
                        ? "grid aspect-square place-items-center font-jp text-5xl text-ink-800 dark:text-paper-50"
                        : "grid aspect-square animate-pulse place-items-center font-jp text-5xl text-ink-800/20 dark:text-paper-50/20"
                    }
                  >
                    {ch}
                  </div>
                ) : (
                  <svg viewBox={STROKE_VIEWBOX} className="aspect-square w-full" aria-hidden>
                    {/* garis bantu genkouyoushi */}
                    <g
                      className="stroke-paper-300/70 dark:stroke-ink-700"
                      strokeWidth="0.5"
                      strokeDasharray="3 3"
                    >
                      <line x1="54.5" y1="2" x2="54.5" y2="107" />
                      <line x1="2" y1="54.5" x2="107" y2="54.5" />
                    </g>
                    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
                      {chars[ci].map((d, i) => (
                        <path
                          key={`bg-${i}`}
                          d={d}
                          strokeWidth="4.5"
                          className="stroke-paper-300/80 dark:stroke-ink-600/60"
                        />
                      ))}
                      {chars[ci].map((d, i) => (
                        <BrushStroke
                          key={`${playKey}-${i}`}
                          d={d}
                          active={offset + i < drawn}
                          durationSec={HERO_STROKE_SEC}
                          strokeWidth={5.5}
                        />
                      ))}
                    </g>
                  </svg>
                )}
              </div>
            );
          })}
        </div>

        <p className="mt-3 text-xs leading-relaxed text-ink-400">
          Klik kanji mana pun di ifNote — urutan goresannya digambar seperti
          ini, lengkap dengan arti, onyomi, dan kunyomi.
        </p>
        <p aria-hidden className="mt-1 text-[9px] text-ink-400/50">
          urutan goresan © KanjiVG (CC BY-SA)
        </p>

        {/* hanko kecil di pojok */}
        <motion.span
          aria-hidden
          initial={{ opacity: 0, scale: 0.5, rotate: -18 }}
          animate={{ opacity: 1, scale: 1, rotate: -8 }}
          transition={{ duration: 0.45, delay: 0.9, ease: EASE }}
          className="absolute -right-3 -top-3 grid h-11 w-11 place-items-center rounded-[10px] bg-accent-gradient font-serif text-lg text-white shadow-glow-sm"
        >
          道
        </motion.span>
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Steps — timeline 一二三                                             */
/* ------------------------------------------------------------------ */

function Steps() {
  return (
    <section aria-label="Cara kerja" className="py-8">
      <div className="relative grid grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-4">
        {/* hairline penghubung */}
        <div
          aria-hidden
          className="absolute left-[10%] right-[10%] top-6 hidden border-t border-dashed border-paper-300 dark:border-ink-700 sm:block"
        />
        {STEPS.map((s, i) => (
          <motion.div
            key={s.num}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: i * 0.12, ease: EASE }}
            className="relative flex flex-col items-center text-center"
          >
            <span
              aria-hidden
              className="relative z-10 grid h-12 w-12 place-items-center rounded-full border border-accent-200/70 bg-white font-jp text-lg font-bold text-accent-600 shadow-notebook dark:border-accent-400/25 dark:bg-ink-800 dark:text-accent-300"
            >
              {s.num}
            </span>
            <h3 className="mt-3 font-serif text-lg font-semibold text-ink-800 dark:text-paper-50">
              {s.title}
            </h3>
            <p className="mt-1 max-w-[16rem] text-sm leading-relaxed text-ink-400">{s.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Features — bento grid dengan mock UI mini                           */
/* ------------------------------------------------------------------ */

function Features() {
  return (
    <section aria-label="Fitur ifNote" className="py-14">
      <div className="mb-9 text-center">
        <p className="font-jp text-xs tracking-[0.3em] text-accent-500">機能</p>
        <h2 className="mt-2 font-serif text-2xl font-semibold tracking-tight text-ink-800 dark:text-paper-50 sm:text-3xl">
          Semua yang kamu butuhkan untuk belajar
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-6">
        <FeatureCard
          className="lg:col-span-4"
          kana="言"
          Icon={NotebookPen}
          iconCls="bg-accent-50 text-accent-600 ring-accent-200/70 dark:bg-accent-500/15 dark:text-accent-200 dark:ring-accent-400/25"
          title="Catatan"
          desc="Kotoba & bunpou jadi satu buku. Cari, filter level N5–N1, kelola contoh kalimat lengkap dengan reading."
          delay={0}
        >
          <div className="mt-4 space-y-2">
            {[
              { jp: "水", yomi: "みず", id: "air", lv: "N5" },
              { jp: "図書館", yomi: "としょかん", id: "perpustakaan", lv: "N4" },
            ].map((r) => (
              <div
                key={r.jp}
                className="flex items-center justify-between rounded-xl border border-paper-200 bg-paper-50 px-3.5 py-2.5 dark:border-ink-700 dark:bg-ink-900/40"
              >
                <div className="flex items-baseline gap-2.5">
                  <span className="font-jp text-lg text-ink-800 dark:text-paper-50">{r.jp}</span>
                  <span className="font-jp text-xs text-ink-400">{r.yomi}</span>
                  <span className="text-xs text-ink-400">— {r.id}</span>
                </div>
                <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-ink-400 ring-1 ring-inset ring-paper-300 dark:bg-ink-800 dark:ring-ink-700">
                  {r.lv}
                </span>
              </div>
            ))}
          </div>
        </FeatureCard>

        <FeatureCard
          className="lg:col-span-2"
          kana="記"
          Icon={Layers}
          iconCls="bg-lilac-50 text-lilac-600 ring-lilac-200/70 dark:bg-lilac-500/15 dark:text-lilac-300 dark:ring-lilac-400/25"
          title="Hafalan"
          desc="Slide tetap 20 item — mode kotoba, bunpou, mixed, atau weak."
          delay={0.08}
        >
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-ink-400">
              <span>Slide hari ini</span>
              <span className="font-semibold text-ink-700 dark:text-paper-100">12/20</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-paper-100 dark:bg-ink-900/60">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: "60%" }}
                viewport={{ once: true }}
                transition={{ duration: 0.9, delay: 0.3, ease: EASE }}
                className="h-full rounded-full bg-lilac-500"
              />
            </div>
            <p className="mt-2 font-jp text-[10px] tracking-[0.2em] text-ink-400/70">あんき中…</p>
          </div>
        </FeatureCard>

        <FeatureCard
          className="lg:col-span-2"
          kana="試"
          Icon={Target}
          iconCls="bg-leaf-50 text-leaf-600 ring-leaf-200/70 dark:bg-leaf-500/15 dark:text-leaf-300 dark:ring-leaf-400/25"
          title="Quiz"
          desc="Empat tipe soal dari catatanmu sendiri. Progres tersimpan per tipe."
          delay={0.16}
        >
          <div className="mt-4 space-y-1.5">
            <p className="font-jp text-sm text-ink-700 dark:text-paper-100">「食べる」artinya…</p>
            {[
              { t: "makan", ok: true },
              { t: "minum", ok: false },
            ].map((o) => (
              <div
                key={o.t}
                className={`flex items-center justify-between rounded-lg px-3 py-1.5 text-xs ring-1 ring-inset ${
                  o.ok
                    ? "bg-leaf-50 font-semibold text-leaf-700 ring-leaf-200 dark:bg-leaf-500/15 dark:text-leaf-300 dark:ring-leaf-400/30"
                    : "bg-paper-50 text-ink-400 ring-paper-200 dark:bg-ink-900/40 dark:ring-ink-700"
                }`}
              >
                {o.t}
                {o.ok ? <Check className="h-3.5 w-3.5" /> : null}
              </div>
            ))}
          </div>
        </FeatureCard>

        <FeatureCard
          className="lg:col-span-4"
          kana="知"
          Icon={Bot}
          iconCls="bg-amber-50 text-amber-600 ring-amber-200/70 dark:bg-amber-500/15 dark:text-amber-200 dark:ring-amber-400/25"
          title="AI Tutor"
          desc="Jelaskan kotoba/bunpou, koreksi kalimat, buat contoh & bulk import — lewat proxy aman di server."
          delay={0.24}
        >
          <div className="mt-4 space-y-2">
            <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-accent-gradient px-3.5 py-2 text-xs text-white shadow-glow-sm">
              Jelaskan pola 「〜ながら」dong
            </div>
            <div className="w-fit max-w-[85%] rounded-2xl rounded-bl-md border border-paper-200 bg-paper-50 px-3.5 py-2 text-xs leading-relaxed text-ink-700 dark:border-ink-700 dark:bg-ink-900/40 dark:text-paper-100">
              <span className="font-jp">〜ながら</span> dipakai saat dua aksi terjadi bersamaan:
              <span className="font-jp"> 音楽を聞きながら勉強します</span> — belajar sambil
              mendengarkan musik.
            </div>
          </div>
        </FeatureCard>
      </div>
    </section>
  );
}

interface FeatureCardProps {
  kana: string;
  Icon: React.ComponentType<{ className?: string }>;
  iconCls: string;
  title: string;
  desc: string;
  delay: number;
  className?: string;
  children?: React.ReactNode;
}

function FeatureCard({ kana, Icon, iconCls, title, desc, delay, className, children }: FeatureCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay, ease: EASE }}
      whileHover={{ y: -4 }}
      className={`group relative overflow-hidden rounded-notebook border border-paper-200/80 bg-white p-5 shadow-notebook transition-shadow hover:shadow-notebook-md dark:border-ink-700 dark:bg-ink-800 ${className ?? ""}`}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -right-4 -top-3 font-jp text-7xl text-ink-800/[0.04] transition-transform duration-300 group-hover:scale-110 dark:text-paper-50/[0.04]"
      >
        {kana}
      </span>
      <div className="relative flex items-center gap-3">
        <span className={`grid h-10 w-10 place-items-center rounded-xl ring-1 ring-inset ${iconCls}`}>
          <Icon className="h-5 w-5" />
        </span>
        <h3 className="text-base font-semibold text-ink-800 dark:text-paper-50">{title}</h3>
      </div>
      <p className="relative mt-2.5 text-sm leading-relaxed text-ink-400">{desc}</p>
      <div className="relative">{children}</div>
    </motion.article>
  );
}

/* ------------------------------------------------------------------ */
/* Zen strip — sumi-ink band, gema panel auth                          */
/* ------------------------------------------------------------------ */

const ZEN_STATS = [
  { big: "N5–N1", small: "semua level JLPT" },
  { big: "20", small: "item per slide hafalan" },
  { big: "4", small: "tipe quiz otomatis" },
] as const;

function ZenStrip() {
  const reduce = useReducedMotion();
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, ease: EASE }}
      className="relative my-8 overflow-hidden rounded-notebook-lg bg-ink-gradient px-7 py-12 text-paper-50 sm:px-12"
    >
      {/* washi grain */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(rgba(247,247,246,0.05) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />
      {/* ensō */}
      <svg
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-24 h-[340px] w-[340px]"
        viewBox="0 0 200 200"
        fill="none"
      >
        <motion.circle
          cx="100"
          cy="100"
          r="84"
          stroke="rgba(247,247,246,0.09)"
          strokeWidth="9"
          strokeLinecap="round"
          transform="rotate(-96 100 100)"
          initial={reduce ? { pathLength: 0.93 } : { pathLength: 0 }}
          whileInView={{ pathLength: 0.93 }}
          viewport={{ once: true }}
          transition={{ duration: 1.4, ease: EASE, delay: 0.2 }}
        />
      </svg>

      <div className="relative grid items-center gap-10 lg:grid-cols-[auto_1fr_auto]">
        {/* tategaki */}
        <p
          aria-hidden
          className="hidden font-jp text-2xl tracking-[0.4em] text-paper-50/70 [writing-mode:vertical-rl] lg:block"
        >
          けいぞくは、ちからなり。
        </p>

        <div>
          <p className="font-jp text-xs tracking-[0.3em] text-accent-300">継続は力なり</p>
          <h2 className="mt-2 max-w-lg font-serif text-2xl font-semibold leading-snug tracking-tight sm:text-3xl">
            Konsistensi kecil setiap hari mengalahkan belajar semalaman.
          </h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-paper-50/70">
            ifNote dirancang tenang dan bebas gangguan — supaya lima menit mencatat
            hari ini benar-benar jadi kemajuan besok.
          </p>
        </div>

        <div className="flex gap-8 lg:flex-col lg:gap-5">
          {ZEN_STATS.map((s) => (
            <div key={s.small}>
              <div className="font-serif text-2xl font-semibold text-accent-300">{s.big}</div>
              <div className="mt-0.5 text-xs text-paper-50/60">{s.small}</div>
            </div>
          ))}
        </div>
      </div>
    </motion.section>
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
      transition={{ duration: 0.6, ease: EASE }}
      className="relative my-6 overflow-hidden rounded-notebook-lg bg-accent-gradient px-6 py-12 shadow-glow sm:px-12"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -left-4 -top-6 font-jp text-[120px] leading-none text-white/10"
      >
        始
      </span>
      <div className="relative flex flex-col items-center gap-6 text-center sm:flex-row sm:justify-between sm:text-left">
        <div>
          <p className="font-jp text-xs tracking-[0.3em] text-white/75">はじめよう</p>
          <h2 className="mt-1.5 font-serif text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Mulai catatan Jepangmu hari ini
          </h2>
          <p className="mt-2 max-w-md text-sm text-white/85">
            Buat akun gratis dalam hitungan detik dan rasakan belajar yang tenang &amp; terstruktur.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-5">
          <LinkButton
            href={ROUTES.register}
            size="lg"
            variant="secondary"
            className="gap-2 bg-white text-accent-700 ring-0 hover:bg-paper-100"
          >
            Buat akun gratis
            <ArrowRight className="h-4 w-4" />
          </LinkButton>
          <span
            aria-hidden
            className="hidden h-14 w-14 rotate-[-6deg] place-items-center rounded-[12px] border-2 border-white/40 font-serif text-2xl text-white sm:grid"
          >
            始
          </span>
        </div>
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
    <footer className="relative mt-10">
      {/* hairline dengan hanko dot di tengah — pembuka footer */}
      <div className="flex items-center gap-4" aria-hidden>
        <span className="h-px flex-1 bg-paper-200/80 dark:bg-ink-700" />
        <span className="grid h-8 w-8 -rotate-6 place-items-center rounded-[8px] bg-accent-gradient font-serif text-sm text-white shadow-glow-sm">
          ノ
        </span>
        <span className="h-px flex-1 bg-paper-200/80 dark:bg-ink-700" />
      </div>

      <div className="grid gap-10 pt-12 lg:grid-cols-[1.15fr_1.85fr_auto]">
        {/* brand */}
        <div>
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden
              className="grid h-9 w-9 -rotate-3 place-items-center rounded-[10px] bg-accent-gradient font-serif text-lg text-white shadow-glow-sm"
            >
              ノ
            </span>
            <span className="font-serif text-lg font-semibold tracking-tight text-ink-800 dark:text-paper-50">
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
                className="grid h-9 w-9 place-items-center rounded-full text-ink-400 ring-1 ring-inset ring-paper-300 transition-all hover:-translate-y-0.5 hover:bg-paper-100 hover:text-accent-600 dark:ring-ink-700 dark:hover:bg-ink-700 dark:hover:text-accent-300"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        {/* link columns */}
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {FOOTER_COLS.map((col) => (
            <div key={col.title}>
              <h3 className="flex items-center gap-2 text-sm font-semibold text-ink-800 dark:text-paper-50">
                <span aria-hidden className="h-1 w-1 rounded-full bg-accent-500" />
                {col.title}
              </h3>
              <ul className="mt-4 space-y-3 text-sm">
                {col.links.map((l) => (
                  <li key={l.text}>
                    <Link
                      href={l.href}
                      className="group inline-flex items-center gap-1 text-ink-400 transition-colors hover:text-accent-600 dark:hover:text-accent-300"
                    >
                      <span>{l.text}</span>
                      <span
                        aria-hidden
                        className="translate-x-0 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100"
                      >
                        →
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* tategaki decorative */}
        <p
          aria-hidden
          className="hidden select-none font-jp text-xl tracking-[0.4em] text-ink-300 [writing-mode:vertical-rl] dark:text-ink-600 lg:block"
        >
          しずかに、まなぶ。
        </p>
      </div>

      <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-paper-200/80 py-6 text-xs text-ink-400 dark:border-ink-700 sm:flex-row">
        <p>
          © {new Date().getFullYear()} {APP_NAME} · Japanese Notes with AI
        </p>
        <div className="flex items-center gap-1.5" aria-hidden>
          {["語", "文", "記"].map((k) => (
            <span
              key={k}
              className="grid h-6 w-6 place-items-center rounded-[6px] bg-paper-100 font-serif text-[11px] text-ink-400 ring-1 ring-inset ring-paper-200 dark:bg-ink-800 dark:ring-ink-700"
            >
              {k}
            </span>
          ))}
        </div>
        <p className="font-jp tracking-widest text-ink-400/80">ことば · ぶんぽう · あんき</p>
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
    { c: "あ", top: "14%", left: "4%", size: "140px", cls: "text-accent-500/[0.05] dark:text-accent-200/[0.05]", dur: 10 },
    { c: "ア", top: "6%", right: "8%", size: "110px", cls: "text-lilac-500/[0.06] dark:text-lilac-400/[0.06]", dur: 12 },
    { c: "漢", bottom: "24%", left: "7%", size: "160px", cls: "text-leaf-500/[0.05] dark:text-leaf-500/[0.05]", dur: 13 },
    { c: "の", bottom: "32%", right: "5%", size: "120px", cls: "text-accent-500/[0.05] dark:text-accent-200/[0.05]", dur: 11 },
  ];
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 hidden select-none overflow-hidden sm:block">
      <div className="absolute left-1/2 top-[-8%] h-[380px] w-[620px] -translate-x-1/2 rounded-full bg-accent-300/15 blur-[120px] dark:bg-accent-500/10" />
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
