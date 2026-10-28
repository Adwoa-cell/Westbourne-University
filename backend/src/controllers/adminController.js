
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

