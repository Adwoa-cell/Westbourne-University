const present = (p) => ({ id: p.id, email: p.email, fullName: p.full_name, phone: p.phone ?? null, role: p.role });

export const getMe = (req, res) => {
  res.json({ data: present(req.auth.profile) });
};

export const updateMe = async (req, res, next) => {
  const { fullName, phone } = req.validated.body;
  const patch = {};
  if (fullName !== undefined) patch.full_name = fullName;
  if (phone !== undefined) patch.phone = phone;
  // Runs as the signed-in user: RLS + column grants allow changing only their own full_name and phone.
  const { data, error } = await req.auth.db
    .from('profiles')
    .update(patch)
    .eq('id', req.auth.profile.id)
    .select('id,email,full_name,phone,role')
    .single();
  if (error) {
    if (error.code === '42501') return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'You cannot change that.' } });
    return next(error);
  }
  return res.json({ data: present(data) });
};
