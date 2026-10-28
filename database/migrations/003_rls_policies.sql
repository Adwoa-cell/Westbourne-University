-- 003_rls_policies.sql : table grants, Row Level Security policies and private document storage.
--
-- Two locks protect every table:
--   1. GRANTs say which operations a role may attempt at all (and on which columns).
--   2. RLS policies say which ROWS that role may see or change.
-- A table with RLS enabled and no matching policy is closed to that role.
-- The Express backend's service-role key bypasses RLS; the browser only ever holds the anon key + the user's JWT.

do $$
declare t text;
begin
  foreach t in array array['profiles', 'faculties', 'programmes', 'academic_years', 'semesters', 'admission_requirements',
    'cutoff_points', 'students', 'applicants', 'applications', 'application_documents', 'application_status_history',
    'application_notes', 'courses', 'programme_courses', 'course_prerequisites', 'course_offerings',
    'course_registrations', 'grades', 'announcements', 'notifications', 'calendar_events', 'contact_messages', 'audit_logs']
  loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- ---------- Grants (least privilege) ----------
revoke all on all tables in schema public from anon, authenticated;

-- Public website data (anonymous visitors)
grant select on public.faculties, public.programmes, public.admission_requirements, public.cutoff_points,
  public.academic_years, public.calendar_events, public.announcements to anon;

-- Signed-in users: reads (rows are still filtered by policies)
grant select on public.faculties, public.programmes, public.admission_requirements, public.cutoff_points,
  public.academic_years, public.calendar_events, public.announcements, public.profiles, public.students,
  public.applicants, public.applications, public.application_documents, public.application_status_history,
  public.application_notes, public.courses, public.programme_courses, public.course_prerequisites,
  public.semesters, public.course_offerings, public.course_registrations, public.grades, public.notifications,
  public.audit_logs, public.contact_messages to authenticated;

-- Signed-in users: writes. Policies below decide who actually succeeds.
grant insert, update, delete on public.faculties, public.programmes, public.academic_years, public.semesters,
  public.courses, public.programme_courses, public.course_prerequisites, public.course_offerings,
  public.announcements, public.calendar_events, public.admission_requirements, public.cutoff_points to authenticated;
grant insert, update on public.students, public.applicants, public.grades to authenticated;
grant insert, update, delete on public.applications to authenticated;
grant insert, delete on public.application_documents to authenticated;
grant insert on public.application_notes to authenticated;
-- Column-level grants: nobody can change their own role, email or id through the API.
grant update (full_name, phone) on public.profiles to authenticated;
grant update (is_read) on public.notifications to authenticated;
grant update (is_handled) on public.contact_messages to authenticated;
grant usage on sequence public.student_number_seq to authenticated;
-- Course registrations: SELECT only for now. Registration writes arrive in Phase 4 together with
-- database-level rule checks (prerequisites, credit limits, deadlines); until then nobody can insert directly.

-- ---------- profiles ----------
create policy profiles_select_own on public.profiles for select to authenticated using (id = auth.uid());
create policy profiles_select_admissions on public.profiles for select to authenticated using (public.is_admissions());
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- ---------- Public reference data: everyone reads, administrators write ----------
create policy faculties_read_anon on public.faculties for select to anon using (true);
create policy faculties_read on public.faculties for select to authenticated using (true);
create policy faculties_admin on public.faculties for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy programmes_read_anon on public.programmes for select to anon using (is_active);
create policy programmes_read on public.programmes for select to authenticated using (is_active or public.is_admin());
create policy programmes_admin on public.programmes for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy years_read_anon on public.academic_years for select to anon using (true);
create policy years_read on public.academic_years for select to authenticated using (true);
create policy years_admin on public.academic_years for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy semesters_read on public.semesters for select to authenticated using (true);
create policy semesters_admin on public.semesters for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy calendar_read_anon on public.calendar_events for select to anon using (is_public);
create policy calendar_read on public.calendar_events for select to authenticated using (true);
create policy calendar_admin on public.calendar_events for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Admissions officers and administrators maintain requirements and cut-off points.
create policy requirements_read_anon on public.admission_requirements for select to anon using (true);
create policy requirements_read on public.admission_requirements for select to authenticated using (true);
create policy requirements_staff on public.admission_requirements for all to authenticated
  using (public.is_admissions()) with check (public.is_admissions());

create policy cutoffs_read_anon on public.cutoff_points for select to anon using (true);
create policy cutoffs_read on public.cutoff_points for select to authenticated using (true);
create policy cutoffs_staff on public.cutoff_points for all to authenticated
  using (public.is_admissions()) with check (public.is_admissions());

-- ---------- Announcements ----------
create policy announcements_read_anon on public.announcements for select to anon
  using (is_published and audience = 'public' and (published_at is null or published_at <= now()));
create policy announcements_read on public.announcements for select to authenticated using (
  public.is_admin()
  or (is_published and audience = 'public')
  or (is_published and audience = 'students' and public.auth_role() in ('student', 'lecturer', 'admissions_officer', 'administrator'))
  or (is_published and audience = 'staff' and public.is_staff())
);
create policy announcements_admin on public.announcements for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------- Students and applicants ----------
create policy students_select_own on public.students for select to authenticated using (profile_id = auth.uid());
create policy students_select_admissions on public.students for select to authenticated using (public.is_admissions());
create policy students_admin_write on public.students for insert to authenticated with check (public.is_admin());
create policy students_admin_update on public.students for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy applicants_select on public.applicants for select to authenticated
  using (profile_id = auth.uid() or public.is_admissions());
create policy applicants_insert_own on public.applicants for insert to authenticated with check (profile_id = auth.uid());
create policy applicants_update_own on public.applicants for update to authenticated
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- ---------- Applications ----------
create policy applications_select on public.applications for select to authenticated
  using (applicant_profile_id = auth.uid() or public.is_admissions());
