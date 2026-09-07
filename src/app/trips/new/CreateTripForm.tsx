"use client";

import { useActionState } from "react";
import { Button } from "@/components/core/Button";
import { Input, Select } from "@/components/forms";
import { DEFAULT_TRIP_CURRENCY, TRIP_CURRENCIES } from "@/lib/trips/constants";
import { createTripAction, type CreateTripFormState } from "./actions";

const INITIAL_STATE: CreateTripFormState = {};

const CURRENCY_OPTIONS = TRIP_CURRENCIES.map((currency) => ({ value: currency, label: currency }));

export function CreateTripForm() {
  const [state, formAction, pending] = useActionState(createTripAction, INITIAL_STATE);

  return (
    <form action={formAction} className="flex flex-col gap-[var(--space-6)]">
      <Input
        label="Nombre del viaje"
        name="name"
        placeholder="Verano en Sevilla"
        icon="map"
        required
        error={state.fieldErrors?.name}
      />
      <Input
        label="Arranca el"
        name="startDate"
        type="date"
        icon="calendar"
        required
        error={state.fieldErrors?.startDate}
      />
      <Select
        label="Moneda"
        name="currency"
        icon="banknote"
        defaultValue={DEFAULT_TRIP_CURRENCY}
        options={CURRENCY_OPTIONS}
        error={state.fieldErrors?.currency}
      />
      {state.formError ? (
        <p className="m-0 text-[length:var(--text-xs)] text-alert">{state.formError}</p>
      ) : null}
      <Button type="submit" size="lg" fullWidth disabled={pending}>
        {pending ? "Creando el viaje…" : "Crear viaje"}
      </Button>
    </form>
  );
}
