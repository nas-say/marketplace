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
  status: "active" | "sold" | "draft" | "pending_verification";
  ownershipVerified: boolean;
  ownershipVerificationMethod: "repo" | "domain" | "manual" | null;
  ownershipVerifiedAt: string | null;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}
