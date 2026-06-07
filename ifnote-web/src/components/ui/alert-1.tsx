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
    // Clean neutral surface — NO colored edges (top/bottom/sides). Color is
    // carried only by the icon bubble. A neutral hairline ring + soft shadow
    // keep it crisp on both paper and dark surfaces.
    "relative w-full overflow-hidden rounded-notebook bg-white shadow-notebook-md ring-1 ring-inset ring-paper-200/90",
    "dark:bg-ink-800 dark:ring-ink-700",
  ),
  {
    variants: {
      variant: {
        primary: "",
        success: "",
        destructive: "",
        info: "",
        warning: "",
        secondary: "",
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
      // Solid appearance — colored fill (rare; not used by the notification
      // system). Kept for standalone callers that explicitly opt in.
      {
        appearance: "solid",
        variant: "primary",
        class: "bg-accent-500 text-white ring-transparent",
      },
      {
        appearance: "solid",
        variant: "success",
        class: "bg-leaf-500 text-white ring-transparent",
      },
      {
        appearance: "solid",
        variant: "destructive",
        class: "bg-rose-500 text-white ring-transparent",
      },
      {
        appearance: "solid",
        variant: "warning",
        class: "bg-amber-500 text-white ring-transparent",
      },
      {
        appearance: "solid",
        variant: "info",
        class: "bg-accent-400 text-white ring-transparent",
      },
      {
        appearance: "solid",
        variant: "secondary",
        class: "bg-ink-800 text-paper-50 ring-transparent",
      },
    ],
    defaultVariants: {
      variant: "primary",
      appearance: "light",
      size: "md",
    },
  },
);

// Per-variant icon bubble background — the ONLY place color appears, so each
// notification type stays recognisable without coloring the card edges.
// Toasts pick a colored bubble per type (lihat VARIANT_TO_ALERT di Toast.tsx).
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
      <div className="flex items-start gap-3">
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
