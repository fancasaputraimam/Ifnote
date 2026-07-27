"use client";

import { useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";
import {
  BrushStroke,
  fetchKanjiVgPaths,
  STROKE_VIEWBOX,
} from "@/components/japanese/KanjiStrokeKit";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { AiLoading } from "@/components/ui/ai-loading";
import { JapaneseText } from "@/components/japanese/JapaneseText";
import { useKanjiInfo, type KanjiInfo } from "@/features/home/useKanjiInfo";
import {
  useCreateKotoba,
  type KotobaWritePayload,
} from "@/features/catatan/useCatatan";
import { notify } from "@/lib/toast";
import { mapApiErrorToUserMessage } from "@/lib/error-mapper";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Props {
  open: boolean;
  kanji: string | null;
  onClose: () => void;
}

interface KanjiWord {
  jp?: string;
  meaning?: string;
}

/**
 * Reading dari AI sering berformat "みず (mizu)" — buang romaji dalam
 * kurung supaya furigana yang tampil di atas kanji murni kana.
 */
function cleanReading(s?: string | null): string | undefined {
  const cleaned = s?.replace(/\s*[（(][^）)]*[）)]/g, "").trim();
  return cleaned || undefined;
}

/** Bangun payload catatan (pipeline kotoba) dari hasil lookup kanji. */
function kanjiToPayload(data: KanjiInfo): KotobaWritePayload {
  const example = data.exampleJp?.trim() || undefined;
  const exampleMeaning = data.exampleId?.trim() || undefined;
  return {
    jp: data.kanji,
    reading: cleanReading(data.kunyomi) || cleanReading(data.onyomi),
    meaning: data.meaning?.trim() || data.explanation?.trim() || data.kanji,
    type: "kanji",
    tags: ["kanji"],
    beginnerExample: example,
    beginnerExampleMeaning: exampleMeaning,
    normalExample: example,
    normalExampleMeaning: exampleMeaning,
    exampleMeaning,
    mastery: "mid",
  };
}

