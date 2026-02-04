import { redis } from './redis.js';
import { getApiKeyConfig } from './apiKeys.js';
import { rateLimiterSha, luaScript } from './lua.js';

export async function checkRateLimit(apiKey) {
  const config = await getApiKeyConfig(apiKey);
  const now = Math.floor(Date.now() / 1000);

  if (config?.status !== 'active') {
    return {
      allowed: false,
      limit: 0,
      remaining: 0,
      resetAt: now,
    };
  }

  const bucketKey = `bucket:${apiKey}`;

  try {
    const result = await redis.evalSha(rateLimiterSha, {
      keys: [bucketKey],
      arguments: [
        now.toString(),
        config.limit.toString(),
        config.window.toString(),
        config.burst.toString(),
      ],
    });

    const [allowed, remaining, resetAt, retryAfter] = result;

    return {
      allowed: allowed === 1,
      limit: config.limit + config.burst,
      remaining,
      resetAt,
      retryAfter,
    };
  } catch (err) {
    // Redis restarted, script missing
    if (err?.message?.includes('NOSCRIPT')) {
      await redis.scriptLoad(luaScript);

      return checkRateLimit(apiKey);
    }

    throw err;
  }
}
