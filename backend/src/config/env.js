import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

const list = (value, fallback) =>
  (value ?? fallback)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const supabaseUrl = process.env.SUPABASE_URL?.trim() || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY?.trim() || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || '';
const supabaseReady = Boolean(supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('your-project-ref'));

const dataSource = process.env.DATA_SOURCE?.trim() || (supabaseReady ? 'supabase' : 'demo');
if (!['demo', 'supabase'].includes(dataSource)) {
  throw new Error(`DATA_SOURCE must be "demo" or "supabase" (got "${dataSource}")`);
}
if (dataSource === 'supabase' && !supabaseReady) {
  throw new Error('DATA_SOURCE=supabase needs real SUPABASE_URL and SUPABASE_ANON_KEY values in backend/.env');
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isProduction: process.env.NODE_ENV === 'production',
  port: Number(process.env.PORT) || 4000,
  corsOrigins: list(process.env.CORS_ORIGINS, 'http://localhost:5173'),
  trustProxy: process.env.TRUST_PROXY === '1',
  contactStorePath: path.resolve(backendRoot, process.env.CONTACT_STORE_PATH ?? 'storage/contact-messages.jsonl'),
  dataSource,
  supabaseUrl,
  supabaseAnonKey,
  supabaseServiceRoleKey,
  authAvailable: supabaseReady,
};
