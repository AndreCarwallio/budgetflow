"use client";

import { useState } from "react";
import {
  getBudgetUsageSummary,
  getCurrentMonthCategorySpending,
  getMonthlyIncomeExpenses,
  getMonthlySpendingPoints,
  getTotalSavingsValue,
  getWeeklySpendingPoints,
} from "../lib/dashboard-metrics";
import { useTransactions } from "./transactions-provider";

const categoryBreakdownColors = [
  "bg-slate-900",
  "bg-teal-600",
  "bg-sky-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-violet-500",
  "bg-slate-400",
] as const;

function formatCurrency(amount: number, currencySymbol: string) {
  const formattedAmount = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  return `${currencySymbol} ${formattedAmount}`;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

function SummaryCard({
  title,
  value,
  detail,
  tone,
  badge,
}: {
  title: string;
  value: string;
  detail: string;
  tone: string;
  badge: string;
}) {
  return (
    <section className="rounded-3xl border border-line bg-surface p-5 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted">{title}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
            {value}
          </p>
        </div>
        <div className={`rounded-full px-3 py-1 text-xs font-semibold ${tone}`}>
          {badge}
        </div>
      </div>
      <p className="mt-4 text-sm text-muted">{detail}</p>
    </section>
  );
}

export function DashboardView() {
  const {
    budgets,
    hasLoadedBudgets,
    currencySymbol,
    hasLoadedTransactions,
    isBudgetsLoading,
    isTransactionsLoading,
    savingsGoal,
    transactions,
    transactionsError,
  } = useTransactions();
  const [trendView, setTrendView] = useState<"weekly" | "monthly">("monthly");
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >({});
  const { expenses, income, monthlyTransactions, remainingBalance } =
    getMonthlyIncomeExpenses(transactions);
  const { baseSavingsAmount, totalSavings } = getTotalSavingsValue(
    savingsGoal,
    remainingBalance
  );
  const recentTransactions = [...transactions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 4);
  const trendPoints =
    trendView === "weekly"
      ? getWeeklySpendingPoints(transactions)
      : getMonthlySpendingPoints(transactions);
  const maxTrendAmount = Math.max(...trendPoints.map((point) => point.amount), 1);

  const breakdown = Object.entries(
    getCurrentMonthCategorySpending(monthlyTransactions)
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);
  const breakdownTotal = breakdown.reduce(
    (sum, [, amount]) => sum + amount,
    0
  );
  const budgetUsageSummary = getBudgetUsageSummary(budgets, transactions);
  const subcategoryBreakdown = monthlyTransactions
    .filter((transaction) => transaction.type === "expense" && transaction.subcategory)
    .reduce<Record<string, Record<string, number>>>((accumulator, transaction) => {
      const category = transaction.category;
      const subcategory = transaction.subcategory ?? "Other";

      if (!accumulator[category]) {
        accumulator[category] = {};
      }

      accumulator[category][subcategory] =
        (accumulator[category][subcategory] ?? 0) + transaction.amount;

      return accumulator;
    }, {});

  return (
    <>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Total Income"
          value={formatCurrency(income, currencySymbol)}
          detail="Income recorded for the current month"
          tone="bg-emerald-50 text-emerald-700"
          badge="Monthly"
        />
        <SummaryCard
          title="Total Expenses"
          value={formatCurrency(expenses, currencySymbol)}
          detail="Expense activity recorded this month"
          tone="bg-rose-50 text-rose-700"
          badge="Monthly"
        />
        <SummaryCard
          title="Total Balance"
          value={formatCurrency(remainingBalance, currencySymbol)}
          detail={`Monthly income minus expenses for the current period`}
          tone="bg-sky-50 text-sky-700"
          badge="Monthly"
        />
        <SummaryCard
          title="Savings"
          value={formatCurrency(totalSavings, currencySymbol)}
          detail={`Includes ${formatCurrency(baseSavingsAmount, currencySymbol)} base savings and ${formatCurrency(
            remainingBalance,
            currencySymbol
          )} monthly savings`}
          tone="bg-amber-50 text-amber-700"
          badge="Total"
        />
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.55fr_1fr]">
        <section className="rounded-[28px] border border-line bg-surface p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-slate-950">
                Recent transactions
              </h2>
              <p className="mt-1 text-sm text-muted">
                The latest entries from your shared transaction state.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {isTransactionsLoading ? (
              <div className="space-y-3 rounded-2xl bg-slate-50 px-4 py-4">
                {[0, 1, 2].map((item) => (
                  <div
                    key={item}
                    className="flex animate-pulse items-center justify-between gap-4 rounded-2xl bg-white px-4 py-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-11 w-11 rounded-2xl bg-slate-200" />
                      <div className="space-y-2">
                        <div className="h-4 w-40 rounded-full bg-slate-200" />
                        <div className="h-3 w-28 rounded-full bg-slate-100" />
                      </div>
                    </div>
                    <div className="h-4 w-20 rounded-full bg-slate-200" />
                  </div>
                ))}
              </div>
            ) : transactionsError ? (
              <div className="rounded-2xl bg-rose-50 px-4 py-4 text-sm text-rose-700">
                {transactionsError}
              </div>
            ) : recentTransactions.length === 0 && hasLoadedTransactions ? (
              <div className="rounded-2xl bg-slate-50 px-4 py-10 text-center">
                <p className="text-base font-semibold text-slate-800">
                  No transactions yet
                </p>
                <p className="mt-2 text-sm text-muted">
                  Your latest activity will appear here once you add your first income or expense.
                </p>
              </div>
            ) : (
              recentTransactions.map((transaction) => (
                <article
                  key={transaction.id}
                  className="flex flex-col gap-3 rounded-2xl border border-line px-4 py-4 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent-soft text-sm font-semibold text-accent">
                      {transaction.category.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-950">
                        {transaction.note}
                      </h3>
                      <p className="text-sm text-muted">
                        {transaction.category}
                        {transaction.subcategory
                          ? ` / ${transaction.subcategory}`
                          : ""}{" "}
                        • {formatDate(transaction.date)}
                      </p>
                    </div>
                  </div>

                  <p
                    className={`text-sm font-semibold ${
                      transaction.type === "income"
                        ? "text-emerald-600"
                        : "text-rose-600"
                    }`}
                  >
                    {transaction.type === "income" ? "+" : "-"}
                    {formatCurrency(transaction.amount, currencySymbol)}
                  </p>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="rounded-[28px] border border-line bg-surface p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-slate-950">
                Spending trends
              </h2>
              <p className="mt-1 text-sm text-muted">
                Real spending activity from your recorded expense transactions.
              </p>
            </div>
            <div className="flex rounded-full bg-slate-100 p-1">
              {(["weekly", "monthly"] as const).map((view) => (
                <button
                  key={view}
                  type="button"
                  onClick={() => setTrendView(view)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${
                    trendView === view
                      ? "bg-white text-slate-950 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {view}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 flex h-64 items-end justify-between gap-3 rounded-3xl bg-slate-50 px-4 py-6">
            {trendPoints.map((point) => (
              <div
                key={point.label}
                className="flex flex-1 flex-col items-center justify-end gap-3"
              >
                <div
                  className="w-full rounded-t-2xl bg-gradient-to-t from-accent to-teal-300"
                  style={{
                    height: `${Math.max((point.amount / maxTrendAmount) * 160, 18)}px`,
                  }}
                />
                <span className="text-xs font-medium uppercase tracking-[0.22em] text-slate-500">
                  {point.label}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[28px] border border-line bg-surface p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-slate-950">
                Category breakdown
              </h2>
              <p className="mt-1 text-sm text-muted">
                Expense categories derived from the shared transaction list.
              </p>
            </div>
            <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              This month
            </div>
          </div>

          <div className="mt-7 space-y-5">
            {breakdown.length === 0 && hasLoadedTransactions ? (
              <div className="rounded-2xl bg-slate-50 px-4 py-10 text-center">
                <p className="text-base font-semibold text-slate-800">
                  No category spending yet
                </p>
                <p className="mt-2 text-sm text-muted">
                  Your monthly expense categories will appear here after you log transactions.
                </p>
              </div>
            ) : (
              breakdown.map(([category, amount], index) => {
                const barWidth =
                  breakdownTotal > 0 ? Math.max((amount / breakdownTotal) * 100, 10) : 0;

                return (
                  <div key={category}>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedCategories((current) => ({
                            ...current,
                            [category]: !current[category],
                          }))
                        }
                        className="flex items-center gap-2 font-medium text-slate-700 transition hover:text-slate-950"
                      >
                        <span>{category}</span>
                        <span className="text-xs text-slate-400">
                          {expandedCategories[category] ? "▾" : "▸"}
                        </span>
                      </button>
                      <span className="font-semibold text-slate-950">
                        {formatCurrency(amount, currencySymbol)}
                      </span>
                    </div>
                    <div className="h-3 rounded-full bg-slate-100">
                      <div
                        className={`h-3 rounded-full transition-[width] ${
                          categoryBreakdownColors[
                            index % categoryBreakdownColors.length
                          ]
                        }`}
                        style={{ width: `${Math.min(barWidth, 100)}%` }}
                      />
                    </div>
                    {expandedCategories[category] ? (
                      <div className="mt-3 space-y-2 rounded-2xl bg-slate-50 px-3 py-3">
                        {Object.entries(subcategoryBreakdown[category] ?? {}).length ===
                        0 ? (
                          <p className="text-sm text-muted">
                            No subcategory spending for this category yet.
                          </p>
                        ) : (
                          Object.entries(subcategoryBreakdown[category] ?? {})
                            .sort((a, b) => b[1] - a[1])
                            .map(([subcategory, subcategoryAmount]) => (
                              <div
                                key={subcategory}
                                className="flex items-center justify-between text-sm"
                              >
                                <span className="text-slate-600">{subcategory}</span>
                                <span className="font-medium text-slate-900">
                                  {formatCurrency(subcategoryAmount, currencySymbol)}
                                </span>
                              </div>
                            ))
                        )}
                      </div>
                    ) : null}
                  </div>
                );
              })
            )}
          </div>
        </section>

        <section className="rounded-[28px] border border-line bg-surface p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">
            Budget health
          </h2>
          <p className="mt-1 text-sm text-muted">
            See how each monthly budget is tracking against real spending so far.
          </p>

          <div className="mt-7 space-y-3">
            {isBudgetsLoading ? (
              <div className="space-y-3 rounded-3xl bg-slate-50 px-4 py-5">
                {[0, 1, 2].map((item) => (
                  <div
                    key={item}
                    className="animate-pulse rounded-2xl bg-white px-4 py-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="h-4 w-24 rounded-full bg-slate-200" />
                      <div className="h-4 w-16 rounded-full bg-slate-200" />
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-slate-100" />
                    <div className="mt-3 flex items-center justify-between">
                      <div className="h-3 w-28 rounded-full bg-slate-100" />
                      <div className="h-3 w-20 rounded-full bg-slate-100" />
                    </div>
                  </div>
                ))}
              </div>
            ) : budgetUsageSummary.length === 0 && hasLoadedBudgets ? (
              <div className="rounded-2xl bg-slate-50 px-4 py-10 text-center">
                <p className="text-base font-semibold text-slate-800">
                  No budgets yet
                </p>
                <p className="mt-2 text-sm text-muted">
                  Create category budgets to monitor real usage from your monthly spending.
                </p>
              </div>
            ) : (
              budgetUsageSummary.map((budget) => {
                const roundedPercentage = Math.round(budget.usagePercentage);
                const visualPercentage = Math.min(
                  Math.max(budget.usagePercentage, 0),
                  100
                );
                const remainingAmount = budget.monthlyLimit - budget.usedAmount;
                const isOverBudget = remainingAmount < 0;

                return (
                  <article
                    key={budget.id}
                    className="rounded-2xl border border-line bg-slate-50 px-4 py-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="font-semibold text-slate-950">
                        {budget.category}
                      </h3>
                      <p className="text-sm font-semibold text-slate-950">
                        {roundedPercentage}%
                      </p>
                    </div>

                    <div className="mt-3 h-3 rounded-full bg-white">
                      <div
                        className={`h-3 rounded-full ${
                          budget.usagePercentage >= 90
                            ? "bg-rose-500"
                            : budget.usagePercentage >= 60
                              ? "bg-amber-500"
                              : "bg-teal-500"
                        }`}
                        style={{
                          width: `${visualPercentage}%`,
                          minWidth: budget.usedAmount > 0 ? "10px" : "0px",
                        }}
                      />
                    </div>

                    <div className="mt-3 flex items-center justify-between text-sm text-muted">
                      <span>{formatCurrency(budget.usedAmount, currencySymbol)} used</span>
                      <span>
                        {formatCurrency(
                          Math.abs(remainingAmount),
                          currencySymbol
                        )}{" "}
                        {isOverBudget ? "over budget" : "left"}
                      </span>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>
      </div>
    </>
  );
}
