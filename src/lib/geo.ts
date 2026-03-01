import { headers } from "next/headers";

export type Currency = "USD" | "INR" | "EUR" | "GBP";

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: "$",
  INR: "₹",
  EUR: "€",
  GBP: "£",
};

// EU member states (ISO 3166-1 alpha-2)
const EU_COUNTRIES = new Set([
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE",
  "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT",
  "RO", "SK", "SI", "ES", "SE",
]);

// Vercel automatically sets x-vercel-ip-country on all requests.
// Falls back to USD in local dev where the header is absent.
export async function getVisitorCurrency(): Promise<Currency> {
  const country = await getVisitorCountryCode();
  if (country === "IN") return "INR";
  if (country === "GB") return "GBP";
  if (EU_COUNTRIES.has(country)) return "EUR";
  return "USD";
}

export async function getVisitorCountryCode(): Promise<string> {
  const headersList = await headers();
  return (headersList.get("x-vercel-ip-country") ?? "").toUpperCase();
}
