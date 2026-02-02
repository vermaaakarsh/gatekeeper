import { isApiKeyValid } from "../lib/apiKeys.js";

export async function apiKeyAuth(req, res, next) {
  const apiKey = req.header("X-API-Key");

  if (!apiKey) {
    return res.status(401).json({ error: "Missing API key" });
  }

  const valid = await isApiKeyValid(apiKey);
  if (!valid) {
    return res.status(403).json({ error: "Invalid API key" });
  }

  req.apiKey = apiKey;
  next();
}
