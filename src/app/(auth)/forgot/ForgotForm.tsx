"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/core/Button";
import { Input } from "@/components/forms";
import { forgotAction, type ForgotFormState } from "./actions";

const INITIAL_STATE: ForgotFormState = {};

export function ForgotForm() {
  const [state, formAction, pending] = useActionState(forgotAction, INITIAL_STATE);

  if (state.sent) {
    return (
      <div className="flex flex-col gap-[var(--space-6)]">
        <p className="m-0 text-[length:var(--text-sm)] text-text">
          Si ese correo tiene una cuenta, te mandamos un enlace para elegir una contraseña nueva.
        </p>
        <p className="m-0 text-[length:var(--text-sm)] text-text-muted">
          Revisá tu bandeja de entrada (y la carpeta de spam, por las dudas).
        </p>
        <Link
          href="/login"
          className="text-center text-[length:var(--text-sm)] font-bold text-primary"
        >
          Volver a entrar
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-[var(--space-6)]">
      <Input
        label="Correo"
        name="email"
        placeholder="juan@correo.com"
        icon="mail"
        type="email"
        required
        disabled={pending}
      />
      <Button type="submit" size="lg" fullWidth disabled={pending}>
        {pending ? "Enviando…" : "Enviar enlace"}
      </Button>
      <p className="m-0 text-center text-[length:var(--text-sm)] text-text-muted">
        ¿Te acordaste?{" "}
        <Link href="/login" className="font-bold text-primary">
          Entrá
        </Link>
      </p>
    </form>
  );
}
