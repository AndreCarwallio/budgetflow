import type { SupabaseClient } from "@supabase/supabase-js";
import type { AppSettings, ResetPeriodMode } from "./transactions";

type AppSettingsRow = Record<string, unknown>;

export type AppSettingsPayload = {
  resetPeriodMode: ResetPeriodMode;
  customResetDay: number | null;
  customResetHour: number | null;
  customResetMinute: number | null;
  lastPeriodKey: string | null;
};

function parseNumber(value: unknown, fallback: number | null) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
}

function parseMode(value: unknown): ResetPeriodMode {
  return value === "custom" || value === "never" ? value : "monthly";
}

function parseTimeParts(value: unknown) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return { hour: null, minute: null };
  }

  const [hourValue = "0", minuteValue = "0"] = value.split(":");

  return {
    hour: parseNumber(hourValue, 0),
    minute: parseNumber(minuteValue, 0),
  };
}

export function getDefaultAppSettings(userId: string): AppSettings {
  const now = new Date().toISOString();

  return {
    id: `default-${userId}`,
    userId,
    resetPeriodMode: "monthly",
    customResetDay: 1,
    customResetHour: 0,
    customResetMinute: 0,
    lastPeriodKey: null,
    createdAt: now,
    updatedAt: now,
  };
}

function mapAppSettings(row: AppSettingsRow, userId: string): AppSettings {
  const parsedCustomTime = parseTimeParts(row.custom_reset_time);

  return {
    id:
      typeof row.id === "string" && row.id.length > 0
        ? row.id
        : `default-${userId}`,
    userId:
      typeof row.user_id === "string" && row.user_id.length > 0
        ? row.user_id
        : userId,
    resetPeriodMode: parseMode(row.reset_period_mode ?? row.period_mode),
    customResetDay: parseNumber(
      row.custom_reset_day ?? row.reset_day,
      1
    ),
    customResetHour: parseNumber(
      row.custom_reset_hour ?? row.reset_hour ?? parsedCustomTime.hour,
      0
    ),
    customResetMinute: parseNumber(
      row.custom_reset_minute ?? row.reset_minute ?? parsedCustomTime.minute,
      0
    ),
    lastPeriodKey:
      typeof row.last_period_key === "string" ? row.last_period_key : null,
    createdAt:
      typeof row.created_at === "string" ? row.created_at : new Date().toISOString(),
    updatedAt:
      typeof row.updated_at === "string" ? row.updated_at : new Date().toISOString(),
  };
}

async function upsertPreferredShape(
  supabase: SupabaseClient,
  row: Record<string, unknown>
) {
  const { error } = await supabase.from("app_settings").upsert(row, {
    onConflict: "user_id",
  });

  if (error) {
    throw error;
  }
}

export async function fetchAppSettings(
  supabase: SupabaseClient,
  userId: string
) {
  const { data, error } = await supabase
    .from("app_settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapAppSettings(data as AppSettingsRow, userId) : null;
}

export async function upsertAppSettings(
  supabase: SupabaseClient,
  userId: string,
  payload: Partial<AppSettingsPayload>
) {
  const nextMode = parseMode(payload.resetPeriodMode);
  const nextDay = payload.customResetDay ?? 1;
  const nextHour = payload.customResetHour ?? 0;
  const nextMinute = payload.customResetMinute ?? 0;
  const updatedAt = new Date().toISOString();
  const modernRow = {
    user_id: userId,
    reset_period_mode: nextMode,
    custom_reset_day: nextDay,
    custom_reset_hour: nextHour,
    custom_reset_minute: nextMinute,
    last_period_key: payload.lastPeriodKey ?? null,
    updated_at: updatedAt,
  };

  try {
    await upsertPreferredShape(supabase, modernRow);
    return;
  } catch {
    const legacyRow = {
      user_id: userId,
      period_mode: nextMode,
      reset_day: nextDay,
      reset_hour: nextHour,
      reset_minute: nextMinute,
      custom_reset_time: `${String(nextHour).padStart(2, "0")}:${String(
        nextMinute
      ).padStart(2, "0")}`,
      last_period_key: payload.lastPeriodKey ?? null,
      updated_at: updatedAt,
    };

    await upsertPreferredShape(supabase, legacyRow);
  }
}

export async function ensureAppSettings(
  supabase: SupabaseClient,
  userId: string
) {
  const existingSettings = await fetchAppSettings(supabase, userId);

  if (existingSettings) {
    return existingSettings;
  }

  const defaults = getDefaultAppSettings(userId);

  await upsertAppSettings(supabase, userId, {
    resetPeriodMode: defaults.resetPeriodMode,
    customResetDay: defaults.customResetDay,
    customResetHour: defaults.customResetHour,
    customResetMinute: defaults.customResetMinute,
    lastPeriodKey: defaults.lastPeriodKey,
  });

  const createdSettings = await fetchAppSettings(supabase, userId);
  return createdSettings ?? defaults;
}
