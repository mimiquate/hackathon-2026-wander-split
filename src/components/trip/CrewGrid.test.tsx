import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CrewGrid } from "./CrewGrid";

describe("CrewGrid", () => {
  it("renders a joined member with their name and marks the admin", () => {
    render(
      <CrewGrid
        members={[
          { membershipId: "m1", userId: "u1", displayName: "María", colorIndex: 1, role: "admin" },
          { membershipId: "m2", userId: "u2", displayName: "Juan", colorIndex: 2, role: "participant" },
        ]}
        pendingReservations={[]}
      />,
    );

    expect(screen.getByText("María")).toBeInTheDocument();
    expect(screen.getByText("Juan")).toBeInTheDocument();
    expect(screen.getByText("Admin")).toBeInTheDocument();
  });

  it("renders a pending reservation labeled by its email with a Pendiente badge", () => {
    render(
      <CrewGrid
        members={[]}
        pendingReservations={[{ reservationId: "r1", email: "guest@example.com" }]}
      />,
    );

    expect(screen.getByText("guest@example.com")).toBeInTheDocument();
    expect(screen.getByText("Pendiente")).toBeInTheDocument();
  });

  it("renders joined and pending rows together", () => {
    render(
      <CrewGrid
        members={[{ membershipId: "m1", userId: "u1", displayName: "María", colorIndex: 1, role: "admin" }]}
        pendingReservations={[{ reservationId: "r1", email: "guest@example.com" }]}
      />,
    );

    expect(screen.getByText("María")).toBeInTheDocument();
    expect(screen.getByText("guest@example.com")).toBeInTheDocument();
  });
});
