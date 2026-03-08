"use client";

import { animate, useInView, useMotionValue, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { formatPrice } from "@/lib/formatting";

interface AnimatedCountProps {
  value: number;
  duration?: number;
  variant?: "integer" | "currency";
}

function formatAnimatedValue(value: number, variant: AnimatedCountProps["variant"]): string {
  if (variant === "currency") {
    return formatPrice(Math.round(value));
  }

  return String(Math.round(value));
}

export function AnimatedCount({
  value,
  duration = 1.2,
  variant = "integer",
}: AnimatedCountProps) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLSpanElement | null>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const motionValue = useMotionValue(reduceMotion ? value : 0);
  const [displayValue, setDisplayValue] = useState(() => formatAnimatedValue(reduceMotion ? value : 0, variant));

  useEffect(() => {
    if (reduceMotion || !inView) return;

    const controls = animate(motionValue, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => {
        setDisplayValue(formatAnimatedValue(latest, variant));
      },
    });

    return () => controls.stop();
  }, [duration, inView, motionValue, reduceMotion, value, variant]);

  if (reduceMotion) {
    return <span ref={ref}>{formatAnimatedValue(value, variant)}</span>;
  }

  return <span ref={ref}>{displayValue}</span>;
}
