import { describe, expect, it } from "vitest";
import {
  crew,
  crew3,
  crew4,
  crew6,
  gastosTotal,
  heroLedger,
  settle1,
  settle2,
  settle3,
  settleHero,
  settlements,
  stops,
} from "./demo-data";

// Locks the ported values against Landing Page.dc.html's embedded
// renderVals() in the "Apps landing page UI mockup" project — a
// transcription slip here would silently break the "same avatar color
// everywhere" rule across every section.
describe("demo-data", () => {
  it("matches the source crew list exactly", () => {
    expect(crew).toEqual([
      { name: "María", colorIndex: 1 },
      { name: "Juan", colorIndex: 2 },
      { name: "Sofi", colorIndex: 3 },
      { name: "Nico", colorIndex: 4 },
      { name: "Tomás", colorIndex: 5 },
      { name: "Ale", colorIndex: 1 },
    ]);
  });

  it("slices crew the same way as the source (crew6/crew4/crew3)", () => {
    expect(crew6).toEqual(crew);
    expect(crew4).toEqual(crew.slice(0, 4));
    expect(crew3).toEqual(crew.slice(1, 4));
  });

  it("matches the source hero ledger rows exactly", () => {
    expect(heroLedger).toEqual([
      {
        label: "Depa en Triana",
        meta: "pagó María · 12 oct · Sevilla",
        amount: "€620,00",
        converted: "US$684,00",
        people: crew4,
      },
      {
        label: "AVE a Madrid",
        meta: "pagó Juan · 15 oct",
        amount: "€62,00",
        converted: "US$68,40",
        people: crew6,
      },
    ]);
  });

  it("matches the source settlements exactly (Juan→María, Sofi→María, Nico→Tomás done)", () => {
    expect(settleHero).toEqual({ from: crew[1], to: crew[0], amount: "US$50,00" });
    expect(settle1).toEqual(settleHero);
    expect(settle2).toEqual({ from: crew[2], to: crew[0], amount: "US$128,00" });
    expect(settle3).toEqual({
      from: crew[3],
      to: crew[4],
      amount: "US$74,50",
      done: true,
    });
    expect(settlements).toEqual([settle1, settle2, settle3]);
  });

  it("matches the source Gastos total", () => {
    expect(gastosTotal).toBe("US$1.386,40");
  });

  it("uses the Sevilla → Madrid → Barcelona route with the source's stop details", () => {
    expect(stops.map((s) => s.city)).toEqual(["Sevilla", "Madrid", "Barcelona"]);
    expect(stops.map((s) => s.state)).toEqual(["booked", "urgent", "thinking"]);
    expect(stops.map((s) => s.nights)).toEqual([3, 2, 2]);
    expect(stops[0].people).toEqual(crew6);
    expect(stops[1].people).toEqual(crew4);
    expect(stops[2].people).toEqual(crew3);
  });
});
