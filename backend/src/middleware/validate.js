// Validates req[source] with a zod schema and stores the cleaned result in req.validated[source].
export const validate = (schema, source = 'query') => (req, res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    const fields = {};
    for (const issue of result.error.issues) {
      fields[issue.path.join('.') || 'request'] = issue.message;
    }
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Some fields are invalid.', fields } });
  }
  req.validated = { ...req.validated, [source]: result.data };
  return next();
};
