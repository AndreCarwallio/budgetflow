"use client";

import { useMemo, useState } from "react";
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

export function TransactionsView() {
  const {
    categories,
    currencySymbol,
    deleteTransaction,
    hasLoadedTransactions,
    isTransactionsLoading,
    transactions,
    transactionsError,
  } = useTransactions();
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredTransactions = useMemo(
    () =>
      transactions.filter((transaction) =>
        selectedCategory === "All"
          ? true
          : transaction.category === selectedCategory
      ),
    [selectedCategory, transactions]
  );
  const categoryOptions = useMemo(
    () =>
      Array.from(
        new Set([
          ...categories.map((category) => category.name),
          ...transactions.map((transaction) => transaction.category),
        ])
      ).sort((left, right) => left.localeCompare(right)),
    [categories, transactions]
  );

  return (
    <section className="rounded-[28px] border border-line bg-surface p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
      <div className="flex flex-col gap-4 border-b border-line pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">
            Transaction list
          </h2>
          <p className="mt-1 text-sm text-muted">
            Filter by category and remove entries directly from the shared state.
          </p>
        </div>

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Category filter</span>
          <select
            value={selectedCategory}
            onChange={(event) => setSelectedCategory(event.target.value)}
            className="min-w-48 rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-400"
          >
            <option value="All">All categories</option>
            {categoryOptions.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-6 space-y-3">
          {isTransactionsLoading ? (
            <div className="space-y-3">
              {[0, 1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="grid animate-pulse gap-3 rounded-2xl bg-slate-50 px-5 py-5 md:grid-cols-[1fr_1fr_1fr_1fr_1.6fr_auto]"
                >
                  <div className="h-5 w-20 rounded-full bg-slate-200" />
                  <div className="h-5 w-24 rounded-full bg-slate-200" />
                  <div className="h-5 w-24 rounded-full bg-slate-200" />
                  <div className="h-5 w-24 rounded-full bg-slate-100" />
                  <div className="h-5 w-40 rounded-full bg-slate-100" />
                  <div className="h-9 w-20 rounded-2xl bg-slate-200" />
                </div>
              ))}
            </div>
          ) : transactionsError ? (
            <div className="rounded-2xl bg-rose-50 px-5 py-5 text-center text-sm text-rose-700">
              {transactionsError}
            </div>
          ) : filteredTransactions.length === 0 && hasLoadedTransactions ? (
            <div className="rounded-2xl bg-slate-50 px-5 py-12 text-center">
              <p className="text-base font-semibold text-slate-800">
                {selectedCategory === "All"
                  ? "No transactions yet"
                  : "No matching transactions"}
              </p>
              <p className="mt-2 text-sm leading-6 text-muted">
                {selectedCategory === "All"
                  ? "Add your first transaction to start building your activity history."
                  : "Try a different category filter to see more results."}
              </p>
            </div>
          ) : (
            filteredTransactions.map((transaction) => (
              <article
                key={transaction.id}
                className="grid gap-3 rounded-2xl border border-line px-5 py-4 transition hover:bg-slate-50 md:grid-cols-[1fr_1fr_1fr_1fr_1.6fr_auto] md:items-center md:gap-4"
              >
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 md:hidden">
                    Type
                  </p>
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      transaction.type === "income"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-rose-50 text-rose-700"
                    }`}
                  >
                    {transaction.type}
                  </span>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 md:hidden">
                    Amount
                  </p>
                  <p
                    className={`font-semibold ${
                      transaction.type === "income"
                        ? "text-emerald-600"
                        : "text-rose-600"
                    }`}
                  >
                    {transaction.type === "income" ? "+" : "-"}
                    {formatCurrency(transaction.amount, currencySymbol)}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 md:hidden">
                    Category
                  </p>
                  <p className="font-medium text-slate-900">{transaction.category}</p>
                  {transaction.subcategory ? (
                    <p className="mt-1 text-sm text-muted">
                      {transaction.subcategory}
                    </p>
                  ) : null}
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 md:hidden">
                    Date
                  </p>
                  <p className="text-slate-700">{formatDate(transaction.date)}</p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 md:hidden">
                    Note
                  </p>
                  <p className="text-slate-700">{transaction.note}</p>
                </div>

                <div>
                  <button
                    type="button"
                    onClick={() => {
                      void deleteTransaction(transaction.id);
                    }}
                    className="rounded-2xl border border-line px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))
          )}
      </div>
    </section>
  );
}
