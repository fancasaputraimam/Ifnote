"use client";

/**
 * Alert — prop-based alert untuk inline page alerts (banner di dalam
 * halaman/section). API sederhana: `icon` + `title` + `variant` +
 * `dismissible`, children sebagai body.
 *
 * Berbeda dengan `alert-1.tsx` (composition API yang dipakai sistem
 * Toast). Pakai komponen ini untuk alert statis di dalam konten —
 * mis. notice di Settings, peringatan di form, info di halaman.
 *
 * Sudah disesuaikan dengan tema ifNote (calm Japanese notebook):
 *   - palet paper / ink / accent / leaf / rose / amber (bukan --hu-* vars)
 *   - radius rounded-notebook, shadow-notebook
 *   - dark-mode safe, animasi framer-motion
 *
 * Variants: default | info | success | warning | destructive
 */

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { AnimatePresence, motion } from "framer-motion";
import { type LucideIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";

const alertVariants = cva(
  "relative w-full overflow-hidden rounded-notebook border p-4 text-sm shadow-notebook transition-colors",
  {
    variants: {
      variant: {
        default: cn(
          "border-paper-200 bg-white text-ink-800",
          "dark:border-ink-700 dark:bg-ink-800 dark:text-paper-50",
          "[&>svg]:text-ink-400",
        ),
        info: cn(
          "border-accent-200/70 bg-accent-50/70 text-accent-800",
          "dark:border-accent-500/40 dark:bg-accent-700/15 dark:text-accent-100",
          "[&>svg]:text-accent-600 dark:[&>svg]:text-accent-300",
        ),
        success: cn(
          "border-leaf-500/30 bg-leaf-500/10 text-leaf-700",
          "dark:border-leaf-500/40 dark:bg-leaf-500/10 dark:text-leaf-500",
          "[&>svg]:text-leaf-600 dark:[&>svg]:text-leaf-500",
        ),
        warning: cn(
          "border-amber-300/60 bg-amber-50 text-amber-800",
          "dark:border-amber-500/40 dark:bg-amber-950/30 dark:text-amber-200",
          "[&>svg]:text-amber-600 dark:[&>svg]:text-amber-400",
        ),
        destructive: cn(
          "border-rose-300/60 bg-rose-50 text-rose-700",
          "dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200",
          "[&>svg]:text-rose-600 dark:[&>svg]:text-rose-300",
        ),
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  icon?: LucideIcon;
  title?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
  { className, variant, icon: Icon, title, dismissible, onDismiss, children, ...props },
  ref,
) {
  const [isVisible, setIsVisible] = React.useState(true);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => onDismiss?.(), 150); // match exit animation
  };

  // Buang prop yang bentrok dengan framer-motion.
  const {
    onDrag,
    onDragStart,
    onDragEnd,
    onAnimationStart,
    onAnimationEnd,
    onAnimationIteration,
    onTransitionEnd,
    ...motionProps
  } = props;

  return (
    <AnimatePresence>
      {isVisible ? (
        <motion.div
          ref={ref}
          className={cn(alertVariants({ variant }), className)}
          initial={{ opacity: 0, y: -10, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.97 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          role="alert"
          {...motionProps}
        >
          <div className="flex">
            {Icon ? (
              <div className="flex-shrink-0">
                <Icon className="mt-0.5 h-4 w-4" />
              </div>
            ) : null}
            <div className={cn("flex-1", Icon && "ml-3")}>
              {title ? (
                <h3 className="mb-1 text-sm font-semibold leading-snug">
                  {title}
                </h3>
              ) : null}
              <div className={cn("text-sm leading-relaxed", title && "opacity-90")}>
                {children}
              </div>
            </div>
            {dismissible ? (
              <div className="ml-3 flex-shrink-0">
                <button
                  type="button"
                  className="inline-flex rounded-full p-1.5 transition-colors hover:bg-black/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 dark:hover:bg-white/10"
                  onClick={handleDismiss}
                  aria-label="Tutup alert"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : null}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
});

Alert.displayName = "Alert";

export { Alert, alertVariants };
