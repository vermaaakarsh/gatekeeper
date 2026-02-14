import 'dotenv/config';
import { createServer, shutdown } from './server.js';
import { logger } from './lib/logger.js';

async function bootstrap() {
  try {
    await createServer();
  } catch (err) {
    logger.fatal({ err: err.message }, 'Failed to start Gatekeeper');
    process.exit(1);
  }
}

bootstrap();

process.on('SIGTERM', async () => {
  await shutdown('SIGTERM');
});

process.on('SIGINT', async () => {
  await shutdown('SIGINT');
});

process.on('unhandledRejection', (reason) => {
  logger.fatal({ err: reason }, 'Unhandled promise rejection');
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  logger.fatal({ err: err.message }, 'Uncaught exception');
  process.exit(1);
});
