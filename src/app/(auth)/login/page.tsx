import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Entrar — wonderSplit" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const justCreated = params.created === "1";

  return (
    <AuthShell
      eyebrow="De vuelta"
      title="Entrá a wonderSplit"
      description="Seguí armando la ruta donde la dejaste."
    >
      <LoginForm justCreated={justCreated} />
    </AuthShell>
  );
}
