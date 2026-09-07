import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { SignupForm } from "./SignupForm";

export const metadata: Metadata = { title: "Creá tu cuenta — wonderSplit" };

export default function SignupPage() {
  return (
    <AuthShell
      eyebrow="Empezar"
      title="Creá tu cuenta"
      description="Gratis, sin tarjeta y sin una sola planilla."
    >
      <SignupForm />
    </AuthShell>
  );
}
