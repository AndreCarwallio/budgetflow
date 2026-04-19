"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ensureAppSettings,
  fetchAppSettings,
  getDefaultAppSettings,
  upsertAppSettings,
  type AppSettingsPayload,
} from "../lib/app-settings-api";
import {
  getBudgetUsageSummaryForTransactions,
  getCategorySpending,
  getIncomeExpensesForTransactions,
  getTransactionsInRange,
} from "../lib/dashboard-metrics";
import {
  fetchMonthlySnapshots,
  updateMonthlySnapshot,
  upsertMonthlySnapshot,
  type MonthlySnapshotPayload,
} from "../lib/monthly-snapshots-api";
import { getActivePeriod, getNextPeriod, parsePeriodKey } from "../lib/periods";
import { createClient } from "../lib/supabase/client";
import {
  createBudget,
  fetchBudgets,
  removeBudget,
  updateBudget,
} from "../lib/budgets-api";
import {
  createCategory,
  createSubcategory,
  deleteCategory,
  deleteSubcategory,
  fetchCategories,
  fetchSubcategories,
  renameCategory,
  renameSubcategory,
  updateCategoryColor,
} from "../lib/categories-api";
import {
  fetchAppPreferences,
  upsertChartPalette,
  type AppPreferences,
} from "../lib/preferences-api";
import { resetUserData as resetUserDataRows } from "../lib/reset-data-api";
import {
  createSavingsGoal,
  fetchSavingsGoal,
  removeSavingsGoal,
  updateSavingsGoal,
} from "../lib/savings-goals-api";
import {
  fetchTransactions,
  insertTransaction,
  removeTransaction,
} from "../lib/transactions-api";
import {
  chartPalettes,
  defaultCategoryColors,
  defaultTransactionCategories,
  initialBudgets,
  type AppSettings,
  type Budget,
  type Category,
  type ChartPalette,
  type MonthlySnapshot,
  type MonthlySnapshotData,
  type ResetPeriodMode,
  type SavingsGoal,
  type Subcategory,
  type Transaction,
  type TransactionCategory,
  type TransactionType,
} from "../lib/transactions";

const CURRENCY_STORAGE_KEY = "budgetflow.currencySymbol";
const DEFAULT_CHART_PALETTE: ChartPalette = "ocean";

function getFallbackCategoryColor(categoryName: string) {
  return defaultCategoryColors[categoryName] ?? "#94a3b8";
}

function createDefaultCategories(userId: string): Category[] {
  return defaultTransactionCategories.map((name, index) => ({
    id: `default-${index}-${name.toLowerCase()}`,
    userId,
    name,
    color: getFallbackCategoryColor(name),
    createdAt: new Date(0).toISOString(),
    isFallback: true,
  }));
}

function mergeWithDefaultCategories(
  userId: string,
  loadedCategories: Category[]
): Category[] {
  const categoriesByName = new Map<string, Category>();

  for (const category of loadedCategories) {
    categoriesByName.set(category.name.toLowerCase(), category);
  }

  for (const fallbackCategory of createDefaultCategories(userId)) {
    if (!categoriesByName.has(fallbackCategory.name.toLowerCase())) {
      categoriesByName.set(fallbackCategory.name.toLowerCase(), fallbackCategory);
    }
  }

  return Array.from(categoriesByName.values()).sort((left, right) =>
    left.name.localeCompare(right.name)
  );
}

function pickCategoryColor(name: string) {
  return (
    defaultCategoryColors[name] ??
    chartPalettes[name.length % chartPalettes.length]?.colors[0] ??
    "#0f766e"
  );
}

function readStoredJSON<T>(key: string): T | null {
  if (typeof window === "undefined") {
    return null;
  }

  const storedValue = localStorage.getItem(key);

  if (!storedValue) {
    return null;
  }

  try {
    return JSON.parse(storedValue) as T;
  } catch {
    return null;
  }
}

type AppSettingsInput = {
  resetPeriodMode: ResetPeriodMode;
  customResetDay: number | null;
  customResetHour: number | null;
  customResetMinute: number | null;
};

type SnapshotAdjustmentInput = {
  startingSavings: number;
  incomeTotal: number;
  expenseTotal: number;
  targetSavings: number;
};

function buildSnapshotData(
  periodLabel: string,
  periodStart: Date,
  periodEndExclusive: Date,
  periodTransactions: Transaction[],
  budgets: Budget[],
  previousSnapshotData?: MonthlySnapshotData
): MonthlySnapshotData {
  const recentTransactions = [...periodTransactions]
    .sort((left, right) => right.date.localeCompare(left.date))
    .slice(0, 5)
    .map((transaction) => ({
      id: transaction.id,
      type: transaction.type,
      amount: transaction.amount,
      category: transaction.category,
      subcategory: transaction.subcategory,
      date: transaction.date,
      note: transaction.note,
    }));

  return {
    periodLabel,
    periodStart: periodStart.toISOString(),
    periodEnd: new Date(periodEndExclusive.getTime() - 1).toISOString(),
    categoryTotals: previousSnapshotData?.categoryTotals ?? getCategorySpending(periodTransactions),
    budgetUsageSummary:
      previousSnapshotData?.budgetUsageSummary ??
      getBudgetUsageSummaryForTransactions(budgets, periodTransactions).map((budget) => ({
        category: budget.category,
        monthlyLimit: budget.monthlyLimit,
        usedAmount: budget.usedAmount,
        usagePercentage: budget.usagePercentage,
      })),
    recentTransactions:
      previousSnapshotData?.recentTransactions ?? recentTransactions,
    adjustment: previousSnapshotData?.adjustment,
  };
}

type NewTransactionInput = {
  type: TransactionType;
  amount: number;
  category: TransactionCategory;
  subcategory?: string | null;
  date: string;
  note: string;
};

