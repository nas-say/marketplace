import { Upload, Users, HandCoins } from "lucide-react";

const steps = [
  {
    icon: <Upload className="h-8 w-8 text-indigo-500" />,
    title: "List Your Project",
    description: "Add screenshots, revenue data, tech stack, and set your price.",
  },
  {
    icon: <Users className="h-8 w-8 text-indigo-500" />,
    title: "Get Beta Testers",
    description: "Post your work-in-progress and get structured feedback from real users.",
  },
  {
    icon: <HandCoins className="h-8 w-8 text-indigo-500" />,
    title: "Close the Deal",
    description: "Secure escrow payment and transfer assets to the buyer.",
  },
];

export function HowItWorksSteps() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-center text-3xl font-bold text-zinc-50">How It Works</h2>
        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
          {steps.map((step, i) => (
            <div key={i} className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-500/10">
                {step.icon}
              </div>
              <h3 className="mt-4 text-lg font-semibold text-zinc-50">{step.title}</h3>
              <p className="mt-2 text-sm text-zinc-400">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
