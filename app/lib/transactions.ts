export type TransactionType = "income" | "expense";

export type TransactionCategory = string;

export type Category = {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
  color?: string | null;
  isFallback?: boolean;
};

export type Subcategory = {
  id: string;
  userId: string;
  categoryName: string;
  name: string;
  createdAt: string;
};

export type Transaction = {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  category: TransactionCategory;
  subcategory: string | null;
  date: string;
  note: string;
  createdAt: string;
};

export type Budget = {
  id: string;
  userId: string;
  category: TransactionCategory;
  monthlyLimit: number;
  createdAt: string;
};

export type SavingsGoal = {
  id: string;
  userId: string;
  targetAmount: number;
  currentAmount: number;
  createdAt: string;
};

export type ResetPeriodMode = "monthly" | "custom" | "never";

export type AppSettings = {
  id: string;
  userId: string;
  resetPeriodMode: ResetPeriodMode;
  customResetDay: number | null;
  customResetHour: number | null;
  customResetMinute: number | null;
  lastPeriodKey: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SnapshotBudgetUsage = {
  category: string;
  monthlyLimit: number;
  usedAmount: number;
  usagePercentage: number;
};

export type SnapshotTransactionSummary = {
  id: string;
  type: TransactionType;
  amount: number;
  category: TransactionCategory;
  subcategory: string | null;
  date: string;
  note: string;
};

export type SnapshotAdjustment = {
  adjustedAt: string;
  note: string;
};

export type MonthlySnapshotData = {
  periodLabel: string;
  periodStart: string;
  periodEnd: string;
  categoryTotals: Record<string, number>;
  budgetUsageSummary: SnapshotBudgetUsage[];
  recentTransactions: SnapshotTransactionSummary[];
  adjustment?: SnapshotAdjustment;
};

export type MonthlySnapshot = {
  id: string;
  userId: string;
  periodKey: string;
  incomeTotal: number;
  expenseTotal: number;
  netChange: number;
  savingsTotal: number;
  targetSavings: number;
  startingSavings: number;
  snapshotData: MonthlySnapshotData;
  createdAt: string;
  updatedAt: string;
};

export type CurrencyPreset = {
  id: string;
  userId: string;
  currencyCode: string;
  currencyLabel: string;
  currencySymbol: string;
  exchangeRate: number;
  autoFillEnabled: boolean;
  lastFetchedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ChartPalette = "ocean" | "sunset" | "forest" | "mono";

export type ChartPaletteConfig = {
  id: ChartPalette;
  label: string;
  description: string;
  colors: [string, string];
};

export const categoryColorOptions = [
  "#0f766e",
  "#1d4ed8",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#14b8a6",
  "#84cc16",
  "#0f172a",
  "#ec4899",
  "#f97316",
] as const;

export const defaultCategoryColors: Record<string, string> = {
  Food: "#0f766e",
  Rent: "#0f172a",
  Shopping: "#ec4899",
  Bills: "#2563eb",
  Entertainment: "#8b5cf6",
  Transport: "#f59e0b",
  Other: "#94a3b8",
};

export const chartPalettes: ChartPaletteConfig[] = [
  {
    id: "ocean",
    label: "Ocean",
    description: "Teal and blue dashboard accents",
    colors: ["#0f766e", "#38bdf8"],
  },
  {
    id: "sunset",
    label: "Sunset",
    description: "Warm orange and rose chart tones",
    colors: ["#f97316", "#fb7185"],
  },
  {
    id: "forest",
    label: "Forest",
    description: "Green-forward palette for calmer charts",
    colors: ["#166534", "#84cc16"],
  },
  {
    id: "mono",
    label: "Slate",
    description: "Neutral monochrome graph treatment",
    colors: ["#334155", "#94a3b8"],
  },
];

export const defaultTransactionCategories: TransactionCategory[] = [
  "Food",
  "Rent",
  "Shopping",
  "Bills",
  "Entertainment",
  "Transport",
  "Other",
];

export const initialBudgets: Budget[] = [];
