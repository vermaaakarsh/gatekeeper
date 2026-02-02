import { redis } from "./redis.js";
import { getApiKeyConfig } from "./apiKeys.js";

export async function checkRateLimit(apiKey) {
  const now = Math.floor(Date.now() / 1000);

  // Load per-key configuration
  const config = await getApiKeyConfig(apiKey);

  if (config?.status !== "active") {
    return {
      allowed: false,
      limit: 0,
      remaining: 0,
      resetAt: now,
    };
  }

  const LIMIT = config.limit;
  const WINDOW_SECONDS = config.window;
  const BURST = config.burst;
  const RATE_LIMIT = LIMIT + BURST;

  const key = `bucket:${apiKey}`;
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
