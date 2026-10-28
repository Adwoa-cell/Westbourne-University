import { createApp } from './app.js';
import { env } from './config/env.js';

const server = createApp().listen(env.port, () => {
  console.log(`Westbourne API listening on http://localhost:${env.port} (${env.nodeEnv}, data source: ${env.dataSource})`);
  if (!env.authAvailable) console.log('Sign-in endpoints need Supabase keys in backend/.env (see docs/supabase-setup.md).');
});

const shutdown = () => server.close(() => process.exit(0));
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
