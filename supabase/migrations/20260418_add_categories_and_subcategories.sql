create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create unique index if not exists categories_user_id_name_idx
  on public.categories (user_id, lower(name));

alter table public.categories enable row level security;

create policy "Users can view their own categories"
  on public.categories
  for select
  using (auth.uid() = user_id);

create policy "Users can insert their own categories"
  on public.categories
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own categories"
  on public.categories
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own categories"
  on public.categories
  for delete
  using (auth.uid() = user_id);

create table if not exists public.subcategories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_name text not null,
  name text not null,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create unique index if not exists subcategories_user_id_category_name_name_idx
  on public.subcategories (user_id, lower(category_name), lower(name));

alter table public.subcategories enable row level security;

create policy "Users can view their own subcategories"
  on public.subcategories
  for select
  using (auth.uid() = user_id);

create policy "Users can insert their own subcategories"
  on public.subcategories
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own subcategories"
  on public.subcategories
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own subcategories"
  on public.subcategories
  for delete
  using (auth.uid() = user_id);

alter table public.transactions
  add column if not exists subcategory text;
