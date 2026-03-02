"use client";

import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import type { MouseEvent, ReactNode } from "react";

interface MagneticButtonProps {
  children: ReactNode;
  className?: string;
}

export function MagneticButton({ children, className }: MagneticButtonProps) {
  const reduceMotion = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 320, damping: 24, mass: 0.7 });
  const springY = useSpring(y, { stiffness: 320, damping: 24, mass: 0.7 });

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    if (reduceMotion) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const offsetX = event.clientX - (rect.left + rect.width / 2);
    const offsetY = event.clientY - (rect.top + rect.height / 2);
    x.set(offsetX * 0.18);
    y.set(offsetY * 0.22);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={reduceMotion ? undefined : { x: springX, y: springY }}
    >
      {children}
    </motion.div>
  );
}
