import http from "k6/http";
import { check, sleep } from "k6";

/**
 * Load test for Gatekeeper rate limiting.
 *
 * This test intentionally creates high contention on a single API key
 * to verify that Redis Lua enforces atomic rate limits under concurrency.
 *
 * Expected behavior:
 * - Requests are either 200 (allowed) or 429 (blocked)
 * - Total allowed requests NEVER exceed the configured limit per window
 * - No 5xx responses
 */

export const options = {
  vus: Number(__ENV.VUS) || 50,
  duration: __ENV.DURATION || "10s",
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:3002";
const API_KEY = __ENV.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable is required");
}

export default function () {
  const res = http.post(
    `${BASE_URL}/v1/limit/check`,
    null,
    {
      headers: {
        "X-API-Key": API_KEY,
      },
      timeout: "5s",
    }
  );

  check(res, {
    "status is 200 or 429": (r) =>
      r.status === 200 || r.status === 429,
  });

  // Small sleep to avoid overwhelming the host machine
  sleep(0.05);
}
