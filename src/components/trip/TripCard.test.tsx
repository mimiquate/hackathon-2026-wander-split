import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TripCard } from "./TripCard";
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

describe("TripCard", () => {
  it("renders the route as a string of city names when the trip has stops", () => {
    render(<TripCard trip={makeTrip({ cities: ["Sevilla", "Madrid", "Barcelona"] })} />);
    expect(screen.getByText("Sevilla → Madrid → Barcelona")).toBeInTheDocument();
  });

  it("falls back to the trip name when it has no stops yet", () => {
    render(<TripCard trip={makeTrip({ name: "Viaje sin ruta", cities: [] })} />);
    expect(screen.getByRole("heading", { name: "Viaje sin ruta" })).toBeInTheDocument();
  });

  it("shows the 'Por armar' chip for a trip with no stops", () => {
    render(<TripCard trip={makeTrip({ cities: [] })} />);
    expect(screen.getByText("Por armar")).toBeInTheDocument();
  });

  it("shows the 'En curso' chip once the trip has at least one stop", () => {
    render(<TripCard trip={makeTrip({ cities: ["Sevilla"] })} />);
    expect(screen.getByText("En curso")).toBeInTheDocument();
  });

  it("shows every joined member, with a +N overflow badge past the avatar cap", () => {
    render(
      <TripCard
        trip={makeTrip({
          members: [
            { name: "Ana", colorIndex: 0 },
            { name: "Juan", colorIndex: 1 },
            { name: "Sofi", colorIndex: 2 },
            { name: "Nico", colorIndex: 3 },
            { name: "Tomás", colorIndex: 4 },
          ],
        })}
      />,
    );

    expect(screen.getByTitle("Ana")).toBeInTheDocument();
    expect(screen.queryByTitle("Tomás")).not.toBeInTheDocument();
    expect(screen.getByText("+1")).toBeInTheDocument();
  });

  it("links to the trip's page", () => {
    render(<TripCard trip={makeTrip({ id: "abc123" })} />);
    expect(screen.getByRole("link")).toHaveAttribute("href", "/trips/abc123");
  });
});
