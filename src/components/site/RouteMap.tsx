"use client";

import { geoMercator, geoPath } from "d3-geo";
import { select } from "d3-selection";
import type { Feature, FeatureCollection, LineString } from "geojson";
import { useEffect, useMemo, useRef, useState } from "react";
import { feature } from "topojson-client";
import type { Topology } from "topojson-specification";

// Ported from route-map.js in the "Apps landing page UI mockup" handoff —
// per its own README, this file is "directly portable logic" (d3
// projection, layer order, stop coordinates). Same CDN vendor/version as
// the reference implementation; the atlas data is never self-hosted, per
// the plan's non-goal.
const ATLAS_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json";
const VISITED_COUNTRIES = new Set(["Spain", "Portugal", "France"]);

// The landing page's own demo route — used whenever no real `stops` prop is
// given (e.g. RouteSection), so that call site keeps working unchanged.
const DEMO_STOPS: { name: string; coords: [number, number]; anchor: "start" | "end" }[] = [
  { name: "Sevilla", coords: [-5.984, 37.389], anchor: "end" },
  { name: "Madrid", coords: [-3.703, 40.417], anchor: "start" },
  { name: "Barcelona", coords: [2.173, 41.385], anchor: "start" },
];

export interface RouteMapStop {
  id: string;
  city: string;
  latitude: number;
  longitude: number;
}

export interface RouteMapProps {
  /** Real trip stops, in order. Omit to render the landing page's demo route. */
  stops?: RouteMapStop[];
  /** Shows the stop's 1-based order inside its marker instead of a plain dot. */
  numbered?: boolean;
  /** Markers get a pointer cursor and a hover affordance. Still not wired to
   * any navigation — there's no destination screen for a single stop yet. */
  interactive?: boolean;
  /** Called when a marker is clicked, only when `interactive` is set. */
  onStopClick?: (stop: RouteMapStop) => void;
}

