import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CompartirDialog } from "./CompartirDialog";

const { reserveInviteEmailAction } = vi.hoisted(() => ({ reserveInviteEmailAction: vi.fn() }));
vi.mock("./actions", () => ({ reserveInviteEmailAction }));

const ADMIN = { membershipId: "m1", userId: "u1", displayName: "María", colorIndex: 1, role: "admin" as const };

describe("CompartirDialog", () => {
  it("starts closed by default and opens on the Compartir button", () => {
    render(
      <CompartirDialog
        tripId="trip-1"
        inviteUrl="http://localhost:3000/i/abc123"
        members={[ADMIN]}
        initialPendingReservations={[]}
      />,
    );

    expect(screen.queryByText("http://localhost:3000/i/abc123")).not.toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Compartir" }));
    expect(screen.getByText("http://localhost:3000/i/abc123")).toBeVisible();
  });

  it("starts open when defaultOpen is set, right after creating the trip", () => {
    render(
      <CompartirDialog
        tripId="trip-1"
        inviteUrl="http://localhost:3000/i/abc123"
        members={[ADMIN]}
        initialPendingReservations={[]}
        defaultOpen
      />,
    );

    expect(screen.getByText("http://localhost:3000/i/abc123")).toBeVisible();
  });

  it("renders the same crew grid as the invite panel, joined and pending", () => {
    render(
      <CompartirDialog
        tripId="trip-1"
        inviteUrl="http://localhost:3000/i/abc123"
        members={[ADMIN]}
        initialPendingReservations={[{ reservationId: "r1", email: "guest@example.com" }]}
        defaultOpen
      />,
    );

    expect(screen.getByText("María")).toBeInTheDocument();
    expect(screen.getByText("guest@example.com")).toBeInTheDocument();
    expect(screen.getByText("Pendiente")).toBeInTheDocument();
  });

  it("adding an email from the dialog calls the same reserveInviteEmailAction Phase 3 uses", async () => {
    reserveInviteEmailAction.mockResolvedValue({
      ok: true,
      reservationId: "r1",
      email: "guest@example.com",
      alreadyReserved: false,
    });

    render(
      <CompartirDialog
        tripId="trip-1"
        inviteUrl="http://localhost:3000/i/abc123"
        members={[ADMIN]}
        initialPendingReservations={[]}
        defaultOpen
      />,
    );

    fireEvent.change(screen.getByLabelText("Sumar por correo"), {
      target: { value: "guest@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sumar" }));

    await waitFor(() =>
      expect(reserveInviteEmailAction).toHaveBeenCalledWith("trip-1", "guest@example.com"),
    );
    expect(screen.getByText("guest@example.com")).toBeInTheDocument();
  });
});
