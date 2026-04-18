import type { SupabaseClient } from "@supabase/supabase-js";
import type { Budget, TransactionCategory } from "./transactions";

type BudgetRow = {
  id: string;
  user_id: string;
  category: TransactionCategory;
  monthly_limit: number;
  created_at: string;
};

export type BudgetPayload = {
  category: TransactionCategory;
  monthlyLimit: number;
};

function mapBudgetRow(row: BudgetRow): Budget {
  return {
    id: row.id,
    userId: row.user_id,
    category: row.category,
    monthlyLimit: Number(row.monthly_limit),
    createdAt: row.created_at,
  };
}

export async function fetchBudgets(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("budgets")
    .select("id, user_id, category, monthly_limit, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => mapBudgetRow(row as BudgetRow));
}

export async function createBudget(
  supabase: SupabaseClient,
  userId: string,
  payload: BudgetPayload
) {
  const { error } = await supabase.from("budgets").insert({
    user_id: userId,
    category: payload.category,
    monthly_limit: payload.monthlyLimit,
  });

  if (error) {
    throw error;
  }
}

export async function updateBudget(
  supabase: SupabaseClient,
  userId: string,
  budgetId: string,
  payload: BudgetPayload
) {
  const { error } = await supabase
    .from("budgets")
    .update({
      category: payload.category,
      monthly_limit: payload.monthlyLimit,
    })
    .eq("id", budgetId)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }
}

export async function removeBudget(
  supabase: SupabaseClient,
  userId: string,
  budgetId: string
) {
  const { error } = await supabase
    .from("budgets")
    .delete()
    .eq("id", budgetId)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }
}
