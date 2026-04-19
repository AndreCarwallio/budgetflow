alter table public.app_preferences
  add column if not exists base_currency_code text not null default 'USD',
  add column if not exists display_currency_code text not null default 'USD';

create table if not exists public.currency_presets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  currency_code text not null,
  currency_label text not null,
  currency_symbol text not null,
  exchange_rate numeric not null default 1,
  auto_fill_enabled boolean not null default false,
  last_fetched_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create unique index if not exists currency_presets_user_code_idx
  on public.currency_presets (user_id, currency_code);

alter table public.currency_presets enable row level security;

create policy "Users can view their own currency presets"
  on public.currency_presets
  for select
  using (auth.uid() = user_id);

create policy "Users can insert their own currency presets"
  on public.currency_presets
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own currency presets"
  on public.currency_presets
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own currency presets"
  on public.currency_presets
  for delete
  using (auth.uid() = user_id);
