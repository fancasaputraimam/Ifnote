"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LoadingState } from "@/components/feedback/LoadingState";
import { NotebookCard } from "@/components/ui/NotebookCard";
import { Badge } from "@/components/ui/Badge";

import { AI_MODES, findMode } from "./modes";
import { AiModeCards } from "./components/AiModeCards";
import { AiContextCard } from "./components/AiContextCard";
import { AiComposer } from "./components/AiComposer";
import { KotobaResponseCard } from "./responses/KotobaResponseCard";
import { BunpouResponseCard } from "./responses/BunpouResponseCard";
import { CorrectionResponseCard } from "./responses/CorrectionResponseCard";
import { ExampleResponseCard } from "./responses/ExampleResponseCard";
import { QuizResponseCard } from "./responses/QuizResponseCard";
import { HafalanPlanCard } from "./responses/HafalanPlanCard";
import { BulkPreview } from "./responses/BulkPreview";
import { AnalyzeResponseCard } from "./responses/AnalyzeResponseCard";

import {
  useAnalyzeSentence,
  useBulkKotobaAi,
  useCorrectSentence,
  useCreateHafalanAi,
  useExplainBunpou,
  useExplainKotoba,
  useGenerateQuizAi,
  useMakeExample,
} from "./useAi";
import type {
  AiEnvelope,
  AiMode,
  AnalyzeSentenceData,
  BulkKotobaData,
  CorrectSentenceData,
  CreateHafalanData,
  ExplainBunpouData,
  ExplainKotobaData,
  GenerateQuizData,
  MakeExampleData,
} from "./types";
import { ApiError } from "@/lib/api-client";
import { toast } from "@/components/feedback/Toast";

type LastResult =
  | { mode: "explain-kotoba"; envelope: AiEnvelope<ExplainKotobaData>; input: string }
  | { mode: "explain-bunpou"; envelope: AiEnvelope<ExplainBunpouData>; input: string }
  | { mode: "correct-sentence"; envelope: AiEnvelope<CorrectSentenceData>; input: string }
  | { mode: "make-example"; envelope: AiEnvelope<MakeExampleData>; input: string }
  | { mode: "generate-quiz"; envelope: AiEnvelope<GenerateQuizData>; input: string }
  | { mode: "create-hafalan"; envelope: AiEnvelope<CreateHafalanData>; input: string }
  | { mode: "bulk-kotoba"; envelope: AiEnvelope<BulkKotobaData>; input: string }
  | { mode: "analyze-sentence"; envelope: AiEnvelope<AnalyzeSentenceData>; input: string };

