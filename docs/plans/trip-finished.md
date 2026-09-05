# wonderSplit Trip Finished

## Context

[Issue #16](https://github.com/mimiquate/wonder_split/issues/16) is the simplest ticket in the whole trip-planning set: tap a "trip completed" action when you get back home, and it stops new expenses from sneaking in by mistake. There's nothing in the design to build against — the only comment on the issue confirms it, and the design's own Home screen just hardcodes a "settled" status chip as a stand-in. [docs/plans/home-dashboard.md](./home-dashboard.md) (#22) already anticipated this: its trip-card status chip currently only ever shows `"Por armar"` or `"En curso"` (a placeholder proxy off whether the trip has stops yet), and that plan says outright "#16 (mark trip finished) is what eventually adds a real 'closed' state on top of it." So this plan has two jobs: add the actual finish action, and give that status chip its third, real state.

Per [docs/roadmap.md](../roadmap.md) this is Phase 6, running alongside [#15](https://github.com/mimiquate/wonder_split/issues/15) (a separate, parallel plan) rather than after it — #16 only needs expenses to exist ([#14](./expense-tracking-and-adjustment.md)), not #15's settle-up math. It also touches [#12/#13](./booking-attribution-vouchers.md)'s add-booking function, since a finished trip should stop new bookings too, not just new expenses. [#17](https://github.com/mimiquate/wonder_split/issues/17) (final trip summary), a later plan, will depend on the closed state this ticket introduces — it isn't built here.

## Scope

- A trip gains a finished state (closed, with a timestamp) alongside its existing name/dates/currency ([#7](./create-trip-invite.md)).
- A "Finalizar viaje" action, reachable from the trip's shared in-trip header (the same header #8's route screen and #9's map screen already use) — a simple control, not a new screen, since nothing in the design shows one.
- Once a trip is finished: adding a new expense ([#14](./expense-tracking-and-adjustment.md)'s add-expense function) or a new booking ([#12/#13](./booking-attribution-vouchers.md)'s add-booking function) is rejected, with an inline message in each dialog rather than a silent failure or a generic error.
- Editing, adjusting, or removing an *existing* expense or booking keeps working after a trip is finished — including [#14](./expense-tracking-and-adjustment.md)'s adjustment flow, since a card statement often lands weeks after the trip nominally ends.
- The Home dashboard's trip-card status chip ([#22](./home-dashboard.md)) shows a third state, `"Finalizado"`, once a trip is finished — layered on top of its existing `"Por armar"` / `"En curso"` proxy, which still applies to any trip that isn't finished yet.

## Non-goals

- **Reopening a finished trip.** Not asked for in the issue; a one-way action for now. A future ticket can add "reabrir" if it turns out to be needed.
- **Requiring #15's balances to be settled before finishing.** The issue just describes a manual button tapped on getting home — it doesn't gate on the math being done. Someone can finish a trip with money still owed; #15's balance view keeps working on a finished trip same as before.
- **A confirmation dialog.** Matches this app's existing no-confirmation pattern for other one-way actions ([#10](./zoom-into-city.md) removing a place, [#12/#13](./booking-attribution-vouchers.md) removing a booking, [#14](./expense-tracking-and-adjustment.md) removing an expense) — finishing a trip flips a status, it doesn't delete anything.
- **Blocking anything besides new expenses and new bookings.** Adding a stop ([#8](./build-the-route.md)), a marked place ([#10](./zoom-into-city.md)), or a note ([#23](./city-notes.md)) on a finished trip isn't touched here — the issue is specifically about expenses (extended here to cover bookings, since both represent new money commitments), not the whole trip going read-only.
- **Any new screen for #15's who-owes-whom view.** That's a separate, parallel plan — #16 doesn't build or depend on it.

## Implementation Strategy

The finished flag and its guards have to exist before anything visible can use them, so that's Phase 1. From there: the action itself and the status-chip update people would actually see first (Phase 2), then the polished blocked-creation messaging in the two affected dialogs (Phase 3) — the guard from Phase 1 already rejects the request correctly, Phase 3 just makes that rejection legible instead of a raw error.

1. **Phase 1 — Finished state & server-side guards:** a finished flag (with timestamp) on `Trip`, a "finish trip" function, and the closed-trip check added to #14's add-expense and #12/13's add-booking functions. No UI yet.
2. **Phase 2 — "Finalizar viaje" action & status chip:** the header control that finishes a trip, and #22's Home dashboard status chip showing `"Finalizado"` for a finished trip.
3. **Phase 3 — Blocked-creation messaging:** the add-expense and add-booking dialogs show a clear inline message instead of failing silently when the trip is already finished.

## Constraints & Things to Consider

- Reuse the Ruta Terracota tokens/components already ported everywhere else — `var(--token)`, terracota focus ring, ≥44px tap targets, `prefers-reduced-motion` collapsing entrance animation.
- The guard lives on the two *create* functions only (#14's add-expense, #12/13's add-booking) — every edit, adjust, and remove function for both expenses and bookings stays untouched and keeps working on a finished trip.
- The Home dashboard's status-chip logic ([docs/plans/home-dashboard.md](./home-dashboard.md)) already has a two-state proxy (`"Por armar"` / `"En curso"`); this plan adds a third check ahead of that proxy (finished takes priority over either placeholder state), it doesn't replace the existing logic.
- No trip-level permission model exists yet ([#7](./create-trip-invite.md) stores a role but nothing enforces it) — any trip member can finish a trip, matching how any member can already edit a stop, a place, a booking, or an expense.

## Phases

### Phase 1 — Finished state & server-side guards

**What this phase delivers**

A finished flag (plus a `finishedAt` timestamp) added to the `Trip` model, a server-side "finish trip" function, and a closed-trip check wired into #14's add-expense function and #12/13's add-booking function. No screens yet.

**Acceptance criteria**

- Finishing a trip persists the finished state and a timestamp; the trip's other fields (name, dates, currency, stops, existing expenses/bookings) are untouched.
- Calling the add-expense function against a finished trip is rejected instead of creating the expense.
- Calling the add-booking function against a finished trip is rejected instead of creating the booking.
- Calling the edit, adjust, or remove functions for an existing expense or booking still succeeds against a finished trip.

**Things to consider**

- Model this as a flag + timestamp on `Trip` (matching how #7 already models the trip's other top-level fields), not a separate table — there's only ever one finished state per trip, nothing to track a history of.

**Tests**

- Integration tests against the data functions directly: finishing a trip sets the flag/timestamp and leaves everything else alone; add-expense and add-booking both reject against a finished trip; edit/adjust/remove for an existing expense or booking still succeed against a finished trip.

### Phase 2 — "Finalizar viaje" action & status chip

**What this phase delivers**

A "Finalizar viaje" control in the shared in-trip header (the same header #8's route screen and #9's map screen use), wired to Phase 1's finish function with no confirmation step, plus the Home dashboard trip-card status chip showing `"Finalizado"` for a finished trip ahead of its existing `"Por armar"` / `"En curso"` proxy.

**Acceptance criteria**

- Clicking "Finalizar viaje" from either the route screen or the map screen finishes the trip immediately, no confirmation dialog.
- Once finished, the control itself reflects the new state (e.g. disabled or replaced with a static "Viaje finalizado" label) rather than staying clickable and re-triggering the same action.
- The Home dashboard's status chip for a finished trip shows `"Finalizado"`, overriding whatever `"Por armar"` / `"En curso"` state it would otherwise show.
- A trip that isn't finished still shows its existing `"Por armar"` / `"En curso"` chip exactly as #22 already built it.

**Things to consider**

- This is an additive check layered onto #22's existing status-chip logic — don't restructure how that proxy already decides between its two current states.

**Tests**

- Vitest + RTL: clicking "Finalizar viaje" calls the finish function and updates the control's own state; the Home dashboard status chip renders `"Finalizado"` for a finished trip and falls back to the existing proxy logic otherwise.
- Playwright test: finishing a trip from the route screen's header, then navigating to the Home dashboard, shows that trip's card with the `"Finalizado"` chip.

### Phase 3 — Blocked-creation messaging

**What this phase delivers**

The "Agregar gasto" dialog ([#14](./expense-tracking-and-adjustment.md)) and the "Sumar reserva" dialog ([#12/#13](./booking-attribution-vouchers.md)) both show a clear inline message when opened (or submitted) against a finished trip, instead of failing with a raw/generic error.

**Acceptance criteria**

- Opening or submitting the add-expense dialog on a finished trip shows an inline message explaining the trip is finished, instead of a generic failure.
- Opening or submitting the add-booking dialog on a finished trip shows the same treatment.
- Editing an existing expense or booking on a finished trip opens and saves normally, with no such message — the blocked message only ever appears for creating something new.

**Tests**

- Vitest + RTL: the add-expense and add-booking dialogs both render the inline finished-trip message and don't call their create functions when the trip is finished; opening either dialog to edit an existing record shows no such message and saves normally.

## How to QA

- Open a trip that isn't finished yet and confirm its Home dashboard chip shows `"Por armar"` or `"En curso"` as before.
- From the trip's route screen, click "Finalizar viaje" and confirm it finishes immediately with no confirmation prompt.
- Go back to the Home dashboard and confirm that trip's card now shows `"Finalizado"`.
- Try to add a new expense and a new booking on the finished trip and confirm both show the inline "trip finished" message instead of succeeding.
- Edit an existing expense on the finished trip (including setting its adjusted amount) and confirm it saves normally, with no blocked message.
- Edit an existing booking on the finished trip and confirm it also saves normally.
- Remove an existing expense or booking on the finished trip and confirm removal still works.
- Tab to "Finalizar viaje" with the keyboard only and confirm it shows the terracota focus ring like every other control.

## Rollout & Cleanup

Not applicable — pre-launch, no existing trips to migrate, no flag needed.
