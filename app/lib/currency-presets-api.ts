import type { SupabaseClient } from "@supabase/supabase-js";
import type { CurrencyPreset } from "./transactions";

type CurrencyPresetRow = {
  id: string;
  user_id: string;
  currency_code: string;
  currency_label: string;
  currency_symbol: string;
  exchange_rate: number | string;
  auto_fill_enabled: boolean;
  last_fetched_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CurrencyPresetPayload = {
  currencyCode: string;
  currencyLabel: string;
  currencySymbol: string;
  exchangeRate: number;
  autoFillEnabled: boolean;
  lastFetchedAt: string | null;
};

function mapCurrencyPreset(row: CurrencyPresetRow): CurrencyPreset {
  return {
    id: row.id,
    userId: row.user_id,
    currencyCode: row.currency_code,
    currencyLabel: row.currency_label,
    currencySymbol: row.currency_symbol,
    exchangeRate: Number(row.exchange_rate),
    autoFillEnabled: row.auto_fill_enabled,
    lastFetchedAt: row.last_fetched_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function fetchCurrencyPresets(
  supabase: SupabaseClient,
  userId: string
) {
  const { data, error } = await supabase
    .from("currency_presets")
    .select(
      "id, user_id, currency_code, currency_label, currency_symbol, exchange_rate, auto_fill_enabled, last_fetched_at, created_at, updated_at"
    )
    .eq("user_id", userId)
    .order("currency_code", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => mapCurrencyPreset(row as CurrencyPresetRow));
}

export async function createCurrencyPreset(
  supabase: SupabaseClient,
  userId: string,
  payload: CurrencyPresetPayload
) {
  const { error } = await supabase.from("currency_presets").upsert(
    {
      user_id: userId,
      currency_code: payload.currencyCode,
      currency_label: payload.currencyLabel,
      currency_symbol: payload.currencySymbol,
      exchange_rate: payload.exchangeRate,
      auto_fill_enabled: payload.autoFillEnabled,
      last_fetched_at: payload.lastFetchedAt,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "user_id,currency_code",
    }
  );

  if (error) {
    throw error;
  }
}

export async function updateCurrencyPreset(
  supabase: SupabaseClient,
  userId: string,
  presetId: string,
  payload: CurrencyPresetPayload
) {
  const { error } = await supabase
    .from("currency_presets")
    .update({
      currency_code: payload.currencyCode,
      currency_label: payload.currencyLabel,
      currency_symbol: payload.currencySymbol,
      exchange_rate: payload.exchangeRate,
      auto_fill_enabled: payload.autoFillEnabled,
      last_fetched_at: payload.lastFetchedAt,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("id", presetId);

  if (error) {
    throw error;
  }
}

export async function removeCurrencyPreset(
  supabase: SupabaseClient,
  userId: string,
  presetId: string
) {
  const { error } = await supabase
    .from("currency_presets")
    .delete()
    .eq("user_id", userId)
    .eq("id", presetId);

  if (error) {
    throw error;
  }
}
