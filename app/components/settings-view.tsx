"use client";

import { type ReactNode, useEffect, useMemo, useState, useTransition } from "react";
import { categoryColorOptions, chartPalettes } from "../lib/transactions";
import { useTransactions } from "./transactions-provider";

const currencyOptions = (
  [
    { code: "USD", label: "US Dollar", symbol: "$" },
    { code: "EUR", label: "Euro", symbol: "EUR" },
    { code: "GBP", label: "British Pound", symbol: "GBP" },
    { code: "LKR", label: "Sri Lankan Rupee", symbol: "Rs" },
    { code: "INR", label: "Indian Rupee", symbol: "Rs" },
    { code: "BDT", label: "Bangladeshi Taka", symbol: "Tk" },
    { code: "CAD", label: "Canadian Dollar", symbol: "C$" },
    { code: "AUD", label: "Australian Dollar", symbol: "A$" },
    { code: "JPY", label: "Japanese Yen", symbol: "JPY" },
    { code: "CNY", label: "Chinese Yuan", symbol: "CNY" },
    { code: "HKD", label: "Hong Kong Dollar", symbol: "HK$" },
    { code: "SGD", label: "Singapore Dollar", symbol: "S$" },
    { code: "NZD", label: "New Zealand Dollar", symbol: "NZ$" },
    { code: "CHF", label: "Swiss Franc", symbol: "CHF" },
    { code: "SEK", label: "Swedish Krona", symbol: "SEK" },
    { code: "NOK", label: "Norwegian Krone", symbol: "NOK" },
    { code: "DKK", label: "Danish Krone", symbol: "DKK" },
    { code: "PLN", label: "Polish Zloty", symbol: "PLN" },
    { code: "CZK", label: "Czech Koruna", symbol: "CZK" },
    { code: "HUF", label: "Hungarian Forint", symbol: "HUF" },
    { code: "RON", label: "Romanian Leu", symbol: "RON" },
    { code: "RUB", label: "Russian Ruble", symbol: "RUB" },
    { code: "TRY", label: "Turkish Lira", symbol: "TRY" },
    { code: "AED", label: "UAE Dirham", symbol: "AED" },
    { code: "SAR", label: "Saudi Riyal", symbol: "SAR" },
    { code: "QAR", label: "Qatari Riyal", symbol: "QAR" },
    { code: "KWD", label: "Kuwaiti Dinar", symbol: "KWD" },
    { code: "BHD", label: "Bahraini Dinar", symbol: "BHD" },
    { code: "OMR", label: "Omani Rial", symbol: "OMR" },
    { code: "ILS", label: "Israeli New Shekel", symbol: "ILS" },
    { code: "ZAR", label: "South African Rand", symbol: "R" },
    { code: "EGP", label: "Egyptian Pound", symbol: "EGP" },
    { code: "NGN", label: "Nigerian Naira", symbol: "NGN" },
    { code: "KES", label: "Kenyan Shilling", symbol: "KES" },
    { code: "GHS", label: "Ghanaian Cedi", symbol: "GHS" },
    { code: "MAD", label: "Moroccan Dirham", symbol: "MAD" },
    { code: "PKR", label: "Pakistani Rupee", symbol: "PKR" },
    { code: "NPR", label: "Nepalese Rupee", symbol: "NPR" },
    { code: "THB", label: "Thai Baht", symbol: "THB" },
    { code: "MYR", label: "Malaysian Ringgit", symbol: "MYR" },
    { code: "IDR", label: "Indonesian Rupiah", symbol: "IDR" },
    { code: "PHP", label: "Philippine Peso", symbol: "PHP" },
    { code: "VND", label: "Vietnamese Dong", symbol: "VND" },
    { code: "KRW", label: "South Korean Won", symbol: "KRW" },
    { code: "TWD", label: "New Taiwan Dollar", symbol: "TWD" },
    { code: "MXN", label: "Mexican Peso", symbol: "MX$" },
    { code: "BRL", label: "Brazilian Real", symbol: "R$" },
    { code: "ARS", label: "Argentine Peso", symbol: "ARS" },
    { code: "CLP", label: "Chilean Peso", symbol: "CLP" },
    { code: "COP", label: "Colombian Peso", symbol: "COP" },
    { code: "PEN", label: "Peruvian Sol", symbol: "PEN" },
    { code: "UYU", label: "Uruguayan Peso", symbol: "UYU" },
  ] as const
)
  .slice()
  .sort((left, right) => left.code.localeCompare(right.code));

