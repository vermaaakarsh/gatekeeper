import crypto from "node:crypto";
import { checkRateLimit } from "../lib/rateLimiter.js";
import { logger } from "../lib/logger.js";
import { metrics } from "../lib/metrics.js";
import { errorResponse } from "../lib/error.js";

export function hashKey(apiKey) {
  return crypto
    .createHash("sha256")
    .update(apiKey)
    .digest("hex")
    .slice(0, 12);
}

export async function rateLimit(req, res, next) {
  metrics.requests_total++;
  const start = Date.now();
  let result;

  try {
    result = await checkRateLimit(req.apiKey);
  } catch (err) {
    metrics.rate_limiter_errors++;

    logger.error(
      {
        reqId: req.id,
        err: err.message,
      },
      "rate_limiter_unavailable"
    );

    return res.status(503).json(
      errorResponse(
        "RATE_LIMITER_UNAVAILABLE",
        "Rate limiter is unavailable"
      )
    );
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
    metrics.requests_blocked++;

    // Standards-compliant retry hint
    if (typeof result.retryAfter === "number") {
      res.set("Retry-After", result.retryAfter);
    }

    return res.status(429).json(
      errorResponse(
        "RATE_LIMIT_EXCEEDED",
        "Too many requests",
        { retry_after_seconds: result.retryAfter }
      )
    );
  }

  metrics.requests_allowed++;
  next();
}
