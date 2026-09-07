// @vitest-environment node
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { searchCitiesWithMapbox } from "@/lib/geo/mapbox-search";

describe("searchCitiesWithMapbox", () => {
  beforeEach(() => {
    // Mock fetch globally
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns an empty array for an empty query", async () => {
    const result = await searchCitiesWithMapbox("");
    expect(result).toEqual([]);
  });

  it("returns an empty array for a whitespace-only query", async () => {
    const result = await searchCitiesWithMapbox("   ");
    expect(result).toEqual([]);
  });

  it("parses Mapbox response correctly", async () => {
    const mockResponse = {
      features: [
        {
          text: "Buenos Aires",
          place_name: "Buenos Aires, Argentina",
          geometry: {
            coordinates: [-58.3816, -34.6037],
          },
          context: [
            { id: "country.123", text: "Argentina" },
            { id: "place.456", text: "Buenos Aires" },
          ],
        },
        {
          text: "Santiago",
          place_name: "Santiago, Chile",
          geometry: {
            coordinates: [-51.2093, -33.8688],
          },
          context: [
            { id: "country.789", text: "Chile" },
          ],
        },
      ],
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await searchCitiesWithMapbox("Buenos Aires");

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      city: "Buenos Aires",
      country: "Argentina",
      latitude: -34.6037,
      longitude: -58.3816,
    });
    expect(result[1]).toMatchObject({
      city: "Santiago",
      country: "Chile",
      latitude: -33.8688,
      longitude: -51.2093,
    });
  });

  it("respects the limit parameter", async () => {
    const mockResponse = {
      features: Array.from({ length: 10 }, (_, i) => ({
        text: `City ${i}`,
        place_name: `City ${i}, Country`,
        geometry: { coordinates: [0, 0] },
        context: [{ id: "country.123", text: "Country" }],
      })),
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await searchCitiesWithMapbox("test", 5);
    expect(result).toHaveLength(5);
  });

  it("skips features without proper coordinates", async () => {
    const mockResponse = {
      features: [
        {
          text: "Buenos Aires",
          place_name: "Buenos Aires, Argentina",
          geometry: { coordinates: [-58.3816, -34.6037] },
          context: [{ id: "country.123", text: "Argentina" }],
        },
        {
          text: "Invalid",
          place_name: "Invalid Place",
          geometry: null,
          context: [],
        },
        {
          text: "Santiago",
          place_name: "Santiago, Chile",
          geometry: { coordinates: [-51.2093, -33.8688] },
          context: [{ id: "country.789", text: "Chile" }],
        },
      ],
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await searchCitiesWithMapbox("test");
    expect(result).toHaveLength(2);
    expect(result.every((r) => r.city && r.country)).toBe(true);
  });

  it("extracts country from fallback place_name when context is unavailable", async () => {
    const mockResponse = {
      features: [
        {
          text: "Madrid",
          place_name: "Madrid, Spain",
          geometry: { coordinates: [-3.7038, 40.4168] },
          context: [],
        },
      ],
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await searchCitiesWithMapbox("Madrid");
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      city: "Madrid",
      country: "Spain",
    });
  });

  it("handles API errors gracefully", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    await expect(searchCitiesWithMapbox("test")).rejects.toThrow(
      "Mapbox API returned status 500",
    );
  });

  it("throws when MAPBOX_API_KEY is not set", async () => {
    const originalKey = process.env.MAPBOX_API_KEY;
    delete process.env.MAPBOX_API_KEY;

    try {
      await expect(searchCitiesWithMapbox("test")).rejects.toThrow(
        "MAPBOX_API_KEY environment variable is not set",
      );
    } finally {
      process.env.MAPBOX_API_KEY = originalKey;
    }
  });

  it("properly encodes the query string", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ features: [] }),
    });

    await searchCitiesWithMapbox("São Paulo");

    const callUrl = (global.fetch as any).mock.calls[0][0];
    expect(callUrl).toContain("S%C3%A3o%20Paulo");
  });

  it("handles empty features array", async () => {
    const mockResponse = { features: [] };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await searchCitiesWithMapbox("nonexistent");
    expect(result).toEqual([]);
  });

  it("skips features missing both city and country", async () => {
    const mockResponse = {
      features: [
        {
          text: "Incomplete",
          place_name: "",
          geometry: { coordinates: [0, 0] },
          context: [],
        },
        {
          text: "Buenos Aires",
          place_name: "Buenos Aires, Argentina",
          geometry: { coordinates: [-58.3816, -34.6037] },
          context: [{ id: "country.123", text: "Argentina" }],
        },
      ],
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await searchCitiesWithMapbox("test");
    expect(result).toHaveLength(1);
    expect(result[0].city).toBe("Buenos Aires");
  });
});