export function KanjiPopup({ open, kanji, onClose }: Props) {
  const q = useKanjiInfo(kanji, open);
  const data = q.data;
  const create = useCreateKotoba();
  const [saved, setSaved] = useState(false);

  // Reset status "tersimpan" tiap ganti kanji.
  useEffect(() => setSaved(false), [kanji]);

  const onSave = async () => {
    if (!data || saved) return;
    try {
      await create.mutateAsync(kanjiToPayload(data));
      setSaved(true);
      notify.success(
        "Kanji disimpan ke Catatan",
        `「${data.kanji}」masuk sebagai catatan bertag #kanji — ikut Hafalan & Quiz.`,
        { icon: "🈷️" },
      );
    } catch (e) {
      const m = mapApiErrorToUserMessage(e, {
        title: "Gagal menyimpan kanji",
        message: "Coba lagi sebentar.",
      });
      notify[m.variant](m.title, m.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent>
      {/* Header stempel — seirama dialog Catatan */}
      <DialogHeader className="mb-4">
        <div className="flex items-center gap-3 text-left">
          <span
            aria-hidden
            className="grid h-11 w-11 shrink-0 -rotate-3 place-items-center rounded-[11px] bg-leaf-50 font-serif text-lg text-leaf-700 ring-1 ring-inset ring-leaf-200 dark:bg-leaf-500/15 dark:text-leaf-300 dark:ring-leaf-400/30"
          >
            漢
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-accent-500" />
              <span className="font-jp text-[11px] tracking-[0.28em] text-accent-600 dark:text-accent-400">
                かんじ・じてん
              </span>
            </div>
            <DialogTitle className="mt-0.5 font-serif text-xl">Detail Kanji</DialogTitle>
          </div>
          {data ? (
            <span className="ml-auto shrink-0">
              <Badge tone="neutral" size="sm">
                {data.source === "ai" ? "✨ AI" : "cache"}
              </Badge>
            </span>
          ) : null}
        </div>
      </DialogHeader>

      {q.isLoading ? (
        <AiLoading
          title="AI sedang menyiapkan info kanji…"
          description="Tunggu sebentar ya."
          compact
        />
      ) : q.isError || !data ? (
        <div className="text-sm text-ink-400">
          Detail kanji belum tersedia. Coba lagi nanti.
        </div>
      ) : (
        <div className="space-y-3">
          {/* Hero — animasi urutan goresan kanji di atas kertas bergaris.
              Fallback ke karakter statis kalau data goresan tidak tersedia. */}
          <div className="notebook-rule relative overflow-hidden rounded-notebook bg-paper-50/70 px-4 py-5 text-center ring-1 ring-inset ring-paper-200/80 dark:bg-ink-900/30 dark:ring-ink-700/70">
            <KanjiStrokes kanji={data.kanji} />
            {data.meaning ? (
              <p className="relative mt-3 text-sm font-medium text-ink-700 dark:text-paper-100">
                {data.meaning}
              </p>
            ) : null}
            <div className="relative mt-3 flex flex-wrap items-center justify-center gap-1.5">
              {data.onyomi ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-50 px-2.5 py-1 text-xs font-medium text-accent-700 ring-1 ring-inset ring-accent-200 dark:bg-accent-500/15 dark:text-accent-200 dark:ring-accent-400/30">
                  <span aria-hidden className="font-serif">音</span>
                  <span className="font-jp">{data.onyomi}</span>
                </span>
              ) : null}
              {data.kunyomi ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-lilac-50 px-2.5 py-1 text-xs font-medium text-lilac-700 ring-1 ring-inset ring-lilac-200 dark:bg-lilac-500/15 dark:text-lilac-300 dark:ring-lilac-400/30">
                  <span aria-hidden className="font-serif">訓</span>
                  <span className="font-jp">{data.kunyomi}</span>
                </span>
              ) : null}
            </div>
          </div>

          {data.explanation ? (
            <PopupSection label="Penjelasan">
              <p className="text-sm leading-relaxed text-ink-700 dark:text-paper-50">
                {data.explanation}
              </p>
            </PopupSection>
          ) : null}

          {Array.isArray(data.wordsJson) && (data.wordsJson as KanjiWord[]).length > 0 ? (
            <PopupSection label="Kata gabungan">
              <ul className="divide-y divide-paper-200/70 text-sm dark:divide-ink-700/70">
                {(data.wordsJson as KanjiWord[]).map((w, i) => (
                  <li key={i} className="flex items-baseline justify-between gap-3 py-1.5 first:pt-0 last:pb-0">
                    <span className="font-jp text-ink-800 dark:text-paper-50">
                      <JapaneseText text={w.jp ?? "—"} inert />
                    </span>
                    <span className="text-right text-xs text-ink-400">{w.meaning ?? ""}</span>
                  </li>
                ))}
              </ul>
            </PopupSection>
          ) : null}

          {data.exampleJp ? (
            <PopupSection label="Contoh kalimat">
              <p className="font-jp text-sm text-ink-800 dark:text-paper-50">
                <JapaneseText text={data.exampleJp} sentenceMode inert />
              </p>
              {data.exampleId ? (
                <p className="mt-1 text-xs text-ink-400">{data.exampleId}</p>
              ) : null}
            </PopupSection>
          ) : null}

          {/* Simpan kanji ini sebagai catatan (tag #kanji) — ikut pipeline
              Catatan → Hafalan → Quiz tanpa perlu tipe catatan baru. */}
          <div className="relative overflow-hidden rounded-xl border border-paper-200 bg-paper-50/70 py-2.5 pl-4 pr-3 dark:border-ink-700 dark:bg-ink-900/30">
            <span aria-hidden className="absolute inset-y-2 left-2 w-px bg-accent-500/25" />
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs leading-relaxed text-ink-400">
                Simpan sebagai catatan bertag{" "}
                <span className="font-medium text-ink-700 dark:text-paper-100">#kanji</span>{" "}
                supaya ikut Hafalan &amp; Quiz.
              </p>
              <Button
                size="sm"
                loading={create.isPending}
                disabled={saved}
                onClick={onSave}
                className="shrink-0"
              >
                {saved ? "✓ Tersimpan" : "Simpan ke Catatan"}
              </Button>
            </div>
          </div>
        </div>
      )}
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/* Animasi urutan goresan (KanjiVG, CC BY-SA)                          */
/* ------------------------------------------------------------------ */

const STROKE_DURATION = 0.55; // detik per goresan
const STROKE_GAP = 0.14;

/**
 * Animasi urutan menulis kanji — data goresan dari proyek KanjiVG
 * (CC BY-SA), diambil dari CDN lalu digambar per goresan seperti kuas
 * menulis. Mesin animasinya manual (getTotalLength + transisi CSS
 * stroke-dashoffset, di-step interval) supaya SELALU bermain — tidak
 * bergantung framer-motion maupun prefers-reduced-motion OS, karena
 * animasi ini justru konten edukasinya. Fallback ke karakter statis
 * kalau data tidak tersedia (offline / di luar cakupan KanjiVG).
 */
function KanjiStrokes({ kanji }: { kanji: string }) {
  const [paths, setPaths] = useState<string[] | null>(null);
  const [failed, setFailed] = useState(false);
  /** Naikkan untuk memutar ulang dari goresan pertama. */
  const [playKey, setPlayKey] = useState(0);
  /** Jumlah goresan yang sudah/sedang digambar (stepper interval). */
  const [drawnCount, setDrawnCount] = useState(0);

  // Stepper: mulai goresan berikutnya tiap (durasi + jeda).
  useEffect(() => {
    setDrawnCount(0);
    if (!paths || paths.length === 0) return;
    const total = paths.length;
    // Goresan pertama mulai setelah jeda kecil (biar mount settle dulu).
    const kick = setTimeout(() => setDrawnCount(1), 150);
    let i = 1;
    const id = setInterval(() => {
      i += 1;
      setDrawnCount(Math.min(i, total));
      if (i >= total) clearInterval(id);
    }, (STROKE_DURATION + STROKE_GAP) * 1000);
    return () => {
      clearTimeout(kick);
      clearInterval(id);
    };
  }, [paths, playKey]);

  useEffect(() => {
    let cancelled = false;
    setPaths(null);
    setFailed(false);
    setPlayKey(0);
    fetchKanjiVgPaths(kanji)
      .then((ds) => {
        if (!cancelled) setPaths(ds);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [kanji]);

  // Fallback statis — tampilan hero lama (kanji besar + ensō).
  if (failed) {
    return (
      <div className="relative">
        <svg
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 text-leaf-500/15"
          viewBox="0 0 200 200"
          fill="none"
        >
          <circle
            cx="100"
            cy="100"
            r="84"
            stroke="currentColor"
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray="492 36"
            transform="rotate(-96 100 100)"
          />
        </svg>
        <div className="relative font-jp text-7xl leading-none text-ink-800 dark:text-paper-50">
          {kanji}
        </div>
      </div>
    );
  }

  // Loading data goresan — kanji redup berdenyut sebagai placeholder.
  if (!paths) {
    return (
      <div className="relative grid h-36 place-items-center">
        <span className="animate-pulse font-jp text-6xl leading-none text-ink-800/20 dark:text-paper-50/20 motion-reduce:animate-none">
          {kanji}
        </span>
        <span className="sr-only">Memuat urutan goresan…</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <svg
        viewBox={STROKE_VIEWBOX}
        className="mx-auto h-36 w-36"
        role="img"
        aria-label={`Urutan goresan kanji ${kanji}`}
      >
        {/* garis bantu tengah, seperti kertas latihan genkouyoushi */}
        <g className="stroke-paper-300/70 dark:stroke-ink-700" strokeWidth="0.5" strokeDasharray="3 3">
          <line x1="54.5" y1="2" x2="54.5" y2="107" />
          <line x1="2" y1="54.5" x2="107" y2="54.5" />
        </g>
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* bayangan bentuk utuh — target tulisan */}
          {paths.map((d, i) => (
            <path
              key={`bg-${i}`}
              d={d}
              strokeWidth="4.5"
              className="stroke-paper-300/80 dark:stroke-ink-600/60"
            />
          ))}
          {/* goresan kuas — digambar berurutan */}
          {paths.map((d, i) => (
            <BrushStroke key={`${playKey}-${i}`} d={d} active={i < drawnCount} />
          ))}
        </g>
      </svg>

      <div className="mt-1 flex items-center justify-center gap-3 text-[11px] text-ink-400">
        <span className="tabular-nums">
          {paths.length} goresan · <span className="font-jp tracking-[0.18em]">かきじゅん</span>
        </span>
        <button
          type="button"
          onClick={() => setPlayKey((k) => k + 1)}
          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium text-accent-600 transition-colors hover:bg-accent-50 dark:text-accent-300 dark:hover:bg-accent-500/10"
        >
          <RotateCcw className="h-3 w-3" aria-hidden /> Ulangi
        </button>
      </div>
      <p aria-hidden className="mt-0.5 text-center text-[9px] text-ink-400/50">
        urutan goresan © KanjiVG (CC BY-SA)
      </p>
    </div>
  );
}

/** Seksi kecil di popup — label bertitik merah di atas kartu hairline. */
function PopupSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-white px-3.5 py-3 ring-1 ring-inset ring-paper-200/70 dark:bg-ink-800/70 dark:ring-ink-700/70">
      <div className="mb-1.5 flex items-center gap-1.5">
        <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-accent-500/80" />
        <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
          {label}
        </span>
      </div>
      {children}
    </div>
  );
}
