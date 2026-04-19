// Frankfurter is a free, no-key exchange-rate API documented at:
// https://frankfurter.dev/docs
// We use it only to optionally refresh a preset's saved rate.
export async function fetchExchangeRate(
  baseCurrencyCode: string,
  targetCurrencyCode: string
) {
  if (baseCurrencyCode === targetCurrencyCode) {
    return {
      exchangeRate: 1,
      fetchedAt: new Date().toISOString(),
    };
  }

  const response = await fetch(
    `https://api.frankfurter.dev/v2/rate/${baseCurrencyCode}/${targetCurrencyCode}`,
    { cache: "no-store" }
  );

  if (!response.ok) {
    throw new Error("Unable to fetch the latest exchange rate.");
  }

  const data = (await response.json()) as {
    date?: string;
    rate?: number;
  };

  if (typeof data.rate !== "number" || !Number.isFinite(data.rate)) {
    throw new Error("Exchange-rate response did not include a valid rate.");
  }

  return {
    exchangeRate: data.rate,
    fetchedAt: data.date
      ? new Date(`${data.date}T00:00:00Z`).toISOString()
      : new Date().toISOString(),
  };
}
