import type { SupabaseClient } from "@supabase/supabase-js";
import type { SavingsGoal } from "./transactions";

type SavingsGoalRow = {
  id: string;
  user_id: string;
  target_amount: number;
  current_amount: number;
  created_at: string;
};

export type SavingsGoalPayload = {
  targetAmount: number;
  currentAmount: number;
};

function mapSavingsGoalRow(row: SavingsGoalRow): SavingsGoal {
  return {
    id: row.id,
    userId: row.user_id,
    targetAmount: Number(row.target_amount),
    currentAmount: Number(row.current_amount),
    createdAt: row.created_at,
  };
}

export async function fetchSavingsGoal(
  supabase: SupabaseClient,
  userId: string
) {
  const { data, error } = await supabase
    .from("savings_goals")
    .select("id, user_id, target_amount, current_amount, created_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapSavingsGoalRow(data as SavingsGoalRow) : null;
}

export async function createSavingsGoal(
  supabase: SupabaseClient,
  userId: string,
  payload: SavingsGoalPayload
) {
  const { error } = await supabase.from("savings_goals").insert({
    user_id: userId,
    target_amount: payload.targetAmount,
    current_amount: payload.currentAmount,
  });

  if (error) {
    throw error;
  }
}

export async function updateSavingsGoal(
  supabase: SupabaseClient,
  userId: string,
  goalId: string,
  payload: SavingsGoalPayload
) {
  const { error } = await supabase
    .from("savings_goals")
    .update({
      target_amount: payload.targetAmount,
      current_amount: payload.currentAmount,
    })
    .eq("id", goalId)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }
}

export async function removeSavingsGoal(
  supabase: SupabaseClient,
  userId: string,
  goalId: string
) {
  const { error } = await supabase
    .from("savings_goals")
    .delete()
    .eq("id", goalId)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }
}
