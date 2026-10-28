import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { apiLimiter } from './middleware/rateLimiters.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { createAuthenticate } from './middleware/auth.js';
import publicRoutes from './routes/publicRoutes.js';
import { createAccountRoutes } from './routes/accountRoutes.js';
import { createAdminRoutes } from './routes/adminRoutes.js';

// `resolveSession` can be replaced in tests so authentication logic runs without a real database.
export function createApp({ resolveSession } = {}) {
  const app = express();
  const authenticate = createAuthenticate(resolveSession);

  app.disable('x-powered-by');
  if (env.trustProxy) app.set('trust proxy', 1);

  // Security headers (CSP, nosniff, frame protection, HSTS in production, ...).
  app.use(helmet());

  // Only the origins listed in CORS_ORIGINS may call this API from a browser.
  app.use(
    cors({
      origin(origin, callback) {
        // Requests with no Origin header (curl, server-to-server, health checks) are not browser cross-origin calls.
        if (!origin || env.corsOrigins.includes(origin)) return callback(null, true);
        return callback(new Error('Origin not allowed by CORS'));
      },
      methods: ['GET', 'POST', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      maxAge: 600,
    }),
  );

  app.use(express.json({ limit: '10kb' }));

  app.get('/health', (req, res) => res.json({ status: 'ok' }));

  app.use('/api/v1/admin', apiLimiter, createAdminRoutes(authenticate));
  app.use('/api/v1', apiLimiter, publicRoutes, createAccountRoutes(authenticate));

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
