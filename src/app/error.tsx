"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global-error]", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-32">
      <h1 className="text-6xl font-bold text-zinc-50">500</h1>
      <p className="mt-4 text-zinc-400">Something went wrong on our end.</p>
      <div className="mt-6 flex gap-3">
        <Button className="bg-indigo-600 hover:bg-indigo-500" onClick={reset}>
          Try again
        </Button>
        <Link href="/">
          <Button variant="outline">Back to Home</Button>
        </Link>
      </div>
    </div>
  );
}
