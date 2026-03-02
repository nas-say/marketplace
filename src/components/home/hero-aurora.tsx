"use client";

import { motion, useReducedMotion } from "framer-motion";

export function HeroAurora() {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return (
      <>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(129,140,248,0.22),transparent_45%),radial-gradient(circle_at_82%_24%,rgba(34,211,238,0.18),transparent_42%),radial-gradient(circle_at_65%_78%,rgba(167,139,250,0.14),transparent_48%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.045]"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.8) 0.45px, transparent 0.45px)",
            backgroundSize: "3px 3px",
          }}
        />
      </>
    );
  }

  return (
    <>
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-[-28%] h-[520px] w-[520px] rounded-full bg-indigo-500/30 blur-[120px]"
        animate={{ x: [0, 80, 25, 0], y: [0, 55, 20, 0], scale: [1, 1.08, 0.98, 1] }}
        transition={{ duration: 24, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute right-[-12%] top-[8%] h-[480px] w-[480px] rounded-full bg-cyan-400/20 blur-[110px]"
        animate={{ x: [0, -70, -20, 0], y: [0, 80, 30, 0], scale: [1, 1.1, 1, 1] }}
        transition={{ duration: 26, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 1.2 }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute bottom-[-34%] left-[30%] h-[540px] w-[540px] rounded-full bg-violet-500/20 blur-[130px]"
        animate={{ x: [0, 55, -30, 0], y: [0, -40, -70, 0], scale: [1.02, 0.96, 1.08, 1.02] }}
        transition={{ duration: 28, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 0.6 }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.055] mix-blend-soft-light"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.85) 0.45px, transparent 0.45px)",
          backgroundSize: "3px 3px",
        }}
        animate={{ x: [0, 26, -18, 0], y: [0, -18, 22, 0] }}
        transition={{ duration: 30, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
      />
    </>
  );
}
