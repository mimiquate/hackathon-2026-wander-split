import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { findTripMembership } from "@/lib/trips/membership";
import { getBookingTripId } from "@/lib/trips/bookings";
import { addVoucherFile } from "@/lib/trips/vouchers";

// A wildcard is honored by Vercel Blob's allowedContentTypes matcher —
// #13's checklist wants PDF and image uploads, nothing else.
const ALLOWED_VOUCHER_CONTENT_TYPES = ["application/pdf", "image/*"];

interface VoucherUploadPayload {
  bookingId: string;
}

function parseClientPayload(clientPayload: string | null): VoucherUploadPayload {
  if (!clientPayload) {
    throw new Error("Falta el ID de la reserva.");
  }

  const parsed = JSON.parse(clientPayload) as { bookingId?: unknown };
  if (typeof parsed.bookingId !== "string" || !parsed.bookingId) {
    throw new Error("Falta el ID de la reserva.");
  }

  return { bookingId: parsed.bookingId };
}

/**
 * Issues a short-lived Vercel Blob client-upload token (ADR 0009), scoped
 * to one booking the requesting user actually has access to — the browser
 * uploads straight to Blob with this token, the server never sees the
 * file's bytes.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        const { bookingId } = parseClientPayload(clientPayload);

        const user = await getCurrentUser();
        if (!user) {
          throw new Error("Iniciá sesión de nuevo para continuar.");
        }

        const tripId = await getBookingTripId(bookingId);
        if (!tripId) {
          throw new Error("La reserva no existe.");
        }

        const membership = await findTripMembership(tripId, user.id);
        if (!membership) {
          throw new Error("No tenés acceso a esta reserva.");
        }

        return {
          allowedContentTypes: ALLOWED_VOUCHER_CONTENT_TYPES,
          tokenPayload: JSON.stringify({ bookingId }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        if (!tokenPayload) return;
        const { bookingId } = JSON.parse(tokenPayload) as VoucherUploadPayload;

        await addVoucherFile({
          bookingId,
          url: blob.url,
          filename: blob.pathname,
          mimeType: blob.contentType,
        });
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
