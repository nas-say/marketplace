import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function CtaBanner() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-indigo-500/10 to-violet-500/10 p-12 text-center">
          <h2 className="text-3xl font-bold text-zinc-50">Ready to sell your side project?</h2>
          <p className="mx-auto mt-4 max-w-xl text-zinc-400">
            List your project in minutes. Reach thousands of indie hackers looking for their next acquisition.
          </p>
          <Link href="/create">
            <Button size="lg" className="mt-8 bg-indigo-600 hover:bg-indigo-500">
              List Your Project
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
