"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { NotebookCard } from "@/components/ui/NotebookCard";
import { TextInput } from "@/components/ui/TextInput";
import { ApiError, api } from "@/lib/api-client";
import { toast } from "@/components/feedback/Toast";
import { useSettings, useUpdateSettings } from "@/features/settings/useSettings";
import type { AiRequestFormat } from "@/lib/types";
import { cn } from "@/lib/utils";

export function AiConfigSection() {
  const settingsQ = useSettings();
  const update = useUpdateSettings();

  const [provider, setProvider] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [modelId, setModelId] = useState("");
  const [requestFormat, setRequestFormat] = useState<AiRequestFormat>("openai");
  const [useReal, setUseReal] = useState(false);
  const [testStatus, setTestStatus] = useState<"idle" | "ok" | "fallback" | "error">("idle");
  const [testMsg, setTestMsg] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (!settingsQ.data) return;
    setProvider(settingsQ.data.aiProvider ?? "");
    setBaseUrl(settingsQ.data.aiBaseUrl ?? "");
    setModelId(settingsQ.data.aiModelId ?? "");
    setRequestFormat(settingsQ.data.aiRequestFormat);
    setUseReal(settingsQ.data.useRealAi);
  }, [settingsQ.data]);

  const onSave = async () => {
    try {
      await update.mutateAsync({
        aiProvider: provider.trim() || null,
        aiBaseUrl: baseUrl.trim() || null,
        aiModelId: modelId.trim() || null,
        aiRequestFormat: requestFormat,
        useRealAi: useReal,
      });
      toast("Konfigurasi AI disimpan", "success");
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Gagal menyimpan";
      toast(msg, "error");
    }
  };

  const onClear = async () => {
    setProvider("");
    setBaseUrl("");
    setModelId("");
    setRequestFormat("openai");
    setUseReal(false);
    try {
      await update.mutateAsync({
        aiProvider: null,
        aiBaseUrl: null,
        aiModelId: null,
        aiRequestFormat: "openai",
        useRealAi: false,
      });
      toast("Konfigurasi AI dibersihkan", "success");
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Gagal membersihkan";
      toast(msg, "error");
    }
  };

  const onTest = async () => {
    setTesting(true);
    setTestStatus("idle");
    setTestMsg(null);
    try {
      // Lightweight ping: explain a known kotoba (food). Backend handles auth +
      // mock fallback. Frontend never hits the AI provider directly.
      const r = await api.post<{ source: "ai" | "mock"; data: unknown }>(
        "/api/ai/explain-kotoba",
        { jp: "食べます" },
      );
      if (r.source === "ai") {
        setTestStatus("ok");
        setTestMsg("AI aktif dan merespon.");
      } else {
        setTestStatus("fallback");
        setTestMsg("AI belum di-konfigurasi di backend (mock fallback).");
      }
    } catch (e) {
      setTestStatus("error");
      setTestMsg(e instanceof ApiError ? e.message : "Gagal melakukan tes");
    } finally {
      setTesting(false);
    }
  };

  return (
    <NotebookCard className="p-5">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-ink-800 dark:text-paper-50">
            Konfigurasi AI
          </h2>
          <p className="mt-1 text-xs text-ink-400">
            Preferensi provider AI. API key tetap disimpan di server, tidak di sini.
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <TextInput
          label="Provider Name"
          placeholder="OpenAI / Azure / Lokal …"
          value={provider}
          onChange={(e) => setProvider(e.currentTarget.value)}
        />
        <TextInput
          label="Base URL"
          placeholder="https://api.openai.com/v1"
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.currentTarget.value)}
        />
        <TextInput
          label="Model ID"
          placeholder="gpt-4o-mini"
          value={modelId}
          onChange={(e) => setModelId(e.currentTarget.value)}
        />

        <fieldset>
          <legend className="text-xs uppercase tracking-wide text-ink-400">Request Format</legend>
          <div className="mt-2 inline-flex flex-wrap gap-1 rounded-full border border-paper-200 bg-white p-0.5 text-xs dark:border-ink-700 dark:bg-ink-800">
            {(["openai", "azure", "custom"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setRequestFormat(f)}
                aria-pressed={requestFormat === f}
                className={cn(
                  "rounded-full px-3 py-1.5 font-medium transition-colors",
                  requestFormat === f
                    ? "bg-accent-500 text-white"
                    : "text-ink-700 hover:bg-paper-100 dark:text-paper-50 dark:hover:bg-ink-700",
                )}
              >
                {f === "openai" ? "OpenAI Compatible" : f === "azure" ? "Azure OpenAI" : "Custom JSON"}
              </button>
            ))}
          </div>
        </fieldset>

        <label className="flex items-start gap-3 rounded-xl border border-paper-200 bg-paper-50/60 p-3 dark:border-ink-700 dark:bg-ink-900/30">
          <input
            type="checkbox"
            checked={useReal}
            onChange={(e) => setUseReal(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-accent-500"
          />
          <span className="text-sm text-ink-700 dark:text-paper-50">
            Gunakan AI asli (kalau dikonfigurasi di backend).
            <span className="ml-1 text-xs text-ink-400">
              Kalau OFF, response selalu pakai mock fallback yang jujur.
            </span>
          </span>
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button onClick={onSave} loading={update.isPending}>Save AI Settings</Button>
        <Button variant="secondary" onClick={onTest} loading={testing}>Test Connection</Button>
        <Button variant="ghost" onClick={onClear}>Clear AI Settings</Button>
      </div>

      {testStatus !== "idle" ? (
        <div className="mt-3 flex items-start gap-2 text-sm">
          {testStatus === "ok" ? (
            <Badge tone="leaf">AI aktif</Badge>
          ) : testStatus === "fallback" ? (
            <Badge tone="warn">Mock fallback</Badge>
          ) : (
            <Badge tone="danger">Error</Badge>
          )}
          <p className="text-ink-700 dark:text-paper-50">{testMsg}</p>
        </div>
      ) : null}

      <p className="mt-3 text-xs text-ink-400">
        Catatan keamanan: API key utama tidak disimpan di front-end maupun di
        Settings DB. Server (Heroku Config Vars) yang menyimpan{" "}
        <code className="rounded bg-paper-100 px-1 py-0.5 text-[11px] dark:bg-ink-700">AI_API_KEY</code>.
      </p>
    </NotebookCard>
  );
}
