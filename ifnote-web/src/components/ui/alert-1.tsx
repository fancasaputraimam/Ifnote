"use client";

/**
 * Alert — ifNote-themed alert component.
 *
 * Used both standalone (e.g. inline page alerts) and inside our Toast
 * renderer (`components/feedback/Toast.tsx`). The visual language
 * matches the rest of the app: warm paper background, soft accent
 * stripe, rounded-notebook radius, dark-mode safe.
 *
 * Variants:
 *   primary | success | destructive | info | warning | secondary
 *
 * Appearances:
 *   light (default) — soft tint on paper background
 *   solid           — accent fill, white text (use sparingly)
 *
 * Composition:
 *   <Alert variant="success" close onClose={...}>
 *     <AlertIcon>🌸</AlertIcon>
 *     <AlertContent>
 *       <AlertTitle>Title</AlertTitle>
 *       <AlertDescription>Description</AlertDescription>
 *     </AlertContent>
 *     <AlertToolbar>...</AlertToolbar>
 *   </Alert>
 *
 * Note:
 *  - This is an unopinionated visual primitive. It does NOT manage
 *    auto-dismiss, stacking, or store state — that's the Toast
 *    renderer's job.
 *  - Use lucide-react `X` for the close affordance, but keep emoji
 *    visible inside the icon slot — emoji are part of our copy
 *    system per the project spec.
 */

import {
  createContext,
  forwardRef,
  HTMLAttributes,
  ReactNode,
  useContext,
} from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

// ----------------------------------------------------------------------
// Variant tokens
// ----------------------------------------------------------------------

const alertVariants = cva(
  cn(
    "relative w-full overflow-hidden rounded-notebook border ring-1 backdrop-blur",
    "shadow-notebook",
  ),
  {
    variants: {
      variant: {
        primary: cn(
          "border-accent-200/80 bg-accent-50/80 ring-accent-200/40",
          "dark:border-accent-500/40 dark:bg-accent-700/15 dark:ring-accent-500/20",
        ),
        success: cn(
          "border-leaf-500/30 bg-leaf-500/5 ring-leaf-500/20",
          "dark:border-leaf-500/40 dark:bg-leaf-500/10 dark:ring-leaf-500/20",
        ),
        destructive: cn(
          "border-rose-300/50 bg-rose-50/70 ring-rose-300/40",
          "dark:border-rose-500/40 dark:bg-rose-500/10 dark:ring-rose-500/30",
        ),
        info: cn(
          "border-accent-200/60 bg-paper-50/80 ring-accent-200/30",
          "dark:border-ink-700 dark:bg-ink-800/80 dark:ring-accent-500/20",
        ),
        warning: cn(
          "border-amber-300/50 bg-amber-50/70 ring-amber-300/40",
          "dark:border-amber-500/40 dark:bg-amber-500/10 dark:ring-amber-500/30",
        ),
        secondary: cn(
          "border-paper-200 bg-white/95 ring-paper-200/60",
          "dark:border-ink-700 dark:bg-ink-800/95 dark:ring-ink-700",
        ),
      },
      appearance: {
        light: "",
        solid: "",
      },
      size: {
        sm: "px-3 py-2.5 text-sm",
        md: "px-3.5 py-3 text-sm",
      },
    },
    compoundVariants: [
      // Solid appearance overrides — kept restrained to fit ifNote's
      // calm aesthetic. Most callers should stick with "light".
      {
        appearance: "solid",
        variant: "primary",
        class: "border-transparent bg-accent-500 text-white ring-accent-400/40",
      },
      {
        appearance: "solid",
        variant: "success",
        class: "border-transparent bg-leaf-500 text-white ring-leaf-500/40",
      },
      {
        appearance: "solid",
        variant: "destructive",
        class: "border-transparent bg-rose-500 text-white ring-rose-500/40",
      },
      {
        appearance: "solid",
        variant: "warning",
        class: "border-transparent bg-amber-500 text-white ring-amber-500/40",
      },
      {
        appearance: "solid",
        variant: "info",
        class: "border-transparent bg-accent-400 text-white ring-accent-300/40",
      },
      {
        appearance: "solid",
        variant: "secondary",
        class: "border-transparent bg-ink-800 text-paper-50 ring-ink-700/40",
      },
    ],
    defaultVariants: {
      variant: "primary",
      appearance: "light",
      size: "md",
    },
  },
);

// Per-variant left accent stripe. Toasts map each notification type to its
// own variant (success→leaf, error→destructive, dst — lihat VARIANT_TO_ALERT
// di Toast.tsx), jadi tiap toast membawa warna stripe-nya sendiri. Hanya
// `secondary` yang sengaja transparan, untuk alert inline yang netral.
const STRIPE: Record<NonNullable<AlertProps["variant"]>, string> = {
  primary: "bg-accent-500",
  success: "bg-leaf-500",
  destructive: "bg-rose-500",
  info: "bg-accent-500",
  warning: "bg-amber-500",
  secondary: "bg-transparent",
};

