"use client";

import { useState } from "react";
import { Card } from "@/components/core/Card";
import { FOCUS_RING } from "@/lib/styles";
import { DatosViajeDialog } from "./DatosViajeDialog";

export type TripTab = "ruta" | "grupo" | "gastos" | "balance";

export interface TripShellProps {
  tripId: string;
  tripName: string;
  tripStartDate: string;
  canEditStartDate: boolean;
  defaultTab?: TripTab;
  children: {
    ruta: React.ReactNode;
    grupo: React.ReactNode;
    gastos: React.ReactNode;
    balance: React.ReactNode;
  };
}

const TAB_LABELS: Record<TripTab, string> = {
  ruta: "Ruta",
  grupo: "Grupo",
  gastos: "Gastos",
  balance: "Balance",
};

export function TripShell({
  tripId,
  tripName,
  tripStartDate,
  canEditStartDate,
  defaultTab = "ruta",
  children,
}: TripShellProps) {
  const [activeTab, setActiveTab] = useState<TripTab>(defaultTab);

  const tabs: TripTab[] = ["ruta", "grupo", "gastos", "balance"];

  return (
    <div className="mx-auto flex min-h-svh max-w-[480px] flex-col gap-[var(--space-6)] px-[var(--gutter)] py-[var(--space-6)]">
      {/* Header with trip name and dates */}
      <Card padding="lg">
        <DatosViajeDialog
          tripId={tripId}
          initialName={tripName}
          initialStartDate={tripStartDate}
          canEditStartDate={canEditStartDate}
        />
      </Card>

      {/* Tab bar */}
      <div className="flex gap-[var(--space-2)]">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={[
              "inline-flex items-center justify-center rounded-[var(--radius-pill)] px-[var(--space-4)] py-[var(--space-2)]",
              "text-[length:var(--text-sm)] font-medium transition-colors",
              "min-h-[44px] min-w-[44px]",
              FOCUS_RING,
              activeTab === tab
                ? "bg-surface-accent text-text-accent"
                : "bg-surface-tertiary text-text hover:bg-surface-secondary",
            ].join(" ")}
            aria-current={activeTab === tab ? "page" : undefined}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1">
        {activeTab === "ruta" && children.ruta}
        {activeTab === "grupo" && children.grupo}
        {activeTab === "gastos" && children.gastos}
        {activeTab === "balance" && children.balance}
      </div>
    </div>
  );
}
