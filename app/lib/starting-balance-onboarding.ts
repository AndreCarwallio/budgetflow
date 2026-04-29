const PENDING_STARTING_BALANCE_KEY = "budgetflow.pendingStartingBalance";

export type PendingStartingBalance = {
  amount: number;
  skipped: boolean;
};

export function savePendingStartingBalance(value: PendingStartingBalance) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    PENDING_STARTING_BALANCE_KEY,
    JSON.stringify(value)
  );
}

export function readPendingStartingBalance() {
  if (typeof window === "undefined") {
    return null;
  }

  const rawValue = window.localStorage.getItem(PENDING_STARTING_BALANCE_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<PendingStartingBalance>;
    const amount =
      typeof parsed.amount === "number" && Number.isFinite(parsed.amount)
        ? parsed.amount
        : 0;

    return {
      amount,
      skipped: parsed.skipped === true,
    } satisfies PendingStartingBalance;
  } catch {
    return null;
  }
}

export function clearPendingStartingBalance() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(PENDING_STARTING_BALANCE_KEY);
}
