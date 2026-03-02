"use client";

import { animate, useInView, useMotionValue, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

interface AnimatedCountProps {
  value: number;
  duration?: number;
  formatter?: (value: number) => string;
}

function defaultFormatter(value: number): string {
  return String(Math.round(value));
}

export function AnimatedCount({
  value,
  duration = 1.2,
  formatter = defaultFormatter,
}: AnimatedCountProps) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLSpanElement | null>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const motionValue = useMotionValue(reduceMotion ? value : 0);
  const [displayValue, setDisplayValue] = useState(() => formatter(reduceMotion ? value : 0));

  useEffect(() => {
    if (reduceMotion || !inView) return;

    const controls = animate(motionValue, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => {
        setDisplayValue(formatter(latest));
      },
    });

    return () => controls.stop();
  }, [duration, formatter, inView, motionValue, reduceMotion, value]);

  if (reduceMotion) {
    return <span ref={ref}>{formatter(value)}</span>;
  }

  return <span ref={ref}>{displayValue}</span>;
}
