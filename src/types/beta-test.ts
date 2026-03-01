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
    type: "cash" | "premium_access";
    amount: number;
    description: string;
    currency: "INR" | "USD" | "EUR" | "GBP";
    poolTotalMinor: number;
    poolFundedMinor: number;
    poolStatus: "not_required" | "pending" | "partial" | "funded";
  };
  creatorId: string;
  status: "draft" | "accepting" | "almost_full" | "closed";
  deadline: string;
  createdAt: string;
  updatedAt: string;
}
