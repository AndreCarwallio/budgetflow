import type { Budget, SavingsGoal, Transaction } from "./transactions";

type SpendingPoint = {
  label: string;
  amount: number;
};

function toDate(date: string) {
  return new Date(`${date}T00:00:00`);
}

function isSameMonth(date: string, referenceDate = new Date()) {
  const parsedDate = toDate(date);

  return (
    parsedDate.getFullYear() === referenceDate.getFullYear() &&
    parsedDate.getMonth() === referenceDate.getMonth()
  );
}

function getStartOfWeek(referenceDate = new Date()) {
  const start = new Date(referenceDate);
  start.setHours(0, 0, 0, 0);
  start.setDate(referenceDate.getDate() - referenceDate.getDay());
  return start;
}

function getEndOfWeek(referenceDate = new Date()) {
  const end = getStartOfWeek(referenceDate);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

export function getCurrentMonthTransactions(
  transactions: Transaction[],
  referenceDate = new Date()
) {
  return transactions.filter((transaction) =>
    isSameMonth(transaction.date, referenceDate)
  );
}

export function getMonthlyIncomeExpenses(
  transactions: Transaction[],
  referenceDate = new Date()
) {
  const monthlyTransactions = getCurrentMonthTransactions(
    transactions,
    referenceDate
  );

  const income = monthlyTransactions
    .filter((transaction) => transaction.type === "income")
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const expenses = monthlyTransactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  return {
    monthlyTransactions,
    income,
    expenses,
    remainingBalance: income - expenses,
  };
}

export function getCurrentMonthCategorySpending(
  transactions: Transaction[],
  referenceDate = new Date()
) {
  return getCurrentMonthTransactions(transactions, referenceDate)
    .filter((transaction) => transaction.type === "expense")
    .reduce<Record<string, number>>((accumulator, transaction) => {
      accumulator[transaction.category] =
        (accumulator[transaction.category] ?? 0) + transaction.amount;
      return accumulator;
    }, {});
}

export function getBudgetUsageSummary(
  budgets: Budget[],
  transactions: Transaction[],
  referenceDate = new Date()
) {
  const categorySpending = getCurrentMonthCategorySpending(
    transactions,
    referenceDate
  );

  return budgets.map((budget) => {
    const usedAmount = categorySpending[budget.category] ?? 0;
    const usagePercentage =
      budget.monthlyLimit > 0 ? (usedAmount / budget.monthlyLimit) * 100 : 0;

    return {
      ...budget,
      usedAmount,
      usagePercentage,
    };
  });
}

export function getWeeklySpendingPoints(
  transactions: Transaction[],
  referenceDate = new Date()
): SpendingPoint[] {
  const start = getStartOfWeek(referenceDate);
  const end = getEndOfWeek(referenceDate);
  const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return labels.map((label, dayIndex) => {
    const day = new Date(start);
    day.setDate(start.getDate() + dayIndex);

    const amount = transactions
      .filter((transaction) => transaction.type === "expense")
      .filter((transaction) => {
        const transactionDate = toDate(transaction.date);
        return transactionDate >= start && transactionDate <= end && transactionDate.getDay() === day.getDay();
      })
      .reduce((sum, transaction) => sum + transaction.amount, 0);

    return { label, amount };
  });
}

export function getMonthlySpendingPoints(
  transactions: Transaction[],
  referenceDate = new Date()
): SpendingPoint[] {
  const points = [
    { label: "W1", amount: 0 },
    { label: "W2", amount: 0 },
    { label: "W3", amount: 0 },
    { label: "W4", amount: 0 },
    { label: "W5", amount: 0 },
  ];

  getCurrentMonthTransactions(transactions, referenceDate)
    .filter((transaction) => transaction.type === "expense")
    .forEach((transaction) => {
      const date = toDate(transaction.date);
      const weekIndex = Math.min(Math.floor((date.getDate() - 1) / 7), 4);
      points[weekIndex].amount += transaction.amount;
    });

  return points;
}

export function getTotalSavingsValue(
  savingsGoal: SavingsGoal | null,
  monthlyRemainingBalance: number
) {
  const baseSavingsAmount = savingsGoal?.currentAmount ?? 0;
  const totalSavings = baseSavingsAmount + monthlyRemainingBalance;

  return {
    baseSavingsAmount,
    totalSavings,
    remainingToGoal: Math.max((savingsGoal?.targetAmount ?? 0) - totalSavings, 0),
  };
}
