"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { startTransition, type ReactNode, useState } from "react";
import {
  getMonthlyIncomeExpenses,
  getTotalSavingsValue,
} from "../lib/dashboard-metrics";
import { createClient } from "../lib/supabase/client";
import { AddTransactionModal } from "./add-transaction-modal";
import { BudgetModal } from "./budget-modal";
import { SavingsGoalModal } from "./savings-goal-modal";
import { useTransactions } from "./transactions-provider";

const navigationItems = [
  { label: "Dashboard", href: "/" },
  { label: "Transactions", href: "/transactions" },
  { label: "Budgets", href: "/budgets" },
  { label: "Reports", href: "#" },
  { label: "Settings", href: "/settings" },
] as const;

const routeMeta = {
  "/": {
    eyebrow: "BudgetFlow",
    title: "Dashboard",
    description: "Monitor cash flow, balances, and recent activity.",
    actionLabel: "Add transaction",
    actionKind: "transaction",
  },
  "/transactions": {
    eyebrow: "BudgetFlow",
    title: "Transactions",
    description: "Review, filter, and manage your transaction history.",
    actionLabel: "New transaction",
    actionKind: "transaction",
  },
  "/budgets": {
    eyebrow: "BudgetFlow",
    title: "Budgets",
    description: "Manage your monthly category budgets and compare them with real spending.",
    actionLabel: "New budget",
    actionKind: "budget",
  },
  "/settings": {
    eyebrow: "BudgetFlow",
    title: "Settings",
    description: "Manage categories, subcategories, and the structure used across your transactions.",
    actionLabel: "Open settings",
    actionKind: "none",
  },
} as const;

