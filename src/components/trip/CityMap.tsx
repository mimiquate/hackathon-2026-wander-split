"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { avatarRampClass } from "./Avatar";

export interface CityMapPlace {
  id: string;
  label: string;
  kind: string;
  latitude: number;
  longitude: number;
}

export interface CityMapProps {
  city: { latitude: number; longitude: number };
  places: CityMapPlace[];
  highlightedId: string | null;
  onSelectPlace: (id: string) => void;
}

// Fixed per-kind color, reusing the same avatar ramp classes the rest of
// the app already uses for "assign a distinct color per item" (ADR 0008
// asks for kind-coded pins, not a new palette to invent).
const KIND_COLOR_INDEX: Record<string, number> = {
  alojamiento: 0,
  plan: 1,
  idea: 2,
  transporte: 3,
};

/**
 * The city-detail Plan tab's map (ADR 0008): a real Mapbox GL basemap with
 * one marker per marked place, framed to fit them all on load, then free to
 * pan/zoom. Clicking a marker calls `onSelectPlace`, and `highlightedId`
 * (set from the place list) rings the matching marker — the two-way sync
 * the plan calls for.
 */
export function CityMap({ city, places, highlightedId, onSelectPlace }: CityMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const onSelectPlaceRef = useRef(onSelectPlace);
  onSelectPlaceRef.current = onSelectPlace;

  // Create the map once. Re-centering after the user has panned/zoomed
  // would fight their own interaction, so this never re-runs for anything
  // but a genuine change of city.
  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token || !containerRef.current) return;

    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [city.longitude, city.latitude],
      zoom: 12,
    });
    mapRef.current = map;

    return () => {
      for (const marker of markersRef.current.values()) marker.remove();
      markersRef.current.clear();
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city.latitude, city.longitude]);

  // Keep one marker per place, colored by kind, ringed when highlighted.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    function syncMarkers() {
      for (const [id, marker] of markersRef.current) {
        if (!places.some((place) => place.id === id)) {
          marker.remove();
          markersRef.current.delete(id);
        }
      }

      for (const place of places) {
        let marker = markersRef.current.get(place.id);
        if (!marker) {
          const el = document.createElement("button");
          el.type = "button";
          el.setAttribute("aria-label", place.label);
          el.className = [
            "block h-5 w-5 cursor-pointer rounded-full shadow-card transition-[outline]",
            avatarRampClass(KIND_COLOR_INDEX[place.kind] ?? 4),
          ].join(" ");
          el.addEventListener("click", (event) => {
            event.stopPropagation();
            onSelectPlaceRef.current(place.id);
          });
          marker = new mapboxgl.Marker({ element: el })
            .setLngLat([place.longitude, place.latitude])
            .addTo(map!);
          markersRef.current.set(place.id, marker);
        }

        const el = marker.getElement();
        el.style.outline = place.id === highlightedId ? "3px solid var(--focus-ring)" : "none";
        el.style.outlineOffset = "2px";
      }
    }

    if (map.isStyleLoaded()) syncMarkers();
    else map.once("load", syncMarkers);
  }, [places, highlightedId]);

  // Frame to fit every pin, but only when the set of places actually
  // changes — not on every highlight change, so the user's pan/zoom after
  // the initial frame stays free, per the plan.
  const placeIds = places.map((place) => place.id).join(",");
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    function frame() {
      if (places.length === 0) {
        map!.jumpTo({ center: [city.longitude, city.latitude], zoom: 13 });
        return;
      }
      if (places.length === 1) {
        map!.jumpTo({ center: [places[0].longitude, places[0].latitude], zoom: 14 });
        return;
      }
      const bounds = new mapboxgl.LngLatBounds();
      for (const place of places) bounds.extend([place.longitude, place.latitude]);
      map!.fitBounds(bounds, { padding: 48, duration: 0 });
    }

    if (map.isStyleLoaded()) frame();
    else map.once("load", frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placeIds, city.latitude, city.longitude]);

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label="Mapa de la ciudad con los lugares marcados"
      className="h-64 w-full overflow-hidden rounded-2xl bg-surface-2"
    />
  );
}
