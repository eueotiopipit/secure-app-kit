-- Secure Open Finance connection metadata with per-user RLS.
alter table public.bank_connections enable row level security;

create policy bank_connections_select_own
  on public.bank_connections for select
  using (auth.uid() = user_id);

create policy bank_connections_insert_own
  on public.bank_connections for insert
  with check (auth.uid() = user_id);

create policy bank_connections_update_own
  on public.bank_connections for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy bank_connections_delete_own
  on public.bank_connections for delete
  using (auth.uid() = user_id);
