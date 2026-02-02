import "dotenv/config";
import express from "express";
import { generateApiKey, storeApiKey } from "./lib/apiKeys.js";
import { connectRedis } from "./lib/redis.js";
import { adminAuth } from "./middleware/adminAuth.js";
import { apiKeyAuth } from "./middleware/apiKeyAuth.js";
import { rateLimit } from "./middleware/rateLimit.js";

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

app.post(
  "/v1/limit/check",
  apiKeyAuth,
  rateLimit,
  (req, res) => {
    res.json({ allowed: true });
  }
);


const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Gatekeeper API running on port ${PORT}`);
});
