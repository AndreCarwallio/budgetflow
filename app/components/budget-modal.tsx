"use client";

import { useState, useTransition } from "react";
import { type TransactionCategory } from "../lib/transactions";
import { useTransactions } from "./transactions-provider";

function BudgetModalForm() {
  const {
    budgetsError,
    categories,
    clearBudgetsError,
    closeBudgetModal,
    editingBudget,
    saveBudget,
  } = useTransactions();
  const [category, setCategory] = useState<TransactionCategory>(
    editingBudget?.category ?? categories[0]?.name ?? "Food"
  );
  const [monthlyLimit, setMonthlyLimit] = useState(
    editingBudget ? `${editingBudget.monthlyLimit.toFixed(2)}` : ""
  );
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="mt-6 grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        clearBudgetsError();

        startTransition(async () => {
          await saveBudget({
            category,
            monthlyLimit: Number.parseFloat(monthlyLimit),
          });
        });
      }}
    >
      <label className="space-y-2">
        <span className="text-sm font-medium text-slate-700">Category</span>
        <select
          value={category}
          onChange={(event) =>
            setCategory(event.target.value as TransactionCategory)
          }
          className="w-full rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-400"
        >
          {categories.map((item) => (
            <option key={item.id} value={item.name}>
              {item.name}
            </option>
          ))}
        </select>
      </label>

      <label className="space-y-2">
        <span className="text-sm font-medium text-slate-700">
          Monthly limit
        </span>
        <input
          required
          min="0.01"
          step="0.01"
          type="number"
          value={monthlyLimit}
          onChange={(event) => setMonthlyLimit(event.target.value)}
          placeholder="Enter monthly limit"
          className="w-full rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-400"
        />
      </label>

      {budgetsError ? (
        <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {budgetsError}
        </p>
      ) : null}

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => {
            clearBudgetsError();
            closeBudgetModal();
          }}
          className="rounded-2xl border border-line px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-700"
        >
          {isPending
            ? "Saving..."
            : editingBudget
              ? "Update budget"
              : "Create budget"}
        </button>
      </div>
    </form>
  );
}

export function BudgetModal() {
  const {
    clearBudgetsError,
    closeBudgetModal,
    editingBudget,
    isBudgetModalOpen,
  } = useTransactions();

  if (!isBudgetModalOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-[32px] border border-white/50 bg-white p-6 shadow-[0_30px_80px_rgba(15,23,42,0.24)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.22em] text-muted">
              BudgetFlow
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              {editingBudget ? "Edit budget" : "Create budget"}
            </h2>
            <p className="mt-2 text-sm text-muted">
              Set a monthly category limit and compare it against actual spend.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              clearBudgetsError();
              closeBudgetModal();
            }}
            className="rounded-2xl border border-line px-3 py-2 text-sm font-medium text-muted transition hover:bg-slate-50 hover:text-slate-900"
          >
            Close
          </button>
        </div>
        <BudgetModalForm key={editingBudget?.id ?? "new-budget"} />
      </div>
    </div>
  );
}
