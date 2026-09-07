"use client";

import { useState } from "react";
import { Icon } from "@/components/core/Icon";
import { CityMap } from "@/components/trip/CityMap";
import { FOCUS_RING } from "@/lib/styles";
import { formatShortDate, parseCalendarDate } from "@/lib/trips/dates";
import { PLACE_KIND_LABELS, type PlaceKind } from "@/lib/trips/constants";
import type { TripPlaceData } from "@/lib/trips/places";
import { removePlaceAction } from "./actions";
import { AddPlaceControl } from "./AddPlaceControl";
import { updateStopNightsAction } from "../actions";

export interface PlanTabContentProps {
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
  onPlacesChange: (places: TripPlaceData[]) => void;
}

/**
 * The Plan tab's body: the date/position line, the dates/nights card, the
 * map, add-place search, and the place list. `places` is owned by the
 * parent (CityDetailTabs) so the tab strip's "Plan · N" count stays in
 * sync with adds/removes here.
 */
export function PlanTabContent({
  tripId,
  stopId,
  cityName,
  city,
  initialNights,
  stopStartDate,
  position,
  totalStops,
  places,
  onPlacesChange,
}: PlanTabContentProps) {
  const [nights, setNights] = useState(initialNights);
  const [nightsPending, setNightsPending] = useState(false);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const startDate = parseCalendarDate(stopStartDate);
  const endDate = startDate ? new Date(startDate) : null;
  if (endDate) endDate.setUTCDate(endDate.getUTCDate() + nights);

  async function bumpNights(delta: number) {
    const next = nights + delta;
    if (next < 0 || nightsPending) return;

    setNightsPending(true);
    const result = await updateStopNightsAction(tripId, stopId, next);
    if (result.ok) {
      setNights(next);
    }
    setNightsPending(false);
  }

  async function handleRemove(placeId: string) {
    const previous = places;
    onPlacesChange(places.filter((place) => place.id !== placeId));
    if (highlightedId === placeId) setHighlightedId(null);

    const result = await removePlaceAction(tripId, stopId, placeId);
    if (!result.ok) {
      // Put it back — the delete didn't actually happen server-side.
      onPlacesChange(previous);
    }
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
            disabled={nightsPending || nights <= 0}
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
            disabled={nightsPending}
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

      <AddPlaceControl
        tripId={tripId}
        stopId={stopId}
        onAdded={(place) => onPlacesChange([...places, place])}
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
                <div
                  className={[
                    "flex items-center gap-[var(--space-3)] rounded-lg px-[var(--space-4)] py-[var(--space-3)] transition-colors",
                    isHighlighted ? "bg-primary text-text-on-primary" : "bg-surface-2 text-text",
                  ].join(" ")}
                >
                  <button
                    type="button"
                    onClick={() => setHighlightedId(place.id)}
                    aria-pressed={isHighlighted}
                    className={["flex flex-1 items-center justify-between gap-[var(--space-3)] text-left", FOCUS_RING].join(
                      " ",
                    )}
                  >
                    <span className="text-[length:var(--text-sm)] font-medium">{place.label}</span>
                    <span className="font-mono text-[length:var(--text-xs)] uppercase tracking-[var(--tracking-eyebrow)] opacity-80">
                      {PLACE_KIND_LABELS[place.kind as PlaceKind] ?? place.kind}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(place.id)}
                    aria-label={`Eliminar ${place.label}`}
                    className={[
                      "rounded-sm opacity-70 hover:opacity-100",
                      isHighlighted ? "text-text-on-primary" : "text-text-muted hover:text-alert",
                      FOCUS_RING,
                    ].join(" ")}
                  >
                    <Icon name="trash-2" size={16} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
