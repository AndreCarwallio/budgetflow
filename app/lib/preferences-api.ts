import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_CURRENCY_CODE } from "./currency";
import type { ChartPalette } from "./transactions";

type AppPreferencesRow = {
  id: string;
  user_id: string;
  chart_palette: ChartPalette;
  base_currency_code?: string | null;
  display_currency_code?: string | null;
  created_at: string;
  updated_at: string;
};

export type AppPreferences = {
  id: string;
  userId: string;
  chartPalette: ChartPalette;
  baseCurrencyCode: string;
  displayCurrencyCode: string;
  createdAt: string;
  updatedAt: string;
};

function mapPreferences(row: AppPreferencesRow): AppPreferences {
  return {
    id: row.id,
    userId: row.user_id,
    chartPalette: row.chart_palette,
    baseCurrencyCode: row.base_currency_code ?? DEFAULT_CURRENCY_CODE,
    displayCurrencyCode: row.display_currency_code ?? row.base_currency_code ?? DEFAULT_CURRENCY_CODE,
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
    .select(
      "id, user_id, chart_palette, base_currency_code, display_currency_code, created_at, updated_at"
    )
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
  return upsertAppPreferences(supabase, userId, { chartPalette });
}

export async function upsertAppPreferences(
  supabase: SupabaseClient,
  userId: string,
  input: {
    chartPalette?: ChartPalette;
    baseCurrencyCode?: string;
    displayCurrencyCode?: string;
  }
) {
  const row: Record<string, string> = {
    user_id: userId,
    updated_at: new Date().toISOString(),
  };

  if (input.chartPalette) {
    row.chart_palette = input.chartPalette;
  }

  if (input.baseCurrencyCode) {
    row.base_currency_code = input.baseCurrencyCode;
  }

  if (input.displayCurrencyCode) {
    row.display_currency_code = input.displayCurrencyCode;
  }

  const { error } = await supabase.from("app_preferences").upsert(
    row,
    {
      onConflict: "user_id",
    }
  );

  if (error) {
    throw error;
  }
}
