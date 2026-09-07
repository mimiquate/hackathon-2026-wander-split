export interface CitySearchResult {
  city: string;
  country: string;
  latitude: number;
  longitude: number;
}

export async function searchCitiesWithMapbox(
  query: string,
  limitTo: number = 10,
): Promise<CitySearchResult[]> {
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
    types: "place",
    access_token: apiKey,
  });

  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(trimmedQuery)}.json?${params}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Mapbox API returned status ${response.status}`);
  }

  const data = await response.json();

  // Mapbox returns features with properties and geometry
  // We want to extract city/place names and their coordinates
  const results: CitySearchResult[] = [];

  for (const feature of data.features || []) {
    if (results.length >= limitTo) break;

    const coordinates = feature.geometry?.coordinates;
    if (!coordinates || coordinates.length < 2) continue;

    const [longitude, latitude] = coordinates;

    // Extract city and country from the feature
    // "place_name" format is typically "City, Country" or similar
    const placeName = feature.place_name || "";
    const parts = placeName.split(",").map((p: string) => p.trim());

    // Attempt to extract city and country
    // Mapbox properties have "text" (the matched part) and "context" (hierarchy)
    let city = feature.text || parts[0] || "";
    let country = "";

    // Look for country in the context
    for (const ctx of feature.context || []) {
      if (ctx.id?.includes("country")) {
        country = ctx.text || "";
        break;
      }
    }

    if (!country && parts.length > 1) {
      country = parts[parts.length - 1];
    }

    if (city && country) {
      results.push({
        city,
        country,
        latitude,
        longitude,
      });
    }
  }

  return results;
}
