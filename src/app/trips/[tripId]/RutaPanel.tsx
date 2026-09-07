"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/core/Button";
import { Card } from "@/components/core/Card";
import { Icon } from "@/components/core/Icon";
import { Input } from "@/components/forms";
import { RouteMap } from "@/components/site/RouteMap";
import { FOCUS_RING } from "@/lib/styles";
import { MAX_STOPS_PER_TRIP } from "@/lib/trips/constants";
import { haversineDistance } from "@/lib/geo/haversine";
import { formatCalendarDate, parseCalendarDate } from "@/lib/trips/dates";
import type { CitySearchResult } from "@/lib/geo/mapbox-search";
import type { TripStopData } from "@/lib/trips/stops";
import {
  searchCitiesAction,
  addStopAction,
  removeStopAction,
  updateStopNightsAction,
  reorderStopsAction,
  getStopsAction,
} from "./stops/actions";

export interface RutaPanelProps {
  tripId: string;
  tripStartDate: string; // "YYYY-MM-DD"
}

interface DisplayStop extends TripStopData {
  computedStartDate: string; // "YYYY-MM-DD"
  computedEndDate: string; // "YYYY-MM-DD"
}

export function RutaPanel({ tripId, tripStartDate }: RutaPanelProps) {
  const [stops, setStops] = useState<DisplayStop[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<CitySearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [draggedStopId, setDraggedStopId] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);

  // Load initial stops
  useEffect(() => {
    async function loadStops() {
      setLoading(true);
      const result = await getStopsAction(tripId);
      if (result) {
        setStops(computeStopDates(result, tripStartDate));
      }
      setLoading(false);
    }
    loadStops();
  }, [tripId, tripStartDate]);

  function computeStopDates(stopsData: TripStopData[], startDateStr: string): DisplayStop[] {
    const startDate = parseCalendarDate(startDateStr);
    if (!startDate) return [];

    return stopsData.map((stop) => {
      // Calculate cumulative nights from all previous stops
      const nightsBeforeThisStop = stopsData
        .filter((s) => s.position < stop.position)
        .reduce((sum, s) => sum + s.nights, 0);

      const computedStart = new Date(startDate);
      computedStart.setDate(computedStart.getDate() + nightsBeforeThisStop);

      const computedEnd = new Date(computedStart);
      computedEnd.setDate(computedEnd.getDate() + stop.nights);

      return {
        ...stop,
        computedStartDate: formatCalendarDate(computedStart),
        computedEndDate: formatCalendarDate(computedEnd),
      };
    });
  }

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    setShowResults(true);

    searchTimeoutRef.current = setTimeout(async () => {
      const results = await searchCitiesAction(tripId, searchQuery);
      setSearchResults(results || []);
      setIsSearching(false);
    }, 300);
  }, [searchQuery, tripId]);

  async function handleAddCity(city: CitySearchResult) {
    setAdding(true);
    setError(undefined);

    const result = await addStopAction(
      tripId,
      city.city,
      city.country,
      city.latitude,
      city.longitude,
    );

    if (!result.ok) {
      setError(result.formError);
      setAdding(false);
      return;
    }

    // Reload stops after adding
    const updatedStops = await getStopsAction(tripId);
    if (updatedStops) {
      setStops(computeStopDates(updatedStops, tripStartDate));
    }

    setSearchQuery("");
    setSearchResults([]);
    setShowResults(false);
    setAdding(false);
  }

  async function handleRemoveStop(stopId: string) {
    const result = await removeStopAction(tripId, stopId);
    if (!result.ok) {
      setError(result.formError);
      return;
    }

    // Reload stops after removing
    const updatedStops = await getStopsAction(tripId);
    if (updatedStops) {
      setStops(computeStopDates(updatedStops, tripStartDate));
    }
  }

  async function handleUpdateNights(stopId: string, newNights: number) {
    if (newNights < 0) return;

    const result = await updateStopNightsAction(tripId, stopId, newNights);
    if (!result.ok) {
      setError(result.formError);
      return;
    }

    // Update local state with new nights and recompute dates
    const updated = stops.map((s) => (s.id === stopId ? { ...s, nights: newNights } : s));
    setStops(computeStopDates(updated, tripStartDate));
  }

  async function handleMoveStop(stopId: string, direction: "up" | "down") {
    const index = stops.findIndex((s) => s.id === stopId);
    if (index === -1) return;

    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= stops.length) return;

    // Create new positions array
    const positions = stops.map((s, i) => ({
      stopId: s.id,
      newPosition: i === index ? newIndex + 1 : i === newIndex ? index + 1 : i + 1,
    }));

    await handleReorderFromDrag(positions);
  }

  async function handleReorderFromDrag(positions: Array<{ stopId: string; newPosition: number }>) {
    setReordering(true);
    setError(undefined);

    const result = await reorderStopsAction(tripId, positions);
    if (!result.ok) {
      setError(result.formError);
      setReordering(false);
      return;
    }

    setStops(computeStopDates(result.stops, tripStartDate));
    setReordering(false);
  }

  const totalNights = stops.reduce((sum, s) => sum + s.nights, 0);
  const totalKm = calculateTotalDistance(stops);
  const canAddMore = stops.length < MAX_STOPS_PER_TRIP;
  const isAtMax = stops.length >= MAX_STOPS_PER_TRIP;

  if (loading) {
    return (
      <Card padding="lg">
        <p className="m-0 text-center text-[length:var(--text-sm)] text-text-muted">
          Cargando…
        </p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-[var(--space-4)]">
      {/* Search section */}
      <Card padding="lg">
        <div className="flex flex-col gap-[var(--space-4)]">
          <div className="relative">
            <Input
              label="Buscá una ciudad"
              placeholder="Escribí el nombre de una ciudad"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={!canAddMore || adding}
              icon="search"
              autoComplete="off"
            />

            {/* Search results dropdown */}
            {showResults && (
              <div
                className={[
                  "absolute top-full left-0 right-0 z-10 mt-[var(--space-2)] rounded-[var(--radius-md)]",
                  "border border-border-primary bg-surface shadow-md max-h-64 overflow-y-auto",
                ].join(" ")}
              >
                {isSearching ? (
                  <div className="px-[var(--space-4)] py-[var(--space-3)]">
                    <p className="m-0 text-[length:var(--text-sm)] text-text-muted">Buscando…</p>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="px-[var(--space-4)] py-[var(--space-3)]">
                    <p className="m-0 text-[length:var(--text-sm)] text-text-muted">
                      Sin resultados
                    </p>
                  </div>
                ) : (
                  <div>
                    {searchResults.map((result, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleAddCity(result)}
                        disabled={adding}
                        className={[
                          "w-full text-left px-[var(--space-4)] py-[var(--space-3)]",
                          "border-b border-border-secondary last:border-b-0",
                          "hover:bg-surface-secondary transition-colors",
                          "text-[length:var(--text-sm)] flex flex-col gap-[var(--space-1)]",
                          FOCUS_RING,
                        ].join(" ")}
                      >
                        <div className="font-medium text-text">{result.city}</div>
                        <div className="text-[length:var(--text-xs)] text-text-muted">
                          {result.country}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {error && (
            <p className="m-0 text-[length:var(--text-xs)] text-alert">{error}</p>
          )}

          {!canAddMore && (
            <div className="rounded-[var(--radius-md)] bg-alert/10 border border-alert/30 px-[var(--space-3)] py-[var(--space-2)]">
              <p className="m-0 text-[length:var(--text-xs)] text-alert">
                Llegaste al máximo de {MAX_STOPS_PER_TRIP} paradas. Eliminá una para agregar más.
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Route map — numbered markers over the stop list; not wired to any
          navigation yet since there's no per-city detail screen (#10). */}
      {stops.length > 0 && (
        <Card padding="lg">
          <RouteMap
            stops={stops.map((s) => ({
              id: s.id,
              city: s.city,
              latitude: s.latitude,
              longitude: s.longitude,
            }))}
            numbered
            interactive
          />
        </Card>
      )}

      {/* Stops list */}
      {stops.length > 0 && (
        <Card padding="lg">
          <div className="flex flex-col gap-[var(--space-3)]">
            {stops.map((stop, index) => (
              <div
                key={stop.id}
                draggable
                onDragStart={() => setDraggedStopId(stop.id)}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (!draggedStopId || draggedStopId === stop.id) return;

                  const draggedIndex = stops.findIndex((s) => s.id === draggedStopId);
                  const targetIndex = index;

                  // Create new positions array
                  const positions = stops.map((s, i) => ({
                    stopId: s.id,
                    newPosition:
                      i === draggedIndex
                        ? targetIndex + 1
                        : i === targetIndex
                          ? draggedIndex + 1
                          : i + 1,
                  }));

                  handleReorderFromDrag(positions);
                }}
                onDragEnd={() => setDraggedStopId(null)}
                className={[
                  "flex flex-col gap-[var(--space-2)] pb-[var(--space-3)] border-b border-border-secondary last:border-b-0 last:pb-0",
                  "cursor-move select-none",
                  draggedStopId === stop.id ? "opacity-50" : "",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-[var(--space-3)]">
                  <div className="flex items-start gap-[var(--space-2)] flex-1">
                    <div className="text-text-muted pt-1 cursor-grab active:cursor-grabbing">
                      <Icon name="grip-vertical" size={16} />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-text">{stop.city}</div>
                      <div className="text-[length:var(--text-xs)] text-text-muted">
                        {stop.country}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveStop(stop.id)}
                    aria-label="Eliminar parada"
                    className={["rounded-sm text-text-muted hover:text-alert", FOCUS_RING].join(
                      " ",
                    )}
                  >
                    <Icon name="trash-2" size={16} />
                  </button>
                </div>

                {/* Dates and nights */}
                <div className="text-[length:var(--text-xs)] text-text-muted">
                  {stop.computedStartDate} a {stop.computedEndDate}
                </div>

                {/* Nights stepper and move buttons */}
                <div className="flex items-center gap-[var(--space-2)] flex-wrap">
                  {/* Up/Down move buttons */}
                  <div className="flex gap-[var(--space-1)]">
                    <button
                      type="button"
                      onClick={() => handleMoveStop(stop.id, "up")}
                      disabled={index === 0 || reordering}
                      aria-label="Mover parada arriba"
                      title="Mover arriba"
                      className={[
                        "inline-flex items-center justify-center w-6 h-6 rounded-sm",
                        "border border-border-primary text-text hover:bg-surface-secondary",
                        "text-[length:var(--text-sm)] disabled:opacity-50 disabled:cursor-not-allowed",
                        FOCUS_RING,
                      ].join(" ")}
                    >
                      <Icon name="chevron-up" size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveStop(stop.id, "down")}
                      disabled={index === stops.length - 1 || reordering}
                      aria-label="Mover parada abajo"
                      title="Mover abajo"
                      className={[
                        "inline-flex items-center justify-center w-6 h-6 rounded-sm",
                        "border border-border-primary text-text hover:bg-surface-secondary",
                        "text-[length:var(--text-sm)] disabled:opacity-50 disabled:cursor-not-allowed",
                        FOCUS_RING,
                      ].join(" ")}
                    >
                      <Icon name="chevron-down" size={16} />
                    </button>
                  </div>

                  {/* Nights stepper */}
                  <button
                    type="button"
                    onClick={() => handleUpdateNights(stop.id, Math.max(0, stop.nights - 1))}
                    className={[
                      "inline-flex items-center justify-center w-6 h-6 rounded-sm",
                      "border border-border-primary text-text hover:bg-surface-secondary",
                      "text-[length:var(--text-sm)]",
                      FOCUS_RING,
                    ].join(" ")}
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-[length:var(--text-sm)]">
                    {stop.nights}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleUpdateNights(stop.id, stop.nights + 1)}
                    className={[
                      "inline-flex items-center justify-center w-6 h-6 rounded-sm",
                      "border border-border-primary text-text hover:bg-surface-secondary",
                      "text-[length:var(--text-sm)]",
                      FOCUS_RING,
                    ].join(" ")}
                  >
                    +
                  </button>
                  <span className="text-[length:var(--text-xs)] text-text-muted ml-[var(--space-2)]">
                    noche{stop.nights !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Footer stats */}
      {stops.length > 0 && (
        <Card padding="lg">
          <div className="flex flex-col gap-[var(--space-4)]">
            <div className="grid grid-cols-3 gap-[var(--space-4)]">
              <div className="text-center">
                <div className="text-[length:var(--text-xs)] text-text-muted uppercase tracking-wider">
                  Paradas
                </div>
                <div className="mt-[var(--space-1)] text-[length:var(--text-lg)] font-bold text-text">
                  {stops.length}
                </div>
              </div>
              <div className="text-center">
                <div className="text-[length:var(--text-xs)] text-text-muted uppercase tracking-wider">
                  Noches
                </div>
                <div className="mt-[var(--space-1)] text-[length:var(--text-lg)] font-bold text-text">
                  {totalNights}
                </div>
              </div>
              <div className="text-center">
                <div className="text-[length:var(--text-xs)] text-text-muted uppercase tracking-wider">
                  Distancia
                </div>
                <div className="mt-[var(--space-1)] text-[length:var(--text-lg)] font-bold text-text">
                  {Math.round(totalKm)}km
                </div>
              </div>
            </div>

            {/* Stub exit button — #9 ("El viaje en el mapa") doesn't exist
                yet, so this stays disabled with no destination to wire to. */}
            <Button variant="secondary" fullWidth disabled title="Próximamente">
              Ver el viaje
            </Button>
          </div>
        </Card>
      )}

      {/* Empty state */}
      {stops.length === 0 && (
        <Card padding="lg">
          <p className="m-0 text-center text-[length:var(--text-sm)] text-text-muted">
            Empezá a armar tu ruta buscando una ciudad
          </p>
        </Card>
      )}
    </div>
  );
}

function calculateTotalDistance(stops: DisplayStop[]): number {
  let total = 0;
  for (let i = 0; i < stops.length - 1; i++) {
    total += haversineDistance(
      stops[i].latitude,
      stops[i].longitude,
      stops[i + 1].latitude,
      stops[i + 1].longitude,
    );
  }
  return total;
}
