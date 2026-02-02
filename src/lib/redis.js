import { createClient } from "redis";

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error("REDIS_URL is not defined");
}

export const redis = createClient({
  url: redisUrl,

  socket: {
    connectTimeout: 2000,   // 2s to establish connection
    reconnectStrategy: false, // fail fast
  },

  commandTimeout: 2000, // 2s max per command
});

let isConnected = false;

redis.on("error", (err) => {
  console.error("Redis error:", err.message);
});

export async function connectRedis() {
  if (isConnected) return;

  try {
    await redis.connect();
    isConnected = true;
    console.log("Connected to Redis");
  } catch (err) {
    console.error("Initial Redis connection failed:", err.message);
    // DO NOT crash — service can still start
  }
}
