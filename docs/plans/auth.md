# wonderSplit Auth

## Context

[Issue #2](https://github.com/mimiquate/wonder_split/issues/2) asks for authentication on the web app: choose an approach, sign up / log in / log out, protect authenticated routes, session/token handling. A high-fidelity design already exists for this — a Claude Design project with a dedicated `AuthScreen.dc.html` that specs every auth state (login, signup, email verification, forgot/reset password, first-run profile setup, a session-expired reauth overlay, and an invite-join screen), sharing the wonderSplit design system ("Ruta Terracota") already used for the landing page. Copy is final, Rioplatense Spanish throughout, same as the landing page.

Unlike the landing page, auth runs the product's **dark** theme by default (`data-theme="dark"`) — light is marketing-only.

This plan assumes the Next.js app scaffold and Ruta Terracota tokens/components from [issue #1](https://github.com/mimiquate/wonder_split/issues/1)'s landing page (see `docs/plans/landing-page.md` Phase 1) already exist. If auth ships first, do that scaffold work first, using the same approach.

## Scope

- The auth approach decision — see [ADR 0003](../adr/0003-authjs-credentials-provider.md), [ADR 0004](../adr/0004-postgres-prisma-persistence.md), and [ADR 0005](../adr/0005-database-sessions.md).
- Email/password signup with a 6-digit email verification code, and email/password login.
- Forgot password → reset password, which invalidates the user's other active sessions.
- First-run profile setup (display name + avatar color, both skippable) shown once after a user's first successful login.
- Session/token handling: a persisted database session (~30 days, matching the design's copy) and sign-out.
- Protecting authenticated routes: unauthenticated visitors get redirected to `/login`; a session that expires mid-use shows the design's in-place "locked" reauth overlay instead of a hard redirect, and returns the user to where they were after they log back in.
- Real rate limiting on login attempts, surfaced through the design's rate-limited alert state.
- Minimal real `/terms` and `/privacy` pages, so the signup consent checkbox links somewhere real.
- A minimal authenticated placeholder route (header + account menu) just to prove protected routing, the menu, and logout actually work — not a real product page.

## Non-goals

- **Google OAuth.** The design shows a "Seguir con Google" button on login/signup, but it's deliberately left out of this ticket — deferred until the project is more advanced. Auth.js's provider model means it's a config addition later, not a rework. Every screen ships email/password only for now: no Google button, no OAuth-skips-verification path, no Google/password account-linking question to answer yet.
- The "Ruta / Gastos / Saldar / Vouchers" nav links and the mobile TabBar the design shows in the authenticated shell — those pages don't exist yet (separate, not-yet-created tickets). The header ships without them until they do.
- The design's "invite" screen (join a trip via invite link) — there's no trip/membership model yet to attach it to. Tracked as a follow-up once trips exist, not built here.
- "Dispositivos y sesiones" and "Mi perfil" menu items — present in the design's account menu but inert for now. Only first-run capture and logout are actually wired.
- Any password rule beyond the design's stated minimum (8 characters) — no invented complexity requirements.
- i18n — Spanish only, copy taken verbatim from the design.

## Implementation Strategy

The backend/session plumbing (Auth.js + Postgres, per the ADRs) has to exist before any screen can really work, so that's the first phase, even though it ships nothing visible on its own. From there, screens land in the order a real user hits them: login/signup first, then the signup follow-ups (email verification, then forgot/reset), then the one-time first-run step, and finally route protection and the session-expiry overlay, since that phase depends on there being an authenticated area to protect.

Two states the design doesn't fully spell out need a call made in-phase rather than invented up front: what "forgot password" shows after you submit (Phase 4), and what an invalid/expired reset link shows (Phase 4). Both get a small addition in the same voice as the rest of the copy, flagged in that phase's "Things to consider".

1. **Phase 1 — Data layer & Auth.js wiring:** Vercel Postgres schema (users, verification codes, reset tokens) via Prisma, Auth.js configured with the Credentials provider and database sessions. No UI yet.
2. **Phase 2 — Login & signup screens:** the Input/Checkbox primitives, and the login/signup screens wired to real sign-in/sign-up, including the busy, error, and rate-limited states, plus the `/terms` and `/privacy` placeholder pages.
3. **Phase 3 — Email verification:** the 6-digit code screen, real code generation/delivery/expiry/resend.
4. **Phase 4 — Forgot & reset password:** the two screens, real reset-token delivery, other-session invalidation on save.
5. **Phase 5 — First-run profile setup:** the one-time display-name + avatar-color step.
6. **Phase 6 — Route protection & session expiry:** middleware redirect, the minimal authenticated shell, and the in-place "locked" reauth overlay.

## Constraints & Things to Consider

- Reuse the Ruta Terracota tokens/components already ported for the landing page — always `var(--token)`, never a hardcoded hex/px where a token covers it.
- Auth screens default to dark (`data-theme="dark"`); don't let light-mode values leak in the way the landing page deliberately keeps light-only.
- Copy is Rioplatense Spanish (vos), taken verbatim from the design, including the exact error/hint/rate-limit strings — don't paraphrase or translate. Exception: the rate-limit banner drops the design's "...o entrá con Google" clause, since that option doesn't exist in this ticket — it reads as "Demasiados intentos. Probá de nuevo en 5 minutos."
- Passwords are hashed with argon2id; enforce only the 8-character minimum the design states.
- Deployment is Vercel + Vercel Postgres; anything that queries the database (including the route-protection middleware) runs in the Node.js runtime, not edge — see [ADR 0005](../adr/0005-database-sessions.md).
- Verification codes and reset tokens are single-use and time-limited server-side, not just visually disabled after use. Verification-code resend has a real 60-second cooldown (the design's frozen "0:42" is just a mockup snapshot, not a spec'd duration).
- Forgot-password responses must not reveal whether an email is registered (same response either way).
- Session lifetime is ~30 days, matching the "cerramos la sesión... después de 30 días" copy — the database session's expiry has to match that number, not an arbitrary one.
- Login rate limiting: 5 failed attempts per account within a rolling 5-minute window, tracked in Postgres (not per-IP, and not in-memory — Vercel functions aren't a single long-lived process). The UI shows the real remaining-attempts count, not a hardcoded "3".
- Emails (verification codes, reset links) send through Resend, behind a small `EmailSender` interface with a console/capture implementation swapped in for dev and tests. Starts on Resend's shared onboarding domain — no custom domain to verify yet.
- PR preview deployments share one dev database — don't build per-branch database isolation.
- Reuse the existing terracota focus-ring / hover / press button and input behavior — never a default blue outline, nothing under 44px tappable.
- `prefers-reduced-motion` collapses the `ws-rise` entrance animation to ~0ms, same rule as the landing page.

## Phases

### Phase 1 — Data layer & Auth.js wiring

**What this phase delivers**

Vercel Postgres with a Prisma schema for users, verification codes, password-reset tokens, and login-attempt tracking, plus Auth.js configured with the Credentials provider and database sessions (`@auth/prisma-adapter`). No screens yet — this is the foundation everything else calls into.

**Acceptance criteria**

- A seeded test user can authenticate through Auth.js's Credentials provider directly (no UI) and get back a valid database session.
- A session, once issued, is readable server-side, carries a ~30-day expiry, and can be deleted (revoked) directly.

**Things to consider**

- Model verification codes and reset tokens as their own tables (not fields on `users`) so multiple outstanding codes/tokens per user expire independently.
- Track login attempts in their own table too, so the rate-limit check is a query against real rows, not an in-memory counter that resets on every serverless cold start.

**Tests**

- Integration tests hitting Auth.js's Credentials callback directly: valid credentials succeed, wrong password fails, unknown email fails, without going through any UI.

### Phase 2 — Login & signup screens

**What this phase delivers**

The Input and Checkbox primitives (joining Button/Icon/Avatar already ported for the landing page), the `/login` and `/signup` screens wired to Phase 1, and minimal real `/terms` and `/privacy` pages for the signup consent checkbox to link to.

**Acceptance criteria**

- User can create an account with email + password + accepted terms checkbox, and log in with email + password.
- Wrong password on login shows "Contraseña incorrecta. Te quedan N intentos." with the real remaining-attempts count; an invalid-looking email on signup shows "Ese correo no parece válido."; a too-short password on signup shows "Usá al menos 8 caracteres."
- 5 failed logins for one account within the rate-limit window shows "Demasiados intentos. Probá de nuevo en 5 minutos." and disables the form; the 6th attempt is rejected even with the correct password until the window clears.
- While a submission is in flight, the button is disabled and its label swaps ("Entrando…" / "Creando tu cuenta…").
- "¿Primera vez? Creá tu cuenta" and "¿Ya tenés cuenta? Entrá" navigate between the two screens.
- The consent checkbox's "términos" and "política de privacidad" links open real (if minimal) pages.

**Tests**

- Vitest + RTL: each field's error state renders the exact design copy; the button shows the busy label and is disabled while submitting.
- Integration test: 5 failed logins within the window trip the rate-limit response; the 6th attempt (even with the correct password) is rejected until the window clears.

### Phase 3 — Email verification

**What this phase delivers**

The `/verify` screen: a real 6-digit code (generated at signup, emailed via Resend, time-limited), an editable 6-box input with auto-advance, a 60-second resend cooldown, and the wrong-code error.

**Acceptance criteria**

- After signup, the user lands on `/verify` and receives an email with a 6-digit code.
- Entering the correct code verifies the account and continues to first-run.
- An incorrect code shows "Ese código no es. Fijate que no haya vencido." without clearing the whole form.
- A visible countdown gates resending for 60 seconds; once it elapses, the user can request a new code, which invalidates the previous one.
- "Cambiar el correo" returns to `/signup` to correct a mistyped email.

**Things to consider**

- An expired (not just wrong) code should read as the same error copy — the design doesn't distinguish "wrong" from "expired" and there's no reason for the user-facing copy to.

**Tests**

- Integration tests: correct code verifies and consumes the code (can't be reused); wrong code fails without consuming it; requesting a resend invalidates the prior code.

### Phase 4 — Forgot & reset password

**What this phase delivers**

The `/forgot` and `/reset` screens: submitting an email sends a reset link (real token, time-limited, emailed via Resend); the reset screen only renders once that token is validated server-side, and saving a new password signs the user's other sessions out.

**Acceptance criteria**

- Submitting `/forgot` always shows the same confirmation regardless of whether the email is registered (no enumeration), reusing the product's voice — the design doesn't spec a distinct post-submit screen, so this is invented here.
- A valid reset link lands on `/reset` (its "Enlace verificado" eyebrow implies the token was already checked before the screen renders).
- An invalid or expired link shows an error state instead of the reset form — also not spec'd by the design, added here in the same voice.
- Mismatched password/confirmation shows "No coinciden. Escribila de nuevo."; saving succeeds, logs the user in, and deletes the user's other active sessions per the "cerramos las otras sesiones abiertas" copy.

**Tests**

- Integration tests: forgot-password gives an identical response for a registered vs. unregistered email; an expired/used reset token is rejected; a successful reset deletes other outstanding sessions for that user.

### Phase 5 — First-run profile setup

**What this phase delivers**

The one-time `/firstrun`-style step after a user's first successful login: optional display name and avatar color, both skippable, shown exactly once.

**Acceptance criteria**

- "Guardar" persists the name/color; "Después" dismisses it just as permanently — either way, the user never sees this step again.
- Skipping keeps the design system's default (terracota) traveller color and the account's existing name.

**Things to consider**

- Needs a persisted flag on the user record (not a client-side/local check) so it doesn't reappear on another device or after clearing storage.

**Tests**

- Integration test: a fresh user is routed through first-run exactly once, on any device, regardless of "Guardar" vs. "Después".

### Phase 6 — Route protection & session expiry

**What this phase delivers**

Node.js-runtime middleware that redirects unauthenticated visitors to `/login`, a minimal authenticated placeholder page with the header/account-menu shell from the design, and the "locked" in-place reauth overlay for a session that expires mid-use.

**Acceptance criteria**

- Visiting any authenticated route while logged out redirects to `/login`.
- The header shows the wordmark and an account menu (avatar) with "Mi perfil" and "Dispositivos y sesiones" present but inert, "Cambiar contraseña" linking into the reset flow, and "Cerrar sesión" actually signing out (deleting the session row).
- When a session expires while the user is on an authenticated page, the page blurs and the "locked" overlay appears in place (not a redirect), showing the path they were on; logging back in returns them to that exact path.
- Logged-out visitors hitting a since-expired link land on `/login`, not the locked overlay (that's only for a session dying mid-use).

**Things to consider**

- The nav items in the design's authenticated header (Ruta/Gastos/Saldar/Vouchers) are out of scope (see Non-goals) — ship the header without them rather than linking to pages that don't exist.

**Tests**

- Playwright test: an authenticated route redirects to `/login` when logged out; forcing a session to expire mid-session shows the locked overlay in place and returns the user to the same path after logging back in; "Cerrar sesión" ends the session and subsequent authenticated requests are rejected.

## How to QA

- Sign up with email/password, receive the verification email, enter the code, land on first-run, skip it, and confirm you're in the app.
- Sign up again with a fresh email, this time save a display name/color on first-run, and confirm it sticks.
- Log out and log back in with that account.
- Get a password wrong 5 times in a row and confirm the rate-limit banner appears and blocks further attempts until the window clears.
- Use "Olvidé mi contraseña", follow the reset link, set a new password, and confirm any other logged-in session got kicked out.
- While logged in, wait out (or force-expire) the session and confirm the locked overlay appears in place and returns you to the same page after re-entering.
- Log out and try to hit an authenticated URL directly — confirm it redirects to `/login` instead of showing the locked overlay.
- Click the terms/privacy links on the signup screen and confirm they load a real page.
- Tab through every screen with the keyboard only — every focusable control shows the terracota focus ring, never blue.
- Turn on "reduce motion" at the OS level and reload `/login` — no visible entrance animation.

## Rollout & Cleanup

Not applicable — there's no existing user base yet (pre-launch) and no prior auth path to migrate off of.
