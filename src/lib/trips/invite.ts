import { randomBytes } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { EMAIL_PATTERN, normalizeEmail } from "@/lib/email-validation";
import { formatCalendarDate } from "@/lib/trips/dates";
import type { TripCurrency } from "@/lib/trips/constants";
import type { TripCrewMember } from "@/lib/trips/membership";

/**
 * A deliberate deviation from session.ts's randomBytes(32).toString("hex"):
 * this token is user-visible, pasted into a link shared over WhatsApp, so
 * 64 hex characters would be needlessly ugly. base64url keeps it URL-safe.
 */
export function createInviteToken(): string {
  return randomBytes(16).toString("base64url");
}

export interface TripByInviteToken {
  tripId: string;
  name: string;
  startDate: string; // "YYYY-MM-DD"
  currency: TripCurrency;
  inviteToken: string;
  admin: TripCrewMember | null; // "who invited you" (Phase 4)
  members: TripCrewMember[]; // "who's already in", oldest first
}

function toCrewMember(membership: {
  id: string;
  userId: string;
  displayName: string;
  colorIndex: number;
  role: string;
}): TripCrewMember {
  return {
    membershipId: membership.id,
    userId: membership.userId,
    displayName: membership.displayName,
    colorIndex: membership.colorIndex,
    role: membership.role as TripCrewMember["role"],
  };
}

/** Null for an unknown token — Phase 4 turns that into its error state. */
export async function findTripByInviteToken(token: string): Promise<TripByInviteToken | null> {
  const invite = await prisma.tripInvite.findUnique({
    where: { token },
    include: {
      trip: {
        include: {
          memberships: { orderBy: { createdAt: "asc" } },
        },
      },
    },
  });

  if (!invite) return null;

  const members = invite.trip.memberships.map(toCrewMember);
  const admin = members.find((member) => member.role === "admin") ?? null;

  return {
    tripId: invite.trip.id,
    name: invite.trip.name,
    startDate: formatCalendarDate(invite.trip.startDate),
    currency: invite.trip.currency as TripCurrency,
    inviteToken: invite.token,
    admin,
    members,
  };
}

export type ReserveInviteEmailResult =
  | { ok: true; reservationId: string; email: string; alreadyReserved: boolean }
  | { ok: false; fieldErrors?: { email?: string }; formError?: string };

export async function reserveInviteEmail({
  tripId,
  email,
}: {
  tripId: string;
  email: string;
}): Promise<ReserveInviteEmailResult> {
  const normalizedEmail = normalizeEmail(email);

  if (!EMAIL_PATTERN.test(normalizedEmail)) {
    return { ok: false, fieldErrors: { email: "Ese correo no parece válido." } };
  }

  const existingMember = await prisma.tripMembership.findFirst({
    where: { tripId, user: { email: normalizedEmail } },
    select: { id: true },
  });
  if (existingMember) {
    return { ok: false, fieldErrors: { email: "Esa persona ya está en el viaje." } };
  }

  const existingReservation = await prisma.tripInviteReservation.findUnique({
    where: { tripId_email: { tripId, email: normalizedEmail } },
  });
  if (existingReservation) {
    return {
      ok: true,
      reservationId: existingReservation.id,
      email: normalizedEmail,
      alreadyReserved: true,
    };
  }

  try {
    const reservation = await prisma.tripInviteReservation.create({
      data: { tripId, email: normalizedEmail },
    });
    return { ok: true, reservationId: reservation.id, email: normalizedEmail, alreadyReserved: false };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      // Two "Sumar" clicks raced each other — re-read rather than fail.
      const reservation = await prisma.tripInviteReservation.findUniqueOrThrow({
        where: { tripId_email: { tripId, email: normalizedEmail } },
      });
      return { ok: true, reservationId: reservation.id, email: normalizedEmail, alreadyReserved: true };
    }
    throw error;
  }
}
