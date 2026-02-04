import 'dotenv/config';
import { createServer, shutdown } from './server.js';

createServer().catch((err) => {
  console.error('Failed to start Gatekeeper', err);
  process.exit(1);
});

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
