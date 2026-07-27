"use client";

import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

/**
 * Dialog konfirmasi (Sumi & Washi): stempel kanji miring di header —
 * 確 ("pastikan") untuk aksi biasa, 警 ("awas") merah untuk destruktif.
 * API tidak berubah.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Lanjut",
  cancelLabel = "Batal",
  destructive,
  onConfirm,
  onClose,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader className="mb-2">
          <div className="flex items-start gap-3 text-left">
            <span
              aria-hidden
              className={cn(
                "grid h-11 w-11 shrink-0 -rotate-3 place-items-center rounded-[11px] font-serif text-lg ring-1 ring-inset",
                destructive
                  ? "bg-rose-50 text-rose-600 ring-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-400/30"
                  : "bg-accent-50 text-accent-600 ring-accent-200 dark:bg-accent-500/15 dark:text-accent-200 dark:ring-accent-400/30",
              )}
            >
              {destructive ? "警" : "確"}
            </span>
            <div className="min-w-0 pt-0.5">
              <DialogTitle className="font-serif">{title}</DialogTitle>
              {description ? (
                <DialogDescription className="mt-1">{description}</DialogDescription>
              ) : null}
            </div>
          </div>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? "danger" : "primary"}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
