import { describe, expect, it } from "vitest";
import { crew, expenses, settlements, stops } from "./demo-data";

// Locks the ported values against ui_kits/app/data.js in the "wonderSplit
// Design System" project — a transcription slip here would silently break
// the "same avatar color everywhere" rule across every section.
describe("demo-data", () => {
  it("matches the source crew list exactly", () => {
    expect(crew).toEqual([
      { name: "Juan", colorIndex: 0 },
      { name: "María", colorIndex: 3 },
      { name: "Sofi", colorIndex: 1 },
      { name: "Nico", colorIndex: 2 },
      { name: "Tomi", colorIndex: 4 },
      { name: "Ale", colorIndex: 0 },
    ]);
  });

  it("uses the Sevilla → Madrid → Barcelona route", () => {
    expect(stops.map((s) => s.city)).toEqual(["Sevilla", "Madrid", "Barcelona"]);
    expect(stops.map((s) => s.state)).toEqual(["booked", "urgent", "thinking"]);
    expect(stops.map((s) => s.nights)).toEqual([2, 2, 3]);
  });

  it("matches the source expenses list, reskinned to the current route", () => {
    expect(expenses).toHaveLength(5);
    expect(expenses[0]).toEqual({
      label: "Tren Sevilla–Madrid",
      meta: "pagó Juan · 12 oct",
      amount: "€62,00",
      converted: "US$68,40",
      who: [0, 1, 2],
    });
    expect(expenses[3].converted).toBeUndefined();
  });

  it("matches the source settlements list exactly", () => {
    expect(settlements).toEqual([
      { from: 0, to: 1, amount: "US$50" },
      { from: 2, to: 1, amount: "US$18" },
      { from: 4, to: 3, amount: "US$34" },
    ]);
  });

  it("keeps every settlement's from/to as a valid crew index", () => {
    for (const { from, to } of settlements) {
      expect(crew[from]).toBeDefined();
      expect(crew[to]).toBeDefined();
    }
  });
});
