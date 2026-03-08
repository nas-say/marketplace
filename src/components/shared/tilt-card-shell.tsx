"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useMotionProfile } from "./use-motion-profile";

interface TiltCardShellProps {
  children: ReactNode;
  className?: string;
  overlayClassName?: string;
}

export function TiltCardShell({ children, className, overlayClassName }: TiltCardShellProps) {
  const { prefersReducedMotion, isMobile } = useMotionProfile();

  const enableLift = !prefersReducedMotion;

  return (
    <motion.div
      className={cn("group relative h-full will-change-transform", className)}
      whileHover={enableLift ? (isMobile ? { y: -2 } : { y: -4, scale: 1.006 }) : undefined}
      transition={
        isMobile
          ? { duration: 0.18, ease: [0.22, 1, 0.36, 1] }
          : { type: "spring", stiffness: 300, damping: 28, mass: 0.9 }
      }
    >
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 z-[1] opacity-0 transition-opacity duration-200 group-hover:opacity-100",
          overlayClassName,
          "bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.12),transparent_46%)]"
        )}
      />
      <div className="relative z-[2] h-full">{children}</div>
    </motion.div>
  );
}
