"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SettingsSection } from "@/components/ui/SettingsSection";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { TextInput } from "@/components/ui/TextInput";
import { ApiError, api } from "@/lib/api-client";
import { notify } from "@/lib/toast";
import { mapApiErrorToUserMessage } from "@/lib/error-mapper";
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
  const [apiKeyDraft, setApiKeyDraft] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [testStatus, setTestStatus] = useState<"idle" | "ok" | "error">("idle");
  const [testMsg, setTestMsg] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  // Hydrate non-secret fields from server. We never get the raw key back —
  // only `hasAiApiKey` and `aiApiKeyHint` for display. Discriminator narrow:
  // hanya owner yang punya field-field AI di payload.
  useEffect(() => {
    const data = settingsQ.data;
    if (!data || !data.canManageAi) return;
    setProvider(data.aiProvider ?? "");
    setBaseUrl(data.aiBaseUrl ?? "");
    setModelId(data.aiModelId ?? "");
    setRequestFormat(data.aiRequestFormat);
    setUseReal(data.useRealAi);
  }, [settingsQ.data]);

  const onSave = async () => {
    // Send apiKey only when user has typed something new. Keep it as
    // `undefined` (omit) so server keeps existing key.
    const apiKey = apiKeyDraft.trim().length > 0 ? apiKeyDraft.trim() : undefined;
    try {
      await update.mutateAsync({
        aiProvider: provider.trim() || null,
        aiBaseUrl: baseUrl.trim() || null,
        aiModelId: modelId.trim() || null,
        aiRequestFormat: requestFormat,
        useRealAi: useReal,
        aiApiKey: apiKey,
      });
      // Wipe the draft after save so it doesn't linger in DOM/devtools.
      setApiKeyDraft("");
      setShowKey(false);
      notify.success(
        "Konfigurasi AI disimpan",
        "Pengaturan AI sudah diperbarui.",
        { icon: "⚙️" },
      );
    } catch (e) {
      const m = mapApiErrorToUserMessage(e, {
        title: "Gagal menyimpan konfigurasi AI",
        message: "Coba lagi sebentar.",
      });
      notify[m.variant](m.title, m.message);
    }
  };

  const onClearKey = async () => {
    try {
      await update.mutateAsync({ aiApiKey: null });
      setApiKeyDraft("");
      setShowKey(false);
      notify.success(
        "API key dihapus",
        "API key kamu sudah dihapus dari server.",
        { icon: "⚙️" },
      );
    } catch (e) {
      const m = mapApiErrorToUserMessage(e, {
        title: "Gagal menghapus API key",
        message: "Coba lagi sebentar.",
      });
      notify[m.variant](m.title, m.message);
    }
  };

  const onClearAll = async () => {
    setProvider("");
    setBaseUrl("");
    setModelId("");
    setRequestFormat("openai");
    setUseReal(false);
    setApiKeyDraft("");
    setShowKey(false);
    try {
      await update.mutateAsync({
        aiProvider: null,
        aiBaseUrl: null,
        aiModelId: null,
        aiRequestFormat: "openai",
        useRealAi: false,
        aiApiKey: null,
      });
      notify.success(
        "Konfigurasi AI dibersihkan",
        "Semua pengaturan AI sudah direset.",
        { icon: "⚙️" },
      );
    } catch (e) {
      const m = mapApiErrorToUserMessage(e, {
        title: "Gagal membersihkan",
        message: "Coba lagi sebentar.",
      });
      notify[m.variant](m.title, m.message);
    }
  };

  const onTest = async () => {
    setTesting(true);
    setTestStatus("idle");
    setTestMsg(null);
    try {
      const r = await api.post<{ source: "ai"; data: unknown }>(
        "/api/ai/explain-kotoba",
        { jp: "食べます" },
      );
      // Backend selalu balikin source="ai" kalau berhasil; kalau tidak siap
      // dia lempar 503 (di-handle di catch).
      void r;
      setTestStatus("ok");
      setTestMsg("AI aktif dan merespon.");
    } catch (e) {
      setTestStatus("error");
      setTestMsg(e instanceof ApiError ? e.message : "Gagal melakukan tes");
    } finally {
      setTesting(false);
    }
  };

  // SettingsScreen sudah meng-swap card ini ke versi "AI managed by admin"
  // untuk non-owner. Sebagai pengaman extra (cache races, devtools tweak),
  // narrow lewat discriminator dan jangan akses field owner-only kalau bukan.
  const ownerData = settingsQ.data?.canManageAi ? settingsQ.data : null;
  const hasSavedKey = !!ownerData?.hasAiApiKey;
  const savedKeyHint = ownerData?.aiApiKeyHint ?? null;

  return (
    <SettingsSection
      icon={<Sparkles className="h-5 w-5" />}
      title="Konfigurasi AI"
      description="API key dienkripsi server (AES-256-GCM). Tidak pernah dikirim balik dalam keadaan plain."
    >
      <div className="space-y-3">
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

        {/* API Key field (PRD PART 4) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-ink-700 dark:text-paper-50">
              API Key
            </span>
            {hasSavedKey && savedKeyHint ? (
              <span
                className="inline-flex items-center gap-1 rounded-full bg-leaf-500/15 px-2.5 py-0.5 text-[11px] font-medium text-leaf-600 dark:text-leaf-500"
                aria-live="polite"
              >
                Tersimpan: <code className="font-mono">{savedKeyHint}</code>
              </span>
            ) : null}
          </div>
          <div className="relative">
            <input
              type={showKey ? "text" : "password"}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              data-1p-ignore
              data-lpignore="true"
              placeholder={hasSavedKey ? "Ketik untuk mengganti API key" : "Masukkan API key kamu"}
              value={apiKeyDraft}
              onChange={(e) => setApiKeyDraft(e.currentTarget.value)}
              className={cn(
                "block w-full rounded-xl bg-white px-3.5 py-2.5 pr-20 text-sm text-ink-800 shadow-sm ring-1 ring-inset ring-paper-300 transition-shadow",
                "placeholder:text-ink-400/80 hover:ring-paper-400",
                "focus:outline-none focus:ring-2 focus:ring-accent-400",
                "dark:bg-ink-800 dark:text-paper-50 dark:ring-ink-700",
                "font-mono",
              )}
              aria-label="API key"
            />
            <button
              type="button"
              onClick={() => setShowKey((v) => !v)}
              aria-pressed={showKey}
              className="absolute right-2 top-1/2 grid h-7 -translate-y-1/2 place-items-center rounded-full px-2.5 text-xs font-medium text-ink-400 transition-colors hover:bg-paper-100 hover:text-ink-700 dark:hover:bg-ink-700 dark:hover:text-paper-50"
            >
              {showKey ? "Hide" : "Show"}
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-400">
            <span>API key dienkripsi sebelum disimpan dan tidak ikut dibawa di response API.</span>
            {hasSavedKey ? (
              <button
                type="button"
                onClick={onClearKey}
                className="text-rose-600 underline-offset-4 hover:underline dark:text-rose-400"
              >
                Hapus API key tersimpan
              </button>
            ) : null}
          </div>
        </div>

        <TextInput
          label="Model ID"
          placeholder="gpt-4o-mini"
          value={modelId}
          onChange={(e) => setModelId(e.currentTarget.value)}
        />

        <fieldset>
          <legend className="text-xs font-medium uppercase tracking-wide text-ink-400">Request Format</legend>
          <div className="mt-2">
            <SegmentedControl<AiRequestFormat>
              layoutId="ai-request-format"
              aria-label="Request format"
              size="sm"
              value={requestFormat}
              onChange={setRequestFormat}
              options={[
                { value: "openai", label: "OpenAI" },
                { value: "azure", label: "Azure" },
                { value: "custom", label: "Custom" },
              ]}
            />
          </div>
        </fieldset>

        <label className="flex items-start gap-3 rounded-xl bg-paper-50/60 p-3 ring-1 ring-inset ring-paper-200/80 dark:bg-ink-900/30 dark:ring-ink-700">
          <input
            type="checkbox"
            checked={useReal}
            onChange={(e) => setUseReal(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-accent-500"
          />
          <span className="text-sm text-ink-700 dark:text-paper-50">
            Gunakan AI asli (kalau dikonfigurasi di backend).
            <span className="ml-1 text-xs text-ink-400">
              Kalau OFF, semua endpoint AI akan menolak dengan pesan
              “AI belum diatur” — tidak ada lagi mock fallback.
            </span>
          </span>
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button onClick={onSave} loading={update.isPending}>Save AI Settings</Button>
        <Button variant="secondary" onClick={onTest} loading={testing}>Test Connection</Button>
        <Button variant="ghost" onClick={onClearAll}>Clear AI Settings</Button>
      </div>

      {testStatus !== "idle" ? (
        <div className="mt-3 flex items-start gap-2 text-sm">
          {testStatus === "ok" ? (
            <Badge tone="leaf">AI aktif</Badge>
          ) : (
            <Badge tone="danger">Error</Badge>
          )}
          <p className="text-ink-700 dark:text-paper-50">{testMsg}</p>
        </div>
      ) : null}

      <p className="mt-3 text-xs text-ink-400">
        Catatan keamanan: API key user dienkripsi server (AES-256-GCM, key derived dari{" "}
        <code className="rounded bg-paper-100 px-1 py-0.5 text-[11px] dark:bg-ink-700">JWT_SECRET</code>).
        Server-side fallback{" "}
        <code className="rounded bg-paper-100 px-1 py-0.5 text-[11px] dark:bg-ink-700">AI_API_KEY</code>{" "}
        di Heroku Config Vars tetap dipakai kalau user belum mengisi sendiri.
      </p>
    </SettingsSection>
  );
}
