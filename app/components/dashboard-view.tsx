"use client";

import { useState } from "react";
import {
  getBudgetUsageSummaryForTransactions,
  getCategorySpending,
  getIncomeExpensesForTransactions,
  getMonthlySpendingPoints,
  getTotalSavingsValue,
  getTransactionsInRange,
  getWeeklySpendingPoints,
} from "../lib/dashboard-metrics";
import { getActivePeriod } from "../lib/periods";
import { chartPalettes } from "../lib/transactions";
import { useTransactions } from "./transactions-provider";

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

function withOpacity(hexColor: string, alpha: string) {
  if (/^#[0-9a-f]{6}$/i.test(hexColor)) {
    return `${hexColor}${alpha}`;
  }

  return hexColor;
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
    appSettings,
    budgets,
    hasLoadedBudgets,
    hasLoadedSavingsGoal,
    currencySymbol,
    hasLoadedTransactions,
    isBudgetsLoading,
    isSavingsGoalLoading,
    isTransactionsLoading,
    chartPalette,
    getCategoryColor,
    monthlySnapshots,
    savingsGoal,
    savingsGoalError,
    transactions,
    transactionsError,
  } = useTransactions();
  const [trendView, setTrendView] = useState<"weekly" | "monthly">("monthly");
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >({});
  const activePeriod = getActivePeriod(appSettings);
  const currentPeriodTransactions = getTransactionsInRange(
    transactions,
    activePeriod.start,
    activePeriod.endExclusive
  );
  const { expenses, income, remainingBalance } =
    getIncomeExpensesForTransactions(currentPeriodTransactions);
  const latestSnapshot =
    monthlySnapshots.length > 0 ? monthlySnapshots[monthlySnapshots.length - 1] : null;
  const {
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
  const recentTransactions = [...transactions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 4);
  const trendPoints =
    trendView === "weekly"
      ? getWeeklySpendingPoints(transactions)
      : getMonthlySpendingPoints(transactions);
  const maxTrendAmount = Math.max(...trendPoints.map((point) => point.amount), 1);

  const breakdown = Object.entries(
    getCategorySpending(currentPeriodTransactions)
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);
  const breakdownTotal = breakdown.reduce(
    (sum, [, amount]) => sum + amount,
    0
  );
  const budgetUsageSummary = getBudgetUsageSummaryForTransactions(
    budgets,
    currentPeriodTransactions
  );
  const activeChartPalette =
    chartPalettes.find((palette) => palette.id === chartPalette) ??
    chartPalettes[0];
  const subcategoryBreakdown = currentPeriodTransactions
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
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <SummaryCard
          title="Total Income"
          value={formatCurrency(income, currencySymbol)}
          detail="Income recorded for current month"
          tone="bg-emerald-50 text-emerald-700"
          badge="Monthly"
        />
        <SummaryCard
          title="Total Expenses"
          value={formatCurrency(expenses, currencySymbol)}
          detail="Expenses recorded for current month"
          tone="bg-rose-50 text-rose-700"
          badge="Monthly"
        />
        <SummaryCard
          title="Total Balance"
          value={formatCurrency(remainingBalance, currencySymbol)}
          detail="Income minus expenses for current month"
          tone="bg-sky-50 text-sky-700"
          badge="Monthly"
        />
      </section>

      <section className="mt-6 rounded-[28px] border border-line bg-surface p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
        <div>
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-950">
              Savings
            </h2>
            <p className="mt-1 text-sm text-muted">
              Starting savings adjusted by the current month net change and tracked against your target savings.
            </p>
          </div>
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
              Set up your savings plan from the Savings page to start tracking carried savings and target progress.
            </p>
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

              <div className="mt-5 h-3 rounded-full bg-slate-100">
                <div
                  className="h-3 rounded-full bg-gradient-to-r from-amber-400 via-teal-400 to-sky-500 transition-[width]"
                  style={{ width: `${savingsProgress}%` }}
                />
              </div>
            </div>
          </>
        )}
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
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-semibold"
                      style={{
                        backgroundColor: withOpacity(
                          getCategoryColor(transaction.category),
                          "1A"
                        ),
                        color: getCategoryColor(transaction.category),
                      }}
                    >
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
                className="flex min-w-0 flex-1 flex-col items-center justify-end gap-3"
              >
                <div
                  className="w-full rounded-t-2xl"
                  style={{
                    height: `${Math.max((point.amount / maxTrendAmount) * 160, 18)}px`,
                    backgroundImage: `linear-gradient(to top, ${activeChartPalette.colors[0]}, ${activeChartPalette.colors[1]})`,
                  }}
                />
                <span
                  className={`text-center text-xs font-medium text-slate-500 ${
                    trendView === "monthly"
                      ? "w-full truncate"
                      : "uppercase tracking-[0.22em]"
                  }`}
                >
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
              Current period
            </div>
          </div>

          <div className="mt-7 space-y-5">
            {breakdown.length === 0 && hasLoadedTransactions ? (
              <div className="rounded-2xl bg-slate-50 px-4 py-10 text-center">
                <p className="text-base font-semibold text-slate-800">
                  No category spending yet
                </p>
                <p className="mt-2 text-sm text-muted">
                  Your current period expense categories will appear here after you log transactions.
                </p>
              </div>
            ) : (
              breakdown.map(([category, amount]) => {
                const barWidth =
                  breakdownTotal > 0 ? Math.max((amount / breakdownTotal) * 100, 10) : 0;
                const categoryColor = getCategoryColor(category);

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
                        className="h-3 rounded-full transition-[width]"
                        style={{
                          width: `${Math.min(barWidth, 100)}%`,
                          backgroundColor: categoryColor,
                        }}
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
            See how each recurring budget is tracking against real spending in the current period.
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
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: getCategoryColor(budget.category) }}
                        />
                        <h3 className="font-semibold text-slate-950">
                          {budget.category}
                        </h3>
                      </div>
                      <p className="text-sm font-semibold text-slate-950">
                        Budget: {formatCurrency(budget.monthlyLimit, currencySymbol)}
                      </p>
                    </div>

                    <div className="mt-3 h-3 rounded-full bg-white">
                      <div
                        className="h-3 rounded-full"
                        style={{
                          width: `${visualPercentage}%`,
                          minWidth: budget.usedAmount > 0 ? "10px" : "0px",
                          backgroundColor:
                            budget.usagePercentage >= 90
                              ? "#ef4444"
                              : budget.usagePercentage >= 60
                                ? "#f59e0b"
                                : "#14b8a6",
                        }}
                      />
                    </div>

                    <div className="mt-3 flex items-center justify-between text-sm text-muted">
                      <span>
                        Spent: {formatCurrency(budget.usedAmount, currencySymbol)}
                      </span>
                      <span>
                        {isOverBudget
                          ? `Over by ${formatCurrency(
                              Math.abs(remainingAmount),
                              currencySymbol
                            )}`
                          : `Remaining: ${formatCurrency(
                              remainingAmount,
                              currencySymbol
                            )}`}
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
