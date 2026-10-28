import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

// Environment must be set BEFORE the app modules are imported.
const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'westbourne-test-'));
const storeFile = path.join(tmpDir, 'contact.jsonl');
process.env.CONTACT_STORE_PATH = storeFile;
process.env.CORS_ORIGINS = 'http://localhost:5173';
process.env.DATA_SOURCE = 'demo'; // never touch a real database from tests

const { createApp } = await import('../../backend/src/app.js');

let server;
let base;

before(async () => {
  server = createApp().listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await fs.rm(tmpDir, { recursive: true, force: true });
});

const getJson = async (url, options) => {
  const res = await fetch(`${base}${url}`, options);
  return { res, body: await res.json() };
};

const postContact = (payload) =>
  getJson('/api/v1/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

const validMessage = { name: 'Ama Boateng', email: 'ama@example.com', subject: 'Open day', message: 'Please send me details about the open day.' };

test('health check responds ok', async () => {
  const { res, body } = await getJson('/health');
  assert.equal(res.status, 200);
  assert.equal(body.status, 'ok');
});

test('security headers are set and Express is not advertised', async () => {
  const res = await fetch(`${base}/health`);
  assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
  assert.ok(res.headers.get('content-security-policy'));
  assert.equal(res.headers.get('x-powered-by'), null);
});

test('programmes list returns data with pagination metadata', async () => {
  const { res, body } = await getJson('/api/v1/programmes?pageSize=5');
  assert.equal(res.status, 200);
  assert.equal(body.data.length, 5);
  assert.equal(body.meta.pageSize, 5);
  assert.ok(body.meta.total >= 10);
});

test('programmes can be filtered by faculty and qualification', async () => {
  const { body } = await getJson('/api/v1/programmes?faculty=fet&qualification=Master');
  assert.equal(body.data.length, 1);
  assert.equal(body.data[0].code, 'MSC-CYB');
});

test('programmes search matches name or code', async () => {
  const { body } = await getJson('/api/v1/programmes?q=nursing');
  assert.equal(body.data[0].code, 'BSC-NUR');
});

test('invalid query parameters are rejected with 400', async () => {
  const { res, body } = await getJson('/api/v1/programmes?pageSize=9999&qualification=Wizard');
  assert.equal(res.status, 400);
  assert.equal(body.error.code, 'VALIDATION_ERROR');
  assert.ok(body.error.fields.pageSize);
  assert.ok(body.error.fields.qualification);
});

test('cut-off points include the academic year and required subjects', async () => {
  const { body } = await getJson('/api/v1/cutoff-points?q=computer');
  assert.equal(body.academicYear, '2026/2027');
  assert.equal(body.data[0].programmeCode, 'BSC-CS');
  assert.ok(body.data[0].requiredSubjects.includes('Mathematics'));
});

test('announcements filter by category and are newest first', async () => {
  const { body } = await getJson('/api/v1/announcements?category=Admissions');
  assert.ok(body.data.length >= 2);
  assert.ok(body.data.every((a) => a.category === 'Admissions'));
  assert.ok(body.data[0].date >= body.data[1].date);
});

test('unknown endpoints return a JSON 404', async () => {
  const { res, body } = await getJson('/api/v1/does-not-exist');
  assert.equal(res.status, 404);
  assert.equal(body.error.code, 'NOT_FOUND');
});

test('CORS allows the configured origin and blocks others', async () => {
  const allowed = await fetch(`${base}/api/v1/faculties`, { headers: { Origin: 'http://localhost:5173' } });
  assert.equal(allowed.headers.get('access-control-allow-origin'), 'http://localhost:5173');
  const blocked = await fetch(`${base}/api/v1/faculties`, { headers: { Origin: 'https://evil.example' } });
  assert.equal(blocked.status, 403);
  assert.equal(blocked.headers.get('access-control-allow-origin'), null);
});

test('contact form rejects invalid input', async () => {
  const { res, body } = await postContact({ name: 'A', email: 'not-an-email', subject: 'Hi', message: 'short' });
  assert.equal(res.status, 400);
  assert.ok(body.error.fields.name && body.error.fields.email && body.error.fields.message);
});

test('contact form stores a valid message', async () => {
  const { res, body } = await postContact(validMessage);
  assert.equal(res.status, 201);
  assert.equal(body.data.received, true);
  const lines = (await fs.readFile(storeFile, 'utf8')).trim().split('\n');
  assert.equal(JSON.parse(lines.at(-1)).email, 'ama@example.com');
});

test('contact form honeypot discards bot submissions silently', async () => {
  const before = (await fs.readFile(storeFile, 'utf8')).trim().split('\n').length;
  const { res } = await postContact({ ...validMessage, website: 'http://spam.example' });
  assert.equal(res.status, 201);
  const after = (await fs.readFile(storeFile, 'utf8')).trim().split('\n').length;
  assert.equal(after, before);
});

test('contact form is rate limited', async () => {
  let last;
  for (let i = 0; i < 6; i += 1) last = await postContact(validMessage);
  assert.equal(last.res.status, 429);
  assert.equal(last.body.error.code, 'RATE_LIMITED');
});
