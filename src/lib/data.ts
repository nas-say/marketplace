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
