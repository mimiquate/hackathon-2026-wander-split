import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button, type ButtonSize, type ButtonVariant } from "./Button";

const VARIANTS: ButtonVariant[] = ["primary", "secondary", "ghost", "alert"];
const SIZES: ButtonSize[] = ["sm", "md", "lg"];

describe("Button", () => {
  it.each(VARIANTS)("renders the %s variant without error", (variant) => {
    render(<Button variant={variant}>Armar un viaje</Button>);
    expect(screen.getByRole("button", { name: "Armar un viaje" })).toBeInTheDocument();
  });

  it.each(SIZES)("renders the %s size without error", (size) => {
    render(<Button size={size}>Armar un viaje</Button>);
    expect(screen.getByRole("button", { name: "Armar un viaje" })).toBeInTheDocument();
  });

  it("shifts fill color on hover and press, never opacity-only, for every filled variant", () => {
    render(<Button variant="primary">Primary</Button>);
    const primary = screen.getByRole("button").className;
    expect(primary).toContain("hover:bg-primary-hover");
    expect(primary).toContain("active:bg-primary-press");

    render(<Button variant="alert">Alert</Button>);
    const alert = screen.getByRole("button", { name: "Alert" }).className;
    expect(alert).toContain("hover:bg-[var(--ocre-500)]");
    expect(alert).not.toMatch(/hover:opacity/);
  });

  it("shows a scale-down press state", () => {
    render(<Button>Press me</Button>);
    expect(screen.getByRole("button").className).toContain("active:scale-[0.97]");
  });

  it("shows a terracota focus ring, never a default outline", () => {
    render(<Button>Focusable</Button>);
    const className = screen.getByRole("button").className;
    expect(className).toContain("outline-none");
    expect(className).toContain("focus-visible:outline-solid");
    expect(className).toContain("focus-visible:outline-[var(--focus-ring)]");
  });

  it("renders left/right icons when provided", () => {
    render(
      <Button iconLeft="plus" iconRight="arrow-right">
        Agregar
      </Button>,
    );
    const icons = screen.getByRole("button").querySelectorAll('[aria-hidden="true"]');
    expect(icons).toHaveLength(2);
  });

  it("disables interaction when disabled", () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });
});
