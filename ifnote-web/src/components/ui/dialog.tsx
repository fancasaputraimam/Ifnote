"use client";

/**
 * Dialog — compound API (Dialog / DialogTrigger / DialogContent / ...)
 * yang dibangun DI ATAS Modal bertema ifNote.
 *
 * Kenapa tidak pakai Radix seperti snippet asli?
 *   - Project ini TIDAK pakai radix-ui, shadcn CSS vars (--background,
 *     --border, --muted-foreground), tailwindcss-animate, sonner, atau
 *     next-themes. Menambah semua itu = sistem desain paralel yang
 *     bertabrakan dengan tema paper/ink/accent yang sudah ada.
 *   - Komponen ini memberi API yang sama (Dialog, DialogTrigger,
 *     DialogContent, DialogHeader, DialogFooter, DialogTitle,
 *     DialogDescription, DialogBody, DialogClose) tapi memakai `Modal`
 *     (portal + overlay + escape + scroll-lock) yang sudah dipakai 5
 *     dialog lain di app.
 *
 * Mendukung mode controlled (open + onOpenChange) dan uncontrolled.
 *
 * Contoh:
 *   <Dialog open={open} onOpenChange={setOpen}>
 *     <DialogTrigger asChild><Button>Buka</Button></DialogTrigger>
 *     <DialogContent>
 *       <DialogHeader>
 *         <DialogTitle>Judul</DialogTitle>
 *         <DialogDescription>Deskripsi</DialogDescription>
 *       </DialogHeader>
 *       <DialogBody>…</DialogBody>
 *       <DialogFooter>
 *         <DialogClose asChild><Button variant="ghost">Tutup</Button></DialogClose>
 *         <Button>Simpan</Button>
 *       </DialogFooter>
 *     </DialogContent>
 *   </Dialog>
 */

import {
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useState,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { cva, type VariantProps } from "class-variance-authority";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

// ----------------------------------------------------------------------
// Context
// ----------------------------------------------------------------------

interface DialogCtx {
  open: boolean;
  setOpen: (v: boolean) => void;
}
const DialogContext = createContext<DialogCtx | null>(null);

function useDialog(): DialogCtx {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error("Dialog subcomponents harus dipakai di dalam <Dialog>");
  return ctx;
}

// ----------------------------------------------------------------------
// Root
// ----------------------------------------------------------------------

interface DialogProps {
  /** Controlled open state. Kalau diisi, sediakan juga onOpenChange. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
  children?: ReactNode;
}

function Dialog({ open, onOpenChange, defaultOpen = false, children }: DialogProps) {
  const isControlled = open !== undefined;
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const actualOpen = isControlled ? open : internalOpen;

  const setOpen = (v: boolean) => {
    if (!isControlled) setInternalOpen(v);
    onOpenChange?.(v);
  };

  return (
    <DialogContext.Provider value={{ open: actualOpen, setOpen }}>
      {children}
    </DialogContext.Provider>
  );
}

// ----------------------------------------------------------------------
// Trigger / Close (support asChild)
// ----------------------------------------------------------------------

interface TriggerLikeProps {
  asChild?: boolean;
  children: ReactNode;
  className?: string;
}

type ClickableProps = { onClick?: (e: React.MouseEvent) => void };

function DialogTrigger({ asChild, children, className }: TriggerLikeProps) {
  const { setOpen } = useDialog();
  const open = () => setOpen(true);

  if (asChild && isValidElement(children)) {
    const child = children as ReactElement<ClickableProps>;
    return cloneElement(child, {
      onClick: (e: React.MouseEvent) => {
        child.props.onClick?.(e);
        open();
      },
    });
  }
  return (
    <button type="button" className={className} onClick={open}>
      {children}
    </button>
  );
}

function DialogClose({ asChild, children, className }: TriggerLikeProps) {
  const { setOpen } = useDialog();
  const close = () => setOpen(false);

  if (asChild && isValidElement(children)) {
    const child = children as ReactElement<ClickableProps>;
    return cloneElement(child, {
      onClick: (e: React.MouseEvent) => {
        child.props.onClick?.(e);
        close();
      },
    });
  }
  return (
    <button type="button" className={className} onClick={close}>
      {children}
    </button>
  );
}

// ----------------------------------------------------------------------
// Content
// ----------------------------------------------------------------------

const dialogContentVariants = cva(
  cn(
    "relative flex w-full flex-col overflow-y-auto bg-white shadow-notebook-md outline-none",
    "max-h-[92vh] dark:bg-ink-800",
  ),
  {
    variants: {
      variant: {
        default: "sm:max-w-lg rounded-t-notebook sm:rounded-notebook",
        fullscreen: "h-full max-h-none rounded-none sm:inset-5",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

interface DialogContentProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof dialogContentVariants> {
  showCloseButton?: boolean;
  overlay?: boolean;
}

function DialogContent({
  className,
  children,
  variant,
  showCloseButton = true,
  overlay = true,
  ...props
}: DialogContentProps) {
  const { open, setOpen } = useDialog();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  if (!mounted) return null;

  // framer-motion's MotionProps redefine onAnimationStart/Drag handlers,
  // so strip the DOM versions before spreading onto motion.div.
  const {
    onAnimationStart: _as,
    onAnimationEnd: _ae,
    onAnimationIteration: _ai,
    onDrag: _od,
    onDragStart: _ods,
    onDragEnd: _ode,
    onTransitionEnd: _ote,
    ...safeProps
  } = props;

  const node = (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
          {overlay ? (
            <motion.div
              className="absolute inset-0 bg-ink-800/40 backdrop-blur-[2px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setOpen(false)}
            />
          ) : null}
          <motion.div
            role="dialog"
            aria-modal="true"
            className={cn(
              "relative",
              dialogContentVariants({ variant }),
              "p-6",
              className,
            )}
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 12 }}
            transition={{ duration: 0.18, ease: [0.22, 0.61, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            {...safeProps}
          >
            {children}
            {showCloseButton ? (
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Tutup"
                className="absolute right-4 top-4 rounded-full p-1.5 text-ink-400 transition-colors hover:bg-paper-100 hover:text-ink-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 dark:hover:bg-ink-700 dark:hover:text-paper-50"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Tutup</span>
              </button>
            ) : null}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );

  return createPortal(node, document.body);
}

// ----------------------------------------------------------------------
// Layout subcomponents
// ----------------------------------------------------------------------

function DialogHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("mb-4 flex flex-col space-y-1 text-center sm:text-start", className)}
      {...props}
    />
  );
}

function DialogFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse gap-2 pt-5 sm:flex-row sm:justify-end",
        className,
      )}
      {...props}
    />
  );
}

function DialogBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("grow", className)} {...props} />;
}

function DialogTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn(
        "text-lg font-semibold leading-snug tracking-tight text-ink-800 dark:text-paper-50",
        className,
      )}
      {...props}
    />
  );
}

function DialogDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-sm text-ink-400", className)} {...props} />
  );
}

export {
  Dialog,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogBody,
  DialogTitle,
  DialogDescription,
};
