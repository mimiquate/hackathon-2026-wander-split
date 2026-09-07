import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Entrar — wonderSplit" };

export default function LoginPage() {
  return (
    <AuthShell
      eyebrow="De vuelta"
      title="Entrá a wonderSplit"
      description="Seguí armando la ruta donde la dejaste."
    >
      <LoginForm />
    </AuthShell>
  );
}
