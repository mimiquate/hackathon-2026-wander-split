import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Input } from "./Input";

describe("Input", () => {
  it("renders the label and lets the field be found by it", () => {
    render(<Input label="Correo" />);
    expect(screen.getByLabelText("Correo")).toBeInTheDocument();
  });

  it("renders the hint when there is no error", () => {
    render(<Input label="Contraseña" hint="Mínimo 8 caracteres." />);
    expect(screen.getByText("Mínimo 8 caracteres.")).toBeInTheDocument();
  });

  it("renders the exact error copy in place of the hint, and marks the field invalid", () => {
    render(
      <Input
        label="Contraseña"
        hint="Mínimo 8 caracteres."
        error="Usá al menos 8 caracteres."
      />,
    );
    expect(screen.getByText("Usá al menos 8 caracteres.")).toBeInTheDocument();
    expect(screen.queryByText("Mínimo 8 caracteres.")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Contraseña")).toHaveAttribute("aria-invalid", "true");
  });

  it("disables the field", () => {
    render(<Input label="Correo" disabled />);
    expect(screen.getByLabelText("Correo")).toBeDisabled();
  });
});
