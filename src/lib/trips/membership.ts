import { prisma } from "@/lib/prisma";
import type { TripRole } from "@/lib/trips/constants";

export interface TripCrewMember {
  membershipId: string;
  userId: string;
  displayName: string;
  colorIndex: number;
  role: TripRole;
}

/**
 * Null when the user isn't a member of the trip. Every later
 * authorization check (Phase 3/5's invite panel, Phase 4's
 * skip-the-join-screen, Phase 6's edit dialog) goes through this.
 */
export async function findTripMembership(
  tripId: string,
  userId: string,
): Promise<TripCrewMember | null> {
  const membership = await prisma.tripMembership.findUnique({
    where: { tripId_userId: { tripId, userId } },
  });

  if (!membership) return null;

  return {
    membershipId: membership.id,
    userId: membership.userId,
    displayName: membership.displayName,
    colorIndex: membership.colorIndex,
    role: membership.role as TripRole,
  };
}

export interface TripMemberSummary {
  id: string;
  displayName: string;
  colorIndex: number;
}

/**
 * Every member of the trip, oldest first — the crew list "Quién reservó,"
 * "Quién pagó," and "Quién lo usa" (#12/#13) are drawn from, and how a
 * booking's stored membership ids get resolved back to a display name.
 */
export async function getTripMembers(tripId: string): Promise<TripMemberSummary[]> {
  return prisma.tripMembership.findMany({
    where: { tripId },
    orderBy: { createdAt: "asc" },
    select: { id: true, displayName: true, colorIndex: true },
  });
}
