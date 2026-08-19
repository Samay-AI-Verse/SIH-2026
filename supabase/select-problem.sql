-- Problem selection: max 2 teams per statement, live and atomic.
-- Run this in the Supabase SQL editor.

update problems set max_selections = 2;

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

  cap := coalesce(problem_row.max_selections, 2);
  if cap > 2 then
    cap := 2;
  end if;

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

grant execute on function select_problem(uuid, text) to anon, authenticated;

do $$
begin
  begin
    alter publication supabase_realtime add table problems;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table problem_selections;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table teams;
  exception when duplicate_object then null;
  end;
end $$;
