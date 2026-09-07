import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Card } from "@/components/core/Card";
import { getCurrentUser } from "@/lib/auth/current-user";
import { CreateTripForm } from "./CreateTripForm";

export const metadata: Metadata = { title: "Nuevo viaje — wonderSplit" };

export default async function NewTripPage() {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent("/trips/new")}`);

  return (
    <div className="mx-auto flex min-h-svh max-w-[420px] flex-col justify-center gap-[var(--space-7)] px-[var(--gutter)] py-[var(--space-9)]">
      <Card padding="lg" className="flex flex-col gap-[var(--space-6)]">
        <div className="flex flex-col gap-[var(--space-2)]">
          <span className="font-mono text-[length:var(--text-eyebrow)] tracking-[var(--tracking-eyebrow)] uppercase text-text-muted">
            Arrancá
          </span>
          <h1 className="m-0 text-balance font-display text-[length:var(--text-lg)] font-bold tracking-[-0.01em]">
            Nuevo viaje
          </h1>
          <p className="m-0 text-[length:var(--text-sm)] leading-normal text-text-muted">
            Contanos lo básico — el resto lo armamos después.
          </p>
        </div>
        <CreateTripForm />
      </Card>
    </div>
  );
}
