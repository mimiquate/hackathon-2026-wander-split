import type { Metadata } from "next";
import { Card } from "@/components/core/Card";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Inicio — wonderSplit" };

export default async function HomePage() {
  const user = await getCurrentUser();

  return (
    <main className="flex min-h-screen items-center justify-center p-[var(--space-4)]">
      <Card padding="lg" className="flex flex-col gap-[var(--space-6)] max-w-[420px]">
        <h1 className="m-0 font-display text-[length:var(--text-lg)] font-bold tracking-[-0.01em]">
          Bienvenido a wonderSplit, {user?.name || "usuario"}
        </h1>
        <p className="m-0 text-[length:var(--text-sm)] leading-normal text-text-muted">
          Esta es tu zona autenticada. Aquí irán todas tus rutas, gastos y finanzas cuando estén listos.
        </p>
      </Card>
    </main>
  );
}
