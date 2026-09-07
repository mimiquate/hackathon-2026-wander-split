"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/core/Button";
import { Input } from "@/components/forms";
import { FOCUS_RING } from "@/lib/styles";
import { PLACE_KINDS, PLACE_KIND_LABELS, type PlaceKind } from "@/lib/trips/constants";
import type { TripPlaceData } from "@/lib/trips/places";
import type { CityPlaceSearchResult } from "@/lib/geo/mapbox-places";
import { addPlaceAction, searchPlacesAction } from "./actions";

export interface AddPlaceControlProps {
  tripId: string;
  stopId: string;
  onAdded: (place: TripPlaceData) => void;
}

/**
 * The city-scoped search (ADR 0007) plus the invented name+kind confirm
 * step — the design has no live-search result flow to take copy from, so
 * this matches the rest of the product's voice instead.
 */
export function AddPlaceControl({ tripId, stopId, onAdded }: AddPlaceControlProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CityPlaceSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const [confirming, setConfirming] = useState<CityPlaceSearchResult | null>(null);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<PlaceKind>("plan");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (!query.trim()) {
      setResults([]);
      setShowResults(false);
      return;
    }

    setSearching(true);
    setShowResults(true);

    searchTimeoutRef.current = setTimeout(async () => {
      const found = await searchPlacesAction(tripId, stopId, query);
      setResults(found ?? []);
      setSearching(false);
    }, 300);

    return () => clearTimeout(searchTimeoutRef.current);
  }, [query, tripId, stopId]);

  function pickResult(result: CityPlaceSearchResult) {
    setConfirming(result);
    setName(result.name);
    setKind("plan");
    setError(undefined);
    setQuery("");
    setResults([]);
    setShowResults(false);
  }

  function cancelConfirm() {
    setConfirming(null);
    setError(undefined);
  }

  async function saveConfirm() {
    if (!confirming) return;

    setSaving(true);
    setError(undefined);

    const result = await addPlaceAction(tripId, stopId, {
      label: name,
      kind,
      latitude: confirming.latitude,
      longitude: confirming.longitude,
    });

    if (!result.ok) {
      setError(result.formError ?? result.fieldErrors?.label ?? result.fieldErrors?.kind);
      setSaving(false);
      return;
    }

    onAdded(result.place);
    setConfirming(null);
    setSaving(false);
  }

  if (confirming) {
    return (
      <div className="flex flex-col gap-[var(--space-4)] rounded-2xl bg-surface-2 p-[var(--space-5)]">
        <Input label="Nombre" value={name} onChange={(e) => setName(e.target.value)} error={error} />
        <div className="flex flex-col gap-[var(--space-2)]">
          <span className="text-[length:var(--text-sm)] font-bold text-text">Tipo de lugar</span>
          <div className="flex flex-wrap gap-[var(--space-2)]">
            {PLACE_KINDS.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                aria-pressed={kind === k}
                className={[
                  "rounded-pill px-[var(--space-4)] py-[var(--space-2)] text-[length:var(--text-sm)] font-semibold",
                  kind === k ? "bg-primary text-text-on-primary" : "bg-surface text-text-muted hover:text-text",
                  FOCUS_RING,
                ].join(" ")}
              >
                {PLACE_KIND_LABELS[k]}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-[var(--space-3)]">
          <Button type="button" variant="secondary" onClick={cancelConfirm} disabled={saving}>
            Cancelar
          </Button>
          <Button type="button" onClick={saveConfirm} disabled={saving || !name.trim()}>
            {saving ? "Guardando…" : "Guardar"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <Input
        label="Buscá un lugar"
        placeholder="Hotel, museo, restaurante…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        icon="search"
        autoComplete="off"
      />
      {showResults ? (
        <div className="absolute left-0 right-0 top-full z-10 mt-[var(--space-2)] max-h-64 overflow-y-auto rounded-lg border border-border bg-surface shadow-card">
          {searching ? (
            <p className="m-0 px-[var(--space-4)] py-[var(--space-3)] text-[length:var(--text-sm)] text-text-muted">
              Buscando…
            </p>
          ) : results.length === 0 ? (
            <p className="m-0 px-[var(--space-4)] py-[var(--space-3)] text-[length:var(--text-sm)] text-text-muted">
              Sin resultados
            </p>
          ) : (
            results.map((result, index) => (
              <button
                key={`${result.name}-${index}`}
                type="button"
                onClick={() => pickResult(result)}
                className={[
                  "block w-full border-b border-border px-[var(--space-4)] py-[var(--space-3)] text-left text-[length:var(--text-sm)] last:border-b-0 hover:bg-surface-2",
                  FOCUS_RING,
                ].join(" ")}
              >
                {result.name}
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
