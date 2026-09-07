// Mapbox's Search Box API (ADR 0007) — the POI/venue-aware sibling of the
// Geocoding API mapbox-search.ts already uses for city-level search. The
// `/forward` endpoint returns full results (name + coordinates) in one
// request, unlike the suggest+retrieve session-token flow meant for
// interactive autocomplete UIs — this repo doesn't need that yet.

export interface CityPlaceSearchResult {
  name: string;
  latitude: number;
  longitude: number;
}

export interface CityCoordinates {
  latitude: number;
  longitude: number;
}

/**
 * Searches for landmarks/venues/hotels matching `query`, biased toward
 * `city`'s coordinates so results are local to that city rather than
 * anywhere on Earth.
 */
export async function searchPlacesInCity(
  query: string,
  city: CityCoordinates,
  limitTo: number = 10,
): Promise<CityPlaceSearchResult[]> {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return [];
  }

  const apiKey = process.env.MAPBOX_API_KEY;
  if (!apiKey) {
    throw new Error("MAPBOX_API_KEY environment variable is not set");
  }

  const params = new URLSearchParams({
    q: trimmedQuery,
    limit: String(limitTo),
    proximity: `${city.longitude},${city.latitude}`,
    access_token: apiKey,
  });

  const url = `https://api.mapbox.com/search/searchbox/v1/forward?${params}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Mapbox API returned status ${response.status}`);
  }

  const data = await response.json();

  const results: CityPlaceSearchResult[] = [];

  for (const feature of data.features ?? []) {
    if (results.length >= limitTo) break;

    const coordinates = feature.geometry?.coordinates;
    if (!coordinates || coordinates.length < 2) continue;

    const [longitude, latitude] = coordinates;
    const name = feature.properties?.name ?? feature.properties?.name_preferred;
    if (!name) continue;

    results.push({ name, latitude, longitude });
  }

  return results;
}
