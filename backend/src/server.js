import { createApp } from './app.js';
import { env } from './config/env.js';

const server = createApp().listen(env.port, () => {
  console.log(`Westbourne API listening on http://localhost:${env.port} (${env.nodeEnv})`);
});

const shutdown = () => server.close(() => process.exit(0));
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
