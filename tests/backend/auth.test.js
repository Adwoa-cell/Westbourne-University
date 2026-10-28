import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.DATA_SOURCE = 'demo'; // never touch a real database from tests
process.env.CORS_ORIGINS = 'http://localhost:5173';

const { createApp } = await import('../../backend/src/app.js');

// ---- A tiny fake database client: records calls and returns canned results ----
function fakeDb(result = { data: null, error: null }) {
  const calls = [];
  const chain = (label) => {
    const c = {};
    for (const m of ['select', 'update', 'eq', 'ilike', 'order', 'range', 'single']) {
      c[m] = (...args) => { calls.push([label, m, args]); return c; };
    }
    c.then = (resolve, reject) => Promise.resolve(result).then(resolve, reject);
    return c;
  };
  return { calls, from: (table) => chain(table), rpc: (name, args) => { calls.push(['rpc', name, args]); return Promise.resolve(result); } };
}

const profile = (role, id = '11111111-1111-4111-8111-111111111111') => ({
  id, email: `${role}@test.invalid`, full_name: 'Test User', phone: null, role,
});

// token -> session. Anything else is an invalid token.
const sessions = {
  'applicant-token-0000': { user: { id: 'u1', emailVerified: true }, profile: profile('applicant'), db: fakeDb({ data: { ...profile('applicant'), full_name: 'New Name' }, error: null }) },
  'officer-token-00000': { user: { id: 'u2', emailVerified: true }, profile: profile('admissions_officer'), db: fakeDb() },
  'student-token-00000': { user: { id: 'u3', emailVerified: true }, profile: profile('student'), db: fakeDb() },
  'unverified-token-00': { user: { id: 'u4', emailVerified: false }, profile: profile('applicant'), db: fakeDb() },
  'admin-token-0000000': { user: { id: 'u5', emailVerified: true }, profile: profile('administrator'), db: fakeDb({ data: [], count: 0, error: null }) },
};

let server;
let base;

before(async () => {
  server = createApp({ resolveSession: async (token) => sessions[token] ?? null }).listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => new Promise((resolve) => server.close(resolve)));

const call = async (method, url, { token, body } = {}) => {
  const res = await fetch(`${base}${url}`, {
    method,
    headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { res, body: await res.json() };
};

const OTHER_USER = '22222222-2222-4222-8222-222222222222';

test('/me requires a token', async () => {
  const { res, body } = await call('GET', '/api/v1/me');
  assert.equal(res.status, 401);
  assert.equal(body.error.code, 'UNAUTHENTICATED');
});

test('/me rejects malformed and unknown tokens', async () => {
  assert.equal((await call('GET', '/api/v1/me', { token: 'short' })).res.status, 401);
  assert.equal((await call('GET', '/api/v1/me', { token: 'not-a-real-token-123' })).res.status, 401);
});

test('/me rejects users who have not verified their email', async () => {
  const { res, body } = await call('GET', '/api/v1/me', { token: 'unverified-token-00' });
  assert.equal(res.status, 403);
  assert.equal(body.error.code, 'EMAIL_NOT_VERIFIED');
});

test('/me returns the signed-in profile with its database role', async () => {
  const { res, body } = await call('GET', '/api/v1/me', { token: 'applicant-token-0000' });
  assert.equal(res.status, 200);
  assert.equal(body.data.role, 'applicant');
  assert.equal(body.data.fullName, 'Test User');
});

test('PATCH /me updates only the signed-in user and only permitted fields', async () => {
  const { res, body } = await call('PATCH', '/api/v1/me', { token: 'applicant-token-0000', body: { fullName: 'New Name' } });
  assert.equal(res.status, 200);
  assert.equal(body.data.fullName, 'New Name');
  const eqCall = sessions['applicant-token-0000'].db.calls.find(([, m]) => m === 'eq');
  assert.deepEqual(eqCall[2], ['id', sessions['applicant-token-0000'].profile.id]);
});

test('PATCH /me refuses to accept a role (privilege escalation attempt)', async () => {
  const { res, body } = await call('PATCH', '/api/v1/me', { token: 'applicant-token-0000', body: { fullName: 'X Y', role: 'administrator' } });
  assert.equal(res.status, 400);
  assert.equal(body.error.code, 'VALIDATION_ERROR');
});

test('PATCH /me with an empty body is rejected', async () => {
  const { res } = await call('PATCH', '/api/v1/me', { token: 'applicant-token-0000', body: {} });
  assert.equal(res.status, 400);
});

test('admin endpoints reject anonymous users', async () => {
  assert.equal((await call('GET', '/api/v1/admin/users')).res.status, 401);
});

test('admin endpoints reject applicants, students and admissions officers', async () => {
  for (const token of ['applicant-token-0000', 'student-token-00000', 'officer-token-00000']) {
    const list = await call('GET', '/api/v1/admin/users', { token });
    assert.equal(list.res.status, 403, `${token} listed users`);
    const role = await call('PATCH', `/api/v1/admin/users/${OTHER_USER}/role`, { token, body: { role: 'administrator' } });
    assert.equal(role.res.status, 403, `${token} changed a role`);
  }
});

test('administrators can list users with pagination metadata', async () => {
  const { res, body } = await call('GET', '/api/v1/admin/users?pageSize=5', { token: 'admin-token-0000000' });
  assert.equal(res.status, 200);
  assert.equal(body.meta.pageSize, 5);
});

test('administrators can assign a role through the database function', async () => {
  const { res, body } = await call('PATCH', `/api/v1/admin/users/${OTHER_USER}/role`, { token: 'admin-token-0000000', body: { role: 'lecturer' } });
  assert.equal(res.status, 200);
  assert.equal(body.data.role, 'lecturer');
  const rpc = sessions['admin-token-0000000'].db.calls.find(([label]) => label === 'rpc');
  assert.deepEqual(rpc.slice(1), ['admin_set_role', { target: OTHER_USER, new_role: 'lecturer' }]);
});

test('role assignment validates the user id and the role name', async () => {
  const token = 'admin-token-0000000';
  assert.equal((await call('PATCH', '/api/v1/admin/users/not-a-uuid/role', { token, body: { role: 'lecturer' } })).res.status, 400);
  assert.equal((await call('PATCH', `/api/v1/admin/users/${OTHER_USER}/role`, { token, body: { role: 'superuser' } })).res.status, 400);
});
