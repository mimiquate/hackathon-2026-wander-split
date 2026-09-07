import { prisma } from "@/lib/prisma";

export interface TripNoteAuthor {
  membershipId: string;
  displayName: string;
  colorIndex: number;
}

export interface TripNoteData {
  id: string;
  stopId: string;
  text: string;
  createdAt: Date;
  author: TripNoteAuthor;
}

type NoteWithMembership = {
  id: string;
  stopId: string;
  text: string;
  createdAt: Date;
  membership: { id: string; displayName: string; colorIndex: number };
};

function toNoteData(note: NoteWithMembership): TripNoteData {
  return {
    id: note.id,
    stopId: note.stopId,
    text: note.text,
    createdAt: note.createdAt,
    author: {
      membershipId: note.membership.id,
      displayName: note.membership.displayName,
      colorIndex: note.membership.colorIndex,
    },
  };
}

/** Every note left for this stop's city, oldest first. */
export async function getNotesForStop(stopId: string): Promise<TripNoteData[]> {
  const notes = await prisma.tripNote.findMany({
    where: { stopId },
    orderBy: { createdAt: "asc" },
    include: {
      membership: { select: { id: true, displayName: true, colorIndex: true } },
    },
  });

  return notes.map(toNoteData);
}

export interface AddNoteInput {
  stopId: string;
  membershipId: string;
  text: string;
}

export type AddNoteResult =
  | { ok: true; note: TripNoteData }
  | { ok: false; fieldErrors?: { text?: string }; formError?: string };

export async function addNote({ stopId, membershipId, text }: AddNoteInput): Promise<AddNoteResult> {
  const trimmedText = text.trim();
  if (!trimmedText) {
    return { ok: false, fieldErrors: { text: "Escribí algo para mandar." } };
  }

  const stop = await prisma.tripStop.findUnique({ where: { id: stopId }, select: { id: true } });
  if (!stop) {
    return { ok: false, formError: "La parada no existe." };
  }

  const membership = await prisma.tripMembership.findUnique({
    where: { id: membershipId },
    select: { id: true, displayName: true, colorIndex: true },
  });
  if (!membership) {
    return { ok: false, formError: "El integrante no existe." };
  }

  const note = await prisma.tripNote.create({
    data: { stopId, membershipId, text: trimmedText },
  });

  return { ok: true, note: toNoteData({ ...note, membership }) };
}
