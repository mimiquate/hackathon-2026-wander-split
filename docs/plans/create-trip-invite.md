# wonderSplit Create Trip & Invite the Group

## Context

[Issue #7](https://github.com/mimiquate/wonder_split/issues/7) is the first real product feature after [auth](./auth.md): once logged in, a user creates their first trip, and invites the rest of the group to join it. Nothing else in the product exists without a trip and a crew attached to it — every later ticket (route, cities, expenses, settle-up) hangs off the `Trip` and its members (see [docs/roadmap.md](../roadmap.md)). The design ("Armar el viaje" Claude Design project, `Armar el viaje.dc.html`) covers this with four screens/states read directly off the canvas: **Nuevo viaje — formulario** (trip name, dates, currency), **Invitar — panel** and **Invitar — el grupo** (invite link, add-by-email, crew grid with pending/joined badges), **Entrar desde la invitación** (the join screen: who invited you, name + color pick), and the **Compartir el viaje** dialog (reopening the invite panel from inside an existing trip).

Auth's plan explicitly deferred the design's invite/join screen here, since there was no trip/membership model yet to attach it to (see [auth.md](./auth.md) non-goals) — this ticket is where that gets built.

## Scope

- Create a trip: name, date range, currency (a fixed `USD` / `EUR` list, defaulting to `USD` — trimmed down from the design's `Select`, which also shows `ARS`; see Non-goals) picked at creation time, since #14/#15's per-person amounts need a trip currency to exist from the start.
- Roles: the creator is stored as `admin`, everyone who joins after is `participant`. No admin-only UI gating yet (see Non-goals) — just the data.
- Generate a shareable invite link for a trip (a single copyable URL, `wsplit.app/i/<token>`-shaped, works pasted into WhatsApp or anywhere else) — the design's own copy says "cualquiera con el link puede entrar," so it's intentionally not restricted to a specific invitee.
- Invite panel: copy the link, add someone by email to **reserve a pending crew slot** (not send anything — see Non-goals), and a crew grid showing joined members (name, avatar color) alongside pending reservations (pending badge, shown by their email since there's no name yet).
- Join flow: opening an invite link takes a logged-in user to a screen naming who invited them and which trip, showing who's already in, letting them type how they want to be called and pick their color for this trip, then join as a `participant`. If a joiner's account email matches a pending reservation, that reservation resolves into their joined row instead of creating a second one.
- The "Compartir" dialog inside an existing trip's header, which reopens the same invite link/add-by-email UI as the initial invite panel, for pulling the invite back up later.

## Non-goals

- **`ARS` as a trip currency.** The design's `Select` lists `USD`/`EUR`/`ARS`; this ticket ships with just `USD`/`EUR` for now. Adding a third option later is a one-line change to the fixed list, not a rework — not worth carrying the extra option before it's needed.
- **A separate numeric "join by code."** The issue body says "join by a code," but the design only shows a single copyable link — no distinct code-entry screen. Ship link-only joining; a person without the link can't join. (Known gap already flagged on the issue.)
- **Real WhatsApp integration.** "Shareable via WhatsApp" means the link works when pasted into a WhatsApp chat, not a WhatsApp Business API send from the app.
- **Sending an actual invite email from "Sumar."** The invite panel's own copy says "Mandales el link" (you send the link) — the admin is still expected to share it themselves. "Sumar" just reserves a named-by-email pending slot in the crew grid so the admin can track who's expected; the app sends nothing. Real email delivery here would pull Resend/bounce-handling scope into a ticket that's really about the trip+crew data model.
- **A guest/no-account join path.** The join screen has no email/password fields, but that's because it assumes the visitor is already authenticated — the issue text ("once logged in, create...or join") and the existing Auth.js foundation both point the same way. A logged-out visitor goes through the existing login/signup flow first, then lands on the join screen. No new lightweight/accountless identity system.
- **"Ver como invitado" preview button** in the Compartir dialog (previewing the join screen without joining). Not in the issue's checklist; cut as a demo-only affordance.
- **Admin-only permission enforcement.** The role is stored and shown nowhere special yet — there's no admin-gated action to protect, since route/city/expense management (where that distinction would matter) doesn't exist yet. Revisit once one of those tickets needs it.
- **Editing a trip after creation** (rename, change dates, change currency), **removing a member**, or **deleting a trip.** Not in the design, not in this ticket.
- **The home dashboard listing a user's trips** (#22) — separate ticket, being built in parallel. This plan needs *some* place for "create your first trip" to live before that exists (see Phase 2's "Things to consider").
- **Per-city/per-route data** (#8 onward) — this ticket stops at "a trip exists with a crew," nothing about the itinerary inside it. The join screen's background map and "route signature" text both fall back to just the trip name until #8 gives a trip any stops.

## Implementation Strategy

The data model — trips, memberships, invite reservations — has to exist before any screen works, so that's Phase 1, same shape as how the auth plan started with its data layer. From there, screens land in the order a real user hits them: create the trip first, then the invite panel you land on right after creating it, then the join flow the invited people actually use, and finally the "Compartir" dialog, which just repackages Phase 3's invite UI as a reusable dialog rather than being new functionality.

1. **Phase 1 — Trip, membership & invite data model:** Prisma schema for `Trip`, `TripMembership` (role, per-trip color, per-trip display name), and `Invite` (token + optional reserved email), plus the server-side functions everything else calls into. No UI.
2. **Phase 2 — Create trip screen:** the "Nuevo viaje" form wired to Phase 1, landing the creator straight on their new trip's invite panel.
3. **Phase 3 — Invite panel & crew grid:** the copyable link, add-by-email (reserves a pending slot, sends nothing), and the joined/pending crew grid.
4. **Phase 4 — Join via invite link:** the `/i/[token]` flow, including routing a logged-out visitor through auth first, then the "Entrar desde la invitación" screen, with pending-reservation matching by email.
5. **Phase 5 — Compartir dialog:** the in-trip header button that reopens Phase 3's invite UI as a dialog over the trip.

## Constraints & Things to Consider

- Reuse the Ruta Terracota tokens/components already ported for auth and the landing page (`var(--token)`, terracota focus ring, ≥44px tap targets, `prefers-reduced-motion` collapsing entrance animation) — nothing new to decide here, just keep following it.
- Copy is Rioplatense Spanish (vos), taken verbatim from the design.
- An invite link identifies a *trip*, not a specific invitee — anyone who has the link can join. An add-by-email reservation is just a tracking convenience, not an access-control mechanism; someone else who gets the link forwarded can still use it and join unreserved.
- A trip's per-person color and display name (picked at join time) are independent of the account-level display name/avatar color auth's first-run step captures — don't collapse them into one field, and don't prefill the join screen's name field from the account (the design shows it as a blank input with a placeholder example, not a default).
- Invite tokens don't expire the way auth's verification codes do — a trip invite should stay valid until the trip itself is gone (there's no "expire the invite" story in the design).

## Phases

### Phase 1 — Trip, membership & invite data model

**What this phase delivers**

Prisma models for `Trip` (name, start/end date, currency), `TripMembership` (user, trip, role, per-trip color, per-trip display name), and `Invite` (trip, token, optional reserved email, resolved-into-membership once claimed), plus the server-side functions (create trip, generate invite link, reserve an email slot, look up invite by token, join trip) everything downstream calls into. No screens yet.

**Acceptance criteria**

- Creating a trip persists it with a creator `TripMembership` of role `admin`.
- A generated invite token resolves back to its trip; joining via a token creates a `participant` membership.
- Joining with an account email that matches an existing reserved-but-unclaimed `Invite` for that trip resolves that reservation into the new membership instead of leaving a stale pending row; joining with no matching reservation just creates a fresh membership.
- Re-opening the same token as an account that's already a member doesn't create a duplicate membership.

**Things to consider**

- Model `Invite` as its own table (token + optional reserved email), not fields on `Trip`, since a trip has one shareable link plus any number of separate email reservations.

**Tests**

- Integration tests against the data functions directly (no UI): creating a trip sets the creator as admin; joining via a valid token adds a participant membership; joining twice with the same token/user doesn't duplicate the membership; joining with an email that matches a reservation resolves it instead of creating a second row.

### Phase 2 — Create trip screen

**What this phase delivers**

The "Nuevo viaje" form: trip name, start/end date, and a currency picker (USD/EUR, defaulting to USD), wired to Phase 1. Submitting creates the trip and lands the creator on that trip's invite panel (Phase 3).

**Acceptance criteria**

- A logged-in user can create a trip with a name, date range, and currency; the currency shown later for amounts (once #14/#15 exist) is whatever was picked here.
- Missing name or an end date before the start date is rejected with an inline error, not a server error page.
- After creating, the user lands directly on the new trip's invite panel — not a dead end.

**Things to consider**

- Since the home dashboard (#22) doesn't exist yet, this screen needs its own directly-reachable route (e.g. a "crear viaje" entry point off wherever auth currently lands post-login) rather than assuming a dashboard links to it. Wire it into #22's dashboard once that ticket lands.

**Tests**

- Vitest + RTL: submitting valid values calls the create-trip function with the right payload; an end date before the start date shows the inline error and doesn't submit.

### Phase 3 — Invite panel & crew grid

**What this phase delivers**

The invite panel a trip creator lands on right after creating a trip: the copyable invite link, an "add by email" input that reserves a pending crew slot, and a crew grid showing joined members (avatar, name, their per-trip color) alongside pending reservations (pending badge, labeled by the reserved email).

**Acceptance criteria**

- Copying the link puts a working `wsplit.app/i/<token>`-shaped URL on the clipboard.
- Adding an email adds a "pending" row to the crew grid immediately (labeled with that email), without a page reload, and without anything being sent.
- Adding the same email twice doesn't create two pending rows.
- The creator always appears in the crew grid as joined, marked as the trip's admin.

**Tests**

- Vitest + RTL: adding an email shows the optimistic pending row labeled by that email; the crew grid renders joined vs. pending rows with the right badge; adding a duplicate email is a no-op on the grid.
- Integration test: reserving an email creates exactly one `Invite` row per trip+email pair.

### Phase 4 — Join via invite link

**What this phase delivers**

The `/i/[token]` flow: a logged-out visitor gets routed through login/signup first (returning to the invite afterward, same pattern as auth's post-login redirect), then lands on "Entrar desde la invitación" — who invited them, which trip (falling back to the trip name if #8 hasn't given it any stops yet), who's already in, a blank name field, and a color picker for this trip — confirming joins them as a `participant`, resolving any pending reservation matching their account's email.

**Acceptance criteria**

- A logged-out visitor opening a valid invite link is sent to login/signup and, after completing it, returns straight to the same invite screen rather than a generic post-login page.
- A logged-in visitor sees the screen immediately: who invited them, the trip, an avatar group + count of who's already in, a blank name input, and a color swatch picker.
- Confirming joins the trip as `participant`, using the name/color just entered, and lands them in the trip.
- If the joining account's email matches an existing pending reservation for that trip, the pending row becomes their joined row instead of a separate one.
- Someone who's already a member of the trip and opens the link again is sent straight into the trip, skipping the join screen.
- An invalid/unknown token shows an error state instead of a broken join screen.

**Tests**

- Integration tests: a valid token joins the user and, when the account email matches a reservation, resolves it instead of duplicating; an already-a-member visit skips straight to the trip; an invalid token returns the error state.
- Playwright test: a logged-out visitor following an invite link is routed through login and lands back on the same join screen afterward.

### Phase 5 — Compartir dialog

**What this phase delivers**

The "Compartir" button in a trip's header, opening a dialog with the same invite link + add-by-email UI as Phase 3, so the invite can be pulled back up any time after trip creation, not just at creation time.

**Acceptance criteria**

- Any member of the trip (not just the admin — no enforcement built here, see Non-goals) can open "Compartir" and see/copy the same invite link and add-by-email input as Phase 3.
- Adding an email from this dialog behaves identically to Phase 3 (reserves a pending slot, appears in the crew grid).

**Tests**

- Vitest + RTL: opening the dialog renders the same link and crew grid as the invite panel; adding an email from the dialog calls the same function Phase 3 uses.

## How to QA

- Log in, create a trip with a name, a date range, and a currency, and confirm you land on its invite panel as the admin.
- Reserve a teammate's email from the invite panel and confirm a pending row (labeled by that email) shows up immediately, with nothing actually sent.
- Copy the invite link and open it in a logged-out browser/incognito window — confirm you're routed through signup/login and land back on the join screen for that trip afterward.
- Sign up/log in using the same email you reserved earlier, pick a name and color, and confirm: you land in the trip as a participant, and the earlier pending row on the admin's crew grid flips to your joined row instead of showing twice.
- Open the same invite link as a different, unreserved account and confirm it still lets you join, landing as a fresh (unreserved) participant.
- Re-open the same invite link as someone already in the trip and confirm it drops you straight into the trip, no join screen.
- From inside the trip, click "Compartir" in the header and confirm it shows the same link/crew grid as the original invite panel.
- Try an invite link with a garbage token and confirm you get an error state, not a crash.

## Rollout & Cleanup

Not applicable — pre-launch, no existing trips/users to migrate.
