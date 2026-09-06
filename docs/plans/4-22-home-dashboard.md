# 4 · #22 — wonderSplit Home Dashboard

## Context

[Issue #22](https://github.com/mimiquate/wonder_split/issues/22) covers the "Tus viajes" home screen: after logging in, a user lands on a page listing every trip they're part of. It's not covered by any existing ticket — the design has a screen for it with no matching issue, so #22 was created for it (see [docs/roadmap.md](../roadmap.md)). It depends only on [#7](https://github.com/mimiquate/wonder_split/issues/7) (create-trip-invite, see [docs/plans/3-7-create-trip-invite.md](./3-7-create-trip-invite.md)) for a `Trip`/`TripMembership` to list in the first place, and runs in parallel with [#8](https://github.com/mimiquate/wonder_split/issues/8) (build the route) — this plan doesn't wait on #8, it just falls back gracefully wherever a trip doesn't have route/stop data yet, same pattern #7's plan already used for the join screen.

The design ("Armar el viaje" Claude Design project, `Armar el viaje.dc.html`, screen `Home — tus viajes`) shows a card grid: an always-present "Nuevo viaje" entry card, followed by one card per trip with a route summary, dates, a photo carousel, crew avatars, and a status chip. It also shows the shared authenticated-app header nav (Viajes / Gastos / Vouchers / Perfil) with "Viajes" as the active item — this ticket is what turns "Viajes" into the app's first real destination.

This screen also becomes the real post-login landing route, replacing the minimal placeholder page auth's Phase 6 built just to prove protected routing worked (see [2-2-auth.md](./2-2-auth.md) Phase 6).

## Scope

- The "Tus viajes" page: every trip the logged-in user is a member of, as cards, plus an aggregate eyebrow line ("N viajes").
- Each trip card shows: a route summary (city names strung together once #8 gives the trip stops), a compact date/traveler-count line, a photo carousel over the trip's cities, the crew as an avatar group (capped, "+N" overflow), and a status chip.
- The photo carousel: swipe/arrow navigation plus dot indicators, one placeholder image per city in the trip's route — not real user-uploaded photos (see Non-goals).
- A trip-level status chip, derived from what data actually exists today (see Constraints), not the design's hardcoded "settled" state.
- "Nuevo viaje" entry card, always the first grid item, opening #7's create-trip flow.
- An empty/first-time state for a user with zero trips: same grid, just the "Nuevo viaje" card, with a short invented headline/subcopy above it so the page doesn't read as broken.
- Adding the "Viajes / Gastos / Vouchers / Perfil" nav strip to the authenticated header, with "Viajes" wired to this page and the other three inert placeholders (same pattern auth used for its account-menu items).
- This page becomes the real destination a logged-in user lands on, replacing auth's placeholder authenticated page.

## Non-goals

- **Real trip photo uploads/storage.** The carousel is fully functional (swipe, arrows, dots), but the images behind it are generic per-city placeholders, not photos anyone uploaded. There's no ticket anywhere in the roadmap for a photo-upload feature yet — this stays a known gap until one exists.
- **Wiring "Gastos" and "Vouchers" nav links.** Those pages don't exist yet (later tickets, #12+). They ship as inert items in the new nav strip, same as auth left "Mi perfil" / "Dispositivos y sesiones" inert in its account menu.
- **A dedicated "Perfil" page.** The nav item exists (matching the design), but stays inert — account actions still live in auth's existing account-menu dropdown.
- **Real settle-up/closed-trip status.** The status chip uses a simple proxy (see Constraints) instead of the real "balances settled" state, since that math (#15) and trip-closing (#16) don't exist yet. Revisit once those ship.
- **A real "open debts" count in the aggregate eyebrow line.** Same reason as above — showing a number here would mean fabricating a balance that hasn't been computed. The eyebrow line only ever shows the real trip count.
- **Sorting/filtering/pagination controls.** Trips just render newest-upcoming-first; no search, filters, or archive view. Fine to revisit once someone actually has enough trips for it to matter.
- **Route summaries beyond what #8 provides.** If a trip has no stops yet, the card falls back to the trip's name — no invented route text.

## Implementation Strategy

The data side is just a read: list the current user's trips (via `TripMembership`) with whatever route/stop data they already have from #8, no new write path. So this is really a two-phase ticket: get the real trip list rendering as cards first, then layer the nav-strip/landing-route change that makes this page the thing you actually land on after login.

1. **Phase 1 — Trip list & cards:** the "Tus viajes" grid — real trip data, route/date summary, photo carousel, crew avatars, status-chip proxy, and the empty-state — plus the "Nuevo viaje" entry card wired to #7.
2. **Phase 2 — Header nav & landing route:** add the Viajes/Gastos/Vouchers/Perfil nav strip to the authenticated shell (Viajes wired here, the rest inert), and make this page the real post-login destination in place of auth's placeholder.

## Constraints & Things to Consider

- Reuse the Ruta Terracota tokens/components already ported for auth, the landing page, and #7 — nothing new to decide on tokens, focus rings, or tap targets here.
- Copy is Rioplatense Spanish (vos), taken verbatim from the design where it exists; the empty-state headline/subcopy is invented here (design has no zero-trips screen) in the same voice.
- Route summary and photo carousel both read from #8/#10's stop data once it exists; until a trip has stops, the card shows the trip name in place of a route string and a single static placeholder image with no carousel chrome (nothing to page through with 0-1 images).
- Status chip proxy: `"Por armar"` while a trip has no stops yet, `"En curso"` once it does. This is a placeholder rule for this ticket only — #16 (mark trip finished) is what eventually adds a real "closed" state on top of it.
- A trip card always shows every member as a joined crew avatar — there's no "pending invite" badge here (that's the invite panel's job, see #7); this page only shows people already in the trip.
- Sort trips soonest-upcoming-start-date first (past trips after) — not spec'd by the design (which only mocks one trip), decided here since a dashboard should surface what's next.

## Phases

### Phase 1 — Trip list & cards

**What this phase delivers**

The "Tus viajes" page itself: a grid of cards, one per trip the logged-in user belongs to, each showing a route/trip-name summary, a compact date + traveler-count line, a photo carousel over the trip's cities (or a single placeholder if it has none yet), the crew avatar group, and the `"Por armar"` / `"En curso"` status chip — plus the always-present "Nuevo viaje" card and the invented empty state for a brand-new user.

**Acceptance criteria**

- A logged-in user sees one card per trip they're a member of (as creator or joined participant), sorted soonest-upcoming first.
- A trip with stops (from #8) shows its route as a string of city names; a trip with none yet shows its trip name instead.
- The photo carousel shows one placeholder image per city, with working prev/next arrows and dot indicators that jump to a given slide; a trip with 0 or 1 cities shows a single static image with no carousel controls.
- The crew avatar group shows every joined member, capped with a "+N" overflow badge past the cap.
- The status chip shows `"Por armar"` for a trip with no stops yet, `"En curso"` once it has at least one.
- The eyebrow line shows the user's real trip count (e.g. "2 viajes"), with no debts/balance figure.
- The "Nuevo viaje" card is always the first grid item and opens #7's create-trip flow.
- A user with zero trips sees the invented empty-state headline/subcopy above a grid containing only the "Nuevo viaje" card.

**Things to consider**

- Pull each trip's stop list from whatever #8 has landed at the time — this phase doesn't add its own stops data, just reads it if present.

**Tests**

- Integration test: the trips-list query returns only trips the requesting user is a member of, sorted soonest-upcoming first.
- Vitest + RTL: a trip with stops renders the route string; a trip with none renders the trip name instead; the status chip shows the right label for each case; the carousel's dots/arrows advance the visible image and hide entirely at 0-1 images; the avatar group shows the "+N" badge past its cap; a zero-trips user sees the empty state instead of any trip card.

### Phase 2 — Header nav & landing route

**What this phase delivers**

The Viajes/Gastos/Vouchers/Perfil nav strip added to the authenticated header, with "Viajes" active and linking to this page, the other three present but inert. This page also becomes the actual route a user lands on right after login, replacing auth's placeholder authenticated page.

**Acceptance criteria**

- The authenticated header shows all four nav items; clicking "Viajes" (or landing on it by default) shows it in its active state.
- Clicking "Gastos", "Vouchers", or "Perfil" does nothing yet (no dead link/404 — just inert, same treatment auth gave its inert account-menu items).
- Logging in takes the user straight to "Tus viajes" instead of auth's old placeholder page.

**Things to consider**

- Auth's placeholder page can be deleted outright once this lands, rather than left dangling as an unreachable route.

**Tests**

- Playwright test: logging in lands the user on "Tus viajes" with "Viajes" shown active in the nav; clicking the other three nav items is a no-op (no navigation, no error).

## How to QA

- Log in with an account that belongs to a couple of trips (some with stops already from #8, some without) and confirm you land straight on "Tus viajes".
- Confirm trips are ordered soonest-upcoming first, each card shows the right route-or-name summary, date/traveler line, crew avatars (with overflow badge if the trip has more people than the cap), and the correct status chip.
- Cycle a trip's photo carousel with both the arrows and the dots; confirm a trip with only one city shows a single static image with no carousel controls.
- Click "Nuevo viaje" and confirm it opens #7's create-trip flow.
- Log in with a fresh account that has no trips yet and confirm you see the invented empty-state copy plus only the "Nuevo viaje" card.
- Click "Gastos", "Vouchers", and "Perfil" in the header nav and confirm they're inert, not broken links.

## Rollout & Cleanup

Not applicable — pre-launch, no existing users/trips to migrate, and this directly replaces auth's placeholder authenticated page as part of Phase 2 rather than running alongside it.
