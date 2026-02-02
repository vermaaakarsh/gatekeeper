import { checkRateLimit } from "../lib/rateLimiter.js";

export async function rateLimit(req, res, next) {
  const result = await checkRateLimit(req.apiKey);

  res.set({
    "X-RateLimit-Limit": result.limit,
    "X-RateLimit-Remaining": result.remaining,
    "X-RateLimit-Reset": result.resetAt,
  });

  if (!result.allowed) {
    return res.status(429).json({
      error: "Rate limit exceeded",
      retry_after_seconds: result.retryAfter,
    });
  }

  next();
}
