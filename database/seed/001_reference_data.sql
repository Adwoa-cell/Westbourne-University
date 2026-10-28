-- 001_reference_data.sql : FICTIONAL demonstration data. Safe to run more than once.
-- Contains no users and no passwords. See promote_user.sql for creating test staff/students.

insert into public.faculties (code, name, summary, departments) values
  ('fet', 'Faculty of Engineering and Technology', 'Computing, systems, networks and cybersecurity taught in labs that mirror industry.', array['Computer Science', 'Systems and Network Engineering', 'Cybersecurity']),
  ('fbe', 'Faculty of Business and Economics', 'Accounting, management and enterprise programmes built around real case work.', array['Accounting and Finance', 'Management Studies']),
  ('fhl', 'Faculty of Health and Life Sciences', 'Clinical and laboratory training with supervised placements.', array['Nursing Science', 'Biomedical Science']),
  ('fhs', 'Faculty of Humanities and Social Sciences', 'Psychology, education and language programmes focused on people and communities.', array['Psychology', 'Education', 'Languages and Communication'])
on conflict (code) do nothing;

insert into public.programmes (code, name, faculty_id, qualification, duration_months, study_mode, description, entry_requirements, is_featured)
select v.code, v.name, f.id, v.qualification, v.months, v.mode, v.descr, v.entry, v.featured
from (values
  ('BSC-CS', 'BSc Computer Science', 'fet', 'Bachelor', 48, 'Full-time', 'Programming, algorithms, databases, operating systems and software engineering, with a final-year industry project.', 'Mathematics and one science subject at credit level, plus English.', true),
  ('BENG-SYS', 'BEng Systems Engineering', 'fet', 'Bachelor', 48, 'Full-time', 'Design and integrate complex hardware, software and network systems, from requirements to deployment.', 'Mathematics and Physics at credit level, plus English.', true),
  ('DIP-NCA', 'Diploma in Network and Cloud Administration', 'fet', 'Diploma', 24, 'Full-time or Part-time', 'Hands-on Linux, networking and cloud hosting skills for entry-level infrastructure roles.', 'Mathematics and English at pass level.', false),
  ('MSC-CYB', 'MSc Cybersecurity', 'fet', 'Master', 24, 'Part-time', 'Secure systems design, penetration testing, incident response and security governance.', 'Bachelor degree in a computing or engineering field, second-class or better.', false),
  ('BCOM-ACC', 'BCom Accounting', 'fbe', 'Bachelor', 36, 'Full-time', 'Financial and management accounting, auditing and taxation, preparing graduates for professional exams.', 'Mathematics and Economics or Accounting at credit level, plus English.', true),
  ('BBA-MGT', 'BBA Business Management', 'fbe', 'Bachelor', 36, 'Full-time', 'Operations, marketing, people management and entrepreneurship through case studies and live projects.', 'Five subjects at credit level including English and Mathematics.', false),
  ('MBA-GEN', 'Master of Business Administration', 'fbe', 'Master', 24, 'Evening', 'Strategy, finance and leadership for working professionals, delivered in evening sessions.', 'Bachelor degree and at least three years of work experience.', false),
  ('BSC-NUR', 'BSc Nursing Science', 'fhl', 'Bachelor', 48, 'Full-time', 'Clinical skills, anatomy, community health and professional practice with supervised placements.', 'Biology, Chemistry and English at credit level.', true),
  ('BSC-BMS', 'BSc Biomedical Science', 'fhl', 'Bachelor', 36, 'Full-time', 'Laboratory-based study of disease, diagnostics and human biology.', 'Biology and Chemistry at credit level, plus English and Mathematics.', false),
  ('BA-PSY', 'BA Psychology', 'fhs', 'Bachelor', 36, 'Full-time', 'Human behaviour, research methods and applied psychology across education, health and work settings.', 'Five subjects at credit level including English.', false),
  ('BED-PRI', 'BEd Primary Education', 'fhs', 'Bachelor', 48, 'Full-time', 'Teaching methods, child development and classroom practice with school placements each year.', 'Five subjects at credit level including English and Mathematics.', false),
  ('CERT-AEP', 'Certificate in Academic English', 'fhs', 'Certificate', 6, 'Part-time', 'Academic reading, writing and presentation skills for university study.', 'Secondary school completion. No cut-off points apply.', false)
) as v(code, name, fcode, qualification, months, mode, descr, entry, featured)
join public.faculties f on f.code = v.fcode
on conflict (code) do nothing;

insert into public.academic_years (label, starts_on, ends_on, is_current) values
  ('2026/2027', '2026-08-17', '2027-08-13', true)
on conflict (label) do nothing;

