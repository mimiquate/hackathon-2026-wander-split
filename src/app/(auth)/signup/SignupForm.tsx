"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Button } from "@/components/core/Button";
import { Checkbox, Input } from "@/components/forms";
import { signupAction, type SignupFormState } from "./actions";

const INITIAL_STATE: SignupFormState = {};

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signupAction, INITIAL_STATE);
  const [termsAccepted, setTermsAccepted] = useState(false);

  return (
    <form action={formAction} className="flex flex-col gap-[var(--space-6)]">
      <Input
        label="Correo"
        name="email"
        placeholder="juan@correo.com"
        icon="mail"
        type="email"
        required
        error={state.fieldErrors?.email}
      />
      <Input
        label="Contraseña"
        name="password"
        placeholder="Elegí una"
        icon="lock"
        type="password"
        required
        minLength={8}
        hint={state.fieldErrors?.password ? undefined : "Mínimo 8 caracteres."}
        error={state.fieldErrors?.password}
      />
      <Checkbox
        name="terms"
        checked={termsAccepted}
        onChange={(event) => setTermsAccepted(event.target.checked)}
        label={
          <>
            Acepto los{" "}
            <Link href="/terms" className="underline underline-offset-[3px]">
              términos
            </Link>{" "}
            y la{" "}
            <Link href="/privacy" className="underline underline-offset-[3px]">
              política de privacidad
            </Link>
          </>
        }
      />
      {state.formError ? (
        <p className="m-0 text-[length:var(--text-xs)] text-alert">{state.formError}</p>
      ) : null}
      <Button type="submit" size="lg" fullWidth disabled={pending || !termsAccepted}>
        {pending ? "Creando tu cuenta…" : "Crear cuenta"}
      </Button>
      <p className="m-0 text-center text-[length:var(--text-sm)] text-text-muted">
        ¿Ya tenés cuenta?{" "}
        <Link href="/login" className="font-bold text-primary">
          Entrá
        </Link>
      </p>
    </form>
  );
}
