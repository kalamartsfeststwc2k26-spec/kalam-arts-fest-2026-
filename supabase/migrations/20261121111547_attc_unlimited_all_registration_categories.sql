DO $preflight$
BEGIN
 IF md5(pg_get_functiondef('public.enforce_registration_eligibility()'::regprocedure)) <> 'e482558eb75d4cac64f67360b7a9ec62'
 OR md5(pg_get_functiondef('public.protect_event_registration_limits()'::regprocedure)) <> '1ab4e3b6cf8580be7d8519a6ceed970c'
 OR md5(pg_get_functiondef('public.protect_attc_registrations()'::regprocedure)) <> '894c113dd109eb9c53626316fca52e31'
 OR md5(pg_get_functiondef('public.registration_limit_bucket(text,text)'::regprocedure)) <> '0a997df8a6ea827db1833efa18811f4f'
 OR md5(pg_get_functiondef('public.guard_attc_membership()'::regprocedure)) <> 'e90895fb76cebd574aa2ac66113eee6a'
 OR md5(pg_get_functiondef('public.protect_event_eligibility()'::regprocedure)) <> '27b43a9d07089b66b891106adb27b280'
 THEN RAISE EXCEPTION 'Production functions changed; stop and inspect'; END IF;
END $preflight$;
CREATE OR REPLACE FUNCTION public.enforce_registration_eligibility()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  student_is_attc boolean;
  event_type text;
  event_stage text;
  event_published boolean;
  bucket text;
  existing_count integer;
  maximum integer;
begin
  select is_attc into student_is_attc from public.students where id = new.student_id for update;
  select competition_type, stage_type, is_published into event_type, event_stage, event_published from public.events where id = new.event_id for share;
  if student_is_attc is null or event_type is null then raise exception 'Student or event not found' using errcode = '23503'; end if;
  if not event_published then raise exception 'Registration is unavailable until the event is published' using errcode = '23514'; end if;
  if event_type = 'ATTC' and not student_is_attc then raise exception 'Only ATTC-category students may register for ATTC-category programmes' using errcode = '23514'; end if;
  if event_type = 'ATTC' and event_stage is null then raise exception 'Set the ATTC programme stage format before registering students' using errcode = '23514'; end if;
  bucket := public.registration_limit_bucket(event_type, event_stage);
  maximum := case bucket when 'General' then 4 else 3 end;
  select count(*) into existing_count from public.registrations r join public.events e on e.id = r.event_id where r.student_id = new.student_id and r.id is distinct from new.id and public.registration_limit_bucket(e.competition_type, e.stage_type) = bucket;
  if existing_count >= maximum and not student_is_attc then raise exception 'Student registration limit reached: maximum % % programmes', maximum, bucket using errcode = '23514'; end if;
  new.created_by := auth.uid();
  return new;
end;
$function$;
CREATE OR REPLACE FUNCTION public.protect_event_registration_limits()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'pg_temp'
AS $function$
declare bucket text; maximum integer; registered_student record; other_count integer;
begin
  if new.competition_type is not distinct from old.competition_type and new.stage_type is not distinct from old.stage_type then return new; end if;
  if new.competition_type = 'ATTC' and new.stage_type is null and exists(select 1 from public.registrations where event_id = new.id) then raise exception 'Set the ATTC programme stage format before registering students' using errcode = '23514'; end if;
  bucket := public.registration_limit_bucket(new.competition_type, new.stage_type);
  if bucket is not distinct from public.registration_limit_bucket(old.competition_type, old.stage_type) then return new; end if;
  maximum := case bucket when 'General' then 4 else 3 end;
  for registered_student in select s.id, s.is_attc from public.students s where exists(select 1 from public.registrations r where r.student_id = s.id and r.event_id = new.id) order by s.id for update loop
    select count(*) into other_count from public.registrations r join public.events e on e.id = r.event_id where r.student_id = registered_student.id and r.event_id <> new.id and public.registration_limit_bucket(e.competition_type, e.stage_type) = bucket;
    if other_count >= maximum and not registered_student.is_attc then raise exception 'Event category change exceeds student registration limit: maximum % % programmes', maximum, bucket using errcode = '23514'; end if;
  end loop;
  return new;
end;
$function$;
CREATE OR REPLACE FUNCTION public.protect_attc_registrations()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  if not new.is_attc and exists(select 1 from public.registrations r join public.events e on e.id=r.event_id where r.student_id=new.id and e.competition_type='ATTC') then raise exception 'Cannot remove ATTC membership: student has an ATTC-category registration' using errcode='23514'; end if;
  if old.is_attc and not new.is_attc and (select count(*) from public.registrations r join public.events e on e.id=r.event_id where r.student_id=new.id and public.registration_limit_bucket(e.competition_type,e.stage_type)='Non-stage') > 3 then raise exception 'Cannot remove ATTC membership: student has more than 3 Non-stage registrations' using errcode='23514'; end if;
  if old.is_attc and not new.is_attc and (select count(*) from public.registrations r join public.events e on e.id=r.event_id where r.student_id=new.id and public.registration_limit_bucket(e.competition_type,e.stage_type)='On-stage') > 3 then raise exception 'Cannot remove ATTC membership: student has more than 3 On-stage registrations' using errcode='23514'; end if;
  if old.is_attc and not new.is_attc and (select count(*) from public.registrations r join public.events e on e.id=r.event_id where r.student_id=new.id and public.registration_limit_bucket(e.competition_type,e.stage_type)='General') > 4 then raise exception 'Cannot remove ATTC membership: student has more than 4 General registrations' using errcode='23514'; end if;
  return new;
end;
$function$;