import { describe, it, expect } from "vitest";
import { request } from "../../test/setup.js";

describe("GET /health", () => {
  it("returns ok", async () => {
    const res = await request.get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });
});
