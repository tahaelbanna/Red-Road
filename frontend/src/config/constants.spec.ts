import { describe, expect, it } from "vitest";
import { BACKEND_URL } from "./constants";

describe("Frontend Configuration & Backend URL", () => {
  it("should resolve BACKEND_URL to configured VITE_BACKEND_URL or fallback to localhost:3000", () => {
    const expected =
      (import.meta.env.VITE_BACKEND_URL as string | undefined)?.replace(/\/+$/, "") ||
      "http://localhost:3000";
    expect(BACKEND_URL).toBe(expected);
  });

  it("should format trailing slashes correctly", () => {
    const rawUrl = "https://red-road-production.up.railway.app/";
    const sanitized = rawUrl.trim().replace(/\/+$/, "");
    expect(sanitized).toBe("https://red-road-production.up.railway.app");
  });
});
