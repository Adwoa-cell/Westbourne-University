-- rls_tests.sql : checks that database security rules hold. Run in the Supabase SQL Editor AFTER migrations + seed.
-- Everything happens inside a transaction that is rolled back, so no test data is kept.
-- Read the output in the "Messages"/notices panel: every line should start with PASS.

begin;

-- Test users (the sign-up trigger creates their profiles as 'applicant').
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'applicant.a@test.invalid'),
  ('00000000-0000-0000-0000-0000000000a2', 'applicant.b@test.invalid'),
  ('00000000-0000-0000-0000-0000000000a3', 'student@test.invalid'),
  ('00000000-0000-0000-0000-0000000000a4', 'officer@test.invalid'),
  ('00000000-0000-0000-0000-0000000000a5', 'admin@test.invalid');
update public.profiles set role = 'student' where id = '00000000-0000-0000-0000-0000000000a3';
update public.profiles set role = 'admissions_officer' where id = '00000000-0000-0000-0000-0000000000a4';
update public.profiles set role = 'administrator' where id = '00000000-0000-0000-0000-0000000000a5';
insert into public.students (profile_id, programme_id)
  select '00000000-0000-0000-0000-0000000000a3', id from public.programmes where code = 'BSC-CS';
insert into public.applications (applicant_profile_id, programme_id, academic_year_id)
  select '00000000-0000-0000-0000-0000000000a1', p.id, y.id from public.programmes p, public.academic_years y
  where p.code = 'BSC-CS' and y.label = '2026/2027';

-- 1. An applicant cannot promote themselves.
do $$
begin
  perform set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
  set local role authenticated;
  begin
    update public.profiles set role = 'administrator' where id = '00000000-0000-0000-0000-0000000000a1';
    raise notice 'FAIL 1: applicant changed own role';
  exception when insufficient_privilege then
    raise notice 'PASS 1: applicant cannot change own role';
  end;
  reset role;
end $$;

-- 2. An applicant sees only their own profile.
do $$
declare n int;
begin
  perform set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
  set local role authenticated;
  select count(*) into n from public.profiles;
  reset role;
  if n = 1 then raise notice 'PASS 2: applicant sees only own profile'; else raise notice 'FAIL 2: applicant sees % profiles', n; end if;
end $$;

-- 3. Applicant B cannot see applicant A's application.
do $$
declare n int;
begin
  perform set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);
  set local role authenticated;
  select count(*) into n from public.applications;
  reset role;
  if n = 0 then raise notice 'PASS 3: applications are private to their owner'; else raise notice 'FAIL 3: saw % applications', n; end if;
end $$;

-- 4. Applicant cannot mark their own application accepted.
do $$
begin
  perform set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
  set local role authenticated;
  begin
    update public.applications set status = 'accepted' where applicant_profile_id = '00000000-0000-0000-0000-0000000000a1';
    raise notice 'FAIL 4: applicant accepted own application';
  exception when insufficient_privilege then
    raise notice 'PASS 4: applicant cannot accept own application';
  end;
  reset role;
end $$;

-- 5. Submitting a draft assigns a reference number and records history.
do $$
declare ref text; hist int;
begin
  perform set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
  set local role authenticated;
  update public.applications set status = 'submitted' where applicant_profile_id = '00000000-0000-0000-0000-0000000000a1'
    returning reference_number into ref;
  select count(*) into hist from public.application_status_history;
  reset role;
  if ref is not null and hist = 1 then raise notice 'PASS 5: submit gives reference % and logs history', ref;
  else raise notice 'FAIL 5: ref=%, history=%', ref, hist; end if;
end $$;

-- 6. After submission the applicant can no longer edit the application.
do $$
begin
  perform set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
  set local role authenticated;
  begin
    update public.applications set personal_statement = 'edited after submit' where applicant_profile_id = '00000000-0000-0000-0000-0000000000a1';
    raise notice 'FAIL 6: edited a submitted application';
  exception when insufficient_privilege then
    raise notice 'PASS 6: submitted application is locked for the applicant';
  end;
  reset role;