insert into public.semesters (academic_year_id, name, starts_on, ends_on, registration_opens_on, registration_closes_on, max_credit_hours)
select y.id, v.name, v.starts_on::date, v.ends_on::date, v.reg_open::date, v.reg_close::date, 18
from public.academic_years y,
  (values
    ('Semester 1', '2026-09-07', '2026-12-18', '2026-08-17', '2026-09-18'),
    ('Semester 2', '2027-02-01', '2027-06-11', '2027-01-11', '2027-01-29')
  ) as v(name, starts_on, ends_on, reg_open, reg_close)
where y.label = '2026/2027'
on conflict (academic_year_id, name) do nothing;

insert into public.cutoff_points (programme_id, academic_year_id, points, required_subjects, additional_requirements)
select p.id, y.id, v.points, v.subjects, v.extra
from (values
  ('BSC-CS', 28, array['Mathematics', 'English', 'Physics or ICT'], 'Minimum credit in Mathematics.'),
  ('BENG-SYS', 30, array['Mathematics', 'Physics', 'English'], 'Short aptitude interview for shortlisted applicants.'),
  ('DIP-NCA', 20, array['Mathematics', 'English'], 'Basic computer literacy.'),
  ('MSC-CYB', null, array[]::text[], 'Assessed on degree classification; CV and statement of purpose required.'),
  ('BCOM-ACC', 26, array['Mathematics', 'English', 'Economics or Accounting'], 'None.'),
  ('BBA-MGT', 24, array['Mathematics', 'English'], 'None.'),
  ('MBA-GEN', null, array[]::text[], 'Three years of work experience; two references.'),
  ('BSC-NUR', 32, array['Biology', 'Chemistry', 'English'], 'Health screening and police clearance before clinical placements.'),
  ('BSC-BMS', 29, array['Biology', 'Chemistry', 'English'], 'None.'),
  ('BA-PSY', 25, array['English'], 'None.'),
  ('BED-PRI', 24, array['English', 'Mathematics'], 'Police clearance before school placements.'),
  ('CERT-AEP', null, array[]::text[], 'Short placement test on enrolment.')
) as v(pcode, points, subjects, extra)
join public.programmes p on p.code = v.pcode
cross join public.academic_years y
where y.label = '2026/2027'
on conflict (programme_id, academic_year_id) do nothing;

insert into public.admission_requirements (programme_id, requirement, sort_order)
select p.id, v.requirement, v.sort_order
from (values
  ('BSC-CS', 'Certified copy of identification document', 1),
  ('BSC-CS', 'Certified academic results', 2),
  ('MSC-CYB', 'Degree certificate and transcripts', 1),
  ('MSC-CYB', 'Curriculum vitae', 2),
  ('MSC-CYB', 'Statement of purpose (maximum 500 words)', 3)
) as v(pcode, requirement, sort_order)
join public.programmes p on p.code = v.pcode
on conflict (programme_id, requirement) do nothing;

insert into public.courses (code, title, description, credit_hours, level, faculty_id)
select v.code, v.title, v.descr, v.credits, v.level, f.id
from (values
  ('CS101', 'Introduction to Programming', 'Problem solving and programming fundamentals.', 3, 1, 'fet'),
  ('CS102', 'Discrete Mathematics', 'Logic, sets, relations and graphs for computing.', 3, 1, 'fet'),
  ('MAT101', 'Calculus I', 'Limits, differentiation and integration.', 3, 1, 'fet'),
  ('ENG101', 'Academic Communication', 'Reading, writing and presenting at university level.', 2, 1, 'fhs'),
  ('SYS101', 'Introduction to Systems Engineering', 'Systems thinking, requirements and lifecycle.', 3, 1, 'fet'),
  ('CS201', 'Data Structures', 'Lists, trees, hashing and algorithm analysis.', 3, 2, 'fet'),
  ('CS202', 'Database Systems', 'Relational modelling, SQL and transactions.', 3, 2, 'fet'),
  ('CS203', 'Operating Systems and Linux', 'Processes, memory, file systems and the Linux shell.', 3, 2, 'fet'),
  ('CS301', 'Computer Networks', 'Protocols, addressing, routing and network services.', 3, 3, 'fet'),
  ('CS302', 'Web Application Development', 'Frontend, backend and API design.', 3, 3, 'fet'),
  ('CS303', 'Cybersecurity Fundamentals', 'Threats, cryptography, access control and secure design.', 3, 3, 'fet'),
  ('ACC101', 'Financial Accounting I', 'Recording and reporting financial transactions.', 3, 1, 'fbe'),
  ('BUS101', 'Principles of Management', 'Planning, organising, leading and controlling.', 3, 1, 'fbe'),
  ('NUR101', 'Foundations of Nursing', 'Core nursing skills and professional practice.', 4, 1, 'fhl')
) as v(code, title, descr, credits, level, fcode)
join public.faculties f on f.code = v.fcode
on conflict (code) do nothing;

