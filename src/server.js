import express from 'express';
import swaggerUi from 'swagger-ui-express';
import fs from 'node:fs';
import yaml from 'yaml';
import crypto from 'node:crypto';
import pinoHttp from 'pino-http';

import { logger } from './lib/logger.js';
import { connectRedis, redis } from './lib/redis.js';
import { loadRateLimiterScript } from './lib/lua.js';
import { metrics } from './lib/metrics.js';
import { errorResponse } from './lib/error.js';

import { generateApiKey, storeApiKey, disableApiKey } from './lib/apiKeys.js';

import { adminAuth } from './middleware/adminAuth.js';
import { apiKeyAuth, rotateApiKey } from './middleware/apiKeyAuth.js';
import { rateLimit } from './middleware/rateLimit.js';

let server;
let isShuttingDown = false;

export async function createServer() {
  // 1️⃣ Connect dependencies
  await connectRedis();
  await loadRateLimiterScript();

  // 2️⃣ Load OpenAPI spec
  const openApiPath = new URL('../openapi.yaml', import.meta.url);
  const openApiSpec = yaml.parse(fs.readFileSync(openApiPath, 'utf8'));

  // 3️⃣ Create app
  const app = express();

  app.use(express.json());
  app.use(
    pinoHttp({
      logger,
      genReqId: () => crypto.randomUUID(),
    })
  );

  // 4️⃣ Docs
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));

  // 5️⃣ Core routes
  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/metrics', (req, res) => {
    res.set('Content-Type', 'text/plain');
    res.send(
      `
# HELP gatekeeper_requests_total Total number of requests
# TYPE gatekeeper_requests_total counter
gatekeeper_requests_total ${metrics.requests_total}

# HELP gatekeeper_requests_allowed Allowed requests
# TYPE gatekeeper_requests_allowed counter
gatekeeper_requests_allowed ${metrics.requests_allowed}

# HELP gatekeeper_requests_blocked Blocked requests
# TYPE gatekeeper_requests_blocked counter
gatekeeper_requests_blocked ${metrics.requests_blocked}

# HELP gatekeeper_auth_failures Authentication failures
# TYPE gatekeeper_auth_failures counter
gatekeeper_auth_failures ${metrics.auth_failures}

# HELP gatekeeper_rate_limiter_errors Backend rate limiter errors
# TYPE gatekeeper_rate_limiter_errors counter
gatekeeper_rate_limiter_errors ${metrics.rate_limiter_errors}
`.trim()
    );
  });

  // 6️⃣ Admin routes
  app.post('/admin/api-keys', adminAuth, async (req, res) => {
    const { limit, window, burst } = req.body || {};
    const apiKey = generateApiKey();

    await storeApiKey(apiKey, { limit, window, burst });

    res.status(201).json({
      apiKey,
      limits: {
        limit: limit ?? 'default',
        window: window ?? 'default',
        burst: burst ?? 'default',
      },
    });
  });

  app.post('/admin/api-keys/:key/disable', adminAuth, async (req, res) => {
    const success = await disableApiKey(req.params.key);

    if (!success) {
      return res
        .status(404)
        .json(
          errorResponse(
            'API_KEY_NOT_FOUND',
            "The provided api key doesn't exist"
          )
        );
    }

    res.json({ status: 'disabled' });
  });

  app.post('/admin/api-keys/:key/rotate', adminAuth, async (req, res) => {
    const result = await rotateApiKey(req.params.key);

    if (!result) {
      return res
        .status(404)
        .json(
          errorResponse(
            'API_KEY_NOT_FOUND_OR_INACTIVE',
            'API key not found or inactive'
          )
        );
    }

    res.json(result);
  });

  // 7️⃣ Rate limiting
  app.post('/v1/limit/check', apiKeyAuth, rateLimit, (req, res) => {
    res.json({ allowed: true });
  });

  // 8️⃣ Start server
  const PORT = process.env.PORT || 3002;
  server = app.listen(PORT, () => {
    logger.info(`Gatekeeper API running on port ${PORT}`);
  });

  return server;
}

// 9️⃣ Graceful shutdown (shared)
export async function shutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info(`\nReceived ${signal}. Shutting down gracefully...`);

  server.close(async () => {
    logger.info('HTTP server closed');

    try {
      if (redis.isOpen) {
        await redis.quit();
        logger.info('Redis connection closed');
      }
    } catch (err) {
      logger.error('Error during Redis shutdown', err);
    }

    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Graceful shutdown timed out');
    process.exit(1);
  }, 5000);
}
