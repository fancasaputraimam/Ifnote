"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

/**
 * Cadangan untuk tombol mailto: kalau perangkat tidak punya aplikasi email,
 * mailto tidak berbuat apa-apa. Tombol ini menyalin alamatnya.
 */
export function CopyEmailButton({ email }: { email: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setState("copied");
    } catch {
      setState("failed");
    }
  };

  return (
    <div className="space-y-2">
      <Button type="button" variant="secondary" onClick={copy} className="min-h-11 w-full">
        {state === "copied" ? "Alamat tersalin" : "Salin alamat email"}
      </Button>
      <p aria-live="polite" className="text-center text-xs text-ink-400">
        {state === "failed" ? `Tidak bisa menyalin otomatis. Alamatnya: ${email}` : null}
      </p>
    </div>
  );
}
