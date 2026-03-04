import type { Currency } from "@/lib/geo";

interface WaitlistCopy {
  regionLabel: string;
  availabilityMessage: string;
  successMessage: string;
}

const COUNTRY_LABELS: Record<string, string> = {
  US: "United States",
  GB: "United Kingdom",
  CA: "Canada",
  AU: "Australia",
  SG: "Singapore",
  AE: "UAE",
};

function getRegionLabel(countryCode: string, currency: Currency): string {
  const normalized = countryCode.trim().toUpperCase();
  if (COUNTRY_LABELS[normalized]) return COUNTRY_LABELS[normalized];
  if (currency === "EUR") return "Europe";
  if (currency === "GBP") return "United Kingdom";
  return normalized || "your country";
}

export function getNonIndiaPaymentsWaitlistCopy(countryCode: string, currency: Currency): WaitlistCopy {
  const regionLabel = getRegionLabel(countryCode, currency);
  return {
    regionLabel,
    availabilityMessage: `Payments are currently live only in India. Join the ${regionLabel} waitlist for early access updates.`,
    successMessage: `Marked. You're on the ${regionLabel} waitlist and we'll email rollout details.`,
  };
}
