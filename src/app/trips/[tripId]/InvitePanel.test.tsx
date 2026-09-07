import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { InvitePanel } from "./InvitePanel";

const { reserveInviteEmailAction } = vi.hoisted(() => ({ reserveInviteEmailAction: vi.fn() }));
vi.mock("./actions", () => ({ reserveInviteEmailAction }));

const ADMIN = { membershipId: "m1", userId: "u1", displayName: "María", colorIndex: 1, role: "admin" as const };

function addEmail(email: string) {
  fireEvent.change(screen.getByLabelText("Sumar por correo"), { target: { value: email } });
  fireEvent.click(screen.getByRole("button", { name: "Sumar" }));
}

describe("InvitePanel", () => {
  it("shows the creator as joined and marked admin", () => {
    render(
      <InvitePanel
        tripId="trip-1"
        inviteUrl="http://localhost:3000/i/abc123"
        members={[ADMIN]}
        initialPendingReservations={[]}
      />,
    );

    expect(screen.getByText("María")).toBeInTheDocument();
    expect(screen.getByText("Admin")).toBeInTheDocument();
  });

  it("copies the invite link to the clipboard", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    render(
      <InvitePanel
        tripId="trip-1"
        inviteUrl="http://localhost:3000/i/abc123"
        members={[ADMIN]}
        initialPendingReservations={[]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Copiar" }));
    expect(writeText).toHaveBeenCalledWith("http://localhost:3000/i/abc123");
    expect(await screen.findByRole("button", { name: "Copiado" })).toBeInTheDocument();
  });

  it("leaves the button as Copiar when clipboard access is denied", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("Write permission denied."));
    Object.assign(navigator, { clipboard: { writeText } });

    render(
      <InvitePanel
        tripId="trip-1"
        inviteUrl="http://localhost:3000/i/abc123"
        members={[ADMIN]}
        initialPendingReservations={[]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Copiar" }));
    await waitFor(() => expect(writeText).toHaveBeenCalled());
    expect(screen.getByRole("button", { name: "Copiar" })).toBeInTheDocument();
  });

  it("shows an optimistic pending row labeled by the email immediately, before the action resolves", async () => {
    let resolveAction!: (value: object) => void;
    reserveInviteEmailAction.mockReturnValue(new Promise((resolve) => (resolveAction = resolve)));

    render(
      <InvitePanel
        tripId="trip-1"
        inviteUrl="http://localhost:3000/i/abc123"
        members={[ADMIN]}
        initialPendingReservations={[]}
      />,
    );

    addEmail("guest@example.com");

    expect(await screen.findByText("guest@example.com")).toBeInTheDocument();
    expect(screen.getByText("Pendiente")).toBeInTheDocument();

    resolveAction({ ok: true, reservationId: "r1", email: "guest@example.com", alreadyReserved: false });
    await screen.findByText("guest@example.com");
  });

  it("does not create a second pending row when the same email is added twice", async () => {
    reserveInviteEmailAction.mockResolvedValue({
      ok: true,
      reservationId: "r1",
      email: "guest@example.com",
      alreadyReserved: false,
    });

    render(
      <InvitePanel
        tripId="trip-1"
        inviteUrl="http://localhost:3000/i/abc123"
        members={[ADMIN]}
        initialPendingReservations={[]}
      />,
    );

    addEmail("guest@example.com");
    await screen.findByText("guest@example.com");

    addEmail("guest@example.com");

    expect(screen.getAllByText("guest@example.com")).toHaveLength(1);
    expect(reserveInviteEmailAction).toHaveBeenCalledTimes(1);
  });

  it("rolls back the optimistic row and shows the field error when reserving fails", async () => {
    reserveInviteEmailAction.mockResolvedValue({
      ok: false,
      fieldErrors: { email: "Esa persona ya está en el viaje." },
    });

    render(
      <InvitePanel
        tripId="trip-1"
        inviteUrl="http://localhost:3000/i/abc123"
        members={[ADMIN]}
        initialPendingReservations={[]}
      />,
    );

    addEmail("maria@example.com");

    expect(await screen.findByText("Esa persona ya está en el viaje.")).toBeInTheDocument();
    expect(screen.queryByText("maria@example.com")).not.toBeInTheDocument();
  });

  it("renders reservations already pending when the panel loads", () => {
    render(
      <InvitePanel
        tripId="trip-1"
        inviteUrl="http://localhost:3000/i/abc123"
        members={[ADMIN]}
        initialPendingReservations={[{ reservationId: "r1", email: "guest@example.com" }]}
      />,
    );

    expect(screen.getByText("guest@example.com")).toBeInTheDocument();
  });
});
