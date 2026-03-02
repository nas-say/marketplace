"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import type { ReactNode } from "react";

type SectionVariant = "rise" | "drift-left" | "drift-right" | "zoom-in" | "tilt-up";

interface SectionRevealProps {
  children: ReactNode;
  delay?: number;
  variant?: SectionVariant;
}

function clampUnit(value: number): number {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

export function SectionReveal({ children, delay = 0, variant = "rise" }: SectionRevealProps) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 92%", "end 15%"],
  });

  const revealProgress = useTransform(scrollYProgress, (value) => {
    const start = Math.min(Math.max(delay * 0.8, 0), 0.35);
    return clampUnit((value - start) / (1 - start));
  });

  const opacity = useTransform(revealProgress, [0, 0.2, 1], [0, 1, 1]);
  const riseY = useTransform(revealProgress, [0, 1], [30, 0]);
  const leftX = useTransform(revealProgress, [0, 1], [52, 0]);
  const rightX = useTransform(revealProgress, [0, 1], [-52, 0]);
  const driftY = useTransform(revealProgress, [0, 1], [18, 0]);
  const zoomScale = useTransform(revealProgress, [0, 1], [0.94, 1]);
  const zoomY = useTransform(revealProgress, [0, 1], [24, 0]);
  const tiltY = useTransform(revealProgress, [0, 1], [34, 0]);
  const tiltRotate = useTransform(revealProgress, [0, 1], [2.8, 0]);

  if (reduceMotion) {
    return <>{children}</>;
  }

  const variantStyle =
    variant === "drift-left"
      ? { x: leftX, y: driftY }
      : variant === "drift-right"
        ? { x: rightX, y: driftY }
        : variant === "zoom-in"
          ? { scale: zoomScale, y: zoomY }
          : variant === "tilt-up"
            ? { y: tiltY, rotateX: tiltRotate, transformPerspective: 1200 }
            : { y: riseY };

  return (
    <motion.div
      ref={ref}
      style={{
        opacity,
        ...variantStyle,
      }}
    >
      {children}
    </motion.div>
  );
}
