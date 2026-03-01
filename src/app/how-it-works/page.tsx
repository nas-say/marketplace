import { PageHeader } from "@/components/shared/page-header";
import {
  ArrowRight,
  Eye,
  Handshake,
  Lock,
  MessageSquare,
  Search,
  Trophy,
  Upload,
  UserCheck,
} from "lucide-react";

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader title="How SideFlip Works" description="The marketplace lifecycle: Build, Test, Improve, Sell." />

      <section className="mb-16">
        <h2 className="mb-8 text-2xl font-bold text-zinc-50">For Sellers</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
          {[
            {
              icon: <Upload className="h-6 w-6" />,
              title: "List",
              desc: "Add your project: title, metrics, tech stack, and asking price.",
            },
            {
              icon: <UserCheck className="h-6 w-6" />,
              title: "Get Verified",
              desc: "Verify ownership via GitHub repo or domain DNS record.",
            },
            {
              icon: <Search className="h-6 w-6" />,
              title: "Get Discovered",
              desc: "Buyers find your listing through search and browse.",
            },
            {
              icon: <Handshake className="h-6 w-6" />,
              title: "Connect & Close",
              desc: "Buyers unlock your contact info with Connects and close the sale off-platform.",
            },
          ].map((step) => (
            <div key={step.title} className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-500">
                {step.icon}
              </div>
              <h3 className="mt-3 font-semibold text-zinc-50">{step.title}</h3>
              <p className="mt-1 text-sm text-zinc-400">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-16">
        <h2 className="mb-8 text-2xl font-bold text-zinc-50">For Buyers</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
          {[
            {
              icon: <Search className="h-6 w-6" />,
              title: "Browse",
              desc: "Filter listings by category, price, MRR, and revenue trend.",
            },
            {
              icon: <Eye className="h-6 w-6" />,
              title: "Evaluate",
              desc: "Read metrics, tech stack, and seller profile details.",
            },
            {
              icon: <Lock className="h-6 w-6" />,
              title: "Unlock",
              desc: "Spend Connects once per listing to reveal seller contact info.",
            },
            {
              icon: <Handshake className="h-6 w-6" />,
              title: "Negotiate & Buy",
              desc: "Contact the seller directly and close on your own terms.",
            },
          ].map((step) => (
            <div key={step.title} className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-500">
                {step.icon}
              </div>
              <h3 className="mt-3 font-semibold text-zinc-50">{step.title}</h3>
              <p className="mt-1 text-sm text-zinc-400">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-16">
        <h2 className="mb-8 text-2xl font-bold text-zinc-50">For Beta Testers</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
          {[
            { icon: <Search className="h-6 w-6" />, title: "Browse", desc: "Find projects looking for beta testers." },
            { icon: <ArrowRight className="h-6 w-6" />, title: "Apply", desc: "Apply with your contact details (and UPI for cash rewards)." },
            { icon: <MessageSquare className="h-6 w-6" />, title: "Test & Feedback", desc: "Test the product and submit structured feedback." },
            { icon: <Trophy className="h-6 w-6" />, title: "Earn", desc: "Get cash rewards (net of 5% platform fee) or premium access." },
          ].map((step) => (
            <div key={step.title} className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-500">
                {step.icon}
              </div>
              <h3 className="mt-3 font-semibold text-zinc-50">{step.title}</h3>
              <p className="mt-1 text-sm text-zinc-400">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-16">
        <h2 className="mb-8 text-2xl font-bold text-zinc-50">The SideFlip Pipeline</h2>
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

      <section className="mb-16">
        <h2 className="mb-8 text-2xl font-bold text-zinc-50">Pricing</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6 text-center">
            <p className="text-3xl font-bold text-zinc-50">From ₹200</p>
            <p className="mt-2 text-sm text-zinc-400">Connects packages start at 10 Connects</p>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6 text-center">
            <p className="text-3xl font-bold text-green-500">Free</p>
            <p className="mt-2 text-sm text-zinc-400">Posting a beta test</p>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6 text-center">
            <p className="text-3xl font-bold text-zinc-50">5%</p>
            <p className="mt-2 text-sm text-zinc-400">Platform fee on cash tester payouts</p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-8 text-2xl font-bold text-zinc-50">FAQ</h2>
        <div className="space-y-4">
          {[
            {
              q: "How do project sales happen?",
              a: "SideFlip connects you with the seller; the transaction is handled directly between buyer and seller.",
            },
            {
              q: "How are projects verified?",
              a: "Project metrics are self-reported by sellers and can be independently verified via repo or domain ownership checks.",
            },
            {
              q: "Can I list a project for free?",
              a: "Yes. Listing is free. Connecting with sellers costs Connects.",
            },
            {
              q: "How does beta testing pricing work?",
              a: "Posting a beta test is free. For cash rewards, SideFlip deducts a 5% platform fee while paying approved testers.",
            },
            {
              q: "Does SideFlip handle sale disputes?",
              a: "No. SideFlip does not mediate sales. For larger deals, use a trusted third-party escrow service.",
            },
            {
              q: "Is there a platform fee on project sales?",
              a: "No percentage fee is charged on sale value. You only spend Connects to unlock seller info.",
            },
            {
              q: "Can I buy projects and beta test too?",
              a: "Yes. Many users browse listings and participate in beta tests from the same account.",
            },
          ].map((faq) => (
            <details key={faq.q} className="group rounded-lg border border-zinc-800 bg-zinc-900">
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
