import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Transaction,
  TransactionCategory,
  TransactionType,
} from "./transactions";

type TransactionRow = {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  category: TransactionCategory;
  subcategory?: string | null;
  transaction_date: string;
  note: string;
  created_at: string;
};

export type NewTransactionPayload = {
  userId: string;
  type: TransactionType;
  amount: number;
  category: TransactionCategory;
  subcategory?: string | null;
  date: string;
  note: string;
};

function mapTransactionRow(row: TransactionRow): Transaction {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    amount: Number(row.amount),
    category: row.category,
    subcategory: row.subcategory ?? null,
    date: row.transaction_date,
    note: row.note,
    createdAt: row.created_at,
  };
}

function isMissingSubcategoryColumnError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return message.includes("subcategory") && message.includes("column");
}

export async function fetchTransactions(
  supabase: SupabaseClient,
  userId: string
) {
  try {
    const { data, error } = await supabase
      .from("transactions")
      .select(
        "id, user_id, type, amount, category, subcategory, transaction_date, note, created_at"
      )
      .eq("user_id", userId)
      .order("transaction_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return (data ?? []).map((row) => mapTransactionRow(row as TransactionRow));
  } catch (error) {
    if (!isMissingSubcategoryColumnError(error)) {
      throw error;
    }

    const { data, error: fallbackError } = await supabase
      .from("transactions")
      .select("id, user_id, type, amount, category, transaction_date, note, created_at")
      .eq("user_id", userId)
      .order("transaction_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (fallbackError) {
      throw fallbackError;
    }

    return (data ?? []).map((row) => mapTransactionRow(row as TransactionRow));
  }
}

export async function insertTransaction(
  supabase: SupabaseClient,
  payload: NewTransactionPayload
) {
  try {
    const { error } = await supabase.from("transactions").insert({
      user_id: payload.userId,
      type: payload.type,
      amount: payload.amount,
      category: payload.category,
      subcategory: payload.subcategory ?? null,
      transaction_date: payload.date,
      note: payload.note,
    });

    if (error) {
      throw error;
    }
  } catch (error) {
    if (!isMissingSubcategoryColumnError(error)) {
      throw error;
    }

    const { error: fallbackError } = await supabase.from("transactions").insert({
      user_id: payload.userId,
      type: payload.type,
      amount: payload.amount,
      category: payload.category,
      transaction_date: payload.date,
      note: payload.note,
    });

    if (fallbackError) {
      throw fallbackError;
    }
  }
}

export async function removeTransaction(
  supabase: SupabaseClient,
  userId: string,
  transactionId: string
) {
  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", transactionId)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }
}
