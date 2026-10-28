import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { env } from '../config/env.js';

// Phase 1 local storage: one JSON object per line in a gitignored file.
// Phase 2 replaces this with an INSERT into a Supabase table protected by RLS.
export async function saveContactMessage({ name, email, subject, message }) {
  const record = { id: crypto.randomUUID(), receivedAt: new Date().toISOString(), name, email, subject, message };
  await fs.mkdir(path.dirname(env.contactStorePath), { recursive: true });
  await fs.appendFile(env.contactStorePath, `${JSON.stringify(record)}\n`, { encoding: 'utf8', mode: 0o600 });
  return record.id;
}
