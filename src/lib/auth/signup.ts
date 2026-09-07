import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

export interface SignupInput {
  email: string;
  password: string;
  termsAccepted: boolean;
}

export type SignupResult =
  | { ok: true; userId: string }
  | {
      ok: false;
      fieldErrors?: { email?: string; password?: string };
      formError?: string;
    };

export async function signupCore({
  email,
  password,
  termsAccepted,
}: SignupInput): Promise<SignupResult> {
  const normalizedEmail = email.trim().toLowerCase();

  if (!EMAIL_PATTERN.test(normalizedEmail)) {
    return { ok: false, fieldErrors: { email: "Ese correo no parece válido." } };
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return { ok: false, fieldErrors: { password: "Usá al menos 8 caracteres." } };
  }

  if (!termsAccepted) {
    return { ok: false, formError: "Tenés que aceptar los términos para continuar." };
  }

  try {
    const user = await prisma.user.create({
      data: { email: normalizedEmail, passwordHash: await hashPassword(password) },
    });
    return { ok: true, userId: user.id };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return {
        ok: false,
        fieldErrors: { email: "Ese correo ya está registrado. Entrá en vez de crear una cuenta nueva." },
      };
    }
    throw error;
  }
}
