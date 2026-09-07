import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TripShell } from "./TripShell";

// Mock the DatosViajeDialog to simplify testing
vi.mock("./DatosViajeDialog", () => ({
  DatosViajeDialog: ({ initialName }: { initialName: string }) => (
    <div data-testid="datos-dialog">{initialName}</div>
  ),
}));

describe("TripShell", () => {
  it("renders all four tabs", () => {
    render(
      <TripShell
        tripId="trip-1"
        tripName="Test Trip"
        tripStartDate="2026-10-12"
        canEditStartDate={true}
        children={{
          ruta: <div>Ruta content</div>,
          grupo: <div>Grupo content</div>,
          gastos: <div>Gastos content</div>,
          balance: <div>Balance content</div>,
        }}
      />,
    );

    expect(screen.getByRole("button", { name: "Ruta" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Grupo" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Gastos" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Balance" })).toBeInTheDocument();
  });

  it("renders Ruta tab by default", () => {
    render(
      <TripShell
        tripId="trip-1"
        tripName="Test Trip"
        tripStartDate="2026-10-12"
        canEditStartDate={true}
        children={{
          ruta: <div>Ruta content</div>,
          grupo: <div>Grupo content</div>,
          gastos: <div>Gastos content</div>,
          balance: <div>Balance content</div>,
        }}
      />,
    );

    expect(screen.getByText("Ruta content")).toBeInTheDocument();
    expect(screen.queryByText("Grupo content")).not.toBeInTheDocument();
    expect(screen.queryByText("Gastos content")).not.toBeInTheDocument();
    expect(screen.queryByText("Balance content")).not.toBeInTheDocument();
  });

  it("switches to Grupo tab when clicked", async () => {
    const user = userEvent.setup();
    render(
      <TripShell
        tripId="trip-1"
        tripName="Test Trip"
        tripStartDate="2026-10-12"
        canEditStartDate={true}
        children={{
          ruta: <div>Ruta content</div>,
          grupo: <div>Grupo content</div>,
          gastos: <div>Gastos content</div>,
          balance: <div>Balance content</div>,
        }}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Grupo" }));

    expect(screen.queryByText("Ruta content")).not.toBeInTheDocument();
    expect(screen.getByText("Grupo content")).toBeInTheDocument();
    expect(screen.queryByText("Gastos content")).not.toBeInTheDocument();
    expect(screen.queryByText("Balance content")).not.toBeInTheDocument();
  });

  it("switches to Gastos tab when clicked", async () => {
    const user = userEvent.setup();
    render(
      <TripShell
        tripId="trip-1"
        tripName="Test Trip"
        tripStartDate="2026-10-12"
        canEditStartDate={true}
        children={{
          ruta: <div>Ruta content</div>,
          grupo: <div>Grupo content</div>,
          gastos: <div>Gastos content</div>,
          balance: <div>Balance content</div>,
        }}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Gastos" }));

    expect(screen.queryByText("Ruta content")).not.toBeInTheDocument();
    expect(screen.queryByText("Grupo content")).not.toBeInTheDocument();
    expect(screen.getByText("Gastos content")).toBeInTheDocument();
    expect(screen.queryByText("Balance content")).not.toBeInTheDocument();
  });

  it("switches to Balance tab when clicked", async () => {
    const user = userEvent.setup();
    render(
      <TripShell
        tripId="trip-1"
        tripName="Test Trip"
        tripStartDate="2026-10-12"
        canEditStartDate={true}
        children={{
          ruta: <div>Ruta content</div>,
          grupo: <div>Grupo content</div>,
          gastos: <div>Gastos content</div>,
          balance: <div>Balance content</div>,
        }}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Balance" }));

    expect(screen.queryByText("Ruta content")).not.toBeInTheDocument();
    expect(screen.queryByText("Grupo content")).not.toBeInTheDocument();
    expect(screen.queryByText("Gastos content")).not.toBeInTheDocument();
    expect(screen.getByText("Balance content")).toBeInTheDocument();
  });

  it("marks active tab with aria-current", async () => {
    const user = userEvent.setup();
    render(
      <TripShell
        tripId="trip-1"
        tripName="Test Trip"
        tripStartDate="2026-10-12"
        canEditStartDate={true}
        children={{
          ruta: <div>Ruta content</div>,
          grupo: <div>Grupo content</div>,
          gastos: <div>Gastos content</div>,
          balance: <div>Balance content</div>,
        }}
      />,
    );

    const rutaTab = screen.getByRole("button", { name: "Ruta" });
    const grupoTab = screen.getByRole("button", { name: "Grupo" });

    expect(rutaTab).toHaveAttribute("aria-current", "page");
    expect(grupoTab).not.toHaveAttribute("aria-current");

    await user.click(grupoTab);

    expect(rutaTab).not.toHaveAttribute("aria-current");
    expect(grupoTab).toHaveAttribute("aria-current", "page");
  });

  it("respects defaultTab prop", () => {
    render(
      <TripShell
        tripId="trip-1"
        tripName="Test Trip"
        tripStartDate="2026-10-12"
        canEditStartDate={true}
        defaultTab="gastos"
        children={{
          ruta: <div>Ruta content</div>,
          grupo: <div>Grupo content</div>,
          gastos: <div>Gastos content</div>,
          balance: <div>Balance content</div>,
        }}
      />,
    );

    expect(screen.queryByText("Ruta content")).not.toBeInTheDocument();
    expect(screen.queryByText("Grupo content")).not.toBeInTheDocument();
    expect(screen.getByText("Gastos content")).toBeInTheDocument();
    expect(screen.queryByText("Balance content")).not.toBeInTheDocument();
  });

  it("renders the DatosViajeDialog with correct props", () => {
    render(
      <TripShell
        tripId="trip-1"
        tripName="My Amazing Trip"
        tripStartDate="2026-10-12"
        canEditStartDate={true}
        children={{
          ruta: <div>Ruta content</div>,
          grupo: <div>Grupo content</div>,
          gastos: <div>Gastos content</div>,
          balance: <div>Balance content</div>,
        }}
      />,
    );

    expect(screen.getByTestId("datos-dialog")).toHaveTextContent("My Amazing Trip");
  });

  it("tab buttons have 44px minimum touch targets", () => {
    const { container } = render(
      <TripShell
        tripId="trip-1"
        tripName="Test Trip"
        tripStartDate="2026-10-12"
        canEditStartDate={true}
        children={{
          ruta: <div>Ruta content</div>,
          grupo: <div>Grupo content</div>,
          gastos: <div>Gastos content</div>,
          balance: <div>Balance content</div>,
        }}
      />,
    );

    const tabButtons = container.querySelectorAll('button[aria-current], button:not([aria-current])');
    tabButtons.forEach((button) => {
      expect(button.className).toContain("min-h-[44px]");
      expect(button.className).toContain("min-w-[44px]");
    });
  });

  it("can switch between multiple tabs sequentially", async () => {
    const user = userEvent.setup();
    render(
      <TripShell
        tripId="trip-1"
        tripName="Test Trip"
        tripStartDate="2026-10-12"
        canEditStartDate={true}
        children={{
          ruta: <div>Ruta content</div>,
          grupo: <div>Grupo content</div>,
          gastos: <div>Gastos content</div>,
          balance: <div>Balance content</div>,
        }}
      />,
    );

    // Start at Ruta
    expect(screen.getByText("Ruta content")).toBeInTheDocument();

    // Go to Grupo
    await user.click(screen.getByRole("button", { name: "Grupo" }));
    expect(screen.getByText("Grupo content")).toBeInTheDocument();

    // Go to Balance
    await user.click(screen.getByRole("button", { name: "Balance" }));
    expect(screen.getByText("Balance content")).toBeInTheDocument();

    // Back to Ruta
    await user.click(screen.getByRole("button", { name: "Ruta" }));
    expect(screen.getByText("Ruta content")).toBeInTheDocument();
  });
});
