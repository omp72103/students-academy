-- Students Academy — migration 002: marks, staff attendance, biometric devices, privilege-based access.
-- Run after schema.sql (already applied to the live project).

create table if not exists public.sa_exams (id text primary key, data jsonb not null default '{}'::jsonb, created_at timestamptz default now());
create table if not exists public.sa_devices (id text primary key, data jsonb not null default '{}'::jsonb, created_at timestamptz default now());
create table if not exists public.sa_punches (id text primary key, data jsonb not null default '{}'::jsonb, created_at timestamptz default now());
create table if not exists public.sa_staff_attendance (id text primary key, data jsonb not null default '{}'::jsonb, created_at timestamptz default now());
alter table public.sa_exams enable row level security;
alter table public.sa_devices enable row level security;
alter table public.sa_punches enable row level security;
alter table public.sa_staff_attendance enable row level security;
create index if not exists sa_punches_date_idx on public.sa_punches ((data->>'date'));
create index if not exists sa_users_bio_idx on public.sa_users ((data->>'biometricId'));

-- Privilege check: mirrors web/src/lib/perms.js (role defaults + data.privileges[])
create or replace function public.sa_has(p text) returns boolean
language sql stable security definer set search_path = public as $$
  with me as (
    select data from public.sa_users
    where lower(data->>'email') = lower(auth.jwt()->>'email') and coalesce(data->>'status','active') <> 'inactive' limit 1)
  select coalesce((select case data->>'role'
      when 'admin' then true
      when 'staff' then p = any (array['students','parents','fees','enquiries','attendance','staffAttendance','messaging','notices'])
                        or coalesce(data->'privileges' ? p, false)
      when 'faculty' then p = any (array['attendance','marks','tests','materials','assignments','notices','messaging','results'])
                        or coalesce(data->'privileges' ? p, false)
      else false end from me), false)
$$;

create policy "sa admin all" on public.sa_exams for all using (sa_role() = 'admin') with check (sa_role() = 'admin');
create policy "sa member read" on public.sa_exams for select using (sa_role() is not null);
create policy "sa marks write" on public.sa_exams for all using (sa_has('marks')) with check (sa_has('marks'));

create policy "sa admin all" on public.sa_staff_attendance for all using (sa_role() = 'admin') with check (sa_role() = 'admin');
create policy "sa member read" on public.sa_staff_attendance for select using (sa_role() in ('admin','staff','faculty'));
create policy "sa staffatt write" on public.sa_staff_attendance for all using (sa_has('staffAttendance')) with check (sa_has('staffAttendance'));

create policy "sa biometric all" on public.sa_devices for all using (sa_has('biometric')) with check (sa_has('biometric'));
create policy "sa biometric all" on public.sa_punches for all using (sa_has('biometric')) with check (sa_has('biometric'));

-- Privilege-based writes on existing tables (office staff and custom faculty privileges)
create policy "sa priv students" on public.sa_users for all
  using (sa_has('students') and data->>'role' in ('student','parent'))
  with check (sa_has('students') and data->>'role' in ('student','parent'));
create policy "sa priv fees" on public.sa_fees for all using (sa_has('fees')) with check (sa_has('fees'));
create policy "sa priv enquiries" on public.sa_enquiries for all using (sa_has('enquiries')) with check (sa_has('enquiries'));
create policy "sa priv attendance" on public.sa_attendance for all using (sa_has('attendance')) with check (sa_has('attendance'));
create policy "sa priv messaging" on public.sa_messages for all using (sa_has('messaging')) with check (sa_has('messaging'));
create policy "sa priv notices" on public.sa_notices for all using (sa_has('notices')) with check (sa_has('notices'));
create policy "sa priv tests" on public.sa_tests for all using (sa_has('tests')) with check (sa_has('tests'));
create policy "sa priv materials" on public.sa_materials for all using (sa_has('materials')) with check (sa_has('materials'));
create policy "sa priv assignments" on public.sa_assignments for all using (sa_has('assignments')) with check (sa_has('assignments'));
create policy "sa priv batches" on public.sa_batches for all using (sa_has('batches')) with check (sa_has('batches'));
create policy "sa priv timetable" on public.sa_timetable for all using (sa_has('timetable')) with check (sa_has('timetable'));

