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

import { APP_VERSION } from './config/version.js';

let server;
let isShuttingDown = false;
let isBootstrapping = false;

export async function createServer() {
  isBootstrapping = true;

  try {
    await connectRedis();

    if (isShuttingDown) return;

    await loadRateLimiterScript();

    if (isShuttingDown) return;

    const openApiPath = new URL('../openapi.yaml', import.meta.url);
    const openApiSpec = yaml.parse(fs.readFileSync(openApiPath, 'utf8'));

    const app = express();

    app.use(express.json());
    app.use(
      pinoHttp({
        logger,
        genReqId: () => crypto.randomUUID(),
      })
    );

    app.set('trust proxy', true);

    // ---------------- Docs ----------------
    app.use('/docs', swaggerUi.serve, (req, res) => {
      const dynamicSpec = {
        ...openApiSpec,
        info: {
          ...openApiSpec.info,
          version: APP_VERSION,
        },
        servers: [
          {
            url: `${req.protocol}://${req.get('host')}`,
            description: 'Current deployment origin',
          },
        ],
      };

      return swaggerUi.setup(dynamicSpec, {
        explorer: true,
        customSiteTitle: 'Gatekeeper API Documentation',
      })(req, res);
    });

    // ---------------- Health ----------------
    app.get('/health', (req, res) => {
      res.json({ status: 'ok' });
    });

    // ---------------- Metrics ----------------
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

    // ---------------- Admin ----------------
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

    // ---------------- Rate Limiting ----------------
    app.post('/v1/limit/check', apiKeyAuth, rateLimit, (req, res) => {
      res.json({ allowed: true });
    });

    // ---------------- Root Info ----------------
    app.get('/', (req, res) => {
      res.json({
        service: {
          name: 'Gatekeeper',
          description:
            'Distributed API key management and atomic rate-limiting service',
          version: APP_VERSION,
          environment: process.env.NODE_ENV || 'development',
        },
        endpoints: {
          documentation: '/docs',
          health: '/health',
          metrics: '/metrics',
          rateLimitCheck: '/v1/limit/check',
        },
      });
    });

    const PORT = process.env.PORT || 3002;

    server = app.listen(PORT, () => {
      logger.info(`Gatekeeper API running on port ${PORT}`);
    });

    isBootstrapping = false;
    return server;
  } catch (err) {
    isBootstrapping = false;
    throw err;
  }
}

export async function shutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info(`Received ${signal}. Shutting down gracefully...`);

  // If shutdown during bootstrap
  if (isBootstrapping) {
    logger.warn('Shutdown requested during bootstrap.');
  }

  if (!server) {
    logger.warn('Server not initialized. Exiting immediately.');

    try {
      if (redis?.isOpen) {
        await redis.quit();
        logger.info('Redis connection closed');
      }
    } catch (err) {
      logger.error({ err: err.message }, 'Error during Redis shutdown');
    }

    process.exit(0);
  }

  server.close(async () => {
    logger.info('HTTP server closed');

    try {
      if (redis?.isOpen) {
        await redis.quit();
        logger.info('Redis connection closed');
      }
    } catch (err) {
      logger.error({ err: err.message }, 'Error during Redis shutdown');
    }

    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Graceful shutdown timed out');
    process.exit(1);
  }, 5000);
}
