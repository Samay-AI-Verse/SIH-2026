-- Resume incomplete registrations instead of failing on duplicate emails.
-- Run this in the Supabase SQL editor.

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
