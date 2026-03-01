"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

export function HeroParallaxBackdrop() {
  const reduceMotion = useReducedMotion();
  const { scrollY } = useScroll();
  const yLeft = useTransform(scrollY, [0, 800], [0, 90]);
  const yRight = useTransform(scrollY, [0, 800], [0, -70]);

  if (reduceMotion) {
    return null;
  }

  return (
    <>
      <motion.div
        style={{ y: yLeft }}
        className="pointer-events-none absolute -top-24 left-[-8%] h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl"
      />
      <motion.div
        style={{ y: yRight }}
        className="pointer-events-none absolute -bottom-24 right-[-6%] h-80 w-80 rounded-full bg-violet-500/20 blur-3xl"
      />
    </>
  );
}