insert into public.course_prerequisites (course_id, prerequisite_id)
select c.id, p.id
from (values ('CS201', 'CS101'), ('CS202', 'CS101'), ('CS203', 'CS101'), ('CS301', 'CS203'), ('CS302', 'CS101'), ('CS303', 'CS203'))
  as v(course, prereq)
join public.courses c on c.code = v.course
join public.courses p on p.code = v.prereq
on conflict do nothing;

insert into public.programme_courses (programme_id, course_id, is_core)
select pr.id, c.id, true
from (values
  ('BSC-CS', 'CS101'), ('BSC-CS', 'CS102'), ('BSC-CS', 'MAT101'), ('BSC-CS', 'ENG101'), ('BSC-CS', 'CS201'),
  ('BSC-CS', 'CS202'), ('BSC-CS', 'CS203'), ('BSC-CS', 'CS301'), ('BSC-CS', 'CS302'), ('BSC-CS', 'CS303'),
  ('BENG-SYS', 'SYS101'), ('BENG-SYS', 'MAT101'), ('BENG-SYS', 'CS101'), ('BENG-SYS', 'ENG101'), ('BENG-SYS', 'CS203'), ('BENG-SYS', 'CS301'),
  ('BCOM-ACC', 'ACC101'), ('BCOM-ACC', 'BUS101'), ('BCOM-ACC', 'ENG101'), ('BCOM-ACC', 'MAT101'),
  ('BSC-NUR', 'NUR101'), ('BSC-NUR', 'ENG101')
) as v(pcode, ccode)
join public.programmes pr on pr.code = v.pcode
join public.courses c on c.code = v.ccode
on conflict do nothing;

-- Every course is offered in Semester 1 and Semester 2 of the current year.
insert into public.course_offerings (course_id, semester_id, capacity)
select c.id, s.id, 60
from public.courses c
cross join public.semesters s
join public.academic_years y on y.id = s.academic_year_id and y.label = '2026/2027'
on conflict (course_id, semester_id) do nothing;

insert into public.announcements (title, body, category, audience, is_published, published_at)
select v.title, v.body, v.category, v.audience, v.is_published, v.published_at::timestamptz
from (values
  ('Applications open for the 2027 February intake', 'Applications for undergraduate and diploma programmes are now open. Review the cut-off points before choosing your programme.', 'Admissions', 'public', true, '2026-10-19'),
  ('Postgraduate application deadline announced', 'Master-level applications close on 15 December 2026. Applicants should prepare transcripts and a statement of purpose.', 'Admissions', 'public', true, '2026-10-12'),
  ('Semester 2 registration period published', 'Course registration for Semester 2 opens on 11 January 2027 and closes on 29 January 2027.', 'Academic calendar', 'public', true, '2026-10-05'),
  ('New cloud computing laboratory opens', 'Engineering students now have access to a dedicated cloud and networking laboratory for practical coursework.', 'General', 'public', true, '2026-09-28'),
  ('Library extends evening hours during examinations', 'The main library will stay open until 22:00 on weekdays throughout the examination period.', 'General', 'public', true, '2026-09-21')
) as v(title, body, category, audience, is_published, published_at)
where not exists (select 1 from public.announcements a where a.title = v.title);

insert into public.calendar_events (title, description, location, event_type, starts_on, ends_on, academic_year_id, is_public)
select v.title, v.descr, v.location, v.etype, v.starts_on::date, v.ends_on::date, y.id, true
from public.academic_years y,
  (values
    ('Undergraduate open day', 'Meet lecturers, tour the laboratories and ask questions about programmes and funding.', 'Main campus, Great Hall', 'event', '2026-11-14', null),
    ('Postgraduate information evening', 'An introduction to Master-level study, supervision and part-time options.', 'Online', 'event', '2026-11-26', null),
    ('Applications close for February intake', 'Final day to submit a complete application for the February 2027 intake.', 'Online application portal', 'deadline', '2026-12-15', null),
    ('Orientation week', 'Welcome sessions, campus tours and student society fair for new students.', 'Main campus', 'event', '2027-02-01', '2027-02-05'),
    ('Semester 1 examinations', 'Written and practical examinations.', 'Main campus', 'examination', '2026-12-01', '2026-12-18'),
    ('Semester 2 registration', 'Course registration period for Semester 2.', 'Online student portal', 'registration', '2027-01-11', '2027-01-29')
  ) as v(title, descr, location, etype, starts_on, ends_on)
where y.label = '2026/2027'
  and not exists (select 1 from public.calendar_events e where e.title = v.title and e.starts_on = v.starts_on::date);
