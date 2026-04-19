import type { AppSettings, ResetPeriodMode } from "./transactions";

export type PeriodInfo = {
  key: string;
  label: string;
  mode: ResetPeriodMode;
  start: Date;
  endExclusive: Date;
};

function pad(value: number) {
  return value.toString().padStart(2, "0");
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function formatMonthKey(date: Date) {
  return `monthly:${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

function formatCustomKey(date: Date) {
  return `custom:${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}-${pad(date.getHours())}-${pad(date.getMinutes())}`;
}

function getMonthlyLabel(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function getCustomLabel(start: Date, endExclusive: Date) {
  const end = new Date(endExclusive.getTime() - 1);
  const formatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return `${formatter.format(start)} - ${formatter.format(end)}`;
}

function getCustomAnchorForMonth(
  year: number,
  month: number,
  customResetDay: number,
  customResetHour: number,
  customResetMinute: number
) {
  const day = Math.min(
    Math.max(customResetDay, 1),
    getDaysInMonth(year, month)
  );

  return new Date(year, month, day, customResetHour, customResetMinute, 0, 0);
}

export function getEffectiveSettings(
  settings: AppSettings | null
): Pick<
  AppSettings,
  | "resetPeriodMode"
  | "customResetDay"
  | "customResetHour"
  | "customResetMinute"
  | "lastPeriodKey"
> {
  return {
    resetPeriodMode: settings?.resetPeriodMode ?? "monthly",
    customResetDay: settings?.customResetDay ?? 1,
    customResetHour: settings?.customResetHour ?? 0,
    customResetMinute: settings?.customResetMinute ?? 0,
    lastPeriodKey: settings?.lastPeriodKey ?? null,
  };
}

export function getActivePeriod(
  settings: AppSettings | null,
  referenceDate = new Date()
): PeriodInfo {
  const effectiveSettings = getEffectiveSettings(settings);

  if (effectiveSettings.resetPeriodMode === "never") {
    return {
      key: "never",
      label: "Live period",
      mode: "never",
      start: new Date(0),
      endExclusive: new Date(8640000000000000),
    };
  }

  if (effectiveSettings.resetPeriodMode === "monthly") {
    const start = new Date(
      referenceDate.getFullYear(),
      referenceDate.getMonth(),
      1,
      0,
      0,
      0,
      0
    );
    const endExclusive = new Date(
      referenceDate.getFullYear(),
      referenceDate.getMonth() + 1,
      1,
      0,
      0,
      0,
      0
    );

    return {
      key: formatMonthKey(start),
      label: getMonthlyLabel(start),
      mode: "monthly",
      start,
      endExclusive,
    };
  }

  const day = effectiveSettings.customResetDay ?? 1;
  const hour = effectiveSettings.customResetHour ?? 0;
  const minute = effectiveSettings.customResetMinute ?? 0;
  const currentMonthAnchor = getCustomAnchorForMonth(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    day,
    hour,
    minute
  );
  const start =
    referenceDate >= currentMonthAnchor
      ? currentMonthAnchor
      : getCustomAnchorForMonth(
          referenceDate.getFullYear(),
          referenceDate.getMonth() - 1,
          day,
          hour,
          minute
        );
  const endExclusive = getCustomAnchorForMonth(
    start.getFullYear(),
    start.getMonth() + 1,
    day,
    hour,
    minute
  );

  return {
    key: formatCustomKey(start),
    label: getCustomLabel(start, endExclusive),
    mode: "custom",
    start,
    endExclusive,
  };
}

export function parsePeriodKey(
  periodKey: string,
  settings: AppSettings | null
): PeriodInfo {
  if (periodKey === "never") {
    return getActivePeriod(
      {
        id: "",
        userId: "",
        resetPeriodMode: "never",
        customResetDay: null,
        customResetHour: null,
        customResetMinute: null,
        lastPeriodKey: "never",
        createdAt: "",
        updatedAt: "",
      },
      new Date()
    );
  }

  if (periodKey.startsWith("monthly:")) {
    const [, rawYearMonth] = periodKey.split(":");
    const [year, month] = rawYearMonth.split("-").map(Number);
    const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const endExclusive = new Date(year, month, 1, 0, 0, 0, 0);

    return {
      key: periodKey,
      label: getMonthlyLabel(start),
      mode: "monthly",
      start,
      endExclusive,
    };
  }

  const [, rawDate] = periodKey.split(":");
  const [year, month, day, hour, minute] = rawDate.split("-").map(Number);
  const start = new Date(year, month - 1, day, hour, minute, 0, 0);
  const endExclusive = getCustomAnchorForMonth(
    start.getFullYear(),
    start.getMonth() + 1,
    settings?.customResetDay ?? 1,
    settings?.customResetHour ?? 0,
    settings?.customResetMinute ?? 0
  );

  return {
    key: periodKey,
    label: getCustomLabel(start, endExclusive),
    mode: "custom",
    start,
    endExclusive,
  };
}

export function getNextPeriod(
  period: PeriodInfo,
  settings: AppSettings | null
): PeriodInfo {
  if (period.mode === "never") {
    return period;
  }

  return getActivePeriod(settings, new Date(period.endExclusive));
}
