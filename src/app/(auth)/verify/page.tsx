import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { getResendCooldownSeconds } from "@/lib/auth/verification";
import { VerifyForm } from "./VerifyForm";

export const metadata: Metadata = { title: "Revisá tu correo — wonderSplit" };

export default async function VerifyPage({ searchParams }: PageProps<"/verify">) {
  const params = await searchParams;
  const email = typeof params.email === "string" ? params.email : undefined;

  if (!email) {
    redirect("/signup");
  }

  const initialCooldownSeconds = await getResendCooldownSeconds({ email });

  return (
    <AuthShell
      eyebrow="Paso 2 de 2"
      title="Revisá tu correo"
      description={
        <>
          Te mandamos un código de 6 dígitos a{" "}
          <span className="font-mono text-text">{email}</span>.
        </>
      }
    >
      <VerifyForm email={email} initialCooldownSeconds={initialCooldownSeconds} />
    </AuthShell>
  );
}
