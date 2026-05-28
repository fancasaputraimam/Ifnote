"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";
import { toast } from "@/components/feedback/Toast";

/**
 * Tombol social auth (Google / GitHub / X). OAuth backend belum siap di
 * fase ini, jadi semua tombol fallback ke toast. Tidak boleh fake login.
 *
 * Kalau backend OAuth siap, ganti `handleClick` jadi redirect ke:
 *   /api/auth/oauth/google
 *   /api/auth/oauth/github
 *   /api/auth/oauth/twitter
 */

type Provider = "google" | "github" | "twitter";

interface ProviderConfig {
  id: Provider;
  label: string;
  icon: ReactNode;
}

const PROVIDERS: ProviderConfig[] = [
  { id: "google", label: "Google", icon: <GoogleIcon /> },
  { id: "github", label: "GitHub", icon: <GitHubIcon /> },
  { id: "twitter", label: "X / Twitter", icon: <XIcon /> },
];

interface SocialAuthButtonsProps {
  /** Variasi label utama: "Lanjut" untuk login, "Daftar" untuk register. */
  intent?: "login" | "register";
}

export function SocialAuthButtons({ intent = "login" }: SocialAuthButtonsProps) {
  const verb = intent === "register" ? "Daftar" : "Lanjut";

  const handleClick = (provider: Provider) => {
    // OAuth belum diaktifkan; tampilkan toast netral.
    toast(`Login sosial (${labelOf(provider)}) belum diaktifkan`, "info");
  };

  return (
    <div className="space-y-2">
      {PROVIDERS.map((p) => (
        <SocialButton key={p.id} onClick={() => handleClick(p.id)}>
          <span className="grid h-5 w-5 place-items-center">{p.icon}</span>
          <span>
            {verb} dengan {p.label}
          </span>
        </SocialButton>
      ))}
    </div>
  );
}

function labelOf(p: Provider): string {
  return PROVIDERS.find((x) => x.id === p)?.label ?? p;
}

function SocialButton({
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={
        "flex w-full items-center justify-center gap-3 rounded-xl border border-paper-200 bg-white px-4 py-2.5 text-sm font-medium text-ink-700 shadow-sm transition " +
        "hover:bg-paper-100 focus:outline-none focus:ring-2 focus:ring-accent-400 focus:ring-offset-2 focus:ring-offset-paper-50 " +
        "dark:border-ink-700 dark:bg-ink-800 dark:text-paper-50 dark:hover:bg-ink-700 dark:focus:ring-offset-paper-900"
      }
      {...rest}
    >
      {children}
    </button>
  );
}

/* ===== Inline brand SVGs (no external assets) ===== */

function GoogleIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.4-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.6 16 18.9 13 24 13c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.4-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.2-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.1 5.6l6.2 5.2C40.9 36.1 44 30.5 44 24c0-1.2-.1-2.4-.4-3.5z"
      />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className="fill-ink-800 dark:fill-paper-50"
    >
      <path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.9 1.3 1.9 1.3 1.1 1.9 2.9 1.4 3.6 1 .1-.8.4-1.4.8-1.7-2.7-.3-5.5-1.3-5.5-6 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.4 1.2a11.6 11.6 0 0 1 6.1 0c2.3-1.5 3.4-1.2 3.4-1.2.6 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.7-2.8 5.7-5.5 6 .4.3.8 1 .8 2v3c0 .3.2.7.8.6A12 12 0 0 0 12 .3" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className="fill-ink-800 dark:fill-paper-50"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
