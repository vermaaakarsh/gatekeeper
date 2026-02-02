import { describe, it, expect } from "vitest";
import { generateApiKey } from "../../src/lib/apiKeys.js";

describe("generateApiKey", () => {
  it("generates a non-empty API key", () => {
    const key = generateApiKey();
    expect(typeof key).toBe("string");
    expect(key.length).toBeGreaterThan(10);
  });
});
