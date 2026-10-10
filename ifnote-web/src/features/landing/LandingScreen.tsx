"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useReducedMotion } from "framer-motion";
import { Check, RotateCcw } from "lucide-react";
import { LinkButton } from "@/components/ui/LinkButton";
import {
  BrushStroke,
  fetchKanjiVgPaths,
  STROKE_VIEWBOX,
} from "@/components/japanese/KanjiStrokeKit";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { FOCUS_RING } from "@/components/site/focus";
import { authClient } from "@/lib/auth-client";
import { ROUTES, CONTACT_EMAIL, POWERED_BY_CLAUDE } from "@/lib/constants";

/*
 * Design Read: landing untuk pelajar bahasa Jepang berbahasa Indonesia, bahasa
 * visual kertas catatan dan tinta sumi, dial ENERGY 2 / RHYTHM 2 / MOTION 1.
 * MOTION 1: hanya hover, plus satu animasi tulis kanji yang jalan sekali karena
 * itu memang fitur yang didemokan.
 */


/* ------------------------------------------------------------------ */
/* Data                                                                */
/* ------------------------------------------------------------------ */

// Tiga langkah karena alur nyata aplikasinya memang tiga: catat, hafal, uji.
const STEPS = [
  { num: "一", title: "Catat", desc: "Tulis kata atau pola baru begitu ketemu. Cara baca dan contoh kalimat bisa diisi AI kalau kamu malas mengetik." },
  { num: "二", title: "Hafal", desc: "Catatanmu dipecah jadi slide 20 item. Ada mode khusus untuk yang belum hafal." },
  { num: "三", title: "Uji", desc: "Soalnya dibuat dari catatanmu, jadi yang diuji memang yang kamu pelajari." },
];

/* ------------------------------------------------------------------ */
/* Screen                                                              */
/* ------------------------------------------------------------------ */

export function LandingScreen() {
  const router = useRouter();

  // Halaman dirender penuh di server. Pengguna yang sudah login dialihkan
  // setelah hydrate, supaya crawler dan JS-off tetap melihat isi halaman.
  useEffect(() => {
    if (authClient.hasToken()) router.replace(ROUTES.app.home);
  }, [router]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-paper-50 dark:bg-paper-900">
      {/* garis margin merah, motif buku latihan yang sama dengan halaman auth */}
      <div aria-hidden className="absolute inset-y-0 left-5 z-0 hidden w-px bg-accent-500/20 md:block" />
      <div aria-hidden className="absolute inset-y-0 left-[23px] z-0 hidden w-px bg-accent-500/[0.08] md:block" />

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col px-5 sm:px-8">
        <SiteHeader />
        <Hero />
        <Steps />
        <Features />
        <CtaBand />
        <AboutContact />
        <SiteFooter />
      </div>
    </main>
  );
}

/* ------------------------------------------------------------------ */
/* Hero: copy kiri, lembar kaligrafi kanan                              */
/* ------------------------------------------------------------------ */

