// @vitest-environment node
import { describe, expect, it } from "vitest";
import { hasAnyBooking } from "./bookings";

describe("hasAnyBooking", () => {
  it("always returns false — a stand-in until #12/#13 add a real Booking model", async () => {
    expect(await hasAnyBooking("any-trip-id")).toBe(false);
  });
});
