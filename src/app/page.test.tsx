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

  it("has a #gastos section with the total and 3 settle rows", () => {
    render(<Home />);

    const section = document.getElementById("gastos");
    expect(section).toBeInTheDocument();
    expect(screen.getByText("US$834,10")).toBeInTheDocument();
    expect(section?.textContent).toContain("Juan le transfiere");
    expect(section?.textContent).toContain("US$50");
    expect(section?.textContent).toContain("a María");
  });

  it("has a #vouchers section with the 3 stop cards", () => {
    render(<Home />);

    const section = document.getElementById("vouchers");
    expect(section).toBeInTheDocument();
    expect(screen.getByText("Sevilla")).toBeInTheDocument();
    expect(screen.getByText("Madrid")).toBeInTheDocument();
    expect(screen.getByText("Barcelona")).toBeInTheDocument();
  });

  it("shows the same avatar color for the same person everywhere they appear", () => {
    render(<Home />);

    const marias = screen.getAllByTitle("María");
    expect(marias.length).toBeGreaterThan(1);
    for (const avatar of marias) {
      expect(avatar.className).toContain("bg-avatar-4");
    }
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
