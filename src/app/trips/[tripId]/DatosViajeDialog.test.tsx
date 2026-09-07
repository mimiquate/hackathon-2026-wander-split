import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DatosViajeDialog } from "./DatosViajeDialog";

const { updateTripAction } = vi.hoisted(() => ({ updateTripAction: vi.fn() }));
vi.mock("./actions", () => ({ updateTripAction }));

describe("DatosViajeDialog", () => {
  it("shows the trip name in the header and opens the dialog pre-filled on the pencil trigger", () => {
    render(
      <DatosViajeDialog
        tripId="trip-1"
        initialName="Verano en Sevilla"
        initialStartDate="2026-10-12"
        canEditStartDate
      />,
    );

    expect(screen.getByText("Verano en Sevilla")).toBeInTheDocument();
    expect(screen.queryByLabelText("Nombre del viaje")).not.toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Editar datos del viaje" }));

    expect(screen.getByLabelText("Nombre del viaje")).toHaveValue("Verano en Sevilla");
    expect(screen.getByLabelText("Arranca el")).toHaveValue("2026-10-12");
  });

  it("enables the start-date field when there are no bookings", () => {
    render(
      <DatosViajeDialog tripId="trip-1" initialName="Trip" initialStartDate="2026-10-12" canEditStartDate />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Editar datos del viaje" }));
    expect(screen.getByLabelText("Arranca el")).not.toBeDisabled();
  });

  it("disables the start-date field with the exact explanatory copy once a booking exists", () => {
    render(
      <DatosViajeDialog
        tripId="trip-1"
        initialName="Trip"
        initialStartDate="2026-10-12"
        canEditStartDate={false}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Editar datos del viaje" }));

    expect(screen.getByLabelText("Arranca el")).toBeDisabled();
    expect(
      screen.getByText(
        "Ya hay una reserva confirmada en este viaje, así que no se puede cambiar la fecha de inicio.",
      ),
    ).toBeInTheDocument();
  });

  it("renaming succeeds, updates the header, and closes the dialog", async () => {
    updateTripAction.mockResolvedValue({ ok: true, name: "Nuevo nombre", startDate: "2026-10-12" });

    render(
      <DatosViajeDialog tripId="trip-1" initialName="Trip" initialStartDate="2026-10-12" canEditStartDate />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Editar datos del viaje" }));
    fireEvent.change(screen.getByLabelText("Nombre del viaje"), { target: { value: "Nuevo nombre" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

    expect(updateTripAction).toHaveBeenCalledWith("trip-1", {
      name: "Nuevo nombre",
      startDate: "2026-10-12",
    });
    await waitFor(() => expect(screen.queryByLabelText("Nombre del viaje")).not.toBeVisible());
    expect(screen.getByText("Nuevo nombre")).toBeInTheDocument();
  });

  it("shows the exact field error and keeps the dialog open when the server rejects it", async () => {
    updateTripAction.mockResolvedValue({
      ok: false,
      fieldErrors: { name: "Poné un nombre para el viaje." },
    });

    render(
      <DatosViajeDialog tripId="trip-1" initialName="Trip" initialStartDate="2026-10-12" canEditStartDate />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Editar datos del viaje" }));
    fireEvent.change(screen.getByLabelText("Nombre del viaje"), { target: { value: "   " } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(screen.getByText("Poné un nombre para el viaje.")).toBeInTheDocument());
    expect(screen.getByLabelText("Nombre del viaje")).toBeVisible();
  });

  it("shows the busy label and disables the submit button while pending", async () => {
    let resolveAction!: (value: object) => void;
    updateTripAction.mockReturnValue(new Promise((resolve) => (resolveAction = resolve)));

    render(
      <DatosViajeDialog tripId="trip-1" initialName="Trip" initialStartDate="2026-10-12" canEditStartDate />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Editar datos del viaje" }));
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

    const button = await screen.findByRole("button", { name: "Guardando…" });
    expect(button).toBeDisabled();

    resolveAction({ ok: true, name: "Trip", startDate: "2026-10-12" });
    await waitFor(() => expect(updateTripAction).toHaveBeenCalled());
  });
});
