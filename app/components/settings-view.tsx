"use client";

import { useState, useTransition } from "react";
import { useTransactions } from "./transactions-provider";

export function SettingsView() {
  const {
    addCategory,
    addSubcategory,
    categories,
    categoriesError,
    clearCategoriesError,
    deleteCategory,
    deleteSubcategory,
    getSubcategoriesForCategory,
    hasLoadedCategories,
    isCategoriesLoading,
    renameCategory,
    renameSubcategory,
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
  const [isPending, startTransition] = useTransition();

  return (
    <section className="rounded-[28px] border border-line bg-surface p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
      <div className="border-b border-line pb-6">
        <h2 className="text-xl font-semibold tracking-tight text-slate-950">
          Categories
        </h2>
        <p className="mt-1 text-sm text-muted">
          Manage your categories and subcategories. Deletions are blocked when items are still used by transactions, budgets, or child records.
        </p>
      </div>

      <form
        className="mt-6 flex flex-col gap-3 sm:flex-row"
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
            const categoryDraft =
              draftCategoryNames[category.id] ?? category.name;

            return (
              <article
                key={category.id}
                className="rounded-2xl border border-line bg-slate-50 px-4 py-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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

                {category.isFallback ? (
                  <p className="mt-3 text-sm text-muted">
                    Built-in default category. It stays available automatically across the app.
                  </p>
                ) : null}

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
                          draftSubcategoryNames[subcategory.id] ??
                          subcategory.name;

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
    </section>
  );
}
