"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/core/Button";

export function EditarRutaButton({ tripId }: { tripId: string }) {
  const router = useRouter();

  return (
    <Button variant="secondary" fullWidth onClick={() => router.push(`/trips/${tripId}`)}>
      Editar ruta
    </Button>
  );
}
