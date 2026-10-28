-- promote_user.sql : give an existing user a role (and a student record if needed).
--
-- HOW TO USE (run in the Supabase SQL Editor, which runs as the trusted `postgres` role):
--   1. The person must already have signed up through the website and verified their email.
--   2. Edit the three values below, then run the script.
--   3. Never put real emails or this edited file in Git. Use it, then discard the edit.
--
-- This is the ONLY way to create the very first administrator. After that, administrators
-- can assign roles to others through the API (admin_set_role).

do $$
declare
  v_email      text := 'REPLACE_WITH_EMAIL@example.com';
  v_role       public.app_role := 'administrator';   -- applicant | student | admissions_officer | lecturer | administrator
  v_programme  text := 'BSC-CS';                     -- only used when v_role = 'student'
  v_profile_id uuid;
begin
  select id into v_profile_id from public.profiles where lower(email) = lower(v_email);
  if v_profile_id is null then
    raise exception 'No profile found for %. Sign up on the website first.', v_email;
  end if;

  update public.profiles set role = v_role where id = v_profile_id;

  if v_role = 'student' then
    insert into public.students (profile_id, programme_id, level, current_semester_id)
    select v_profile_id, p.id, 1, s.id
    from public.programmes p, public.semesters s
    join public.academic_years y on y.id = s.academic_year_id and y.is_current
    where p.code = v_programme and s.name = 'Semester 1'
    on conflict (profile_id) do nothing;
  end if;

  raise notice 'Done: % is now %', v_email, v_role;
end $$;
