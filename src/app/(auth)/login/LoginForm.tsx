"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/core/Button";
import { AlertBanner, Input } from "@/components/forms";
import { loginAction, type LoginFormState } from "./actions";

const INITIAL_STATE: LoginFormState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, INITIAL_STATE);

  return (
    <form action={formAction} className="flex flex-col gap-[var(--space-6)]">
      {state.rateLimited ? (
        <AlertBanner icon="shield-alert">{state.formError}</AlertBanner>
      ) : null}
      <Input
        label="Correo"
        name="email"
        placeholder="juan@correo.com"
        icon="mail"
        type="email"
        required
        disabled={state.rateLimited}
      />
      <Input
        label="Contraseña"
        name="password"
        placeholder="••••••••"
        icon="lock"
        type="password"
        required
        error={state.fieldErrors?.password}
        disabled={state.rateLimited}
      />
      <div className="-mt-[var(--space-3)] flex justify-end">
        <Link
          href="/forgot"
          className="text-[length:var(--text-sm)] font-medium text-primary underline underline-offset-[3px]"
        >
          Olvidé mi contraseña
        </Link>
      </div>
      <Button type="submit" size="lg" fullWidth disabled={pending || state.rateLimited}>
        {pending ? "Entrando…" : "Entrar"}
      </Button>
      <p className="m-0 text-center text-[length:var(--text-sm)] text-text-muted">
        ¿Primera vez?{" "}
        <Link href="/signup" className="font-bold text-primary">
          Creá tu cuenta
        </Link>
      </p>
    </form>
  );
}