type BudgetInput = {
  category: TransactionCategory;
  monthlyLimit: number;
};

type SavingsGoalInput = {
  targetAmount: number;
  currentAmount: number;
};

type CategoryInput = {
  name: string;
};

type SubcategoryInput = {
  categoryName: string;
  name: string;
};

type TransactionsContextValue = {
  transactions: Transaction[];
  budgets: Budget[];
  savingsGoal: SavingsGoal | null;
  appSettings: AppSettings | null;
  monthlySnapshots: MonthlySnapshot[];
  categories: Category[];
  subcategories: Subcategory[];
  addTransaction: (input: NewTransactionInput) => Promise<boolean>;
  deleteTransaction: (id: string) => Promise<void>;
  saveBudget: (input: BudgetInput) => Promise<boolean>;
  deleteBudget: (id: string) => Promise<void>;
  saveSavingsGoal: (input: SavingsGoalInput) => Promise<boolean>;
  deleteSavingsGoal: () => Promise<void>;
  saveAppSettings: (input: AppSettingsInput) => Promise<boolean>;
  adjustMonthlySnapshot: (
    snapshotId: string,
    input: SnapshotAdjustmentInput
  ) => Promise<boolean>;
  addCategory: (input: CategoryInput) => Promise<string | null>;
  renameCategory: (categoryId: string, nextName: string) => Promise<boolean>;
  deleteCategory: (categoryId: string) => Promise<void>;
  addSubcategory: (input: SubcategoryInput) => Promise<string | null>;
  renameSubcategory: (
    subcategoryId: string,
    nextName: string
  ) => Promise<boolean>;
  deleteSubcategory: (subcategoryId: string) => Promise<void>;
  getSubcategoriesForCategory: (categoryName: string) => Subcategory[];
  getCategoryColor: (categoryName: string) => string;
  saveCategoryColor: (categoryId: string, color: string) => Promise<boolean>;
  chartPalette: ChartPalette;
  saveChartPalette: (palette: ChartPalette) => Promise<boolean>;
  isAddModalOpen: boolean;
  openAddModal: () => void;
  closeAddModal: () => void;
  isBudgetModalOpen: boolean;
  editingBudget: Budget | null;
  openBudgetModal: (budget?: Budget) => void;
  closeBudgetModal: () => void;
  isSavingsGoalModalOpen: boolean;
  openSavingsGoalModal: () => void;
  closeSavingsGoalModal: () => void;
  currencySymbol: "$" | "Rs";
  toggleCurrencySymbol: () => void;
  isTransactionsLoading: boolean;
  transactionsError: string;
  clearTransactionsError: () => void;
  hasLoadedTransactions: boolean;
  isBudgetsLoading: boolean;
  budgetsError: string;
  clearBudgetsError: () => void;
  hasLoadedBudgets: boolean;
  isSavingsGoalLoading: boolean;
  savingsGoalError: string;
  clearSavingsGoalError: () => void;
  hasLoadedSavingsGoal: boolean;
  isCategoriesLoading: boolean;
  categoriesError: string;
  clearCategoriesError: () => void;
  hasLoadedCategories: boolean;
  isPreferencesLoading: boolean;
  preferencesError: string;
  clearPreferencesError: () => void;
  isAppSettingsLoading: boolean;
  appSettingsError: string;
  clearAppSettingsError: () => void;
  hasLoadedAppSettings: boolean;
  isMonthlySnapshotsLoading: boolean;
  monthlySnapshotsError: string;
  clearMonthlySnapshotsError: () => void;
  hasLoadedMonthlySnapshots: boolean;
  isRolloverPending: boolean;
  rolloverError: string;
  clearRolloverError: () => void;
  resetUserData: () => Promise<boolean>;
  isResettingUserData: boolean;
};

const TransactionsContext = createContext<TransactionsContextValue | null>(null);

