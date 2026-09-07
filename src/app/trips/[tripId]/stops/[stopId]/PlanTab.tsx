"use client";

import { useState } from "react";
import { CityMap } from "@/components/trip/CityMap";
import { FOCUS_RING } from "@/lib/styles";
import { formatShortDate, parseCalendarDate } from "@/lib/trips/dates";
import { PLACE_KIND_LABELS, type PlaceKind } from "@/lib/trips/constants";
import type { TripPlaceData } from "@/lib/trips/places";
import { updateStopNightsAction } from "../actions";

export interface PlanTabProps {
  tripId: string;
  stopId: string;
  cityName: string;
  city: { latitude: number; longitude: number };
  initialNights: number;
  // This stop's own computed start date ("YYYY-MM-DD") — fixed regardless
  // of this stop's own nights (only an earlier stop's nights would move
  // it), so it's safe to treat as a constant here.
  stopStartDate: string;
  position: number;
  totalStops: number;
  places: TripPlaceData[];
}

/**
 * Owns the one piece of state this screen can change (nights) so the
 * header's date/position line and the dates/nights card below always agree,
 * plus the map/place-list highlight sync (Phase 3).
 */
export function PlanTab({
  tripId,
  stopId,
  cityName,
  city,
  initialNights,
  stopStartDate,
  position,
  totalStops,
  places,
}: PlanTabProps) {
  const [nights, setNights] = useState(initialNights);
  const [pending, setPending] = useState(false);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const startDate = parseCalendarDate(stopStartDate);
  const endDate = startDate ? new Date(startDate) : null;
  if (endDate) endDate.setUTCDate(endDate.getUTCDate() + nights);

  async function bumpNights(delta: number) {
    const next = nights + delta;
    if (next < 0 || pending) return;

    setPending(true);
    const result = await updateStopNightsAction(tripId, stopId, next);
    if (result.ok) {
      setNights(next);
    }
    setPending(false);
  }

  return (
    <div className="flex flex-col gap-[var(--space-5)]">
      {startDate && endDate ? (
        <div className="font-mono text-[length:var(--text-xs)] text-text-muted">
          {formatShortDate(startDate)}–{formatShortDate(endDate)} · {nights} noche
          {nights !== 1 ? "s" : ""} · parada {position} de {totalStops}
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-[var(--space-3)] rounded-2xl bg-surface-2 px-[var(--space-5)] py-[var(--space-4)]">
        <span className="text-[length:var(--text-sm)] font-medium text-text">Noches en {cityName}</span>
        <div className="flex items-center gap-[var(--space-3)]">
          <button
            type="button"
            disabled={pending || nights <= 0}
            onClick={() => bumpNights(-1)}
            aria-label="Restar una noche"
            className={[
              "inline-flex h-8 w-8 items-center justify-center rounded-full bg-surface text-text disabled:cursor-not-allowed disabled:opacity-40",
              FOCUS_RING,
            ].join(" ")}
          >
            −
          </button>
          <span className="w-6 text-center text-[length:var(--text-sm)] font-semibold text-text">
            {nights}
          </span>
          <button
            type="button"
            disabled={pending}
            onClick={() => bumpNights(1)}
            aria-label="Sumar una noche"
            className={[
              "inline-flex h-8 w-8 items-center justify-center rounded-full bg-surface text-text disabled:cursor-not-allowed disabled:opacity-40",
              FOCUS_RING,
            ].join(" ")}
          >
            +
          </button>
        </div>
      </div>

      <CityMap
        city={city}
        places={places.map((place) => ({
          id: place.id,
          label: place.label,
          kind: place.kind,
          latitude: place.latitude,
          longitude: place.longitude,
        }))}
        highlightedId={highlightedId}
        onSelectPlace={setHighlightedId}
      />

      {places.length === 0 ? (
        <p className="m-0 text-center text-[length:var(--text-sm)] text-text-muted">
          Todavía no marcaste ningún lugar en {cityName}.
        </p>
      ) : (
        <ul className="flex list-none flex-col gap-[var(--space-3)] p-0">
          {places.map((place) => {
            const isHighlighted = place.id === highlightedId;
            return (
              <li key={place.id}>
                <button
                  type="button"
                  onClick={() => setHighlightedId(place.id)}
                  aria-pressed={isHighlighted}
                  className={[
                    "flex w-full items-center justify-between gap-[var(--space-3)] rounded-lg px-[var(--space-4)] py-[var(--space-3)] text-left transition-colors",
                    isHighlighted
                      ? "bg-primary text-text-on-primary"
                      : "bg-surface-2 text-text hover:bg-surface",
                    FOCUS_RING,
                  ].join(" ")}
                >
                  <span className="text-[length:var(--text-sm)] font-medium">{place.label}</span>
                  <span className="font-mono text-[length:var(--text-xs)] uppercase tracking-[var(--tracking-eyebrow)] opacity-80">
                    {PLACE_KIND_LABELS[place.kind as PlaceKind] ?? place.kind}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
