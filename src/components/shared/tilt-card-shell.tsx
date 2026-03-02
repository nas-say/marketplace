"use client";

import { motion, useMotionTemplate, useMotionValue, useSpring } from "framer-motion";
import type { MouseEvent, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useMotionProfile } from "./use-motion-profile";

interface TiltCardShellProps {
  children: ReactNode;
  className?: string;
  overlayClassName?: string;
}

export function TiltCardShell({ children, className, overlayClassName }: TiltCardShellProps) {
  const { prefersReducedMotion, isMobile } = useMotionProfile();

  const enableTilt = !prefersReducedMotion && !isMobile;
  const enableLift = !prefersReducedMotion;

  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const lightX = useMotionValue(50);
  const lightY = useMotionValue(50);

  const springRotateX = useSpring(rotateX, { stiffness: 240, damping: 24, mass: 0.7 });
  const springRotateY = useSpring(rotateY, { stiffness: 240, damping: 24, mass: 0.7 });
  const cursorGlow = useMotionTemplate`radial-gradient(220px circle at ${lightX}% ${lightY}%, rgba(34,211,238,0.24), rgba(99,102,241,0.14) 38%, transparent 72%)`;

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    if (!enableTilt) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;

    lightX.set(px * 100);
    lightY.set(py * 100);
    rotateY.set((px - 0.5) * 9);
    rotateX.set((0.5 - py) * 9);
  };

  const handleMouseLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
    lightX.set(50);
    lightY.set(50);
  };

  return (
    <motion.div
      className={cn("group relative h-full will-change-transform", className)}
      style={
        enableTilt
          ? {
              rotateX: springRotateX,
              rotateY: springRotateY,
              transformPerspective: 1100,
              transformStyle: "preserve-3d",
            }
          : undefined
      }
      whileHover={enableLift ? (isMobile ? { y: -2 } : { y: -6, scale: 1.01 }) : undefined}
      transition={
        isMobile
          ? { duration: 0.18, ease: [0.22, 1, 0.36, 1] }
          : { type: "spring", stiffness: 280, damping: 24, mass: 0.85 }
      }
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {enableTilt && (
        <motion.div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-0 z-[1] opacity-0 transition-opacity duration-200 group-hover:opacity-100",
            overlayClassName
          )}
          style={{ background: cursorGlow, mixBlendMode: "screen" }}
        />
      )}
      <div className="relative z-[2] h-full">{children}</div>
    </motion.div>
  );
}