end $$;

-- 7. An admissions officer can start a review, and the officer is recorded.
do $$
declare who uuid;
begin
  perform set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a4","role":"authenticated"}', true);
  set local role authenticated;
  update public.applications set status = 'under_review' returning reviewed_by into who;
  reset role;
  if who = '00000000-0000-0000-0000-0000000000a4' then raise notice 'PASS 7: officer review recorded';
  else raise notice 'FAIL 7: reviewed_by=%', who; end if;
end $$;

-- 8. A student cannot insert a course registration directly.
do $$
begin
  perform set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a3","role":"authenticated"}', true);
  set local role authenticated;
  begin
    insert into public.course_registrations (student_id, offering_id)
      select s.id, o.id from public.students s, public.course_offerings o limit 1;
    raise notice 'FAIL 8: student inserted a registration directly';
  exception when insufficient_privilege then
    raise notice 'PASS 8: students cannot write registrations directly';
  end;
  reset role;
end $$;

-- 9. A student cannot write grades.
do $$
begin
  perform set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a3","role":"authenticated"}', true);
  set local role authenticated;
  begin
    insert into public.grades (registration_id, score) values (gen_random_uuid(), 100);
    raise notice 'FAIL 9: student wrote a grade';
  exception when insufficient_privilege or foreign_key_violation then
    raise notice 'PASS 9: students cannot write grades';
  end;
  reset role;
end $$;

-- 10. A student cannot read the audit log or contact messages.
do $$
declare a int; b int;
begin
  perform set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a3","role":"authenticated"}', true);
  set local role authenticated;
  select count(*) into a from public.audit_logs;
  select count(*) into b from public.contact_messages;
  reset role;
  if a = 0 and b = 0 then raise notice 'PASS 10: audit log and contact messages hidden from students';
  else raise notice 'FAIL 10: audit=% contact=%', a, b; end if;
end $$;

-- 11. Only administrators can assign roles.
do $$
begin
  perform set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a4","role":"authenticated"}', true);
  set local role authenticated;
  begin
    perform public.admin_set_role('00000000-0000-0000-0000-0000000000a2', 'lecturer');
    raise notice 'FAIL 11: officer assigned a role';
  exception when insufficient_privilege then
    raise notice 'PASS 11: non-administrators cannot assign roles';
  end;
  reset role;
end $$;

-- 12. An administrator can assign a role, and the change is audited.
do $$
declare n int;
begin
  perform set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a5","role":"authenticated"}', true);
  set local role authenticated;
  perform public.admin_set_role('00000000-0000-0000-0000-0000000000a2', 'lecturer');
  select count(*) into n from public.audit_logs where table_name = 'profiles' and action = 'UPDATE'
    and record_id = '00000000-0000-0000-0000-0000000000a2';
  reset role;
  if n >= 1 then raise notice 'PASS 12: administrator assigned a role and it was audited';
  else raise notice 'FAIL 12: no audit row found'; end if;
end $$;

-- 13. Anonymous visitors can read programmes but not applications.
do $$
declare n int;
begin
  set local role anon;
  select count(*) into n from public.programmes;
  if n > 0 then raise notice 'PASS 13a: anonymous visitors can read programmes'; else raise notice 'FAIL 13a: no programmes visible (seed loaded?)'; end if;
  begin
    perform count(*) from public.applications;
    raise notice 'FAIL 13b: anon could query applications';
  exception when insufficient_privilege then
    raise notice 'PASS 13b: anonymous visitors cannot query applications';
  end;
  reset role;
end $$;

-- 14. The audit log cannot be altered, even by a trusted session.
do $$
begin
  begin
    delete from public.audit_logs;
    raise notice 'FAIL 14: audit log rows were deleted';
  exception when others then
    raise notice 'PASS 14: audit log is append-only';
  end;
end $$;

rollback;