function AccordionSection({
  title,
  description,
  children,
  isOpen,
  onToggle,
}: {
  title: string;
  description: string;
  children: ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <section className="rounded-[28px] border border-line bg-surface p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-4 text-left"
      >
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">
            {title}
          </h2>
          <p className="mt-1 text-sm text-muted">{description}</p>
        </div>
        <span className="mt-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
          {isOpen ? "Hide" : "Show"}
        </span>
      </button>
      {isOpen ? (
        <div className="mt-6 border-t border-line pt-6">{children}</div>
      ) : null}
    </section>
  );
}

export function SettingsView() {
  const {
    addCategory,
    addSubcategory,
    appSettings,
    appSettingsError,
    baseCurrencyCode,
    categories,
    categoriesError,
    chartPalette,
    clearAppSettingsError,
    clearCategoriesError,
    clearCurrencyPresetsError,
    clearPreferencesError,
    currencyPresets,
    currencyPresetsError,
    displayCurrencyCode,
    deleteCategory,
    deleteSubcategory,
    formatDisplayCurrency,
    getSubcategoriesForCategory,
    getCategoryColor,
    hasLoadedAppSettings,
    hasLoadedCategories,
    hasLoadedCurrencyPresets,
    isAppSettingsLoading,
    isCategoriesLoading,
    isCurrencyPresetsLoading,
    isPreferencesLoading,
    isResettingUserData,
    preferencesError,
    refreshCurrencyPresetRate,
    renameCategory,
    renameSubcategory,
    resetUserData,
    openStartingBalanceModal,
    saveCategoryColor,
    saveChartPalette,
    saveAppSettings,
    saveCurrencyPreset,
    saveDisplayCurrencyCode,
    monthlySnapshots,
    savingsGoal,
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
  const [resetPeriodMode, setResetPeriodMode] = useState(
    appSettings?.resetPeriodMode ?? "monthly"
  );
  const [customResetDay, setCustomResetDay] = useState(
    `${appSettings?.customResetDay ?? 1}`
  );
  const [customResetHour, setCustomResetHour] = useState(
    `${appSettings?.customResetHour ?? 0}`
  );
  const [customResetMinute, setCustomResetMinute] = useState(
    `${appSettings?.customResetMinute ?? 0}`
  );
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    reset: false,
    categories: false,
    currency: false,
    appearance: false,
    balance: false,
    account: false,
    data: false,
  });
  const [selectedCurrencyCode, setSelectedCurrencyCode] = useState(displayCurrencyCode);
  const [manualExchangeRate, setManualExchangeRate] = useState("");
  const [isAutoExchangeEnabled, setIsAutoExchangeEnabled] = useState(true);

  useEffect(() => {
    setResetPeriodMode(appSettings?.resetPeriodMode ?? "monthly");
    setCustomResetDay(`${appSettings?.customResetDay ?? 1}`);
    setCustomResetHour(`${appSettings?.customResetHour ?? 0}`);
    setCustomResetMinute(`${appSettings?.customResetMinute ?? 0}`);
  }, [appSettings]);

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
  const currentBalanceBroughtForward =
    savingsGoal?.currentAmount ??
    monthlySnapshots[monthlySnapshots.length - 1]?.savingsTotal ??
    0;

  function toggleSection(sectionId: keyof typeof openSections) {
    setOpenSections((current) => ({
      ...current,
      [sectionId]: !current[sectionId],
    }));
  }

  const selectedCurrencyOption =
    currencyOptions.find((option) => option.code === selectedCurrencyCode) ??
    currencyOptions[0];
  const selectedCurrencyPreset = currencyPresets.find(
    (preset) => preset.currencyCode === selectedCurrencyCode
  );

  useEffect(() => {
    setSelectedCurrencyCode(displayCurrencyCode);
  }, [displayCurrencyCode]);

  useEffect(() => {
    if (selectedCurrencyCode === baseCurrencyCode) {
      setIsAutoExchangeEnabled(true);
      setManualExchangeRate("1");
      return;
    }

    if (selectedCurrencyPreset) {
      setIsAutoExchangeEnabled(selectedCurrencyPreset.autoFillEnabled);
      setManualExchangeRate(selectedCurrencyPreset.exchangeRate.toFixed(6));
      return;
    }

    setIsAutoExchangeEnabled(true);
    setManualExchangeRate("");
  }, [baseCurrencyCode, selectedCurrencyCode, selectedCurrencyPreset]);

  return (
    <>
      <section className="space-y-6">
        <AccordionSection
          title="Reset Period / Initialization"
          description="Control how live budgeting periods roll forward into locked snapshots."
          isOpen={openSections.reset}
          onToggle={() => toggleSection("reset")}
        >
          {appSettingsError ? (
            <div className="rounded-2xl bg-rose-50 px-4 py-4 text-sm text-rose-700">
              {appSettingsError}
            </div>
          ) : null}

          {isAppSettingsLoading ? (
            <div className="rounded-2xl bg-slate-50 px-4 py-10 text-center text-sm text-muted">
              Loading reset period settings...
            </div>
          ) : (
            <form
              className="space-y-5"
              onSubmit={(event) => {
                event.preventDefault();
                clearAppSettingsError();

                startTransition(async () => {
                  await saveAppSettings({
                    resetPeriodMode,
                    customResetDay:
                      resetPeriodMode === "custom"
                        ? Number.parseInt(customResetDay, 10)
                        : null,
                    customResetHour:
                      resetPeriodMode === "custom"
                        ? Number.parseInt(customResetHour, 10)
                        : null,
                    customResetMinute:
                      resetPeriodMode === "custom"
                        ? Number.parseInt(customResetMinute, 10)
                        : null,
                  });
                });
              }}
            >
              <div className="grid gap-3 lg:grid-cols-3">
                {[
                  {
                    id: "monthly",
                    title: "Monthly",
                    description: "Roll over automatically at the start of each new month.",
                  },
                  {
                    id: "custom",
                    title: "Custom",
                    description: "Use your own monthly reset day and time from these settings.",
                  },
                  {
                    id: "never",
                    title: "Never",
                    description: "Keep one live period and do not auto-create rollover snapshots.",
                  },
                ].map((mode) => {
                  const isActive = resetPeriodMode === mode.id;

                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setResetPeriodMode(mode.id as typeof resetPeriodMode)}
                      className={`rounded-2xl border px-4 py-4 text-left transition ${
                        isActive
                          ? "border-slate-950 bg-slate-50 shadow-sm"
                          : "border-line bg-white hover:border-slate-300"
                      }`}
                    >
                      <p className="font-semibold text-slate-950">{mode.title}</p>
                      <p className="mt-2 text-sm text-muted">{mode.description}</p>
                    </button>
                  );
                })}
              </div>

              {resetPeriodMode === "custom" ? (
                <div className="grid gap-4 rounded-2xl bg-slate-50 px-4 py-4 md:grid-cols-3">
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700">
                      Reset day
                    </span>
                    <input
                      min="1"
                      max="31"
                      step="1"
                      type="number"
                      value={customResetDay}
                      onChange={(event) => setCustomResetDay(event.target.value)}
                      className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-400"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700">
                      Reset hour
                    </span>
                    <input
                      min="0"
                      max="23"
                      step="1"
                      type="number"
                      value={customResetHour}
                      onChange={(event) => setCustomResetHour(event.target.value)}
                      className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-400"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700">
                      Reset minute
                    </span>
                    <input
                      min="0"
                      max="59"
                      step="1"
                      type="number"
                      value={customResetMinute}
                      onChange={(event) => setCustomResetMinute(event.target.value)}
                      className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-400"
                    />
                  </label>
                </div>
              ) : null}

              <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-muted">
                {hasLoadedAppSettings
                  ? "When the app detects that the active period changed, it saves one locked snapshot for each completed period that does not already exist."
                  : "Reset period settings will appear here once loaded."}
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-700"
                >
                  Save reset period
                </button>
              </div>
            </form>
          )}
        </AccordionSection>

        <AccordionSection
          title="Category Management"
          description="Manage categories, subcategories, and the colors used across your dashboard."
          isOpen={openSections.categories}
          onToggle={() => toggleSection("categories")}
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
                    <div className="flex flex-col gap-5">
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

                      <div className="w-full rounded-2xl border border-white/70 bg-white px-4 py-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm font-semibold text-slate-950">
                              Category color
                            </p>
                            <p className="mt-1 text-sm text-muted">
                              Choose the color used for this category across the dashboard.
                            </p>
                          </div>
                          <span
                            className="inline-flex items-center rounded-full border border-line px-3 py-1 text-xs font-semibold text-slate-700"
                            style={{
                              backgroundColor: `${categoryColor}14`,
                              color: categoryColor,
                            }}
                          >
                            Active color
                          </span>
                        </div>

                        <div className="mt-4 flex min-h-10 w-full flex-wrap items-center gap-2.5">
                          {categoryColorOptions.map((colorOption) => {
                            const isSelected = categoryColor === colorOption;

                            return (
                              <button
                                key={colorOption}
                                type="button"
                                aria-label={`Set ${category.name} color to ${colorOption}`}
                                title={colorOption}
                                onClick={() => {
                                  clearPreferencesError();
                                  startTransition(async () => {
                                    await saveCategoryColor(category.id, colorOption);
                                  });
                                }}
                                className={`relative inline-flex h-10 w-10 flex-none items-center justify-center rounded-full transition ${
                                  isSelected
                                    ? "ring-2 ring-slate-950 ring-offset-2 ring-offset-white"
                                    : "hover:scale-[1.04]"
                                }`}
                                style={{
                                  backgroundColor: colorOption,
                                  boxShadow: isSelected
                                    ? "0 10px 20px rgba(15,23,42,0.16)"
                                    : "0 6px 14px rgba(15,23,42,0.08)",
                                }}
                              >
                                {isSelected ? (
                                  <span className="pointer-events-none text-sm font-black text-white drop-shadow-[0_1px_2px_rgba(15,23,42,0.45)]">
                                    ✓
                                  </span>
                                ) : null}
                              </button>
                            );
                          })}
                        </div>
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
        </AccordionSection>

        <AccordionSection
          title="Currency"
          description="Choose a currency, let the app refresh the exchange rate automatically, or switch to a manual rate only when needed."
          isOpen={openSections.currency}
          onToggle={() => toggleSection("currency")}
        >
          {currencyPresetsError ? (
            <div className="rounded-2xl bg-rose-50 px-4 py-4 text-sm text-rose-700">
              {currencyPresetsError}
            </div>
          ) : null}

          {isCurrencyPresetsLoading ? (
            <div className="rounded-2xl bg-slate-50 px-4 py-10 text-center text-sm text-muted">
              Loading saved currencies...
            </div>
          ) : (
            <div className="space-y-5 rounded-3xl bg-slate-50 px-5 py-5">
              <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Currency
                  </span>
                  <select
                    value={selectedCurrencyCode}
                    onChange={(event) => {
                      clearCurrencyPresetsError();
                      setSelectedCurrencyCode(event.target.value);
                    }}
                    className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-400"
                  >
                    {currencyOptions.map((option) => (
                      <option key={option.code} value={option.code}>
                        {option.code} — {option.label} ({option.symbol})
                      </option>
                    ))}
                  </select>
                </label>

                <div className="rounded-2xl bg-white px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Current rate
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-xl font-semibold text-slate-950">
                      {selectedCurrencyCode === baseCurrencyCode
                        ? "1.000000"
                        : (selectedCurrencyPreset?.exchangeRate ?? 1).toFixed(6)}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        selectedCurrencyCode === baseCurrencyCode || isAutoExchangeEnabled
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {selectedCurrencyCode === baseCurrencyCode || isAutoExchangeEnabled
                        ? "Auto"
                        : "Manual"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted">
                    {selectedCurrencyCode === baseCurrencyCode
                      ? "Base currency values stay at 1.000000."
                      : selectedCurrencyPreset?.lastFetchedAt
                        ? `Saved on ${new Intl.DateTimeFormat("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          }).format(new Date(selectedCurrencyPreset.lastFetchedAt))}`
                        : "Using the currently saved rate for this currency."}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-4 rounded-2xl bg-white px-4 py-4">
                <label className="inline-flex items-center gap-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={selectedCurrencyCode === baseCurrencyCode ? true : isAutoExchangeEnabled}
                    onChange={(event) => {
                      if (selectedCurrencyCode === baseCurrencyCode) {
                        return;
                      }

                      setIsAutoExchangeEnabled(event.target.checked);
                    }}
                    disabled={selectedCurrencyCode === baseCurrencyCode}
                    className="h-4 w-4 rounded border-line"
                  />
                  Auto exchange rate
                </label>

                {!isAutoExchangeEnabled && selectedCurrencyCode !== baseCurrencyCode ? (
                  <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-slate-700">
                        Manual exchange rate
                      </span>
                      <input
                        type="number"
                        min="0.000001"
                        step="0.000001"
                        value={manualExchangeRate}
                        onChange={(event) => setManualExchangeRate(event.target.value)}
                        placeholder="Enter exchange rate"
                        className="w-full rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-400"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        clearCurrencyPresetsError();
                        startTransition(async () => {
                          const savedPresetId = await saveCurrencyPreset({
                            id: selectedCurrencyPreset?.id,
                            currencyCode: selectedCurrencyOption.code,
                            currencyLabel: selectedCurrencyOption.label,
                            currencySymbol: selectedCurrencyOption.symbol,
                            exchangeRate: Number.parseFloat(manualExchangeRate || "1"),
                            autoFillEnabled: false,
                          });

                          if (savedPresetId) {
                            await saveDisplayCurrencyCode(selectedCurrencyOption.code);
                          }
                        });
                      }}
                      disabled={isPending}
                      className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-700"
                    >
                      Apply
                    </button>
                  </div>
                ) : null}

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      clearCurrencyPresetsError();
                      startTransition(async () => {
                        const savedPresetId = await saveCurrencyPreset({
                          id: selectedCurrencyPreset?.id,
                          currencyCode: selectedCurrencyOption.code,
                          currencyLabel: selectedCurrencyOption.label,
                          currencySymbol: selectedCurrencyOption.symbol,
                          exchangeRate:
                            selectedCurrencyOption.code === baseCurrencyCode
                              ? 1
                              : selectedCurrencyPreset?.exchangeRate ?? 1,
                          autoFillEnabled:
                            selectedCurrencyOption.code === baseCurrencyCode
                              ? true
                              : isAutoExchangeEnabled,
                        });

                        if (!savedPresetId) {
                          return;
                        }

                        if (
                          selectedCurrencyOption.code !== baseCurrencyCode &&
                          isAutoExchangeEnabled
                        ) {
                          await refreshCurrencyPresetRate(savedPresetId);
                        }

                        await saveDisplayCurrencyCode(selectedCurrencyOption.code);
                      });
                    }}
                    disabled={isPending}
                    className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-700"
                  >
                    Use currency
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!selectedCurrencyPreset) {
                        return;
                      }

                      clearCurrencyPresetsError();
                      void refreshCurrencyPresetRate(selectedCurrencyPreset.id);
                    }}
                    disabled={!selectedCurrencyPreset || isPending}
                    className="rounded-2xl border border-line bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    Refresh rate
                  </button>
                </div>
              </div>

              {hasLoadedCurrencyPresets ? (
                <div>
                  <p className="text-sm font-medium text-slate-700">
                    Available in the app
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {currencyPresets.map((preset) => (
                      <span
                        key={preset.id}
                        className={`rounded-full px-3 py-2 text-sm font-medium ${
                          preset.currencyCode === displayCurrencyCode
                            ? "bg-slate-950 text-white"
                            : "bg-white text-slate-700"
                        }`}
                      >
                        {preset.currencyCode} · {preset.currencySymbol} ·{" "}
                        {preset.autoFillEnabled ? "Auto" : "Manual"}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </AccordionSection>

        <AccordionSection
          title="Appearance / Colors"
          description="Choose the chart palette used across the dashboard and fine-tune category colors."
          isOpen={openSections.appearance}
          onToggle={() => toggleSection("appearance")}
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
        </AccordionSection>

        <AccordionSection
          title="Balance Brought Forward"
          description="Review and edit the balance carried into the current live month."
          isOpen={openSections.balance}
          onToggle={() => toggleSection("balance")}
        >
          <div className="rounded-2xl bg-slate-50 px-5 py-5">
            <p className="text-sm text-muted">
              This value is your starting balance before the current month&apos;s
              income and expenses are applied.
            </p>
            <p className="mt-4 text-2xl font-semibold text-slate-950">
              {formatDisplayCurrency(currentBalanceBroughtForward)}
            </p>
            <button
              type="button"
              onClick={() => openStartingBalanceModal("settings")}
              className="mt-4 inline-flex rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Edit balance
            </button>
          </div>
        </AccordionSection>

        <AccordionSection
          title="Account / App Preferences"
          description="A quick summary of the active experience and settings for this signed-in workspace."
          isOpen={openSections.account}
          onToggle={() => toggleSection("account")}
        >
          <div className="space-y-4">
              <div className="rounded-2xl bg-slate-50 px-4 py-4">
                <p className="text-sm font-semibold text-slate-950">Currency display</p>
                <p className="mt-1 text-sm text-muted">
                  Currently showing amounts in <span className="font-medium text-slate-900">{displayCurrencyCode} ({currencySymbol})</span> while stored values remain based on <span className="font-medium text-slate-900">{baseCurrencyCode}</span>.
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
        </AccordionSection>

        <AccordionSection
          title="Data & Reset"
          description="Reset only this user’s budgeting data while keeping auth access and the app shell intact."
          isOpen={openSections.data}
          onToggle={() => toggleSection("data")}
        >
          {resetSuccessMessage ? (
            <div className="rounded-2xl bg-emerald-50 px-4 py-4 text-sm text-emerald-700">
              {resetSuccessMessage}
            </div>
          ) : null}

          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-5">
            <p className="text-sm font-semibold text-rose-900">Danger zone</p>
            <p className="mt-2 text-sm leading-6 text-rose-800">
              Resetting data deletes this account&apos;s transactions, budgets, balance brought forward value, reset period settings, snapshot history, saved currencies, custom categories, subcategories, and appearance preferences. It does not delete the auth account, and default categories remain available afterward.
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
        </AccordionSection>
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
                  This permanently removes only this user&apos;s transactions, budgets, balance brought forward value, reset period settings, snapshot history, saved currencies, custom categories, subcategories, and chart preferences. Type <span className="font-semibold text-slate-950">RESET</span> to continue.
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
