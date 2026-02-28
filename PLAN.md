# SideFlip — Side Project Marketplace + Beta Tester Hub

## Codex Build Specification

> **Instructions for Codex:** Follow every step in order. Create every file exactly as specified. Do not skip steps. Do not improvise — use the exact code provided.

---

## STEP 1: Project Scaffolding

Run these commands in order from the `marketplace/` directory:

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

When prompted, accept all defaults. Then:

```bash
npx shadcn@latest init
```

When prompted by shadcn, select:
- Style: Default
- Base color: Zinc
- CSS variables: Yes

Then install shadcn components:

```bash
npx shadcn@latest add button card badge input select textarea dialog tabs avatar separator skeleton accordion
```

---

## STEP 2: Configuration Files

### File: `next.config.ts`

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
```

### File: `src/app/globals.css`

Replace the entire file with:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 240 10% 3.9%;
    --foreground: 0 0% 98%;
    --card: 240 10% 3.9%;
    --card-foreground: 0 0% 98%;
    --popover: 240 10% 3.9%;
    --popover-foreground: 0 0% 98%;
    --primary: 239 84% 67%;
    --primary-foreground: 0 0% 98%;
    --secondary: 240 3.7% 15.9%;
    --secondary-foreground: 0 0% 98%;
    --muted: 240 3.7% 15.9%;
    --muted-foreground: 240 5% 64.9%;
    --accent: 240 3.7% 15.9%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 84% 60%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 3.7% 15.9%;
    --input: 240 3.7% 15.9%;
    --ring: 239 84% 67%;
    --radius: 0.5rem;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}

/* Custom utility classes */
.price-highlight {
  @apply text-violet-400 font-bold;
}

.gradient-hero {
  background: linear-gradient(135deg, #09090b 0%, #1e1b4b 50%, #09090b 100%);
}

.card-hover {
  @apply transition-all duration-200 hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/10;
}
```

---

## STEP 3: TypeScript Type Definitions

### File: `src/types/listing.ts`

```typescript
export type Category =
  | "saas"
  | "mobile-app"
  | "chrome-extension"
  | "domain"
  | "open-source"
  | "bot-automation"
  | "api"
  | "template-theme";

export interface ListingMetrics {
  mrr: number;
  monthlyProfit: number;
  monthlyVisitors: number;
  registeredUsers: number;
  age: string;
  revenueTrend: "up" | "flat" | "down";
}

export interface Listing {
  id: string;
  slug: string;
  title: string;
  pitch: string;
  description: string;
  category: Category;
  techStack: string[];
  screenshots: string[];
  askingPrice: number;
  openToOffers: boolean;
  metrics: ListingMetrics;
  assetsIncluded: string[];
  sellerId: string;
  status: "active" | "sold" | "draft";
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### File: `src/types/beta-test.ts`

```typescript
import { Category } from "./listing";

export interface BetaTest {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: Category;
  platform: ("web" | "ios" | "android" | "desktop" | "chrome-extension")[];
  screenshots: string[];
  testingInstructions: string;
  requirements: string;
  feedbackTypes: ("bug_report" | "ux_rating" | "feature_suggestion")[];
  spots: {
    total: number;
    filled: number;
  };
  reward: {
    type: "cash" | "credits" | "free_access";
    amount: number;
    description: string;
  };
  creatorId: string;
  status: "accepting" | "almost_full" | "closed";
  deadline: string;
  createdAt: string;
  updatedAt: string;
}
```

### File: `src/types/user.ts`

```typescript
export interface User {
  id: string;
  displayName: string;
  avatar: string;
  bio: string;
  location: string;
  website: string;
  social: {
    twitter?: string;
    github?: string;
    linkedin?: string;
  };
  stats: {
    totalSales: number;
    totalEarnings: number;
    listingsCount: number;
    betaTestsCompleted: number;
    feedbackGiven: number;
    memberSince: string;
  };
  verified: boolean;
}
```

### File: `src/types/feedback.ts`

```typescript
export interface BugReport {
  title: string;
  severity: "critical" | "major" | "minor" | "cosmetic";
  stepsToReproduce: string;
  expected: string;
  actual: string;
}

export interface UxRating {
  overall: number;
  easeOfUse: number;
  visualDesign: number;
  performance: number;
  comments: string;
}

export interface FeatureSuggestion {
  title: string;
  description: string;
  priority: "must_have" | "nice_to_have" | "future";
  useCase: string;
}

