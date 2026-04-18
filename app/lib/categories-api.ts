import type { SupabaseClient } from "@supabase/supabase-js";
import type { Category, Subcategory } from "./transactions";

type CategoryRow = {
  id: string;
  user_id: string;
  name: string;
  color?: string | null;
  created_at: string;
};

type SubcategoryRow = {
  id: string;
  user_id: string;
  category_name: string;
  name: string;
  created_at: string;
};

function mapCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    color: row.color,
    createdAt: row.created_at,
  };
}

function isMissingColorColumnError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return message.includes("color") && message.includes("column");
}

function mapSubcategory(row: SubcategoryRow): Subcategory {
  return {
    id: row.id,
    userId: row.user_id,
    categoryName: row.category_name,
    name: row.name,
    createdAt: row.created_at,
  };
}

export async function fetchCategories(
  supabase: SupabaseClient,
  userId: string
) {
  try {
    const { data, error } = await supabase
      .from("categories")
      .select("id, user_id, name, color, created_at")
      .eq("user_id", userId)
      .order("name", { ascending: true });

    if (error) {
      throw error;
    }

    return (data ?? []).map((row) => mapCategory(row as CategoryRow));
  } catch (error) {
    if (!isMissingColorColumnError(error)) {
      throw error;
    }

    const { data, error: fallbackError } = await supabase
      .from("categories")
      .select("id, user_id, name, created_at")
      .eq("user_id", userId)
      .order("name", { ascending: true });

    if (fallbackError) {
      throw fallbackError;
    }

    return (data ?? []).map((row) => mapCategory(row as CategoryRow));
  }
}

export async function createCategory(
  supabase: SupabaseClient,
  userId: string,
  name: string,
  color?: string | null
) {
  try {
    const { error } = await supabase.from("categories").insert({
      user_id: userId,
      name,
      color: color ?? null,
    });

    if (error) {
      throw error;
    }
  } catch (error) {
    if (!isMissingColorColumnError(error)) {
      throw error;
    }

    const { error: fallbackError } = await supabase.from("categories").insert({
      user_id: userId,
      name,
    });

    if (fallbackError) {
      throw fallbackError;
    }
  }
}

export async function updateCategoryColor(
  supabase: SupabaseClient,
  userId: string,
  categoryId: string,
  color: string
) {
  const { error } = await supabase
    .from("categories")
    .update({ color })
    .eq("id", categoryId)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }
}

export async function renameCategory(
  supabase: SupabaseClient,
  userId: string,
  categoryId: string,
  previousName: string,
  nextName: string
) {
  const { error: categoryError } = await supabase
    .from("categories")
    .update({ name: nextName })
    .eq("id", categoryId)
    .eq("user_id", userId);

  if (categoryError) {
    throw categoryError;
  }

  const { error: subcategoryError } = await supabase
    .from("subcategories")
    .update({ category_name: nextName })
    .eq("user_id", userId)
    .eq("category_name", previousName);

  if (subcategoryError) {
    throw subcategoryError;
  }

  const { error: budgetError } = await supabase
    .from("budgets")
    .update({ category: nextName })
    .eq("user_id", userId)
    .eq("category", previousName);

  if (budgetError) {
    throw budgetError;
  }

  const { error: transactionError } = await supabase
    .from("transactions")
    .update({ category: nextName })
    .eq("user_id", userId)
    .eq("category", previousName);

  if (transactionError) {
    throw transactionError;
  }
}

export async function deleteCategory(
  supabase: SupabaseClient,
  userId: string,
  categoryId: string
) {
  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", categoryId)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }
}

export async function fetchSubcategories(
  supabase: SupabaseClient,
  userId: string
) {
  const { data, error } = await supabase
    .from("subcategories")
    .select("id, user_id, category_name, name, created_at")
    .eq("user_id", userId)
    .order("category_name", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => mapSubcategory(row as SubcategoryRow));
}

export async function createSubcategory(
  supabase: SupabaseClient,
  userId: string,
  categoryName: string,
  name: string
) {
  const { error } = await supabase.from("subcategories").insert({
    user_id: userId,
    category_name: categoryName,
    name,
  });

  if (error) {
    throw error;
  }
}

export async function renameSubcategory(
  supabase: SupabaseClient,
  userId: string,
  subcategoryId: string,
  categoryName: string,
  previousName: string,
  nextName: string
) {
  const { error: subcategoryError } = await supabase
    .from("subcategories")
    .update({ name: nextName })
    .eq("id", subcategoryId)
    .eq("user_id", userId);

  if (subcategoryError) {
    throw subcategoryError;
  }

  const { error: transactionError } = await supabase
    .from("transactions")
    .update({ subcategory: nextName })
    .eq("user_id", userId)
    .eq("category", categoryName)
    .eq("subcategory", previousName);

  if (transactionError) {
    throw transactionError;
  }
}

export async function deleteSubcategory(
  supabase: SupabaseClient,
  userId: string,
  subcategoryId: string
) {
  const { error } = await supabase
    .from("subcategories")
    .delete()
    .eq("id", subcategoryId)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }
}
