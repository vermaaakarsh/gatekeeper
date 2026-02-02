import { createClient } from "redis";

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error("REDIS_URL is not defined");
}

export const redis = createClient({
  url: redisUrl,
});

let isConnected = false;

redis.on("error", (err) => {
  console.error("Redis error:", err);
});

export async function connectRedis() {
  if (isConnected) return;

  await redis.connect();
  isConnected = true;
  console.log("Connected to Redis");
}
