import { describe, expect, it } from "vitest";
import "./globals.css";

// jsdom's getComputedStyle doesn't resolve nested var() chains the way a real
// browser does (see Phase 5/6, which use Playwright for anything needing that),
// so these assertions check the cascaded custom-property text itself rather
// than a fully-resolved color/font value.
describe("design tokens", () => {
  it("loads the Ruta Terracota tokens globally, light mode by default", () => {
    const root = getComputedStyle(document.documentElement);

    expect(root.getPropertyValue("--primary").trim()).toBe(
      "var(--terracota-500)",
    );
    expect(root.getPropertyValue("--terracota-500").trim()).toBe("#C1682F");
    expect(root.getPropertyValue("--font-display").trim()).toContain(
      "Bricolage Grotesque",
    );
    expect(document.documentElement.getAttribute("data-theme")).toBeNull();
  });

  it("bridges the tokens into Tailwind's theme (ADR 0001)", () => {
    // jsdom doesn't apply rules inside @layer (which is how Tailwind emits
    // its whole theme), so this checks the compiled stylesheet text itself
    // rather than a computed style — the real-browser rendering is covered
    // by Playwright in later phases.
    const compiledCss = Array.from(document.querySelectorAll("style"))
      .map((style) => style.textContent ?? "")
      .join("\n");

    expect(compiledCss).toContain("--color-primary: var(--primary)");
    expect(compiledCss).toContain("--font-display: var(--font-display)");
    expect(compiledCss).toContain("--radius-pill: var(--radius-pill)");
  });
});
