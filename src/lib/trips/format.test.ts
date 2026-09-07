import { describe, expect, it } from "vitest";
import { crewCountLabel } from "./format";

describe("crewCountLabel", () => {
  it("uses the singular for exactly one person", () => {
    expect(crewCountLabel(1)).toEqual("1 persona ya está adentro");
  });

  it("uses the plural for zero or more than one", () => {
    expect(crewCountLabel(0)).toEqual("0 personas ya están adentro");
    expect(crewCountLabel(2)).toEqual("2 personas ya están adentro");
  });
});
