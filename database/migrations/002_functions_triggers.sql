-- 002_functions_triggers.sql : role helpers, new-user profile, application workflow guard, audit trail.

-- ---------- Role helpers (used by RLS policies) ----------
-- SECURITY DEFINER lets these read profiles without being blocked by profiles' own RLS (which would recurse).
create or replace function public.auth_role() returns public.app_role
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.auth_role() = 'administrator', false)
$$;

create or replace function public.is_admissions() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.auth_role() in ('admissions_officer', 'administrator'), false)
$$;

create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.auth_role() in ('admissions_officer', 'lecturer', 'administrator'), false)
$$;

-- ---------- New sign-up creates a profile ----------
-- The role is ALWAYS 'applicant'. We never read a role from user-supplied sign-up metadata.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(left(new.raw_user_meta_data ->> 'full_name', 120), ''));
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Administrators assign roles ----------
create or replace function public.admin_set_role(target uuid, new_role public.app_role) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'Only administrators can change roles' using errcode = '42501';
  end if;
  if target = auth.uid() then
    raise exception 'Administrators cannot change their own role' using errcode = '42501';
  end if;
  update public.profiles set role = new_role where id = target;
  if not found then
    raise exception 'User not found' using errcode = 'P0002';
  end if;
end $$;

-- ---------- Application reference numbers ----------
create or replace function public.generate_application_reference() returns text
language sql security definer set search_path = public as $$
  select format('WU-%s-%s', to_char(current_date, 'YYYY'), lpad(nextval('public.application_ref_seq')::text, 6, '0'))
$$;

-- ---------- Application workflow guard ----------
-- Enforces who may change what and which status moves are legal, even if the API has a bug.
-- Maintenance sessions (SQL editor / migrations run as postgres) are exempt.
create or replace function public.applications_guard() returns trigger
language plpgsql set search_path = public as $$
declare
  v_ok boolean;
begin
  if current_user in ('postgres', 'supabase_admin') then
    return new;
  end if;

  if public.is_admissions() then
    -- Staff review applications but never edit what the applicant entered.
    if new.programme_id is distinct from old.programme_id
       or new.academic_year_id is distinct from old.academic_year_id
       or new.applicant_profile_id is distinct from old.applicant_profile_id
       or new.education is distinct from old.education
       or new.personal_statement is distinct from old.personal_statement then
      raise exception 'Staff cannot edit applicant-entered content' using errcode = '42501';
    end if;
  else
    if old.status not in ('draft', 'additional_information_required') then
      raise exception 'This application can no longer be edited' using errcode = '42501';
    end if;
    if new.applicant_profile_id is distinct from old.applicant_profile_id
       or new.reference_number is distinct from old.reference_number
       or new.submitted_at is distinct from old.submitted_at
       or new.decided_at is distinct from old.decided_at
       or new.reviewed_by is distinct from old.reviewed_by
       or new.info_request is distinct from old.info_request then
      raise exception 'Protected application fields cannot be changed' using errcode = '42501';
    end if;
  end if;

  if new.status is distinct from old.status then
    v_ok := case
      when old.status = 'draft' and new.status = 'submitted'
        then new.applicant_profile_id = auth.uid()
      when old.status = 'additional_information_required' and new.status = 'submitted'
        then new.applicant_profile_id = auth.uid()
      when old.status = 'submitted' and new.status = 'under_review'
        then public.is_admissions()
      when old.status = 'under_review' and new.status in ('additional_information_required', 'accepted', 'rejected')
        then public.is_admissions()
      when old.status = 'additional_information_required' and new.status in ('under_review', 'rejected')
        then public.is_admissions()
      else false
    end;
    if not coalesce(v_ok, false) then
      raise exception 'Invalid application status change: % to %', old.status, new.status using errcode = '42501';
    end if;

    if new.status = 'additional_information_required' and coalesce(btrim(new.info_request), '') = '' then
      raise exception 'Say what additional information is required' using errcode = '23514';
    end if;
    if new.status = 'submitted' then
      new.submitted_at := now();
      if new.reference_number is null then
        new.reference_number := public.generate_application_reference();
      end if;
    end if;
    if new.status = 'under_review' and new.reviewed_by is null then
      new.reviewed_by := auth.uid();
    end if;
    if new.status in ('accepted', 'rejected') then
      new.decided_at := now();
      new.reviewed_by := auth.uid();
    end if;
  end if;
  return new;
end $$;

create trigger trg_applications_guard
  before update on public.applications
  for each row execute function public.applications_guard();

-- Records every status change and who made it (SECURITY DEFINER: users cannot write history directly).
create or replace function public.log_application_status() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status then
    insert into public.application_status_history (application_id, from_status, to_status, changed_by)
    values (new.id, old.status, new.status, auth.uid());
  end if;
  return null;
end $$;

create trigger trg_applications_status_log
  after update on public.applications
  for each row execute function public.log_application_status();

-- ---------- Audit trail ----------
create or replace function public.audit_row_change() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  old_j jsonb;
  new_j jsonb;
begin
  if tg_op = 'INSERT' then
    new_j := to_jsonb(new);
  elsif tg_op = 'UPDATE' then
    old_j := to_jsonb(old);
    new_j := to_jsonb(new);
    if old_j = new_j then
      return null;
    end if;
  else
    old_j := to_jsonb(old);
  end if;
  insert into public.audit_logs (actor_id, action, table_name, record_id, old_data, new_data)
  values (auth.uid(), tg_op, tg_table_name, coalesce(new_j ->> 'id', old_j ->> 'id'), old_j, new_j);
  return null;
end $$;

do $$
declare t text;
begin
  foreach t in array array['profiles', 'faculties', 'programmes', 'semesters', 'cutoff_points', 'students',
                           'courses', 'course_offerings', 'grades', 'announcements', 'calendar_events']
  loop
    execute format('create trigger trg_%1$s_audit after insert or update or delete on public.%1$I for each row execute function public.audit_row_change()', t);
  end loop;
end $$;

-- The audit log is append-only.
create or replace function public.audit_logs_immutable() returns trigger
language plpgsql as $$
begin
  raise exception 'audit_logs is append-only';
end $$;

create trigger trg_audit_logs_immutable
  before update or delete on public.audit_logs
  for each row execute function public.audit_logs_immutable();

-- ---------- Function permissions ----------
-- New functions are executable by everyone by default; tighten that.
revoke execute on all functions in schema public from public, anon;
grant execute on function public.auth_role(), public.is_admin(), public.is_admissions(), public.is_staff(),
  public.admin_set_role(uuid, public.app_role), public.generate_application_reference() to authenticated;
