"use client";

/**
 * DropdownMenu — compound API bertema ifNote, dibangun tanpa Radix.
 *
 * Snippet asli (originui) butuh @radix-ui/react-dropdown-menu +
 * @radix-ui/react-icons + shadcn CSS vars (bg-popover, text-popover-
 * foreground, bg-accent, border-border) yang TIDAK ada di project ini.
 * Komponen ini memberi API yang setara tapi memakai token paper/ink/
 * accent + portal, jadi konsisten dengan komponen lain (Modal, Dialog).
 *
 * API:
 *   <DropdownMenu>
 *     <DropdownMenuTrigger asChild><button>…</button></DropdownMenuTrigger>
 *     <DropdownMenuContent align="end">
 *       <DropdownMenuLabel>…</DropdownMenuLabel>
 *       <DropdownMenuSeparator />
 *       <DropdownMenuGroup>
 *         <DropdownMenuItem onSelect={…}>…</DropdownMenuItem>
 *       </DropdownMenuGroup>
 *     </DropdownMenuContent>
 *   </DropdownMenu>
 */

import {
  cloneElement,
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

// ----------------------------------------------------------------------
// Context
// ----------------------------------------------------------------------

interface MenuCtx {
  open: boolean;
  setOpen: (v: boolean) => void;
  triggerRef: React.RefObject<HTMLElement>;
}
const MenuContext = createContext<MenuCtx | null>(null);
function useMenu(): MenuCtx {
  const ctx = useContext(MenuContext);
  if (!ctx) throw new Error("DropdownMenu subcomponents harus di dalam <DropdownMenu>");
  return ctx;
}

// ----------------------------------------------------------------------
// Root
// ----------------------------------------------------------------------

interface RootProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
}

function DropdownMenu({ open, onOpenChange, children }: RootProps) {
  const isControlled = open !== undefined;
  const [internal, setInternal] = useState(false);
  const actual = isControlled ? open : internal;
  const triggerRef = useRef<HTMLElement>(null);

  const setOpen = useCallback(
    (v: boolean) => {
      if (!isControlled) setInternal(v);
      onOpenChange?.(v);
    },
    [isControlled, onOpenChange],
  );

  return (
    <MenuContext.Provider value={{ open: actual, setOpen, triggerRef }}>
      {children}
    </MenuContext.Provider>
  );
}

// ----------------------------------------------------------------------
// Trigger
// ----------------------------------------------------------------------

interface TriggerProps {
  asChild?: boolean;
  children: ReactNode;
  className?: string;
}

type TriggerChildProps = {
  onClick?: (e: React.MouseEvent) => void;
  ref?: React.Ref<HTMLElement>;
  "aria-haspopup"?: string;
  "aria-expanded"?: boolean;
};

function DropdownMenuTrigger({ asChild, children, className }: TriggerProps) {
  const { open, setOpen, triggerRef } = useMenu();
  const toggle = () => setOpen(!open);

  if (asChild && isValidElement(children)) {
    const child = children as ReactElement<TriggerChildProps>;
    return cloneElement(child, {
      ref: triggerRef,
      "aria-haspopup": "menu",
      "aria-expanded": open,
      onClick: (e: React.MouseEvent) => {
        child.props.onClick?.(e);
        toggle();
      },
    });
  }
  return (
    <button
      type="button"
      ref={triggerRef as React.RefObject<HTMLButtonElement>}
      aria-haspopup="menu"
      aria-expanded={open}
      className={className}
      onClick={toggle}
    >
      {children}
    </button>
  );
}

// ----------------------------------------------------------------------
// Content (portal + positioned under trigger)
// ----------------------------------------------------------------------

interface ContentProps extends HTMLAttributes<HTMLDivElement> {
  /** Sisi horizontal anchor. Default "end" (kanan). */
  align?: "start" | "end";
  sideOffset?: number;
}

function DropdownMenuContent({
  className,
  children,
  align = "end",
  sideOffset = 6,
  ...props
}: ContentProps) {
  const { open, setOpen, triggerRef } = useMenu();
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; minWidth: number } | null>(
    null,
  );
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  // Posisikan menu di bawah trigger.
  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    const width = Math.max(r.width, 224); // min-w-56
    let left = align === "end" ? r.right - width : r.left;
    // Jaga agar tidak keluar viewport.
    const margin = 8;
    left = Math.min(Math.max(margin, left), window.innerWidth - width - margin);
    setPos({ top: r.bottom + sideOffset, left, minWidth: r.width });
  }, [open, align, sideOffset, triggerRef]);

  // Tutup saat klik di luar (trigger + menu).
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (menuRef.current?.contains(t)) return;
      if (triggerRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, setOpen, triggerRef]);

  if (!mounted || !pos) return null;

  // Strip DOM animation/drag handlers that conflict with MotionProps.
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

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          ref={menuRef}
          role="menu"
          className={cn(
            "fixed z-50 min-w-56 overflow-hidden rounded-notebook border border-paper-200 bg-white p-1 text-ink-800 shadow-notebook-md",
            "dark:border-ink-700 dark:bg-ink-800 dark:text-paper-50",
            className,
          )}
          style={{ top: pos.top, left: pos.left, transformOrigin: "top" }}
          initial={{ opacity: 0, scale: 0.95, y: -6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -6 }}
          transition={{ duration: 0.14, ease: [0.22, 0.61, 0.36, 1] }}
          {...safeProps}
        >
          {children}
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

// ----------------------------------------------------------------------
// Items / Label / Separator / Group
// ----------------------------------------------------------------------

interface ItemProps extends Omit<HTMLAttributes<HTMLButtonElement>, "onSelect"> {
  /** Dipanggil saat item dipilih; menu otomatis tertutup setelahnya. */
  onSelect?: () => void;
  /** Tampilan destruktif (mis. Keluar). */
  destructive?: boolean;
  disabled?: boolean;
}

function DropdownMenuItem({
  className,
  children,
  onSelect,
  destructive,
  disabled,
  ...props
}: ItemProps) {
  const { setOpen } = useMenu();
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={() => {
        if (disabled) return;
        onSelect?.();
        setOpen(false);
      }}
      className={cn(
        "flex w-full cursor-pointer select-none items-center gap-2 rounded-xl px-2.5 py-2 text-left text-sm outline-none transition-colors",
        "focus-visible:ring-2 focus-visible:ring-accent-400",
        "disabled:pointer-events-none disabled:opacity-50",
        destructive
          ? "text-rose-600 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-700/15"
          : "text-ink-700 hover:bg-paper-100 dark:text-paper-50 dark:hover:bg-ink-700",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function DropdownMenuLabel({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-2.5 py-2", className)} {...props} />;
}

function DropdownMenuSeparator({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="separator"
      className={cn("-mx-1 my-1 h-px bg-paper-200 dark:bg-ink-700", className)}
      {...props}
    />
  );
}

function DropdownMenuGroup({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div role="group" className={cn(className)} {...props} />;
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
};
