"use client";

import { useState } from "react";
import { FOCUS_RING } from "@/lib/styles";
import type { TripPlaceData } from "@/lib/trips/places";
import type { BookingDetail } from "@/lib/trips/bookings";
import type { TripMemberSummary } from "@/lib/trips/membership";
import { PlanTabContent } from "./PlanTabContent";
import { ReservasTabContent } from "./ReservasTabContent";

type CityDetailTab = "plan" | "reservas";

// Gastos/Notas have no data source yet (#14-17, #23 respectively) — inert
// placeholders, same treatment auth gave its inert account-menu items.
const INERT_TABS = [
  { key: "gastos", label: "Gastos" },
  { key: "notas", label: "Notas" },
] as const;

export interface CityDetailTabsProps {
  tripId: string;
  stopId: string;
  cityName: string;
  city: { latitude: number; longitude: number };
  initialNights: number;
  stopStartDate: string;
  position: number;
  totalStops: number;
  initialPlaces: TripPlaceData[];
  bookings: BookingDetail[];
  tripMembers: TripMemberSummary[];
}

/**
 * Owns which of the 4 tabs is showing. Plan and Reservas are both real now
 * (#10, #12/#13); each owns its own state below this — Plan's place list
 * still needs to live here too, though, since the "Plan · N" count in the
 * tab strip has to reflect adds/removes without a reload.
 */
export function CityDetailTabs({
  tripId,
  stopId,
  cityName,
  city,
  initialNights,
  stopStartDate,
  position,
  totalStops,
  initialPlaces,
  bookings,
  tripMembers,
}: CityDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<CityDetailTab>("plan");
  const [places, setPlaces] = useState(initialPlaces);

  return (
    <div className="flex flex-col gap-[var(--space-5)]">
      <div className="flex gap-[var(--space-2)]">
        <button
          type="button"
          onClick={() => setActiveTab("plan")}
          aria-current={activeTab === "plan" ? "page" : undefined}
          className={[
            "inline-flex min-h-[44px] items-center justify-center rounded-pill px-[var(--space-4)] py-[var(--space-2)] text-[length:var(--text-sm)] font-semibold",
            activeTab === "plan" ? "bg-primary text-text-on-primary" : "bg-surface-2 text-text-muted hover:text-text",
            FOCUS_RING,
          ].join(" ")}
        >
          Plan · {places.length}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("reservas")}
          aria-current={activeTab === "reservas" ? "page" : undefined}
          className={[
            "inline-flex min-h-[44px] items-center justify-center rounded-pill px-[var(--space-4)] py-[var(--space-2)] text-[length:var(--text-sm)] font-semibold",
            activeTab === "reservas"
              ? "bg-primary text-text-on-primary"
              : "bg-surface-2 text-text-muted hover:text-text",
            FOCUS_RING,
          ].join(" ")}
        >
          Reservas · {bookings.length}
        </button>
        {INERT_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            disabled
            className="inline-flex min-h-[44px] cursor-not-allowed items-center justify-center rounded-pill bg-surface-2 px-[var(--space-4)] py-[var(--space-2)] text-[length:var(--text-sm)] font-semibold text-text-muted opacity-50"
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "plan" ? (
        <PlanTabContent
          tripId={tripId}
          stopId={stopId}
          cityName={cityName}
          city={city}
          initialNights={initialNights}
          stopStartDate={stopStartDate}
          position={position}
          totalStops={totalStops}
          places={places}
          onPlacesChange={setPlaces}
        />
      ) : (
        <ReservasTabContent bookings={bookings} tripMembers={tripMembers} />
      )}
    </div>
  );
}
