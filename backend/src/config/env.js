import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

const list = (value, fallback) =>
  (value ?? fallback)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isProduction: process.env.NODE_ENV === 'production',
  port: Number(process.env.PORT) || 4000,
  corsOrigins: list(process.env.CORS_ORIGINS, 'http://localhost:5173'),
  trustProxy: process.env.TRUST_PROXY === '1',
  contactStorePath: path.resolve(backendRoot, process.env.CONTACT_STORE_PATH ?? 'storage/contact-messages.jsonl'),
};
