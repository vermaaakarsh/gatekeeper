import crypto from "node:crypto";
import { redis } from "./redis.js";
import { DEFAULT_LIMITS } from "../config/limits.js";

const API_KEY_PREFIX = "api_key:";

export function generateApiKey() {
  return "sk_" + crypto.randomBytes(24).toString("hex");
}

export async function storeApiKey(apiKey, overrides = {}) {
  const limits = {
    limit:
      typeof overrides.limit === "number"
        ? overrides.limit
        : DEFAULT_LIMITS.limit,

    window:
      typeof overrides.window === "number"
        ? overrides.window
        : DEFAULT_LIMITS.window,

    burst:
      typeof overrides.burst === "number"
        ? overrides.burst
        : DEFAULT_LIMITS.burst,
  };

  await redis.hSet(`${API_KEY_PREFIX}${apiKey}`, {
    status: "active",
    limit: limits.limit.toString(),
    window: limits.window.toString(),
    burst: limits.burst.toString(),
  });
}


export async function getApiKeyConfig(apiKey) {
  const data = await redis.hGetAll(`${API_KEY_PREFIX}${apiKey}`);
  if (!data?.status) return null;

  return {
    status: data.status,
    limit: Number(data.limit),
    window: Number(data.window),
    burst: Number(data.burst),
  };
}

export async function isApiKeyValid(apiKey) {
  if (!apiKey) return false;

  const config = await getApiKeyConfig(apiKey);
  return config?.status === "active";
}

