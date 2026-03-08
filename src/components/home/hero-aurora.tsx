export function HeroAurora() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(59,130,246,0.2),transparent_42%),radial-gradient(circle_at_82%_24%,rgba(14,165,233,0.16),transparent_38%),radial-gradient(circle_at_64%_78%,rgba(251,191,36,0.12),transparent_44%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-[-28%] h-[520px] w-[520px] rounded-full bg-blue-500/24 blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-[-12%] top-[8%] h-[420px] w-[420px] rounded-full bg-sky-400/14 blur-[110px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-[-30%] left-[28%] h-[460px] w-[460px] rounded-full bg-amber-400/10 blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.045] mix-blend-soft-light"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.85) 0.45px, transparent 0.45px)",
          backgroundSize: "3px 3px",
        }}
      />
    </>
  );
}
