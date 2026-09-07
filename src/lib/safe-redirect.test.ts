import { describe, expect, it } from "vitest";
import { isSafeRedirectPath } from "./safe-redirect";

describe("isSafeRedirectPath", () => {
  it.each(["/i/abc123", "/trips/abc123", "/", "/a/b?x=1"])("accepts %j", (path) => {
    expect(isSafeRedirectPath(path)).toBe(true);
  });

  it.each([
    "",
    "//evil.com",
    "/\\evil.com",
    "http://evil.com",
    "https://evil.com/i/abc",
    "evil.com",
    "javascript:alert(1)",
  ])("rejects %j", (path) => {
    expect(isSafeRedirectPath(path)).toBe(false);
  });
});
