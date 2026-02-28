import { PageHeader } from "@/components/shared/page-header";
import { Upload, Search, ShieldCheck, ArrowRight, Users, MessageSquare, Trophy } from "lucide-react";

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader title="How SideFlip Works" description="The marketplace lifecycle: Build, Test, Improve, Sell." />

      {/* For Sellers */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-zinc-50 mb-8">For Sellers</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
          {[
            { icon: <Upload className="h-6 w-6" />, title: "List", desc: "Add your project with screenshots, stats, and pricing." },
            { icon: <Users className="h-6 w-6" />, title: "Get Verified", desc: "We verify revenue claims and tech stack." },
            { icon: <Search className="h-6 w-6" />, title: "Find Buyer", desc: "Buyers discover your project through search and browse." },
            { icon: <ShieldCheck className="h-6 w-6" />, title: "Transfer", desc: "Secure escrow payment and asset handover." },
          ].map((step, i) => (
            <div key={i} className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-500">
                {step.icon}
              </div>
              <h3 className="mt-3 font-semibold text-zinc-50">{step.title}</h3>
              <p className="mt-1 text-sm text-zinc-400">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* For Beta Testers */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-zinc-50 mb-8">For Beta Testers</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
          {[
            { icon: <Search className="h-6 w-6" />, title: "Browse", desc: "Find projects looking for beta testers." },
            { icon: <ArrowRight className="h-6 w-6" />, title: "Apply", desc: "Sign up and get access to the project." },
            { icon: <MessageSquare className="h-6 w-6" />, title: "Test & Feedback", desc: "Test the product and submit structured feedback." },
            { icon: <Trophy className="h-6 w-6" />, title: "Earn", desc: "Get paid in cash, credits, or free access." },
          ].map((step, i) => (
            <div key={i} className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-500">
                {step.icon}
              </div>
              <h3 className="mt-3 font-semibold text-zinc-50">{step.title}</h3>
              <p className="mt-1 text-sm text-zinc-400">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* The Pipeline */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-zinc-50 mb-8">The SideFlip Pipeline</h2>
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          {["Build", "Beta Test", "Improve", "Sell"].map((step, i) => (
            <div key={step} className="flex items-center gap-4">
              <div className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-6 py-3 text-center">
                <p className="font-semibold text-indigo-400">{step}</p>
              </div>
              {i < 3 && <ArrowRight className="hidden h-5 w-5 text-zinc-600 sm:block" />}
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-zinc-50 mb-8">Pricing</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6 text-center">
            <p className="text-3xl font-bold text-zinc-50">5%</p>
            <p className="mt-2 text-sm text-zinc-400">Marketplace transaction fee</p>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6 text-center">
            <p className="text-3xl font-bold text-green-500">Free</p>
            <p className="mt-2 text-sm text-zinc-400">Listing a beta test</p>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6 text-center">
            <p className="text-3xl font-bold text-zinc-50">100%</p>
            <p className="mt-2 text-sm text-zinc-400">Testers keep all rewards</p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section>
        <h2 className="text-2xl font-bold text-zinc-50 mb-8">FAQ</h2>
        <div className="space-y-4">
          {[
            { q: "How do I get paid when my project sells?", a: "Once the buyer confirms asset receipt, funds are released from escrow to your account. We support bank transfer and PayPal." },
            { q: "How are projects verified?", a: "We verify revenue claims through Stripe/payment processor screenshots and traffic data through analytics access. Verified listings get a trust badge." },
            { q: "Can I list a project for free?", a: "Yes, listing is completely free. We only charge a 5% fee when a sale is completed." },
            { q: "How does beta testing work?", a: "Creators post their projects with testing instructions. Testers sign up, test the product, and submit structured feedback (bug reports, UX ratings, or feature suggestions)." },
            { q: "What happens if a buyer isn't satisfied?", a: "We offer a 7-day dispute resolution period. If the project doesn't match the listing, we can mediate refunds through escrow." },
            { q: "Can I buy a project and also be a beta tester?", a: "Absolutely! Many users both buy projects and earn by beta testing. It's the best way to understand what makes a good product." },
          ].map((faq, i) => (
            <details key={i} className="group rounded-lg border border-zinc-800 bg-zinc-900">
              <summary className="cursor-pointer p-4 font-medium text-zinc-50 hover:text-indigo-400">
                {faq.q}
              </summary>
              <p className="px-4 pb-4 text-sm text-zinc-400">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
