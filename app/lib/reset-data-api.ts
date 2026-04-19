import type { SupabaseClient } from "@supabase/supabase-js";

export async function resetUserData(
  supabase: SupabaseClient,
  userId: string
) {
  const tableDeletes = [
    supabase.from("transactions").delete().eq("user_id", userId),
    supabase.from("budgets").delete().eq("user_id", userId),
    supabase.from("subcategories").delete().eq("user_id", userId),
    supabase.from("categories").delete().eq("user_id", userId),
    supabase.from("app_preferences").delete().eq("user_id", userId),
    supabase.from("app_settings").delete().eq("user_id", userId),
    supabase.from("currency_presets").delete().eq("user_id", userId),
    supabase.from("monthly_snapshots").delete().eq("user_id", userId),
  ];

  const [
    transactionsResult,
    budgetsResult,
    subcategoriesResult,
    categoriesResult,
    preferencesResult,
    appSettingsResult,
    currencyPresetsResult,
    monthlySnapshotsResult,
  ] =
    await Promise.all(tableDeletes);

  const errors = [
    transactionsResult.error,
    budgetsResult.error,
    subcategoriesResult.error,
    categoriesResult.error,
    preferencesResult.error,
    appSettingsResult.error,
    currencyPresetsResult.error,
    monthlySnapshotsResult.error,
  ].filter(Boolean);

  if (errors.length > 0) {
    throw errors[0];
  }

  const { error: savingsGoalError } = await supabase
    .from("savings_goals")
    .delete()
    .eq("user_id", userId);

  if (savingsGoalError) {
    throw savingsGoalError;
  }
}
