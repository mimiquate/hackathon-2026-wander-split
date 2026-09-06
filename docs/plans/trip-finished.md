# wonderSplit Trip Finished

## Context

[Issue #16](https://github.com/mimiquate/wonder_split/issues/16) is the simplest ticket in the whole trip-planning set: tap a "trip completed" action when you get back home, and it stops new expenses from sneaking in by mistake. There's nothing in the design to build against — the only comment on the issue confirms it, and the design's own Home screen just hardcodes a "settled" status chip as a stand-in. [docs/plans/home-dashboard.md](./home-dashboard.md) (#22) already anticipated this: its trip-card status chip currently only ever shows `"Por armar"` or `"En curso"` (a placeholder proxy off whether the trip has stops yet), and that plan says outright "#16 (mark trip finished) is what eventually adds a real 'closed' state on top of it." So this plan has two jobs: add the actual finish action, and give that status chip its third, real state.

Per [docs/roadmap.md](../roadmap.md) this is Phase 6, running alongside [#15](https://github.com/mimiquate/wonder_split/issues/15) (a separate, parallel plan) rather than after it — #16 only needs expenses to exist ([#14](./expense-tracking-and-adjustment.md)), not #15's settle-up math. It also touches [#12/#13](./booking-attribution-vouchers.md)'s add-booking function, since a finished trip should stop new bookings too, not just new expenses. #17 (final trip summary) is closed as not planned and folded into #15's Balance tab — not a dependency of this ticket.

**Previously an open gap, now resolved:** this plan used to flag that no plan defined the shared in-trip header it put "Finalizar viaje" in. [#8's plan](./build-the-route.md) now owns building that persistent header/tab bar (Ruta/Grupo/Gastos/Balance) as its own Phase 2, since the refreshed design has one — "Finalizar viaje" lives in that header, same as before, now with a real source.

**The design has also grown real substance around finishing that this plan didn't originally cover: a currency-conversion gate.** #14's expenses split into card-paid (with an optional, per-expense manual "Lo que cobró el banco" adjustment) and cash-paid (deferred to trip-close). The design's `finishTrip` action now opens a "¿Con qué cotización cerramos?" dialog first — grilled with Florencia (2026-09-06) and resolved:
- **Finishing is blocked** if any card-paid expense still has no manual bank-charge conversion entered. The trip can't be marked finished until every card expense has been individually adjusted from the Gastos tab.
- Once every card expense is squared away, the **bulk conversion dialog applies only to cash-paid pending expenses**: pick one rate (día / banco / manual), see the recomputed trip total live, and confirming applies that single rate to every still-pending cash expense at once and finishes the trip.
- This is layered on top of, not instead of, #14's existing per-expense manual adjustment — a card expense is always adjusted one at a time; a cash expense can be adjusted one at a time too (unchanged), or swept up all at once by this bulk step at finish time.

## Scope

- A trip gains a finished state (closed, with a timestamp) alongside its existing name/dates/currency ([#7](./create-trip-invite.md)).
- A "Finalizar viaje" action, reachable from #8's persistent in-trip header — no longer a single one-step action (see the two items below).
- **A pre-finish validation gate:** if any card-paid expense ([#14](./expense-tracking-and-adjustment.md)) still has no manual bank-charge conversion entered, clicking "Finalizar viaje" is blocked, listing which expenses need adjustment first (linking back to the Gastos tab) instead of finishing.
- **A bulk currency-conversion step for cash-paid expenses**, shown once the validation gate above passes: a "¿Con qué cotización cerramos?" dialog offering three rate modes (día / banco / manual entry), a live recomputed trip total as the rate is picked, and a confirm action that applies the chosen rate to every still-pending cash-paid expense at once and finishes the trip in the same action.
- Once a trip is finished: adding a new expense ([#14](./expense-tracking-and-adjustment.md)'s add-expense function) or a new booking ([#12/#13](./booking-attribution-vouchers.md)'s add-booking function) is rejected, with an inline message in each dialog rather than a silent failure or a generic error.
- Editing, adjusting, or removing an *existing* expense or booking keeps working after a trip is finished — including [#14](./expense-tracking-and-adjustment.md)'s adjustment flow, since a card statement often lands weeks after the trip nominally ends.
- The Home dashboard's trip-card status chip ([#22](./home-dashboard.md)) shows a third state, `"Finalizado"`, once a trip is finished — layered on top of its existing `"Por armar"` / `"En curso"` proxy, which still applies to any trip that isn't finished yet.

## Non-goals

- **Reopening a finished trip.** Not asked for in the issue; a one-way action for now. A future ticket can add "reabrir" if it turns out to be needed.
- **Requiring #15's balances to be settled before finishing.** Someone can finish a trip with money still owed; #15's balance view keeps working on a finished trip same as before. (#15's "Marcar como saldada" action runs the other direction — it's gated *on* the trip being finished, not a precondition for finishing.)
- **A live/real FX-rate API.** "Día" and "banco" are two more manually-maintained rate presets a person picks from (whoever's finishing the trip types in whatever rate they looked up), not a live external-rate integration — consistent with #14's "currency adjustment is fully manual" rule. Confirm this reading before implementation if it turns out "día"/"banco" are meant to auto-fetch a real rate.
- **Undoing a bulk conversion.** Once the cash-conversion step runs at finish time, it's a normal #14 adjustment on each affected expense afterward — same as any other post-finish edit (see Constraints), not a special "undo the bulk step" action.
- **The validation gate applying to cash-paid expenses.** Only card-paid expenses block finishing; a cash-paid expense is exactly what the bulk conversion step exists to sweep up at finish time, not something that needs fixing beforehand.
- **A confirmation dialog.** Matches this app's existing no-confirmation pattern for other one-way actions ([#10](./zoom-into-city.md) removing a place, [#12/#13](./booking-attribution-vouchers.md) removing a booking, [#14](./expense-tracking-and-adjustment.md) removing an expense) — finishing a trip flips a status, it doesn't delete anything.
- **Blocking anything besides new expenses and new bookings.** Adding a stop ([#8](./build-the-route.md)), a marked place ([#10](./zoom-into-city.md)), or a note ([#23](./city-notes.md)) on a finished trip isn't touched here — the issue is specifically about expenses (extended here to cover bookings, since both represent new money commitments), not the whole trip going read-only.
- **Any new screen for #15's who-owes-whom view.** That's a separate, parallel plan — #16 doesn't build or depend on it.

## Implementation Strategy

The finished flag and its guards have to exist before anything visible can use them, so that's Phase 1. From there: the pre-finish validation gate has to exist before the conversion dialog can trust it's safe to offer (Phase 2), then the conversion dialog and the actual finish action plus the status-chip update people would see (Phase 3), then the polished blocked-creation messaging in the two affected dialogs (Phase 4) — the guard from Phase 1 already rejects the request correctly, Phase 4 just makes that rejection legible instead of a raw error.

1. **Phase 1 — Finished state & server-side guards:** a finished flag (with timestamp) on `Trip`, a "finish trip" function (now taking a chosen cash-conversion rate), and the closed-trip check added to #14's add-expense and #12/13's add-booking functions. No UI yet.
2. **Phase 2 — Card-expense validation gate:** the server-side check for any unconverted card-paid expense, and the client-side listing that blocks "Finalizar viaje" and links back to the Gastos tab.
3. **Phase 3 — Cash-conversion dialog, finish action & status chip:** the "¿Con qué cotización cerramos?" dialog (día/banco/manual, live recomputed total), wired to Phase 1's finish function, plus #22's Home dashboard status chip showing `"Finalizado"` for a finished trip.
4. **Phase 4 — Blocked-creation messaging:** the add-expense and add-booking dialogs show a clear inline message instead of failing silently when the trip is already finished.

## Constraints & Things to Consider

- Reuse the Ruta Terracota tokens/components already ported everywhere else — `var(--token)`, terracota focus ring, ≥44px tap targets, `prefers-reduced-motion` collapsing entrance animation.
- The guard lives on the two *create* functions only (#14's add-expense, #12/13's add-booking) — every edit, adjust, and remove function for both expenses and bookings stays untouched and keeps working on a finished trip.
- The Home dashboard's status-chip logic ([docs/plans/home-dashboard.md](./home-dashboard.md)) already has a two-state proxy (`"Por armar"` / `"En curso"`); this plan adds a third check ahead of that proxy (finished takes priority over either placeholder state), it doesn't replace the existing logic.
- No trip-level permission model exists yet ([#7](./create-trip-invite.md) stores a role but nothing enforces it) — any trip member can finish a trip, matching how any member can already edit a stop, a place, a booking, or an expense.
- Apply the bulk cash-conversion rate and flip the finished flag as a single atomic operation — a partially-applied conversion (some cash expenses updated, trip not actually finished because something failed midway) is a worse state than either fully succeeding or fully not starting.
- The card-expense validation check and the finish function itself should both re-verify server-side that no unconverted card expense exists, not just trust the client already checked — the same defense-in-depth this repo already applies elsewhere (e.g. the 10-stop cap in #8).

## Phases

### Phase 1 — Finished state & server-side guards

**What this phase delivers**

A finished flag (plus a `finishedAt` timestamp) added to the `Trip` model, a server-side "finish trip" function that takes a chosen cash-conversion rate and applies it to every pending cash-paid expense atomically before flipping the flag, and a closed-trip check wired into #14's add-expense function and #12/13's add-booking function. No screens yet.

**Acceptance criteria**

- Finishing a trip persists the finished state and a timestamp; the trip's other fields (name, dates, currency, stops, existing expenses/bookings) are untouched except every pending cash-paid expense, which gets the chosen rate applied to its adjusted amount.
- The finish function rejects the request (and applies nothing) if any card-paid expense still has no manual bank-charge conversion — see Phase 2.
- Calling the add-expense function against a finished trip is rejected instead of creating the expense.
- Calling the add-booking function against a finished trip is rejected instead of creating the booking.
- Calling the edit, adjust, or remove functions for an existing expense or booking still succeeds against a finished trip.

**Things to consider**

- Model the finished state as a flag + timestamp on `Trip` (matching how #7 already models the trip's other top-level fields), not a separate table — there's only ever one finished state per trip, nothing to track a history of.
- The finish function doing both "convert every pending cash expense" and "flip the flag" in one call is deliberate (see Constraints) — don't split it into two separate calls the client has to sequence itself.

**Tests**

- Integration tests against the data functions directly: finishing a trip with no pending card expenses applies the chosen rate to every pending cash expense and sets the flag/timestamp; finishing with an unconverted card expense present is rejected and applies nothing; add-expense and add-booking both reject against a finished trip; edit/adjust/remove for an existing expense or booking still succeed against a finished trip.

### Phase 2 — Card-expense validation gate

**What this phase delivers**

The check for any card-paid expense still missing its manual bank-charge conversion, and the client-side experience when "Finalizar viaje" is clicked while that check fails: a list of the offending expenses instead of the finish flow proceeding, each linking back to the Gastos tab to fix it.

**Acceptance criteria**

- Clicking "Finalizar viaje" while any card-paid expense has no bank-charge conversion entered shows that list instead of opening Phase 3's conversion dialog.
- Each listed expense links (or navigates) to where it can be adjusted on the Gastos tab.
- Once every card-paid expense has a conversion entered, clicking "Finalizar viaje" again proceeds straight to Phase 3's dialog.
- A trip with no card-paid expenses at all never shows this gate — it goes straight to Phase 3.

**Tests**

- Vitest + RTL: clicking "Finalizar viaje" with an unconverted card expense present shows the blocking list instead of the conversion dialog; with all card expenses converted (or none existing), it opens the conversion dialog instead.

### Phase 3 — Cash-conversion dialog, finish action & status chip

**What this phase delivers**

The "¿Con qué cotización cerramos?" dialog — día/banco/manual rate modes, a live recomputed trip total as the rate changes — wired to Phase 1's finish function, reachable from #8's persistent in-trip header once Phase 2's gate passes. Plus the Home dashboard trip-card status chip showing `"Finalizado"` for a finished trip ahead of its existing `"Por armar"` / `"En curso"` proxy.

**Acceptance criteria**

- Picking each of the three rate modes (día, banco, manual entry) updates the shown recomputed trip total live, before confirming anything.
- Confirming applies the picked rate to every pending cash-paid expense and finishes the trip in one action, no separate confirmation dialog beyond this one.
- Once finished, the control itself reflects the new state (e.g. disabled or replaced with a static "Viaje finalizado" label) rather than staying clickable and re-triggering the same flow.
- The Home dashboard's status chip for a finished trip shows `"Finalizado"`, overriding whatever `"Por armar"` / `"En curso"` state it would otherwise show.
- A trip that isn't finished still shows its existing `"Por armar"` / `"En curso"` chip exactly as #22 already built it.

**Things to consider**

- This is an additive check layered onto #22's existing status-chip logic — don't restructure how that proxy already decides between its two current states.
- "Manual" rate entry is a free numeric input, same shape as #14's own per-expense manual bank-charge field — reuse that input component rather than inventing a second one.

**Tests**

- Vitest + RTL: switching between the three rate modes updates the live total; confirming calls the finish function with the picked rate and updates the control's own state; the Home dashboard status chip renders `"Finalizado"` for a finished trip and falls back to the existing proxy logic otherwise.
- Playwright test: finishing a trip from the route screen's header (picking the manual rate mode), then navigating to the Home dashboard, shows that trip's card with the `"Finalizado"` chip.

### Phase 4 — Blocked-creation messaging

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
- Log a card-paid expense without entering its bank-charge conversion, then click "Finalizar viaje" and confirm it's blocked with a list pointing at that expense instead of opening the conversion dialog.
- Adjust that expense's bank charge from the Gastos tab, click "Finalizar viaje" again, and confirm it now opens the "¿Con qué cotización cerramos?" dialog.
- Try all three rate modes (día, banco, manual) and confirm the shown total updates live each time; confirm with the manual rate and confirm the trip finishes immediately with no further confirmation prompt.
- Go back to the Home dashboard and confirm that trip's card now shows `"Finalizado"`.
- Try to add a new expense and a new booking on the finished trip and confirm both show the inline "trip finished" message instead of succeeding.
- Edit an existing expense on the finished trip (including setting its adjusted amount) and confirm it saves normally, with no blocked message.
- Edit an existing booking on the finished trip and confirm it also saves normally.
- Remove an existing expense or booking on the finished trip and confirm removal still works.
- Tab to "Finalizar viaje" with the keyboard only and confirm it shows the terracota focus ring like every other control.

## Rollout & Cleanup

Not applicable — pre-launch, no existing trips to migrate, no flag needed.
