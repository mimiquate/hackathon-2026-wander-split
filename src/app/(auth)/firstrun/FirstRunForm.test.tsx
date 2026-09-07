import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FirstRunForm } from "./FirstRunForm";

const { saveFirstRunAction, skipFirstRunAction } = vi.hoisted(() => ({
  saveFirstRunAction: vi.fn(),
  skipFirstRunAction: vi.fn(),
}));
vi.mock("./actions", () => ({ saveFirstRunAction, skipFirstRunAction }));

describe("FirstRunForm", () => {
  it("shows the busy label and disables both buttons while Guardar is pending", async () => {
    let resolveAction!: (value: object) => void;
    saveFirstRunAction.mockReturnValue(new Promise((resolve) => (resolveAction = resolve)));
    skipFirstRunAction.mockResolvedValue({});
    render(<FirstRunForm currentName={null} />);

    fireEvent.change(screen.getByLabelText("Tu nombre"), { target: { value: "Juan" } });
    fireEvent.click(screen.getByRole("button", { name: /Guardar/ }));

    const guardarBtn = await screen.findByRole("button", { name: "Guardando…" });
    expect(guardarBtn).toBeDisabled();
    const buttons = screen.getAllByRole<HTMLButtonElement>("button");
    expect(buttons.every((btn) => btn.disabled)).toBe(true);

    resolveAction({});
  });

  it("shows the busy label and disables both buttons while Después is pending", async () => {
    let resolveAction!: (value: object) => void;
    saveFirstRunAction.mockResolvedValue({});
    skipFirstRunAction.mockReturnValue(new Promise((resolve) => (resolveAction = resolve)));
    render(<FirstRunForm currentName={null} />);

    fireEvent.click(screen.getByRole("button", { name: "Después" }));

    const skipBtn = await screen.findByRole("button", { name: "Un momento…" });
    expect(skipBtn).toBeDisabled();
    const buttons = screen.getAllByRole<HTMLButtonElement>("button");
    expect(buttons.every((btn) => btn.disabled)).toBe(true);

    resolveAction({});
  });

  it("prefills the name field from currentName", () => {
    saveFirstRunAction.mockResolvedValue({});
    skipFirstRunAction.mockResolvedValue({});
    render(<FirstRunForm currentName="Juan" />);

    expect(screen.getByDisplayValue("Juan")).toBeInTheDocument();
  });
});
