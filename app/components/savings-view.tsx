"use client";

import { startTransition, useState } from "react";
import {
  getIncomeExpensesForTransactions,
  getTotalSavingsValue,
  getTransactionsInRange,
} from "../lib/dashboard-metrics";
import { getActivePeriod } from "../lib/periods";
import { useTransactions } from "./transactions-provider";

function formatCurrency(amount: number, currencySymbol: string) {
  const formattedAmount = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  return `${currencySymbol} ${formattedAmount}`;
}

export function SavingsView() {
  const {
    appSettings,
    clearSavingsGoalError,
    closeSavingsGoalModal,
    currencySymbol,
    deleteSavingsGoal,
    hasLoadedSavingsGoal,
    isSavingsGoalLoading,
    monthlySnapshots,
    openSavingsGoalModal,
    savingsGoal,
    savingsGoalError,
    transactions,
  } = useTransactions();
  const [isResettingGoal, setIsResettingGoal] = useState(false);
  const activePeriod = getActivePeriod(appSettings);
  const currentPeriodTransactions = getTransactionsInRange(
    transactions,
    activePeriod.start,
    activePeriod.endExclusive
  );
  const { remainingBalance } =
    getIncomeExpensesForTransactions(currentPeriodTransactions);
  const latestSnapshot =
    monthlySnapshots.length > 0 ? monthlySnapshots[monthlySnapshots.length - 1] : null;
  const {
    baseSavingsAmount: startingSavings,
    remainingToGoal,
    totalSavings,
  } = getTotalSavingsValue(
    savingsGoal
      ? {
          ...savingsGoal,
          currentAmount: latestSnapshot?.savingsTotal ?? savingsGoal.currentAmount,
        }
      : null,
    remainingBalance
  );
  const targetSavings = savingsGoal?.targetAmount ?? 0;
  const savingsProgress =
    targetSavings > 0
      ? Math.max(0, Math.min((totalSavings / targetSavings) * 100, 100))
      : 0;

  return (
    <>
      <section className="rounded-[28px] border border-line bg-surface p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-950">
              Savings overview
            </h2>
            <p className="mt-1 text-sm text-muted">
              Review your carried savings, current period net change, and progress toward your target savings.
            </p>
          </div>
          {!isSavingsGoalLoading && savingsGoal ? (
            <div className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
              {Math.round(savingsProgress)}% of target
            </div>
          ) : null}
        </div>

        {isSavingsGoalLoading ? (
          <div className="mt-6 space-y-4 rounded-3xl bg-slate-50 px-5 py-5">
            <div className="h-10 w-48 animate-pulse rounded-2xl bg-white" />
            <div className="h-3 w-full animate-pulse rounded-full bg-white" />
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              {[0, 1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="animate-pulse rounded-2xl bg-white px-4 py-4"
                >
                  <div className="h-3 w-24 rounded-full bg-slate-100" />
                  <div className="mt-3 h-6 w-28 rounded-full bg-slate-200" />
                </div>
              ))}
            </div>
          </div>
        ) : savingsGoalError ? (
          <div className="mt-6 rounded-2xl bg-rose-50 px-4 py-4 text-sm text-rose-700">
            {savingsGoalError}
          </div>
        ) : !savingsGoal && hasLoadedSavingsGoal ? (
          <div className="mt-6 rounded-3xl bg-slate-50 px-5 py-8">
            <p className="text-base font-semibold text-slate-900">
              No savings plan yet
            </p>
            <p className="mt-2 max-w-2xl text-sm text-muted">
              Create a savings plan to store your starting savings and target savings. Total savings updates automatically using the current period net change.
            </p>
            <button
              type="button"
              onClick={openSavingsGoalModal}
              className="mt-5 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Create savings plan
            </button>
          </div>
        ) : (
          <>
            <div className="mt-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-muted">Total Savings</p>
                  <p className="mt-2 text-4xl font-semibold tracking-tight text-slate-950">
                    {formatCurrency(totalSavings, currencySymbol)}
                  </p>
                </div>
                <div className="text-sm text-muted sm:text-right">
                  <p>Target Savings</p>
                  <p className="mt-1 font-semibold text-slate-950">
                    {formatCurrency(targetSavings, currencySymbol)}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between gap-4 text-sm">
                <span className="font-medium text-muted">Progress</span>
                <span className="font-semibold text-slate-950">
                  {Math.round(savingsProgress)}%
                </span>
              </div>

              <div className="mt-3 h-3 rounded-full bg-slate-100">
                <div
                  className="h-3 rounded-full bg-gradient-to-r from-amber-400 via-teal-400 to-sky-500 transition-[width]"
                  style={{ width: `${savingsProgress}%` }}
                />
              </div>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-line bg-slate-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Starting Savings
                </p>
                <p className="mt-3 text-xl font-semibold tracking-tight text-slate-950">
                  {formatCurrency(startingSavings, currencySymbol)}
                </p>
              </div>
              <div className="rounded-2xl border border-line bg-slate-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Current Period Net Change
                </p>
                <p
                  className={`mt-3 text-xl font-semibold tracking-tight ${
                    remainingBalance >= 0 ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {remainingBalance >= 0 ? "+" : "-"}
                  {formatCurrency(Math.abs(remainingBalance), currencySymbol)}
                </p>
              </div>
              <div className="rounded-2xl border border-line bg-slate-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Target Savings
                </p>
                <p className="mt-3 text-xl font-semibold tracking-tight text-slate-950">
                  {formatCurrency(targetSavings, currencySymbol)}
                </p>
              </div>
              <div className="rounded-2xl border border-line bg-slate-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Remaining to Target
                </p>
                <p className="mt-3 text-xl font-semibold tracking-tight text-slate-950">
                  {formatCurrency(remainingToGoal, currencySymbol)}
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={openSavingsGoalModal}
                className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Edit savings plan
              </button>
              <button
                type="button"
                disabled={isResettingGoal}
                onClick={() => {
                  setIsResettingGoal(true);
                  clearSavingsGoalError();

                  startTransition(async () => {
                    await deleteSavingsGoal();
                    closeSavingsGoalModal();
                    setIsResettingGoal(false);
                  });
                }}
                className="rounded-2xl border border-line bg-surface px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isResettingGoal ? "Resetting..." : "Reset savings plan"}
              </button>
            </div>
          </>
        )}
      </section>
    </>
  );
}
