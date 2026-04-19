import type { Budget, SavingsGoal, Transaction } from "./transactions";

type SpendingPoint = {
  label: string;
  amount: number;
};

export function toDate(date: string) {
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

export function getTransactionsInRange(
  transactions: Transaction[],
  startDate: Date,
  endExclusive: Date
) {
  return transactions.filter((transaction) => {
    const transactionDate = toDate(transaction.date);

    return transactionDate >= startDate && transactionDate < endExclusive;
  });
}

export function getIncomeExpensesForTransactions(transactions: Transaction[]) {
  const income = transactions
    .filter((transaction) => transaction.type === "income")
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const expenses = transactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  return {
    income,
    expenses,
    remainingBalance: income - expenses,
  };
}

export function getMonthlyIncomeExpenses(
  transactions: Transaction[],
  referenceDate = new Date()
) {
  const monthlyTransactions = getCurrentMonthTransactions(
    transactions,
    referenceDate
  );
  const { income, expenses, remainingBalance } =
    getIncomeExpensesForTransactions(monthlyTransactions);

  return {
    monthlyTransactions,
    income,
    expenses,
    remainingBalance,
  };
}

export function getCategorySpending(transactions: Transaction[]) {
  return transactions
    .filter((transaction) => transaction.type === "expense")
    .reduce<Record<string, number>>((accumulator, transaction) => {
      accumulator[transaction.category] =
        (accumulator[transaction.category] ?? 0) + transaction.amount;
      return accumulator;
    }, {});
}

export function getCurrentMonthCategorySpending(
  transactions: Transaction[],
  referenceDate = new Date()
) {
  return getCategorySpending(
    getCurrentMonthTransactions(transactions, referenceDate)
  );
}

export function getBudgetUsageSummaryForTransactions(
  budgets: Budget[],
  transactions: Transaction[]
) {
  const categorySpending = getCategorySpending(transactions);

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

export function getBudgetUsageSummary(
  budgets: Budget[],
  transactions: Transaction[],
  referenceDate = new Date()
) {
  return getBudgetUsageSummaryForTransactions(
    budgets,
    getCurrentMonthTransactions(transactions, referenceDate)
  );
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
  const formatter = new Intl.DateTimeFormat("en-US", { month: "short" });
  const points = Array.from({ length: 5 }, (_, index) => {
    const monthDate = new Date(
      referenceDate.getFullYear(),
      referenceDate.getMonth() - (4 - index),
      1
    );

    return {
      label: formatter.format(monthDate),
      amount: 0,
      year: monthDate.getFullYear(),
      month: monthDate.getMonth(),
    };
  });

  transactions
    .filter((transaction) => transaction.type === "expense")
    .forEach((transaction) => {
      const date = toDate(transaction.date);
      const point = points.find(
        (entry) =>
          entry.year === date.getFullYear() && entry.month === date.getMonth()
      );

      if (point) {
        point.amount += transaction.amount;
      }
    });

  return points.map(({ label, amount }) => ({ label, amount }));
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
