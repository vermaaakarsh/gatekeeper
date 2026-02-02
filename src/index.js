import "dotenv/config";
import express from "express";
import { connectRedis } from "./lib/redis.js";
import { adminAuth } from "./middleware/adminAuth.js";
import { generateApiKey, storeApiKey } from "./lib/apiKeys.js";
import { apiKeyAuth } from "./middleware/apiKeyAuth.js";

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
app.get("/protected", apiKeyAuth, (req, res) => {
  res.json({ status: "allowed", apiKey: req.apiKey });
});



const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Gatekeeper API running on port ${PORT}`);
});
