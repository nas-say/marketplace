"use client";

import Link from "next/link";
import { motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { ArrowRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/data";
import { AnimatedCount } from "./animated-count";
import { MagneticButton } from "./magnetic-button";
import type { MouseEvent } from "react";

interface HeroClientProps {
  listingsCount: number;
  betaTestsCount: number;
  totalSalesValue: number;
}

export function HeroClient({ listingsCount, betaTestsCount, totalSalesValue }: HeroClientProps) {
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();

  const titleY = useTransform(scrollYProgress, [0, 0.28], [0, 56]);
  const titleOpacity = useTransform(scrollYProgress, [0, 0.2, 0.34], [1, 1, 0.55]);
  const ctaY = useTransform(scrollYProgress, [0, 0.25], [0, 26]);
  const ctaOpacity = useTransform(scrollYProgress, [0, 0.24, 0.36], [1, 1, 0.65]);

  const mouseX = useMotionValue(-9999);
  const mouseY = useMotionValue(-9999);
  const smoothX = useSpring(mouseX, { stiffness: 280, damping: 28, mass: 0.8 });
  const smoothY = useSpring(mouseY, { stiffness: 280, damping: 28, mass: 0.8 });
  const spotlightX = useTransform(smoothX, (v) => v - 260);
  const spotlightY = useTransform(smoothY, (v) => v - 260);

  const handlePointerMove = (event: MouseEvent<HTMLDivElement>) => {
    if (reduceMotion) return;
    if (window.innerWidth < 1024) return;
    const rect = event.currentTarget.getBoundingClientRect();
    mouseX.set(event.clientX - rect.left);
    mouseY.set(event.clientY - rect.top);
  };

  const handlePointerLeave = () => {
    mouseX.set(-9999);
    mouseY.set(-9999);
  };

  return (
    <div
      className="relative w-full"
      onMouseMove={handlePointerMove}
      onMouseLeave={handlePointerLeave}
    >
      {!reduceMotion && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute left-0 top-0 z-0 hidden h-[520px] w-[520px] rounded-full lg:block"
          style={{
            x: spotlightX,
            y: spotlightY,
            opacity: 0.9,
            mixBlendMode: "screen",
            filter: "blur(16px)",
            background:
              "radial-gradient(circle, rgba(56,189,248,0.28) 0%, rgba(99,102,241,0.22) 36%, rgba(99,102,241,0.12) 56%, rgba(15,23,42,0) 74%)",
          }}
        />
      )}

      <div className="relative z-10 mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <motion.div style={reduceMotion ? undefined : { y: titleY, opacity: titleOpacity }}>
          <div className="animate-float-slow mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-sm text-indigo-400">
            <Zap className="h-3.5 w-3.5" />
            The marketplace for indie hackers
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-zinc-50 sm:text-6xl">
            Buy, Sell &amp; Beta-Test
            <br />
            <span className="text-gradient-animated">Side Projects</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-400">
            Profitable projects with real revenue, real users, and verified metrics.
            Skip the build phase - acquire something that already works.
          </p>
        </motion.div>

        <motion.div
          className="mt-10 flex items-center justify-center gap-4"
          style={reduceMotion ? undefined : { y: ctaY, opacity: ctaOpacity }}
        >
          <MagneticButton className="inline-block">
            <Link href="/browse">
              <Button size="lg" className="bg-indigo-600 hover:bg-indigo-500">
                Browse Projects
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </MagneticButton>
          <MagneticButton className="inline-block">
            <Link href="/create">
              <Button size="lg" variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                List Your Project
              </Button>
            </Link>
          </MagneticButton>
        </motion.div>

        <div className="mt-16 flex flex-col items-center justify-center gap-6 sm:flex-row sm:gap-12">
          <div className="text-center">
            <p className="text-3xl font-bold text-zinc-50">
              <AnimatedCount value={listingsCount} formatter={(v) => String(Math.round(v))} />
            </p>
            <p className="mt-1 text-sm text-zinc-500">Active listings</p>
          </div>
          <div className="hidden h-10 w-px bg-zinc-800 sm:block" />
          <div className="text-center">
            <p className="text-3xl font-bold text-zinc-50">
              <AnimatedCount value={totalSalesValue} formatter={(v) => formatPrice(Math.round(v))} />
            </p>
            <p className="mt-1 text-sm text-zinc-500">In listed inventory</p>
          </div>
          <div className="hidden h-10 w-px bg-zinc-800 sm:block" />
          <div className="text-center">
            <p className="text-3xl font-bold text-zinc-50">
              <AnimatedCount value={betaTestsCount} formatter={(v) => String(Math.round(v))} />
            </p>
            <p className="mt-1 text-sm text-zinc-500">Open beta tests</p>
          </div>
          <div className="hidden h-10 w-px bg-zinc-800 sm:block" />
          <div className="text-center">
            <p className="text-3xl font-bold text-zinc-50">Connects</p>
            <p className="mt-1 text-sm text-zinc-500">For project unlocks</p>
          </div>
        </div>
        <p className="mx-auto mt-8 max-w-3xl text-sm text-zinc-500">
          Beta testing is free to post with rewards. For cash-reward beta tests, SideFlip deducts a 5% platform fee
          while paying testers.
        </p>
      </div>
    </div>
  );
}
