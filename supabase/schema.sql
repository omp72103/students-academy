-- Students Academy — Supabase schema (tables prefixed sa_ so the project can be shared safely)
-- Web app env: VITE_TABLE_PREFIX=sa_   VITE_STORAGE_BUCKET=sa-files

do $$
declare t text;
begin
  foreach t in array array['settings','users','batches','materials','attendance','tests','attempts','assignments','submissions',
                           'fees','notices','enquiries','timetable','messages','toppers']
  loop
    execute format('create table if not exists public.%I (id text primary key, data jsonb not null default ''{}'', created_at timestamptz default now())', 'sa_' || t);
    execute format('alter table public.%I enable row level security', 'sa_' || t);
  end loop;
end $$;
create index if not exists sa_users_email_idx on public.sa_users (lower(data->>'email'));

-- Role / id of the signed-in user, looked up from sa_users by email
create or replace function public.sa_role() returns text language sql stable security definer set search_path = public as $$
  select data->>'role' from public.sa_users where lower(data->>'email') = lower(auth.jwt()->>'email') and coalesce(data->>'status','active') <> 'inactive' limit 1
$$;
create or replace function public.sa_uid() returns text language sql stable security definer set search_path = public as $$
  select id from public.sa_users where lower(data->>'email') = lower(auth.jwt()->>'email') limit 1
$$;

-- Lets Students Academy management confirm logins they create (only for emails present in sa_users)
create or replace function public.sa_confirm_user(p_email text) returns void language plpgsql security definer set search_path = public, auth as $$
begin
  if public.sa_role() is distinct from 'admin' then raise exception 'not allowed'; end if;
  if not exists (select 1 from public.sa_users where lower(data->>'email') = lower(p_email)) then raise exception 'unknown user'; end if;
  update auth.users set email_confirmed_at = coalesce(email_confirmed_at, now()) where lower(email) = lower(p_email);
end $$;
revoke all on function public.sa_confirm_user(text) from public, anon;
grant execute on function public.sa_confirm_user(text) to authenticated;

-- Public website (anonymous)
create policy "sa public settings"  on public.sa_settings  for select using (true);
create policy "sa public materials" on public.sa_materials for select using (data->>'visibility' = 'public' or public.sa_role() is not null);
create policy "sa public notices"   on public.sa_notices   for select using ((data->>'publishOnWebsite')::boolean is true or public.sa_role() is not null);
create policy "sa public toppers"   on public.sa_toppers   for select using (true);
create policy "sa public enquiry"   on public.sa_enquiries for insert with check (data->>'status' = 'new' and data->>'source' = 'Website');

-- Any Students Academy member can read portal data
do $$
declare t text;
begin
  foreach t in array array['users','batches','attendance','tests','attempts','assignments','submissions','fees','timetable']
  loop execute format('create policy "sa member read" on public.%I for select to authenticated using (public.sa_role() is not null)', 'sa_' || t); end loop;
end $$;
create policy "sa staff read enquiries" on public.sa_enquiries for select to authenticated using (public.sa_role() in ('admin','faculty'));
create policy "sa staff read messages"  on public.sa_messages  for select to authenticated using (public.sa_role() in ('admin','faculty'));

-- Management: full access
do $$
declare t text;
begin
  foreach t in array array['settings','users','batches','materials','attendance','tests','attempts','assignments','submissions',
                           'fees','notices','enquiries','timetable','messages','toppers']
  loop execute format('create policy "sa admin all" on public.%I for all to authenticated using (public.sa_role() = ''admin'') with check (public.sa_role() = ''admin'')', 'sa_' || t); end loop;
end $$;

-- Faculty: teaching data
do $$
declare t text;
begin
  foreach t in array array['attendance','materials','tests','assignments','submissions','notices','messages','enquiries']
  loop execute format('create policy "sa faculty write" on public.%I for all to authenticated using (public.sa_role() = ''faculty'') with check (public.sa_role() = ''faculty'')', 'sa_' || t); end loop;
end $$;

-- Students: only their own attempts / submissions
create policy "sa student attempt" on public.sa_attempts for insert to authenticated
  with check (public.sa_role() = 'student' and data->>'studentId' = public.sa_uid());
create policy "sa student submission" on public.sa_submissions for all to authenticated
  using (public.sa_role() = 'student' and data->>'studentId' = public.sa_uid())
  with check (public.sa_role() = 'student' and data->>'studentId' = public.sa_uid());

-- File storage
insert into storage.buckets (id, name, public) values ('sa-files', 'sa-files', true) on conflict do nothing;
create policy "sa staff upload" on storage.objects for insert to authenticated with check (bucket_id = 'sa-files' and public.sa_role() is not null);
