import crypto from "node:crypto";
import { checkRateLimit } from "../lib/rateLimiter.js";
import { logger } from "../lib/logger.js";

export function hashKey(apiKey) {
  return crypto.createHash("sha256").update(apiKey).digest("hex").slice(0, 12);
}

export async function rateLimit(req, res, next) {
  const start = Date.now();
  let result;

  try {
    result = await checkRateLimit(req.apiKey);
  } catch (err) {
    logger.error(
      {
        reqId: req.id,
        err: err.message,
      },
      "rate_limiter_unavailable"
    );

    return res.status(503).json({
      error: "RATE_LIMITER_UNAVAILABLE",
    });
  }

  res.set({
    "X-RateLimit-Limit": result.limit,
    "X-RateLimit-Remaining": result.remaining,
    "X-RateLimit-Reset": result.resetAt,
  });

  const durationMs = Date.now() - start;

  logger.info(
    {
      reqId: req.id,
      apiKey: hashKey(req.apiKey),
      route: req.originalUrl,
      allowed: result.allowed,
      remaining: result.remaining,
      durationMs,
    },
    "rate_limit_decision"
  );

  if (!result.allowed) {
    return res.status(429).json({
      error: "RATE_LIMIT_EXCEEDED",
      retry_after_seconds: result.retryAfter,
    });
  }

  next();
}
