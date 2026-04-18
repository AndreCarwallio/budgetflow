"use client";

import { type ReactNode, useMemo, useState, useTransition } from "react";
import { categoryColorOptions, chartPalettes } from "../lib/transactions";
import { useTransactions } from "./transactions-provider";

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-line bg-surface p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
      <div className="border-b border-line pb-5">
        <h2 className="text-xl font-semibold tracking-tight text-slate-950">
          {title}
        </h2>
        <p className="mt-1 text-sm text-muted">{description}</p>
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

export function SettingsView() {
  const {
    addCategory,
    addSubcategory,
    categories,
    categoriesError,
    chartPalette,
    clearCategoriesError,
    clearPreferencesError,
    deleteCategory,
    deleteSubcategory,
    getSubcategoriesForCategory,
    getCategoryColor,
    hasLoadedCategories,
    isCategoriesLoading,
    isPreferencesLoading,
    isResettingUserData,
    preferencesError,
    renameCategory,
    renameSubcategory,
    resetUserData,
    saveCategoryColor,
    saveChartPalette,
    currencySymbol,
  } = useTransactions();
  const [newCategoryName, setNewCategoryName] = useState("");
  const [draftCategoryNames, setDraftCategoryNames] = useState<Record<string, string>>(
    {}
  );
  const [draftSubcategoryNames, setDraftSubcategoryNames] = useState<
    Record<string, string>
  >({});
  const [newSubcategoryNames, setNewSubcategoryNames] = useState<
    Record<string, string>
  >({});
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetConfirmation, setResetConfirmation] = useState("");
  const [resetSuccessMessage, setResetSuccessMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const currentPalette = useMemo(
    () =>
      chartPalettes.find((palette) => palette.id === chartPalette) ?? chartPalettes[0],
    [chartPalette]
  );
  const subcategoryCount = useMemo(
    () =>
      categories.reduce(
        (count, category) => count + getSubcategoriesForCategory(category.name).length,
        0
      ),
    [categories, getSubcategoriesForCategory]
  );
  const customCategoryCount = categories.filter((category) => !category.isFallback).length;

  return (
    <>
      <section className="space-y-6">
        <SectionCard
          title="Category Management"
          description="Manage categories, subcategories, and the colors used across your dashboard."
        >
          <form
            className="flex flex-col gap-3 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault();
              clearCategoriesError();

              startTransition(async () => {
                const createdCategory = await addCategory({ name: newCategoryName });

                if (createdCategory) {
                  setNewCategoryName("");
                }
              });
            }}
          >
            <input
              type="text"
              value={newCategoryName}
              onChange={(event) => setNewCategoryName(event.target.value)}
              placeholder="Add new category"
              className="flex-1 rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-400"
            />
            <button
              type="submit"
              disabled={isPending}
              className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-700"
            >
              Add category
            </button>
          </form>

          {categoriesError ? (
            <div className="mt-4 rounded-2xl bg-rose-50 px-4 py-4 text-sm text-rose-700">
              {categoriesError}
            </div>
          ) : null}

          <div className="mt-6 space-y-4">
            {isCategoriesLoading ? (
              <div className="rounded-2xl bg-slate-50 px-4 py-10 text-center text-sm text-muted">
                Loading categories...
              </div>
            ) : categories.length === 0 && hasLoadedCategories ? (
              <div className="rounded-2xl bg-slate-50 px-4 py-10 text-center">
                <p className="text-base font-semibold text-slate-800">
                  No categories yet
                </p>
                <p className="mt-2 text-sm text-muted">
                  Add your first category to start organizing transactions.
                </p>
              </div>
            ) : (
              categories.map((category) => {
                const linkedSubcategories = getSubcategoriesForCategory(category.name);
                const categoryDraft = draftCategoryNames[category.id] ?? category.name;
                const categoryColor = getCategoryColor(category.name);

                return (
                  <article
                    key={category.id}
                    className="rounded-2xl border border-line bg-slate-50 px-4 py-4"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: categoryColor }}
                          />
                          <input
                            type="text"
                            value={categoryDraft}
                            onChange={(event) =>
                              setDraftCategoryNames((current) => ({
                                ...current,
                                [category.id]: event.target.value,
                              }))
                            }
                            className="flex-1 rounded-2xl border border-line bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-400"
                          />
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          {categoryColorOptions.map((colorOption) => (
                            <button
                              key={colorOption}
                              type="button"
                              aria-label={`Set ${category.name} color to ${colorOption}`}
                              onClick={() => {
                                clearPreferencesError();
                                startTransition(async () => {
                                  await saveCategoryColor(category.id, colorOption);
                                });
                              }}
                              className={`h-8 w-8 rounded-full border-2 transition ${
                                categoryColor === colorOption
                                  ? "border-slate-950 scale-105"
                                  : "border-white hover:scale-105"
                              }`}
                              style={{ backgroundColor: colorOption }}
                            />
                          ))}
                        </div>

                        {category.isFallback ? (
                          <p className="mt-3 text-sm text-muted">
                            Built-in default category. It stays available automatically across the app, but you can still customize its color.
                          </p>
                        ) : null}
                      </div>

                      <div className="flex gap-3">
                        <button
                          type="button"
                          disabled={category.isFallback}
                          onClick={() => {
                            clearCategoriesError();
                            startTransition(async () => {
                              await renameCategory(category.id, categoryDraft);
                            });
                          }}
                          className="rounded-2xl border border-line bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Rename
                        </button>
                        <button
                          type="button"
                          disabled={category.isFallback}
                          onClick={() => {
                            clearCategoriesError();
                            startTransition(async () => {
                              await deleteCategory(category.id);
                            });
                          }}
                          className="rounded-2xl border border-line bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 rounded-2xl bg-white px-4 py-4">
                      <div className="flex items-center justify-between gap-4">
                        <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted">
                          Subcategories
                        </h3>
                      </div>

                      <div className="mt-4 space-y-3">
                        {linkedSubcategories.length === 0 ? (
                          <p className="text-sm text-muted">
                            No subcategories yet for {category.name}.
                          </p>
                        ) : (
                          linkedSubcategories.map((subcategory) => {
                            const subcategoryDraft =
                              draftSubcategoryNames[subcategory.id] ?? subcategory.name;

                            return (
                              <div
                                key={subcategory.id}
                                className="flex flex-col gap-3 sm:flex-row sm:items-center"
                              >
                                <input
                                  type="text"
                                  value={subcategoryDraft}
                                  onChange={(event) =>
                                    setDraftSubcategoryNames((current) => ({
                                      ...current,
                                      [subcategory.id]: event.target.value,
                                    }))
                                  }
                                  className="flex-1 rounded-2xl border border-line bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-400"
                                />
                                <div className="flex gap-3">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      clearCategoriesError();
                                      startTransition(async () => {
                                        await renameSubcategory(
                                          subcategory.id,
                                          subcategoryDraft
                                        );
                                      });
                                    }}
                                    className="rounded-2xl border border-line bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                                  >
                                    Rename
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      clearCategoriesError();
                                      startTransition(async () => {
                                        await deleteSubcategory(subcategory.id);
                                      });
                                    }}
                                    className="rounded-2xl border border-line bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      <form
                        className="mt-4 flex flex-col gap-3 sm:flex-row"
                        onSubmit={(event) => {
                          event.preventDefault();
                          clearCategoriesError();

                          startTransition(async () => {
                            const createdSubcategory = await addSubcategory({
                              categoryName: category.name,
                              name: newSubcategoryNames[category.id] ?? "",
                            });

                            if (createdSubcategory) {
                              setNewSubcategoryNames((current) => ({
                                ...current,
                                [category.id]: "",
                              }));
                            }
                          });
                        }}
                      >
                        <input
                          type="text"
                          value={newSubcategoryNames[category.id] ?? ""}
                          onChange={(event) =>
                            setNewSubcategoryNames((current) => ({
                              ...current,
                              [category.id]: event.target.value,
                            }))
                          }
                          placeholder={`Add subcategory to ${category.name}`}
                          className="flex-1 rounded-2xl border border-line bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-400"
                        />
                        <button
                          type="submit"
                          className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                        >
                          Add subcategory
                        </button>
                      </form>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </SectionCard>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <SectionCard
            title="Appearance / Colors"
            description="Choose the chart palette used across the dashboard and fine-tune category colors."
          >
            {preferencesError ? (
              <div className="rounded-2xl bg-rose-50 px-4 py-4 text-sm text-rose-700">
                {preferencesError}
              </div>
            ) : null}

            {isPreferencesLoading ? (
              <div className="rounded-2xl bg-slate-50 px-4 py-10 text-center text-sm text-muted">
                Loading appearance settings...
              </div>
            ) : (
              <div className="space-y-4">
                {chartPalettes.map((palette) => {
                  const isActive = palette.id === chartPalette;

                  return (
                    <button
                      key={palette.id}
                      type="button"
                      onClick={() => {
                        clearPreferencesError();
                        startTransition(async () => {
                          await saveChartPalette(palette.id);
                        });
                      }}
                      className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                        isActive
                          ? "border-slate-950 bg-slate-50 shadow-sm"
                          : "border-line bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-semibold text-slate-950">{palette.label}</p>
                          <p className="mt-1 text-sm text-muted">
                            {palette.description}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {palette.colors.map((color) => (
                            <span
                              key={color}
                              className="h-6 w-6 rounded-full border border-white shadow-sm"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Account / App Preferences"
            description="A quick summary of the active experience and settings for this signed-in workspace."
          >
            <div className="space-y-4">
              <div className="rounded-2xl bg-slate-50 px-4 py-4">
                <p className="text-sm font-semibold text-slate-950">Currency display</p>
                <p className="mt-1 text-sm text-muted">
                  Currently showing amounts in <span className="font-medium text-slate-900">{currencySymbol}</span>. Change it anytime from the header toggle.
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 px-4 py-4">
                <p className="text-sm font-semibold text-slate-950">Active chart palette</p>
                <p className="mt-1 text-sm text-muted">
                  {currentPalette.label} is applied to the dashboard graph visuals right now.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-slate-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                    Categories
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950">
                    {categories.length}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                    Custom
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950">
                    {customCategoryCount}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                    Subcategories
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950">
                    {subcategoryCount}
                  </p>
                </div>
              </div>
            </div>
          </SectionCard>
        </div>

        <SectionCard
          title="Data & Reset"
          description="Reset only this user’s budgeting data while keeping auth access and the app shell intact."
        >
          {resetSuccessMessage ? (
            <div className="rounded-2xl bg-emerald-50 px-4 py-4 text-sm text-emerald-700">
              {resetSuccessMessage}
            </div>
          ) : null}

          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-5">
            <p className="text-sm font-semibold text-rose-900">Danger zone</p>
            <p className="mt-2 text-sm leading-6 text-rose-800">
              Resetting data deletes this account&apos;s transactions, budgets, savings goal, custom categories, subcategories, and appearance preferences. It does not delete the auth account, and default categories remain available afterward.
            </p>
            <button
              type="button"
              onClick={() => {
                clearPreferencesError();
                setResetSuccessMessage("");
                setResetConfirmation("");
                setIsResetModalOpen(true);
              }}
              className="mt-4 rounded-2xl border border-rose-700 bg-rose-600 px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(225,29,72,0.18)] transition hover:-translate-y-0.5 hover:bg-rose-700 hover:shadow-[0_16px_30px_rgba(225,29,72,0.24)] focus:outline-none focus:ring-2 focus:ring-rose-300 focus:ring-offset-2"
            >
              Reset data
            </button>
          </div>
        </SectionCard>
      </section>

      {isResetModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[32px] border border-white/50 bg-white p-6 shadow-[0_30px_80px_rgba(15,23,42,0.24)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.22em] text-muted">
                  BudgetFlow
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                  Confirm data reset
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted">
                  This permanently removes only this user&apos;s transactions, budgets, savings goal, custom categories, subcategories, and chart preferences. Type <span className="font-semibold text-slate-950">RESET</span> to continue.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsResetModalOpen(false);
                  setResetConfirmation("");
                }}
                className="rounded-2xl border border-line px-3 py-2 text-sm font-medium text-muted transition hover:bg-slate-50 hover:text-slate-900"
              >
                Close
              </button>
            </div>

            {preferencesError ? (
              <div className="mt-5 rounded-2xl bg-rose-50 px-4 py-4 text-sm text-rose-700">
                {preferencesError}
              </div>
            ) : null}

            <label className="mt-5 block space-y-2">
              <span className="text-sm font-medium text-slate-700">
                Type RESET to confirm
              </span>
              <input
                type="text"
                value={resetConfirmation}
                onChange={(event) => setResetConfirmation(event.target.value)}
                placeholder="RESET"
                className="w-full rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-400"
              />
            </label>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsResetModalOpen(false);
                  setResetConfirmation("");
                }}
                className="rounded-2xl border border-line px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={resetConfirmation !== "RESET" || isResettingUserData}
                onClick={() => {
                  clearPreferencesError();
                  startTransition(async () => {
                    const didReset = await resetUserData();

                    if (didReset) {
                      setResetSuccessMessage(
                        "Your data was reset successfully. Default categories remain available and the dashboard is now back to an empty state."
                      );
                      setIsResetModalOpen(false);
                      setResetConfirmation("");
                    }
                  });
                }}
                className="rounded-2xl border border-rose-700 bg-rose-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(225,29,72,0.18)] transition hover:-translate-y-0.5 hover:bg-rose-700 hover:shadow-[0_16px_30px_rgba(225,29,72,0.24)] focus:outline-none focus:ring-2 focus:ring-rose-300 focus:ring-offset-2 disabled:cursor-not-allowed disabled:border-rose-300 disabled:bg-rose-300 disabled:shadow-none"
              >
                {isResettingUserData ? "Resetting..." : "Confirm reset"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
