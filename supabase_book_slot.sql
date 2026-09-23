-- Atomic slot booking RPC. Run once in the Supabase SQL Editor.
create or replace function public.book_slot(
  p_farmer_id uuid,
  p_centre_id text,
  p_slot_id uuid,
  p_date date,
  p_crop_type text,
  p_estimated_quantity_quintals numeric,
  p_vehicle_no text,
  p_msp_rate_per_quintal numeric
)
returns public.bookings
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_slot public.slots;
  v_queue public.queue_state;
  v_token integer;
  v_booking public.bookings;
begin
  if auth.uid() is null or auth.uid() <> p_farmer_id then
    raise exception 'Only the authenticated farmer can create their booking';
  end if;

  select * into v_slot
  from public.slots
  where id = p_slot_id
    and centre_id = p_centre_id
    and date = p_date
  for update;

  if not found then
    raise exception 'Selected slot was not found';
  end if;

  if v_slot.booked_count >= v_slot.total_capacity then
    raise exception 'Selected slot is full';
  end if;

  select * into v_queue
  from public.queue_state
  where centre_id = p_centre_id and date = p_date
  for update;

  if not found then
    insert into public.queue_state (centre_id, date, current_serving_token, total_tokens_issued, average_minutes_per_token, counter_status)
    values (p_centre_id, p_date, 0, 0, 3, 'active')
    returning * into v_queue;
  end if;

  v_token := v_queue.total_tokens_issued + 1;

  update public.slots
  set booked_count = booked_count + 1, updated_at = now()
  where id = p_slot_id;

  update public.queue_state
  set total_tokens_issued = v_token, updated_at = now()
  where centre_id = p_centre_id and date = p_date;

  insert into public.bookings (
    farmer_id, centre_id, slot_id, date, token_date, token_number,
    crop_type, estimated_quantity_quintals, msp_rate_per_quintal,
    vehicle_no, status, payment_status
  ) values (
    p_farmer_id, p_centre_id, p_slot_id, p_date, p_date, v_token,
    p_crop_type, p_estimated_quantity_quintals, p_msp_rate_per_quintal,
    p_vehicle_no, 'slot_booked', 'pending'
  ) returning * into v_booking;

  return v_booking;
end;
$$;

create or replace function public.advance_queue(p_centre_id text, p_date date)
returns public.queue_state
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_queue public.queue_state;
begin
  select * into v_queue
  from public.queue_state
  where centre_id = p_centre_id and date = p_date
  for update;

  if not found then
    raise exception 'Queue state was not found';
  end if;

  update public.queue_state
  set current_serving_token = least(current_serving_token + 1, total_tokens_issued), updated_at = now()
  where centre_id = p_centre_id and date = p_date
  returning * into v_queue;

  return v_queue;
end;
$$;