/** The "la ruta" strip: a real-geography map of the trip, per ADR 0002. */
export function RouteMap({ stops, numbered = false, interactive = false, onStopClick }: RouteMapProps = {}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [countries, setCountries] = useState<FeatureCollection | null>(null);

  const points: { id: string; name: string; coords: [number, number]; anchor: "start" | "end" }[] =
    useMemo(
      () =>
        stops && stops.length > 0
          ? stops.map((s, i) => ({
              id: s.id,
              name: s.city,
              coords: [s.longitude, s.latitude] as [number, number],
              anchor: (i % 2 === 0 ? "start" : "end") as "start" | "end",
            }))
          : DEMO_STOPS.map((s, i) => ({ id: String(i), ...s })),
      [stops],
    );

  const routeLine: Feature<LineString> = useMemo(
    () => ({
      type: "Feature",
      properties: null,
      geometry: {
        type: "LineString",
        coordinates: points.map((p) => p.coords),
      },
    }),
    [points],
  );

  const routeLabel =
    points.length === 1
      ? `Ruta: ${points[0].name}`
      : `Ruta: ${points.map((p) => p.name).join(", ")}`;

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
      const width = container.clientWidth || 940;
      const height = 320;
      if (width === 0) return;

      const projection = geoMercator().fitExtent(
        [
          [110, 52],
          [width - 110, height - 44],
        ],
        routeLine,
      );
      const path = geoPath(projection);

      const svg = select(svgEl)
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("width", "100%")
        .attr("height", height)
        .attr("role", "img")
        .attr("aria-label", routeLabel);

      // Fixed-order layer groups, created once: country fills load in
      // asynchronously (after the route/stops' first paint), so without a
      // stable layer to append into, the countries would land after — and
      // paint over — the route and stop dots the moment they arrive.
      const countryLayer = svg.select<SVGGElement>("g.countries").empty()
        ? svg.append("g").attr("class", "countries")
        : svg.select<SVGGElement>("g.countries");
      const visitedLayer = svg.select<SVGGElement>("g.visited").empty()
        ? svg.append("g").attr("class", "visited")
        : svg.select<SVGGElement>("g.visited");
      const routeLayer = svg.select<SVGGElement>("g.route").empty()
        ? svg.append("g").attr("class", "route")
        : svg.select<SVGGElement>("g.route");
      const stopsLayer = svg.select<SVGGElement>("g.stops").empty()
        ? svg.append("g").attr("class", "stops")
        : svg.select<SVGGElement>("g.stops");

      countryLayer
        .selectAll<SVGPathElement, Feature>("path")
        .data(countries?.features ?? [], (d) => String(d.id))
        .join("path")
        .attr("d", (d) => path(d))
        .attr("fill", "var(--surface-2)")
        .attr("stroke", "var(--border)")
        .attr("stroke-width", 1);

      const visited = (countries?.features ?? []).filter((f) =>
        VISITED_COUNTRIES.has(String(f.properties?.name)),
      );

      visitedLayer
        .selectAll<SVGPathElement, Feature>("path")
        .data(visited, (d) => String(d.id))
        .join("path")
        .attr("d", (d) => path(d))
        .attr("fill", "var(--border)")
        .attr("stroke", "var(--border-strong)")
        .attr("stroke-width", 1);

      routeLayer
        .selectAll<SVGPathElement, Feature<LineString>>("path.route-casing")
        .data(points.length > 1 ? [routeLine] : [])
        .join("path")
        .attr("class", "route-casing")
        .attr("d", (d) => path(d))
        .attr("fill", "none")
        .attr("stroke", "var(--surface)")
        .attr("stroke-width", 9)
        .attr("stroke-linecap", "round");

      routeLayer
        .selectAll<SVGPathElement, Feature<LineString>>("path.route-line")
        .data(points.length > 1 ? [routeLine] : [])
        .join("path")
        .attr("class", "route-line")
        .attr("d", (d) => path(d))
        .attr("fill", "none")
        .attr("stroke", "var(--primary)")
        .attr("stroke-width", 3)
        .attr("stroke-linecap", "round")
        .attr("stroke-dasharray", "1 7");

      const stopGroups = stopsLayer
        .selectAll<SVGGElement, (typeof points)[number]>("g.stop")
        .data(points, (d) => d.id)
        .join((enter) => {
          const g = enter.append("g").attr("class", "stop");
          g.append("circle");
          g.append("text").attr("class", "stop-label");
          g.append("text").attr("class", "stop-number");
          return g;
        });

      stopGroups
        .attr("transform", (d) => {
          const p = projection(d.coords);
          return `translate(${p?.[0] ?? 0}, ${p?.[1] ?? 0})`;
        })
        .style("cursor", interactive ? "pointer" : "default")
        .attr("role", interactive ? "button" : null)
        .attr("tabindex", interactive ? 0 : null)
        .attr("aria-label", (d) => (interactive ? `Parada: ${d.name}` : null))
        .on("click", (_event: unknown, d: (typeof points)[number]) => {
          if (!interactive) return;
          onStopClick?.(
            stops?.find((s) => s.id === d.id) ?? {
              id: d.id,
              city: d.name,
              latitude: d.coords[1],
              longitude: d.coords[0],
            },
          );
        });

      stopGroups
        .select("circle")
        .attr("r", numbered ? 11 : 7)
        .attr("fill", "var(--primary)")
        .attr("stroke", "var(--surface)")
        .attr("stroke-width", 3);

      stopGroups
        .select<SVGTextElement>("text.stop-number")
        .attr("y", 4)
        .attr("text-anchor", "middle")
        .attr("fill", "var(--text-on-primary, white)")
        .attr("font-family", "var(--font-display)")
        .attr("font-weight", 700)
        .attr("font-size", 11)
        .text((_d, i) => (numbered ? String(i + 1) : ""));

      stopGroups
        .select<SVGTextElement>("text.stop-label")
        .attr("x", (d) => (d.anchor === "end" ? -14 : 14))
        .attr("y", 5)
        .attr("text-anchor", (d) => d.anchor)
        .attr("fill", "var(--text)")
        .attr("font-family", "var(--font-display)")
        .attr("font-weight", 700)
        .attr("font-size", 16)
        .text((d) => d.name);
    };

    draw();

    const observer = new ResizeObserver(draw);
    observer.observe(container);
    return () => observer.disconnect();
  }, [countries, points, routeLine, routeLabel, numbered, interactive, onStopClick, stops]);

  return (
    <div ref={containerRef} className="h-[320px] w-full">
      <svg ref={svgRef} className="block h-full w-full" />
    </div>
  );
}
