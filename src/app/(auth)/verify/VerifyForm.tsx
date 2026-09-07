"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/core/Button";
import { AlertBanner, CodeInput } from "@/components/forms";
import { verifyAction, resendAction, type VerifyFormState, type ResendFormState } from "./actions";

const VERIFY_INITIAL_STATE: VerifyFormState = {};
const RESEND_INITIAL_STATE: ResendFormState = {};

export function VerifyForm({
  email,
  initialCooldownSeconds,
}: {
  email: string;
  initialCooldownSeconds: number;
}) {
  const [verifyState, verifySubmit, verifyPending] = useActionState(
    verifyAction,
    VERIFY_INITIAL_STATE,
  );
  const [resendState, resendSubmit, resendPending] = useActionState(
    resendAction,
    RESEND_INITIAL_STATE,
  );
  const [code, setCode] = useState("");
  const [cooldown, setCooldown] = useState(initialCooldownSeconds);

  // Sync `cooldown`/`code` off a resend response during render (React's
  // documented pattern for "adjust state when a value changes") rather than
  // in an effect — an effect here would set state synchronously on mount,
  // triggering an extra cascading render for no benefit.
  const [handledResendState, setHandledResendState] = useState(resendState);
  if (resendState !== handledResendState) {
    setHandledResendState(resendState);
    if (typeof resendState.cooldownSeconds === "number") {
      setCooldown(resendState.cooldownSeconds);
    }
    if (resendState.resent) setCode("");
  }

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((seconds) => seconds - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  return (
    <form action={verifySubmit} className="flex flex-col gap-[var(--space-6)]">
      <input type="hidden" name="email" value={email} readOnly />
      <CodeInput
        name="code"
        value={code}
        onChange={setCode}
        error={Boolean(verifyState.formError)}
        disabled={verifyPending}
        autoFocus
      />
      {verifyState.formError ? (
        <p className="-mt-[var(--space-3)] m-0 text-[length:var(--text-xs)] text-alert">
          {verifyState.formError}
        </p>
      ) : null}
      <Button type="submit" size="lg" fullWidth disabled={verifyPending}>
        {verifyPending ? "Verificando…" : "Verificar"}
      </Button>
      <div className="flex items-center justify-between gap-[var(--space-3)] text-[length:var(--text-sm)]">
        {cooldown > 0 ? (
          <span className="font-mono text-[length:var(--text-xs)] text-text-muted">
            {`Reenviar en 0:${String(cooldown).padStart(2, "0")}`}
          </span>
        ) : (
          <button
            type="submit"
            formAction={resendSubmit}
            disabled={resendPending}
            className="font-medium text-primary underline underline-offset-[3px] disabled:opacity-50"
          >
            {resendPending ? "Reenviando…" : "Reenviar código"}
          </button>
        )}
        <Link
          href="/signup"
          className="text-text-muted underline underline-offset-[3px]"
        >
          Cambiar el correo
        </Link>
      </div>
      {resendState.formError ? (
        <AlertBanner icon="clock">{resendState.formError}</AlertBanner>
      ) : null}
    </form>
  );
}
