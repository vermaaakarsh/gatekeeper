import fs from "node:fs";
import crypto from "node:crypto";
import { redis } from "./redis.js";
import { logger } from "./logger.js";

const luaScriptPath = new URL("./rateLimiter.lua", import.meta.url);
export const luaScript = fs.readFileSync(luaScriptPath, "utf8");

// Precompute SHA so we never guess
export const rateLimiterSha = crypto
  .createHash("sha1")
  .update(luaScript)
  .digest("hex");

export async function loadRateLimiterScript() {
  try {
    await redis.scriptLoad(luaScript);

    logger.info(
      { sha: rateLimiterSha },
      "rate_limiter_lua_script_loaded"
    );
  } catch (err) {
    logger.error(
      { err: err.message },
      "failed_to_load_rate_limiter_lua_script"
    );
    throw err;
  }
}
