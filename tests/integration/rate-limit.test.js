import { describe, it, expect } from "vitest";
import { request } from "../../test/setup.js";

describe("Rate limiting", () => {
  let apiKey;

  it("creates a constrained API key", async () => {
    const res = await request
      .post("/admin/api-keys")
      .set("X-Admin-Secret", "test-admin-secret")
      .send({ limit: 1, window: 60, burst: 0 });

    apiKey = res.body.apiKey;
    expect(apiKey).toBeDefined();
  });

  it("allows first request", async () => {
    const res = await request
      .post("/v1/limit/check")
      .set("X-API-Key", apiKey);

    expect(res.status).toBe(200);
    expect(res.headers["x-ratelimit-remaining"]).toBe("0");
  });

  it("blocks second request", async () => {
    const res = await request
      .post("/v1/limit/check")
      .set("X-API-Key", apiKey);

    expect(res.status).toBe(429);
  });
});
