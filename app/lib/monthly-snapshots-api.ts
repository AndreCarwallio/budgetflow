import type { SupabaseClient } from "@supabase/supabase-js";
import type { MonthlySnapshot, MonthlySnapshotData } from "./transactions";

type MonthlySnapshotRow = {
  id: string;
  user_id: string;
  period_key: string;
  income_total: number | string;
  expense_total: number | string;
  net_change: number | string;
  savings_total: number | string;
  target_savings: number | string;
  starting_savings: number | string;
  snapshot_data: MonthlySnapshotData | null;
  created_at: string;
  updated_at: string;
};

export type MonthlySnapshotPayload = {
  periodKey: string;
  incomeTotal: number;
  expenseTotal: number;
  netChange: number;
  savingsTotal: number;
  targetSavings: number;
  startingSavings: number;
  snapshotData: MonthlySnapshotData;
};

function mapMonthlySnapshot(row: MonthlySnapshotRow): MonthlySnapshot {
  return {
    id: row.id,
    userId: row.user_id,
    periodKey: row.period_key,
    incomeTotal: Number(row.income_total),
    expenseTotal: Number(row.expense_total),
    netChange: Number(row.net_change),
    savingsTotal: Number(row.savings_total),
    targetSavings: Number(row.target_savings),
    startingSavings: Number(row.starting_savings),
    snapshotData: row.snapshot_data ?? {
      periodLabel: row.period_key,
      periodStart: "",
      periodEnd: "",
      categoryTotals: {},
      budgetUsageSummary: [],
      recentTransactions: [],
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function fetchMonthlySnapshots(
  supabase: SupabaseClient,
  userId: string
) {
  const { data, error } = await supabase
    .from("monthly_snapshots")
    .select(
      "id, user_id, period_key, income_total, expense_total, net_change, savings_total, target_savings, starting_savings, snapshot_data, created_at, updated_at"
    )
    .eq("user_id", userId)
    .order("period_key", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => mapMonthlySnapshot(row as MonthlySnapshotRow));
}

export async function upsertMonthlySnapshot(
  supabase: SupabaseClient,
  userId: string,
  payload: MonthlySnapshotPayload
) {
  const { error } = await supabase.from("monthly_snapshots").upsert(
    {
      user_id: userId,
      period_key: payload.periodKey,
      income_total: payload.incomeTotal,
      expense_total: payload.expenseTotal,
      net_change: payload.netChange,
      savings_total: payload.savingsTotal,
      target_savings: payload.targetSavings,
      starting_savings: payload.startingSavings,
      snapshot_data: payload.snapshotData,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "user_id,period_key",
    }
  );

  if (error) {
    throw error;
  }
}

export async function updateMonthlySnapshot(
  supabase: SupabaseClient,
  userId: string,
  snapshotId: string,
  payload: Omit<MonthlySnapshotPayload, "periodKey">
) {
  const { error } = await supabase
    .from("monthly_snapshots")
    .update({
      income_total: payload.incomeTotal,
      expense_total: payload.expenseTotal,
      net_change: payload.netChange,
      savings_total: payload.savingsTotal,
      target_savings: payload.targetSavings,
      starting_savings: payload.startingSavings,
      snapshot_data: payload.snapshotData,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("id", snapshotId);

  if (error) {
    throw error;
  }
}
