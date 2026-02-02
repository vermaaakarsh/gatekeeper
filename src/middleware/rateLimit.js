import { checkRateLimit } from "../lib/rateLimiter.js";

export async function rateLimit(req, res, next) {
  let result;

  try {
    result = await checkRateLimit(req.apiKey);
  } catch (err) {
    console.error("Rate limiter failure:", err);

    return res.status(503).json({
      error: "RATE_LIMITER_UNAVAILABLE",
    });
  }

  res.set({
    "X-RateLimit-Limit": result.limit,
    "X-RateLimit-Remaining": result.remaining,
    "X-RateLimit-Reset": result.resetAt,
  });

  if (!result.allowed) {
    return res.status(429).json({
      error: "RATE_LIMIT_EXCEEDED",
      retry_after_seconds: result.retryAfter,
    });
  }

  next();
}