// Per-variant icon bubble background (only used when appearance="light").
// Toasts pick a colored bubble per type (lihat VARIANT_TO_ALERT di Toast.tsx).
// `secondary` uses a neutral paper bubble — dipakai alert inline yang netral.
const ICON_BUBBLE: Record<NonNullable<AlertProps["variant"]>, string> = {
  primary: "bg-accent-500/15 text-accent-600 dark:text-accent-300",
  success: "bg-leaf-500/15 text-leaf-600 dark:text-leaf-500",
  destructive: "bg-rose-500/15 text-rose-600 dark:text-rose-300",
  info: "bg-accent-500/15 text-accent-600 dark:text-accent-300",
  warning: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  secondary: "bg-paper-100 text-ink-700 dark:bg-ink-700/60 dark:text-paper-50",
};

// ----------------------------------------------------------------------
// Alert root
// ----------------------------------------------------------------------

export interface AlertProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  /** Show a close (X) button on the right. */
  close?: boolean;
  /** Called when the user clicks the close button. */
  onClose?: () => void;
  /** Children: Icon, Content, Toolbar (free composition). */
  children?: ReactNode;
}

export const Alert = forwardRef<HTMLDivElement, AlertProps>(function Alert(
  {
    variant = "primary",
    appearance = "light",
    size = "md",
    close,
    onClose,
    className,
    children,
    role = "status",
    ...rest
  },
  ref,
) {
  const v = (variant ?? "primary") as NonNullable<AlertProps["variant"]>;
  return (
    <div
      ref={ref}
      role={role}
      className={cn(alertVariants({ variant, appearance, size }), className)}
      {...rest}
    >
      <span aria-hidden className={cn("absolute inset-y-0 left-0 w-1", STRIPE[v])} />
      <div className="flex items-start gap-3 pl-3">
        {/* Children render in flow: Icon, Content, Toolbar.
            Each subcomponent positions itself; we just provide the row. */}
        <AlertVariantContext.Provider value={{ variant: v, appearance: appearance ?? "light" }}>
          {children}
        </AlertVariantContext.Provider>
        {close ? (
          <button
            type="button"
            aria-label="Tutup notifikasi"
            onClick={onClose}
            className={cn(
              "ml-auto shrink-0 rounded-full p-1 transition-colors",
              appearance === "solid"
                ? "text-white/80 hover:bg-white/10 hover:text-white"
                : "text-ink-400 hover:bg-paper-100 hover:text-ink-700 dark:hover:bg-ink-700 dark:hover:text-paper-50",
            )}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>
    </div>
  );
});

// ----------------------------------------------------------------------
// Variant context — lets AlertIcon pick its bubble color without prop drilling
// ----------------------------------------------------------------------

interface AlertVariantCtx {
  variant: NonNullable<AlertProps["variant"]>;
  appearance: NonNullable<AlertProps["appearance"]>;
}
const AlertVariantContext = createContext<AlertVariantCtx>({
  variant: "primary",
  appearance: "light",
});

// ----------------------------------------------------------------------
// Subcomponents
// ----------------------------------------------------------------------

interface AlertIconProps extends HTMLAttributes<HTMLSpanElement> {
  /** Icon node — emoji string, lucide icon, or any small element. */
  children?: ReactNode;
}

export function AlertIcon({ className, children, ...rest }: AlertIconProps) {
  const { variant, appearance } = useContext(AlertVariantContext);
  return (
    <span
      aria-hidden
      className={cn(
        "mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl text-base leading-none",
        appearance === "solid"
          ? "bg-white/15 text-white"
          : ICON_BUBBLE[variant],
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}

interface AlertContentProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

export function AlertContent({ className, children, ...rest }: AlertContentProps) {
  return (
    <div className={cn("min-w-0 flex-1 pt-0.5", className)} {...rest}>
      {children}
    </div>
  );
}

interface AlertTitleProps extends HTMLAttributes<HTMLParagraphElement> {
  children?: ReactNode;
}

export function AlertTitle({ className, children, ...rest }: AlertTitleProps) {
  const { appearance } = useContext(AlertVariantContext);
  return (
    <p
      className={cn(
        "break-words text-sm font-semibold leading-snug",
        appearance === "solid"
          ? "text-white"
          : "text-ink-800 dark:text-paper-50",
        className,
      )}
      {...rest}
    >
      {children}
    </p>
  );
}

interface AlertDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {
  children?: ReactNode;
}

export function AlertDescription({
  className,
  children,
  ...rest
}: AlertDescriptionProps) {
  const { appearance } = useContext(AlertVariantContext);
  return (
    <p
      className={cn(
        "mt-0.5 break-words text-xs leading-relaxed",
        appearance === "solid"
          ? "text-white/85"
          : "text-ink-700 dark:text-paper-50/80",
        className,
      )}
      {...rest}
    >
      {children}
    </p>
  );
}

interface AlertToolbarProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

export function AlertToolbar({ className, children, ...rest }: AlertToolbarProps) {
  return (
    <div
      className={cn("mt-2 flex flex-wrap items-center gap-2", className)}
      {...rest}
    >
      {children}
    </div>
  );
}

export { alertVariants };
