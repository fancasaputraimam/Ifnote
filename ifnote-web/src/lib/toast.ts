/**
 * Public notification API for ifNote.
 *
 * Use these helpers across the app — do not call the legacy `toast()` shim
 * or any underlying library directly. This keeps copy, position, theme,
 * timing, and emoji set consistent across screens.
 *
 *   notify.success("Kotoba disimpan", "Catatan baru sudah masuk ke daftar kamu.")
 *   notify.error("Gagal menyimpan", "Coba lagi sebentar.")
 *   notify.info("Info", "Pesan netral.")
 *   notify.warning("Perlu dicek", "Lengkapi data yang masih kosong.")
 *
 *   const id = notify.loading("AI sedang menganalisa", "Tunggu sebentar ya.")
 *   notify.success("Analisa selesai", "Periksa hasilnya.", { id })
 *
 *   notify.promise(myPromise, {
 *     loading: { title: "Memproses…" },
 *     success: { title: "Berhasil" },
 *     error:   { title: "Gagal" },
 *   })
 *
 * The `id` returned by every call can be passed to `notify.dismiss(id)`,
 * `notify.update(id, ...)`, or as `{ id }` in subsequent calls so a
 * loading toast morphs into success/error in place.
 */

import {
  toastStore,
  type ToastAction,
  type ToastInput,
  type ToastVariant,
} from "@/components/feedback/Toast";
import { mapApiErrorToUserMessage } from "@/lib/error-mapper";

// ----------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------

export interface NotifyOptions {
  /** Optional emoji/icon override. */
  icon?: string;
  /** Auto-dismiss in ms. 0 = manual only. */
  duration?: number;
  /** Optional action button. */
  action?: ToastAction;
  /**
   * If provided, updates the existing toast with this id instead of pushing
   * a new one. Useful for upgrading a loading toast to success/error.
   */
  id?: number;
}

interface PromiseMessages<T> {
  loading: { title: string; message?: string; icon?: string };
  success:
    | { title: string; message?: string; icon?: string }
    | ((value: T) => { title: string; message?: string; icon?: string });
  error:
    | { title: string; message?: string; icon?: string }
    | ((err: unknown) => { title: string; message?: string; icon?: string });
}

// ----------------------------------------------------------------------
// Internal builder
// ----------------------------------------------------------------------

function pushOrUpdate(
  variant: ToastVariant,
  title: string,
  message: string | undefined,
  opts: NotifyOptions | undefined,
): number {
  const input: ToastInput = {
    variant,
    title,
    message,
    icon: opts?.icon,
    duration: opts?.duration,
    action: opts?.action,
  };
  if (opts?.id !== undefined) {
    toastStore.update(opts.id, input);
    return opts.id;
  }
  return toastStore.add(input);
}

// ----------------------------------------------------------------------
// Public API
// ----------------------------------------------------------------------

export const notify = {
  success(title: string, message?: string, opts?: NotifyOptions): number {
    return pushOrUpdate("success", title, message, opts);
  },
  error(title: string, message?: string, opts?: NotifyOptions): number {
    return pushOrUpdate("error", title, message, opts);
  },
  warning(title: string, message?: string, opts?: NotifyOptions): number {
    return pushOrUpdate("warning", title, message, opts);
  },
  info(title: string, message?: string, opts?: NotifyOptions): number {
    return pushOrUpdate("info", title, message, opts);
  },
  loading(title: string, message?: string, opts?: NotifyOptions): number {
    // Loading toasts default to manual dismiss — caller is expected to
    // upgrade them via notify.success/error with `{ id }`.
    return pushOrUpdate("loading", title, message, opts);
  },

  /** Dismiss a single toast by id. */
  dismiss(id: number): void {
    toastStore.remove(id);
  },

  /** Dismiss every visible toast. */
  clear(): void {
    toastStore.clear();
  },

  /**
   * Convenience: maps a thrown ApiError/network error to a friendly
   * user-facing toast. Keeps console raw error untouched in dev.
   */
  apiError(err: unknown, opts?: NotifyOptions): number {
    const m = mapApiErrorToUserMessage(err);
    return pushOrUpdate(m.variant, m.title, m.message, opts);
  },

  /**
   * Drive a loading → success/error toast from a Promise.
   * Returns the same promise so callers can `await` it.
   */
  async promise<T>(
    promise: Promise<T> | (() => Promise<T>),
    messages: PromiseMessages<T>,
  ): Promise<T> {
    const id = toastStore.add({
      variant: "loading",
      title: messages.loading.title,
      message: messages.loading.message,
      icon: messages.loading.icon,
    });
    try {
      const value = await (typeof promise === "function" ? promise() : promise);
      const ok =
        typeof messages.success === "function"
          ? messages.success(value)
          : messages.success;
      toastStore.update(id, {
        variant: "success",
        title: ok.title,
        message: ok.message,
        icon: ok.icon,
      });
      return value;
    } catch (e) {
      const fail =
        typeof messages.error === "function"
          ? messages.error(e)
          : messages.error;
      toastStore.update(id, {
        variant: "error",
        title: fail.title,
        message: fail.message,
        icon: fail.icon,
      });
      throw e;
    }
  },
};

export type Notify = typeof notify;
