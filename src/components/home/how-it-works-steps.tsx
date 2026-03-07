import { Upload, Users, HandCoins } from "lucide-react";

const steps = [
  {
    icon: <Upload className="h-8 w-8 text-sky-300" />,
    title: "List Your Project",
    description: "Add screenshots, revenue data, tech stack, and set your price.",
  },
  {
    icon: <Users className="h-8 w-8 text-blue-300" />,
    title: "Get Beta Testers",
    description:
      "Posting beta tests is free. For cash rewards, SideFlip deducts a 5% platform fee during tester payouts.",
  },
  {
    icon: <HandCoins className="h-8 w-8 text-amber-300" />,
    title: "Close the Deal",
    description: "Buyers unlock contact info with Connects and close the deal directly off-platform.",
  },
];

export function HowItWorksSteps() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="eyebrow">Operating model</p>
          <h2 className="mt-3 text-4xl font-semibold text-zinc-50 sm:text-5xl">Simple mechanics, clearer trust.</h2>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
          {steps.map((step, i) => (
            <div key={i} className="surface-panel rounded-[28px] p-6">
              <div className="flex items-center justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                  {step.icon}
                </div>
                <span className="eyebrow">0{i + 1}</span>
              </div>
              <h3 className="mt-8 text-2xl font-semibold text-zinc-50">{step.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-400">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
