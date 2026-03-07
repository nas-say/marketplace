const DEFAULT_LOCALE_BY_CURRENCY: Record<string, string> = {
  USD: "en-US",
  INR: "en-IN",
  GBP: "en-GB",
  EUR: "en-IE",
};

export function formatPrice(amountMinor: number, currency = "USD"): string {
  const safeAmountMinor = Number.isFinite(amountMinor) ? amountMinor : 0;
  const normalizedCurrency = currency.toUpperCase();

  return new Intl.NumberFormat(DEFAULT_LOCALE_BY_CURRENCY[normalizedCurrency] ?? "en-US", {
    style: "currency",
    currency: normalizedCurrency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(safeAmountMinor / 100);
}

export function formatNumber(num: number): string {
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  }
  return num.toString();
}

export function getRevenueMultiple(askingPrice: number, mrr: number): string {
  if (mrr === 0) return "N/A";
  const multiple = askingPrice / mrr;
  return `${multiple.toFixed(1)}×`;
}