-- Biometric ingest. Called by /iclock (ADMS, p_token null: device authenticated by registered serial no.),
-- /api/biometric (webhook, token required) and the portal's CSV import.
-- Students: P, or L if after batch startTime + settings.bioGraceMinutes; never downgrades an existing P/L.
-- Staff/faculty: earliest punch = in, latest = out.
create or replace function public.sa_biometric_ingest(p_sn text, p_token text, p_records jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  dev record; r jsonb; u record; b record;
  v_time text; v_date text; v_hm text; v_id text; v_status text; v_grace int; v_lim int;
  doc jsonb; cur jsonb; v_in text; v_out text;
  n_ins int := 0; n_dup int := 0; n_unk int := 0; n_rec int := 0;
begin
  select * into dev from sa_devices where data->>'serialNo' = p_sn and coalesce((data->>'active')::boolean, true) limit 1;
  if dev.id is null then raise exception 'unknown or inactive device %', p_sn; end if;
  if p_token is not null and p_token <> coalesce(dev.data->>'token','') then raise exception 'bad device token'; end if;
  select coalesce((data->>'bioGraceMinutes')::int, 10) into v_grace from sa_settings where id = 'institute';
  v_grace := coalesce(v_grace, 10);

  for r in select * from jsonb_array_elements(coalesce(p_records, '[]'::jsonb)) loop
    n_rec := n_rec + 1;
    v_time := left(replace(r->>'time', 'T', ' '), 19);
    if v_time is null or length(v_time) < 16 or coalesce(r->>'pin','') = '' then continue; end if;
    if length(v_time) = 16 then v_time := v_time || ':00'; end if;
    v_date := left(v_time, 10); v_hm := substr(v_time, 12, 5);
    v_id := p_sn || '-' || (r->>'pin') || '-' || regexp_replace(v_time, '\D', '', 'g');
    if exists (select 1 from sa_punches where id = v_id) then n_dup := n_dup + 1; continue; end if;

    select id, data into u from sa_users
      where data->>'biometricId' = r->>'pin' and coalesce(data->>'status','active') <> 'inactive' limit 1;
    insert into sa_punches (id, data) values (v_id, jsonb_build_object(
      'id', v_id, 'deviceSn', p_sn, 'deviceName', dev.data->>'name', 'pin', r->>'pin',
      'time', replace(v_time, ' ', 'T'), 'date', v_date,
      'userId', u.id, 'userName', u.data->>'name', 'role', u.data->>'role'));
    n_ins := n_ins + 1;
    if u.id is null then n_unk := n_unk + 1; continue; end if;

    if u.data->>'role' = 'student' then
      v_status := 'P';
      select data into b from sa_batches where id = u.data->>'batchId';
      if b.data->>'startTime' ~ '^\d{1,2}:\d{2}' then
        v_lim := split_part(b.data->>'startTime', ':', 1)::int * 60 + left(split_part(b.data->>'startTime', ':', 2), 2)::int + v_grace;
        if split_part(v_hm, ':', 1)::int * 60 + split_part(v_hm, ':', 2)::int > v_lim then v_status := 'L'; end if;
      end if;
      v_id := 'att-' || (u.data->>'batchId') || '-' || v_date;
      select data into doc from sa_attendance where id = v_id;
      if doc is null then
        insert into sa_attendance (id, data) values (v_id, jsonb_build_object('id', v_id, 'batchId', u.data->>'batchId',
          'date', v_date, 'records', jsonb_build_object(u.id, v_status), 'markedBy', 'biometric'));
      elsif coalesce(doc->'records'->>u.id, 'A') = 'A' then
        update sa_attendance set data = jsonb_set(data, '{records}', coalesce(data->'records','{}'::jsonb) || jsonb_build_object(u.id, v_status)) where id = v_id;
      end if;
    elsif u.data->>'role' in ('staff','faculty','admin') then
      v_id := 'sat-' || v_date;
      select data into doc from sa_staff_attendance where id = v_id;
      cur := coalesce(doc->'records'->u.id, '{}'::jsonb);
      v_in := case when cur->>'in' is not null and cur->>'in' < v_hm then cur->>'in' else v_hm end;
      select max(x) into v_out from unnest(array[cur->>'out', cur->>'in', v_hm]) x;
      if v_out = v_in then v_out := null; end if;
      cur := jsonb_build_object('status', case when coalesce(cur->>'status','A') <> 'A' then cur->>'status' else 'P' end,
                                'in', v_in, 'out', v_out, 'source', 'biometric');
      if doc is null then
        insert into sa_staff_attendance (id, data) values (v_id, jsonb_build_object('id', v_id, 'date', v_date,
          'records', jsonb_build_object(u.id, cur), 'markedBy', 'biometric'));
      else
        update sa_staff_attendance set data = jsonb_set(data, '{records}', coalesce(data->'records','{}'::jsonb) || jsonb_build_object(u.id, cur)) where id = v_id;
      end if;
    end if;
  end loop;

  update sa_devices set data = data || jsonb_build_object('lastSeen', to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
    'punchCount', coalesce((data->>'punchCount')::int, 0) + n_ins) where id = dev.id;
  return jsonb_build_object('received', n_rec, 'inserted', n_ins, 'duplicates', n_dup, 'unknown', n_unk);
end $$;

create or replace function public.sa_biometric_heartbeat(p_sn text) returns void
language sql security definer set search_path = public as $$
  update sa_devices set data = data || jsonb_build_object('lastSeen', to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'))
  where data->>'serialNo' = p_sn and coalesce((data->>'active')::boolean, true);
$$;

revoke all on function public.sa_biometric_ingest(text, text, jsonb) from public;
revoke all on function public.sa_biometric_heartbeat(text) from public;
grant execute on function public.sa_biometric_ingest(text, text, jsonb) to anon, authenticated;
grant execute on function public.sa_biometric_heartbeat(text) to anon, authenticated;
grant execute on function public.sa_has(text) to anon, authenticated;
grant select, insert, update, delete on public.sa_exams, public.sa_devices, public.sa_punches, public.sa_staff_attendance to authenticated;

-- 003: website testimonials (public read, managed by admin from Portal → Website Content)
create table if not exists public.sa_testimonials (id text primary key, data jsonb not null default '{}'::jsonb, created_at timestamptz default now());
alter table public.sa_testimonials enable row level security;
create policy "sa admin all" on public.sa_testimonials for all using (sa_role() = 'admin') with check (sa_role() = 'admin');
create policy "sa public testimonials" on public.sa_testimonials for select using (true);
grant select on public.sa_testimonials to anon;
grant select, insert, update, delete on public.sa_testimonials to authenticated;