export interface Feedback {
  id: string;
  betaTestId: string;
  testerId: string;
  type: "bug_report" | "ux_rating" | "feature_suggestion";
  createdAt: string;
  bugReport?: BugReport;
  uxRating?: UxRating;
  featureSuggestion?: FeatureSuggestion;
}
```

---

## STEP 4: Mock Data

### File: `data/categories.json`

```json
[
  { "slug": "saas", "label": "SaaS", "icon": "cloud", "description": "Software as a Service products", "count": 4 },
  { "slug": "mobile-app", "label": "Mobile Apps", "icon": "smartphone", "description": "iOS and Android applications", "count": 2 },
  { "slug": "chrome-extension", "label": "Chrome Extensions", "icon": "puzzle", "description": "Browser extensions and add-ons", "count": 2 },
  { "slug": "domain", "label": "Domains", "icon": "globe", "description": "Premium domain names", "count": 1 },
  { "slug": "open-source", "label": "Open Source", "icon": "git-branch", "description": "Open source projects with communities", "count": 1 },
  { "slug": "bot-automation", "label": "Bots & Automation", "icon": "bot", "description": "Automated tools and bots", "count": 2 },
  { "slug": "api", "label": "APIs", "icon": "server", "description": "API services and backends", "count": 1 },
  { "slug": "template-theme", "label": "Templates & Themes", "icon": "layout", "description": "Website templates and UI themes", "count": 2 }
]
```

### File: `data/users.json`

```json
[
  {
    "id": "usr_001",
    "displayName": "Arjun Mehta",
    "avatar": "/images/placeholder-avatar.png",
    "bio": "Full-stack dev building SaaS products. 3x founder.",
    "location": "Bangalore, India",
    "website": "https://arjunmehta.dev",
    "social": { "twitter": "arjunbuilds", "github": "arjunmehta" },
    "stats": { "totalSales": 5, "totalEarnings": 2500000, "listingsCount": 3, "betaTestsCompleted": 0, "feedbackGiven": 0, "memberSince": "2025-06-15" },
    "verified": true
  },
  {
    "id": "usr_002",
    "displayName": "Priya Sharma",
    "avatar": "/images/placeholder-avatar.png",
    "bio": "Indie hacker. Chrome extensions and micro-SaaS.",
    "location": "Mumbai, India",
    "website": "https://priyasharma.io",
    "social": { "twitter": "priyacodes", "github": "priyasharma" },
    "stats": { "totalSales": 2, "totalEarnings": 800000, "listingsCount": 4, "betaTestsCompleted": 3, "feedbackGiven": 12, "memberSince": "2025-08-01" },
    "verified": true
  },
  {
    "id": "usr_003",
    "displayName": "Rahul Verma",
    "avatar": "/images/placeholder-avatar.png",
    "bio": "Mobile dev specializing in React Native and Flutter.",
    "location": "Delhi, India",
    "website": "",
    "social": { "github": "rahulverma" },
    "stats": { "totalSales": 1, "totalEarnings": 350000, "listingsCount": 2, "betaTestsCompleted": 7, "feedbackGiven": 28, "memberSince": "2025-09-10" },
    "verified": false
  },
  {
    "id": "usr_004",
    "displayName": "Sneha Patel",
    "avatar": "/images/placeholder-avatar.png",
    "bio": "Designer turned developer. UI kits and templates.",
    "location": "Pune, India",
    "website": "https://snehapatel.design",
    "social": { "twitter": "snehadesigns", "github": "snehapatel" },
    "stats": { "totalSales": 8, "totalEarnings": 1200000, "listingsCount": 5, "betaTestsCompleted": 1, "feedbackGiven": 5, "memberSince": "2025-07-20" },
    "verified": true
  },
  {
    "id": "usr_005",
    "displayName": "Karthik Nair",
    "avatar": "/images/placeholder-avatar.png",
    "bio": "Backend engineer. APIs and automation tools.",
    "location": "Chennai, India",
    "website": "",
    "social": { "github": "karthiknair" },
    "stats": { "totalSales": 0, "totalEarnings": 0, "listingsCount": 1, "betaTestsCompleted": 15, "feedbackGiven": 42, "memberSince": "2025-10-05" },
    "verified": false
  },
  {
    "id": "usr_006",
    "displayName": "Ananya Roy",
    "avatar": "/images/placeholder-avatar.png",
    "bio": "Building in public. Newsletter + SaaS enthusiast.",
    "location": "Kolkata, India",
    "website": "https://ananyaroy.com",
    "social": { "twitter": "ananyabuilds", "github": "ananyaroy", "linkedin": "ananyaroy" },
    "stats": { "totalSales": 3, "totalEarnings": 950000, "listingsCount": 2, "betaTestsCompleted": 5, "feedbackGiven": 18, "memberSince": "2025-08-15" },
    "verified": true
  }
]
```

### File: `data/listings.json`

```json
[
  {
    "id": "lst_001",
    "slug": "analytics-dashboard-saas",
    "title": "Analytics Dashboard SaaS",
    "pitch": "Real-time analytics dashboard for e-commerce stores with Shopify integration",
    "description": "A fully functional SaaS analytics dashboard built with Next.js and PostgreSQL. Includes Shopify OAuth integration, real-time visitor tracking, conversion funnels, and automated email reports. Currently serving 45 paying customers.\n\n## Why I'm selling\nMoving on to a new venture and can't give this the attention it deserves.\n\n## What's included\n- Full source code (Next.js + PostgreSQL)\n- Shopify app listing (approved)\n- 45 active paying customers\n- All documentation and runbooks",
    "category": "saas",
    "techStack": ["Next.js", "PostgreSQL", "Tailwind", "Stripe", "Shopify API"],
    "screenshots": ["/images/placeholder-screenshot-1.png", "/images/placeholder-screenshot-2.png"],
    "askingPrice": 1500000,
    "openToOffers": true,
    "metrics": { "mrr": 85000, "monthlyProfit": 62000, "monthlyVisitors": 12000, "registeredUsers": 180, "age": "1-2yr", "revenueTrend": "up" },
    "assetsIncluded": ["source_code", "domain", "user_database", "documentation", "hosting_setup", "support_period"],
    "sellerId": "usr_001",
    "status": "active",
    "featured": true,
    "createdAt": "2026-01-15T10:00:00Z",
    "updatedAt": "2026-02-20T14:30:00Z"
  },
  {
    "id": "lst_002",
    "slug": "tab-manager-chrome-extension",
    "title": "Tab Manager Pro",
    "pitch": "Chrome extension with 8K+ users that organizes tabs into smart workspaces",
    "description": "A popular Chrome extension that automatically groups tabs by project/topic using ML-free heuristics. Features include: workspace saving, tab search, memory optimization, and keyboard shortcuts.\n\n## Why I'm selling\nBuilding a new product and need to focus.\n\n## What's included\n- Full source code (TypeScript + React)\n- Chrome Web Store listing with 8,200 users\n- 4.6 star rating (320 reviews)",
    "category": "chrome-extension",
    "techStack": ["TypeScript", "React", "Chrome APIs", "Webpack"],
    "screenshots": ["/images/placeholder-screenshot-1.png"],
    "askingPrice": 500000,
    "openToOffers": true,
    "metrics": { "mrr": 35000, "monthlyProfit": 32000, "monthlyVisitors": 3500, "registeredUsers": 8200, "age": "6-12mo", "revenueTrend": "up" },
    "assetsIncluded": ["source_code", "user_database", "documentation"],
    "sellerId": "usr_002",
    "status": "active",
    "featured": true,
    "createdAt": "2026-01-28T08:00:00Z",
    "updatedAt": "2026-02-18T11:00:00Z"
  },
  {
    "id": "lst_003",
    "slug": "fitness-tracker-mobile-app",
    "title": "FitLog - Workout Tracker",
    "pitch": "React Native fitness app with 2K downloads on both iOS and Android",
    "description": "A clean workout tracking app built with React Native and Expo. Features include custom workout plans, progress charts, rest timers, exercise library with animations, and cloud sync.\n\n## Why I'm selling\nPivoting to B2B SaaS.\n\n## What's included\n- Full React Native source code\n- App Store and Play Store listings\n- Firebase backend with user data\n- All exercise animation assets",
    "category": "mobile-app",
    "techStack": ["React Native", "Expo", "Firebase", "TypeScript"],
    "screenshots": ["/images/placeholder-screenshot-1.png", "/images/placeholder-screenshot-2.png"],
    "askingPrice": 300000,
    "openToOffers": false,
    "metrics": { "mrr": 18000, "monthlyProfit": 12000, "monthlyVisitors": 800, "registeredUsers": 2100, "age": "6-12mo", "revenueTrend": "flat" },
    "assetsIncluded": ["source_code", "user_database", "documentation", "hosting_setup"],
    "sellerId": "usr_003",
    "status": "active",
    "featured": false,
    "createdAt": "2026-02-01T12:00:00Z",
    "updatedAt": "2026-02-15T09:00:00Z"
  },
  {
    "id": "lst_004",
    "slug": "ui-component-library",
    "title": "Starter UI Kit",
    "pitch": "Premium React component library with 50+ components and dark mode support",
    "description": "A comprehensive UI component library built on Radix primitives with Tailwind CSS styling. Includes 50+ production-ready components, 12 page templates, and full Figma source files.\n\n## What's included\n- Full source code (React + TypeScript)\n- Figma design files\n- Documentation site (Storybook)\n- Commercial license",
    "category": "template-theme",
    "techStack": ["React", "TypeScript", "Tailwind", "Radix", "Storybook"],
    "screenshots": ["/images/placeholder-screenshot-1.png"],
    "askingPrice": 200000,
    "openToOffers": true,
    "metrics": { "mrr": 45000, "monthlyProfit": 44000, "monthlyVisitors": 5200, "registeredUsers": 320, "age": "1-2yr", "revenueTrend": "up" },
    "assetsIncluded": ["source_code", "documentation"],
    "sellerId": "usr_004",
    "status": "active",
    "featured": true,
    "createdAt": "2026-01-10T15:00:00Z",
    "updatedAt": "2026-02-22T16:00:00Z"
  },
  {
    "id": "lst_005",
    "slug": "twitter-bot-automation",
    "title": "TweetFlow Bot",
    "pitch": "Automated Twitter engagement bot with scheduling, analytics, and thread creation",
    "description": "A Python-based Twitter automation tool that handles scheduled posting, thread creation, engagement tracking, and follower analytics. Runs on a VPS with a simple web dashboard.\n\n## What's included\n- Full Python source code\n- Web dashboard (Flask)\n- Deployment scripts (Docker)\n- 15 active subscribers",
    "category": "bot-automation",
    "techStack": ["Python", "Flask", "Docker", "Twitter API", "Redis"],
    "screenshots": ["/images/placeholder-screenshot-1.png"],
    "askingPrice": 250000,
    "openToOffers": true,
    "metrics": { "mrr": 22000, "monthlyProfit": 18000, "monthlyVisitors": 400, "registeredUsers": 15, "age": "<6mo", "revenueTrend": "up" },
    "assetsIncluded": ["source_code", "domain", "user_database", "documentation", "hosting_setup"],
    "sellerId": "usr_005",
    "status": "active",
    "featured": false,
    "createdAt": "2026-02-10T09:00:00Z",
    "updatedAt": "2026-02-25T13:00:00Z"
  },
  {
    "id": "lst_006",
    "slug": "newsletter-platform-saas",
    "title": "LetterDrop",
    "pitch": "Self-hosted newsletter platform with drag-and-drop editor and analytics",
    "description": "A self-hosted alternative to Substack/Mailchimp for indie creators. Features a drag-and-drop email editor, subscriber management, analytics dashboard, and custom domain support.\n\n## Why I'm selling\nJoined a startup full-time.\n\n## What's included\n- Full source code (Node.js + React)\n- Docker deployment setup\n- 28 active installations\n- Documentation wiki",
    "category": "saas",
    "techStack": ["Node.js", "React", "PostgreSQL", "Docker", "SendGrid"],
    "screenshots": ["/images/placeholder-screenshot-1.png", "/images/placeholder-screenshot-2.png"],
    "askingPrice": 800000,
    "openToOffers": true,
    "metrics": { "mrr": 55000, "monthlyProfit": 42000, "monthlyVisitors": 6800, "registeredUsers": 28, "age": "1-2yr", "revenueTrend": "flat" },
    "assetsIncluded": ["source_code", "domain", "documentation", "support_period"],
    "sellerId": "usr_006",
    "status": "active",
    "featured": true,
    "createdAt": "2026-01-20T11:00:00Z",
    "updatedAt": "2026-02-19T10:00:00Z"
  },
  {
    "id": "lst_007",
    "slug": "expense-splitter-app",
    "title": "SplitEasy",
    "pitch": "Mobile expense splitting app for friend groups with UPI integration",
    "description": "A React Native app for splitting expenses among friends. Supports UPI deep links for instant payment, group management, expense history, and settlement suggestions.\n\n## What's included\n- React Native source code\n- Play Store listing (1.2K downloads)\n- Firebase backend",
    "category": "mobile-app",
    "techStack": ["React Native", "Firebase", "UPI API"],
    "screenshots": ["/images/placeholder-screenshot-1.png"],
    "askingPrice": 150000,
    "openToOffers": false,
    "metrics": { "mrr": 0, "monthlyProfit": 0, "monthlyVisitors": 300, "registeredUsers": 1200, "age": "<6mo", "revenueTrend": "flat" },
    "assetsIncluded": ["source_code", "user_database", "documentation"],
    "sellerId": "usr_003",
    "status": "active",
    "featured": false,
    "createdAt": "2026-02-05T14:00:00Z",
    "updatedAt": "2026-02-24T08:00:00Z"
  },
  {
    "id": "lst_008",
    "slug": "seo-audit-tool",
    "title": "RankCheck",
    "pitch": "Automated SEO audit tool that generates PDF reports for client websites",
    "description": "A web-based SEO audit tool that crawls websites and generates comprehensive PDF reports covering: meta tags, page speed, mobile responsiveness, broken links, heading structure, and image optimization.\n\n## What's included\n- Full source code (Python + FastAPI)\n- React frontend\n- PDF generation pipeline\n- 8 paying B2B clients",
    "category": "saas",
    "techStack": ["Python", "FastAPI", "React", "Puppeteer", "WeasyPrint"],
    "screenshots": ["/images/placeholder-screenshot-1.png"],
    "askingPrice": 600000,
    "openToOffers": true,
    "metrics": { "mrr": 40000, "monthlyProfit": 35000, "monthlyVisitors": 2100, "registeredUsers": 45, "age": "6-12mo", "revenueTrend": "up" },
    "assetsIncluded": ["source_code", "domain", "user_database", "documentation", "hosting_setup"],
    "sellerId": "usr_001",
    "status": "active",
    "featured": false,
    "createdAt": "2026-02-12T10:00:00Z",
    "updatedAt": "2026-02-26T12:00:00Z"
  },
  {
    "id": "lst_009",
    "slug": "premium-domain-devtools-io",
    "title": "devtools.io Domain",
    "pitch": "Premium .io domain perfect for developer tools or SaaS products",
    "description": "Selling the premium domain `devtools.io`. Clean history, no penalties, currently parked. Perfect for a developer tools startup.\n\n## What's included\n- Domain name only\n- Clean WHOIS history\n- Immediate transfer",
    "category": "domain",
    "techStack": [],
    "screenshots": [],
    "askingPrice": 2000000,
    "openToOffers": true,
    "metrics": { "mrr": 0, "monthlyProfit": 0, "monthlyVisitors": 50, "registeredUsers": 0, "age": "2+yr", "revenueTrend": "flat" },
    "assetsIncluded": ["domain"],
    "sellerId": "usr_006",
    "status": "active",
    "featured": false,
    "createdAt": "2026-02-01T09:00:00Z",
    "updatedAt": "2026-02-01T09:00:00Z"
  },
  {
    "id": "lst_010",
    "slug": "github-stats-readme-generator",
    "title": "ReadmeGen",
    "pitch": "Open source GitHub profile README generator with 1.2K stars",
    "description": "An open-source tool that generates beautiful GitHub profile READMEs with dynamic stats, contribution graphs, and skill badges. Includes a web editor and GitHub Action for auto-updates.\n\n## What's included\n- GitHub repo with 1.2K stars\n- Web editor source code\n- GitHub Action source\n- Sponsorship revenue ($120/mo)",
    "category": "open-source",
    "techStack": ["TypeScript", "Next.js", "GitHub API", "SVG"],
    "screenshots": ["/images/placeholder-screenshot-1.png"],
    "askingPrice": 350000,
    "openToOffers": true,
    "metrics": { "mrr": 12000, "monthlyProfit": 12000, "monthlyVisitors": 8500, "registeredUsers": 1200, "age": "1-2yr", "revenueTrend": "flat" },
    "assetsIncluded": ["source_code", "domain", "documentation"],
    "sellerId": "usr_002",
    "status": "active",
    "featured": false,
    "createdAt": "2026-01-25T16:00:00Z",
    "updatedAt": "2026-02-20T09:00:00Z"
  },
  {
    "id": "lst_011",
    "slug": "discord-moderation-bot",
    "title": "ModBot Pro",
    "pitch": "Discord moderation bot serving 500+ servers with auto-mod and analytics",
    "description": "A feature-rich Discord bot with auto-moderation, welcome messages, role management, server analytics, and custom commands. Built with Discord.js and hosted on Railway.\n\n## What's included\n- Full Node.js source code\n- 500+ active server installations\n- Railway hosting setup\n- Admin dashboard (React)",
    "category": "bot-automation",
    "techStack": ["Node.js", "Discord.js", "MongoDB", "React"],
    "screenshots": ["/images/placeholder-screenshot-1.png"],
    "askingPrice": 400000,
    "openToOffers": false,
    "metrics": { "mrr": 28000, "monthlyProfit": 22000, "monthlyVisitors": 1200, "registeredUsers": 520, "age": "1-2yr", "revenueTrend": "up" },
    "assetsIncluded": ["source_code", "user_database", "documentation", "hosting_setup"],
    "sellerId": "usr_005",
    "status": "active",
    "featured": false,
    "createdAt": "2026-02-08T13:00:00Z",
    "updatedAt": "2026-02-23T15:00:00Z"
  },
  {
    "id": "lst_012",
    "slug": "email-template-collection",
    "title": "MailCraft Templates",
    "pitch": "Collection of 80+ responsive email templates with drag-and-drop builder",
    "description": "A premium collection of 80+ responsive HTML email templates covering: welcome emails, newsletters, transactional, promotional, and notification emails. Includes a simple drag-and-drop builder.\n\n## What's included\n- 80+ HTML email templates\n- Drag-and-drop builder source (React)\n- Figma design source files\n- Commercial license for resale",
    "category": "template-theme",
    "techStack": ["HTML", "CSS", "React", "MJML"],
    "screenshots": ["/images/placeholder-screenshot-1.png"],
    "askingPrice": 180000,
    "openToOffers": true,
    "metrics": { "mrr": 30000, "monthlyProfit": 29000, "monthlyVisitors": 3800, "registeredUsers": 210, "age": "6-12mo", "revenueTrend": "up" },
    "assetsIncluded": ["source_code", "documentation"],
    "sellerId": "usr_004",
    "status": "active",
    "featured": false,
    "createdAt": "2026-02-14T11:00:00Z",
    "updatedAt": "2026-02-25T10:00:00Z"
  },
  {
    "id": "lst_013",
    "slug": "price-tracking-api",
    "title": "PriceWatch API",
    "pitch": "REST API for tracking product prices across Amazon, Flipkart, and Myntra",
    "description": "A price tracking API that monitors product prices across major Indian e-commerce platforms. Includes price history, price drop alerts, and comparison endpoints.\n\n## What's included\n- Full Python source code (FastAPI)\n- Scraping infrastructure (Playwright)\n- Redis caching layer\n- API documentation (OpenAPI)\n- 12 API key holders",
    "category": "api",
    "techStack": ["Python", "FastAPI", "Playwright", "Redis", "PostgreSQL"],
    "screenshots": ["/images/placeholder-screenshot-1.png"],
    "askingPrice": 450000,
    "openToOffers": true,
    "metrics": { "mrr": 32000, "monthlyProfit": 25000, "monthlyVisitors": 900, "registeredUsers": 12, "age": "6-12mo", "revenueTrend": "up" },
    "assetsIncluded": ["source_code", "domain", "user_database", "documentation", "hosting_setup"],
    "sellerId": "usr_001",
    "status": "active",
    "featured": false,
    "createdAt": "2026-02-18T10:00:00Z",
    "updatedAt": "2026-02-27T14:00:00Z"
  },
  {
    "id": "lst_014",
    "slug": "content-calendar-saas",
    "title": "PostPlan",
    "pitch": "Social media content calendar with auto-scheduling for Instagram and Twitter",
    "description": "A content calendar SaaS for social media managers. Features include: visual calendar, drag-and-drop scheduling, multi-platform posting (Instagram, Twitter), hashtag suggestions, and analytics.\n\n## What's included\n- Full source code (Next.js + Prisma)\n- Instagram and Twitter API integrations\n- 22 paying subscribers\n- Vercel deployment setup",
    "category": "saas",
    "techStack": ["Next.js", "Prisma", "PostgreSQL", "Instagram API", "Twitter API"],
    "screenshots": ["/images/placeholder-screenshot-1.png", "/images/placeholder-screenshot-2.png"],
    "askingPrice": 700000,
    "openToOffers": true,
    "metrics": { "mrr": 48000, "monthlyProfit": 38000, "monthlyVisitors": 4200, "registeredUsers": 85, "age": "6-12mo", "revenueTrend": "up" },
    "assetsIncluded": ["source_code", "domain", "user_database", "documentation", "hosting_setup", "support_period"],
    "sellerId": "usr_006",
    "status": "active",
    "featured": false,
    "createdAt": "2026-02-03T12:00:00Z",
    "updatedAt": "2026-02-26T11:00:00Z"
  },
  {
    "id": "lst_015",
    "slug": "url-shortener-chrome-ext",
    "title": "QuickLink",
    "pitch": "Chrome extension URL shortener with click analytics and custom slugs",
    "description": "A Chrome extension that creates short links with one click. Includes click analytics, custom slugs, QR code generation, and team sharing.\n\n## What's included\n- Chrome extension source code\n- Backend API (Node.js + Redis)\n- Chrome Web Store listing (3.5K users)\n- Documentation",
    "category": "chrome-extension",
    "techStack": ["TypeScript", "React", "Node.js", "Redis"],
    "screenshots": ["/images/placeholder-screenshot-1.png"],
    "askingPrice": 280000,
    "openToOffers": false,
    "metrics": { "mrr": 15000, "monthlyProfit": 12000, "monthlyVisitors": 1800, "registeredUsers": 3500, "age": "6-12mo", "revenueTrend": "flat" },
    "assetsIncluded": ["source_code", "domain", "user_database", "documentation"],
    "sellerId": "usr_002",
    "status": "active",
    "featured": false,
    "createdAt": "2026-02-16T09:00:00Z",
    "updatedAt": "2026-02-24T16:00:00Z"
  }
]
```

### File: `data/beta-tests.json`

```json
[
  {
    "id": "bt_001",
    "slug": "kanban-board-app",
    "title": "FlowBoard - Kanban for Solo Devs",
    "description": "A minimalist Kanban board built specifically for solo developers. Features include: GitHub issue sync, time tracking per card, weekly velocity reports, and keyboard-first navigation. Looking for testers to validate the workflow before public launch.",
    "category": "saas",
    "platform": ["web"],
    "screenshots": ["/images/placeholder-screenshot-1.png"],
    "testingInstructions": "1. Sign up at the provided link\n2. Create a new board\n3. Try importing from GitHub issues\n4. Move cards through columns\n5. Test the keyboard shortcuts (press ? for help)\n6. Check the weekly report feature",
    "requirements": "Web browser, GitHub account, 20 minutes",
    "feedbackTypes": ["bug_report", "ux_rating", "feature_suggestion"],
    "spots": { "total": 20, "filled": 12 },
    "reward": { "type": "cash", "amount": 1500, "description": "$15 per completed test" },
    "creatorId": "usr_001",
    "status": "accepting",
    "deadline": "2026-03-15T23:59:00Z",
    "createdAt": "2026-02-10T10:00:00Z",
    "updatedAt": "2026-02-25T14:00:00Z"
  },
  {
    "id": "bt_002",
    "slug": "recipe-sharing-app",
    "title": "CookBook - Social Recipe App",
    "description": "A social recipe sharing app where users can post recipes, follow cooks, and build meal plans. Testing the core sharing and discovery experience before adding paid features.",
    "category": "mobile-app",
    "platform": ["ios", "android"],
    "screenshots": ["/images/placeholder-screenshot-1.png"],
    "testingInstructions": "1. Download via TestFlight/Play Store beta\n2. Create a profile\n3. Post at least 1 recipe with photos\n4. Browse and save recipes from others\n5. Try creating a weekly meal plan\n6. Test the grocery list generator",
    "requirements": "iOS 16+ or Android 12+, 30 minutes",
    "feedbackTypes": ["bug_report", "ux_rating"],
    "spots": { "total": 30, "filled": 22 },
    "reward": { "type": "free_access", "amount": 0, "description": "Lifetime premium access" },
    "creatorId": "usr_003",
    "status": "almost_full",
    "deadline": "2026-03-10T23:59:00Z",
    "createdAt": "2026-02-05T09:00:00Z",
    "updatedAt": "2026-02-26T11:00:00Z"
  },
  {
    "id": "bt_003",
    "slug": "invoice-generator-tool",
    "title": "InvoiceQuick - Fast Invoicing for Freelancers",
    "description": "A web-based invoice generator designed for Indian freelancers. Supports GST calculations, multiple currencies, recurring invoices, and PDF export. Need testers to validate the GST compliance features.",
    "category": "saas",
    "platform": ["web"],
    "screenshots": ["/images/placeholder-screenshot-1.png"],
    "testingInstructions": "1. Create an account\n2. Set up your business profile with GSTIN\n3. Create 3 invoices with different GST slabs (5%, 12%, 18%)\n4. Test PDF export and email sending\n5. Try the recurring invoice feature\n6. Verify calculations match expected GST amounts",
    "requirements": "Web browser, basic understanding of GST, 25 minutes",
    "feedbackTypes": ["bug_report", "feature_suggestion"],
    "spots": { "total": 15, "filled": 8 },
    "reward": { "type": "cash", "amount": 2000, "description": "$20 per completed test" },
    "creatorId": "usr_006",
    "status": "accepting",
    "deadline": "2026-03-20T23:59:00Z",
    "createdAt": "2026-02-15T12:00:00Z",
    "updatedAt": "2026-02-27T09:00:00Z"
  },
  {
    "id": "bt_004",
    "slug": "bookmark-manager-extension",
    "title": "PinIt - Smart Bookmark Manager",
    "description": "A Chrome extension that auto-categorizes bookmarks, adds tags, and provides full-text search across saved pages. Testing the auto-categorization accuracy and search speed.",
    "category": "chrome-extension",
    "platform": ["chrome-extension"],
    "screenshots": ["/images/placeholder-screenshot-1.png"],
    "testingInstructions": "1. Install the extension from provided link\n2. Import your existing bookmarks\n3. Bookmark 10 new pages across different topics\n4. Check if auto-categories are accurate\n5. Test the search functionality\n6. Try the tag editing feature",
    "requirements": "Chrome browser, 50+ existing bookmarks preferred, 15 minutes",
    "feedbackTypes": ["bug_report", "ux_rating", "feature_suggestion"],
    "spots": { "total": 25, "filled": 25 },
    "reward": { "type": "credits", "amount": 500, "description": "500 SideFlip credits" },
    "creatorId": "usr_002",
    "status": "closed",
    "deadline": "2026-02-28T23:59:00Z",
    "createdAt": "2026-02-01T08:00:00Z",
    "updatedAt": "2026-02-22T17:00:00Z"
  },
  {
    "id": "bt_005",
    "slug": "code-snippet-manager",
    "title": "SnipVault - Code Snippet Manager",
    "description": "A desktop app for organizing code snippets with syntax highlighting, tags, and instant search. Built with Tauri for fast native performance. Testing cross-platform compatibility.",
    "category": "open-source",
    "platform": ["desktop"],
    "screenshots": ["/images/placeholder-screenshot-1.png"],
    "testingInstructions": "1. Download for your OS (macOS/Windows/Linux)\n2. Create 5+ code snippets in different languages\n3. Test the search by keyword and tag\n4. Try the VS Code import feature\n5. Test copy-to-clipboard functionality\n6. Check performance with 100+ snippets (use the demo data generator)",
    "requirements": "macOS 12+, Windows 10+, or Ubuntu 20.04+, 20 minutes",
    "feedbackTypes": ["bug_report", "ux_rating"],
    "spots": { "total": 40, "filled": 18 },
    "reward": { "type": "free_access", "amount": 0, "description": "Free lifetime license when launched" },
    "creatorId": "usr_005",
    "status": "accepting",
    "deadline": "2026-04-01T23:59:00Z",
    "createdAt": "2026-02-20T10:00:00Z",
    "updatedAt": "2026-02-27T16:00:00Z"
  },
  {
    "id": "bt_006",
    "slug": "portfolio-builder",
    "title": "DevFolio - Developer Portfolio Builder",
    "description": "A no-code portfolio builder specifically for developers. Auto-imports projects from GitHub, generates project descriptions, and deploys to a custom domain. Testing the GitHub import and template system.",
    "category": "saas",
    "platform": ["web"],
    "screenshots": ["/images/placeholder-screenshot-1.png"],
    "testingInstructions": "1. Sign up with GitHub\n2. Let it auto-import your repos\n3. Select 5 projects to feature\n4. Choose a template and customize colors\n5. Preview the generated portfolio\n6. Test the custom domain setup (optional)",
    "requirements": "GitHub account with 5+ public repos, 20 minutes",
    "feedbackTypes": ["ux_rating", "feature_suggestion"],
    "spots": { "total": 20, "filled": 14 },
    "reward": { "type": "cash", "amount": 1000, "description": "$10 per completed test" },
    "creatorId": "usr_004",
    "status": "accepting",
    "deadline": "2026-03-25T23:59:00Z",
    "createdAt": "2026-02-18T14:00:00Z",
    "updatedAt": "2026-02-26T13:00:00Z"
  },
  {
    "id": "bt_007",
    "slug": "habit-streak-app",
    "title": "StreakUp - Daily Habit Tracker",
    "description": "A mobile habit tracker focused on streaks and accountability. Features include habit chains, friend challenges, streak insurance, and weekly reflection prompts. Testing the social/challenge features.",
    "category": "mobile-app",
    "platform": ["ios", "android"],
    "screenshots": ["/images/placeholder-screenshot-1.png"],
    "testingInstructions": "1. Download via TestFlight/Play Store beta\n2. Create 3 daily habits\n3. Log habits for 3 consecutive days\n4. Invite a friend and create a challenge\n5. Test the streak insurance feature\n6. Complete one weekly reflection",
    "requirements": "iOS 15+ or Android 11+, commitment to use for 3 days, 10 min/day",
    "feedbackTypes": ["bug_report", "ux_rating", "feature_suggestion"],
    "spots": { "total": 50, "filled": 31 },
    "reward": { "type": "cash", "amount": 2500, "description": "$25 per completed 3-day test" },
    "creatorId": "usr_003",
    "status": "accepting",
    "deadline": "2026-03-30T23:59:00Z",
    "createdAt": "2026-02-22T09:00:00Z",
    "updatedAt": "2026-02-27T18:00:00Z"
  },
  {
    "id": "bt_008",
    "slug": "api-monitoring-dashboard",
    "title": "PingDash - API Uptime Monitor",
    "description": "A lightweight API monitoring dashboard that checks endpoints every minute, tracks response times, and sends alerts via Slack/email. Testing the alerting reliability and dashboard UX.",
    "category": "saas",
    "platform": ["web"],
    "screenshots": ["/images/placeholder-screenshot-1.png"],
    "testingInstructions": "1. Create an account\n2. Add 3 API endpoints to monitor\n3. Configure Slack webhook for alerts\n4. Wait for the first monitoring cycle (1 min)\n5. Deliberately break an endpoint and verify alert fires\n6. Check the response time charts",
    "requirements": "Web browser, at least 1 API endpoint to monitor, Slack workspace, 15 minutes",
    "feedbackTypes": ["bug_report", "feature_suggestion"],
    "spots": { "total": 15, "filled": 6 },
    "reward": { "type": "free_access", "amount": 0, "description": "6 months free premium" },
    "creatorId": "usr_001",
    "status": "accepting",
    "deadline": "2026-03-15T23:59:00Z",
    "createdAt": "2026-02-24T11:00:00Z",
    "updatedAt": "2026-02-27T12:00:00Z"
  }
]
```

### File: `data/feedback.json`

```json
[
  {
    "id": "fb_001", "betaTestId": "bt_001", "testerId": "usr_003", "type": "bug_report", "createdAt": "2026-02-12T14:30:00Z",
    "bugReport": { "title": "GitHub import fails for private repos", "severity": "major", "stepsToReproduce": "1. Connect GitHub account\n2. Try importing issues from a private repo\n3. Click 'Import'", "expected": "Issues should import successfully", "actual": "Error 403: Forbidden. No helpful error message shown." }
  },
  {
    "id": "fb_002", "betaTestId": "bt_001", "testerId": "usr_005", "type": "ux_rating", "createdAt": "2026-02-13T09:15:00Z",
    "uxRating": { "overall": 4, "easeOfUse": 5, "visualDesign": 4, "performance": 3, "comments": "Love the keyboard shortcuts. The board feels snappy. Only concern is that the weekly report takes 2-3 seconds to load even with a small board." }
  },
  {
    "id": "fb_003", "betaTestId": "bt_001", "testerId": "usr_004", "type": "feature_suggestion", "createdAt": "2026-02-14T11:00:00Z",
    "featureSuggestion": { "title": "Pomodoro timer per card", "description": "It would be great to have a built-in Pomodoro timer that you can start from any card. Track time spent per card automatically.", "priority": "nice_to_have", "useCase": "I use Pomodoro for deep work and currently switch between FlowBoard and a separate timer app." }
  },
  {
    "id": "fb_004", "betaTestId": "bt_002", "testerId": "usr_005", "type": "bug_report", "createdAt": "2026-02-08T16:45:00Z",
    "bugReport": { "title": "App crashes when uploading large recipe photos", "severity": "critical", "stepsToReproduce": "1. Create a new recipe\n2. Take a photo with iPhone 15 (48MP mode)\n3. Tap 'Add Photo'\n4. App crashes immediately", "expected": "Photo should be compressed and uploaded", "actual": "App crashes with no error. Recipe draft is lost." }
  },
  {
    "id": "fb_005", "betaTestId": "bt_002", "testerId": "usr_004", "type": "ux_rating", "createdAt": "2026-02-09T10:30:00Z",
    "uxRating": { "overall": 3, "easeOfUse": 3, "visualDesign": 4, "performance": 2, "comments": "Beautiful design but the app is sluggish on Android. Scrolling through the recipe feed stutters. The meal plan feature is confusing — I couldn't figure out how to add a recipe to Wednesday without reading the help docs." }
  },
  {
    "id": "fb_006", "betaTestId": "bt_003", "testerId": "usr_002", "type": "bug_report", "createdAt": "2026-02-18T13:20:00Z",
    "bugReport": { "title": "GST calculation wrong for interstate invoices", "severity": "critical", "stepsToReproduce": "1. Set business state as Maharashtra\n2. Create invoice for client in Karnataka\n3. Add item with 18% GST", "expected": "Should show IGST 18%", "actual": "Shows CGST 9% + SGST 9% (wrong for interstate)" }
  },
  {
    "id": "fb_007", "betaTestId": "bt_003", "testerId": "usr_005", "type": "feature_suggestion", "createdAt": "2026-02-19T15:00:00Z",
    "featureSuggestion": { "title": "Multi-currency support with live rates", "description": "For freelancers billing international clients, it would be helpful to create invoices in USD/EUR with automatic INR conversion using live exchange rates.", "priority": "must_have", "useCase": "I bill 3 US clients monthly and currently calculate conversions manually." }
  },
  {
    "id": "fb_008", "betaTestId": "bt_004", "testerId": "usr_006", "type": "ux_rating", "createdAt": "2026-02-05T11:00:00Z",
    "uxRating": { "overall": 5, "easeOfUse": 5, "visualDesign": 4, "performance": 5, "comments": "This is exactly what I needed. Auto-categorization is surprisingly accurate (got 8/10 right). Search is instant even with 200+ bookmarks. Only wish: dark mode." }
  },
  {
    "id": "fb_009", "betaTestId": "bt_004", "testerId": "usr_003", "type": "bug_report", "createdAt": "2026-02-06T14:30:00Z",
    "bugReport": { "title": "Import duplicates bookmarks from folders", "severity": "minor", "stepsToReproduce": "1. Have bookmarks in nested folders\n2. Click 'Import all bookmarks'\n3. Check imported list", "expected": "Each bookmark imported once", "actual": "Bookmarks in nested folders appear twice" }
  },
  {
    "id": "fb_010", "betaTestId": "bt_005", "testerId": "usr_002", "type": "bug_report", "createdAt": "2026-02-22T10:00:00Z",
    "bugReport": { "title": "VS Code import only picks up .js files", "severity": "major", "stepsToReproduce": "1. Open SnipVault\n2. Click 'Import from VS Code'\n3. Check imported snippets", "expected": "Should import snippets for all languages", "actual": "Only JavaScript/TypeScript snippets are imported. Python, Go, Rust snippets are missing." }
  },
  {
    "id": "fb_011", "betaTestId": "bt_005", "testerId": "usr_006", "type": "ux_rating", "createdAt": "2026-02-23T09:00:00Z",
    "uxRating": { "overall": 4, "easeOfUse": 4, "visualDesign": 5, "performance": 4, "comments": "Gorgeous app. The Tauri build feels native and fast. Syntax highlighting is excellent. Two minor gripes: no way to bulk-tag snippets, and the search doesn't match against code content (only titles and tags)." }
  },
  {
    "id": "fb_012", "betaTestId": "bt_006", "testerId": "usr_003", "type": "ux_rating", "createdAt": "2026-02-20T16:00:00Z",
    "uxRating": { "overall": 4, "easeOfUse": 4, "visualDesign": 5, "performance": 4, "comments": "The GitHub auto-import is magic. Picked up all my projects with accurate descriptions. Template selection is clean. Only issue: the custom domain setup docs are confusing." }
  },
  {
    "id": "fb_013", "betaTestId": "bt_006", "testerId": "usr_005", "type": "feature_suggestion", "createdAt": "2026-02-21T11:00:00Z",
    "featureSuggestion": { "title": "Blog section for portfolio", "description": "Many developers want a blog alongside their portfolio. Adding a basic markdown blog with RSS feed would make this a complete solution.", "priority": "nice_to_have", "useCase": "I currently use a separate blog on Hashnode but would prefer everything in one place." }
  },
  {
    "id": "fb_014", "betaTestId": "bt_007", "testerId": "usr_004", "type": "bug_report", "createdAt": "2026-02-24T08:30:00Z",
    "bugReport": { "title": "Streak counter resets at midnight UTC instead of local time", "severity": "major", "stepsToReproduce": "1. Set timezone to IST (UTC+5:30)\n2. Log a habit at 11:30 PM IST\n3. Check streak the next morning", "expected": "Streak should continue (logged before midnight IST)", "actual": "Streak shows as broken because it uses UTC midnight" }
  },
  {
    "id": "fb_015", "betaTestId": "bt_007", "testerId": "usr_006", "type": "ux_rating", "createdAt": "2026-02-25T10:00:00Z",
    "uxRating": { "overall": 4, "easeOfUse": 5, "visualDesign": 4, "performance": 5, "comments": "Addictive in the best way. The streak insurance is a clever feature. Friend challenges are fun. Would love to see some data visualization — a calendar heatmap like GitHub's contribution graph." }
  },
  {
    "id": "fb_016", "betaTestId": "bt_007", "testerId": "usr_002", "type": "feature_suggestion", "createdAt": "2026-02-25T14:00:00Z",
    "featureSuggestion": { "title": "Habit templates library", "description": "Pre-built habit templates like 'Morning Routine', 'Fitness Basics', 'Learning to Code' that users can one-click install instead of creating habits from scratch.", "priority": "nice_to_have", "useCase": "New users often don't know what habits to track. Templates would reduce onboarding friction." }
  },
  {
    "id": "fb_017", "betaTestId": "bt_008", "testerId": "usr_004", "type": "bug_report", "createdAt": "2026-02-26T09:00:00Z",
    "bugReport": { "title": "Slack alerts fire twice for the same incident", "severity": "minor", "stepsToReproduce": "1. Add an endpoint monitor\n2. Take the endpoint down\n3. Wait for alert", "expected": "One Slack alert when endpoint goes down", "actual": "Two identical Slack messages arrive within 10 seconds" }
  },
  {
    "id": "fb_018", "betaTestId": "bt_008", "testerId": "usr_002", "type": "feature_suggestion", "createdAt": "2026-02-27T11:00:00Z",
    "featureSuggestion": { "title": "Status page generator", "description": "Auto-generate a public status page (like status.example.com) from the monitored endpoints. Show uptime percentage and incident history.", "priority": "must_have", "useCase": "Every SaaS needs a status page. If PingDash can auto-generate one from the monitoring data, it saves setting up a separate tool." }
  }
]
```

---

## STEP 5: Utility Libraries

### File: `src/lib/constants.ts`

```typescript
export const SITE_NAME = "SideFlip";
export const SITE_DESCRIPTION = "Buy, sell & beta-test side projects. The marketplace for indie hackers.";

