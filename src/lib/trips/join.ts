import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isAvatarColorIndex } from "@/lib/avatar-colors";
import { findTripMembership } from "@/lib/trips/membership";

export interface JoinTripInput {
  token: string;
  userId: string;
  displayName: string;
  colorIndex: number;
}

export type JoinTripResult =
  | { ok: true; tripId: string; membershipId: string; alreadyMember: boolean }
  | {
      ok: false;
      fieldErrors?: { displayName?: string; colorIndex?: string };
      formError?: string;
    };

export async function joinTrip({
  token,
  userId,
  displayName,
  colorIndex,
}: JoinTripInput): Promise<JoinTripResult> {
  const invite = await prisma.tripInvite.findUnique({ where: { token } });
  if (!invite) {
    return { ok: false, formError: "Esa invitación no existe o ya no está disponible." };
  }

  const tripId = invite.tripId;

  // Before validation, so re-opening a link with an empty form is a clean
  // no-op rather than a spurious field error.
  const existingMembership = await findTripMembership(tripId, userId);
  if (existingMembership) {
    return {
      ok: true,
      tripId,
      membershipId: existingMembership.membershipId,
      alreadyMember: true,
    };
  }

  const trimmedDisplayName = displayName.trim();
  if (!trimmedDisplayName) {
    return { ok: false, fieldErrors: { displayName: "Poné cómo querés que te llamen." } };
  }

  if (!isAvatarColorIndex(colorIndex)) {
    return { ok: false, fieldErrors: { colorIndex: "Elegí un color." } };
  }

  // Read the email from the DB, never from the caller, so nobody can claim
  // someone else's reservation by passing an arbitrary email.
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { email: true },
  });

  const reservation = await prisma.tripInviteReservation.findUnique({
    where: { tripId_email: { tripId, email: user.email } },
  });
  const claimableReservation = reservation && !reservation.claimedAt ? reservation : null;

  try {
    const membership = await prisma.$transaction(async (tx) => {
      const created = await tx.tripMembership.create({
        data: {
          tripId,
          userId,
          role: "participant",
          displayName: trimmedDisplayName,
          colorIndex,
        },
        select: { id: true },
      });

      if (claimableReservation) {
        // updateMany, not update: a concurrent claim leaves this a silent
        // 0-row no-op instead of a P2025 that would roll back a good join.
        await tx.tripInviteReservation.updateMany({
          where: { id: claimableReservation.id, claimedAt: null },
          data: { claimedAt: new Date(), claimedByMembershipId: created.id },
        });
      }

      return created;
    });

    return { ok: true, tripId, membershipId: membership.id, alreadyMember: false };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      // Two concurrent joins raced on the tripId+userId unique constraint;
      // the transaction rolled back, so re-read the winner's membership.
      const membership = await findTripMembership(tripId, userId);
      if (!membership) throw error;
      return { ok: true, tripId, membershipId: membership.membershipId, alreadyMember: true };
    }
    throw error;
  }
}
