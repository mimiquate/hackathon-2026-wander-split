# wonderSplit Create Trip & Invite the Group

## Context

[Issue #7](https://github.com/mimiquate/wonder_split/issues/7) is the first real product feature after [auth](./auth.md): once logged in, a user creates their first trip, and invites the rest of the group to join it. Nothing else in the product exists without a trip and a crew attached to it — every later ticket (route, cities, expenses, settle-up) hangs off the `Trip` and its members (see [docs/roadmap.md](../roadmap.md)). The design ("Armar el viaje" Claude Design project, `Armar el viaje.dc.html`) covers this with five screens/states read directly off the canvas: **Nuevo viaje — formulario** (trip name and start date only — no end date, see Scope), **Invitar — panel** and **Invitar — el grupo** (invite link, add-by-email, crew grid with pending/joined badges), **Entrar desde la invitación** (the join screen: who invited you, name + color pick), the **Compartir el viaje** dialog (reopening the invite panel from inside an existing trip), and the **"Datos del viaje"** dialog (renaming the trip and editing its start date after creation, opened from the in-trip header's editable title/meta row).

Auth's plan explicitly deferred the design's invite/join screen here, since there was no trip/membership model yet to attach it to (see [auth.md](./auth.md) non-goals) — this ticket is where that gets built.

This plan also folds in a real answer to a gap the original design review flagged: the design used to show both a start and end date at trip creation, with no way to reconcile a stored end date against [#8](./build-the-route.md)'s per-stop nights. Grilled with Florencia (2026-09-05/06) and resolved: no end date is collected at creation at all — it's fully derived (start date + Σ stop nights) once #8 gives the trip stops. The start date itself becomes editable after creation (previously assumed immutable), gated on the trip having zero bookings anywhere.

## Scope

- Create a trip: name, **start date only** (no end date field — the design's creation form used to show a "Vuelven" field too, but that's cut; end date is fully derived from the start date plus the sum of every stop's nights once [#8](./build-the-route.md) gives the trip stops, and stays undefined/"TBD" for a trip with zero stops), currency (a fixed `USD` / `EUR` list, defaulting to `USD` — trimmed down from the design's `Select`, which also shows `ARS`; see Non-goals) picked at creation time, since #14/#15's per-person amounts need a trip currency to exist from the start.
- Roles: the creator is stored as `admin`, everyone who joins after is `participant`. No admin-only UI gating yet (see Non-goals) — just the data.
- Editing a trip's name and start date after creation, via the "Datos del viaje" dialog (opened from the in-trip header's editable title/meta row — the design reuses the same dialog shape for creation and later editing). Any trip member can edit (no admin-only gating, consistent with the rest of the app), **as long as the trip has zero bookings ([#12](https://github.com/mimiquate/wonder_split/issues/12)/[#13](https://github.com/mimiquate/wonder_split/issues/13)) anywhere on any stop** — once a single booking exists anywhere in the trip, the start date locks permanently (renaming stays editable always; only the date locks). Editing the start date shifts every stop's already-computed dates by the delta between the old and new value. No confirmation dialog, matching the app's universal no-confirm pattern — the booking-gate itself removes the risk a confirm step would otherwise guard against.
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
- **Changing a trip's currency after creation.** The "Datos del viaje" edit dialog only has name and start-date fields, no currency — currency stays fixed at whatever was picked at creation.
- **Removing a member.** The design's new "Grupo" screen (the in-trip Ruta/Grupo/Gastos/Balance tab bar) has a remove-member action, but it's bigger scope than this ticket owns (blocking removal if that person has a booking or expense, recomputing the balance view) — tracked separately as [issue #38](https://github.com/mimiquate/wonder_split/issues/38).
- **Deleting a trip.** Not in the design, not in this ticket.
- **A more granular start-date lock.** Today's rule is a blunt trip-wide gate — any booking anywhere on the trip locks editing, not just a booking on a stop the date shift would actually affect. A version that only locks once a booking exists on an *affected* stop is a noted future refinement, not built now.
- **A visual "locked" state for the date field.** The design's "Datos del viaje" dialog doesn't depict what the start-date input looks like once bookings exist and editing is blocked — this ticket implements the gate regardless (disable the field, show explanatory copy), just without a pixel-perfect spec to match.
- **An optional/non-binding "target end date."** Floated as a future-optional trip setting during grilling, not built now — a trip has no end-date concept at all until #8 gives it stops.
- **The home dashboard listing a user's trips** (#22) — separate ticket, being built in parallel. This plan needs *some* place for "create your first trip" to live before that exists (see Phase 2's "Things to consider").
- **Per-city/per-route data** (#8 onward) — this ticket stops at "a trip exists with a crew," nothing about the itinerary inside it. The join screen's background map and "route signature" text both fall back to just the trip name until #8 gives a trip any stops.

## Implementation Strategy

The data model — trips, memberships, invite reservations — has to exist before any screen works, so that's Phase 1, same shape as how the auth plan started with its data layer. From there, screens land in the order a real user hits them: create the trip first, then the invite panel you land on right after creating it, then the join flow the invited people actually use, and finally the "Compartir" dialog, which just repackages Phase 3's invite UI as a reusable dialog rather than being new functionality.

1. **Phase 1 — Trip, membership & invite data model:** Prisma schema for `Trip`, `TripMembership` (role, per-trip color, per-trip display name), and `Invite` (token + optional reserved email), plus the server-side functions everything else calls into. No UI.
2. **Phase 2 — Create trip screen:** the "Nuevo viaje" form wired to Phase 1, landing the creator straight on their new trip's invite panel.
3. **Phase 3 — Invite panel & crew grid:** the copyable link, add-by-email (reserves a pending slot, sends nothing), and the joined/pending crew grid.
4. **Phase 4 — Join via invite link:** the `/i/[token]` flow, including routing a logged-out visitor through auth first, then the "Entrar desde la invitación" screen, with pending-reservation matching by email.
5. **Phase 5 — Compartir dialog:** the in-trip header button that reopens Phase 3's invite UI as a dialog over the trip.
6. **Phase 6 — Edit trip name & start date:** the "Datos del viaje" dialog, reused post-creation, gated on the trip having zero bookings before the start date can change.

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

The "Nuevo viaje" form: trip name, start date, and a currency picker (USD/EUR, defaulting to USD), wired to Phase 1. No end-date field — the trip has no stored end date at all until #8 gives it stops. Submitting creates the trip and lands the creator on that trip's invite panel (Phase 3).

**Acceptance criteria**

- A logged-in user can create a trip with a name, a start date, and currency; the currency shown later for amounts (once #14/#15 exist) is whatever was picked here.
- A missing name or start date is rejected with an inline error, not a server error page.
- The created trip has no end date stored anywhere — it's computed on demand once stops exist, not persisted.
- After creating, the user lands directly on the new trip's invite panel — not a dead end.

**Things to consider**

- Since the home dashboard (#22) doesn't exist yet, this screen needs its own directly-reachable route (e.g. a "crear viaje" entry point off wherever auth currently lands post-login) rather than assuming a dashboard links to it. Wire it into #22's dashboard once that ticket lands.

**Tests**

- Vitest + RTL: submitting valid values calls the create-trip function with the right payload; a missing name or start date shows the inline error and doesn't submit.

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

### Phase 6 — Edit trip name & start date

**What this phase delivers**

The "Datos del viaje" dialog reused post-creation: rename the trip and change its start date, opened from the in-trip header's editable title/meta row. Renaming is always allowed; changing the start date is blocked once the trip has any booking anywhere.

**Acceptance criteria**

- Any trip member can open "Datos del viaje" and change the trip name at any time; saving updates it everywhere it's shown, no confirmation dialog.
- If the trip has zero bookings anywhere on any stop, the start date is editable the same way; saving shifts every stop's computed dates by the delta between the old and new start date.
- If the trip has at least one booking anywhere, the start-date field is disabled with explanatory copy — the name field stays editable regardless.
- Editing the start date never touches per-stop nights — only the trip's anchor date moves, which cascades into every stop's already-derived date range.

**Things to consider**

- "Has a booking anywhere" means anywhere in the trip, not just on a stop the shift would actually affect — see Non-goals for the noted future refinement.

**Tests**

- Vitest + RTL: renaming always succeeds; the start-date field is enabled with zero bookings and disabled (with copy) once a booking exists.
- Integration test: changing the start date shifts every stop's computed date range by the right delta; attempting to change it server-side with an existing booking is rejected even if the UI were bypassed.

## How to QA

- Log in, create a trip with a name, a start date, and a currency, and confirm you land on its invite panel as the admin — no end-date field should exist anywhere on this form.
- Reserve a teammate's email from the invite panel and confirm a pending row (labeled by that email) shows up immediately, with nothing actually sent.
- Copy the invite link and open it in a logged-out browser/incognito window — confirm you're routed through signup/login and land back on the join screen for that trip afterward.
- Sign up/log in using the same email you reserved earlier, pick a name and color, and confirm: you land in the trip as a participant, and the earlier pending row on the admin's crew grid flips to your joined row instead of showing twice.
- Open the same invite link as a different, unreserved account and confirm it still lets you join, landing as a fresh (unreserved) participant.
- Re-open the same invite link as someone already in the trip and confirm it drops you straight into the trip, no join screen.
- From inside the trip, click "Compartir" in the header and confirm it shows the same link/crew grid as the original invite panel.
- Try an invite link with a garbage token and confirm you get an error state, not a crash.
- Open "Datos del viaje" on a trip with no bookings yet, rename it and change the start date, and confirm every stop's shown dates shift by the same delta.
- Add a booking to any stop, then reopen "Datos del viaje" and confirm the start-date field is now disabled (with explanatory copy) while the name field still saves fine.

## Rollout & Cleanup

Not applicable — pre-launch, no existing trips/users to migrate.
