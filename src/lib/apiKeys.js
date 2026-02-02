import crypto from "node:crypto";
import { redis } from "./redis.js";

const API_KEY_PREFIX = "api_key:";

export function generateApiKey() {
  return "sk_" + crypto.randomBytes(24).toString("hex");
}

export async function storeApiKey(apiKey) {
  await redis.set(`${API_KEY_PREFIX}${apiKey}`, "active");
}

export async function isApiKeyValid(apiKey) {
  if (!apiKey) return false;
  const value = await redis.get(`${API_KEY_PREFIX}${apiKey}`);
  return value === "active";
}
