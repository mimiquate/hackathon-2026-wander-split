import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Checkbox } from "./Checkbox";

describe("Checkbox", () => {
  it("toggles when the label text is clicked", () => {
    const onChange = vi.fn();
    render(<Checkbox label="Acepto los términos" checked={false} onChange={onChange} />);

    fireEvent.click(screen.getByText("Acepto los términos"));
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("does not toggle when a nested link inside the label is clicked", () => {
    const onChange = vi.fn();
    render(
      <Checkbox
        label={
          <>
            Acepto los <a href="/terms">términos</a>
          </>
        }
        checked={false}
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByRole("link", { name: "términos" }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("renders a muted description line", () => {
    render(<Checkbox label="Acepto" description="Solo para este viaje" checked={false} />);
    expect(screen.getByText("Solo para este viaje")).toBeInTheDocument();
  });
});