export const NAV_LINKS = [
  { label: "Browse", href: "/browse" },
  { label: "Beta Tests", href: "/beta" },
  { label: "List Project", href: "/create" },
  { label: "Dashboard", href: "/dashboard" },
];

export const CATEGORY_LABELS: Record<string, string> = {
  saas: "SaaS",
  "mobile-app": "Mobile Apps",
  "chrome-extension": "Chrome Extensions",
  domain: "Domains",
  "open-source": "Open Source",
  "bot-automation": "Bots & Automation",
  api: "APIs",
  "template-theme": "Templates & Themes",
};

export const CATEGORY_ICONS: Record<string, string> = {
  saas: "Cloud",
  "mobile-app": "Smartphone",
  "chrome-extension": "Puzzle",
  domain: "Globe",
  "open-source": "GitBranch",
  "bot-automation": "Bot",
  api: "Server",
  "template-theme": "Layout",
};
```

### File: `src/lib/data.ts`

```typescript
import listingsData from "../../data/listings.json";
import betaTestsData from "../../data/beta-tests.json";
import usersData from "../../data/users.json";
import categoriesData from "../../data/categories.json";
import feedbackData from "../../data/feedback.json";
import { Listing } from "@/types/listing";
import { BetaTest } from "@/types/beta-test";
import { User } from "@/types/user";
import { Feedback } from "@/types/feedback";

