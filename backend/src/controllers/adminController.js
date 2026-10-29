
const presentUser = (u) => ({ id: u.id, email: u.email, fullName: u.full_name, role: u.role, createdAt: u.created_at });
const escapeLike = (value) => value.replace(/[\\%_]/g, (ch) => `\\${ch}`);

export const listUsers = async (req, res, next) => {
  const { q, role, page, pageSize } = req.validated.query;
  const from = (page - 1) * pageSize;
  let query = req.auth.db
    .from('profiles')
    .select('id,email,full_name,role,created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, from + pageSize - 1);
  if (role) query = query.eq('role', role);
  if (q) query = query.ilike('email', `%${escapeLike(q)}%`);
  const { data, count, error } = await query;
  if (error) return next(error);
  const total = count ?? data.length;
  return res.json({
    data: data.map(presentUser),
    meta: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
  });
};

// The database function re-checks that the caller is an administrator and blocks self-changes (defence in depth).
export const setUserRole = async (req, res, next) => {
  const { error } = await req.auth.db.rpc('admin_set_role', { target: req.validated.params.id, new_role: req.validated.body.role });
  if (error) {
    if (error.code === '42501') return res.status(403).json({ error: { code: 'FORBIDDEN', message: error.message } });
    if (error.code === 'P0002') return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found.' } });
    return next(error);
  }
  return res.json({ data: { id: req.validated.params.id, role: req.validated.body.role } });
};


const programmeSelect = `
  id,
  code,
  name,
  faculty_id,
  qualification,
  duration_months,
  study_mode,
  description,
  entry_requirements,
  is_featured,
  is_active,
  created_at,
  updated_at,
  faculties(code,name)
`;

const presentProgramme = (p) => ({
  id: p.id,
  code: p.code,
  name: p.name,
  facultyId: p.faculty_id,
  facultyCode: p.faculties?.code ?? null,
  facultyName: p.faculties?.name ?? null,
  qualification: p.qualification,
  durationMonths: p.duration_months,
  studyMode: p.study_mode,
  description: p.description,
  entryRequirements: p.entry_requirements,
  isFeatured: p.is_featured,
  isActive: p.is_active,
  createdAt: p.created_at,
  updatedAt: p.updated_at,
});

const programmeToDatabase = (p) => {
  const fields = {
    code: 'code',
    name: 'name',
    facultyId: 'faculty_id',
    qualification: 'qualification',
    durationMonths: 'duration_months',
    studyMode: 'study_mode',
    description: 'description',
    entryRequirements: 'entry_requirements',
    isFeatured: 'is_featured',
    isActive: 'is_active',
  };

  return Object.fromEntries(
    Object.entries(p).map(([key, value]) => [fields[key], value]),
  );
};

const programmeError = (res, next, error) => {
  if (error.code === '23505') {
    return res.status(409).json({
      error: {
        code: 'DUPLICATE_PROGRAMME',
        message: 'A programme with this code already exists.',
      },
    });
  }

  if (error.code === '23503') {
    return res.status(400).json({
      error: {
        code: 'INVALID_FACULTY',
        message: 'The selected faculty does not exist.',
      },
    });
  }

  if (error.code === '42501') {
    return res.status(403).json({
      error: {
        code: 'FORBIDDEN',
        message: 'You do not have permission to manage programmes.',
      },
    });
  }

  return next(error);
};

// GET /api/v1/admin/programmes
export const listAdminProgrammes = async (req, res, next) => {
  const { data, error } = await req.auth.db
    .from('programmes')
    .select(programmeSelect)
    .order('name');

  if (error) return next(error);

  return res.json({
    data: data.map(presentProgramme),
  });
};

// POST /api/v1/admin/programmes
export const createProgramme = async (req, res, next) => {
  const values = programmeToDatabase(req.validated.body);

  const { data, error } = await req.auth.db
    .from('programmes')
    .insert(values)
    .select(programmeSelect)
    .single();

  if (error) return programmeError(res, next, error);

  return res.status(201).json({
    data: presentProgramme(data),
  });
};

// PATCH /api/v1/admin/programmes/:id
export const updateProgramme = async (req, res, next) => {
  const values = programmeToDatabase(req.validated.body);

  const { data, error } = await req.auth.db
    .from('programmes')
    .update(values)
    .eq('id', req.validated.params.id)
    .select(programmeSelect)
    .maybeSingle();

  if (error) return programmeError(res, next, error);

  if (!data) {
    return res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: 'Programme not found.',
      },
    });
  }

  return res.json({
    data: presentProgramme(data),
  });
};

