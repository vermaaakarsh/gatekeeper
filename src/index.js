import "dotenv/config";
import express from "express";
import swaggerUi from "swagger-ui-express";
import fs from "node:fs";
import yaml from "yaml";
import pinoHttp from "pino-http";
import { logger } from "./lib/logger.js";
import { disableApiKey,generateApiKey, storeApiKey } from "./lib/apiKeys.js";
import { connectRedis, redis } from "./lib/redis.js";
import { adminAuth } from "./middleware/adminAuth.js";
import { apiKeyAuth, rotateApiKey } from "./middleware/apiKeyAuth.js";
import { rateLimit } from "./middleware/rateLimit.js";
import { metrics } from "./lib/metrics.js";
import { loadRateLimiterScript } from "./lib/lua.js";


await connectRedis();
await loadRateLimiterScript();

const PORT = process.env.PORT || 3002;
let isShuttingDown = false;
const openApiPath = new URL("../openapi.yaml", import.meta.url);
const openApiSpec = yaml.parse(fs.readFileSync(openApiPath, "utf8"));

const app = express();

app.use(express.json());
app.use(
  pinoHttp({
    logger,
    genReqId: () => crypto.randomUUID(),
  })
);

app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/metrics", (req, res) => {
  res.set("Content-Type", "text/plain");

    res.send(`
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
  `.trim());
});

app.post("/admin/api-keys", adminAuth, async (req, res) => {
  const { limit, window, burst } = req.body || {};
  const apiKey = generateApiKey();
  await storeApiKey(apiKey, {
    limit,
    window,
    burst,
  });
  res.status(201).json({
    apiKey,
    limits: {
      limit: limit ?? "default",
      window: window ?? "default",
      burst: burst ?? "default",
    },
  });
});
app.post("/admin/api-keys/:key/disable", adminAuth, async (req, res) => {
  const { key } = req.params;
  const success = await disableApiKey(key);
  if (!success) {
    return res.status(404).json(errorResponse("API_KEY_NOT_FOUND","The provided api key doesn't exists in db"));
  }
  res.json({ status: "disabled" });
});
app.post("/admin/api-keys/:key/rotate", adminAuth, async (req, res) => {
  const { key } = req.params;

  const result = await rotateApiKey(key);

  if (!result) {
    return res.status(404).json(errorResponse("API_KEY_NOT_FOUND_OR_INACTIVE","Either the provided api key doesn't exists in db or is inactive"));
  }

  res.json(result);
});

app.post(
  "/v1/limit/check",
  apiKeyAuth,
  rateLimit,
  (req, res) => {
    res.json({ allowed: true });
  }
);


const server = app.listen(PORT, () => {
  logger.info(`Gatekeeper API running on port ${PORT}`);
});
async function shutdown(signal) {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;

  logger.info(`\nReceived ${signal}. Shutting down gracefully...`);

  server.close(async () => {
    logger.info("HTTP server closed");

    try {

      if (redis.isOpen) {
        await redis.quit();
        logger.info("Redis connection closed");
      }
    } catch (err) {
      logger.error("Error during Redis shutdown:", err.message);
    }

    process.exit(0);
  });

  setTimeout(() => {
    logger.error("Graceful shutdown timed out. Forcing exit.");
    process.exit(1);
  }, 5000);
}


process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
