import "dotenv/config";
import express from "express";
import { disableApiKey,generateApiKey, storeApiKey } from "./lib/apiKeys.js";
import { connectRedis } from "./lib/redis.js";
import { adminAuth } from "./middleware/adminAuth.js";
import { apiKeyAuth, rotateApiKey } from "./middleware/apiKeyAuth.js";
import { rateLimit } from "./middleware/rateLimit.js";

await connectRedis();

const PORT = process.env.PORT || 3002;
let isShuttingDown = false;
const app = express();
app.use(express.json());


app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/admin/api-keys", adminAuth, async (req, res) => {
  const { limit, window, burst } = req.body || {};
  const apiKey = generateApiKey();
  await storeApiKey(apiKey, {
    limit,
    window,
    burst,
  });
  res.status(201).json({
    apiKey,
    limits: {
      limit: limit ?? "default",
      window: window ?? "default",
      burst: burst ?? "default",
    },
  });
});
app.post("/admin/api-keys/:key/disable", adminAuth, async (req, res) => {
  const { key } = req.params;
  const success = await disableApiKey(key);
  if (!success) {
    return res.status(404).json({ error: "API_KEY_NOT_FOUND" });
  }
  res.json({ status: "disabled" });
});
app.post("/admin/api-keys/:key/rotate", adminAuth, async (req, res) => {
  const { key } = req.params;

  const result = await rotateApiKey(key);

  if (!result) {
    return res.status(404).json({ error: "API_KEY_NOT_FOUND_OR_INACTIVE" });
  }

  res.json(result);
});

app.post(
  "/v1/limit/check",
  apiKeyAuth,
  rateLimit,
  (req, res) => {
    res.json({ allowed: true });
  }
);


const server = app.listen(PORT, () => {
  console.log(`Gatekeeper API running on port ${PORT}`);
});
async function shutdown(signal) {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;

  console.log(`\nReceived ${signal}. Shutting down gracefully...`);

  server.close(async () => {
    console.log("HTTP server closed");

    try {
      const { redis } = await import("./lib/redis.js");

      if (redis.isOpen) {
        await redis.quit();
        console.log("Redis connection closed");
      }
    } catch (err) {
      console.error("Error during Redis shutdown:", err.message);
    }

    process.exit(0);
  });

  setTimeout(() => {
    console.error("Graceful shutdown timed out. Forcing exit.");
    process.exit(1);
  }, 5000);
}


process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
