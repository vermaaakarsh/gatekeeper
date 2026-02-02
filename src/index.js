import "dotenv/config";
import express from "express";
import { connectRedis } from "./lib/redis.js";
import { adminAuth } from "./middleware/adminAuth.js";
import { generateApiKey, storeApiKey } from "./lib/apiKeys.js";
import { apiKeyAuth } from "./middleware/apiKeyAuth.js";
import { checkRateLimit } from "./lib/rateLimiter.js";


await connectRedis();

const app = express();
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});



app.post("/admin/api-keys", adminAuth, async (req, res) => {
  const apiKey = generateApiKey();
  await storeApiKey(apiKey);

  res.status(201).json({ apiKey });
});

app.post("/v1/limit/check", apiKeyAuth, async (req, res) => {
  const result = await checkRateLimit(req.apiKey);

  if (!result.allowed) {
    return res.status(429).json({
      error: "Rate limit exceeded",
      retry_after_seconds: result.retryAfter,
    });
  }

  res.json({
    allowed: true,
    remaining: result.remaining,
    reset_at: result.resetAt,
  });
});




const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Gatekeeper API running on port ${PORT}`);
});
