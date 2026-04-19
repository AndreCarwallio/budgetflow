"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { startTransition, type ReactNode, useState } from "react";
import { createClient } from "../lib/supabase/client";
import { AddTransactionModal } from "./add-transaction-modal";
import { BudgetModal } from "./budget-modal";
import { SavingsGoalModal } from "./savings-goal-modal";
import { useTransactions } from "./transactions-provider";

const navigationItems = [
  { label: "Dashboard", href: "/" },
  { label: "Transactions", href: "/transactions" },
  { label: "Budgets", href: "/budgets" },
  { label: "Savings", href: "/savings" },
  { label: "Reports", href: "/reports" },
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
  "/savings": {
    eyebrow: "BudgetFlow",
    title: "Savings",
    description: "Manage your savings plan, carried savings totals, and progress toward your target.",
    actionLabel: "Open savings",
    actionKind: "none",
  },
  "/settings": {
    eyebrow: "BudgetFlow",
    title: "Settings",
    description: "Manage categories, subcategories, and the structure used across your transactions.",
    actionLabel: "Open settings",
    actionKind: "none",
  },
  "/reports": {
    eyebrow: "BudgetFlow",
    title: "Reports",
    description: "Review locked snapshot history and adjust prior periods safely.",
    actionLabel: "Open reports",
    actionKind: "none",
  },
} as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    currencyPresets,
    displayCurrencyCode,
    openAddModal,
    openBudgetModal,
    saveDisplayCurrencyCode,
  } = useTransactions();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const meta = routeMeta[pathname as keyof typeof routeMeta] ?? routeMeta["/"];

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
              const isActive = pathname === item.href;
              const sharedClasses =
                "flex shrink-0 items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition";

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`${sharedClasses} ${
                    isActive
                      ? "bg-white text-black shadow-lg"
                      : "text-slate-300 hover:bg-white/8 hover:text-white"
                  }`}
                >
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      isActive ? "bg-accent" : "bg-slate-500"
                    }`}
                  />
                  <span className={isActive ? "text-black" : ""}>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-6 hidden rounded-3xl border border-white/10 bg-white/5 p-4 lg:block">
            <label className="block space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Display currency
              </span>
              <select
                value={displayCurrencyCode}
                onChange={(event) => {
                  void saveDisplayCurrencyCode(event.target.value);
                }}
                className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm font-medium text-slate-100 outline-none transition focus:border-slate-400"
              >
                {currencyPresets.map((preset) => (
                  <option key={preset.id} value={preset.currencyCode}>
                    {preset.currencyCode} · {preset.currencySymbol}
                  </option>
                ))}
              </select>
            </label>
          </div>

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
                <label className="w-full md:hidden">
                  <span className="sr-only">Display currency</span>
                  <select
                    value={displayCurrencyCode}
                    onChange={(event) => {
                      void saveDisplayCurrencyCode(event.target.value);
                    }}
                    className="w-full rounded-2xl border border-line bg-surface px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus:border-slate-400"
                  >
                    {currencyPresets.map((preset) => (
                      <option key={preset.id} value={preset.currencyCode}>
                        {preset.currencyCode} · {preset.currencySymbol}
                      </option>
                    ))}
                  </select>
                </label>
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
