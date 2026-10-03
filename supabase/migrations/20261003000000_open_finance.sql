-- Open Finance / bank connection foundation
-- Provider: Pluggy (credentials stay server-side in Supabase Edge Functions)

create table if not exists public.bank_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'pluggy',
  item_id text not null unique,
  institution_name text,
  institution_logo_url text,
  status text not null default 'CONNECTED',
  last_synced_at timestamptz,
  consent_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists bank_connections_user_id_idx on public.bank_connections(user_id);

alter table public.financial_transactions
  add column if not exists source text not null default 'manual',
  add column if not exists external_id text;

create unique index if not exists financial_transactions_user_external_idx
  on public.financial_transactions(user_id, external_id)
  where external_id is not null;

alter table public.bank_connections enable row level security;

drop policy if exists "Users can view own bank connections" on public.bank_connections;
create policy "Users can view own bank connections"
  on public.bank_connections for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own bank connections" on public.bank_connections;
create policy "Users can insert own bank connections"
  on public.bank_connections for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own bank connections" on public.bank_connections;
create policy "Users can update own bank connections"
  on public.bank_connections for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own bank connections" on public.bank_connections;
create policy "Users can delete own bank connections"
  on public.bank_connections for delete
  using (auth.uid() = user_id);

-- Keep updated_at current for bank connections.
create or replace function public.set_bank_connection_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists bank_connections_updated_at on public.bank_connections;
create trigger bank_connections_updated_at
before update on public.bank_connections
for each row execute function public.set_bank_connection_updated_at();
