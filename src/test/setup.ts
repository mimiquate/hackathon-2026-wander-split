import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

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
