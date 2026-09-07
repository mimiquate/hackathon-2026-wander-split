import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusChip } from "./StatusChip";

describe("StatusChip", () => {
  it.each([
    ["thinking", "Lo estamos pensando"],
    ["urgent", "Hay que comprarlo YA"],
    ["booked", "¡Reservado!"],
    ["settled", "Saldado"],
  ] as const)("falls back to the default label for %s", (state, label) => {
    render(<StatusChip state={state} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it("renders custom children instead of the default label", () => {
    render(<StatusChip state="booked">¡Reservado! (custom)</StatusChip>);
    expect(screen.getByText("¡Reservado! (custom)")).toBeInTheDocument();
    expect(screen.queryByText("¡Reservado!")).not.toBeInTheDocument();
  });

  it("defaults to the thinking state when none is given", () => {
    render(<StatusChip />);
    expect(screen.getByText("Lo estamos pensando")).toBeInTheDocument();
  });
});
