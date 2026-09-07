"use client";

import { useActionState } from "react";
import { Button } from "@/components/core/Button";
import { Input } from "@/components/forms";
import { ColorSwatchPicker } from "@/components/trip/ColorSwatchPicker";
import { joinTripAction, type JoinTripFormState } from "./actions";

const INITIAL_STATE: JoinTripFormState = {};

export function JoinForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(joinTripAction.bind(null, token), INITIAL_STATE);

  return (
    <form action={formAction} className="flex flex-col gap-[var(--space-6)]">
      <Input
        label="Cómo querés que te llamen"
        name="displayName"
        placeholder="Juli"
        icon="user"
        required
        error={state.fieldErrors?.displayName}
      />
      <ColorSwatchPicker name="colorIndex" />
      {state.formError ? (
        <p className="m-0 text-[length:var(--text-xs)] text-alert">{state.formError}</p>
      ) : null}
      <Button type="submit" size="lg" fullWidth disabled={pending}>
        {pending ? "Entrando…" : "Sumarme al viaje"}
      </Button>
    </form>
  );
}
