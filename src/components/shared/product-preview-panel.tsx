"use client";

import { cn } from "@/lib/utils";

interface PreviewMetric {
  label: string;
  value: string;
}

interface ProductPreviewPanelProps {
  eyebrow: string;
  accentClassName: string;
  stats: PreviewMetric[];
  footer: string;
  imageSrc?: string | null;
  className?: string;
}

export function ProductPreviewPanel({
  eyebrow,
  accentClassName,
  stats,
  footer,
  imageSrc,
  className,
}: ProductPreviewPanelProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[24px] border border-white/10 bg-[#07101e] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
        className
      )}
    >
      <div className={cn("absolute inset-0 bg-gradient-to-br", accentClassName)} />
      {imageSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageSrc}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-30"
          loading="lazy"
        />
      ) : (
        <div className="absolute inset-0 opacity-90">
          <div className="absolute inset-0 bg-[linear-gradient(transparent_0,transparent_23px,rgba(255,255,255,0.03)_24px),linear-gradient(90deg,transparent_0,transparent_23px,rgba(255,255,255,0.03)_24px)] bg-[length:24px_24px]" />
          <div className="absolute left-6 top-6 h-24 w-[42%] rounded-[20px] border border-white/12 bg-white/[0.06] shadow-[0_18px_44px_rgba(2,8,23,0.34)]" />
          <div className="absolute right-6 top-10 h-16 w-[30%] rounded-[18px] border border-white/12 bg-white/[0.05]" />
          <div className="absolute bottom-7 left-6 right-6 h-20 rounded-[22px] border border-white/12 bg-white/[0.05]" />
          <div className="absolute bottom-12 left-10 h-2.5 w-[52%] rounded-full bg-white/12" />
          <div className="absolute bottom-12 left-10 h-2.5 w-[30%] rounded-full bg-white/30" />
          <div className="absolute bottom-7 left-10 flex gap-2">
            <span className="h-2.5 w-12 rounded-full bg-white/12" />
            <span className="h-2.5 w-16 rounded-full bg-white/10" />
            <span className="h-2.5 w-9 rounded-full bg-white/8" />
          </div>
        </div>
      )}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.16),transparent_30%)]" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#040915] via-[#07101ee6] to-[#07101e4d]" />

      <div className="relative flex h-full flex-col justify-between p-4">
        <div className="flex items-start justify-between gap-3">
          <span className="eyebrow text-[11px] tracking-[0.38em] text-slate-300/85">{eyebrow}</span>
          <div className="rounded-full border border-white/12 bg-black/25 px-2 py-1 text-[10px] font-medium text-slate-300/80">
            Live surface
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {stats.slice(0, 4).map((stat) => (
            <div
              key={`${stat.label}-${stat.value}`}
              className="rounded-[16px] border border-white/10 bg-black/28 px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] backdrop-blur-sm"
            >
              <p className="text-[10px] uppercase tracking-[0.28em] text-slate-400">{stat.label}</p>
              <p className="mt-1 text-sm font-semibold text-zinc-50">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-3 inline-flex w-fit rounded-full border border-white/10 bg-black/25 px-3 py-1.5 text-[11px] font-medium text-slate-300">
          {footer}
        </div>
      </div>
    </div>
  );
}
