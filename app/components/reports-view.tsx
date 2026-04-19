"use client";

import { useEffect, useState, useTransition } from "react";
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

function SummaryCard({
  title,
  value,
  detail,
  tone,
}: {
  title: string;
  value: string;
  detail: string;
  tone: string;
}) {
  return (
    <section className="rounded-3xl border border-line bg-surface p-5 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
      <p className="text-sm font-medium text-muted">{title}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
        {value}
      </p>
      <p className={`mt-4 text-sm font-medium ${tone}`}>{detail}</p>
    </section>
  );
}

export function ReportsView() {
  const {
    adjustMonthlySnapshot,
    clearMonthlySnapshotsError,
    clearRolloverError,
    currencySymbol,
    getCategoryColor,
    hasLoadedAppSettings,
    hasLoadedMonthlySnapshots,
    isAppSettingsLoading,
    isMonthlySnapshotsLoading,
    isRolloverPending,
    monthlySnapshots,
    monthlySnapshotsError,
    rolloverError,
  } = useTransactions();
  const [selectedSnapshotId, setSelectedSnapshotId] = useState("");
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [startingSavings, setStartingSavings] = useState("");
  const [incomeTotal, setIncomeTotal] = useState("");
  const [expenseTotal, setExpenseTotal] = useState("");
  const [targetSavings, setTargetSavings] = useState("");
  const [isPending, startTransition] = useTransition();

  const snapshots = [...monthlySnapshots].sort((left, right) =>
    right.periodKey.localeCompare(left.periodKey)
  );
  const selectedSnapshot =
    snapshots.find((snapshot) => snapshot.id === selectedSnapshotId) ?? snapshots[0] ?? null;
  const categoryEntries = Object.entries(
    selectedSnapshot?.snapshotData.categoryTotals ?? {}
  ).sort((left, right) => right[1] - left[1]);
  const budgetUsageSummary = selectedSnapshot?.snapshotData.budgetUsageSummary ?? [];
  const recentTransactions = selectedSnapshot?.snapshotData.recentTransactions ?? [];
  const isReportsLoading =
    isAppSettingsLoading || isMonthlySnapshotsLoading || isRolloverPending;
  const reportsError = rolloverError || monthlySnapshotsError;
  const showEmptyState =
    !isReportsLoading &&
    !reportsError &&
    hasLoadedAppSettings &&
    hasLoadedMonthlySnapshots &&
    snapshots.length === 0;

  useEffect(() => {
    if (!selectedSnapshotId && snapshots.length > 0) {
      setSelectedSnapshotId(snapshots[0].id);
    }
  }, [selectedSnapshotId, snapshots]);

  useEffect(() => {
    if (!selectedSnapshot) {
      return;
    }

    setStartingSavings(selectedSnapshot.startingSavings.toFixed(2));
    setIncomeTotal(selectedSnapshot.incomeTotal.toFixed(2));
    setExpenseTotal(selectedSnapshot.expenseTotal.toFixed(2));
    setTargetSavings(selectedSnapshot.targetSavings.toFixed(2));
  }, [selectedSnapshot]);

  return (
    <>
      <section className="rounded-[28px] border border-line bg-surface p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-950">
              Reports history
            </h2>
            <p className="mt-1 text-sm text-muted">
              Browse locked snapshot periods and review the saved dashboard totals for each completed month.
            </p>
          </div>

          {selectedSnapshot ? (
            <div className="flex flex-wrap gap-3">
              <select
                value={selectedSnapshot.id}
                onChange={(event) => setSelectedSnapshotId(event.target.value)}
                className="rounded-2xl border border-line bg-surface px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-slate-400"
              >
                {snapshots.map((snapshot) => (
                  <option key={snapshot.id} value={snapshot.id}>
                    {snapshot.snapshotData.periodLabel}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  clearMonthlySnapshotsError();
                  clearRolloverError();
                  setIsAdjustModalOpen(true);
                }}
                disabled={!selectedSnapshot}
                className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-700"
              >
                Adjust
              </button>
            </div>
          ) : null}
        </div>

        {isReportsLoading ? (
          <div className="mt-6 rounded-2xl bg-slate-50 px-4 py-10 text-center text-sm text-muted">
            Loading reports history...
          </div>
        ) : reportsError ? (
          <div className="mt-6 rounded-2xl bg-rose-50 px-4 py-4 text-sm text-rose-700">
            {reportsError}
          </div>
        ) : showEmptyState ? (
          <div className="mt-6 rounded-2xl bg-slate-50 px-4 py-10 text-center">
            <p className="text-base font-semibold text-slate-800">
              No snapshot history yet
            </p>
            <p className="mt-2 text-sm text-muted">
              Completed periods appear here automatically once the app detects a rollover.
            </p>
          </div>
        ) : selectedSnapshot ? (
          <>
            <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <SummaryCard
                title="Income"
                value={formatCurrency(selectedSnapshot.incomeTotal, currencySymbol)}
                detail="Locked snapshot income"
                tone="text-emerald-700"
              />
              <SummaryCard
                title="Expenses"
                value={formatCurrency(selectedSnapshot.expenseTotal, currencySymbol)}
                detail="Locked snapshot expenses"
                tone="text-rose-700"
              />
              <SummaryCard
                title="Net Change"
                value={formatCurrency(selectedSnapshot.netChange, currencySymbol)}
                detail="Income minus expenses"
                tone={selectedSnapshot.netChange >= 0 ? "text-emerald-700" : "text-rose-700"}
              />
              <SummaryCard
                title="Savings Total"
                value={formatCurrency(selectedSnapshot.savingsTotal, currencySymbol)}
                detail={`${Math.round(
                  selectedSnapshot.targetSavings > 0
                    ? Math.max(
                        0,
                        Math.min(
                          (selectedSnapshot.savingsTotal /
                            selectedSnapshot.targetSavings) *
                            100,
                          100
                        )
                      )
                    : 0
                )}% of target`}
                tone="text-amber-700"
              />
            </section>

            <section className="mt-6 rounded-3xl bg-slate-50 px-5 py-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm font-medium text-muted">
                    {selectedSnapshot.snapshotData.periodLabel}
                  </p>
                  <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
                    {formatCurrency(selectedSnapshot.savingsTotal, currencySymbol)}
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-white px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                      Starting Savings
                    </p>
                    <p className="mt-2 font-semibold text-slate-950">
                      {formatCurrency(selectedSnapshot.startingSavings, currencySymbol)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                      Target Savings
                    </p>
                    <p className="mt-2 font-semibold text-slate-950">
                      {formatCurrency(selectedSnapshot.targetSavings, currencySymbol)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                      Remaining
                    </p>
                    <p className="mt-2 font-semibold text-slate-950">
                      {formatCurrency(
                        Math.max(selectedSnapshot.targetSavings - selectedSnapshot.savingsTotal, 0),
                        currencySymbol
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 h-3 rounded-full bg-white">
                <div
                  className="h-3 rounded-full bg-gradient-to-r from-amber-400 via-teal-400 to-sky-500"
                  style={{
                    width: `${Math.max(
                      0,
                      Math.min(
                        selectedSnapshot.targetSavings > 0
                          ? (selectedSnapshot.savingsTotal / selectedSnapshot.targetSavings) * 100
                          : 0,
                        100
                      )
                    )}%`,
                  }}
                />
              </div>

              {selectedSnapshot.snapshotData.adjustment ? (
                <div className="mt-5 rounded-2xl bg-amber-50 px-4 py-4 text-sm text-amber-800">
                  {selectedSnapshot.snapshotData.adjustment.note}
                </div>
              ) : null}
            </section>

            <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <section className="rounded-[28px] border border-line bg-surface p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
                <h3 className="text-xl font-semibold tracking-tight text-slate-950">
                  Category breakdown
                </h3>
                <p className="mt-1 text-sm text-muted">
                  Locked category totals captured when this snapshot was saved.
                </p>

                <div className="mt-7 space-y-5">
                  {categoryEntries.length === 0 ? (
                    <div className="rounded-2xl bg-slate-50 px-4 py-10 text-center text-sm text-muted">
                      No category totals were stored for this snapshot.
                    </div>
                  ) : (
                    categoryEntries.map(([category, amount]) => {
                      const total = categoryEntries.reduce(
                        (sum, [, categoryAmount]) => sum + categoryAmount,
                        0
                      );
                      const width = total > 0 ? Math.max((amount / total) * 100, 10) : 0;

                      return (
                        <div key={category}>
                          <div className="mb-2 flex items-center justify-between text-sm">
                            <span className="font-medium text-slate-700">{category}</span>
                            <span className="font-semibold text-slate-950">
                              {formatCurrency(amount, currencySymbol)}
                            </span>
                          </div>
                          <div className="h-3 rounded-full bg-slate-100">
                            <div
                              className="h-3 rounded-full"
                              style={{
                                width: `${Math.min(width, 100)}%`,
                                backgroundColor: getCategoryColor(category),
                              }}
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </section>

              <section className="rounded-[28px] border border-line bg-surface p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
                <h3 className="text-xl font-semibold tracking-tight text-slate-950">
                  Budget health
                </h3>
                <p className="mt-1 text-sm text-muted">
                  Recurring budget usage captured in the locked snapshot.
                </p>

                <div className="mt-7 space-y-3">
                  {budgetUsageSummary.length === 0 ? (
                    <div className="rounded-2xl bg-slate-50 px-4 py-10 text-center text-sm text-muted">
                      No budget usage summary was stored for this snapshot.
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
                          key={budget.category}
                          className="rounded-2xl border border-line bg-slate-50 px-4 py-4"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                              <span
                                className="h-2.5 w-2.5 rounded-full"
                                style={{
                                  backgroundColor: getCategoryColor(budget.category),
                                }}
                              />
                              <h4 className="font-semibold text-slate-950">
                                {budget.category}
                              </h4>
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

            <section className="mt-6 rounded-[28px] border border-line bg-surface p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
              <h3 className="text-xl font-semibold tracking-tight text-slate-950">
                Recent transactions
              </h3>
              <p className="mt-1 text-sm text-muted">
                Transaction summary saved with this locked snapshot.
              </p>

              <div className="mt-6 space-y-3">
                {recentTransactions.length === 0 ? (
                  <div className="rounded-2xl bg-slate-50 px-4 py-10 text-center text-sm text-muted">
                    No recent transaction summary was stored for this snapshot.
                  </div>
                ) : (
                  recentTransactions.map((transaction) => (
                    <article
                      key={transaction.id}
                      className="flex flex-col gap-3 rounded-2xl border border-line px-4 py-4 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <h4 className="font-semibold text-slate-950">
                          {transaction.note}
                        </h4>
                        <p className="text-sm text-muted">
                          {transaction.category}
                          {transaction.subcategory
                            ? ` / ${transaction.subcategory}`
                            : ""}{" "}
                          • {formatDate(transaction.date)}
                        </p>
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
          </>
        ) : null}
      </section>

      {isAdjustModalOpen && selectedSnapshot ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[32px] border border-white/50 bg-white p-6 shadow-[0_30px_80px_rgba(15,23,42,0.24)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.22em] text-muted">
                  Locked Snapshot
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                  Adjust {selectedSnapshot.snapshotData.periodLabel}
                </h2>
                <p className="mt-2 text-sm text-muted">
                  This updates the selected snapshot totals, then recalculates later snapshots so carried-forward savings remain logically consistent.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAdjustModalOpen(false)}
                className="rounded-2xl border border-line px-3 py-2 text-sm font-medium text-muted transition hover:bg-slate-50 hover:text-slate-900"
              >
                Close
              </button>
            </div>

            <form
              className="mt-6 grid gap-4"
              onSubmit={(event) => {
                event.preventDefault();
                clearMonthlySnapshotsError();
                clearRolloverError();

                startTransition(async () => {
                  const didSave = await adjustMonthlySnapshot(selectedSnapshot.id, {
                    startingSavings: Number.parseFloat(startingSavings),
                    incomeTotal: Number.parseFloat(incomeTotal),
                    expenseTotal: Number.parseFloat(expenseTotal),
                    targetSavings: Number.parseFloat(targetSavings),
                  });

                  if (didSave) {
                    setIsAdjustModalOpen(false);
                  }
                });
              }}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Starting savings
                  </span>
                  <input
                    required
                    min="0"
                    step="0.01"
                    type="number"
                    value={startingSavings}
                    onChange={(event) => setStartingSavings(event.target.value)}
                    className="w-full rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-400"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Target savings
                  </span>
                  <input
                    required
                    min="0"
                    step="0.01"
                    type="number"
                    value={targetSavings}
                    onChange={(event) => setTargetSavings(event.target.value)}
                    className="w-full rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-400"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Income total
                  </span>
                  <input
                    required
                    min="0"
                    step="0.01"
                    type="number"
                    value={incomeTotal}
                    onChange={(event) => setIncomeTotal(event.target.value)}
                    className="w-full rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-400"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Expense total
                  </span>
                  <input
                    required
                    min="0"
                    step="0.01"
                    type="number"
                    value={expenseTotal}
                    onChange={(event) => setExpenseTotal(event.target.value)}
                    className="w-full rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-400"
                  />
                </label>
              </div>

              {reportsError ? (
                <div className="rounded-2xl bg-rose-50 px-4 py-4 text-sm text-rose-700">
                  {reportsError}
                </div>
              ) : null}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="rounded-2xl border border-line px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-700"
                >
                  {isPending ? "Saving..." : "Save adjustment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
