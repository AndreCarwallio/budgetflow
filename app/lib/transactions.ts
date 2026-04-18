export type TransactionType = "income" | "expense";

export type TransactionCategory = string;

export type Category = {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
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
