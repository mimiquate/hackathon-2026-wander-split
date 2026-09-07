import { describe, expect, it } from "vitest";
import { formatCalendarDate, formatShortDate, parseCalendarDate } from "./dates";

describe("parseCalendarDate", () => {
  it("parses a valid calendar date at UTC midnight", () => {
    const date = parseCalendarDate("2026-10-12");
    expect(date).not.toBeNull();
    expect(date?.toISOString()).toEqual("2026-10-12T00:00:00.000Z");
  });

  it("round-trips through formatCalendarDate", () => {
    const date = parseCalendarDate("2026-10-12");
    expect(date).not.toBeNull();
    expect(formatCalendarDate(date as Date)).toEqual("2026-10-12");
  });

  it.each([
    "",
    "   ",
    "12/10/2026",
    "2026-10-12T10:00:00Z",
    "2026-13-01",
    "2026-00-01",
    "2026-01-00",
  ])("rejects %j", (value) => {
    expect(parseCalendarDate(value)).toBeNull();
  });

  it("rejects a day that doesn't exist (V8 silently rolls it into March)", () => {
    expect(parseCalendarDate("2026-02-31")).toBeNull();
  });

  it("rejects Feb 29 on a non-leap year", () => {
    expect(parseCalendarDate("2026-02-29")).toBeNull();
  });

  it("accepts Feb 29 on a leap year", () => {
    const date = parseCalendarDate("2024-02-29");
    expect(date).not.toBeNull();
    expect(date?.toISOString()).toEqual("2024-02-29T00:00:00.000Z");
  });

  it("trims surrounding whitespace", () => {
    const date = parseCalendarDate("  2026-10-12  ");
    expect(date?.toISOString()).toEqual("2026-10-12T00:00:00.000Z");
  });
});

describe("formatShortDate", () => {
  it("renders the day and a lowercase Spanish month abbreviation", () => {
    expect(formatShortDate(new Date("2026-10-12T00:00:00.000Z"))).toEqual("12 oct");
  });

  it("reads UTC fields regardless of host timezone", () => {
    expect(formatShortDate(new Date("2026-01-01T00:00:00.000Z"))).toEqual("1 ene");
    expect(formatShortDate(new Date("2026-12-31T00:00:00.000Z"))).toEqual("31 dic");
  });
});
