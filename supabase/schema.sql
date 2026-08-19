-- SIH 2026 · GTMC Nanded
create extension if not exists pgcrypto;

create table if not exists settings (
  id text primary key,
  fee numeric not null default 300,
  currency text not null default 'INR',
  is_active boolean not null default true,
  min_members int not null default 6,
  max_members int not null default 6,
  female_required boolean not null default true,
  updated_at timestamptz not null default now()
);

insert into settings (id) values ('registration')
on conflict (id) do nothing;

create table if not exists admins (
  id uuid primary key,
  email text unique not null,
  name text not null default 'Organizer',
  role text not null default 'ADMIN',
  created_at timestamptz not null default now()
);

create table if not exists problems (
  id text primary key,
  code text not null,
  title text not null,
  organization text not null default '',
  category text not null default 'Software',
  theme text not null default '',
  difficulty text not null default 'Medium',
  description text not null default '',
  background text not null default '',
  expected_solution text not null default '',
  technical_requirements jsonb not null default '[]'::jsonb,
  technologies jsonb not null default '[]'::jsonb,
  constraint_items jsonb not null default '[]'::jsonb,
  evaluation_criteria jsonb not null default '[]'::jsonb,
  selected_count int not null default 0,
  max_selections int not null default 2,
  status text not null default 'AVAILABLE',
  sort_order int not null default 0
);

create sequence if not exists team_registration_seq start 1;