export function AiScreen() {
  const params = useSearchParams();
  const router = useRouter();

  const initialMode = ((): AiMode => {
    const m = params.get("mode");
    if (m && AI_MODES.some((x) => x.key === m)) return m as AiMode;
    return "explain-kotoba";
  })();
  const initialQuery = params.get("q") ?? "";

  const [mode, setMode] = useState<AiMode>(initialMode);
  const [input, setInput] = useState<string>(initialQuery);
  const [lastResult, setLastResult] = useState<LastResult | null>(null);
  const [aiStatus, setAiStatus] = useState<"configured" | "fallback" | "unknown">("unknown");

  // Strip ?mode= and ?q= so reload doesn't re-pin
  useEffect(() => {
    if (params.get("mode") || params.get("q")) {
      router.replace("/app/ai", { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset input + last result whenever mode changes
  useEffect(() => {
    setLastResult(null);
    // Don't blow away the input when we just hydrated from ?q=
    if (!params.get("q")) setInput("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // ---- mutations ----------------------------------------------------
  const explainKotoba = useExplainKotoba();
  const explainBunpou = useExplainBunpou();
  const correctSentence = useCorrectSentence();
  const makeExample = useMakeExample();
  const generateQuiz = useGenerateQuizAi();
  const createHafalan = useCreateHafalanAi();
  const bulkKotoba = useBulkKotobaAi();
  const analyzeSentence = useAnalyzeSentence();

  const submitting =
    explainKotoba.isPending ||
    explainBunpou.isPending ||
    correctSentence.isPending ||
    makeExample.isPending ||
    generateQuiz.isPending ||
    createHafalan.isPending ||
    bulkKotoba.isPending ||
    analyzeSentence.isPending;

  const meta = findMode(mode);

  const updateStatus = (source: "ai" | "mock") => {
    setAiStatus(source === "ai" ? "configured" : "fallback");
  };

  const onSubmit = async () => {
    const value = input.trim();
    if (value.length === 0) return;

    try {
      switch (mode) {
        case "explain-kotoba": {
          const r = await explainKotoba.mutateAsync({ jp: value });
          setLastResult({ mode, envelope: r, input: value });
          updateStatus(r.source);
          break;
        }
        case "explain-bunpou": {
          const r = await explainBunpou.mutateAsync({ pattern: value });
          setLastResult({ mode, envelope: r, input: value });
          updateStatus(r.source);
          break;
        }
        case "correct-sentence": {
          const r = await correctSentence.mutateAsync({ sentence: value });
          setLastResult({ mode, envelope: r, input: value });
          updateStatus(r.source);
          break;
        }
        case "make-example": {
          const r = await makeExample.mutateAsync({ topic: value });
          setLastResult({ mode, envelope: r, input: value });
          updateStatus(r.source);
          break;
        }
        case "generate-quiz": {
          const r = await generateQuiz.mutateAsync({ topic: value || undefined, count: 5 });
          setLastResult({ mode, envelope: r, input: value });
          updateStatus(r.source);
          break;
        }
        case "create-hafalan": {
          const r = await createHafalan.mutateAsync({ topic: value });
          setLastResult({ mode, envelope: r, input: value });
          updateStatus(r.source);
          break;
        }
        case "bulk-kotoba": {
          const words = value
            .split(/\r?\n|,/)
            .map((w) => w.trim())
            .filter(Boolean)
            .slice(0, 50);
          if (words.length === 0) {
            toast("Tidak ada kata yang valid", "error");
            return;
          }
          const r = await bulkKotoba.mutateAsync({ words });
          setLastResult({ mode, envelope: r, input: value });
          updateStatus(r.source);
          break;
        }
        case "analyze-sentence": {
          const r = await analyzeSentence.mutateAsync({ sentence: value });
          setLastResult({ mode, envelope: r, input: value });
          updateStatus(r.source);
          break;
        }
      }
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Gagal memanggil AI";
      toast(msg, "error");
    }
  };

  const responseEl = useMemo(() => {
    if (!lastResult) return null;
    switch (lastResult.mode) {
      case "explain-kotoba":
        return (
          <KotobaResponseCard
            data={lastResult.envelope.data}
            source={lastResult.envelope.source}
            fallbackJp={lastResult.input}
          />
        );
      case "explain-bunpou":
        return (
          <BunpouResponseCard
            data={lastResult.envelope.data}
            source={lastResult.envelope.source}
            fallbackPattern={lastResult.input}
          />
        );
      case "correct-sentence":
        return <CorrectionResponseCard data={lastResult.envelope.data} source={lastResult.envelope.source} />;
      case "make-example":
        return <ExampleResponseCard data={lastResult.envelope.data} source={lastResult.envelope.source} />;
      case "generate-quiz":
        return <QuizResponseCard data={lastResult.envelope.data} source={lastResult.envelope.source} />;
      case "create-hafalan":
        return <HafalanPlanCard data={lastResult.envelope.data} source={lastResult.envelope.source} />;
      case "bulk-kotoba":
        return (
          <BulkPreview
            data={lastResult.envelope.data}
            source={lastResult.envelope.source}
            onReset={() => setLastResult(null)}
          />
        );
      case "analyze-sentence":
        return <AnalyzeResponseCard data={lastResult.envelope.data} source={lastResult.envelope.source} />;
    }
  }, [lastResult]);

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <div className="text-xs font-medium uppercase tracking-wide text-accent-600 dark:text-accent-300">
          ✨ Study Assistant
        </div>
        <h1 className="text-2xl font-semibold text-ink-800 dark:text-paper-50 sm:text-3xl">
          AI Tutor
        </h1>
        <p className="text-sm text-ink-400">
          Asisten belajar Jepang untuk kotoba, bunpou, dan hafalan.
        </p>
      </header>

      <AiModeCards mode={mode} onChange={setMode} disabled={submitting} />
      <AiContextCard meta={meta} status={aiStatus} />

      <NotebookCard className="p-5">
        <AiComposer
          meta={meta}
          value={input}
          onChange={setInput}
          onSubmit={onSubmit}
          submitting={submitting}
          autoFocus
        />
      </NotebookCard>

      {submitting ? (
        <LoadingState label="AI sedang memproses…" />
      ) : null}

      {!submitting && lastResult ? (
        <div className="space-y-4">
          {aiStatus === "fallback" ? (
            <div className="flex items-center gap-2">
              <Badge tone="warn">Mock fallback</Badge>
              <p className="text-xs text-ink-400">
                Backend belum di-konfigurasi AI key, jadi response ini deterministik.
                Konfigurasikan AI di Settings backend untuk respon nyata.
              </p>
            </div>
          ) : null}
          {responseEl}
        </div>
      ) : null}
    </div>
  );
}
