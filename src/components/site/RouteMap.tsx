"use client";

import { geoMercator, geoPath } from "d3-geo";
import { select } from "d3-selection";
import type { Feature, FeatureCollection, LineString, MultiPoint } from "geojson";
import { useEffect, useRef, useState } from "react";
import { feature } from "topojson-client";
import type { Topology } from "topojson-specification";
import { stops as tripStops } from "@/lib/demo-data";

// Same CDN vendor as the Lucide icons (see core/Icon.tsx) — the atlas data
// itself is never self-hosted, per the plan's non-goal.
const ATLAS_URL = "https://unpkg.com/world-atlas@2/countries-110m.json";

// ISO 3166-1 numeric country code.
const VISITED_COUNTRY_IDS = new Set(["724"]); // Spain

// Real coordinates for whatever cities src/lib/demo-data.ts's `stops` uses —
// keyed by city name so the map's route can't silently drift from the rest
// of the page's route the way it did when both were hardcoded separately.
const CITY_COORDINATES: Record<string, [number, number]> = {
  Sevilla: [-5.9845, 37.3891],
  Madrid: [-3.7038, 40.4168],
  Barcelona: [2.1686, 41.3874],
};

const STOPS: { city: string; coordinates: [number, number] }[] = tripStops.map(
  (stop) => ({ city: stop.city, coordinates: CITY_COORDINATES[stop.city] }),
);

function joinSpanish(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} y ${items[items.length - 1]}`;
}

const MAP_LABEL = `Mapa de la ruta: ${joinSpanish(STOPS.map((s) => s.city))}`;

const ROUTE_LINE: Feature<LineString> = {
  type: "Feature",
  properties: null,
  geometry: {
    type: "LineString",
    coordinates: STOPS.map((s) => s.coordinates),
  },
};

// Framing is a fixed padded box around the stops rather than the "visited"
// countries' own geometry — Spain's own polygon in this atlas is compact,
// but France (used on the earlier Lisboa/Oporto/Sevilla route) included
// overseas territories that blew fitSize() out to a whole-world view, so
// this stays decoupled from country geometry on principle.
const FOCUS_EXTENT: Feature<MultiPoint> = {
  type: "Feature",
  properties: null,
  geometry: {
    type: "MultiPoint",
    coordinates: [
      [-7.2, 36.2],
      [3.4, 42.6],
    ],
  },
};

/** The "la ruta" strip: a real-geography map of the trip, per ADR 0002. */
export function RouteMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [countries, setCountries] = useState<FeatureCollection | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch(ATLAS_URL)
      .then((res) => res.json())
      .then((topology: Topology) => {
        if (cancelled) return;
        const world = feature(
          topology,
          topology.objects.countries,
        ) as unknown as FeatureCollection;
        setCountries(world);
      })
      .catch((error: unknown) => {
        // A network hiccup shouldn't take the page down — the route/stops
        // still render without the country fills.
        console.error("RouteMap: failed to load the world atlas", error);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    const svgEl = svgRef.current;
    if (!container || !svgEl) return;

    const draw = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (width === 0 || height === 0) return;

      const projection = geoMercator().fitSize([width, height], FOCUS_EXTENT);
      const path = geoPath(projection);

      const svg = select(svgEl)
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("width", width)
        .attr("height", height);

      // Fixed-order layer groups, created once: country fills load in
      // asynchronously (after the route/stops' first paint), so without a
      // stable layer to append into, the countries would land after — and
      // paint over — the route and stop dots the moment they arrive.
      const countryLayer = svg.select<SVGGElement>("g.countries").empty()
        ? svg.append("g").attr("class", "countries")
        : svg.select<SVGGElement>("g.countries");
      const routeLayer = svg.select<SVGGElement>("g.route").empty()
        ? svg.append("g").attr("class", "route")
        : svg.select<SVGGElement>("g.route");
      const stopsLayer = svg.select<SVGGElement>("g.stops").empty()
        ? svg.append("g").attr("class", "stops")
        : svg.select<SVGGElement>("g.stops");

      countryLayer
        .selectAll<SVGPathElement, Feature>("path.country")
        .data(countries?.features ?? [], (d) => String(d.id))
        .join("path")
        .attr("class", "country")
        .attr("d", (d) => path(d))
        .attr("fill", (d) =>
          VISITED_COUNTRY_IDS.has(String(d.id))
            ? "color-mix(in oklab, var(--primary) 25%, var(--surface))"
            : "var(--surface-2)",
        )
        .attr("stroke", "var(--border)")
        .attr("stroke-width", 0.5);

      routeLayer
        .selectAll<SVGPathElement, Feature<LineString>>("path.route-road")
        .data([ROUTE_LINE])
        .join("path")
        .attr("class", "route-road")
        .attr("d", (d) => path(d))
        .attr("fill", "none")
        .attr("stroke", "var(--border)")
        .attr("stroke-width", 10)
        .attr("stroke-linecap", "round");

      routeLayer
        .selectAll<SVGPathElement, Feature<LineString>>("path.route-line")
        .data([ROUTE_LINE])
        .join("path")
        .attr("class", "route-line")
        .attr("d", (d) => path(d))
        .attr("fill", "none")
        .attr("stroke", "var(--primary)")
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "1 7")
        .attr("stroke-linecap", "round");

      const stops = stopsLayer
        .selectAll<SVGGElement, (typeof STOPS)[number]>("g.stop")
        .data(STOPS, (d) => d.city)
        .join((enter) => {
          const g = enter.append("g").attr("class", "stop");
          g.append("circle").attr("class", "stop-dot");
          g.append("text").attr("class", "stop-label");
          return g;
        });

      stops.attr("transform", (d) => {
        const p = projection(d.coordinates);
        return `translate(${p?.[0] ?? 0}, ${p?.[1] ?? 0})`;
      });

      stops
        .select<SVGCircleElement>("circle.stop-dot")
        .attr("r", 6)
        .attr("fill", "var(--primary)")
        .attr("stroke", "var(--surface)")
        .attr("stroke-width", 2);

      stops
        .select<SVGTextElement>("text.stop-label")
        .attr("x", 10)
        .attr("y", 4)
        .attr("font-family", "var(--font-body)")
        .attr("font-size", 12)
        .attr("font-weight", 700)
        .attr("fill", "var(--text)")
        .text((d) => d.city);
    };

    draw();

    const observer = new ResizeObserver(draw);
    observer.observe(container);
    return () => observer.disconnect();
  }, [countries]);

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label={MAP_LABEL}
      className="h-[320px] w-full overflow-hidden rounded-2xl border border-border bg-surface-2"
    >
      <svg ref={svgRef} className="block h-full w-full" />
    </div>
  );
}
