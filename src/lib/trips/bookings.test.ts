// @vitest-environment node
import { describe, expect, it } from "vitest";
import { hasAnyBooking } from "./bookings";

describe("hasAnyBooking", () => {
  it("returns false for a trip with no bookings", async () => {
    expect(await hasAnyBooking("any-trip-id")).toBe(false);
  });
});
