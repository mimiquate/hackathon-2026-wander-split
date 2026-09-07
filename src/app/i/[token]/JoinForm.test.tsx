import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { JoinForm } from "./JoinForm";

const { joinTripAction } = vi.hoisted(() => ({ joinTripAction: vi.fn() }));
vi.mock("./actions", () => ({ joinTripAction }));

function fillName(name: string) {
  fireEvent.change(screen.getByLabelText("Cómo querés que te llamen"), { target: { value: name } });
}

describe("JoinForm", () => {
  it("calls joinTripAction bound to the token, with the submitted name and default color", async () => {
    joinTripAction.mockResolvedValue({});
    render(<JoinForm token="abc123" />);

    fillName("Juli");
    fireEvent.click(screen.getByRole("button", { name: "Sumarme al viaje" }));

    await screen.findByRole("button", { name: "Sumarme al viaje" });
    expect(joinTripAction).toHaveBeenCalledTimes(1);
    const [token, , formData] = joinTripAction.mock.calls[0] as [string, unknown, FormData];
    expect(token).toEqual("abc123");
    expect(formData.get("displayName")).toEqual("Juli");
    expect(formData.get("colorIndex")).toEqual("0");
  });

  it("submits the chosen color", async () => {
    joinTripAction.mockResolvedValue({});
    render(<JoinForm token="abc123" />);

    fillName("Juli");
    fireEvent.click(screen.getByRole("radio", { name: "Color 3" }));
    fireEvent.click(screen.getByRole("button", { name: "Sumarme al viaje" }));

    await screen.findByRole("button", { name: "Sumarme al viaje" });
    const [, , formData] = joinTripAction.mock.calls[0] as [string, unknown, FormData];
    expect(formData.get("colorIndex")).toEqual("2");
  });

  it("does not submit when the name is blank (native required validation)", () => {
    render(<JoinForm token="abc123" />);
    fireEvent.click(screen.getByRole("button", { name: "Sumarme al viaje" }));
    expect(joinTripAction).not.toHaveBeenCalled();
  });

  it("renders the exact display name field error", async () => {
    joinTripAction.mockResolvedValue({ fieldErrors: { displayName: "Poné cómo querés que te llamen." } });
    render(<JoinForm token="abc123" />);

    fillName("Juli");
    fireEvent.click(screen.getByRole("button", { name: "Sumarme al viaje" }));

    expect(await screen.findByText("Poné cómo querés que te llamen.")).toBeInTheDocument();
  });

  it("renders a form-level error", async () => {
    joinTripAction.mockResolvedValue({ formError: "Esa invitación no existe o ya no está disponible." });
    render(<JoinForm token="abc123" />);

    fillName("Juli");
    fireEvent.click(screen.getByRole("button", { name: "Sumarme al viaje" }));

    expect(
      await screen.findByText("Esa invitación no existe o ya no está disponible."),
    ).toBeInTheDocument();
  });

  it("shows the busy label and disables the submit button while pending", async () => {
    let resolveAction!: (value: object) => void;
    joinTripAction.mockReturnValue(new Promise((resolve) => (resolveAction = resolve)));
    render(<JoinForm token="abc123" />);

    fillName("Juli");
    fireEvent.click(screen.getByRole("button", { name: "Sumarme al viaje" }));

    const button = await screen.findByRole("button", { name: "Entrando…" });
    expect(button).toBeDisabled();

    resolveAction({});
    await screen.findByRole("button", { name: "Sumarme al viaje" });
  });
});