// PATCH /api/v1/admin/programmes/:id/status
export const updateProgrammeStatus = async (req, res, next) => {
  const { data, error } = await req.auth.db
    .from('programmes')
    .update({
      is_active: req.validated.body.isActive,
    })
    .eq('id', req.validated.params.id)
    .select(programmeSelect)
    .maybeSingle();

  if (error) return programmeError(res, next, error);

  if (!data) {
    return res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: 'Programme not found.',
      },
    });
  }

  return res.json({
    data: presentProgramme(data),
  });
};

export const listAdminFaculties = async (req, res, next) => {
  const { data, error } = await req.auth.db
    .from('faculties')
    .select('id,code,name')
    .order('name');

  if (error) return next(error);
  return res.json({ data });
};

const presentApplication = (application) => ({
  id: application.id,
  referenceNumber: application.reference_number,
  applicant: {
    id: application.applicant_profile_id,
    fullName: application.profiles?.full_name ?? '',
    email: application.profiles?.email ?? '',
  },
  programme: application.programmes ? {
    id: application.programmes.id,
    code: application.programmes.code,
    name: application.programmes.name,
  } : null,
  academicYear: application.academic_years?.label ?? null,
  status: application.status,
  education: application.education,
  personalStatement: application.personal_statement,
  infoRequest: application.info_request,
  submittedAt: application.submitted_at,
  decidedAt: application.decided_at,
  createdAt: application.created_at,
  updatedAt: application.updated_at,
});

const applicationSelect = `
  id,reference_number,applicant_profile_id,programme_id,academic_year_id,status,
  education,personal_statement,info_request,submitted_at,decided_at,created_at,updated_at,
  profiles!applications_applicant_profile_id_fkey(full_name,email),
  programmes!applications_programme_id_fkey(id,code,name),
  academic_years!applications_academic_year_id_fkey(label)
`;

export const listAdminApplications = async (req, res, next) => {
  const { status, page, pageSize } = req.validated.query;
  const from = (page - 1) * pageSize;
  let query = req.auth.db
    .from('applications')
    .select(applicationSelect, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, from + pageSize - 1);
  if (status) query = query.eq('status', status);
  const { data, count, error } = await query;
  if (error) return next(error);
  const total = count ?? data.length;
  return res.json({
    data: data.map(presentApplication),
    meta: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
  });
};

export const getAdminApplication = async (req, res, next) => {
  const { data, error } = await req.auth.db
    .from('applications')
    .select(applicationSelect)
    .eq('id', req.validated.params.id)
    .maybeSingle();
  if (error) return next(error);
  if (!data) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Application not found.' } });
  }

  const [historyResult, documentsResult] = await Promise.all([
    req.auth.db
      .from('application_status_history')
      .select('from_status,to_status,changed_at')
      .eq('application_id', req.validated.params.id)
      .order('changed_at', { ascending: false }),
    req.auth.db
      .from('application_documents')
      .select('id,document_type,storage_path,original_filename,mime_type,size_bytes,created_at')
      .eq('application_id', req.validated.params.id)
      .order('created_at', { ascending: false }),
  ]);
  if (historyResult.error) return next(historyResult.error);
  if (documentsResult.error) return next(documentsResult.error);

  const signedDocuments = await Promise.all(documentsResult.data.map(async (document) => {
    const { data: signedUrl, error: signedUrlError } = await req.auth.db
      .storage
      .from('application-documents')
      .createSignedUrl(document.storage_path, 300);
    return { document, signedUrl, error: signedUrlError };
  }));
  const failedDocument = signedDocuments.find((item) => item.error);
  if (failedDocument) return next(failedDocument.error);

  return res.json({
    data: {
      ...presentApplication(data),
      statusHistory: historyResult.data,
      documents: signedDocuments.map(({ document, signedUrl }) => {
        const { storage_path: _storagePath, ...metadata } = document;
        return { ...metadata, downloadUrl: signedUrl.signedUrl };
      }),
    },
  });
};

export const updateAdminApplicationStatus = async (req, res, next) => {
  const values = { status: req.validated.body.status };
  if (req.validated.body.infoRequest !== undefined) {
    values.info_request = req.validated.body.infoRequest;
  }
  const { data, error } = await req.auth.db
    .from('applications')
    .update(values)
    .eq('id', req.validated.params.id)
    .select(applicationSelect)
    .maybeSingle();
  if (error) {
    if (error.code === '42501') {
      if (!error.message?.includes('Invalid application status change')) {
        return res.status(403).json({
          error: { code: 'FORBIDDEN', message: 'You do not have permission to update this application.' },
        });
      }
      return res.status(409).json({
        error: { code: 'INVALID_STATUS_TRANSITION', message: 'That application status change is not allowed.' },
      });
    }
    if (error.code === '23514') {
      return res.status(400).json({
        error: { code: 'INVALID_APPLICATION_UPDATE', message: 'Provide the additional information request before using this status.' },
      });
    }
    return next(error);
  }
  if (!data) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Application not found.' } });
  }
  return res.json({ data: presentApplication(data) });
};