create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  registration_id text unique not null,
  team_name text unique not null,
  college text not null,
  university text not null,
  city text not null,
  state text not null,
  leader_name text not null,
  leader_email text unique not null,
  leader_phone text not null,
  leader_gender text not null check (leader_gender in ('Female', 'Male', 'Other')),
  registration_status text not null default 'PENDING_PAYMENT'
    check (registration_status in ('PENDING_PAYMENT', 'CONFIRMED', 'CANCELLED')),
  payment_status text not null default 'PENDING'
    check (payment_status in ('PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'REFUNDED')),
  selected_problem_id text references problems(id),
  selected_problem_title text,
  registered_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  is_leader boolean not null default false,
  full_name text not null,
  email text unique not null,
  phone text not null,
  gender text not null check (gender in ('Female', 'Male', 'Other')),
  college text not null,
  course text not null,
  branch text not null,
  year text not null,
  student_id text unique not null,
  created_at timestamptz not null default now()
);

create unique index if not exists members_one_leader on members(team_id) where is_leader;

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  registration_id text not null,
  team_name text not null,
  order_id text unique not null,
  payment_session_id text,
  transaction_id text,
  amount numeric not null default 300,
  currency text not null default 'INR',
  status text not null default 'PENDING'
    check (status in ('PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'REFUNDED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists problem_selections (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  problem_id text not null references problems(id),
  status text not null default 'SELECTED'
    check (status in ('SELECTED', 'RESET', 'REASSIGNED', 'ADMIN_OVERRIDE')),
  selected_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (team_id)
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_email text not null,
  action text not null,
  team_id uuid,
  payment_id uuid,
  problem_id text,
  reason text,
  created_at timestamptz not null default now()
);

create table if not exists contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text not null,
  message text not null,
  created_at timestamptz not null default now()
);

create or replace function is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from admins where id = auth.uid());
$$;

create or replace function register_team(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  settings_row settings%rowtype;
  member jsonb;
  team_uuid uuid;
  reg_id text;
  female_count int := 0;
  member_count int;
  leader_email text;
  team_name_text text;
  existing_ids uuid[];
  existing_team teams%rowtype;
begin
  select * into settings_row from settings where id = 'registration';
  if settings_row is null then
    raise exception 'Registration settings are missing.';
  end if;
  if settings_row.is_active is not true then
    raise exception 'Registration is currently closed.';
  end if;

  member_count := jsonb_array_length(payload->'members');
  if member_count is distinct from settings_row.min_members
     or member_count is distinct from settings_row.max_members then
    raise exception 'A team must have exactly % members.', settings_row.min_members;
  end if;

  leader_email := lower(trim(payload->>'leader_email'));
  team_name_text := trim(payload->>'team_name');

  for member in select * from jsonb_array_elements(payload->'members')
  loop
    if coalesce(trim(member->>'full_name'), '') = ''
       or coalesce(trim(member->>'email'), '') = ''
       or coalesce(trim(member->>'phone'), '') = ''
       or coalesce(trim(member->>'gender'), '') = ''
       or coalesce(trim(member->>'college'), '') = ''
       or coalesce(trim(member->>'course'), '') = ''
       or coalesce(trim(member->>'branch'), '') = ''
       or coalesce(trim(member->>'year'), '') = ''
       or coalesce(trim(member->>'student_id'), '') = '' then
      raise exception 'Every member must include name, email, phone, gender, college, course, branch, year, and student ID.';
    end if;
    if (member->>'gender') = 'Female' then
      female_count := female_count + 1;
    end if;
  end loop;

  if settings_row.female_required and female_count < 1 then
    raise exception 'At least one female member is required.';
  end if;

  select array_agg(distinct t.id) into existing_ids
  from teams t
  left join members m on m.team_id = t.id
  where t.registration_status <> 'CANCELLED'
    and (
      t.leader_email = leader_email
      or t.team_name = team_name_text
      or m.email in (select lower(trim(x->>'email')) from jsonb_array_elements(payload->'members') x)
      or lower(trim(m.student_id)) in (select lower(trim(x->>'student_id')) from jsonb_array_elements(payload->'members') x)
    );

  if existing_ids is not null and array_length(existing_ids, 1) > 1 then
    raise exception 'One or more emails or student IDs are already used on another team.';
  end if;

  if existing_ids is not null and array_length(existing_ids, 1) = 1 then
    select * into existing_team from teams where id = existing_ids[1];

    if existing_team.registration_status = 'CONFIRMED' or existing_team.payment_status = 'SUCCESS' then
      raise exception 'This email is already registered on a confirmed team (%).', existing_team.registration_id;
    end if;

    if existing_team.payment_status = 'PROCESSING' then
      return jsonb_build_object(
        'team_id', existing_team.id,
        'registration_id', existing_team.registration_id
      );
    end if;

    update teams
       set team_name = team_name_text,
           college = trim(payload->>'college'),
           university = trim(payload->>'university'),
           city = trim(payload->>'city'),
           state = trim(payload->>'state'),
           leader_name = trim(payload->>'leader_name'),
           leader_email = leader_email,
           leader_phone = trim(payload->>'leader_phone'),
           leader_gender = payload->>'leader_gender',
           updated_at = now()
     where id = existing_team.id;

    delete from members where team_id = existing_team.id;

    insert into members (
      team_id, is_leader, full_name, email, phone, gender, college, course, branch, year, student_id
    )
    select
      existing_team.id,
      lower(trim(m->>'email')) = leader_email,
      trim(m->>'full_name'),
      lower(trim(m->>'email')),
      trim(m->>'phone'),
      m->>'gender',
      trim(m->>'college'),
      trim(m->>'course'),
      trim(m->>'branch'),
      trim(m->>'year'),
      trim(m->>'student_id')
    from jsonb_array_elements(payload->'members') as m;

    if not exists (select 1 from members where team_id = existing_team.id and is_leader) then
      raise exception 'The team leader must also be listed as a member.';
    end if;

    return jsonb_build_object(
      'team_id', existing_team.id,
      'registration_id', existing_team.registration_id
    );
  end if;

  team_uuid := gen_random_uuid();
  reg_id := 'SIH26-TEAM-' || lpad(nextval('team_registration_seq')::text, 3, '0');

  insert into teams (
    id, registration_id, team_name, college, university, city, state,
    leader_name, leader_email, leader_phone, leader_gender
  ) values (
    team_uuid,
    reg_id,
    team_name_text,
    trim(payload->>'college'),
    trim(payload->>'university'),
    trim(payload->>'city'),
    trim(payload->>'state'),
    trim(payload->>'leader_name'),
    leader_email,
    trim(payload->>'leader_phone'),
    payload->>'leader_gender'
  );

  insert into members (
    team_id, is_leader, full_name, email, phone, gender, college, course, branch, year, student_id
  )
  select
    team_uuid,
    lower(trim(m->>'email')) = leader_email,
    trim(m->>'full_name'),
    lower(trim(m->>'email')),
    trim(m->>'phone'),
    m->>'gender',
    trim(m->>'college'),
    trim(m->>'course'),
    trim(m->>'branch'),
    trim(m->>'year'),
    trim(m->>'student_id')
  from jsonb_array_elements(payload->'members') as m;

  if not exists (select 1 from members where team_id = team_uuid and is_leader) then
    raise exception 'The team leader must also be listed as a member.';
  end if;

  return jsonb_build_object(
    'team_id', team_uuid,
    'registration_id', reg_id
  );
exception
  when unique_violation then
    if sqlerrm ilike '%members_email%' or sqlerrm ilike '%leader_email%' then
      raise exception 'This email is already registered. Continue the existing team or use a different email.';
    elsif sqlerrm ilike '%student_id%' then
      raise exception 'This student ID is already registered with another team.';
    elsif sqlerrm ilike '%team_name%' then
      raise exception 'This team name is already taken. Use a different name or continue the existing registration.';
    else
      raise exception 'This team is already registered. Use different details or continue the existing registration.';
    end if;
end;
$$;

create or replace function get_team(p_team_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'team', to_jsonb(t),
    'members', coalesce((
      select jsonb_agg(to_jsonb(m) order by m.is_leader desc, m.created_at)
      from members m where m.team_id = t.id
    ), '[]'::jsonb)
  )
  from teams t
  where t.id = p_team_id;
$$;

create or replace function start_payment(p_team_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  team_row teams%rowtype;
  settings_row settings%rowtype;
  pay_id uuid;
  order_code text;
begin
  select * into team_row from teams where id = p_team_id;
  if team_row.id is null then
    raise exception 'Team not found.';
  end if;
  if team_row.registration_status = 'CANCELLED' then
    raise exception 'This registration was cancelled.';
  end if;
  if team_row.payment_status = 'SUCCESS' then
    raise exception 'This team is already paid.';
  end if;

  select * into settings_row from settings where id = 'registration';
  pay_id := gen_random_uuid();
  order_code := team_row.registration_id || '-' || extract(epoch from now())::bigint::text;

  insert into payments (id, team_id, registration_id, team_name, order_id, amount, currency, status)
  values (pay_id, team_row.id, team_row.registration_id, team_row.team_name, order_code, settings_row.fee, settings_row.currency, 'PROCESSING');

  update teams
     set payment_status = 'PROCESSING', updated_at = now()
   where id = team_row.id;

  return jsonb_build_object(
    'payment_id', pay_id,
    'order_id', order_code,
    'amount', settings_row.fee,
    'currency', settings_row.currency
  );
end;
$$;

alter table settings enable row level security;
alter table admins enable row level security;
alter table problems enable row level security;
alter table teams enable row level security;
alter table members enable row level security;
alter table payments enable row level security;
alter table problem_selections enable row level security;
alter table audit_logs enable row level security;
alter table contact_messages enable row level security;

drop policy if exists settings_public_read on settings;
create policy settings_public_read on settings for select using (true);
drop policy if exists settings_admin_write on settings;
create policy settings_admin_write on settings for all to authenticated using (is_admin()) with check (is_admin());

drop policy if exists admins_self_read on admins;
create policy admins_self_read on admins for select to authenticated using (id = auth.uid() or is_admin());

drop policy if exists problems_public_read on problems;
create policy problems_public_read on problems for select using (true);
drop policy if exists problems_admin_write on problems;
create policy problems_admin_write on problems for all to authenticated using (is_admin()) with check (is_admin());

drop policy if exists teams_admin_all on teams;
create policy teams_admin_all on teams for all to authenticated using (is_admin()) with check (is_admin());
drop policy if exists members_admin_all on members;
create policy members_admin_all on members for all to authenticated using (is_admin()) with check (is_admin());
drop policy if exists payments_admin_all on payments;
create policy payments_admin_all on payments for all to authenticated using (is_admin()) with check (is_admin());
drop policy if exists selections_admin_all on problem_selections;
create policy selections_admin_all on problem_selections for all to authenticated using (is_admin()) with check (is_admin());
drop policy if exists audit_admin_all on audit_logs;
create policy audit_admin_all on audit_logs for all to authenticated using (is_admin()) with check (is_admin());

drop policy if exists contact_public_insert on contact_messages;
create policy contact_public_insert on contact_messages for insert with check (true);
drop policy if exists contact_admin_read on contact_messages;
create policy contact_admin_read on contact_messages for select to authenticated using (is_admin());

create or replace function select_problem(p_team_id uuid, p_problem_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  team_row teams%rowtype;
  problem_row problems%rowtype;
  taken int;
  cap int;
begin
  select * into team_row from teams where id = p_team_id for update;
  if team_row.id is null then
    raise exception 'Team not found.';
  end if;
  if team_row.registration_status <> 'CONFIRMED' or team_row.payment_status <> 'SUCCESS' then
    raise exception 'Complete payment before selecting a problem.';
  end if;
  if team_row.selected_problem_id is not null then
    raise exception 'This team already selected a problem.';
  end if;

  select * into problem_row from problems where id = p_problem_id for update;
  if problem_row.id is null then
    raise exception 'Problem not found.';
  end if;
  if problem_row.status in ('LOCKED', 'INACTIVE') then
    raise exception 'This problem is not available.';
  end if;

  cap := least(coalesce(problem_row.max_selections, 2), 2);

  select count(*) into taken
  from problem_selections
  where problem_id = p_problem_id
    and status = 'SELECTED';

  if taken >= cap then
    update problems
       set selected_count = taken,
           status = 'FULL'
     where id = p_problem_id;
    raise exception 'This problem already has two teams.';
  end if;

  insert into problem_selections (team_id, problem_id, status)
  values (p_team_id, p_problem_id, 'SELECTED');

  update teams
     set selected_problem_id = p_problem_id,
         selected_problem_title = problem_row.title,
         updated_at = now()
   where id = p_team_id;

  update problems
     set selected_count = taken + 1,
         status = case when taken + 1 >= cap then 'FULL' else 'AVAILABLE' end,
         max_selections = 2
   where id = p_problem_id;

  return jsonb_build_object(
    'ok', true,
    'problem_id', p_problem_id,
    'selected_count', taken + 1,
    'max_selections', 2
  );
end;
$$;

create unique index if not exists payments_utr_unique
  on payments (transaction_id)
  where transaction_id is not null and btrim(transaction_id) <> '';

create or replace function submit_payment_utr(p_team_id uuid, p_utr text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  team_row teams%rowtype;
  settings_row settings%rowtype;
  pay_id uuid;
  utr text;
begin
  utr := upper(trim(p_utr));
  if utr is null or char_length(utr) < 6 then
    raise exception 'Enter a valid UTR / transaction number.';
  end if;

  select * into team_row from teams where id = p_team_id;
  if team_row.id is null then
    raise exception 'Team not found.';
  end if;
  if team_row.registration_status = 'CANCELLED' then
    raise exception 'This registration was cancelled.';
  end if;
  if team_row.payment_status = 'SUCCESS' then
    raise exception 'This team is already verified.';
  end if;
  if team_row.payment_status = 'PROCESSING' then
    raise exception 'UTR already submitted. Please wait for confirmation.';
  end if;
  if exists (select 1 from payments where transaction_id = utr) then
    raise exception 'This UTR / transaction number is already used.';
  end if;

  select * into settings_row from settings where id = 'registration';
  pay_id := gen_random_uuid();

  insert into payments (id, team_id, registration_id, team_name, order_id, transaction_id, amount, currency, status)
  values (
    pay_id,
    team_row.id,
    team_row.registration_id,
    team_row.team_name,
    team_row.registration_id || '-' || extract(epoch from now())::bigint::text,
    utr,
    settings_row.fee,
    settings_row.currency,
    'PROCESSING'
  );

  update teams
     set payment_status = 'PROCESSING', updated_at = now()
   where id = team_row.id;

  return jsonb_build_object(
    'payment_id', pay_id,
    'utr', utr,
    'amount', settings_row.fee
  );
end;
$$;

grant execute on function register_team(jsonb) to anon, authenticated;
grant execute on function get_team(uuid) to anon, authenticated;
grant execute on function start_payment(uuid) to anon, authenticated;
grant execute on function submit_payment_utr(uuid, text) to anon, authenticated;
grant execute on function select_problem(uuid, text) to anon, authenticated;
grant execute on function is_admin() to authenticated;

do $$
begin
  begin
    alter publication supabase_realtime add table teams;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table members;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table payments;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table problems;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table problem_selections;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table settings;
  exception when duplicate_object then null;
  end;
end $$;
