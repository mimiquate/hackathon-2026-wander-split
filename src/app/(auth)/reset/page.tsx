import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/core/Button";
import { AuthShell } from "@/components/auth/AuthShell";
import { checkResetToken } from "@/lib/auth/reset";
import { ResetForm } from "./ResetForm";

export const metadata: Metadata = { title: "Nueva contraseña — wonderSplit" };

export default async function ResetPage({ searchParams }: PageProps<"/reset">) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : undefined;
  const check = token ? await checkResetToken({ token }) : { valid: false as const };

  if (!check.valid) {
    return (
      <AuthShell
        eyebrow="Enlace inválido"
        title="Este enlace ya no sirve"
        description="Pedí uno nuevo para poder cambiar tu contraseña."
      >
        <Link href="/forgot">
          <Button size="lg" fullWidth>
            Pedir un enlace nuevo
          </Button>
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Enlace verificado"
      title="Elegí tu nueva contraseña"
      description="Al guardar, cerramos las otras sesiones abiertas."
    >
      <ResetForm token={token!} />
    </AuthShell>
  );
}
