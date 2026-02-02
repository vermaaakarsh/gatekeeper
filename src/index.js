import "dotenv/config";
import express from "express";
import { connectRedis } from "./lib/redis.js";

await connectRedis();

const app = express();
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Gatekeeper API running on port ${PORT}`);
});
