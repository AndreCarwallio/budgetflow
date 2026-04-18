alter table public.categories
  add column if not exists color text;

create table if not exists public.app_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  chart_palette text not null default 'ocean',
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create unique index if not exists app_preferences_user_id_idx
  on public.app_preferences (user_id);

alter table public.app_preferences enable row level security;

create policy "Users can view their own app preferences"
  on public.app_preferences
  for select
  using (auth.uid() = user_id);

create policy "Users can insert their own app preferences"
  on public.app_preferences
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own app preferences"
  on public.app_preferences
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own app preferences"
  on public.app_preferences
  for delete
  using (auth.uid() = user_id);