const presentStudent = (student) => ({
  id: student.id,
  profileId: student.profile_id,
  fullName: student.profiles?.full_name ?? '',
  email: student.profiles?.email ?? '',
  studentNumber: student.student_number,
  programme: student.programmes ? {
    id: student.programmes.id,
    code: student.programmes.code,
    name: student.programmes.name,
  } : null,
  level: student.level,
  currentSemesterId: student.current_semester_id,
  status: student.status,
  enrolledOn: student.enrolled_on,
  createdAt: student.created_at,
  updatedAt: student.updated_at,
});

const studentSelect = `
  id,profile_id,student_number,programme_id,level,current_semester_id,status,enrolled_on,created_at,updated_at,
  profiles!students_profile_id_fkey(full_name,email),
  programmes!students_programme_id_fkey(id,code,name)
`;

export const listAdminStudents = async (req, res, next) => {
  const { q, page, pageSize } = req.validated.query;
  const from = (page - 1) * pageSize;
  let query = req.auth.db
    .from('students')
    .select(studentSelect, { count: 'exact' })
    .order('student_number')
    .range(from, from + pageSize - 1);
  if (q) query = query.ilike('student_number', `%${escapeLike(q)}%`);
  const { data, count, error } = await query;
  if (error) return next(error);
  const total = count ?? data.length;
  return res.json({
    data: data.map(presentStudent),
    meta: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
  });
};

export const getAdminStudent = async (req, res, next) => {
  const { data, error } = await req.auth.db
    .from('students')
    .select(studentSelect)
    .eq('id', req.validated.params.id)
    .maybeSingle();
  if (error) return next(error);
  if (!data) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Student record not found.' } });
  }
  return res.json({ data: presentStudent(data) });
};

const calendarEventToDatabase = (event) => {
  const fields = {
    title: 'title',
    description: 'description',
    location: 'location',
    eventType: 'event_type',
    startsOn: 'starts_on',
    endsOn: 'ends_on',
    academicYearId: 'academic_year_id',
    semesterId: 'semester_id',
    isPublic: 'is_public',
  };
  return Object.fromEntries(Object.entries(event).map(([key, value]) => [fields[key], value]));
};

const presentCalendarEvent = (event) => ({
  id: event.id,
  title: event.title,
  description: event.description,
  location: event.location,
  eventType: event.event_type,
  startsOn: event.starts_on,
  endsOn: event.ends_on,
  academicYearId: event.academic_year_id,
  semesterId: event.semester_id,
  isPublic: event.is_public,
  createdAt: event.created_at,
  updatedAt: event.updated_at,
});

const calendarEventSelect = 'id,title,description,location,event_type,starts_on,ends_on,academic_year_id,semester_id,is_public,created_at,updated_at';

const calendarEventError = (res, next, error) => {
  if (error.code === '23503') {
    return res.status(400).json({
      error: { code: 'INVALID_CALENDAR_REFERENCE', message: 'The selected academic year or semester does not exist.' },
    });
  }
  if (error.code === '23514') {
    return res.status(400).json({
      error: { code: 'INVALID_CALENDAR_EVENT', message: 'Check the event type and date range.' },
    });
  }
  if (error.code === '42501') {
    return res.status(403).json({
      error: { code: 'FORBIDDEN', message: 'You do not have permission to manage calendar events.' },
    });
  }
  return next(error);
};

export const listAdminCalendarEvents = async (req, res, next) => {
  const { data, error } = await req.auth.db
    .from('calendar_events')
    .select(calendarEventSelect)
    .order('starts_on');
  if (error) return next(error);
  return res.json({ data: data.map(presentCalendarEvent) });
};

export const createCalendarEvent = async (req, res, next) => {
  const { data, error } = await req.auth.db
    .from('calendar_events')
    .insert(calendarEventToDatabase(req.validated.body))
    .select(calendarEventSelect)
    .single();
  if (error) return calendarEventError(res, next, error);
  return res.status(201).json({ data: presentCalendarEvent(data) });
};

export const updateCalendarEvent = async (req, res, next) => {
  const { data, error } = await req.auth.db
    .from('calendar_events')
    .update(calendarEventToDatabase(req.validated.body))
    .eq('id', req.validated.params.id)
    .select(calendarEventSelect)
    .maybeSingle();
  if (error) return calendarEventError(res, next, error);
  if (!data) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Calendar event not found.' } });
  }
  return res.json({ data: presentCalendarEvent(data) });
};
