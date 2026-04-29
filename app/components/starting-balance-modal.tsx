"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useTransactions } from "./transactions-provider";

export function StartingBalanceModal() {
  const {
    closeStartingBalanceModal,
    formatDisplayCurrency,
    isStartingBalanceModalOpen,
    monthlySnapshots,
    saveStartingBalance,
    savingsGoal,
    savingsGoalError,
    skipStartingBalanceSetup,
    startingBalanceSetupMode,
  } = useTransactions();
  const [amount, setAmount] = useState("");
  const [isPending, startTransition] = useTransition();

  const currentBalance = useMemo(() => {
    if (savingsGoal) {
      return savingsGoal.currentAmount;
    }

    return monthlySnapshots[monthlySnapshots.length - 1]?.savingsTotal ?? 0;
  }, [monthlySnapshots, savingsGoal]);

  useEffect(() => {
    setAmount(currentBalance.toFixed(2));
  }, [currentBalance, isStartingBalanceModalOpen]);

  if (!isStartingBalanceModalOpen) {
    return null;
  }

  const isOnboarding = startingBalanceSetupMode === "onboarding";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-[32px] border border-white/50 bg-white p-6 shadow-[0_30px_80px_rgba(15,23,42,0.24)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.22em] text-muted">
              BudgetFlow
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              {isOnboarding
                ? "Set your starting balance"
                : "Edit Balance Brought Forward"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              {isOnboarding
                ? "Enter the balance you are bringing into this month. You can also skip this and start from 0."
                : "This is the balance carried into the current live month before this month’s income and expenses are applied."}
            </p>
            {isOnboarding ? (
              <p className="mt-2 text-sm text-muted">
                You can enter this later in Settings.
              </p>
            ) : null}
          </div>
          {!isOnboarding ? (
            <button
              type="button"
              onClick={closeStartingBalanceModal}
              className="rounded-2xl border border-line px-3 py-2 text-sm font-medium text-muted transition hover:bg-slate-50 hover:text-slate-900"
            >
              Close
            </button>
          ) : null}
        </div>

        <form
          className="mt-6 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();

            startTransition(async () => {
              await saveStartingBalance(Number.parseFloat(amount || "0"));
            });
          }}
        >
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">
              Balance Brought Forward
            </span>
            <input
              step="0.01"
              type="number"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="0.00"
              className="w-full rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-400"
            />
          </label>

          {!isOnboarding ? (
            <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-muted">
              Current saved value:{" "}
              <span className="font-semibold text-slate-950">
                {formatDisplayCurrency(currentBalance)}
              </span>
            </div>
          ) : null}

          {savingsGoalError ? (
            <div className="rounded-2xl bg-rose-50 px-4 py-4 text-sm text-rose-700">
              {savingsGoalError}
            </div>
          ) : null}

          <div className="flex justify-end gap-3">
            {isOnboarding ? (
              <button
                type="button"
                disabled={isPending}
                onClick={() => {
                  startTransition(async () => {
                    await skipStartingBalanceSetup();
                  });
                }}
                className="rounded-2xl border border-line px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
              >
                Skip for now
              </button>
            ) : (
              <button
                type="button"
                onClick={closeStartingBalanceModal}
                className="rounded-2xl border border-line px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={isPending}
              className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-700"
            >
              {isPending
                ? "Saving..."
                : isOnboarding
                  ? "Save starting balance"
                  : "Save balance"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
