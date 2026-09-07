"use client";

import { useState, type ChangeEvent } from "react";
import { upload } from "@vercel/blob/client";
import { Icon } from "@/components/core/Icon";
import { FOCUS_RING_INSET } from "@/lib/styles";
import type { VoucherFileData } from "@/lib/trips/vouchers";
import { confirmVoucherUploadAction } from "./actions";

export interface VoucherUploaderProps {
  tripId: string;
  stopId: string;
  bookingId: string;
  onUploaded: (voucher: VoucherFileData) => void;
}

function isSupportedFile(file: File): boolean {
  return file.type === "application/pdf" || file.type.startsWith("image/");
}

/**
 * The upload itself goes straight from the browser to Blob using Phase 1's
 * scoped token (upload() fetches it from /api/vouchers/upload) — this
 * component's server round trips only ever carry the resulting metadata,
 * never the file's bytes.
 */
export function VoucherUploader({ tripId, stopId, bookingId, onUploaded }: VoucherUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ""; // let picking the same file again re-trigger onChange
    if (!file) return;

    if (!isSupportedFile(file)) {
      setError("Subí un PDF o una imagen.");
      return;
    }

    setError(undefined);
    setUploading(true);

    try {
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/vouchers/upload",
        clientPayload: JSON.stringify({ bookingId }),
      });

      const result = await confirmVoucherUploadAction(tripId, stopId, bookingId, {
        url: blob.url,
        filename: blob.pathname,
        mimeType: blob.contentType,
      });

      if (!result.ok) {
        setError(result.formError ?? "No se pudo guardar el comprobante.");
        return;
      }

      onUploaded(result.voucher);
    } catch {
      setError("No se pudo subir el archivo. Probá con un PDF o una imagen.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-[var(--space-2)]">
      <label
        className={[
          "inline-flex w-fit items-center gap-[var(--space-2)] rounded-pill bg-surface px-[var(--space-4)] py-[var(--space-2)] text-[length:var(--text-xs)] font-semibold text-text max-md:min-h-tap-min",
          uploading ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:bg-bg",
          FOCUS_RING_INSET,
        ].join(" ")}
      >
        <Icon name="paperclip" size={14} />
        {uploading ? "Subiendo…" : "Agregar comprobante"}
        <input
          type="file"
          accept="application/pdf,image/*"
          className="sr-only"
          disabled={uploading}
          onChange={handleFileChange}
        />
      </label>
      {error ? <p className="m-0 text-[length:var(--text-xs)] text-alert">{error}</p> : null}
    </div>
  );
}
