import Link from "next/link";
import { Cloud, Smartphone, Puzzle, Globe, GitBranch, Bot, Server, Layout } from "lucide-react";
import { getListings } from "@/lib/db/listings";
import { CATEGORY_ICONS, CATEGORY_LABELS } from "@/lib/constants";

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

export async function CategoriesGrid() {
  const listings = await getListings();
  const counts = listings.reduce<Record<string, number>>((acc, listing) => {
    acc[listing.category] = (acc[listing.category] ?? 0) + 1;
    return acc;
  }, {});
  const categories = Object.entries(CATEGORY_LABELS).map(([slug, label]) => ({
    slug,
    label,
    icon: CATEGORY_ICONS[slug],
    count: counts[slug] ?? 0,
  }));

  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="eyebrow">Category map</p>
          <h2 className="mt-3 text-4xl font-semibold text-zinc-50 sm:text-5xl">Jump straight to your preferred asset type.</h2>
          <p className="mt-3 text-[15px] leading-7 text-slate-400">
            Marketplace inventory grouped by deal shape, not generic startup taxonomy.
          </p>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {categories.map((cat) => (
            <Link key={cat.slug} href={`/browse?category=${cat.slug}`}>
              <div className="card-hover surface-panel rounded-[26px] p-5 text-left">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-sky-300">
                  {iconMap[cat.icon] || <Cloud className="h-6 w-6" />}
                </div>
                <p className="mt-6 text-xl font-semibold text-zinc-50">{cat.label}</p>
                <p className="mt-1 text-sm text-slate-400">{cat.count} active projects</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
