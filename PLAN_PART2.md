# SideFlip — Build Specification Part 2: Components & Pages

> **Continues from PLAN.md.** Follow these steps after completing Steps 1-5.

---

## STEP 6: Layout Components

### File: `src/components/layout/navbar.tsx`

```tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NAV_LINKS, SITE_NAME } from "@/lib/constants";

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <Rocket className="h-6 w-6 text-indigo-500" />
          <span className="text-lg font-bold text-zinc-50">{SITE_NAME}</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-zinc-400 transition-colors hover:text-zinc-50"
            >
              {link.label}
            </Link>
          ))}
          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-500">
            Sign In
          </Button>
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden text-zinc-400"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="border-t border-zinc-800 bg-zinc-950 px-4 pb-4 md:hidden">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block py-3 text-sm text-zinc-400 hover:text-zinc-50"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Button size="sm" className="mt-2 w-full bg-indigo-600 hover:bg-indigo-500">
            Sign In
          </Button>
        </div>
      )}
    </nav>
  );
}
```

### File: `src/components/layout/footer.tsx`

```tsx
import Link from "next/link";
import { Rocket } from "lucide-react";
import { SITE_NAME } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="border-t border-zinc-800 bg-zinc-950">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <Rocket className="h-5 w-5 text-indigo-500" />
              <span className="font-bold text-zinc-50">{SITE_NAME}</span>
            </div>
            <p className="mt-2 text-sm text-zinc-500">
              The marketplace where indie hackers buy, sell & beta-test side projects.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-zinc-50">Marketplace</h3>
            <ul className="mt-3 space-y-2">
              <li><Link href="/browse" className="text-sm text-zinc-400 hover:text-zinc-50">Browse Projects</Link></li>
              <li><Link href="/create" className="text-sm text-zinc-400 hover:text-zinc-50">List a Project</Link></li>
              <li><Link href="/how-it-works" className="text-sm text-zinc-400 hover:text-zinc-50">How It Works</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-zinc-50">Beta Testing</h3>
            <ul className="mt-3 space-y-2">
              <li><Link href="/beta" className="text-sm text-zinc-400 hover:text-zinc-50">Find Beta Tests</Link></li>
              <li><Link href="/create" className="text-sm text-zinc-400 hover:text-zinc-50">Post a Beta Test</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-zinc-50">Company</h3>
            <ul className="mt-3 space-y-2">
              <li><Link href="/how-it-works" className="text-sm text-zinc-400 hover:text-zinc-50">About</Link></li>
              <li><span className="text-sm text-zinc-500">Terms (Coming soon)</span></li>
              <li><span className="text-sm text-zinc-500">Privacy (Coming soon)</span></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-zinc-800 pt-8 text-center text-sm text-zinc-500">
          &copy; {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
```

---

## STEP 7: Shared Components

### File: `src/components/shared/search-bar.tsx`

```tsx
"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChange, placeholder = "Search projects..." }: SearchBarProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-10 bg-zinc-900 border-zinc-800 text-zinc-50 placeholder:text-zinc-500"
      />
    </div>
  );
}
```

### File: `src/components/shared/tech-stack-badges.tsx`

```tsx
import { Badge } from "@/components/ui/badge";

interface TechStackBadgesProps {
  stack: string[];
  max?: number;
}

export function TechStackBadges({ stack, max = 3 }: TechStackBadgesProps) {
  const visible = stack.slice(0, max);
  const remaining = stack.length - max;

  return (
    <div className="flex flex-wrap gap-1">
      {visible.map((tech) => (
        <Badge key={tech} variant="secondary" className="bg-zinc-800 text-zinc-300 text-xs">
          {tech}
        </Badge>
      ))}
      {remaining > 0 && (
        <Badge variant="secondary" className="bg-zinc-800 text-zinc-500 text-xs">
          +{remaining}
        </Badge>
      )}
    </div>
  );
}
```

### File: `src/components/shared/stat-card.tsx`

```tsx
interface StatCardProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
}

export function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500">{label}</p>
        {icon && <span className="text-zinc-500">{icon}</span>}
      </div>
      <p className="mt-1 text-2xl font-bold text-zinc-50">{value}</p>
    </div>
  );
}
```

### File: `src/components/shared/page-header.tsx`

```tsx
interface PageHeaderProps {
  title: string;
  description?: string;
}

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-zinc-50">{title}</h1>
      {description && <p className="mt-2 text-zinc-400">{description}</p>}
    </div>
  );
}
```

### File: `src/components/shared/payment-placeholder.tsx`

```tsx
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";

interface PaymentPlaceholderProps {
  open: boolean;
  onClose: () => void;
}

export function PaymentPlaceholder({ open, onClose }: PaymentPlaceholderProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-900 border-zinc-800">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/10">
            <ShieldCheck className="h-6 w-6 text-indigo-500" />
          </div>
          <DialogTitle className="text-center text-zinc-50">Secure Payment Coming Soon</DialogTitle>
          <DialogDescription className="text-center text-zinc-400">
            We&apos;re building escrow-based secure payments powered by Stripe. For now, you can contact the seller directly to arrange the purchase.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 flex flex-col gap-2">
          <Button className="bg-indigo-600 hover:bg-indigo-500">Contact Seller</Button>
          <Button variant="outline" onClick={onClose} className="border-zinc-700 text-zinc-300">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

## STEP 8: Listing Components

### File: `src/components/listing/listing-card.tsx`

```tsx
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Listing } from "@/types/listing";
import { TechStackBadges } from "@/components/shared/tech-stack-badges";
import { formatPrice, formatNumber } from "@/lib/data";
import { CATEGORY_LABELS } from "@/lib/constants";

