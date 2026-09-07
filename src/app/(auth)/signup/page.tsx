import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { SignupForm } from "./SignupForm";

export const metadata: Metadata = { title: "Creá tu cuenta — wonderSplit" };

export default async function SignupPage({ searchParams }: PageProps<"/signup">) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : "";

  return (
    <AuthShell
      eyebrow="Empezar"
      title="Creá tu cuenta"
      description="Gratis, sin tarjeta y sin una sola planilla."
    >
      <SignupForm next={next} />
    </AuthShell>
  );
}
