import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { getCurrentUser } from "@/lib/auth/session";
import { FirstRunForm } from "./FirstRunForm";

export const metadata: Metadata = { title: "Tu perfil — wonderSplit" };

export default async function FirstRunPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.firstRunCompletedAt) redirect("/home");

  return (
    <AuthShell
      eyebrow="Último paso"
      title="Así te vamos a mostrar en el viaje"
      description="Podés cambiar esto después. Si preferís, seguí de largo."
    >
      <FirstRunForm currentName={user.name} />
    </AuthShell>
  );
}
