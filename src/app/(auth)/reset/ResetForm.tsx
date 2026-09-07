"use client";

import { useActionState } from "react";
import { Button } from "@/components/core/Button";
import { AlertBanner, Input } from "@/components/forms";
import { resetAction, type ResetFormState } from "./actions";

const INITIAL_STATE: ResetFormState = {};

export function ResetForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(resetAction, INITIAL_STATE);

  return (
    <form action={formAction} className="flex flex-col gap-[var(--space-6)]">
      <input type="hidden" name="token" value={token} readOnly />
      <Input
        label="Contraseña nueva"
        name="password"
        placeholder="Elegí una"
        icon="lock"
        type="password"
        required
        minLength={8}
        hint={state.fieldErrors?.password ? undefined : "Mínimo 8 caracteres."}
        error={state.fieldErrors?.password}
        disabled={pending}
      />
      <Input
        label="Confirmá la contraseña"
        name="confirmPassword"
        placeholder="Repetila"
        icon="lock"
        type="password"
        required
        error={state.fieldErrors?.confirmPassword}
        disabled={pending}
      />
      {state.formError ? <AlertBanner icon="link-2-off">{state.formError}</AlertBanner> : null}
      <Button type="submit" size="lg" fullWidth disabled={pending}>
        {pending ? "Guardando…" : "Guardar contraseña"}
      </Button>
    </form>
  );
}
