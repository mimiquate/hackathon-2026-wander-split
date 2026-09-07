import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// Auth integration tests need a real Postgres DATABASE_URL (see
// docker-compose.yml). Only load .env.test as a fallback, so a value already
// set in the environment (e.g. by a future CI runner) always wins.
if (!process.env.DATABASE_URL) {
  try {
    process.loadEnvFile(".env.test");
  } catch {
    // .env.test not present — fine for test files that don't touch the DB.
  }
}

// jsdom has neither ResizeObserver nor a sandboxed fetch — components that
// use them (RouteMap) get a harmless no-op stub here instead of crashing or
// making a real network call. Individual tests can still override either
// via vi.spyOn.
if (typeof globalThis.ResizeObserver === "undefined") {
  class NoopResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  globalThis.ResizeObserver = NoopResizeObserver as unknown as typeof ResizeObserver;
}

globalThis.fetch = vi.fn(() =>
  Promise.reject(new Error("network access is disabled in Vitest")),
) as unknown as typeof fetch;
