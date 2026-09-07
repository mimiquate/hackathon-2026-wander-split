import { prisma } from "@/lib/prisma";

export interface UserTripMember {
  name: string;
  colorIndex: number;
}

export interface UserTripSummary {
  id: string;
  name: string;
  startDate: Date;
  members: UserTripMember[];
  // Always empty until #8 gives trips real stops — kept as a first-class
  // field so the card layer can already read "route as city names" and
  // needs no shape change once #8 lands.
  cities: string[];
}

/**
 * Every trip the user belongs to (as creator or joined participant),
 * soonest-upcoming first; trips that already started sort after, most
 * recent first.
 */
export async function listUserTrips(userId: string): Promise<UserTripSummary[]> {
  const memberships = await prisma.tripMembership.findMany({
    where: { userId },
    include: {
      trip: {
        include: { memberships: { orderBy: { createdAt: "asc" } } },
      },
    },
  });

  const now = new Date();

  return memberships
    .map((membership) => membership.trip)
    .sort((a, b) => {
      const aUpcoming = a.startDate >= now;
      const bUpcoming = b.startDate >= now;
      if (aUpcoming !== bUpcoming) return aUpcoming ? -1 : 1;
      return aUpcoming
        ? a.startDate.getTime() - b.startDate.getTime()
        : b.startDate.getTime() - a.startDate.getTime();
    })
    .map((trip) => ({
      id: trip.id,
      name: trip.name,
      startDate: trip.startDate,
      members: trip.memberships.map((member) => ({
        name: member.displayName,
        colorIndex: member.colorIndex,
      })),
      cities: [],
    }));
}
