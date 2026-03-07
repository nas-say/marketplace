export const SITE_NAME = "SideFlip";
export const SITE_DESCRIPTION = "Buy, sell & beta-test side projects. The marketplace for indie hackers.";

export const NAV_LINKS = [
  { label: "Browse", href: "/browse" },
  { label: "Beta Tests", href: "/beta" },
  { label: "List Project", href: "/create" },
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

export const CATEGORY_ACCENT_CLASSES: Record<string, string> = {
  saas: "from-blue-500/30 via-sky-400/18 to-cyan-300/10",
  "mobile-app": "from-sky-500/30 via-cyan-400/18 to-teal-300/10",
  "chrome-extension": "from-indigo-500/30 via-blue-400/18 to-sky-300/10",
  domain: "from-emerald-500/28 via-lime-400/18 to-amber-300/10",
  "open-source": "from-orange-500/28 via-amber-400/18 to-yellow-300/10",
  "bot-automation": "from-cyan-500/28 via-teal-400/18 to-emerald-300/10",
  api: "from-rose-500/28 via-orange-400/18 to-amber-300/10",
  "template-theme": "from-amber-500/28 via-yellow-400/18 to-sky-300/10",
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
