import { redis } from "./redis.js";

const LIMIT = 100;          // requests
const WINDOW_SECONDS = 60; // per minute
const BURST = 20;

export const RATE_LIMIT = LIMIT + BURST;

export async function checkRateLimit(apiKey) {
  const key = `bucket:${apiKey}`;
  const now = Math.floor(Date.now() / 1000);

  const bucket = await redis.hGetAll(key);

  // First request for this key
  if (!bucket.tokens) {
    const tokens = RATE_LIMIT - 1;

    await redis.hSet(key, {
      tokens,
      last_refill: now,
    });

    await redis.expire(key, WINDOW_SECONDS * 2);

    return {
      allowed: true,
      limit: RATE_LIMIT,
      remaining: tokens,
      resetAt: now + WINDOW_SECONDS,
    };
  }

  let tokens = Number.parseInt(bucket.tokens, 10);
  let lastRefill = Number.parseInt(bucket.last_refill, 10);

  const elapsed = now - lastRefill;
  const refillRate = LIMIT / WINDOW_SECONDS;
  const refill = Math.floor(elapsed * refillRate);

  if (refill > 0) {
    tokens = Math.min(RATE_LIMIT, tokens + refill);
    lastRefill = now;
  }

  if (tokens <= 0) {
    return {
      allowed: false,
      limit: RATE_LIMIT,
      remaining: 0,
      resetAt: lastRefill + WINDOW_SECONDS,
      retryAfter: Math.max(0, WINDOW_SECONDS - elapsed),
    };
  }

  tokens -= 1;

  await redis.hSet(key, {
    tokens,
    last_refill: lastRefill,
  });

  await redis.expire(key, WINDOW_SECONDS * 2);

  return {
    allowed: true,
    limit: RATE_LIMIT,
    remaining: tokens,
    resetAt: lastRefill + WINDOW_SECONDS,
  };
}