export function TransactionsProvider({
  children,
  userId,
}: {
  children: ReactNode;
  userId: string;
}) {
  const [supabase] = useState(() => createClient());
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>(initialBudgets);
  const [savingsGoal, setSavingsGoal] = useState<SavingsGoal | null>(null);
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  const [monthlySnapshots, setMonthlySnapshots] = useState<MonthlySnapshot[]>([]);
  const [categories, setCategories] = useState<Category[]>(
    userId ? createDefaultCategories(userId) : []
  );
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [isSavingsGoalModalOpen, setIsSavingsGoalModalOpen] = useState(false);
  const [isTransactionsLoading, setIsTransactionsLoading] = useState(true);
  const [hasLoadedTransactions, setHasLoadedTransactions] = useState(false);
  const [transactionsError, setTransactionsError] = useState("");
  const [isBudgetsLoading, setIsBudgetsLoading] = useState(true);
  const [hasLoadedBudgets, setHasLoadedBudgets] = useState(false);
  const [budgetsError, setBudgetsError] = useState("");
  const [isSavingsGoalLoading, setIsSavingsGoalLoading] = useState(true);
  const [hasLoadedSavingsGoal, setHasLoadedSavingsGoal] = useState(false);
  const [savingsGoalError, setSavingsGoalError] = useState("");
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);
  const [hasLoadedCategories, setHasLoadedCategories] = useState(false);
  const [categoriesError, setCategoriesError] = useState("");
  const [preferences, setPreferences] = useState<AppPreferences | null>(null);
  const [isPreferencesLoading, setIsPreferencesLoading] = useState(true);
  const [preferencesError, setPreferencesError] = useState("");
  const [isAppSettingsLoading, setIsAppSettingsLoading] = useState(true);
  const [hasLoadedAppSettings, setHasLoadedAppSettings] = useState(false);
  const [appSettingsError, setAppSettingsError] = useState("");
  const [isMonthlySnapshotsLoading, setIsMonthlySnapshotsLoading] = useState(true);
  const [hasLoadedMonthlySnapshots, setHasLoadedMonthlySnapshots] = useState(false);
  const [monthlySnapshotsError, setMonthlySnapshotsError] = useState("");
  const [isRolloverPending, setIsRolloverPending] = useState(false);
  const [rolloverError, setRolloverError] = useState("");
  const [isResettingUserData, setIsResettingUserData] = useState(false);
  const isHandlingRolloverRef = useRef(false);
  const lastRolloverAttemptKeyRef = useRef<string | null>(null);
  const [currencySymbol, setCurrencySymbol] = useState<"$" | "Rs">(() => {
    const storedCurrencySymbol = readStoredJSON<"$" | "Rs">(
      CURRENCY_STORAGE_KEY
    );

    return storedCurrencySymbol === "$" || storedCurrencySymbol === "Rs"
      ? storedCurrencySymbol
      : "$";
  });

  const refreshTransactions = useCallback(async () => {
    if (!userId) {
      setTransactions([]);
      return;
    }

    const loadedTransactions = await fetchTransactions(supabase, userId);
    setTransactions(loadedTransactions);
  }, [supabase, userId]);

  const refreshBudgets = useCallback(async () => {
    if (!userId) {
      setBudgets([]);
      return;
    }

    const loadedBudgets = await fetchBudgets(supabase, userId);
    setBudgets(loadedBudgets);
  }, [supabase, userId]);

  const refreshSavingsGoal = useCallback(async () => {
    if (!userId) {
      setSavingsGoal(null);
      return;
    }

    const loadedSavingsGoal = await fetchSavingsGoal(supabase, userId);
    setSavingsGoal(loadedSavingsGoal);
  }, [supabase, userId]);

  const refreshAppSettings = useCallback(async () => {
    if (!userId) {
      setAppSettings(null);
      return;
    }

    try {
      const loadedAppSettings = await ensureAppSettings(supabase, userId);
      setAppSettings(loadedAppSettings);
    } catch {
      setAppSettings(getDefaultAppSettings(userId));
    }
  }, [supabase, userId]);

  const refreshMonthlySnapshots = useCallback(async () => {
    if (!userId) {
      setMonthlySnapshots([]);
      return;
    }

    const loadedMonthlySnapshots = await fetchMonthlySnapshots(supabase, userId);
    setMonthlySnapshots(loadedMonthlySnapshots);
  }, [supabase, userId]);

  const refreshCategories = useCallback(async () => {
    if (!userId) {
      setCategories([]);
      setSubcategories([]);
      return;
    }

    let nextCategories = createDefaultCategories(userId);
    let nextSubcategories: Subcategory[] = [];
    let nextError = "";

    try {
      const loadedCategories = await fetchCategories(supabase, userId);
      nextCategories = mergeWithDefaultCategories(userId, loadedCategories);
    } catch (error) {
      nextError =
        error instanceof Error
          ? error.message
          : "Unable to load categories right now.";
    }

    try {
      nextSubcategories = await fetchSubcategories(supabase, userId);
    } catch (error) {
      nextError ||=
        error instanceof Error
          ? error.message
          : "Unable to load subcategories right now.";
    }

    setCategories(nextCategories);
    setSubcategories(nextSubcategories);
    setCategoriesError(nextError);
  }, [supabase, userId]);

  const refreshCategoriesDependencies = useCallback(async () => {
    if (!userId) {
      return;
    }

    await refreshCategories();
  }, [refreshCategories, userId]);

  const refreshPreferences = useCallback(async () => {
    if (!userId) {
      setPreferences(null);
      return;
    }

    const loadedPreferences = await fetchAppPreferences(supabase, userId);
    setPreferences(loadedPreferences);
  }, [supabase, userId]);

  useEffect(() => {
    let isActive = true;

    async function loadTransactions() {
      if (!userId) {
        if (isActive) {
          setTransactions([]);
          setIsTransactionsLoading(false);
          setHasLoadedTransactions(true);
        }
        return;
      }

      setIsTransactionsLoading(true);
      setTransactionsError("");

      try {
        const loadedTransactions = await fetchTransactions(supabase, userId);

        if (isActive) {
          setTransactions(loadedTransactions);
        }
      } catch (error) {
        if (isActive) {
          setTransactionsError(
            error instanceof Error
              ? error.message
              : "Unable to load transactions right now."
          );
        }
      } finally {
        if (isActive) {
          setIsTransactionsLoading(false);
          setHasLoadedTransactions(true);
        }
      }
    }

    void loadTransactions();

    return () => {
      isActive = false;
    };
  }, [supabase, userId]);

  useEffect(() => {
    let isActive = true;

    async function loadBudgets() {
      if (!userId) {
        if (isActive) {
          setBudgets([]);
          setIsBudgetsLoading(false);
          setHasLoadedBudgets(true);
        }
        return;
      }

      setIsBudgetsLoading(true);
      setBudgetsError("");

      try {
        const loadedBudgets = await fetchBudgets(supabase, userId);

        if (isActive) {
          setBudgets(loadedBudgets);
        }
      } catch (error) {
        if (isActive) {
          setBudgetsError(
            error instanceof Error
              ? error.message
              : "Unable to load budgets right now."
          );
        }
      } finally {
        if (isActive) {
          setIsBudgetsLoading(false);
          setHasLoadedBudgets(true);
        }
      }
    }

    void loadBudgets();

    return () => {
      isActive = false;
    };
  }, [supabase, userId]);

  useEffect(() => {
    let isActive = true;

    async function loadSavingsGoal() {
      if (!userId) {
        if (isActive) {
          setSavingsGoal(null);
          setIsSavingsGoalLoading(false);
          setHasLoadedSavingsGoal(true);
        }
        return;
      }

      setIsSavingsGoalLoading(true);
      setSavingsGoalError("");

      try {
        const loadedSavingsGoal = await fetchSavingsGoal(supabase, userId);

        if (isActive) {
          setSavingsGoal(loadedSavingsGoal);
        }
      } catch (error) {
        if (isActive) {
          setSavingsGoalError(
            error instanceof Error
              ? error.message
              : "Unable to load your savings goal right now."
          );
        }
      } finally {
        if (isActive) {
          setIsSavingsGoalLoading(false);
          setHasLoadedSavingsGoal(true);
        }
      }
    }

    void loadSavingsGoal();

    return () => {
      isActive = false;
    };
  }, [supabase, userId]);

  useEffect(() => {
    let isActive = true;

    async function loadCategories() {
      if (!userId) {
        if (isActive) {
          setCategories([]);
          setSubcategories([]);
          setIsCategoriesLoading(false);
          setHasLoadedCategories(true);
        }
        return;
      }

      setIsCategoriesLoading(true);
      setCategoriesError("");

      try {
        let nextCategories = createDefaultCategories(userId);
        let nextSubcategories: Subcategory[] = [];
        let nextError = "";

        try {
          const loadedCategories = await fetchCategories(supabase, userId);
          nextCategories = mergeWithDefaultCategories(userId, loadedCategories);
        } catch (error) {
          nextError =
            error instanceof Error
              ? error.message
              : "Unable to load categories right now.";
        }

        try {
          nextSubcategories = await fetchSubcategories(supabase, userId);
        } catch (error) {
          nextError ||=
            error instanceof Error
              ? error.message
              : "Unable to load subcategories right now.";
        }

        if (isActive) {
          setCategories(nextCategories);
          setSubcategories(nextSubcategories);
          setCategoriesError(nextError);
        }
      } catch (error) {
        if (isActive) {
          setCategoriesError(
            error instanceof Error
              ? error.message
              : "Unable to load categories right now."
          );
          setCategories(createDefaultCategories(userId));
          setSubcategories([]);
        }
      } finally {
        if (isActive) {
          setIsCategoriesLoading(false);
          setHasLoadedCategories(true);
        }
      }
    }

    void loadCategories();

    return () => {
      isActive = false;
    };
  }, [supabase, userId]);

  useEffect(() => {
    let isActive = true;

    async function loadPreferences() {
      if (!userId) {
        if (isActive) {
          setPreferences(null);
          setIsPreferencesLoading(false);
        }
        return;
      }

      setIsPreferencesLoading(true);
      setPreferencesError("");

      try {
        const loadedPreferences = await fetchAppPreferences(supabase, userId);

        if (isActive) {
          setPreferences(loadedPreferences);
        }
      } catch (error) {
        if (isActive) {
          setPreferencesError(
            error instanceof Error
              ? error.message
              : "Unable to load app preferences right now."
          );
        }
      } finally {
        if (isActive) {
          setIsPreferencesLoading(false);
        }
      }
    }

    void loadPreferences();

    return () => {
      isActive = false;
    };
  }, [supabase, userId]);

  useEffect(() => {
    let isActive = true;

    async function loadAppSettings() {
      if (!userId) {
        if (isActive) {
          setAppSettings(null);
          setIsAppSettingsLoading(false);
          setHasLoadedAppSettings(true);
        }
        return;
      }

      setIsAppSettingsLoading(true);
      setAppSettingsError("");

      try {
        const loadedAppSettings = await ensureAppSettings(supabase, userId);

        if (isActive) {
          setAppSettings(loadedAppSettings);
        }
      } catch (error) {
        if (isActive) {
          setAppSettings(getDefaultAppSettings(userId));
          setAppSettingsError("");
        }
      } finally {
        if (isActive) {
          setIsAppSettingsLoading(false);
          setHasLoadedAppSettings(true);
        }
      }
    }

    void loadAppSettings();

    return () => {
      isActive = false;
    };
  }, [supabase, userId]);

  useEffect(() => {
    let isActive = true;

    async function loadMonthlySnapshots() {
      if (!userId) {
        if (isActive) {
          setMonthlySnapshots([]);
          setIsMonthlySnapshotsLoading(false);
          setHasLoadedMonthlySnapshots(true);
        }
        return;
      }

      setIsMonthlySnapshotsLoading(true);
      setMonthlySnapshotsError("");

      try {
        const loadedMonthlySnapshots = await fetchMonthlySnapshots(supabase, userId);

        if (isActive) {
          setMonthlySnapshots(loadedMonthlySnapshots);
        }
      } catch (error) {
        if (isActive) {
          setMonthlySnapshotsError(
            error instanceof Error
              ? error.message
              : "Unable to load snapshot history right now."
          );
        }
      } finally {
        if (isActive) {
          setIsMonthlySnapshotsLoading(false);
          setHasLoadedMonthlySnapshots(true);
        }
      }
    }

    void loadMonthlySnapshots();

    return () => {
      isActive = false;
    };
  }, [supabase, userId]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    localStorage.setItem(
      CURRENCY_STORAGE_KEY,
      JSON.stringify(currencySymbol)
    );
  }, [currencySymbol]);

  const activePeriod = getActivePeriod(appSettings);
  const rolloverCycleKey = [
    userId,
    activePeriod.key,
    appSettings?.lastPeriodKey ?? "null",
    hasLoadedTransactions ? "tx-ready" : "tx-pending",
    hasLoadedBudgets ? "budgets-ready" : "budgets-pending",
    hasLoadedSavingsGoal ? "savings-ready" : "savings-pending",
    hasLoadedAppSettings ? "settings-ready" : "settings-pending",
    hasLoadedMonthlySnapshots ? "snapshots-ready" : "snapshots-pending",
  ].join("|");

  useEffect(() => {
    if (
      !userId ||
      isHandlingRolloverRef.current ||
      isTransactionsLoading ||
      isBudgetsLoading ||
      isSavingsGoalLoading ||
      isAppSettingsLoading ||
      isMonthlySnapshotsLoading
    ) {
      return;
    }

    if (
      !hasLoadedTransactions ||
      !hasLoadedBudgets ||
      !hasLoadedSavingsGoal ||
      !hasLoadedAppSettings ||
      !hasLoadedMonthlySnapshots
    ) {
      return;
    }

    if (lastRolloverAttemptKeyRef.current === rolloverCycleKey) {
      return;
    }

    async function ensureRollover() {
      isHandlingRolloverRef.current = true;
      lastRolloverAttemptKeyRef.current = rolloverCycleKey;
      setIsRolloverPending(true);
      setRolloverError("");

      try {
        if (activePeriod.mode === "never") {
          if (appSettings?.lastPeriodKey !== "never") {
            await upsertAppSettings(supabase, userId, {
              resetPeriodMode: appSettings?.resetPeriodMode ?? "never",
              customResetDay: appSettings?.customResetDay ?? null,
              customResetHour: appSettings?.customResetHour ?? null,
              customResetMinute: appSettings?.customResetMinute ?? null,
              lastPeriodKey: "never",
            });
            await refreshAppSettings();
          }

          return;
        }

        const currentSettingsPayload: Partial<AppSettingsPayload> = {
          resetPeriodMode: appSettings?.resetPeriodMode ?? "monthly",
          customResetDay: appSettings?.customResetDay ?? null,
          customResetHour: appSettings?.customResetHour ?? null,
          customResetMinute: appSettings?.customResetMinute ?? null,
        };

        if (!appSettings?.lastPeriodKey) {
          await upsertAppSettings(supabase, userId, {
            ...currentSettingsPayload,
            lastPeriodKey: activePeriod.key,
          });
          await refreshAppSettings();
          return;
        }

        if (appSettings.lastPeriodKey === activePeriod.key) {
          return;
        }

        let period = parsePeriodKey(appSettings.lastPeriodKey, appSettings);
        let previousSavingsTotal =
          monthlySnapshots.length > 0
            ? monthlySnapshots[monthlySnapshots.length - 1]?.savingsTotal ??
              savingsGoal?.currentAmount ??
              0
            : savingsGoal?.currentAmount ?? 0;

        while (period.start < activePeriod.start) {
          const existingSnapshot = monthlySnapshots.find(
            (snapshot) => snapshot.periodKey === period.key
          );

          if (!existingSnapshot) {
            const periodTransactions = getTransactionsInRange(
              transactions,
              period.start,
              period.endExclusive
            );
            const { income, expenses, remainingBalance } =
              getIncomeExpensesForTransactions(periodTransactions);
            const savingsTotal = previousSavingsTotal + remainingBalance;
            const payload: MonthlySnapshotPayload = {
              periodKey: period.key,
              incomeTotal: income,
              expenseTotal: expenses,
              netChange: remainingBalance,
              savingsTotal,
              targetSavings: savingsGoal?.targetAmount ?? 0,
              startingSavings: previousSavingsTotal,
              snapshotData: buildSnapshotData(
                period.label,
                period.start,
                period.endExclusive,
                periodTransactions,
                budgets
              ),
            };

            await upsertMonthlySnapshot(supabase, userId, payload);
            previousSavingsTotal = savingsTotal;
          } else {
            previousSavingsTotal = existingSnapshot.savingsTotal;
          }

          period = getNextPeriod(period, appSettings);
        }

        await upsertAppSettings(supabase, userId, {
          ...currentSettingsPayload,
          lastPeriodKey: activePeriod.key,
        });
        await Promise.all([refreshMonthlySnapshots(), refreshAppSettings()]);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Unable to finalize snapshot rollover right now.";
        setRolloverError(message);
      } finally {
        setIsRolloverPending(false);
        isHandlingRolloverRef.current = false;
      }
    }

    void ensureRollover();
  }, [
    activePeriod,
    appSettings,
    budgets,
    hasLoadedAppSettings,
    hasLoadedBudgets,
    hasLoadedMonthlySnapshots,
    hasLoadedSavingsGoal,
    hasLoadedTransactions,
    isAppSettingsLoading,
    isBudgetsLoading,
    isMonthlySnapshotsLoading,
    isSavingsGoalLoading,
    isTransactionsLoading,
    monthlySnapshots,
    refreshAppSettings,
    refreshMonthlySnapshots,
    savingsGoal,
    supabase,
    transactions,
    userId,
    rolloverCycleKey,
  ]);

  const chartPalette = preferences?.chartPalette ?? DEFAULT_CHART_PALETTE;
  const getCategoryColor = useCallback(
    (categoryName: string) =>
      categories.find((category) => category.name === categoryName)?.color ??
      getFallbackCategoryColor(categoryName),
    [categories]
  );

  const value = useMemo<TransactionsContextValue>(
    () => ({
      transactions,
      budgets,
      savingsGoal,
      appSettings,
      monthlySnapshots,
      categories,
      subcategories,
      addTransaction: async (input) => {
        if (!userId) {
          setTransactionsError("You must be logged in to add a transaction.");
          return false;
        }

        setTransactionsError("");

        try {
          await insertTransaction(supabase, {
            userId,
            type: input.type,
            amount: input.amount,
            category: input.category,
            subcategory: input.subcategory ?? null,
            date: input.date,
            note: input.note,
          });

          await refreshTransactions();
          setIsAddModalOpen(false);
          return true;
        } catch (error) {
          setTransactionsError(
            error instanceof Error
              ? error.message
              : "Unable to save this transaction right now."
          );
          return false;
        }
      },
      deleteTransaction: async (id) => {
        if (!userId) {
          setTransactionsError("You must be logged in to delete a transaction.");
          return;
        }

        setTransactionsError("");

        try {
          await removeTransaction(supabase, userId, id);
          await refreshTransactions();
        } catch (error) {
          setTransactionsError(
            error instanceof Error
              ? error.message
              : "Unable to delete this transaction right now."
          );
        }
      },
      saveBudget: async (input) => {
        if (!userId) {
          setBudgetsError("You must be logged in to manage budgets.");
          return false;
        }

        setBudgetsError("");

        try {
          if (editingBudget) {
            await updateBudget(supabase, userId, editingBudget.id, input);
          } else {
            await createBudget(supabase, userId, input);
          }

          await refreshBudgets();
          setIsBudgetModalOpen(false);
          setEditingBudget(null);
          return true;
        } catch (error) {
          setBudgetsError(
            error instanceof Error
              ? error.message
              : "Unable to save this budget right now."
          );
          return false;
        }
      },
      deleteBudget: async (id) => {
        if (!userId) {
          setBudgetsError("You must be logged in to manage budgets.");
          return;
        }

        setBudgetsError("");

        try {
          await removeBudget(supabase, userId, id);
          await refreshBudgets();
        } catch (error) {
          setBudgetsError(
            error instanceof Error
              ? error.message
              : "Unable to delete this budget right now."
          );
        }
      },
      saveSavingsGoal: async (input) => {
        if (!userId) {
          setSavingsGoalError("You must be logged in to manage savings goals.");
          return false;
        }

        setSavingsGoalError("");

        try {
          if (savingsGoal) {
            await updateSavingsGoal(supabase, userId, savingsGoal.id, input);
          } else {
            await createSavingsGoal(supabase, userId, input);
          }

          await refreshSavingsGoal();
          setIsSavingsGoalModalOpen(false);
          return true;
        } catch (error) {
          setSavingsGoalError(
            error instanceof Error
              ? error.message
              : "Unable to save your savings goal right now."
          );
          return false;
        }
      },
      deleteSavingsGoal: async () => {
        if (!userId || !savingsGoal) {
          setSavingsGoalError("No savings goal is available to reset.");
          return;
        }

        setSavingsGoalError("");

        try {
          await removeSavingsGoal(supabase, userId, savingsGoal.id);
          setSavingsGoal(null);
          setIsSavingsGoalModalOpen(false);
        } catch (error) {
          setSavingsGoalError(
            error instanceof Error
              ? error.message
              : "Unable to reset your savings goal right now."
          );
        }
      },
      saveAppSettings: async (input) => {
        if (!userId) {
          setAppSettingsError("You must be logged in to manage reset period settings.");
          return false;
        }

        setAppSettingsError("");
        setRolloverError("");
        lastRolloverAttemptKeyRef.current = null;

        try {
          await upsertAppSettings(supabase, userId, {
            resetPeriodMode: input.resetPeriodMode,
            customResetDay: input.customResetDay,
            customResetHour: input.customResetHour,
            customResetMinute: input.customResetMinute,
            lastPeriodKey: null,
          });
          await refreshAppSettings();
          return true;
        } catch (error) {
          setAppSettingsError(
            error instanceof Error
              ? error.message
              : "Unable to save reset period settings right now."
          );
          return false;
        }
      },
      adjustMonthlySnapshot: async (snapshotId, input) => {
        if (!userId) {
          setMonthlySnapshotsError("You must be logged in to adjust snapshot history.");
          return false;
        }

        const orderedSnapshots = [...monthlySnapshots].sort((left, right) =>
          left.periodKey.localeCompare(right.periodKey)
        );
        const snapshotIndex = orderedSnapshots.findIndex(
          (snapshot) => snapshot.id === snapshotId
        );

        if (snapshotIndex < 0) {
          setMonthlySnapshotsError("Snapshot not found.");
          return false;
        }

        setMonthlySnapshotsError("");

        try {
          let previousSavingsTotal =
            snapshotIndex > 0
              ? orderedSnapshots[snapshotIndex - 1]?.savingsTotal ?? 0
              : input.startingSavings;

          for (let index = snapshotIndex; index < orderedSnapshots.length; index += 1) {
            const snapshot = orderedSnapshots[index];
            const isAdjustedSnapshot = index === snapshotIndex;
            const startingSavings = isAdjustedSnapshot
              ? input.startingSavings
              : previousSavingsTotal;
            const incomeTotal = isAdjustedSnapshot
              ? input.incomeTotal
              : snapshot.incomeTotal;
            const expenseTotal = isAdjustedSnapshot
              ? input.expenseTotal
              : snapshot.expenseTotal;
            const targetSavings = isAdjustedSnapshot
              ? input.targetSavings
              : snapshot.targetSavings;
            const netChange = incomeTotal - expenseTotal;
            const savingsTotal = startingSavings + netChange;
            const nextSnapshotData: MonthlySnapshotData = {
              ...snapshot.snapshotData,
              adjustment: isAdjustedSnapshot
                ? {
                    adjustedAt: new Date().toISOString(),
                    note: "Top-line snapshot totals were adjusted manually. Detailed category and transaction breakdown remain from the original locked snapshot.",
                  }
                : snapshot.snapshotData.adjustment,
            };

            await updateMonthlySnapshot(supabase, userId, snapshot.id, {
              incomeTotal,
              expenseTotal,
              netChange,
              savingsTotal,
              targetSavings,
              startingSavings,
              snapshotData: nextSnapshotData,
            });

            previousSavingsTotal = savingsTotal;
          }

          await refreshMonthlySnapshots();
          return true;
        } catch (error) {
          setMonthlySnapshotsError(
            error instanceof Error
              ? error.message
              : "Unable to adjust snapshot history right now."
          );
          return false;
        }
      },
      addCategory: async ({ name }) => {
        if (!userId) {
          setCategoriesError("You must be logged in to manage categories.");
          return null;
        }

        const trimmedName = name.trim();

        if (!trimmedName) {
          setCategoriesError("Category name is required.");
          return null;
        }

        if (
          categories.some(
            (category) => category.name.toLowerCase() === trimmedName.toLowerCase()
          )
        ) {
          return categories.find(
            (category) => category.name.toLowerCase() === trimmedName.toLowerCase()
          )?.name ?? trimmedName;
        }

        setCategoriesError("");

        try {
          await createCategory(supabase, userId, trimmedName, pickCategoryColor(trimmedName));
          await refreshCategories();
          return trimmedName;
        } catch (error) {
          setCategoriesError(
            error instanceof Error
              ? error.message
              : "Unable to create this category right now."
          );
          return null;
        }
      },
      renameCategory: async (categoryId, nextName) => {
        if (!userId) {
          setCategoriesError("You must be logged in to manage categories.");
          return false;
        }

        const category = categories.find((item) => item.id === categoryId);
        const trimmedName = nextName.trim();

        if (!category || !trimmedName) {
          setCategoriesError("A valid category name is required.");
          return false;
        }

        if (category.isFallback) {
          setCategoriesError(
            "Default categories stay available automatically and cannot be renamed."
          );
          return false;
        }

        setCategoriesError("");

        try {
          await renameCategory(
            supabase,
            userId,
            categoryId,
            category.name,
            trimmedName
          );
          await Promise.all([
            refreshCategoriesDependencies(),
            refreshTransactions(),
            refreshBudgets(),
          ]);
          return true;
        } catch (error) {
          setCategoriesError(
            error instanceof Error
              ? error.message
              : "Unable to rename this category right now."
          );
          return false;
        }
      },
      deleteCategory: async (categoryId) => {
        if (!userId) {
          setCategoriesError("You must be logged in to manage categories.");
          return;
        }

        const category = categories.find((item) => item.id === categoryId);

        if (!category) {
          return;
        }

        if (category.isFallback) {
          setCategoriesError(
            "Default categories stay available automatically and cannot be deleted."
          );
          return;
        }

        const isUsedByTransactions = transactions.some(
          (transaction) => transaction.category === category.name
        );
        const isUsedByBudgets = budgets.some(
          (budget) => budget.category === category.name
        );
        const hasSubcategories = subcategories.some(
          (subcategory) => subcategory.categoryName === category.name
        );

        if (isUsedByTransactions || isUsedByBudgets || hasSubcategories) {
          setCategoriesError(
            "This category is in use. Remove related budgets, transactions, or subcategories before deleting it."
          );
          return;
        }

        setCategoriesError("");

        try {
          await deleteCategory(supabase, userId, categoryId);
          await refreshCategories();
        } catch (error) {
          setCategoriesError(
            error instanceof Error
              ? error.message
              : "Unable to delete this category right now."
          );
        }
      },
      addSubcategory: async ({ categoryName, name }) => {
        if (!userId) {
          setCategoriesError("You must be logged in to manage subcategories.");
          return null;
        }

        const trimmedName = name.trim();

        if (!trimmedName || !categoryName.trim()) {
          setCategoriesError("Category and subcategory names are required.");
          return null;
        }

        if (
          subcategories.some(
            (subcategory) =>
              subcategory.categoryName === categoryName &&
              subcategory.name.toLowerCase() === trimmedName.toLowerCase()
          )
        ) {
          return (
            subcategories.find(
              (subcategory) =>
                subcategory.categoryName === categoryName &&
                subcategory.name.toLowerCase() === trimmedName.toLowerCase()
            )?.name ?? trimmedName
          );
        }

        setCategoriesError("");

        try {
          await createSubcategory(supabase, userId, categoryName, trimmedName);
          await refreshCategories();
          return trimmedName;
        } catch (error) {
          setCategoriesError(
            error instanceof Error
              ? error.message
              : "Unable to create this subcategory right now."
          );
          return null;
        }
      },
      renameSubcategory: async (subcategoryId, nextName) => {
        if (!userId) {
          setCategoriesError("You must be logged in to manage subcategories.");
          return false;
        }

        const subcategory = subcategories.find((item) => item.id === subcategoryId);
        const trimmedName = nextName.trim();

        if (!subcategory || !trimmedName) {
          setCategoriesError("A valid subcategory name is required.");
          return false;
        }

        setCategoriesError("");

        try {
          await renameSubcategory(
            supabase,
            userId,
            subcategoryId,
            subcategory.categoryName,
            subcategory.name,
            trimmedName
          );
          await Promise.all([refreshCategoriesDependencies(), refreshTransactions()]);
          return true;
        } catch (error) {
          setCategoriesError(
            error instanceof Error
              ? error.message
              : "Unable to rename this subcategory right now."
          );
          return false;
        }
      },
      deleteSubcategory: async (subcategoryId) => {
        if (!userId) {
          setCategoriesError("You must be logged in to manage subcategories.");
          return;
        }

        const subcategory = subcategories.find((item) => item.id === subcategoryId);

        if (!subcategory) {
          return;
        }

        const isUsed = transactions.some(
          (transaction) =>
            transaction.category === subcategory.categoryName &&
            transaction.subcategory === subcategory.name
        );

        if (isUsed) {
          setCategoriesError(
            "This subcategory is in use by transactions. Remove or reassign those transactions before deleting it."
          );
          return;
        }

        setCategoriesError("");

        try {
          await deleteSubcategory(supabase, userId, subcategoryId);
          await refreshCategories();
        } catch (error) {
          setCategoriesError(
            error instanceof Error
              ? error.message
              : "Unable to delete this subcategory right now."
          );
        }
      },
      getSubcategoriesForCategory: (categoryName) =>
        subcategories.filter(
          (subcategory) => subcategory.categoryName === categoryName
        ),
      getCategoryColor,
      saveCategoryColor: async (categoryId, color) => {
        if (!userId) {
          setPreferencesError("You must be logged in to manage category colors.");
          return false;
        }

        const category = categories.find((item) => item.id === categoryId);

        if (!category) {
          setPreferencesError("Unable to find this category.");
          return false;
        }

        setPreferencesError("");

        try {
          if (category.isFallback) {
            await createCategory(supabase, userId, category.name, color);
          } else {
            await updateCategoryColor(supabase, userId, categoryId, color);
          }

          await refreshCategories();
          return true;
        } catch (error) {
          setPreferencesError(
            error instanceof Error
              ? error.message
              : "Unable to save this category color right now."
          );
          return false;
        }
      },
      chartPalette,
      saveChartPalette: async (palette) => {
        if (!userId) {
          setPreferencesError("You must be logged in to manage chart colors.");
          return false;
        }

        setPreferencesError("");

        try {
          await upsertChartPalette(supabase, userId, palette);
          await refreshPreferences();
          return true;
        } catch (error) {
          setPreferencesError(
            error instanceof Error
              ? error.message
              : "Unable to save chart preferences right now."
          );
          return false;
        }
      },
      isAddModalOpen,
      openAddModal: () => {
        setTransactionsError("");
        setIsAddModalOpen(true);
      },
      closeAddModal: () => setIsAddModalOpen(false),
      isBudgetModalOpen,
      editingBudget,
      openBudgetModal: (budget) => {
        setEditingBudget(budget ?? null);
        setBudgetsError("");
        setIsBudgetModalOpen(true);
      },
      closeBudgetModal: () => {
        setEditingBudget(null);
        setIsBudgetModalOpen(false);
      },
      isSavingsGoalModalOpen,
      openSavingsGoalModal: () => {
        setSavingsGoalError("");
        setIsSavingsGoalModalOpen(true);
      },
      closeSavingsGoalModal: () => setIsSavingsGoalModalOpen(false),
      currencySymbol,
      toggleCurrencySymbol: () =>
        setCurrencySymbol((current) => (current === "$" ? "Rs" : "$")),
      isTransactionsLoading,
      transactionsError,
      clearTransactionsError: () => setTransactionsError(""),
      hasLoadedTransactions,
      isBudgetsLoading,
      budgetsError,
      clearBudgetsError: () => setBudgetsError(""),
      hasLoadedBudgets,
      isSavingsGoalLoading,
      savingsGoalError,
      clearSavingsGoalError: () => setSavingsGoalError(""),
      hasLoadedSavingsGoal,
      isCategoriesLoading,
      categoriesError,
      clearCategoriesError: () => setCategoriesError(""),
      hasLoadedCategories,
      isPreferencesLoading,
      preferencesError,
      clearPreferencesError: () => setPreferencesError(""),
      isAppSettingsLoading,
      appSettingsError,
      clearAppSettingsError: () => setAppSettingsError(""),
      hasLoadedAppSettings,
      isMonthlySnapshotsLoading,
      monthlySnapshotsError,
      clearMonthlySnapshotsError: () => setMonthlySnapshotsError(""),
      hasLoadedMonthlySnapshots,
      isRolloverPending,
      rolloverError,
      clearRolloverError: () => setRolloverError(""),
      resetUserData: async () => {
        if (!userId) {
          setPreferencesError("You must be logged in to reset data.");
          return false;
        }

        setPreferencesError("");
        setIsResettingUserData(true);

        try {
          await resetUserDataRows(supabase, userId);
          setTransactions([]);
          setBudgets([]);
          setSavingsGoal(null);
          setAppSettings(null);
          setMonthlySnapshots([]);
          setSubcategories([]);
          setPreferences(null);
          setCategories(createDefaultCategories(userId));
          setIsAddModalOpen(false);
          setIsBudgetModalOpen(false);
          setEditingBudget(null);
          setIsSavingsGoalModalOpen(false);
          setTransactionsError("");
          setBudgetsError("");
          setSavingsGoalError("");
          setAppSettingsError("");
          setMonthlySnapshotsError("");
          setRolloverError("");
          lastRolloverAttemptKeyRef.current = null;
          setCategoriesError("");
          return true;
        } catch (error) {
          setPreferencesError(
            error instanceof Error
              ? error.message
              : "Unable to reset your data right now."
          );
          return false;
        } finally {
          setIsResettingUserData(false);
        }
      },
      isResettingUserData,
    }),
    [
      appSettings,
      appSettingsError,
      budgets,
      budgetsError,
      categories,
      categoriesError,
      chartPalette,
      currencySymbol,
      editingBudget,
      getCategoryColor,
      hasLoadedAppSettings,
      hasLoadedBudgets,
      hasLoadedCategories,
      hasLoadedMonthlySnapshots,
      hasLoadedSavingsGoal,
      hasLoadedTransactions,
      isAddModalOpen,
      isAppSettingsLoading,
      isBudgetModalOpen,
      isBudgetsLoading,
      isCategoriesLoading,
      isMonthlySnapshotsLoading,
      isPreferencesLoading,
      isRolloverPending,
      isResettingUserData,
      isSavingsGoalLoading,
      isSavingsGoalModalOpen,
      isTransactionsLoading,
      monthlySnapshots,
      monthlySnapshotsError,
      preferencesError,
      rolloverError,
      refreshAppSettings,
      refreshBudgets,
      refreshCategories,
      refreshCategoriesDependencies,
      refreshMonthlySnapshots,
      refreshPreferences,
      refreshSavingsGoal,
      refreshTransactions,
      savingsGoal,
      savingsGoalError,
      subcategories,
      supabase,
      transactions,
      transactionsError,
      userId,
    ]
  );

  return (
    <TransactionsContext.Provider value={value}>
      {children}
    </TransactionsContext.Provider>
  );
}

export function useTransactions() {
  const context = useContext(TransactionsContext);

  if (!context) {
    throw new Error("useTransactions must be used within TransactionsProvider");
  }

  return context;
}