interface ListingCardProps {
  listing: Listing;
}

export function ListingCard({ listing }: ListingCardProps) {
  const TrendIcon = listing.metrics.revenueTrend === "up"
    ? TrendingUp
    : listing.metrics.revenueTrend === "down"
    ? TrendingDown
    : Minus;

  const trendColor = listing.metrics.revenueTrend === "up"
    ? "text-green-500"
    : listing.metrics.revenueTrend === "down"
    ? "text-red-500"
    : "text-zinc-500";

  return (
    <Link href={`/listing/${listing.id}`}>
      <Card className="card-hover cursor-pointer border-zinc-800 bg-zinc-900">
        <div className="relative h-40 bg-zinc-800 rounded-t-lg flex items-center justify-center">
          <span className="text-zinc-600 text-sm">Screenshot</span>
          <Badge className="absolute top-2 left-2 bg-indigo-600 text-xs">
            {CATEGORY_LABELS[listing.category]}
          </Badge>
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold text-zinc-50 truncate">{listing.title}</h3>
          <p className="mt-1 text-sm text-zinc-400 line-clamp-1">{listing.pitch}</p>

          <div className="mt-3 flex items-center gap-3 text-xs text-zinc-500">
            <span className="flex items-center gap-1">
              <TrendIcon className={`h-3 w-3 ${trendColor}`} />
              {formatPrice(listing.metrics.mrr)}/mo
            </span>
            <span>{formatNumber(listing.metrics.monthlyVisitors)} visitors</span>
          </div>

          <div className="mt-3">
            <TechStackBadges stack={listing.techStack} max={3} />
          </div>

          <div className="mt-3 flex items-center justify-between">
            <span className="text-lg font-bold text-violet-400">
              {formatPrice(listing.askingPrice)}
            </span>
            {listing.openToOffers && (
              <span className="text-xs text-zinc-500">Open to offers</span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
```

### File: `src/components/listing/listing-grid.tsx`

```tsx
import { Listing } from "@/types/listing";
import { ListingCard } from "./listing-card";

interface ListingGridProps {
  listings: Listing[];
}

export function ListingGrid({ listings }: ListingGridProps) {
  if (listings.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-zinc-500">No projects found matching your filters.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {listings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  );
}
```

### File: `src/components/listing/listing-filters.tsx`

```tsx
"use client";

import { SearchBar } from "@/components/shared/search-bar";
import { CATEGORY_LABELS } from "@/lib/constants";

interface ListingFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
}

export function ListingFilters({
  search,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  sortBy,
  onSortChange,
}: ListingFiltersProps) {
  return (
    <div className="space-y-6">
      <SearchBar value={search} onChange={onSearchChange} />

      <div>
        <h3 className="mb-3 text-sm font-semibold text-zinc-50">Category</h3>
        <div className="space-y-2">
          <button
            onClick={() => onCategoryChange("")}
            className={`block w-full text-left text-sm px-2 py-1 rounded ${
              selectedCategory === "" ? "bg-indigo-600 text-white" : "text-zinc-400 hover:text-zinc-50"
            }`}
          >
            All Categories
          </button>
          {Object.entries(CATEGORY_LABELS).map(([slug, label]) => (
            <button
              key={slug}
              onClick={() => onCategoryChange(slug)}
              className={`block w-full text-left text-sm px-2 py-1 rounded ${
                selectedCategory === slug ? "bg-indigo-600 text-white" : "text-zinc-400 hover:text-zinc-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-zinc-50">Sort By</h3>
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-50"
        >
          <option value="newest">Newest First</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
          <option value="revenue">Highest Revenue</option>
        </select>
      </div>
    </div>
  );
}
```

---

## STEP 9: Beta Test Components

### File: `src/components/beta/beta-card.tsx`

```tsx
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BetaTest } from "@/types/beta-test";
import { CATEGORY_LABELS } from "@/lib/constants";

interface BetaCardProps {
  betaTest: BetaTest;
}

export function BetaCard({ betaTest }: BetaCardProps) {
  const spotsRemaining = betaTest.spots.total - betaTest.spots.filled;
  const fillPercent = (betaTest.spots.filled / betaTest.spots.total) * 100;

  const statusColor =
    betaTest.status === "accepting"
      ? "bg-green-500/10 text-green-500"
      : betaTest.status === "almost_full"
      ? "bg-amber-500/10 text-amber-500"
      : "bg-zinc-500/10 text-zinc-500";

  const statusLabel =
    betaTest.status === "accepting"
      ? "Accepting Testers"
      : betaTest.status === "almost_full"
      ? "Almost Full"
      : "Closed";

  return (
    <Link href={`/beta/${betaTest.id}`}>
      <Card className="card-hover cursor-pointer border-zinc-800 bg-zinc-900">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-zinc-50">{betaTest.title}</h3>
              <p className="mt-1 text-sm text-zinc-400 line-clamp-2">{betaTest.description}</p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-1">
            <Badge className={statusColor}>{statusLabel}</Badge>
            <Badge variant="secondary" className="bg-zinc-800 text-zinc-300 text-xs">
              {CATEGORY_LABELS[betaTest.category]}
            </Badge>
            {betaTest.platform.map((p) => (
              <Badge key={p} variant="outline" className="border-zinc-700 text-zinc-400 text-xs capitalize">
                {p}
              </Badge>
            ))}
          </div>

          <div className="mt-4">
            <div className="flex justify-between text-xs text-zinc-500 mb-1">
              <span>{betaTest.spots.filled} of {betaTest.spots.total} spots filled</span>
              <span>{spotsRemaining} left</span>
            </div>
            <div className="h-2 rounded-full bg-zinc-800">
              <div
                className="h-2 rounded-full bg-indigo-600 transition-all"
                style={{ width: `${fillPercent}%` }}
              />
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm font-medium text-violet-400">
              {betaTest.reward.description}
            </span>
            <span className="text-xs text-zinc-500">
              Due {new Date(betaTest.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
```

### File: `src/components/beta/beta-grid.tsx`

```tsx
import { BetaTest } from "@/types/beta-test";
import { BetaCard } from "./beta-card";

interface BetaGridProps {
  betaTests: BetaTest[];
}

export function BetaGrid({ betaTests }: BetaGridProps) {
  if (betaTests.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-zinc-500">No beta tests found matching your filters.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {betaTests.map((bt) => (
        <BetaCard key={bt.id} betaTest={bt} />
      ))}
    </div>
  );
}
```

### File: `src/components/beta/feedback-item.tsx`

```tsx
import { Badge } from "@/components/ui/badge";
import { Feedback } from "@/types/feedback";
import { getUserById } from "@/lib/data";
import { Bug, Star, Lightbulb } from "lucide-react";

interface FeedbackItemProps {
  feedback: Feedback;
}

export function FeedbackItem({ feedback }: FeedbackItemProps) {
  const tester = getUserById(feedback.testerId);
  const typeIcon = feedback.type === "bug_report" ? <Bug className="h-4 w-4" /> : feedback.type === "ux_rating" ? <Star className="h-4 w-4" /> : <Lightbulb className="h-4 w-4" />;
  const typeLabel = feedback.type === "bug_report" ? "Bug Report" : feedback.type === "ux_rating" ? "UX Rating" : "Feature Suggestion";
  const typeColor = feedback.type === "bug_report" ? "text-red-400" : feedback.type === "ux_rating" ? "text-amber-400" : "text-blue-400";

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={typeColor}>{typeIcon}</span>
          <Badge variant="outline" className={`border-zinc-700 ${typeColor} text-xs`}>{typeLabel}</Badge>
        </div>
        <span className="text-xs text-zinc-500">
          {new Date(feedback.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </span>
      </div>

      {feedback.bugReport && (
        <div>
          <h4 className="font-medium text-zinc-50">{feedback.bugReport.title}</h4>
          <Badge variant="secondary" className="mt-1 text-xs capitalize">{feedback.bugReport.severity}</Badge>
          <p className="mt-2 text-sm text-zinc-400 whitespace-pre-line">{feedback.bugReport.stepsToReproduce}</p>
          <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
            <div><span className="text-zinc-500">Expected:</span> <span className="text-zinc-300">{feedback.bugReport.expected}</span></div>
            <div><span className="text-zinc-500">Actual:</span> <span className="text-zinc-300">{feedback.bugReport.actual}</span></div>
          </div>
        </div>
      )}

      {feedback.uxRating && (
        <div>
          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              { label: "Overall", val: feedback.uxRating.overall },
              { label: "Ease of Use", val: feedback.uxRating.easeOfUse },
              { label: "Design", val: feedback.uxRating.visualDesign },
              { label: "Performance", val: feedback.uxRating.performance },
            ].map((item) => (
              <div key={item.label} className="rounded bg-zinc-800 p-2">
                <p className="text-xs text-zinc-500">{item.label}</p>
                <p className="text-lg font-bold text-zinc-50">{item.val}/5</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-sm text-zinc-400">{feedback.uxRating.comments}</p>
        </div>
      )}

      {feedback.featureSuggestion && (
        <div>
          <h4 className="font-medium text-zinc-50">{feedback.featureSuggestion.title}</h4>
          <Badge variant="secondary" className="mt-1 text-xs capitalize">
            {feedback.featureSuggestion.priority.replace("_", " ")}
          </Badge>
          <p className="mt-2 text-sm text-zinc-400">{feedback.featureSuggestion.description}</p>
          <p className="mt-2 text-sm"><span className="text-zinc-500">Use case:</span> <span className="text-zinc-300">{feedback.featureSuggestion.useCase}</span></p>
        </div>
      )}

      {tester && (
        <p className="mt-3 text-xs text-zinc-500">— {tester.displayName}</p>
      )}
    </div>
  );
}
```

---

## STEP 10: Home Page Components

### File: `src/components/home/hero.tsx`

```tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap } from "lucide-react";

export function Hero() {
  return (
    <section className="gradient-hero py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-sm text-indigo-400 mb-6">
          <Zap className="h-3.5 w-3.5" />
          The marketplace for indie hackers
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-zinc-50 sm:text-6xl">
          Buy, Sell &amp; Beta-Test
          <br />
          <span className="text-indigo-500">Side Projects</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-400">
          The marketplace where indie hackers trade projects and find beta testers.
          Build, test, improve, sell — all in one place.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link href="/browse">
            <Button size="lg" className="bg-indigo-600 hover:bg-indigo-500">
              Browse Projects
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/create">
            <Button size="lg" variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
              List Your Project
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
```

### File: `src/components/home/how-it-works-steps.tsx`

```tsx
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
```

### File: `src/components/home/categories-grid.tsx`

```tsx
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
```

### File: `src/components/home/featured-listings.tsx`

```tsx
import { getFeaturedListings } from "@/lib/data";
import { ListingCard } from "@/components/listing/listing-card";

export function FeaturedListings() {
  const listings = getFeaturedListings();

  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-zinc-50">Featured Projects</h2>
        <p className="mt-2 text-zinc-400">Hand-picked projects with strong revenue and growth.</p>
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </div>
    </section>
  );
}
```

### File: `src/components/home/beta-spotlight.tsx`

```tsx
import { getActiveBetaTests } from "@/lib/data";
import { BetaCard } from "@/components/beta/beta-card";

export function BetaSpotlight() {
  const betaTests = getActiveBetaTests().slice(0, 3);

  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-zinc-50">Projects Seeking Beta Testers</h2>
        <p className="mt-2 text-zinc-400">Help shape products before they launch and earn rewards.</p>
        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          {betaTests.map((bt) => (
            <BetaCard key={bt.id} betaTest={bt} />
          ))}
        </div>
      </div>
    </section>
  );
}
```

### File: `src/components/home/cta-banner.tsx`

```tsx
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
```

---

## STEP 11: Page Files

### File: `src/app/layout.tsx`

Replace the entire file with:

```tsx
import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { SITE_NAME, SITE_DESCRIPTION } from "@/lib/constants";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: SITE_NAME,
  description: SITE_DESCRIPTION,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${jetbrains.variable} font-sans bg-zinc-950 text-zinc-50 antialiased`}>
        <div className="flex min-h-screen flex-col">
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
```

### File: `src/app/page.tsx`

Replace the entire file with:

```tsx
import { Hero } from "@/components/home/hero";
import { FeaturedListings } from "@/components/home/featured-listings";
import { HowItWorksSteps } from "@/components/home/how-it-works-steps";
import { CategoriesGrid } from "@/components/home/categories-grid";
import { BetaSpotlight } from "@/components/home/beta-spotlight";
import { CtaBanner } from "@/components/home/cta-banner";

export default function HomePage() {
  return (
    <>
      <Hero />
      <FeaturedListings />
      <HowItWorksSteps />
      <CategoriesGrid />
      <BetaSpotlight />
      <CtaBanner />
    </>
  );
}
```

### File: `src/app/browse/page.tsx`

```tsx
"use client";

import { useState, useMemo } from "react";
import { getListings } from "@/lib/data";
import { ListingGrid } from "@/components/listing/listing-grid";
import { ListingFilters } from "@/components/listing/listing-filters";
import { PageHeader } from "@/components/shared/page-header";

export default function BrowsePage() {
  const allListings = getListings();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  const filtered = useMemo(() => {
    let result = allListings.filter((l) => l.status === "active");

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (l) => l.title.toLowerCase().includes(q) || l.pitch.toLowerCase().includes(q)
      );
    }

    if (category) {
      result = result.filter((l) => l.category === category);
    }

    switch (sortBy) {
      case "price-low":
        result.sort((a, b) => a.askingPrice - b.askingPrice);
        break;
      case "price-high":
        result.sort((a, b) => b.askingPrice - a.askingPrice);
        break;
      case "revenue":
        result.sort((a, b) => b.metrics.mrr - a.metrics.mrr);
        break;
      default:
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return result;
  }, [allListings, search, category, sortBy]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader title="Browse Projects" description={`${filtered.length} projects available`} />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="hidden lg:block">
          <ListingFilters
            search={search}
            onSearchChange={setSearch}
            selectedCategory={category}
            onCategoryChange={setCategory}
            sortBy={sortBy}
            onSortChange={setSortBy}
          />
        </aside>
        <div>
          {/* Mobile filters */}
          <div className="mb-4 lg:hidden">
            <ListingFilters
              search={search}
              onSearchChange={setSearch}
              selectedCategory={category}
              onCategoryChange={setCategory}
              sortBy={sortBy}
              onSortChange={setSortBy}
            />
          </div>
          <ListingGrid listings={filtered} />
        </div>
      </div>
    </div>
  );
}
```

### File: `src/app/listing/[id]/page.tsx`

```tsx
"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { getListingById, getUserById, formatPrice, formatNumber } from "@/lib/data";
import { CATEGORY_LABELS } from "@/lib/constants";
import { TechStackBadges } from "@/components/shared/tech-stack-badges";
import { StatCard } from "@/components/shared/stat-card";
import { PaymentPlaceholder } from "@/components/shared/payment-placeholder";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Minus, CheckCircle, User } from "lucide-react";
import Link from "next/link";

export default function ListingDetailPage() {
  const params = useParams();
  const listing = getListingById(params.id as string);
  const [paymentOpen, setPaymentOpen] = useState(false);

  if (!listing) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-zinc-50">Listing not found</h1>
        <Link href="/browse" className="mt-4 text-indigo-400 hover:underline">Back to browse</Link>
      </div>
    );
  }

  const seller = getUserById(listing.sellerId);
  const TrendIcon = listing.metrics.revenueTrend === "up" ? TrendingUp : listing.metrics.revenueTrend === "down" ? TrendingDown : Minus;

  const assetLabels: Record<string, string> = {
    source_code: "Source Code",
    domain: "Domain Name",
    user_database: "User Database",
    documentation: "Documentation",
    hosting_setup: "Hosting Setup",
    support_period: "Support Period",
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <div className="mb-6 text-sm text-zinc-500">
        <Link href="/" className="hover:text-zinc-300">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/browse" className="hover:text-zinc-300">Browse</Link>
        <span className="mx-2">/</span>
        <span className="text-zinc-300">{listing.title}</span>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
        {/* Left column */}
        <div>
          <div className="flex items-start gap-3 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-zinc-50">{listing.title}</h1>
              <div className="mt-2 flex items-center gap-2">
                <Badge className="bg-indigo-600">{CATEGORY_LABELS[listing.category]}</Badge>
                <span className="text-sm text-zinc-500">Listed {new Date(listing.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
              </div>
            </div>
          </div>

          {/* Screenshot placeholder */}
          <div className="mb-8 flex h-64 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900">
            <span className="text-zinc-600">Screenshots</span>
          </div>

          {/* Description */}
          <div className="prose prose-invert max-w-none mb-8">
            {listing.description.split("\n").map((line, i) => {
              if (line.startsWith("## ")) return <h2 key={i} className="text-xl font-bold text-zinc-50 mt-6 mb-2">{line.replace("## ", "")}</h2>;
              if (line.startsWith("- ")) return <li key={i} className="text-zinc-300 ml-4">{line.replace("- ", "")}</li>;
              if (line.trim() === "") return <br key={i} />;
              return <p key={i} className="text-zinc-300">{line}</p>;
            })}
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
            <StatCard label="Monthly Revenue" value={formatPrice(listing.metrics.mrr)} icon={<TrendIcon className="h-4 w-4" />} />
            <StatCard label="Monthly Profit" value={formatPrice(listing.metrics.monthlyProfit)} />
            <StatCard label="Monthly Visitors" value={formatNumber(listing.metrics.monthlyVisitors)} />
            <StatCard label="Registered Users" value={formatNumber(listing.metrics.registeredUsers)} />
          </div>

          {/* Tech Stack */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-zinc-50 mb-3">Tech Stack</h3>
            <TechStackBadges stack={listing.techStack} max={10} />
          </div>

          {/* Assets included */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-zinc-50 mb-3">What&apos;s Included</h3>
            <div className="grid grid-cols-2 gap-2">
              {listing.assetsIncluded.map((asset) => (
                <div key={asset} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-zinc-300">{assetLabels[asset] || asset}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Seller info */}
          {seller && (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
              <h3 className="text-lg font-semibold text-zinc-50 mb-3">Seller</h3>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800">
                  <User className="h-5 w-5 text-zinc-500" />
                </div>
                <div>
                  <p className="font-medium text-zinc-50">{seller.displayName}</p>
                  <p className="text-sm text-zinc-500">Member since {new Date(seller.stats.memberSince).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</p>
                </div>
                {seller.verified && <Badge className="bg-green-500/10 text-green-500 ml-auto">Verified</Badge>}
              </div>
            </div>
          )}
        </div>

        {/* Right column - sticky price card */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
            <p className="text-3xl font-bold text-violet-400">{formatPrice(listing.askingPrice)}</p>
            {listing.openToOffers && <p className="mt-1 text-sm text-zinc-500">Open to offers</p>}
            <Button className="mt-4 w-full bg-indigo-600 hover:bg-indigo-500" onClick={() => setPaymentOpen(true)}>
              Buy This Project
            </Button>
            <Button variant="outline" className="mt-2 w-full border-zinc-700 text-zinc-300">
              Make an Offer
            </Button>
            <Button variant="ghost" className="mt-2 w-full text-zinc-400 hover:text-zinc-50">
              Contact Seller
            </Button>

            <div className="mt-6 space-y-3 border-t border-zinc-800 pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Project age</span>
                <span className="text-zinc-300">{listing.metrics.age}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Revenue trend</span>
                <span className="text-zinc-300 capitalize">{listing.metrics.revenueTrend}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Platform fee</span>
                <span className="text-zinc-300">5%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <PaymentPlaceholder open={paymentOpen} onClose={() => setPaymentOpen(false)} />
    </div>
  );
}
```

### File: `src/app/beta/page.tsx`

```tsx
"use client";

import { useState, useMemo } from "react";
import { getBetaTests } from "@/lib/data";
import { BetaGrid } from "@/components/beta/beta-grid";
import { SearchBar } from "@/components/shared/search-bar";
import { PageHeader } from "@/components/shared/page-header";

export default function BetaPage() {
  const allBetaTests = getBetaTests();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const filtered = useMemo(() => {
    let result = [...allBetaTests];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (bt) => bt.title.toLowerCase().includes(q) || bt.description.toLowerCase().includes(q)
      );
    }

    if (statusFilter) {
      result = result.filter((bt) => bt.status === statusFilter);
    }

    return result;
  }, [allBetaTests, search, statusFilter]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader title="Beta Test Board" description="Find projects to test and earn rewards" />

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex-1">
          <SearchBar value={search} onChange={setSearch} placeholder="Search beta tests..." />
        </div>
        <div className="flex gap-2">
          {["", "accepting", "almost_full", "closed"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`rounded-full px-3 py-1 text-sm ${
                statusFilter === status
                  ? "bg-indigo-600 text-white"
                  : "bg-zinc-800 text-zinc-400 hover:text-zinc-50"
              }`}
            >
              {status === "" ? "All" : status === "accepting" ? "Open" : status === "almost_full" ? "Almost Full" : "Closed"}
            </button>
          ))}
        </div>
      </div>

      <BetaGrid betaTests={filtered} />
    </div>
  );
}
```

### File: `src/app/beta/[id]/page.tsx`

```tsx
"use client";

import { useParams } from "next/navigation";
import { getBetaTestById, getUserById, getFeedbackByBetaTest } from "@/lib/data";
import { FeedbackItem } from "@/components/beta/feedback-item";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";
import Link from "next/link";

export default function BetaDetailPage() {
  const params = useParams();
  const betaTest = getBetaTestById(params.id as string);

  if (!betaTest) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-zinc-50">Beta test not found</h1>
        <Link href="/beta" className="mt-4 text-indigo-400 hover:underline">Back to beta board</Link>
      </div>
    );
  }

  const creator = getUserById(betaTest.creatorId);
  const feedback = getFeedbackByBetaTest(betaTest.id);
  const spotsRemaining = betaTest.spots.total - betaTest.spots.filled;
  const fillPercent = (betaTest.spots.filled / betaTest.spots.total) * 100;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <div className="mb-6 text-sm text-zinc-500">
        <Link href="/" className="hover:text-zinc-300">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/beta" className="hover:text-zinc-300">Beta Tests</Link>
        <span className="mx-2">/</span>
        <span className="text-zinc-300">{betaTest.title}</span>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
        {/* Left column */}
        <div>
          <h1 className="text-3xl font-bold text-zinc-50">{betaTest.title}</h1>
          <div className="mt-3 flex flex-wrap gap-2">
            {betaTest.platform.map((p) => (
              <Badge key={p} variant="outline" className="border-zinc-700 text-zinc-400 capitalize">{p}</Badge>
            ))}
            {betaTest.feedbackTypes.map((ft) => (
              <Badge key={ft} variant="secondary" className="bg-zinc-800 text-zinc-300 text-xs capitalize">
                {ft.replace("_", " ")}
              </Badge>
            ))}
          </div>

          <p className="mt-6 text-zinc-300">{betaTest.description}</p>

          {/* Testing instructions */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-zinc-50 mb-4">Testing Instructions</h2>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
              {betaTest.testingInstructions.split("\n").map((line, i) => (
                <p key={i} className="text-sm text-zinc-300 py-0.5">{line}</p>
              ))}
            </div>
          </div>

          <div className="mt-4 text-sm text-zinc-500">
            <strong className="text-zinc-300">Requirements:</strong> {betaTest.requirements}
          </div>

          {/* Feedback section */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-zinc-50 mb-4">
              Feedback ({feedback.length})
            </h2>
            {feedback.length === 0 ? (
              <p className="text-zinc-500">No feedback yet. Be the first to test!</p>
            ) : (
              <div className="space-y-4">
                {feedback.map((fb) => (
                  <FeedbackItem key={fb.id} feedback={fb} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
            <div className="mb-4">
              <p className="text-sm text-zinc-500 mb-1">{betaTest.spots.filled} of {betaTest.spots.total} spots filled</p>
              <div className="h-2 rounded-full bg-zinc-800">
                <div className="h-2 rounded-full bg-indigo-600" style={{ width: `${fillPercent}%` }} />
              </div>
              <p className="mt-1 text-sm text-zinc-400">{spotsRemaining} spots remaining</p>
            </div>

            <div className="mb-4 rounded bg-zinc-800 p-3 text-center">
              <p className="text-sm text-zinc-500">Reward</p>
              <p className="text-lg font-bold text-violet-400">{betaTest.reward.description}</p>
            </div>

            <p className="mb-4 text-sm text-zinc-500">
              Deadline: {new Date(betaTest.deadline).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </p>

            {betaTest.status !== "closed" ? (
              <Button className="w-full bg-indigo-600 hover:bg-indigo-500">
                Sign Up to Test
              </Button>
            ) : (
              <Button disabled className="w-full">Testing Closed</Button>
            )}

            {/* Creator info */}
            {creator && (
              <div className="mt-6 border-t border-zinc-800 pt-4">
                <p className="text-sm text-zinc-500 mb-2">Created by</p>
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800">
                    <User className="h-4 w-4 text-zinc-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-50">{creator.displayName}</p>
                    <p className="text-xs text-zinc-500">{creator.bio}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

### File: `src/app/create/page.tsx`

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { CATEGORY_LABELS } from "@/lib/constants";
import { CheckCircle, X } from "lucide-react";

export default function CreatePage() {
  const [submitted, setSubmitted] = useState(false);
  const [techInput, setTechInput] = useState("");
  const [techStack, setTechStack] = useState<string[]>([]);
  const [includeBeta, setIncludeBeta] = useState(false);

  const addTech = () => {
    if (techInput.trim() && !techStack.includes(techInput.trim())) {
      setTechStack([...techStack, techInput.trim()]);
      setTechInput("");
    }
  };

  const removeTech = (tech: string) => {
    setTechStack(techStack.filter((t) => t !== tech));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <PageHeader title="List Your Project" description="Fill in the details to list your project on SideFlip." />

      {submitted && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-green-400">
          <CheckCircle className="h-5 w-5" />
          Listing created! (This is a demo — no data is saved.)
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basics */}
        <section>
          <h2 className="text-lg font-semibold text-zinc-50 mb-4">Basics</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Project Name *</label>
              <Input required placeholder="My Awesome SaaS" className="bg-zinc-900 border-zinc-800" />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Category *</label>
              <select required className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-50">
                <option value="">Select a category</option>
                {Object.entries(CATEGORY_LABELS).map(([slug, label]) => (
                  <option key={slug} value={slug}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">One-line Pitch *</label>
              <Input required maxLength={120} placeholder="A short, compelling description (120 chars max)" className="bg-zinc-900 border-zinc-800" />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Full Description *</label>
              <Textarea required rows={8} placeholder="Describe your project in detail. Markdown supported." className="bg-zinc-900 border-zinc-800" />
            </div>
          </div>
        </section>

        {/* Tech Stack */}
        <section>
          <h2 className="text-lg font-semibold text-zinc-50 mb-4">Tech Stack</h2>
          <div className="flex gap-2">
            <Input
              value={techInput}
              onChange={(e) => setTechInput(e.target.value)}
              placeholder="Add technology (e.g., React)"
              className="bg-zinc-900 border-zinc-800"
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTech())}
            />
            <Button type="button" onClick={addTech} variant="outline" className="border-zinc-700">Add</Button>
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {techStack.map((tech) => (
              <Badge key={tech} variant="secondary" className="bg-zinc-800 text-zinc-300 gap-1">
                {tech}
                <button type="button" onClick={() => removeTech(tech)}><X className="h-3 w-3" /></button>
              </Badge>
            ))}
          </div>
        </section>

        {/* Metrics */}
        <section>
          <h2 className="text-lg font-semibold text-zinc-50 mb-4">Metrics</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Monthly Revenue ($)</label>
              <Input type="number" min="0" placeholder="0" className="bg-zinc-900 border-zinc-800" />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Monthly Profit ($)</label>
              <Input type="number" min="0" placeholder="0" className="bg-zinc-900 border-zinc-800" />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Monthly Visitors</label>
              <Input type="number" min="0" placeholder="0" className="bg-zinc-900 border-zinc-800" />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Registered Users</label>
              <Input type="number" min="0" placeholder="0" className="bg-zinc-900 border-zinc-800" />
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section>
          <h2 className="text-lg font-semibold text-zinc-50 mb-4">Pricing</h2>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Asking Price ($) *</label>
            <Input required type="number" min="1" placeholder="5000" className="bg-zinc-900 border-zinc-800" />
          </div>
        </section>

        {/* Beta test toggle */}
        <section>
          <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <div>
              <p className="font-medium text-zinc-50">Also list as Beta Test?</p>
              <p className="text-sm text-zinc-500">Get beta testers for this project too</p>
            </div>
            <button
              type="button"
              onClick={() => setIncludeBeta(!includeBeta)}
              className={`relative h-6 w-11 rounded-full transition-colors ${includeBeta ? "bg-indigo-600" : "bg-zinc-700"}`}
            >
              <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${includeBeta ? "translate-x-5" : ""}`} />
            </button>
          </div>

          {includeBeta && (
            <div className="mt-4 space-y-4 rounded-lg border border-zinc-800 bg-zinc-900 p-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Number of Testers Needed</label>
                <Input type="number" min="1" placeholder="20" className="bg-zinc-900 border-zinc-700" />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Reward for Testers</label>
                <Input placeholder="e.g., $10 per completed test" className="bg-zinc-900 border-zinc-700" />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Testing Instructions</label>
                <Textarea rows={4} placeholder="Step-by-step instructions for testers..." className="bg-zinc-900 border-zinc-700" />
              </div>
            </div>
          )}
        </section>

        <Button type="submit" size="lg" className="w-full bg-indigo-600 hover:bg-indigo-500">
          Create Listing
        </Button>
      </form>
    </div>
  );
}
```

### File: `src/app/dashboard/page.tsx`

```tsx
"use client";

import { useState } from "react";
import { getListings, getBetaTests, getFeedback, formatPrice, getUserById } from "@/lib/data";
import { StatCard } from "@/components/shared/stat-card";
import { PageHeader } from "@/components/shared/page-header";
import { ListingCard } from "@/components/listing/listing-card";
import { BetaCard } from "@/components/beta/beta-card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Package, TestTube, MessageSquare } from "lucide-react";

const tabs = ["Overview", "My Listings", "Beta Tests", "Earnings"];

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("Overview");

  // Mock: pretend user is usr_001
  const currentUser = getUserById("usr_001");
  const myListings = getListings().filter((l) => l.sellerId === "usr_001");
  const myBetaTests = getBetaTests().filter((bt) => bt.creatorId === "usr_001");
  const allFeedback = getFeedback();

  if (!currentUser) return null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader title="Dashboard" description={`Welcome back, ${currentUser.displayName}`} />

      {/* Tabs */}
      <div className="mb-8 flex gap-1 rounded-lg bg-zinc-900 p-1 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === tab ? "bg-zinc-800 text-zinc-50" : "text-zinc-400 hover:text-zinc-50"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Overview" && (
        <div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
            <StatCard label="Total Earnings" value={formatPrice(currentUser.stats.totalEarnings)} icon={<DollarSign className="h-4 w-4" />} />
            <StatCard label="Active Listings" value={String(myListings.length)} icon={<Package className="h-4 w-4" />} />
            <StatCard label="Beta Tests" value={String(myBetaTests.length)} icon={<TestTube className="h-4 w-4" />} />
            <StatCard label="Feedback Given" value={String(currentUser.stats.feedbackGiven)} icon={<MessageSquare className="h-4 w-4" />} />
          </div>

          <h3 className="text-lg font-semibold text-zinc-50 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {[
              { text: "New feedback received on FlowBoard beta test", time: "2 hours ago" },
              { text: "Analytics Dashboard SaaS listing viewed 45 times", time: "1 day ago" },
              { text: "PingDash beta test published", time: "3 days ago" },
              { text: "RankCheck listing price updated", time: "5 days ago" },
            ].map((activity, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 p-3">
                <span className="text-sm text-zinc-300">{activity.text}</span>
                <span className="text-xs text-zinc-500 whitespace-nowrap ml-4">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "My Listings" && (
        <div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {myListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
          {myListings.length === 0 && (
            <p className="text-center text-zinc-500 py-12">You haven&apos;t listed any projects yet.</p>
          )}
        </div>
      )}

      {activeTab === "Beta Tests" && (
        <div>
          <h3 className="text-lg font-semibold text-zinc-50 mb-4">My Beta Tests</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {myBetaTests.map((bt) => (
              <BetaCard key={bt.id} betaTest={bt} />
            ))}
          </div>
          {myBetaTests.length === 0 && (
            <p className="text-center text-zinc-500 py-12">No beta tests yet.</p>
          )}
        </div>
      )}

      {activeTab === "Earnings" && (
        <div>
          <div className="grid grid-cols-3 gap-4 mb-8">
            <StatCard label="Total Earned" value={formatPrice(currentUser.stats.totalEarnings)} />
            <StatCard label="Total Sales" value={String(currentUser.stats.totalSales)} />
            <StatCard label="Avg Sale Price" value={currentUser.stats.totalSales > 0 ? formatPrice(currentUser.stats.totalEarnings / currentUser.stats.totalSales) : "$0"} />
          </div>

          {/* Placeholder earnings chart */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
            <h3 className="text-lg font-semibold text-zinc-50 mb-4">Monthly Earnings</h3>
            <div className="flex items-end gap-2 h-40">
              {[40, 65, 45, 80, 55, 90, 70, 95, 60, 85, 75, 100].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full rounded-t bg-indigo-600" style={{ height: `${h}%` }} />
                  <span className="text-[10px] text-zinc-500">{["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"][i]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

### File: `src/app/how-it-works/page.tsx`

```tsx
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
```

### File: `src/app/not-found.tsx`

```tsx
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
```

---

## STEP 12: Placeholder Images

Create simple placeholder files so the app doesn't throw missing image errors.

```bash
mkdir -p public/images
```

Create these SVG placeholder files:

### File: `public/images/placeholder-screenshot-1.png`

Use any 800x450 gray placeholder image, or create a simple one. If no image tool is available, the app will show the fallback text "Screenshot" from the listing detail page.

### File: `public/images/placeholder-avatar.png`

Use any 100x100 gray circle placeholder, or the app falls back to a Lucide User icon.

### File: `public/images/logo.svg`

The app uses the Lucide `Rocket` icon as logo, so this file is optional.

---

## STEP 13: Verification Checklist

After building everything, verify each of these:

### Build Verification

```bash
cd marketplace
npm run build
```

**Expected:** Build completes with no errors. Static HTML files generated in `out/` directory.

### Route Verification

Run `npm run dev` and check each route:

| Route | What to check |
|-------|--------------|
| `/` | Hero renders, featured listings show 4 cards, categories grid has 8 items, beta spotlight shows 3 cards |
| `/browse` | All 15 listings appear, category filter works, sort dropdown works, search filters by title/pitch |
| `/listing/lst_001` | Full detail page renders with stats, tech stack, assets checklist, seller info, "Buy" button opens payment modal |
| `/create` | All form sections visible, tech stack add/remove works, beta test toggle shows/hides section, submit shows success toast |
| `/beta` | All 8 beta tests appear, status filter buttons work, search works |
| `/beta/bt_001` | Detail page shows instructions, feedback list with 3 items, spots progress bar, creator info |
| `/dashboard` | All 4 tabs work, overview shows stats and activity, my listings shows 3 cards, earnings shows chart |
| `/how-it-works` | All sections render, FAQ accordions open/close, pipeline arrows visible on desktop |
| `/404` (any invalid route) | Custom 404 page with "Back to Home" button |

### Responsive Verification

Check these pages at **375px** (mobile), **768px** (tablet), **1280px** (desktop):

- Home page: Hero text stacks, cards stack to single column on mobile
- Browse page: Filters stack above grid on mobile, sidebar on desktop
- Listing detail: Price card stacks below content on mobile, sticky sidebar on desktop
- Dashboard: Tabs horizontally scrollable on mobile

### Interaction Verification

- [ ] Browse filters actually filter the listing data
- [ ] Search on browse page filters by title and pitch
- [ ] Sort dropdown changes listing order
- [ ] "Buy This Project" button opens payment placeholder modal
- [ ] Payment modal close button works
- [ ] Create listing form submit shows green success banner
- [ ] Tech stack input adds badges on Enter key
- [ ] Tech stack badge X button removes the badge
- [ ] Beta test toggle shows/hides additional fields
- [ ] Beta board status filter buttons work
- [ ] Dashboard tabs switch content
- [ ] FAQ accordions open and close
- [ ] Mobile navbar hamburger opens/closes menu
- [ ] All internal links navigate correctly

---

## Summary

**Total files to create:** ~30 files (types, data, components, pages, config)
**Total mock data entries:** 15 listings + 8 beta tests + 6 users + 18 feedback + 8 categories
**Pages:** 8 routes + 404
**Tech:** Next.js 15, TypeScript, Tailwind CSS 4, shadcn/ui
**Theme:** Dark (zinc-950 bg, indigo-500 accent, violet-400 prices)
