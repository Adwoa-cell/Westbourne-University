-- 001_core_schema.sql : enums, tables, constraints and indexes.
-- Run migrations in numeric order. Security rules (RLS) are added in 003.

-- Tables created from now on get NO automatic access for the public API roles.
-- Access is granted explicitly in 003_rls_policies.sql (least privilege).
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;

create type public.app_role as enum ('applicant', 'student', 'admissions_officer', 'lecturer', 'administrator');
create type public.application_status as enum
  ('draft', 'submitted', 'under_review', 'additional_information_required', 'accepted', 'rejected');

create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

create sequence public.student_number_seq start 1;
create sequence public.application_ref_seq start 1;

-- ---------- Identity ----------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null default '' check (char_length(full_name) <= 120),
  phone text check (phone is null or char_length(phone) between 5 and 30),
  role public.app_role not null default 'applicant',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index profiles_role_idx on public.profiles (role);

-- ---------- Academic structure ----------
create table public.faculties (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[a-z0-9-]{2,20}$'),
  name text not null unique,
  summary text not null default '',
  departments text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.programmes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z0-9-]{3,20}$'),
  name text not null,
  faculty_id uuid not null references public.faculties (id) on delete restrict,
  qualification text not null check (qualification in ('Certificate', 'Diploma', 'Bachelor', 'Master')),
  duration_months integer not null check (duration_months between 1 and 120),
  study_mode text not null,
  description text not null default '',
  entry_requirements text not null default '',
  is_featured boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index programmes_faculty_idx on public.programmes (faculty_id);
create index programmes_qualification_idx on public.programmes (qualification);

create table public.academic_years (
  id uuid primary key default gen_random_uuid(),
  label text not null unique check (label ~ '^[0-9]{4}/[0-9]{4}$'),
  starts_on date not null,
  ends_on date not null,
  is_current boolean not null default false,
  check (ends_on > starts_on)
);
create unique index academic_years_one_current_idx on public.academic_years (is_current) where is_current;

create table public.semesters (
  id uuid primary key default gen_random_uuid(),
  academic_year_id uuid not null references public.academic_years (id) on delete cascade,
  name text not null,
  starts_on date not null,
  ends_on date not null,
  registration_opens_on date not null,
  registration_closes_on date not null,
  max_credit_hours integer not null default 18 check (max_credit_hours between 1 and 30),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (academic_year_id, name),
  check (ends_on > starts_on),
  check (registration_closes_on >= registration_opens_on),
  check (registration_closes_on <= ends_on)
);
create index semesters_year_idx on public.semesters (academic_year_id);

-- ---------- Admissions reference data ----------
create table public.admission_requirements (
  id uuid primary key default gen_random_uuid(),
  programme_id uuid not null references public.programmes (id) on delete cascade,
  requirement text not null check (char_length(requirement) between 3 and 500),
  sort_order integer not null default 0,
  unique (programme_id, requirement)
);
create index admission_requirements_programme_idx on public.admission_requirements (programme_id);

create table public.cutoff_points (
  id uuid primary key default gen_random_uuid(),
  programme_id uuid not null references public.programmes (id) on delete cascade,
  academic_year_id uuid not null references public.academic_years (id) on delete cascade,
  points integer check (points is null or points between 0 and 100),
  required_subjects text[] not null default '{}',
  additional_requirements text not null default '',
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (programme_id, academic_year_id)
);
create index cutoff_points_year_idx on public.cutoff_points (academic_year_id);

