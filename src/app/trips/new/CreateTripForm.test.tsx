import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CreateTripForm } from "./CreateTripForm";

const { createTripAction } = vi.hoisted(() => ({ createTripAction: vi.fn() }));
vi.mock("./actions", () => ({ createTripAction }));

function fillFields({ name, startDate }: { name?: string; startDate?: string }) {
  if (name !== undefined) {
    fireEvent.change(screen.getByLabelText("Nombre del viaje"), { target: { value: name } });
  }
  if (startDate !== undefined) {
    fireEvent.change(screen.getByLabelText("Arranca el"), { target: { value: startDate } });
  }
}

describe("CreateTripForm", () => {
  it("defaults the currency picker to USD", () => {
    render(<CreateTripForm />);
    expect(screen.getByLabelText("Moneda")).toHaveValue("USD");
  });

  it("calls createTripAction with the submitted values", async () => {
    createTripAction.mockResolvedValue({});
    render(<CreateTripForm />);

    fillFields({ name: "Verano en Sevilla", startDate: "2026-10-12" });
    fireEvent.click(screen.getByRole("button", { name: "Crear viaje" }));

    await screen.findByRole("button", { name: "Crear viaje" });
    expect(createTripAction).toHaveBeenCalledTimes(1);
    const submittedData = createTripAction.mock.calls[0][1] as FormData;
    expect(submittedData.get("name")).toEqual("Verano en Sevilla");
    expect(submittedData.get("startDate")).toEqual("2026-10-12");
    expect(submittedData.get("currency")).toEqual("USD");
  });

  it("does not submit when the name is blank (native required validation)", () => {
    render(<CreateTripForm />);
    fillFields({ name: "", startDate: "2026-10-12" });
    fireEvent.click(screen.getByRole("button", { name: "Crear viaje" }));
    expect(createTripAction).not.toHaveBeenCalled();
  });

  it("does not submit when the start date is blank (native required validation)", () => {
    render(<CreateTripForm />);
    fillFields({ name: "Verano en Sevilla", startDate: "" });
    fireEvent.click(screen.getByRole("button", { name: "Crear viaje" }));
    expect(createTripAction).not.toHaveBeenCalled();
  });

  it("renders the exact name field error", async () => {
    createTripAction.mockResolvedValue({ fieldErrors: { name: "Poné un nombre para el viaje." } });
    render(<CreateTripForm />);

    fillFields({ name: "Verano en Sevilla", startDate: "2026-10-12" });
    fireEvent.click(screen.getByRole("button", { name: "Crear viaje" }));

    expect(await screen.findByText("Poné un nombre para el viaje.")).toBeInTheDocument();
  });

  it("renders the exact start date field error", async () => {
    createTripAction.mockResolvedValue({
      fieldErrors: { startDate: "Elegí cuándo arranca el viaje." },
    });
    render(<CreateTripForm />);

    fillFields({ name: "Verano en Sevilla", startDate: "2026-10-12" });
    fireEvent.click(screen.getByRole("button", { name: "Crear viaje" }));

    expect(await screen.findByText("Elegí cuándo arranca el viaje.")).toBeInTheDocument();
  });

  it("shows the busy label and disables the submit button while pending", async () => {
    let resolveAction!: (value: object) => void;
    createTripAction.mockReturnValue(new Promise((resolve) => (resolveAction = resolve)));
    render(<CreateTripForm />);

    fillFields({ name: "Verano en Sevilla", startDate: "2026-10-12" });
    fireEvent.click(screen.getByRole("button", { name: "Crear viaje" }));

    const button = await screen.findByRole("button", { name: "Creando el viaje…" });
    expect(button).toBeDisabled();

    resolveAction({});
    await screen.findByRole("button", { name: "Crear viaje" });
  });
});
