"use client";

import { useState } from "react";
import { FOCUS_RING } from "@/lib/styles";
import type { TripPlaceData } from "@/lib/trips/places";
import type { BookingDetail } from "@/lib/trips/bookings";
import type { ExpenseDetail } from "@/lib/trips/expenses";
import type { TripMemberSummary } from "@/lib/trips/membership";
import { PlanTabContent } from "./PlanTabContent";
import { ReservasTabContent } from "./ReservasTabContent";
import { GastosTabContent } from "./GastosTabContent";

type CityDetailTab = "plan" | "reservas" | "gastos";

// Notas has no data source yet (#23) — an inert placeholder, same treatment
// auth gave its inert account-menu items.
const INERT_TABS = [{ key: "notas", label: "Notas" }] as const;

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
  initialBookings: BookingDetail[];
  initialExpenses: ExpenseDetail[];
  tripMembers: TripMemberSummary[];
  tripCurrency: string;
}

/**
 * Owns which of the 4 tabs is showing. Plan, Reservas, and Gastos are all
 * real now (#10, #12/#13, #14) and each needs its list lifted here so the
 * "Plan · N" / "Reservas · N" / "Gastos · N" tab counts stay in sync with
 * adds/edits without a reload.
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
  initialBookings,
  initialExpenses,
  tripMembers,
  tripCurrency,
}: CityDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<CityDetailTab>("plan");
  const [places, setPlaces] = useState(initialPlaces);
  const [bookings, setBookings] = useState(initialBookings);
  const [expenses, setExpenses] = useState(initialExpenses);

  const realTabs: { key: CityDetailTab; label: string; count: number }[] = [
    { key: "plan", label: "Plan", count: places.length },
    { key: "reservas", label: "Reservas", count: bookings.length },
    { key: "gastos", label: "Gastos", count: expenses.length },
  ];

  return (
    <div className="flex flex-col gap-[var(--space-5)]">
      <div className="flex gap-[var(--space-2)]">
        {realTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            aria-current={activeTab === tab.key ? "page" : undefined}
            className={[
              "inline-flex min-h-[44px] items-center justify-center rounded-pill px-[var(--space-4)] py-[var(--space-2)] text-[length:var(--text-sm)] font-semibold",
              activeTab === tab.key ? "bg-primary text-text-on-primary" : "bg-surface-2 text-text-muted hover:text-text",
              FOCUS_RING,
            ].join(" ")}
          >
            {tab.label} · {tab.count}
          </button>
        ))}
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
      ) : activeTab === "reservas" ? (
        <ReservasTabContent
          tripId={tripId}
          stopId={stopId}
          bookings={bookings}
          onBookingsChange={setBookings}
          tripMembers={tripMembers}
        />
      ) : (
        <GastosTabContent
          tripId={tripId}
          stopId={stopId}
          expenses={expenses}
          onExpensesChange={setExpenses}
          tripMembers={tripMembers}
          tripCurrency={tripCurrency}
        />
      )}
    </div>
  );
}
