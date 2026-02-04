import { createClient } from 'redis';
import { logger } from './logger.js';

export const redis = createClient({
  url: process.env.REDIS_URL,
});

export async function connectRedis() {
  try {
    redis.on('error', (err) => {
      logger.error({ err: err.message }, 'Redis error');
    });

    await redis.connect();

    logger.info('Redis connected');
  } catch (err) {
    logger.fatal({ err: err.message }, 'Initial Redis connection failed');
    throw err; // ← CRITICAL
  }
}