function Hero() {
  return (
    <section className="grid items-center gap-12 py-10 sm:py-14 lg:grid-cols-[1.02fr_0.98fr] lg:py-20">
      <div>
        <h1 className="max-w-xl font-serif text-4xl font-bold leading-[1.12] tracking-tight text-ink-800 dark:text-paper-50 sm:text-5xl lg:text-[3.4rem]">
          Buku catatan bahasa Jepang yang bisa menguji kamu.
        </h1>

        <p className="mt-5 max-w-lg text-base leading-relaxed text-ink-400 sm:text-lg">
          Tulis kotoba dan bunpou yang kamu temui. ifNote menyusunnya jadi hafalan dan quiz, dan AI tutor
          bisa membantu kalau ada kalimat yang bikin bingung.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <LinkButton href={ROUTES.register} size="lg">
            Buat akun
          </LinkButton>
          <LinkButton href={ROUTES.login} size="lg" variant="secondary">
            Sudah punya akun
          </LinkButton>
        </div>

        <p className="mt-4 max-w-md text-xs leading-relaxed text-ink-400">
          Materi bawaan baru N5 dan N4. Catatanmu sendiri bebas di level apa saja. Tidak ada
          pembayaran.
        </p>
      </div>

      <ShodoSheet />
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Hero visual: 日本語 ditulis goresan demi goresan, sekali jalan.       */
/* Data KanjiVG, komponen yang sama dengan dialog klik-kanji di app.     */
/* ------------------------------------------------------------------ */

const HERO_CHARS = ["日", "本", "語"] as const;
// 23 goresan × 0.3 s ≈ 7 s. Dulu 0.52 s per goresan (≈ 12 s), terlalu lama.
const HERO_STROKE_SEC = 0.24;
const HERO_GAP_SEC = 0.06;

function ShodoSheet() {
  const reduce = useReducedMotion();
  const sheetRef = useRef<HTMLDivElement>(null);
  const [chars, setChars] = useState<string[][] | null>(null);
  const [failed, setFailed] = useState(false);
  /** Mulai menulis hanya setelah lembar terlihat di layar. */
  const [inView, setInView] = useState(false);
  /** Jumlah goresan global (lintas 3 karakter) yang sudah digambar. */
  const [drawn, setDrawn] = useState(0);
  const [playKey, setPlayKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    // Salinan lokal di /public/kanjivg: hero tidak bergantung pada CDN.
    Promise.all(HERO_CHARS.map((c) => fetchKanjiVgPaths(c, { local: true })))
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

  useEffect(() => {
    const el = sheetRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const total = chars?.reduce((s, c) => s + c.length, 0) ?? 0;

  // Menulis sekali lalu berhenti. "Tulis ulang" memutar lagi atas permintaan.
  useEffect(() => {
    if (!chars || total === 0 || !inView) return;
    if (reduce) {
      setDrawn(total);
      return;
    }
    setDrawn(0);
    const stepMs = (HERO_STROKE_SEC + HERO_GAP_SEC) * 1000;
    const kick = setTimeout(() => setDrawn(1), 200);
    let i = 1;
    const id = setInterval(() => {
      i += 1;
      setDrawn(Math.min(i, total));
      if (i >= total) clearInterval(id);
    }, stepMs);
    return () => {
      clearTimeout(kick);
      clearInterval(id);
    };
  }, [chars, total, playKey, reduce, inView]);

  return (
    <div ref={sheetRef} className="relative mx-auto w-full max-w-md lg:max-w-none">
      {/* ensō di belakang lembar: motif identitas, statis. Disembunyikan di HP supaya tidak sempit. */}
      <svg
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 hidden h-[480px] w-[480px] -translate-x-1/2 -translate-y-1/2 sm:block"
        viewBox="0 0 200 200"
        fill="none"
      >
        <circle
          cx="100"
          cy="100"
          r="88"
          stroke="currentColor"
          className="text-ink-800/[0.06] dark:text-paper-50/[0.06]"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray="514 553"
          transform="rotate(-96 100 100)"
        />
      </svg>

      {/* Kedalaman cukup dari border tipis dan bayangan kecil, bukan bayangan lebar. */}
      <div className="notebook-rule relative rounded-notebook border border-paper-200 bg-white p-4 shadow-notebook dark:border-ink-700 dark:bg-ink-800 sm:-rotate-1 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-ink-700 dark:text-paper-100">
            Urutan goresan <span lang="ja" className="font-jp font-normal text-ink-400">かきじゅん</span>
          </p>
          {chars ? (
            <button
              type="button"
              onClick={() => {
                setInView(true);
                setPlayKey((k) => k + 1);
              }}
              className={`inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-xs font-medium text-accent-700 transition-colors hover:bg-accent-50 dark:text-accent-300 dark:hover:bg-accent-500/10 ${FOCUS_RING}`}
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Tulis ulang
            </button>
          ) : null}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {HERO_CHARS.map((ch, ci) => {
            const offset = chars ? chars.slice(0, ci).reduce((s, c) => s + c.length, 0) : 0;
            return (
              <div
                key={ch}
                className="rounded-xl bg-paper-50/70 p-1.5 ring-1 ring-inset ring-paper-200/70 dark:bg-ink-900/30 dark:ring-ink-700/60"
              >
                {failed || !chars ? (
                  <div
                    lang="ja"
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
                          durationSec={reduce ? 0 : HERO_STROKE_SEC}
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
          Di dalam ifNote, kanji mana pun bisa diklik: urutan goresannya digambar seperti ini, lengkap
          dengan arti, onyomi, dan kunyomi.
        </p>
        <p className="mt-1 text-xs text-ink-400">Urutan goresan © KanjiVG (CC BY-SA)</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Steps                                                               */
/* ------------------------------------------------------------------ */

function Steps() {
  return (
    <section aria-labelledby="cara-kerja" className="py-8">
      <h2 id="cara-kerja" className="sr-only">
        Cara kerja
      </h2>
      <ol className="grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-6">
        {STEPS.map((s) => (
          <li key={s.num} className="flex gap-4 sm:block">
            <span
              aria-hidden
              className="font-jp text-3xl font-bold text-accent-700 dark:text-accent-300 sm:text-4xl"
            >
              {s.num}
            </span>
            <div className="sm:mt-2">
              <h3 className="font-serif text-lg font-semibold text-ink-800 dark:text-paper-50">
                {s.title}
              </h3>
              <p className="mt-1 max-w-xs text-sm leading-relaxed text-ink-400">{s.desc}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Features: ritme berubah mengikuti isi. Dua baris lebar (Catatan, AI  */
/* Tutor, bergantian kiri dan kanan), lalu dua kolom (Hafalan, Quiz).    */
/* Semua tampilan mini adalah contoh dan diberi label.                  */
/* ------------------------------------------------------------------ */

function ExampleLabel() {
  return <p className="mb-2 text-xs text-ink-400">Contoh tampilan</p>;
}

function Features() {
  return (
    <section aria-label="Fitur ifNote" className="py-14">
      <h2 className="max-w-xl font-serif text-2xl font-semibold tracking-tight text-ink-800 dark:text-paper-50 sm:text-3xl">
        Yang bisa kamu lakukan di ifNote
      </h2>

      <div className="mt-10 space-y-12">
        {/* Catatan: teks kiri, contoh kanan */}
        <article className="grid items-center gap-6 lg:grid-cols-[1fr_1.1fr] lg:gap-12">
          <div>
            <h3 className="mt-1 font-serif text-xl font-semibold text-ink-800 dark:text-paper-50">Catatan</h3>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-400">
              Kotoba dan bunpou ditulis di satu tempat. Cari, saring per level N5 sampai N1, dan
              simpan contoh kalimat beserta cara bacanya.
            </p>
          </div>
          <div className="rounded-notebook border border-paper-200 bg-white p-4 dark:border-ink-700 dark:bg-ink-800">
            <ExampleLabel />
            <div>
              {[
                { jp: "水", yomi: "みず", id: "air", lv: "N5" },
                { jp: "図書館", yomi: "としょかん", id: "perpustakaan", lv: "N4" },
              ].map((r) => (
                <div
                  key={r.jp}
                  className="flex items-center justify-between border-b border-paper-200 py-2.5 last:border-b-0 dark:border-ink-700"
                >
                  <div className="flex items-baseline gap-2.5">
                    <span lang="ja" className="font-jp text-lg text-ink-800 dark:text-paper-50">{r.jp}</span>
                    <span lang="ja" className="font-jp text-xs text-ink-400">{r.yomi}</span>
                    <span className="text-xs text-ink-400">{r.id}</span>
                  </div>
                  <span className="text-xs font-semibold text-ink-400">{r.lv}</span>
                </div>
              ))}
            </div>
          </div>
        </article>

        {/* AI Tutor: contoh kiri, teks kanan */}
        <article className="grid items-center gap-6 lg:grid-cols-[1.1fr_1fr] lg:gap-12">
          <div className="order-2 rounded-notebook border border-paper-200 bg-white p-4 dark:border-ink-700 dark:bg-ink-800 lg:order-1">
            <ExampleLabel />
            <div className="space-y-2">
              <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-accent-gradient px-3.5 py-2 text-xs text-white">
                Jelaskan pola <span lang="ja">「〜ながら」</span>dong
              </div>
              <div className="w-fit max-w-[85%] rounded-2xl rounded-bl-md bg-paper-100 px-3.5 py-2 text-xs leading-relaxed text-ink-700 dark:bg-ink-900/40 dark:text-paper-100">
                <span lang="ja" className="font-jp">〜ながら</span> dipakai saat dua aksi terjadi bersamaan:
                <span lang="ja" className="font-jp"> 音楽を聞きながら勉強します</span>, belajar sambil
                mendengarkan musik.
              </div>
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <h3 className="mt-1 font-serif text-xl font-semibold text-ink-800 dark:text-paper-50">AI tutor</h3>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-400">
              Bingung sama sebuah kata atau pola? Tanya di sini. Bisa juga minta kalimatmu dikoreksi,
              dibuatkan contoh baru, atau memasukkan banyak catatan sekaligus.
            </p>
            {POWERED_BY_CLAUDE ? (
              <p className="mt-2 text-xs text-ink-400">AI tutor ditenagai Claude dari Anthropic.</p>
            ) : null}
          </div>
        </article>

        {/* Hafalan dan Quiz: dua kolom setara, keduanya ringkas */}
        <div className="grid gap-10 sm:grid-cols-2 sm:gap-8">
          <article>
            <h3 className="mt-1 font-serif text-xl font-semibold text-ink-800 dark:text-paper-50">Hafalan</h3>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-400">
              Slide berisi 20 item. Pilih kotoba, bunpou, campuran, atau yang masih lemah.
            </p>
            <div className="mt-4 rounded-notebook border border-paper-200 bg-white p-4 dark:border-ink-700 dark:bg-ink-800">
              <ExampleLabel />
              <div className="flex items-center justify-between text-xs text-ink-400">
                <span>Slide</span>
                <span className="font-semibold text-ink-700 dark:text-paper-100">12/20</span>
              </div>
              <div
                className="mt-2 h-2 overflow-hidden rounded-full bg-paper-100 dark:bg-ink-900/60"
                role="img"
                aria-label="Contoh progres 12 dari 20"
              >
                <div className="h-full w-[60%] rounded-full bg-lilac-600" />
              </div>
            </div>
          </article>

          <article>
            <h3 className="mt-1 font-serif text-xl font-semibold text-ink-800 dark:text-paper-50">Quiz</h3>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-400">
              Empat jenis soal: kotoba, bunpou, campuran, dan buatan AI. Progresnya disimpan per jenis.
            </p>
            <div className="mt-4 rounded-notebook border border-paper-200 bg-white p-4 dark:border-ink-700 dark:bg-ink-800">
              <ExampleLabel />
              <p className="font-jp text-sm text-ink-700 dark:text-paper-100">
                <span lang="ja">「食べる」</span>artinya…
              </p>
              <div className="mt-2 space-y-1.5">
                {[
                  { t: "makan", ok: true },
                  { t: "minum", ok: false },
                ].map((o) => (
                  <div
                    key={o.t}
                    className={`flex items-center justify-between rounded-lg px-3 py-1.5 text-xs ${
                      o.ok
                        ? "bg-leaf-50 font-semibold text-leaf-700 dark:bg-leaf-500/15 dark:text-leaf-300"
                        : "bg-paper-100 text-ink-400 dark:bg-ink-900/40"
                    }`}
                  >
                    {o.t}
                    {o.ok ? <Check className="h-3.5 w-3.5" aria-label="Jawaban benar" /> : null}
                  </div>
                ))}
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Tentang, Kontak, Privasi, Ketentuan: ringkasan dengan tautan ke halaman lengkap. */
/* Empat blok bergaris, bukan kartu, supaya tidak menambah kotak lagi.              */
/* ------------------------------------------------------------------ */

const TEXT_LINK = `rounded font-medium text-accent-700 underline underline-offset-4 hover:text-accent-800 dark:text-accent-300 dark:hover:text-accent-200 ${FOCUS_RING}`;

function AboutContact() {
  return (
    <section
      aria-label="Tentang, kontak, privasi, dan ketentuan"
      className="py-14"
    >
      <div className="grid gap-12 md:grid-cols-2 md:gap-y-14">
        <InfoBlock id="tentang" title="Tentang" className="md:pr-12">
          <p>
            ifNote dibuat Imam Fanca Saputra untuk orang Indonesia yang belajar bahasa Jepang.
          </p>
        </InfoBlock>

        <InfoBlock id="kontak" title="Kontak" className="md:border-l md:border-paper-200/80 md:pl-12 dark:md:border-ink-700">
          <p>
            Ada bug, mau hapus akun, lupa password, atau penasaran soal datamu? Kirim email ke{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className={TEXT_LINK}>
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </InfoBlock>

        <InfoBlock id="privasi" title="Privasi" className="md:pr-12">
          <p>
            Yang tersimpan: nama, email, password (dalam bentuk acak, bukan aslinya), dan catatanmu.
            Teks yang kamu kirim ke AI tutor ikut diteruskan ke penyedia model AI. Tidak ada cookie
            iklan, dan catatanmu bisa diekspor kapan saja.
          </p>
        </InfoBlock>

        <InfoBlock id="ketentuan" title="Ketentuan" className="md:border-l md:border-paper-200/80 md:pl-12 dark:md:border-ink-700">
          <p>
            Jawaban AI bisa salah, jadi cek lagi sebelum dipakai untuk ujian. Jangan masuk ke akun
            orang lain atau membanjiri layanan dengan permintaan. Ekspor catatanmu sesekali sebagai
            cadangan.
          </p>
        </InfoBlock>
      </div>
    </section>
  );
}

function InfoBlock({
  id,
  title,
  className,
  children,
}: {
  id: string;
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div id={id} className={`scroll-mt-8 ${className ?? ""}`}>
      <h2 className="font-serif text-xl font-semibold text-ink-800 dark:text-paper-50">{title}</h2>
      <div className="mt-2 max-w-md text-sm leading-relaxed text-ink-400">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* CTA                                                                 */
/* ------------------------------------------------------------------ */

function CtaBand() {
  return (
    <section className="mb-2 mt-6 rounded-notebook-lg bg-accent-gradient px-6 py-12 sm:px-12">
      <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-serif text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Mulai dari satu kata hari ini.
          </h2>
          <p className="mt-2 max-w-md text-sm text-white">
            Cukup nama, email, dan password.
          </p>
        </div>
        <LinkButton
          href={ROUTES.register}
          size="lg"
          variant="secondary"
          className="shrink-0 bg-white text-accent-700 ring-0 hover:bg-paper-100"
        >
          Buat akun
        </LinkButton>
      </div>
    </section>
  );
}
