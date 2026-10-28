import { env } from '../config/env.js';
import { createUserClient, getPublicClient } from '../config/supabase.js';

const deny = (res, status, code, message) => res.status(status).json({ error: { code, message } });

// Real session lookup: ask Supabase Auth to verify the token, then read the user's profile
// THROUGH the user's own token so Row Level Security applies to every later query too.
export async function resolveSupabaseSession(token) {
  const { data, error } = await getPublicClient().auth.getUser(token);
  if (error || !data?.user) return null;
  const db = createUserClient(token);
  const { data: profile, error: profileError } = await db
    .from('profiles')
    .select('id,email,full_name,phone,role')
    .eq('id', data.user.id)
    .single();
  if (profileError || !profile) return null;
  return {
    user: { id: data.user.id, email: data.user.email, emailVerified: Boolean(data.user.email_confirmed_at) },
    profile,
    db,
  };
}

// resolveSession is injectable so tests can run without a database.
export const createAuthenticate = (customResolver) => async (req, res, next) => {
  const resolveSession = customResolver ?? resolveSupabaseSession;
  try {
    if (!customResolver && !env.authAvailable) {
      return deny(res, 503, 'AUTH_NOT_CONFIGURED', 'Sign-in is not configured on this server yet.');
    }
    const match = /^Bearer ([A-Za-z0-9._-]{10,4096})$/.exec(req.get('authorization') ?? '');
    if (!match) return deny(res, 401, 'UNAUTHENTICATED', 'Sign in to continue.');
    const session = await resolveSession(match[1]);
    if (!session) return deny(res, 401, 'UNAUTHENTICATED', 'Your session is invalid or has expired. Sign in again.');
    if (!session.user.emailVerified) return deny(res, 403, 'EMAIL_NOT_VERIFIED', 'Verify your email address to continue.');
    req.auth = session;
    return next();
  } catch (err) {
    return next(err);
  }
};

// The role comes from the database profile, never from anything the browser sent.
export const requireRole = (...allowed) => (req, res, next) => {
  if (!req.auth || !allowed.includes(req.auth.profile.role)) {
    return deny(res, 403, 'FORBIDDEN', 'You do not have permission to do this.');
  }
  return next();
};
