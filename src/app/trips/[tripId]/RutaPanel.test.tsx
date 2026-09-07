import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RutaPanel } from "./RutaPanel";
import type { CitySearchResult } from "@/lib/geo/mapbox-search";
import type { TripStopData } from "@/lib/trips/stops";

// Mock server actions
vi.mock("./stops/actions", () => ({
  searchCitiesAction: vi.fn(),
  addStopAction: vi.fn(),
  removeStopAction: vi.fn(),
  updateStopNightsAction: vi.fn(),
  getStopsAction: vi.fn(),
}));

import * as stopActions from "./stops/actions";

// RouteMap draws via d3 into an SVG — irrelevant to RutaPanel's own logic,
// so it's stubbed down to just its stop count for these tests.
vi.mock("@/components/site/RouteMap", () => ({
  RouteMap: ({ stops }: { stops?: { id: string; city: string }[] }) => (
    <div data-testid="route-map">{stops?.length ?? 0} stops</div>
  ),
}));

describe("RutaPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders search input and empty state initially", async () => {
    vi.mocked(stopActions.getStopsAction).mockResolvedValue([]);

    render(<RutaPanel tripId="trip-1" tripStartDate="2026-10-12" />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Escribí el nombre de una ciudad")).toBeInTheDocument();
    });
    expect(screen.getByText("Empezá a armar tu ruta buscando una ciudad")).toBeInTheDocument();
  });

  it("shows search results after debounce", async () => {
    const user = userEvent.setup();
    vi.mocked(stopActions.getStopsAction).mockResolvedValue([]);

    const mockResults: CitySearchResult[] = [
      {
        city: "Buenos Aires",
        country: "Argentina",
        latitude: -34.6037,
        longitude: -58.3816,
      },
      {
        city: "La Plata",
        country: "Argentina",
        latitude: -34.9205,
        longitude: -57.9549,
      },
    ];

    vi.mocked(stopActions.searchCitiesAction).mockResolvedValue(mockResults);

    render(<RutaPanel tripId="trip-1" tripStartDate="2026-10-12" />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Escribí el nombre de una ciudad")).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText("Escribí el nombre de una ciudad");
    await user.type(input, "Buenos");

    // Wait for debounce and search results
    await waitFor(
      () => {
        expect(screen.getByText("Buenos Aires")).toBeInTheDocument();
        expect(screen.getByText("La Plata")).toBeInTheDocument();
      },
      { timeout: 1000 },
    );
  });

  it("adds a stop when clicking a search result", async () => {
    const user = userEvent.setup();
    vi.mocked(stopActions.getStopsAction)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: "stop-1",
          tripId: "trip-1",
          position: 1,
          city: "Buenos Aires",
          country: "Argentina",
          latitude: -34.6037,
          longitude: -58.3816,
          nights: 1,
          status: "thinking",
          transportMode: null,
        },
      ]);

    const mockResults: CitySearchResult[] = [
      {
        city: "Buenos Aires",
        country: "Argentina",
        latitude: -34.6037,
        longitude: -58.3816,
      },
    ];

    const mockStop: TripStopData = {
      id: "stop-1",
      tripId: "trip-1",
      position: 1,
      city: "Buenos Aires",
      country: "Argentina",
      latitude: -34.6037,
      longitude: -58.3816,
      nights: 1,
      status: "thinking",
      transportMode: null,
    };

    vi.mocked(stopActions.searchCitiesAction).mockResolvedValue(mockResults);
    vi.mocked(stopActions.addStopAction).mockResolvedValue({ ok: true, stop: mockStop });

    render(<RutaPanel tripId="trip-1" tripStartDate="2026-10-12" />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Escribí el nombre de una ciudad")).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText("Escribí el nombre de una ciudad");
    await user.type(input, "Buenos");

    await waitFor(
      () => {
        expect(screen.getByText("Buenos Aires")).toBeInTheDocument();
      },
      { timeout: 1000 },
    );

    await user.click(screen.getByText("Buenos Aires"));

    await waitFor(() => {
      expect(stopActions.addStopAction).toHaveBeenCalledWith(
        "trip-1",
        "Buenos Aires",
        "Argentina",
        -34.6037,
        -58.3816,
      );
    });
  });

  it("displays stops with computed dates", async () => {
    const mockStop: TripStopData = {
      id: "stop-1",
      tripId: "trip-1",
      position: 1,
      city: "Buenos Aires",
      country: "Argentina",
      latitude: -34.6037,
      longitude: -58.3816,
      nights: 2,
      status: "thinking",
      transportMode: null,
    };

    vi.mocked(stopActions.getStopsAction).mockResolvedValue([mockStop]);

    render(<RutaPanel tripId="trip-1" tripStartDate="2026-10-12" />);

    await waitFor(() => {
      expect(screen.getByText("Buenos Aires")).toBeInTheDocument();
      expect(screen.getByText("Argentina")).toBeInTheDocument();
      // Start date is 2026-10-12, 2 nights means end date is 2026-10-14
      expect(screen.getByText("2026-10-12 a 2026-10-14")).toBeInTheDocument();
    });
  });

  it("removes a stop when clicking remove button", async () => {
    const user = userEvent.setup();

    const mockStop: TripStopData = {
      id: "stop-1",
      tripId: "trip-1",
      position: 1,
      city: "Buenos Aires",
      country: "Argentina",
      latitude: -34.6037,
      longitude: -58.3816,
      nights: 1,
      status: "thinking",
      transportMode: null,
    };

    vi.mocked(stopActions.getStopsAction)
      .mockResolvedValueOnce([mockStop])
      .mockResolvedValueOnce([]);
    vi.mocked(stopActions.removeStopAction).mockResolvedValue({ ok: true, removedPosition: 1 });

    render(<RutaPanel tripId="trip-1" tripStartDate="2026-10-12" />);

    await waitFor(() => {
      expect(screen.getByText("Buenos Aires")).toBeInTheDocument();
    });

    const removeButton = screen.getByLabelText("Eliminar parada");
    await user.click(removeButton);

    await waitFor(() => {
      expect(stopActions.removeStopAction).toHaveBeenCalledWith("trip-1", "stop-1");
    });

    // After removal, should show empty state
    await waitFor(() => {
      expect(screen.getByText("Empezá a armar tu ruta buscando una ciudad")).toBeInTheDocument();
    });
  });

  it("shows warning banner when max stops reached", async () => {
    const mockStops: TripStopData[] = Array.from({ length: 10 }, (_, i) => ({
      id: `stop-${i}`,
      tripId: "trip-1",
      position: i + 1,
      city: `City ${i}`,
      country: "Country",
      latitude: i,
      longitude: i,
      nights: 1,
      status: "thinking",
      transportMode: null,
    }));

    vi.mocked(stopActions.getStopsAction).mockResolvedValue(mockStops);

    render(<RutaPanel tripId="trip-1" tripStartDate="2026-10-12" />);

    await waitFor(() => {
      expect(
        screen.getByText(
          /Llegaste al máximo de 10 paradas. Eliminá una para agregar más./,
        ),
      ).toBeInTheDocument();
    });

    // Search input should be disabled
    const input = screen.getByPlaceholderText("Escribí el nombre de una ciudad");
    expect(input).toBeDisabled();
  });

  it("should search cities and call searchCitiesAction", async () => {
    const user = userEvent.setup();
    vi.mocked(stopActions.getStopsAction).mockResolvedValue([]);

    const mockResults: CitySearchResult[] = [
      {
        city: "Buenos Aires",
        country: "Argentina",
        latitude: -34.6037,
        longitude: -58.3816,
      },
    ];

    vi.mocked(stopActions.searchCitiesAction).mockResolvedValue(mockResults);

    render(<RutaPanel tripId="trip-1" tripStartDate="2026-10-12" />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Escribí el nombre de una ciudad")).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText("Escribí el nombre de una ciudad");
    await user.type(input, "Buenos");

    await waitFor(
      () => {
        expect(stopActions.searchCitiesAction).toHaveBeenCalledWith("trip-1", "Buenos");
      },
      { timeout: 1000 },
    );
  });

  it("renders the route map once there's at least one stop", async () => {
    const mockStop: TripStopData = {
      id: "stop-1",
      tripId: "trip-1",
      position: 1,
      city: "Buenos Aires",
      country: "Argentina",
      latitude: -34.6037,
      longitude: -58.3816,
      nights: 1,
      status: "thinking",
      transportMode: null,
    };

    vi.mocked(stopActions.getStopsAction).mockResolvedValueOnce([mockStop]);

    render(<RutaPanel tripId="trip-1" tripStartDate="2026-10-12" />);

    await waitFor(() => {
      expect(screen.getByTestId("route-map")).toBeInTheDocument();
    });
    expect(screen.getByTestId("route-map")).toHaveTextContent("1 stops");
  });

  it("does not render the route map with zero stops", async () => {
    vi.mocked(stopActions.getStopsAction).mockResolvedValueOnce([]);

    render(<RutaPanel tripId="trip-1" tripStartDate="2026-10-12" />);

    await waitFor(() => {
      expect(
        screen.getByText("Empezá a armar tu ruta buscando una ciudad"),
      ).toBeInTheDocument();
    });

    expect(screen.queryByTestId("route-map")).not.toBeInTheDocument();
  });

  it('shows a disabled "Ver el viaje" button once there\'s at least one stop', async () => {
    const mockStop: TripStopData = {
      id: "stop-1",
      tripId: "trip-1",
      position: 1,
      city: "Buenos Aires",
      country: "Argentina",
      latitude: -34.6037,
      longitude: -58.3816,
      nights: 1,
      status: "thinking",
      transportMode: null,
    };

    vi.mocked(stopActions.getStopsAction).mockResolvedValueOnce([mockStop]);

    render(<RutaPanel tripId="trip-1" tripStartDate="2026-10-12" />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Ver el viaje" })).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: "Ver el viaje" })).toBeDisabled();
  });

  it('does not show the "Ver el viaje" button with zero stops', async () => {
    vi.mocked(stopActions.getStopsAction).mockResolvedValueOnce([]);

    render(<RutaPanel tripId="trip-1" tripStartDate="2026-10-12" />);

    await waitFor(() => {
      expect(
        screen.getByText("Empezá a armar tu ruta buscando una ciudad"),
      ).toBeInTheDocument();
    });

    expect(screen.queryByRole("button", { name: "Ver el viaje" })).not.toBeInTheDocument();
  });
});
