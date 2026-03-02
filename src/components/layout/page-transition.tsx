"use client";

import { motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useMotionProfile } from "@/components/shared/use-motion-profile";

interface PageTransitionProps {
  children: ReactNode;
}

const ROUTE_ORDER: Record<string, number> = {
  "": 0,
  browse: 1,
  beta: 2,
  create: 3,
  dashboard: 4,
  connects: 5,
  "how-it-works": 6,
  settings: 7,
  listing: 8,
  seller: 9,
  admin: 10,
};

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const { isMobile } = useMotionProfile();
  const activeSegment = pathname.split("/").filter(Boolean)[0] ?? "";
  const order = ROUTE_ORDER[activeSegment] ?? 0;
  const direction = order % 2 === 0 ? 1 : -1;

  const disableHeavyMotion = reduceMotion || isMobile;

  return (
    <motion.div
      key={pathname}
      className="relative"
      initial={
        disableHeavyMotion
          ? { opacity: 1, y: 0, x: 0, filter: "blur(0px)", scale: 1 }
          : {
              opacity: 0.92,
              y: 6,
              x: direction > 0 ? 10 : -10,
              filter: "blur(2px)",
              scale: 0.998,
            }
      }
      animate={{ opacity: 1, y: 0, x: 0, filter: "blur(0px)", scale: 1 }}
      transition={
        isMobile
          ? { duration: 0.12, ease: [0.22, 1, 0.36, 1] }
          : { duration: 0.22, ease: [0.22, 1, 0.36, 1] }
      }
    >
      {children}
    </motion.div>
  );
}
