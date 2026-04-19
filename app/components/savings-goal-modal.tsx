"use client";

import { useState, useTransition } from "react";
import { useTransactions } from "./transactions-provider";

function SavingsGoalModalForm() {
  const {
    clearSavingsGoalError,
    closeSavingsGoalModal,
    saveSavingsGoal,
    savingsGoal,
    savingsGoalError,
  } = useTransactions();
  const [targetAmount, setTargetAmount] = useState(
    savingsGoal ? `${savingsGoal.targetAmount.toFixed(2)}` : ""
  );
  const [startingAmount, setStartingAmount] = useState(
    savingsGoal ? `${savingsGoal.currentAmount.toFixed(2)}` : ""
  );
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="mt-6 grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        clearSavingsGoalError();

        startTransition(async () => {
          await saveSavingsGoal({
            targetAmount: Number.parseFloat(targetAmount),
            currentAmount: Number.parseFloat(startingAmount),
          });
        });
      }}
    >
      <label className="space-y-2">
        <span className="text-sm font-medium text-slate-700">
          Target amount
        </span>
        <input
          required
          min="0.01"
          step="0.01"
          type="number"
          value={targetAmount}
          onChange={(event) => setTargetAmount(event.target.value)}
          placeholder="Enter target amount"
          className="w-full rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-400"
        />
      </label>

      <label className="space-y-2">
        <span className="text-sm font-medium text-slate-700">
          Starting savings
        </span>
        <input
          required
          min="0"
          step="0.01"
          type="number"
          value={startingAmount}
          onChange={(event) => setStartingAmount(event.target.value)}
          placeholder="Enter starting savings"
          className="w-full rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-400"
        />
      </label>

      {savingsGoalError ? (
        <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {savingsGoalError}
        </p>
      ) : null}

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => {
            clearSavingsGoalError();
            closeSavingsGoalModal();
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
            : savingsGoal
              ? "Update goal"
              : "Create goal"}
        </button>
      </div>
    </form>
  );
}

export function SavingsGoalModal() {
  const {
    clearSavingsGoalError,
    closeSavingsGoalModal,
    isSavingsGoalModalOpen,
    savingsGoal,
  } = useTransactions();

  if (!isSavingsGoalModalOpen) {
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
              {savingsGoal ? "Update savings plan" : "Create savings plan"}
            </h2>
            <p className="mt-2 text-sm text-muted">
              Set your target savings and starting savings. The dashboard calculates total savings by applying the current month net change automatically.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              clearSavingsGoalError();
              closeSavingsGoalModal();
            }}
            className="rounded-2xl border border-line px-3 py-2 text-sm font-medium text-muted transition hover:bg-slate-50 hover:text-slate-900"
          >
            Close
          </button>
        </div>
        <SavingsGoalModalForm key={savingsGoal?.id ?? "new-savings-goal"} />
      </div>
    </div>
  );
}
