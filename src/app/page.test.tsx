import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "./page";

describe("Home page", () => {
  it("has the 4 in-page nav anchors", () => {
    render(<Home />);

    expect(screen.getByRole("link", { name: "Cómo funciona" })).toHaveAttribute(
      "href",
      "#como-funciona",
    );
    expect(screen.getByRole("link", { name: "Gastos" })).toHaveAttribute(
      "href",
      "#gastos",
    );
    expect(screen.getByRole("link", { name: "Vouchers" })).toHaveAttribute(
      "href",
      "#vouchers",
    );
    expect(screen.getByRole("link", { name: "Precios" })).toHaveAttribute(
      "href",
      "#precios",
    );
  });

  it("has a #como-funciona section with its 3 steps", () => {
    render(<Home />);

    const section = document.getElementById("como-funciona");
    expect(section).toBeInTheDocument();
    expect(screen.getByText("Armen la ruta juntos")).toBeInTheDocument();
    expect(screen.getByText("Todo en un solo lugar")).toBeInTheDocument();
    expect(screen.getByText("La cuenta la hacemos nosotros")).toBeInTheDocument();
  });

  it("has a #precios section with exactly one button", () => {
    render(<Home />);

    const section = document.getElementById("precios");
    expect(section).toBeInTheDocument();
    expect(section?.querySelectorAll("button")).toHaveLength(1);
  });

  it("shows the wordmark and version in the footer", () => {
    render(<Home />);

    expect(
      screen.getByText("wonderSplit — viajes en grupo sin drama"),
    ).toBeInTheDocument();
    expect(screen.getByText("Ruta Terracota v1.0")).toBeInTheDocument();
  });
});
