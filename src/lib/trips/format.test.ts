import { describe, expect, it } from "vitest";
import { crewCountLabel, travelerCountLabel, tripCountLabel } from "./format";

describe("crewCountLabel", () => {
  it("uses the singular for exactly one person", () => {
    expect(crewCountLabel(1)).toEqual("1 persona ya está adentro");
  });

  it("uses the plural for zero or more than one", () => {
    expect(crewCountLabel(0)).toEqual("0 personas ya están adentro");
    expect(crewCountLabel(2)).toEqual("2 personas ya están adentro");
  });
});

describe("travelerCountLabel", () => {
  it("uses the singular for exactly one traveler", () => {
    expect(travelerCountLabel(1)).toEqual("1 viajero");
  });

  it("uses the plural for zero or more than one", () => {
    expect(travelerCountLabel(0)).toEqual("0 viajeros");
    expect(travelerCountLabel(4)).toEqual("4 viajeros");
  });
});

describe("tripCountLabel", () => {
  it("uses the singular for exactly one trip", () => {
    expect(tripCountLabel(1)).toEqual("1 viaje");
  });

  it("uses the plural for zero or more than one", () => {
    expect(tripCountLabel(0)).toEqual("0 viajes");
    expect(tripCountLabel(2)).toEqual("2 viajes");
  });
});
