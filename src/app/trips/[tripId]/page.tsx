import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Card } from "@/components/core/Card";
import { getCurrentUser } from "@/lib/auth/current-user";
import { findTripMembership } from "@/lib/trips/membership";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Tu viaje — wonderSplit" };

// Placeholder landing spot for a freshly created trip — just enough that
// Phase 2's create-trip redirect isn't a dead end. Phase 3 replaces this
// with the real invite panel (copyable link, add-by-email, crew grid).
export default async function TripPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const membership = await findTripMembership(tripId, user.id);
  if (!membership) notFound();

  const trip = await prisma.trip.findUnique({ where: { id: tripId }, select: { name: true } });
  if (!trip) notFound();

  return (
    <div className="mx-auto flex min-h-svh max-w-[420px] flex-col justify-center gap-[var(--space-7)] px-[var(--gutter)] py-[var(--space-9)]">
      <Card padding="lg" className="flex flex-col gap-[var(--space-4)]">
        <span className="font-mono text-[length:var(--text-eyebrow)] tracking-[var(--tracking-eyebrow)] uppercase text-text-muted">
          Viaje creado
        </span>
        <h1 className="m-0 text-balance font-display text-[length:var(--text-lg)] font-bold tracking-[-0.01em]">
          {trip.name}
        </h1>
        <p className="m-0 text-[length:var(--text-sm)] leading-normal text-text-muted">
          Invitá a tu grupo — el panel de invitación llega en la próxima fase.
        </p>
      </Card>
    </div>
  );
}
