import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { RouteMap } from "./RouteMap";

describe("RouteMap", () => {
  it("renders the demo route when no stops are given", () => {
    render(<RouteMap />);
    expect(screen.getByRole("img")).toHaveAttribute(
      "aria-label",
      "Ruta: Sevilla, Madrid, Barcelona",
    );
  });

  it("renders real stops when given", () => {
    render(
      <RouteMap
        stops={[
          { id: "s1", city: "Buenos Aires", latitude: -34.6037, longitude: -58.3816 },
          { id: "s2", city: "Mendoza", latitude: -32.8895, longitude: -68.845 },
        ]}
      />,
    );
    expect(screen.getByRole("img")).toHaveAttribute(
      "aria-label",
      "Ruta: Buenos Aires, Mendoza",
    );
  });

  it("labels a single stop without a route list", () => {
    render(
      <RouteMap
        stops={[{ id: "s1", city: "Ushuaia", latitude: -54.8, longitude: -68.3 }]}
      />,
    );
    expect(screen.getByRole("img")).toHaveAttribute("aria-label", "Ruta: Ushuaia");
  });

  it("marks stop markers as interactive when requested", () => {
    render(
      <RouteMap
        stops={[
          { id: "s1", city: "Buenos Aires", latitude: -34.6037, longitude: -58.3816 },
          { id: "s2", city: "Mendoza", latitude: -32.8895, longitude: -68.845 },
        ]}
        interactive
      />,
    );

    expect(screen.getByRole("button", { name: "Parada: Buenos Aires" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Parada: Mendoza" })).toBeInTheDocument();
  });

  it("does not expose markers as buttons when not interactive", () => {
    render(
      <RouteMap
        stops={[{ id: "s1", city: "Buenos Aires", latitude: -34.6037, longitude: -58.3816 }]}
      />,
    );
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("calls onStopClick with the clicked stop when interactive", async () => {
    const user = userEvent.setup();
    const onStopClick = vi.fn();
    const stops = [
      { id: "s1", city: "Buenos Aires", latitude: -34.6037, longitude: -58.3816 },
      { id: "s2", city: "Mendoza", latitude: -32.8895, longitude: -68.845 },
    ];

    render(<RouteMap stops={stops} interactive onStopClick={onStopClick} />);

    await user.click(screen.getByRole("button", { name: "Parada: Mendoza" }));

    expect(onStopClick).toHaveBeenCalledWith(stops[1]);
  });
});
