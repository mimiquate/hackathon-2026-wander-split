import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ColorSwatchPicker } from "./ColorSwatchPicker";
import { AVATAR_COLOR_COUNT } from "@/lib/avatar-colors";

describe("ColorSwatchPicker", () => {
  it("renders one swatch per avatar color", () => {
    render(<ColorSwatchPicker name="colorIndex" />);
    expect(screen.getAllByRole("radio")).toHaveLength(AVATAR_COLOR_COUNT);
  });

  it("defaults the hidden field to 0", () => {
    const { container } = render(<ColorSwatchPicker name="colorIndex" />);
    expect(container.querySelector('input[name="colorIndex"]')).toHaveValue("0");
  });

  it("updates the hidden field when a different swatch is clicked", () => {
    const { container } = render(<ColorSwatchPicker name="colorIndex" />);
    fireEvent.click(screen.getByRole("radio", { name: "Color 3" }));
    expect(container.querySelector('input[name="colorIndex"]')).toHaveValue("2");
    expect(screen.getByRole("radio", { name: "Color 3" })).toHaveAttribute("aria-checked", "true");
  });
});
