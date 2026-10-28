import rateLimit from 'express-rate-limit';

const tooMany = (message) => ({ error: { code: 'RATE_LIMITED', message } });

// Broad limit for every API call.
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: tooMany('Too many requests. Please wait a few minutes and try again.'),
});

// Strict limit for the contact form, which anyone can submit without signing in.
export const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: tooMany('You have sent several messages recently. Please try again later.'),
});
