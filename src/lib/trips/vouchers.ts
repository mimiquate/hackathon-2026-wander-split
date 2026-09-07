import { del } from "@vercel/blob";
import { prisma } from "@/lib/prisma";

export interface VoucherFileData {
  id: string;
  url: string;
  filename: string;
  mimeType: string;
}

export interface AddVoucherFileInput {
  bookingId: string;
  url: string;
  filename: string;
  mimeType: string;
}

/**
 * Persists a completed upload's metadata (ADR 0009 — only the metadata
 * lives here, never the bytes). An upsert on (bookingId, url), not a plain
 * create: both the client (right after upload() resolves) and Blob's own
 * onUploadCompleted webhook call this for the same upload, so whichever
 * runs first creates the row and the other just gets it back unchanged.
 */
export async function addVoucherFile({
  bookingId,
  url,
  filename,
  mimeType,
}: AddVoucherFileInput): Promise<VoucherFileData> {
  return prisma.voucherFile.upsert({
    where: { bookingId_url: { bookingId, url } },
    update: {},
    create: { bookingId, url, filename, mimeType },
  });
}

export type RemoveVoucherFileResult = { ok: true } | { ok: false; formError?: string };

/** Deletes the DB row and best-effort cleans up the actual Blob object —
 * a failed Blob call doesn't block the file from being gone in the app. */
export async function removeVoucherFile(bookingId: string, voucherId: string): Promise<RemoveVoucherFileResult> {
  const voucher = await prisma.voucherFile.findUnique({
    where: { id: voucherId },
    select: { bookingId: true, url: true },
  });

  if (!voucher || voucher.bookingId !== bookingId) {
    return { ok: false, formError: "El comprobante no existe en esta reserva." };
  }

  await prisma.voucherFile.delete({ where: { id: voucherId } });

  try {
    await del(voucher.url);
  } catch {
    // The DB row is already gone; a dangling Blob object is a storage leak
    // to clean up later, not a reason to fail the removal itself.
  }

  return { ok: true };
}
