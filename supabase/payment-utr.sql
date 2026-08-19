-- UTR / QR payment (run in Supabase SQL editor)
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

grant execute on function submit_payment_utr(uuid, text) to anon, authenticated;
