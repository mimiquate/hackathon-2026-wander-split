import { prisma } from "@/lib/prisma";

export interface AddVoucherFileInput {
  bookingId: string;
  url: string;
  filename: string;
  mimeType: string;
}

/** Called once a browser-to-Blob upload actually completes (the upload
 * endpoint's onUploadCompleted) — only the resulting metadata is stored
 * here, never the file's bytes (ADR 0009). */
export async function addVoucherFile({ bookingId, url, filename, mimeType }: AddVoucherFileInput) {
  return prisma.voucherFile.create({
    data: { bookingId, url, filename, mimeType },
  });
}