export function getListings(): Listing[] {
  return listingsData as Listing[];
}

export function getFeaturedListings(): Listing[] {
  return getListings().filter((l) => l.featured);
}

export function getListingById(id: string): Listing | undefined {
  return getListings().find((l) => l.id === id);
}

export function getListingsByCategory(category: string): Listing[] {
  return getListings().filter((l) => l.category === category);
}

export function getBetaTests(): BetaTest[] {
  return betaTestsData as BetaTest[];
}

export function getActiveBetaTests(): BetaTest[] {
  return getBetaTests().filter((bt) => bt.status !== "closed");
}

export function getBetaTestById(id: string): BetaTest | undefined {
  return getBetaTests().find((bt) => bt.id === id);
}

export function getUsers(): User[] {
  return usersData as User[];
}

export function getUserById(id: string): User | undefined {
  return getUsers().find((u) => u.id === id);
}

export function getCategories() {
  return categoriesData;
}

export function getFeedback(): Feedback[] {
  return feedbackData as Feedback[];
}

export function getFeedbackByBetaTest(betaTestId: string): Feedback[] {
  return getFeedback().filter((f) => f.betaTestId === betaTestId);
}

export function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function formatNumber(num: number): string {
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  }
  return num.toString();
}
```

---

> **CONTINUED IN PART 2** — The remaining steps (6-12) cover all layout components, shared components, feature components, page files, and the verification checklist. See `PLAN_PART2.md`.
