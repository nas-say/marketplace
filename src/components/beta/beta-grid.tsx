"use client";

import { BetaTest } from "@/types/beta-test";
import { BetaCard } from "./beta-card";
import { motion, useReducedMotion } from "framer-motion";
import { useMotionProfile } from "@/components/shared/use-motion-profile";

interface BetaGridProps {
  betaTests: BetaTest[];
}

export function BetaGrid({ betaTests }: BetaGridProps) {
  const reduceMotion = useReducedMotion();
  const { isMobile } = useMotionProfile();
  const disableHeavyMotion = reduceMotion || isMobile;

  if (betaTests.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-zinc-500">No beta tests found matching your filters.</p>
      </div>
    );
  }

  return (
    <motion.div
      className="grid auto-rows-fr grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
      initial={disableHeavyMotion ? undefined : "hidden"}
      animate={disableHeavyMotion ? undefined : "visible"}
      variants={
        disableHeavyMotion
          ? undefined
          : {
              hidden: {},
              visible: {
                transition: {
                  staggerChildren: 0.05,
                },
              },
            }
      }
    >
      {betaTests.map((bt) => (
        <motion.div
          key={bt.id}
          className="h-full"
          variants={
            disableHeavyMotion
              ? undefined
              : {
                  hidden: { opacity: 0, y: 14 },
                  visible: { opacity: 1, y: 0 },
                }
          }
          transition={
            isMobile
              ? { duration: 0.2, ease: [0.22, 1, 0.36, 1] }
              : { duration: 0.35, ease: [0.22, 1, 0.36, 1] }
          }
        >
          <BetaCard betaTest={bt} />
        </motion.div>
      ))}
    </motion.div>
  );
}
