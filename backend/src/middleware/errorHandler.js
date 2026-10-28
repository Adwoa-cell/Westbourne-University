import { env } from '../config/env.js';

export const notFound = (req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'That endpoint does not exist.' } });
};

// Express recognises error handlers by their four arguments - keep `next` even though it is unused.
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: { code: 'PAYLOAD_TOO_LARGE', message: 'The request body is too large.' } });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: { code: 'INVALID_JSON', message: 'The request body is not valid JSON.' } });
  }
  if (err.message === 'Origin not allowed by CORS') {
    return res.status(403).json({ error: { code: 'CORS_DENIED', message: 'This origin is not allowed.' } });
  }
  // Full detail goes to server logs only; the client gets a generic message.
  console.error(err);
  const body = { error: { code: 'INTERNAL_ERROR', message: 'Something went wrong on our side.' } };
  if (!env.isProduction) body.error.debug = err.message;
  return res.status(500).json(body);
};
