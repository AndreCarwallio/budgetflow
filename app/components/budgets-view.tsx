"use client";

import { useMemo, useState } from "react";
import type { TransactionCategory } from "../lib/transactions";
import { useTransactions } from "./transactions-provider";

const progressTones = {
  safe: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-rose-500",
} as const;

export function BudgetsView() {
  const {
    budgets,
    budgetsError,
    deleteBudget,
    formatDisplayCurrency,
    hasLoadedBudgets,
    isBudgetsLoading,
    openBudgetModal,
    transactions,
  } = useTransactions();
  const [isDeletingBudgetId, setIsDeletingBudgetId] = useState<string | null>(null);

  const spendingByCategory = useMemo(() => {
    return transactions
      .filter((item) => item.type === "expense")
      .reduce<Record<string, number>>((accumulator, transaction) => {
        accumulator[transaction.category] =
          (accumulator[transaction.category] ?? 0) + transaction.amount;
        return accumulator;
      }, {});
  }, [transactions]);

  return (
    <section className="rounded-[28px] border border-line bg-surface p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
      <div className="flex flex-col gap-4 border-b border-line pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">
            Monthly budgets
          </h2>
          <p className="mt-1 text-sm text-muted">
            Manage category caps and compare them with your current expense totals.
          </p>
        </div>

        <button
          type="button"
          onClick={() => openBudgetModal()}
          className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          New budget
        </button>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {isBudgetsLoading ? (
          <div className="grid gap-5 lg:col-span-2 lg:grid-cols-2">
            {[0, 1].map((item) => (
              <div
                key={item}
                className="space-y-5 rounded-3xl bg-slate-50 p-5"
              >
                <div className="flex animate-pulse items-start justify-between gap-4">
                  <div className="space-y-3">
                    <div className="h-4 w-20 rounded-full bg-slate-200" />
                    <div className="h-8 w-32 rounded-full bg-slate-200" />
                  </div>
                  <div className="h-7 w-14 rounded-full bg-slate-200" />
                </div>
                <div className="h-3 animate-pulse rounded-full bg-slate-200" />
                <div className="grid gap-3 sm:grid-cols-3">
                  {[0, 1, 2].map((card) => (
                    <div
                      key={card}
                      className="h-24 animate-pulse rounded-2xl bg-white"
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : budgetsError ? (
          <div className="rounded-3xl bg-rose-50 px-5 py-5 text-sm text-rose-700 lg:col-span-2">
            {budgetsError}
          </div>
        ) : budgets.length === 0 && hasLoadedBudgets ? (
          <div className="rounded-3xl bg-slate-50 px-5 py-14 text-center lg:col-span-2">
            <p className="text-base font-semibold text-slate-800">No budgets yet</p>
            <p className="mt-2 text-sm text-muted">
              Create your first category budget to track spending limits and progress throughout the month.
            </p>
          </div>
        ) : (
          budgets.map((budget) => {
            const spent =
              spendingByCategory[budget.category as TransactionCategory] ?? 0;
            const remaining = budget.monthlyLimit - spent;
            const progress = Math.min((spent / budget.monthlyLimit) * 100, 100);
            const progressTone =
              progress >= 100
                ? progressTones.danger
                : progress >= 80
                  ? progressTones.warning
                  : progressTones.safe;

            return (
              <article
                key={budget.id}
                className="rounded-3xl border border-line bg-slate-50 p-5 shadow-sm transition hover:bg-white hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted">Category</p>
                    <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                      {budget.category}
                    </h3>
                  </div>
                  <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
                    {Math.round(progress)}%
                  </div>
                </div>

                <div className="mt-5 h-3 rounded-full bg-white">
                  <div
                    className={`h-3 rounded-full ${progressTone}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-white p-4">
                    <p className="text-sm font-medium text-muted">Limit</p>
                    <p className="mt-2 text-lg font-semibold text-slate-950">
                      {formatDisplayCurrency(budget.monthlyLimit)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white p-4">
                    <p className="text-sm font-medium text-muted">Spent</p>
                    <p className="mt-2 text-lg font-semibold text-slate-950">
                      {formatDisplayCurrency(spent)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white p-4">
                    <p className="text-sm font-medium text-muted">Remaining</p>
                    <p
                      className={`mt-2 text-lg font-semibold ${
                        remaining < 0 ? "text-rose-600" : "text-slate-950"
                      }`}
                    >
                      {formatDisplayCurrency(Math.abs(remaining))}
                      {remaining < 0 ? " over" : ""}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex gap-3">
                  <button
                    type="button"
                    onClick={() => openBudgetModal(budget)}
                    className="rounded-2xl border border-line bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    disabled={isDeletingBudgetId === budget.id}
                    onClick={async () => {
                      setIsDeletingBudgetId(budget.id);
                      await deleteBudget(budget.id);
                      setIsDeletingBudgetId(null);
                    }}
                    className="rounded-2xl border border-line bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isDeletingBudgetId === budget.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