create policy applications_insert_own_draft on public.applications for insert to authenticated with check (
  applicant_profile_id = auth.uid() and status = 'draft' and reference_number is null
  and submitted_at is null and decided_at is null and reviewed_by is null and info_request is null
  and public.auth_role() = 'applicant'
);
create policy applications_update_own on public.applications for update to authenticated
  using (applicant_profile_id = auth.uid()) with check (applicant_profile_id = auth.uid());
create policy applications_update_staff on public.applications for update to authenticated
  using (public.is_admissions()) with check (public.is_admissions());
create policy applications_delete_own_draft on public.applications for delete to authenticated
  using (applicant_profile_id = auth.uid() and status = 'draft');
-- (The guard trigger in 002 additionally restricts WHICH columns and status moves each role may use.)

create policy documents_select on public.application_documents for select to authenticated using (
  public.is_admissions()
  or exists (select 1 from public.applications a where a.id = application_id and a.applicant_profile_id = auth.uid())
);
create policy documents_insert_own on public.application_documents for insert to authenticated with check (
  uploaded_by = auth.uid()
  and storage_path like auth.uid()::text || '/' || application_id::text || '/%'
  and exists (select 1 from public.applications a
              where a.id = application_id and a.applicant_profile_id = auth.uid()
                and a.status in ('draft', 'additional_information_required'))
);
create policy documents_delete_own on public.application_documents for delete to authenticated using (
  exists (select 1 from public.applications a
          where a.id = application_id and a.applicant_profile_id = auth.uid()
            and a.status in ('draft', 'additional_information_required'))
);

create policy history_select on public.application_status_history for select to authenticated using (
  public.is_admissions()
  or exists (select 1 from public.applications a where a.id = application_id and a.applicant_profile_id = auth.uid())
);

-- Internal notes are never visible to applicants.
create policy notes_select on public.application_notes for select to authenticated using (public.is_admissions());
create policy notes_insert on public.application_notes for insert to authenticated
  with check (public.is_admissions() and author_id = auth.uid());

-- ---------- Courses ----------
create policy courses_read on public.courses for select to authenticated using (is_active or public.is_admin());
create policy courses_admin on public.courses for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy programme_courses_read on public.programme_courses for select to authenticated using (true);
create policy programme_courses_admin on public.programme_courses for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy prerequisites_read on public.course_prerequisites for select to authenticated using (true);
create policy prerequisites_admin on public.course_prerequisites for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy offerings_read on public.course_offerings for select to authenticated using (true);
create policy offerings_admin on public.course_offerings for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy registrations_select on public.course_registrations for select to authenticated using (
  public.is_admin()
  or exists (select 1 from public.students s where s.id = student_id and s.profile_id = auth.uid())
  or (public.auth_role() = 'lecturer'
      and exists (select 1 from public.course_offerings o where o.id = offering_id and o.lecturer_id = auth.uid()))
);

-- ---------- Grades ----------
-- Students see only their own PUBLISHED grades. Lecturers see and enter grades for courses they teach.
create policy grades_select on public.grades for select to authenticated using (
  public.is_admin()
  or (public.auth_role() = 'lecturer' and exists (
        select 1 from public.course_registrations r join public.course_offerings o on o.id = r.offering_id
        where r.id = registration_id and o.lecturer_id = auth.uid()))
  or (is_published and exists (
        select 1 from public.course_registrations r join public.students s on s.id = r.student_id
        where r.id = registration_id and s.profile_id = auth.uid()))
);
create policy grades_insert on public.grades for insert to authenticated with check (
  entered_by = auth.uid() and (
    public.is_admin()
    or (public.auth_role() = 'lecturer' and exists (
          select 1 from public.course_registrations r join public.course_offerings o on o.id = r.offering_id
          where r.id = registration_id and o.lecturer_id = auth.uid()))
  )
);
create policy grades_update on public.grades for update to authenticated
  using (
    public.is_admin()
    or (public.auth_role() = 'lecturer' and exists (
          select 1 from public.course_registrations r join public.course_offerings o on o.id = r.offering_id
          where r.id = registration_id and o.lecturer_id = auth.uid()))
  )
  with check (
    public.is_admin()
    or (public.auth_role() = 'lecturer' and exists (
          select 1 from public.course_registrations r join public.course_offerings o on o.id = r.offering_id
          where r.id = registration_id and o.lecturer_id = auth.uid()))
  );

-- ---------- Notifications, contact messages, audit ----------
create policy notifications_select_own on public.notifications for select to authenticated using (user_id = auth.uid());
create policy notifications_update_own on public.notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy contact_select on public.contact_messages for select to authenticated using (public.is_admissions());
create policy contact_update on public.contact_messages for update to authenticated
  using (public.is_admissions()) with check (public.is_admissions());

create policy audit_select_admin on public.audit_logs for select to authenticated using (public.is_admin());

-- ---------- Private storage for application documents ----------
-- Files live at  <user_id>/<application_id>/<random>.<ext>  in a PRIVATE bucket.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('application-documents', 'application-documents', false, 5242880,
        array['application/pdf', 'image/jpeg', 'image/png'])
on conflict (id) do update
  set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "application documents: read own or staff" on storage.objects for select to authenticated using (
  bucket_id = 'application-documents'
  and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admissions())
);
create policy "application documents: upload to own folder" on storage.objects for insert to authenticated with check (
  bucket_id = 'application-documents' and (storage.foldername(name))[1] = auth.uid()::text
);
create policy "application documents: delete own" on storage.objects for delete to authenticated using (
  bucket_id = 'application-documents' and (storage.foldername(name))[1] = auth.uid()::text
);
