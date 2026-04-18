"use client";

import { useState, useTransition } from "react";
import { type TransactionCategory, type TransactionType } from "../lib/transactions";
import { useTransactions } from "./transactions-provider";

const today = new Date().toISOString().slice(0, 10);
const ADD_CATEGORY_VALUE = "__add_category__";
const ADD_SUBCATEGORY_VALUE = "__add_subcategory__";

export function AddTransactionModal() {
  const {
    addCategory,
    addSubcategory,
    addTransaction,
    categories,
    closeAddModal,
    getSubcategoriesForCategory,
    isAddModalOpen,
    transactionsError,
    clearTransactionsError,
  } = useTransactions();
  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<TransactionCategory>(
    categories[0]?.name ?? ""
  );
  const [subcategory, setSubcategory] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newSubcategoryName, setNewSubcategoryName] = useState("");
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [isAddingSubcategory, setIsAddingSubcategory] = useState(false);
  const [date, setDate] = useState(today);
  const [note, setNote] = useState("");
  const [isPending, startTransition] = useTransition();
  const categoryOptions = categories.map((item) => item.name);
  const resolvedCategory = category || categoryOptions[0] || "";
  const subcategoryOptions = getSubcategoriesForCategory(resolvedCategory);

  if (!isAddModalOpen) {
    return null;
  }

  const selectedCategoryValue = isAddingCategory
    ? ADD_CATEGORY_VALUE
    : resolvedCategory;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-[32px] border border-white/50 bg-white p-6 shadow-[0_30px_80px_rgba(15,23,42,0.24)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.22em] text-muted">
              BudgetFlow
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              Add transaction
            </h2>
            <p className="mt-2 text-sm text-muted">
              Capture income and expenses without leaving the dashboard.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              clearTransactionsError();
              closeAddModal();
            }}
            className="rounded-2xl border border-line px-3 py-2 text-sm font-medium text-muted transition hover:bg-slate-50 hover:text-slate-900"
          >
            Close
          </button>
        </div>

        <form
          className="mt-6 grid gap-4 sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            clearTransactionsError();

            startTransition(async () => {
              let nextCategory = resolvedCategory;
              let resolvedSubcategory = subcategory || null;

              if (isAddingCategory) {
                const createdCategory = await addCategory({
                  name: newCategoryName,
                });

                if (!createdCategory) {
                  return;
                }

                nextCategory = createdCategory;
              }

              if (isAddingSubcategory) {
                const createdSubcategory = await addSubcategory({
                  categoryName: nextCategory,
                  name: newSubcategoryName,
                });

                if (!createdSubcategory) {
                  return;
                }

                resolvedSubcategory = createdSubcategory;
              }

              const didSave = await addTransaction({
                type,
                amount: Number.parseFloat(amount),
                category: nextCategory,
                subcategory: resolvedSubcategory,
                date,
                note:
                  note.trim() ||
                  `${type === "income" ? "Income" : "Expense"} entry`,
              });

              if (!didSave) {
                return;
              }

              setType("expense");
              setAmount("");
              setCategory(categoryOptions[0] ?? "Food");
              setSubcategory("");
              setNewCategoryName("");
              setNewSubcategoryName("");
              setIsAddingCategory(false);
              setIsAddingSubcategory(false);
              setDate(today);
              setNote("");
            });
          }}
        >
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Type</span>
            <select
              value={type}
              onChange={(event) => setType(event.target.value as TransactionType)}
              className="w-full rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-400"
            >
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Amount</span>
            <input
              required
              min="0.01"
              step="0.01"
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className="w-full rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-400"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Category</span>
            <select
              value={selectedCategoryValue}
              onChange={(event) => {
                if (event.target.value === ADD_CATEGORY_VALUE) {
                  setIsAddingCategory(true);
                  setSubcategory("");
                  setIsAddingSubcategory(false);
                  return;
                }

                setIsAddingCategory(false);
                setCategory(event.target.value as TransactionCategory);
                setSubcategory("");
                setIsAddingSubcategory(false);
                setNewCategoryName("");
              }}
              className="w-full rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-400"
            >
              {!selectedCategoryValue ? (
                <option value="" disabled>
                  Select a category
                </option>
              ) : null}
              {categoryOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
              <option value={ADD_CATEGORY_VALUE}>+ Add category</option>
            </select>
          </label>

          {isAddingCategory ? (
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">
                New category name
              </span>
              <input
                required
                type="text"
                value={newCategoryName}
                onChange={(event) => {
                  setNewCategoryName(event.target.value);
                }}
                placeholder="Enter category name"
                className="w-full rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-400"
              />
            </label>
          ) : (
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">
                Subcategory
              </span>
              <select
                value={subcategory}
                onChange={(event) => {
                  if (event.target.value === ADD_SUBCATEGORY_VALUE) {
                    setIsAddingSubcategory(true);
                    setSubcategory("");
                    return;
                  }

                  setIsAddingSubcategory(false);
                  setSubcategory(event.target.value);
                }}
                className="w-full rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-400"
              >
                <option value="">No subcategory</option>
                {subcategoryOptions.map((item) => (
                  <option key={item.id} value={item.name}>
                    {item.name}
                  </option>
                ))}
                <option value={ADD_SUBCATEGORY_VALUE}>+ Add subcategory</option>
              </select>
            </label>
          )}

          {isAddingSubcategory ? (
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">
                New subcategory name
              </span>
              <input
                required
                type="text"
                value={newSubcategoryName}
                onChange={(event) => setNewSubcategoryName(event.target.value)}
                placeholder="Enter subcategory name"
                className="w-full rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-400"
              />
            </label>
          ) : null}

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Date</span>
            <input
              required
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="w-full rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-400"
            />
          </label>

          <label className="space-y-2 sm:col-span-2">
            <span className="text-sm font-medium text-slate-700">Note</span>
            <input
              type="text"
              placeholder="e.g. Grocery run or freelance invoice"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="w-full rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-400"
            />
          </label>

          {transactionsError ? (
            <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 sm:col-span-2">
              {transactionsError}
            </p>
          ) : null}

          <div className="flex justify-end gap-3 sm:col-span-2">
            <button
              type="button"
              onClick={() => {
                clearTransactionsError();
                closeAddModal();
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
              {isPending ? "Saving..." : "Save transaction"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
