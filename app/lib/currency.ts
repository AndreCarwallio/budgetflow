import type { CurrencyPreset } from "./transactions";

export const DEFAULT_CURRENCY_CODE = "USD";

export function createDefaultCurrencyPreset(userId: string): CurrencyPreset {
  const now = new Date().toISOString();

  return {
    id: `default-${userId}-usd`,
    userId,
    currencyCode: "USD",
    currencyLabel: "US Dollar",
    currencySymbol: "$",
    exchangeRate: 1,
    autoFillEnabled: false,
    lastFetchedAt: null,
    createdAt: now,
    updatedAt: now,
  };
}

export function convertFromBaseCurrency(amount: number, exchangeRate: number) {
  return amount * exchangeRate;
}

export function formatDisplayAmount(amount: number, currencySymbol: string) {
  const formattedAmount = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  return `${currencySymbol} ${formattedAmount}`;
}

export function normalizeCurrencyCode(currencyCode: string) {
  return currencyCode.trim().toUpperCase();
}
