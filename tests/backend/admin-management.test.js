import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.DATA_SOURCE = 'demo';
process.env.CORS_ORIGINS = 'http://localhost:5173';

const { createApp } = await import('../../backend/src/app.js');

const adminId = '11111111-1111-4111-8111-111111111111';
const facultyId = '22222222-2222-4222-8222-222222222222';
const programmeId = '33333333-3333-4333-8333-333333333333';
const applicationId = '44444444-4444-4444-8444-444444444444';
const studentId = '55555555-5555-4555-8555-555555555555';
const eventId = '66666666-6666-4666-8666-666666666666';

function fakeDb(results = {}) {
  const calls = [];
  return {
    calls,
    storage: {
      from(bucket) {
        return {
          async createSignedUrl(...args) {
            calls.push({ table: `storage:${bucket}`, method: 'createSignedUrl', args });
            return { data: { signedUrl: 'https://storage.example/signed-document' }, error: null };
          },
        };
      },
    },
    from(table) {
      const builder = {};
      let single = false;
      for (const method of ['select', 'insert', 'update', 'eq', 'ilike', 'order', 'range', 'single', 'maybeSingle']) {
        builder[method] = (...args) => {
          calls.push({ table, method, args });
          if (method === 'single' || method === 'maybeSingle') single = true;
          return builder;
        };
      }
      builder.then = (resolve, reject) => {
        const result = results[table] ?? { data: [], count: 0, error: null };
        const normalized = single && Array.isArray(result.data)
          ? { ...result, data: result.data[0] ?? null }
          : result;
        return Promise.resolve(normalized).then(resolve, reject);
      };
      return builder;
    },
  };
}

const adminDb = fakeDb({
  faculties: { data: [{ id: facultyId, code: 'sci', name: 'Science' }], error: null },
  programmes: {
    data: [{
      id: programmeId,
      code: 'BSC-CS',
      name: 'Computer Science',
      faculty_id: facultyId,
      qualification: 'Bachelor',
      duration_months: 48,
      study_mode: 'Full-time',
      description: '',
      entry_requirements: '',
      is_featured: false,
      is_active: true,
      faculties: { code: 'sci', name: 'Science' },
    }],
    error: null,
  },
  applications: {
    data: [{
      id: applicationId,
      reference_number: 'WU-2026-000001',
      applicant_profile_id: adminId,
      status: 'under_review',
      education: [],
      personal_statement: null,
      info_request: null,
      submitted_at: '2026-01-01T00:00:00.000Z',
      decided_at: null,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
      profiles: { full_name: 'Applicant Name', email: 'applicant@example.test' },
      programmes: { id: programmeId, code: 'BSC-CS', name: 'Computer Science' },
      academic_years: { label: '2026/2027' },
    }],
    error: null,
  },
  application_documents: {
    data: [{
      id: '77777777-7777-4777-8777-777777777777',
      document_type: 'academic_results',
      storage_path: `${adminId}/${applicationId}/results.pdf`,
      original_filename: 'results.pdf',
      mime_type: 'application/pdf',
      size_bytes: 4096,
      created_at: '2026-01-01T00:00:00.000Z',
    }],
    error: null,
  },
  students: {
    data: [{
      id: studentId,
      profile_id: adminId,
      student_number: 'WU2600001',
      level: 1,
      current_semester_id: null,
      status: 'active',
      enrolled_on: '2026-01-01',
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
      profiles: { full_name: 'Student Name', email: 'student@example.test' },
      programmes: { id: programmeId, code: 'BSC-CS', name: 'Computer Science' },
    }],
    error: null,
  },
  calendar_events: {
    data: [{
      id: eventId,
      title: 'Orientation',
      description: '',
      location: 'Main campus',
      event_type: 'event',
      starts_on: '2026-09-01',
      ends_on: null,
      academic_year_id: null,
      semester_id: null,
      is_public: true,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    }],
    error: null,
  },
});

const sessions = {
  'admin-management-token': {
    user: { id: adminId, emailVerified: true },
    profile: { id: adminId, role: 'administrator' },
    db: adminDb,
  },
  'student-management-token': {
    user: { id: adminId, emailVerified: true },
    profile: { id: adminId, role: 'student' },
    db: adminDb,
  },
};

