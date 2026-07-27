"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";

/**
 * Transisi antar halaman (App Router). Di-key dengan pathname sehingga
 * setiap navigasi me-remount kontennya dan memutar animasi masuk:
 * fade + naik halus + blur tipis yang menajam — terasa seperti membuka
 * halaman baru buku catatan.
 *
 * Enter-only by design: exit animation di App Router butuh menahan
 * router context halaman lama (rawan bug), sementara RouteProgress
 * sudah memberi feedback saat navigasi berlangsung.
 */
export function PageTransition({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const pathname = usePathname();
  const reduce = useReducedMotion();

  return (
    <motion.div
      key={pathname}
      initial={reduce ? false : { opacity: 0, y: 12, filter: "blur(3px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.3, ease: [0.22, 0.61, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
