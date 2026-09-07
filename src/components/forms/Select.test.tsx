import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Select } from "./Select";

const OPTIONS = [
  { value: "USD", label: "USD" },
  { value: "EUR", label: "EUR" },
];

describe("Select", () => {
  it("renders the label and lets the field be found by it", () => {
    render(<Select label="Moneda" options={OPTIONS} />);
    expect(screen.getByLabelText("Moneda")).toBeInTheDocument();
  });

  it("renders every option", () => {
    render(<Select label="Moneda" options={OPTIONS} />);
    expect(screen.getByRole("option", { name: "USD" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "EUR" })).toBeInTheDocument();
  });

  it("renders the error copy in place of the hint, and marks the field invalid", () => {
    render(<Select label="Moneda" options={OPTIONS} hint="Elegí una." error="Elegí una moneda." />);
    expect(screen.getByText("Elegí una moneda.")).toBeInTheDocument();
    expect(screen.queryByText("Elegí una.")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Moneda")).toHaveAttribute("aria-invalid", "true");
  });

  it("disables the field", () => {
    render(<Select label="Moneda" options={OPTIONS} disabled />);
    expect(screen.getByLabelText("Moneda")).toBeDisabled();
  });
});
