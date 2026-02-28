import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-32">
      <h1 className="text-6xl font-bold text-zinc-50">404</h1>
      <p className="mt-4 text-zinc-400">This page doesn&apos;t exist.</p>
      <Link href="/" className="mt-6">
        <Button className="bg-indigo-600 hover:bg-indigo-500">Back to Home</Button>
      </Link>
    </div>
  );
}
