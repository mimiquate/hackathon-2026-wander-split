import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { ForgotForm } from "./ForgotForm";

export const metadata: Metadata = { title: "Recuperar contraseña — wonderSplit" };

export default function ForgotPage() {
  return (
    <AuthShell
      eyebrow="Recuperar acceso"
      title="¿Olvidaste tu contraseña?"
      description="Ingresá tu correo y te mandamos un enlace para elegir una nueva."
    >
      <ForgotForm />
    </AuthShell>
  );
}
