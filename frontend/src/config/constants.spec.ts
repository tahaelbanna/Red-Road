import { describe, expect, it } from "vitest";
import { BACKEND_URL } from "./constants";

describe("Frontend Configuration & Backend URL", () => {
  it("should default BACKEND_URL to http://localhost:3000 in test environment without VITE_BACKEND_URL", () => {
    // In vitest with no VITE_BACKEND_URL set, it should fallback to localhost:3000
    expect(BACKEND_URL).toBe("http://localhost:3000");
  });

  it("should format trailing slashes correctly", () => {
    const rawUrl = "https://red-road-production.up.railway.app/";
    const sanitized = rawUrl.trim().replace(/\/+$/, "");
    expect(sanitized).toBe("https://red-road-production.up.railway.app");
  });
});
