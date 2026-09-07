import { cookies } from "next/headers";
import { SESSION_MAX_AGE_SECONDS } from "@/lib/auth/session";

// Vercel production is always https, local dev and tests are always http, so
// NODE_ENV is a safe stand-in for the https-derived `useSecureCookies` check
// @auth/core does internally for this same cookie.
export const SESSION_COOKIE_NAME =
  process.env.NODE_ENV === "production" ? "__Secure-authjs.session-token" : "authjs.session-token";

export async function setSessionCookie(sessionToken: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}
