"use client";

import { useActionState, useEffect } from "react";
import { Button } from "@/components/core/Button";
import { Input } from "@/components/forms";
import { AlertBanner } from "@/components/forms/AlertBanner";
import { Card } from "@/components/core/Card";
import { reauthAction, type ReauthFormState } from "@/app/(app)/actions";

export interface LockedOverlayProps {
  email: string;
  onUnlock: () => void;
}

const INITIAL_STATE: ReauthFormState = {};

export function LockedOverlay({ email, onUnlock }: LockedOverlayProps) {
  const [state, formAction, pending] = useActionState(reauthAction, INITIAL_STATE);

  useEffect(() => {
    if (!state.formError && !state.fieldErrors) {
      onUnlock();
    }
  }, [state, onUnlock]);

  return (
    <Card padding="lg" className="flex flex-col gap-[var(--space-6)] max-w-[420px]">
      <div className="flex flex-col gap-[var(--space-2)]">
        <h2 className="m-0 font-display text-[length:var(--text-lg)] font-bold tracking-[-0.01em]">
          Sesión expirada
        </h2>
        <p className="m-0 text-[length:var(--text-sm)] leading-normal text-text-muted">
          Tu sesión ha expirado. Por favor, vuelve a ingresar para continuar.
        </p>
      </div>

      <form action={formAction} className="flex flex-col gap-[var(--space-6)]">
        {state.formError ? (
          <AlertBanner icon="alert-circle">{state.formError}</AlertBanner>
        ) : null}

        <Input
          type="email"
          label="Email"
          name="email"
          defaultValue={email}
          disabled={pending}
          readOnly
        />

        <Input
          type="password"
          label="Contraseña"
          name="password"
          placeholder="Tu contraseña"
          error={state.fieldErrors?.password}
          disabled={pending}
          autoFocus
        />

        <Button type="submit" size="lg" fullWidth disabled={pending}>
          {pending ? "Autenticando…" : "Continuar"}
        </Button>
      </form>
    </Card>
  );
}