function formatCurrency(amount: number, currencySymbol: string) {
  const formattedAmount = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  return `${currencySymbol} ${formattedAmount}`;
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    clearSavingsGoalError,
    closeSavingsGoalModal,
    currencySymbol,
    deleteSavingsGoal,
    hasLoadedSavingsGoal,
    isSavingsGoalLoading,
    openAddModal,
    openBudgetModal,
    openSavingsGoalModal,
    savingsGoal,
    savingsGoalError,
    toggleCurrencySymbol,
    transactions,
  } = useTransactions();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isResettingGoal, setIsResettingGoal] = useState(false);
  const meta = routeMeta[pathname as keyof typeof routeMeta] ?? routeMeta["/"];
  const { remainingBalance } = getMonthlyIncomeExpenses(transactions);
  const { baseSavingsAmount, remainingToGoal, totalSavings } = getTotalSavingsValue(
    savingsGoal,
    remainingBalance
  );
  const savingsTarget = savingsGoal?.targetAmount ?? 0;
  const savingsCurrent = totalSavings;
  const savingsRemaining = remainingToGoal;
  const savingsProgress =
    savingsTarget > 0
      ? Math.max(0, Math.min((savingsCurrent / savingsTarget) * 100, 100))
      : 0;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,118,110,0.12),_transparent_28%),linear-gradient(180deg,#f8fbff_0%,#f4f7fb_100%)] text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col lg:flex-row">
        <aside className="border-b border-line bg-slate-950 px-5 py-6 text-slate-100 lg:w-72 lg:border-r lg:border-b-0 lg:px-6 lg:py-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-lg font-semibold">
              BF
            </div>
            <div>
              <p className="text-lg font-semibold tracking-tight">BudgetFlow</p>
              <p className="text-sm text-slate-400">Personal finance hub</p>
            </div>
          </div>

          <nav className="mt-8 flex gap-3 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
            {navigationItems.map((item) => {
              const isActive = item.href !== "#" && pathname === item.href;
              const sharedClasses =
                "flex shrink-0 items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition";

              if (item.href === "#") {
                return (
                  <span
                    key={item.label}
                    className={`${sharedClasses} cursor-not-allowed text-slate-500`}
                  >
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-700" />
                    {item.label}
                  </span>
                );
              }

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`${sharedClasses} ${
                    isActive
                      ? "bg-white text-slate-950 shadow-lg"
                      : "text-slate-300 hover:bg-white/8 hover:text-white"
                  }`}
                >
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      isActive ? "bg-accent" : "bg-slate-500"
                    }`}
                  />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <section className="mt-8 hidden rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_18px_40px_rgba(2,6,23,0.22)] lg:block">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-300">Savings goal</p>
                <p className="mt-2 text-sm text-slate-400">
                  Progress toward your savings goal
                </p>
              </div>
              {!isSavingsGoalLoading && savingsGoal ? (
                <div className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-200">
                  {Math.round(savingsProgress)}%
                </div>
              ) : null}
            </div>

            {isSavingsGoalLoading ? (
              <div className="mt-5 space-y-3 rounded-2xl bg-white/4 px-4 py-5">
                <div className="h-3 w-28 animate-pulse rounded-full bg-white/10" />
                <div className="h-2 w-full animate-pulse rounded-full bg-white/10" />
                <div className="space-y-2">
                  <div className="h-10 animate-pulse rounded-2xl bg-white/8" />
                  <div className="h-10 animate-pulse rounded-2xl bg-white/8" />
                </div>
              </div>
            ) : savingsGoalError ? (
              <div className="mt-5 rounded-2xl bg-rose-500/15 px-4 py-4 text-sm text-rose-100">
                {savingsGoalError}
              </div>
            ) : !savingsGoal && hasLoadedSavingsGoal ? (
              <div className="mt-5 rounded-2xl bg-white/4 px-4 py-6">
                <p className="text-sm text-slate-400">
                  No savings goal yet. Create one to start tracking your progress from the sidebar.
                </p>
                <button
                  type="button"
                  onClick={openSavingsGoalModal}
                  className="mt-4 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
                >
                  Create goal
                </button>
              </div>
            ) : (
              <>
                <div className="mt-5 h-2 rounded-full bg-white/10">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-teal-300 to-emerald-400"
                    style={{ width: `${savingsProgress}%` }}
                  />
                </div>

                <div className="mt-5 space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-400">Target</span>
                    <span className="font-semibold text-white">
                      {formatCurrency(savingsTarget, currencySymbol)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-400">Base savings</span>
                    <span className="font-semibold text-white">
                      {formatCurrency(baseSavingsAmount, currencySymbol)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-400">Saved now</span>
                    <span className="font-semibold text-white">
                      {formatCurrency(savingsCurrent, currencySymbol)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-400">Remaining</span>
                    <span className="font-semibold text-white">
                      {formatCurrency(savingsRemaining, currencySymbol)}
                    </span>
                  </div>
                </div>

                <div className="mt-5 flex gap-3">
                  <button
                    type="button"
                    onClick={openSavingsGoalModal}
                    className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
                  >
                    Edit
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
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isResettingGoal ? "Resetting..." : "Reset"}
                  </button>
                </div>
              </>
            )}
          </section>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="border-b border-line bg-white/80 px-5 py-5 backdrop-blur-xl lg:px-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted">
                  {meta.eyebrow}
                </p>
                <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">
                  {meta.title}
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-muted">{meta.description}</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={toggleCurrencySymbol}
                  className="rounded-2xl border border-line bg-surface px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  {currencySymbol}
                </button>
                <div className="rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-muted">
                  Updated Apr 18, 2026
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (meta.actionKind === "budget") {
                      openBudgetModal();
                      return;
                    }

                    if (meta.actionKind === "none") {
                      return;
                    }

                    openAddModal();
                  }}
                  className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-default disabled:bg-slate-800"
                  disabled={meta.actionKind === "none"}
                >
                  {meta.actionLabel}
                </button>
                <button
                  type="button"
                  disabled={isLoggingOut}
                  onClick={() => {
                    setIsLoggingOut(true);

                    startTransition(async () => {
                      const supabase = createClient();
                      await supabase.auth.signOut();
                      router.push("/auth/login");
                      router.refresh();
                      setIsLoggingOut(false);
                    });
                  }}
                  className="rounded-2xl border border-line bg-surface px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isLoggingOut ? "Logging out..." : "Logout"}
                </button>
              </div>
            </div>
          </header>

          <div className="flex-1 px-5 py-6 lg:px-8 lg:py-8">{children}</div>
        </div>
      </div>

      <AddTransactionModal />
      <BudgetModal />
      <SavingsGoalModal />
    </main>
  );
}
