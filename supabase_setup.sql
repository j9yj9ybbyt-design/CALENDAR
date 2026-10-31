-- Smart Calendar Web v3: incolla questo SQL nell'editor SQL del tuo progetto Supabase.
-- I dati appartengono all'utente autenticato. Nessun accesso anonimo ai calendari.
create table if not exists public.calendar_projects (
  id text primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);
create index if not exists calendar_projects_owner_time_idx on public.calendar_projects (owner_id,updated_at desc);
alter table public.calendar_projects enable row level security;
revoke all on table public.calendar_projects from anon, authenticated;
grant select, insert, update, delete on table public.calendar_projects to authenticated;
drop policy if exists "calendar_read_own" on public.calendar_projects;
create policy "calendar_read_own" on public.calendar_projects for select to authenticated using ((select auth.uid())=owner_id);
drop policy if exists "calendar_create_own" on public.calendar_projects;
create policy "calendar_create_own" on public.calendar_projects for insert to authenticated with check ((select auth.uid())=owner_id);
drop policy if exists "calendar_update_own" on public.calendar_projects;
create policy "calendar_update_own" on public.calendar_projects for update to authenticated using ((select auth.uid())=owner_id) with check ((select auth.uid())=owner_id);
drop policy if exists "calendar_delete_own" on public.calendar_projects;
create policy "calendar_delete_own" on public.calendar_projects for delete to authenticated using ((select auth.uid())=owner_id);
