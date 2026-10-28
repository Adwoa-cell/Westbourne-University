import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

const options = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };

let publicClient;
let adminClient;

// Anonymous client: can only do what the public (anon) database role may do.
export const getPublicClient = () => (publicClient ??= createClient(env.supabaseUrl, env.supabaseAnonKey, options));

// Acts as one signed-in user: the database applies that user's Row Level Security rules.
export const createUserClient = (accessToken) =>
  createClient(env.supabaseUrl, env.supabaseAnonKey, {
    ...options,
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });

// Service-role client BYPASSES Row Level Security. Use only for trusted server-side jobs
// (currently: saving contact-form messages). Never expose it or pass it user-controlled queries.
export const getAdminClient = () => {
  if (!env.supabaseServiceRoleKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set in backend/.env');
  return (adminClient ??= createClient(env.supabaseUrl, env.supabaseServiceRoleKey, options));
};
