import Link from "next/link";
import { Cloud, Smartphone, Puzzle, Globe, GitBranch, Bot, Server, Layout } from "lucide-react";
import { getCategories } from "@/lib/data";

const iconMap: Record<string, React.ReactNode> = {
  cloud: <Cloud className="h-6 w-6" />,
  smartphone: <Smartphone className="h-6 w-6" />,
  puzzle: <Puzzle className="h-6 w-6" />,
  globe: <Globe className="h-6 w-6" />,
  "git-branch": <GitBranch className="h-6 w-6" />,
  bot: <Bot className="h-6 w-6" />,
  server: <Server className="h-6 w-6" />,
  layout: <Layout className="h-6 w-6" />,
};

export function CategoriesGrid() {
  const categories = getCategories();

  return (
    <section className="py-20 bg-zinc-900/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-center text-3xl font-bold text-zinc-50">Browse by Category</h2>
        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {categories.map((cat) => (
            <Link key={cat.slug} href={`/browse?category=${cat.slug}`}>
              <div className="card-hover rounded-lg border border-zinc-800 bg-zinc-900 p-4 text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center text-indigo-500">
                  {iconMap[cat.icon] || <Cloud className="h-6 w-6" />}
                </div>
                <p className="mt-2 text-sm font-medium text-zinc-50">{cat.label}</p>
                <p className="text-xs text-zinc-500">{cat.count} projects</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
