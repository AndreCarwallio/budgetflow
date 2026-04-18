import type { SupabaseClient } from "@supabase/supabase-js";
import type { ChartPalette } from "./transactions";

type AppPreferencesRow = {
  id: string;
  user_id: string;
  chart_palette: ChartPalette;
  created_at: string;
  updated_at: string;
};

export type AppPreferences = {
  id: string;
  userId: string;
  chartPalette: ChartPalette;
  createdAt: string;
  updatedAt: string;
};

function mapPreferences(row: AppPreferencesRow): AppPreferences {
  return {
    id: row.id,
    userId: row.user_id,
    chartPalette: row.chart_palette,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function fetchAppPreferences(
  supabase: SupabaseClient,
  userId: string
) {
  const { data, error } = await supabase
    .from("app_preferences")
    .select("id, user_id, chart_palette, created_at, updated_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapPreferences(data as AppPreferencesRow) : null;
}

export async function upsertChartPalette(
  supabase: SupabaseClient,
  userId: string,
  chartPalette: ChartPalette
) {
  const { error } = await supabase.from("app_preferences").upsert(
    {
      user_id: userId,
      chart_palette: chartPalette,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "user_id",
    }
  );

  if (error) {
    throw error;
  }
}
