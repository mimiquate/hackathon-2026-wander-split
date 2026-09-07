import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TripsGrid } from "./TripsGrid";
import type { UserTripSummary } from "@/lib/trips/list";

function makeTrip(overrides: Partial<UserTripSummary> = {}): UserTripSummary {
  return {
    id: "trip-1",
    name: "Viaje de prueba",
    startDate: new Date("2026-10-12T00:00:00.000Z"),
    members: [{ name: "María", colorIndex: 1 }],
    cities: [],
    ...overrides,
  };
}

describe("TripsGrid", () => {
  it("shows the invented empty-state copy and only the 'Nuevo viaje' card when there are no trips", () => {
    render(<TripsGrid trips={[]} />);

    expect(screen.getByText("Armá tu primer viaje")).toBeInTheDocument();
    expect(screen.getByText("Nuevo viaje")).toBeInTheDocument();
    expect(screen.queryByText(/viajes$/)).not.toBeInTheDocument();
  });

  it("shows the real trip count eyebrow instead of the empty state once there's at least one trip", () => {
    render(<TripsGrid trips={[makeTrip()]} />);

    expect(screen.getByText("1 viaje")).toBeInTheDocument();
    expect(screen.queryByText("Armá tu primer viaje")).not.toBeInTheDocument();
  });

  it("pluralizes the eyebrow for more than one trip", () => {
    render(<TripsGrid trips={[makeTrip({ id: "a" }), makeTrip({ id: "b" })]} />);
    expect(screen.getByText("2 viajes")).toBeInTheDocument();
  });

  it("always renders the 'Nuevo viaje' card first, ahead of every trip card", () => {
    render(<TripsGrid trips={[makeTrip({ id: "a", name: "Primero" }), makeTrip({ id: "b", name: "Segundo" })]} />);

    const links = screen.getAllByRole("link");
    expect(links[0]).toHaveAttribute("href", "/trips/new");
    expect(links[1]).toHaveAttribute("href", "/trips/a");
    expect(links[2]).toHaveAttribute("href", "/trips/b");
  });
});
