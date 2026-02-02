import { disableApiKey, generateApiKey, getApiKeyConfig, isApiKeyValid, storeApiKey } from "../lib/apiKeys.js";
import { logger } from "../lib/logger.js";
import { hashKey } from "./rateLimit.js";
import { metrics } from "../lib/metrics.js";


export async function apiKeyAuth(req, res, next) {
  const apiKey = req.header("X-API-Key");
  if (!apiKey) {
    metrics.auth_failures++;
    logger.warn({ reqId: req.id }, "missing_api_key");
    return res.status(401).json({ error: "MISSING_API_KEY" });
  }
  let valid;
  try {
    valid = await isApiKeyValid(apiKey);
  } catch (err) {
    console.error("API key validation failure:", err);
    return res.status(503).json({
      error: "AUTH_BACKEND_UNAVAILABLE",
    });
  }
  if (!valid) {
    metrics.auth_failures++;
    logger.warn(
      { reqId: req.id, apiKey: hashKey(apiKey) },
      "invalid_api_key"
    );
    return res.status(403).json({ error: "INVALID_API_KEY" });
  }
  req.apiKey = apiKey;
  next();
}

export async function rotateApiKey(oldApiKey) {
  const oldConfig = await getApiKeyConfig(oldApiKey);
  if (oldConfig?.status !== "active") {
    return null;
  }
  const newApiKey = generateApiKey();
  await storeApiKey(newApiKey, {
    limit: oldConfig.limit,
    window: oldConfig.window,
    burst: oldConfig.burst,
  });
  await disableApiKey(oldApiKey);
  return {
    oldApiKey,
    newApiKey,
    limits: {
      limit: oldConfig.limit,
      window: oldConfig.window,
      burst: oldConfig.burst,
    },
  };
}
