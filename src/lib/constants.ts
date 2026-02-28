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