let server;
let base;
before(async () => {
  server = createApp({ resolveSession: async (token) => sessions[token] ?? null }).listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => new Promise((resolve) => server.close(resolve)));

const request = async (method, path, { token = 'admin-management-token', body } = {}) => {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { response, payload: await response.json() };
};

test('all administrator management endpoints enforce administrator role', async () => {
  const paths = [
    ['/api/v1/admin/faculties', 'GET'],
    ['/api/v1/admin/applications', 'GET'],
    [`/api/v1/admin/applications/${applicationId}`, 'GET'],
    ['/api/v1/admin/students', 'GET'],
    [`/api/v1/admin/students/${studentId}`, 'GET'],
    ['/api/v1/admin/calendar-events', 'GET'],
  ];
  for (const [path, method] of paths) {
    const anonymous = await request(method, path, { token: '' });
    assert.equal(anonymous.response.status, 401, `anonymous ${method} ${path}`);
    const { response } = await request(method, path, { token: 'student-management-token' });
    assert.equal(response.status, 403, `${method} ${path}`);
  }
});

test('faculty management returns UUIDs for programme assignment', async () => {
  const { response, payload } = await request('GET', '/api/v1/admin/faculties');
  assert.equal(response.status, 200);
  assert.equal(payload.data[0].id, facultyId);
});

test('programme creation persists the selected faculty UUID', async () => {
  const { response } = await request('POST', '/api/v1/admin/programmes', {
    body: {
      code: 'BSC-CS',
      name: 'Computer Science',
      facultyId,
      qualification: 'Bachelor',
      durationMonths: 48,
      studyMode: 'Full-time',
      description: '',
      entryRequirements: '',
      isFeatured: false,
      isActive: true,
    },
  });
  assert.equal(response.status, 201);
  const insert = adminDb.calls.find((call) => call.table === 'programmes' && call.method === 'insert');
  assert.equal(insert.args[0].faculty_id, facultyId);

  const status = await request('PATCH', `/api/v1/admin/programmes/${programmeId}/status`, {
    body: { isActive: false },
  });
  assert.equal(status.response.status, 200);
  const update = adminDb.calls.find((call) => call.table === 'programmes' && call.method === 'update');
  assert.deepEqual(update.args[0], { is_active: false });
});

test('application records include current schema data and status update is constrained', async () => {
  const listed = await request('GET', '/api/v1/admin/applications');
  assert.equal(listed.response.status, 200);
  assert.equal(listed.payload.data[0].referenceNumber, 'WU-2026-000001');
  assert.equal(listed.payload.data[0].applicant.email, 'applicant@example.test');
  const detail = await request('GET', `/api/v1/admin/applications/${applicationId}`);
  assert.equal(detail.response.status, 200);
  assert.deepEqual(detail.payload.data.education, []);
  assert.equal(detail.payload.data.documents[0].downloadUrl, 'https://storage.example/signed-document');
  assert.equal('storage_path' in detail.payload.data.documents[0], false);

  const invalid = await request('PATCH', `/api/v1/admin/applications/${applicationId}/status`, {
    body: { status: 'additional_information_required' },
  });
  assert.equal(invalid.response.status, 400);

  const updated = await request('PATCH', `/api/v1/admin/applications/${applicationId}/status`, {
    body: { status: 'accepted' },
  });
  assert.equal(updated.response.status, 200);
  const update = adminDb.calls.find((call) => call.table === 'applications' && call.method === 'update');
  assert.equal(update.args[0].status, 'accepted');
});

test('student listing and detail use existing student record fields', async () => {
  const listing = await request('GET', '/api/v1/admin/students?q=WU26');
  assert.equal(listing.response.status, 200);
  assert.equal(listing.payload.data[0].studentNumber, 'WU2600001');
  assert.equal(listing.payload.data[0].programme.code, 'BSC-CS');

  const detail = await request('GET', `/api/v1/admin/students/${studentId}`);
  assert.equal(detail.response.status, 200);
  assert.equal(detail.payload.data.enrolledOn, '2026-01-01');
});

test('calendar event creation validates dates and returns persisted event data', async () => {
  const invalid = await request('POST', '/api/v1/admin/calendar-events', {
    body: { title: 'Event', eventType: 'event', startsOn: '2026-09-02', endsOn: '2026-09-01' },
  });
  assert.equal(invalid.response.status, 400);

  const created = await request('POST', '/api/v1/admin/calendar-events', {
    body: { title: 'Orientation', eventType: 'event', startsOn: '2026-09-01' },
  });
  assert.equal(created.response.status, 201);
  assert.equal(created.payload.data.id, eventId);
  const updated = await request('PATCH', `/api/v1/admin/calendar-events/${eventId}`, {
    body: { endsOn: '2026-09-02' },
  });
  assert.equal(updated.response.status, 200);
});