-- ---------- People records ----------
create table public.students (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles (id) on delete restrict,
  student_number text not null unique
    default format('WU%s%s', to_char(current_date, 'YY'), lpad(nextval('public.student_number_seq')::text, 5, '0')),
  programme_id uuid not null references public.programmes (id) on delete restrict,
  level integer not null default 1 check (level between 1 and 8),
  current_semester_id uuid references public.semesters (id) on delete set null,
  status text not null default 'active' check (status in ('active', 'deferred', 'graduated', 'withdrawn')),
  enrolled_on date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index students_programme_idx on public.students (programme_id);

create table public.applicants (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles (id) on delete cascade,
  date_of_birth date check (date_of_birth is null or date_of_birth > date '1900-01-01'),
  nationality text check (char_length(nationality) <= 80),
  address_line text check (char_length(address_line) <= 200),
  city text check (char_length(city) <= 80),
  country text check (char_length(country) <= 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- Admission applications ----------
create table public.applications (
  id uuid primary key default gen_random_uuid(),
  reference_number text unique,  -- assigned when the application is submitted
  applicant_profile_id uuid not null references public.profiles (id) on delete cascade,
  programme_id uuid not null references public.programmes (id) on delete restrict,
  academic_year_id uuid not null references public.academic_years (id) on delete restrict,
  status public.application_status not null default 'draft',
  education jsonb not null default '[]' check (jsonb_typeof(education) = 'array'),
  personal_statement text check (char_length(personal_statement) <= 4000),
  info_request text check (char_length(info_request) <= 2000),
  submitted_at timestamptz,
  decided_at timestamptz,
  reviewed_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (applicant_profile_id, programme_id, academic_year_id)
);
create index applications_status_idx on public.applications (status);
create index applications_applicant_idx on public.applications (applicant_profile_id);
create index applications_programme_idx on public.applications (programme_id);

create table public.application_documents (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications (id) on delete cascade,
  uploaded_by uuid not null references public.profiles (id) on delete cascade,
  document_type text not null check (document_type in ('identification', 'academic_results', 'cv', 'statement', 'other')),
  storage_path text not null unique,
  original_filename text not null check (char_length(original_filename) <= 200),
  mime_type text not null check (mime_type in ('application/pdf', 'image/jpeg', 'image/png')),
  size_bytes integer not null check (size_bytes between 1 and 5242880),
  created_at timestamptz not null default now()
);
create index application_documents_application_idx on public.application_documents (application_id);

create table public.application_status_history (
  id bigint generated always as identity primary key,
  application_id uuid not null references public.applications (id) on delete cascade,
  from_status public.application_status,
  to_status public.application_status not null,
  changed_by uuid references public.profiles (id) on delete set null,
  changed_at timestamptz not null default now()
);
create index application_status_history_application_idx on public.application_status_history (application_id);

create table public.application_notes (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications (id) on delete cascade,
  author_id uuid references public.profiles (id) on delete set null,
  note text not null check (char_length(note) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index application_notes_application_idx on public.application_notes (application_id);

-- ---------- Courses and registration ----------
create table public.courses (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z]{2,4}[0-9]{3}$'),
  title text not null,
  description text not null default '',
  credit_hours integer not null check (credit_hours between 1 and 12),
  level integer not null default 1 check (level between 1 and 8),
  faculty_id uuid not null references public.faculties (id) on delete restrict,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.programme_courses (
  programme_id uuid not null references public.programmes (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  is_core boolean not null default true,
  primary key (programme_id, course_id)
);
create index programme_courses_course_idx on public.programme_courses (course_id);

create table public.course_prerequisites (
  course_id uuid not null references public.courses (id) on delete cascade,
  prerequisite_id uuid not null references public.courses (id) on delete cascade,
  primary key (course_id, prerequisite_id),
  check (course_id <> prerequisite_id)
);

create table public.course_offerings (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete restrict,
  semester_id uuid not null references public.semesters (id) on delete restrict,
  lecturer_id uuid references public.profiles (id) on delete set null,
  capacity integer not null default 60 check (capacity > 0),
  is_open boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (course_id, semester_id)
);
create index course_offerings_semester_idx on public.course_offerings (semester_id);
create index course_offerings_lecturer_idx on public.course_offerings (lecturer_id);

create table public.course_registrations (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete restrict,
  offering_id uuid not null references public.course_offerings (id) on delete restrict,
  status text not null default 'registered' check (status in ('registered', 'dropped')),
  registered_at timestamptz not null default now(),
  dropped_at timestamptz,
  unique (student_id, offering_id)
);
create index course_registrations_offering_idx on public.course_registrations (offering_id);

create table public.grades (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null unique references public.course_registrations (id) on delete cascade,
  score numeric(5, 2) check (score is null or score between 0 and 100),
  letter_grade text check (letter_grade is null or letter_grade ~ '^[A-F][+-]?$'),
  is_published boolean not null default false,
  entered_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- Communication and calendar ----------
create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 3 and 200),
  body text not null check (char_length(body) <= 4000),
  category text not null check (category in ('Admissions', 'Academic calendar', 'General')),
  audience text not null default 'public' check (audience in ('public', 'students', 'staff')),
  is_published boolean not null default false,
  published_at timestamptz,
  author_id uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index announcements_published_idx on public.announcements (is_published, published_at desc);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) <= 200),
  body text not null default '' check (char_length(body) <= 1000),
  kind text not null check (kind in ('admission', 'registration', 'announcement', 'grade', 'system')),
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, is_read, created_at desc);

create table public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 3 and 200),
  description text not null default '',
  location text not null default '',
  event_type text not null check (event_type in ('semester', 'registration', 'examination', 'holiday', 'event', 'deadline')),
  starts_on date not null,
  ends_on date,
  academic_year_id uuid references public.academic_years (id) on delete set null,
  semester_id uuid references public.semesters (id) on delete set null,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_on is null or ends_on >= starts_on)
);
create index calendar_events_starts_idx on public.calendar_events (starts_on);

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 100),
  email text not null check (char_length(email) <= 254),
  subject text not null check (char_length(subject) between 3 and 150),
  message text not null check (char_length(message) between 10 and 2000),
  is_handled boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------- Audit trail (append-only, see 002) ----------
create table public.audit_logs (
  id bigint generated always as identity primary key,
  occurred_at timestamptz not null default now(),
  actor_id uuid,  -- deliberately no foreign key: the log must survive user deletion
  action text not null,
  table_name text not null,
  record_id text,
  old_data jsonb,
  new_data jsonb
);
create index audit_logs_occurred_idx on public.audit_logs (occurred_at desc);
create index audit_logs_table_idx on public.audit_logs (table_name, record_id);

-- ---------- updated_at maintenance ----------
do $$
declare t text;
begin
  foreach t in array array['profiles', 'faculties', 'programmes', 'semesters', 'cutoff_points', 'students', 'applicants',
                           'applications', 'courses', 'course_offerings', 'grades', 'announcements', 'calendar_events']
  loop
    execute format('create trigger trg_%1$s_updated_at before update on public.%1$I for each row execute function public.set_updated_at()', t);
  end loop;
end $$;
