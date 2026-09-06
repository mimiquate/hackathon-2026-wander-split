# wonderSplit Expense Tracking & Currency Adjustment

## Context

[Issue #14](https://github.com/mimiquate/wonder_split/issues/14) ("Card statement adjustment") is about a very specific travel annoyance: you buy something in euros, and three weeks later your card statement shows a different number in your own currency. The app should let you log the expense right away in whatever currency you paid it in, then go back and correct it to the real amount once the statement lands, so nobody eats an exchange-rate surprise.

The design comment already left on the issue confirms there's nothing to build against here: the Gastos tab in "Ciudad — detalle" only shows a mocked list of already-converted US$ amounts, with no original-currency logging and no adjustment flow. Per [docs/plans/zoom-into-city.md](./zoom-into-city.md) (#10), that tab shipped inert, same as Reservas and Notas did before [#12/#13](./booking-attribution-vouchers.md) and [#23](./city-notes.md) built them out. Nothing else claims the base "log an expense" flow either, so — same as #12/#13 grew from "the Sumar reserva dialog" into all of Reservas — this plan grew from "the adjustment layer" into all of Gastos: the tab's real read path, the add/edit dialog, and the adjustment on top of it.

This depends on #7 (a trip's currency and crew, [docs/plans/create-trip-invite.md](./create-trip-invite.md)), #8/#10 (a stop to attach an expense to), and reuses the "who's using it" crew-subset picker #12/#13 already built for bookings. Per [docs/roadmap.md](../roadmap.md) this is Phase 5, sitting right after #12. Two things downstream need to be able to rely on decisions made here: #15's Balance tab (which absorbed #17's category-breakdown ask when #17 closed as not planned) wants a spend breakdown by category, so a category field ships now rather than getting retrofitted onto existing rows later; and #15's settle-up math needs to know how to treat an expense that hasn't been adjusted yet — covered below.

**Design refresh note (2026-09-06):** the "Armar el viaje" design now has a real standalone "gasto suelto" (general expense) form — but as currently exported, it only shows a single "Quién pagó" field, no "Quién lo usa" split picker. Grilled with Florencia and resolved: the split picker below is correct and stays in this plan's scope regardless (#15's balance math needs a consumption split on every #14 expense, not just on bookings) — this is a gap in the design to flag back, not a reason to cut the field from this plan.

The refreshed design also splits an expense by **payment method** (efectivo/tarjeta), which this plan didn't originally model and now needs to: a card-paid expense gets an optional per-expense "Lo que cobró el banco" adjustment (the same manual adjusted-amount flow this plan already describes below); a cash-paid expense's copy explicitly defers adjustment to trip-close, where [#16](./trip-finished.md)'s new bulk currency-conversion step sweeps up every still-pending cash expense at once. See the Scope and Phase 1/3/4 updates below.

## Scope

- The Gastos tab going from inert to real: a list of expenses for a stop (label, category, who paid, the currently-relevant amount), and a detail view for one expense showing every field.
- The "Agregar gasto" dialog, used for both adding and editing an expense: a label, a category picker (fixed list — see Constraints), an amount with an original-currency dropdown, a **payment-method toggle (Efectivo/Tarjeta)**, a "Quién pagó" single-select from the trip's crew, and a "Quién lo usa" multi-select (same subset-picker pattern #12/#13 built for bookings), defaulting to the whole crew checked.
- Adjusting an expense: editing it to enter the final adjusted amount (in the trip's own currency, from #7's `Trip.currency`) once the real statement shows up — labeled "Lo que cobró el banco" for a card-paid expense, matching the design's copy. Until that happens, the expense displays its original logged amount, visibly flagged "Pendiente de ajuste."
- A cash-paid pending expense stays manually adjustable too (same field, same flow) — but it's also the specific set of expenses [#16](./trip-finished.md)'s bulk conversion dialog sweeps up all at once at trip-finish time. This ticket doesn't build that bulk step (that's #16's), but its "is this expense still pending, and what payment method is it" data is exactly what #16 reads to decide what to block on (card) versus what to offer for bulk conversion (cash).
- Removing an expense outright, no confirmation dialog (same pattern #10 and #12/#13 already use for removal).

## Non-goals

- **Any live FX-rate lookup or auto-suggested adjusted amount.** Purely manual — the user types the real number off their statement. Nothing here calls an exchange-rate API.
- **A multi-edit audit trail.** Just one original amount/currency and one current adjusted amount. If someone adjusts twice, the second edit just overwrites the adjusted value — no history-of-edits list.
- **Voucher/file attachments on an expense.** That's what #12/#13 already built for bookings; an expense here is just numbers and a category, not a document.
- **Any actual balance or settle-up computation.** This ticket only produces the expense data (including the "pending" flag) that #15 later reads — it doesn't calculate who owes whom.
- **Blocking new expenses on a closed trip.** That guard is #16's job ("Mark the trip as finished"); this ticket doesn't add a closed-trip check itself.
- **Per-role permission gating** on who can log, edit, or remove an expense. Any trip member can, matching #8/#10/#12's existing precedent — there's no role-gated action in this app yet.
- **Category icons or a configurable category list.** The fixed list below (see Constraints) is invented since neither the issue nor the design specifies one; extending it later is a one-line change, not a rework — same reasoning #7 already used for its trimmed currency list.
- **A separate adjustment mechanism for cash vs. card expenses.** Both payment methods use the exact same adjusted-amount field and flow (Phase 4) — payment method only changes the field's label ("Lo que cobró el banco" for card) and which expenses #16's bulk-conversion step later targets (cash only). Nothing here forks the underlying logic in two.
- **Building #16's bulk cash-conversion dialog, or its pre-finish card-expense validation gate.** Both read this ticket's `paymentMethod` + pending-adjustment fields, but are #16's UI and server logic to build, not this ticket's.
- **Linking an expense back to the booking whose cost it represents.** #15's plan documents that a booking's (#12/#13) real cost gets logged here as a separate expense (e.g. category "Alojamiento"), but nothing ties the two records together — no `bookingId` on `Expense`, no reverse pointer on `Booking`. They stay two independently-entered records; if their "who's using it" lists ever drift apart, nothing catches it. Not modeled now since there's no real usage data yet to know if that drift is a real problem worth a schema change for — worth revisiting if it turns out to bite.

## Implementation Strategy

The expense/category data model has to exist before anything else, so that's Phase 1. From there this follows the same read-before-write order #10 and #12/#13 used: the Gastos tab's real read path first, then the add/edit dialog, then the adjustment flow specifically (since an expense can exist and be perfectly usable before its adjustment arrives), then removal last, since it doesn't block anything else shipping.

1. **Phase 1 — Expense & category data model:** Prisma schema for an expense (stop, label, category, payment method, original amount, original currency, adjusted amount, who paid, who's using it) and the server-side add/edit/remove functions. No UI yet.
2. **Phase 2 — Gastos tab: read path:** the tab goes from inert to listing real expenses, plus a detail view showing every field and the pending/adjusted state.
3. **Phase 3 — Agregar gasto dialog: add & edit:** the dialog itself — label, category, original amount + currency, who paid, who's using it (defaulting to the whole crew).
4. **Phase 4 — Adjustment & removal:** editing an expense to add or change its adjusted amount, and removing an expense outright.

## Constraints & Things to Consider

- Reuse the Ruta Terracota tokens/components already ported everywhere else — `var(--token)`, terracota focus ring, ≥44px tap targets, `prefers-reduced-motion` collapsing entrance animation.
- Copy is Rioplatense Spanish (vos), same voice as the rest of the app. Two lists are invented here (no design or issue specifies them), both adjustable later without a rework:
  - **Category** (fixed, single-select): Transporte, Alojamiento, Comida, Actividades, Otro.
  - **Original currency** (fixed dropdown, wider than #7's trimmed trip-currency list since an expense can be paid in any currency encountered while traveling): USD, EUR, ARS, GBP, BRL, CLP, UYU, MXN.
  - **Payment method** (fixed, single-select, taken from the design): Efectivo, Tarjeta. Just a label + downstream routing for #16's finish-time behavior — no other logic here treats the two differently.
- "Quién pagó" and every person selectable in "Quién lo usa" come from the trip's existing crew — no free-text names, same as #12/#13.
- "Quién lo usa" defaults to the entire crew checked when the dialog opens for a new expense, matching #12/#13's picker exactly.
- An adjusted amount is always in the trip's own currency (#7's `Trip.currency`) — the original amount/currency are just what got logged in the moment, kept around for reference, not converted automatically.
- **The "pending" flag matters beyond this ticket.** An expense with no adjusted amount yet still counts toward any running total using its original logged amount at face value (numerically, ignoring the currency mismatch), visibly flagged "Pendiente de ajuste" rather than being hidden or excluded. #15's settle-up math (a later, separate plan) needs to treat a pending expense's face-value amount as provisional — this plan is only responsible for storing and displaying that flag correctly, not for the balance math itself.
- An expense belongs to a stop, same as #10's marked places and #12/#13's bookings — nothing floats free of a city.

## Phases

### Phase 1 — Expense & category data model

**What this phase delivers**

A Prisma schema for an expense (stop, label, category, payment method — efectivo/tarjeta, original amount, original currency, adjusted amount — nullable until set, who paid, who's using it) and server-side add/edit/remove functions. No screens yet.

**Acceptance criteria**

- Adding an expense persists its label, category, payment method, original amount/currency, who paid, and who's using it against the right stop, with a null adjusted amount.
- Editing an expense updates any of those fields — including setting or changing the adjusted amount — without touching the others.
- Removing an expense deletes it outright.
- Expenses are scoped per stop — two different stops never share or leak each other's expenses.

**Things to consider**

- Model expenses as their own table (stop + label + category + original amount/currency + adjusted amount + paid-by + a many-to-many "using it" relation to trip members), not embedded JSON, matching the pattern #8/#10/#12 already used.
- "Who's using it" is a many-to-many against trip members, same shape as #12/#13's booking picker, not a fixed-size list.

**Tests**

- Integration tests against the data functions directly: adding persists all fields with a null adjusted amount; editing changes only the fields passed, including setting the adjusted amount independently; removing deletes the expense; expenses for one stop never show up under another.

### Phase 2 — Gastos tab: read path

**What this phase delivers**

The Gastos tab (currently inert per #10) now lists real expenses for the stop — label, category, who paid, and the currently-relevant amount (the adjusted amount if set, otherwise the original amount flagged "Pendiente de ajuste") — and clicking one opens a detail view showing every field.

**Acceptance criteria**

- The Gastos tab count (already shown in #10's tab strip) reflects the real number of expenses.
- The expense list shows each expense's label, category, who paid, and its amount — adjusted amounts shown plainly, unadjusted ones shown with the "Pendiente de ajuste" flag.
- Opening an expense shows every field: label, category, original amount/currency, adjusted amount (or the pending flag if not yet set), who paid, and the full "who's using it" list.
- A stop with zero expenses shows an empty-state message instead of a blank tab.

**Things to consider**

- This only replaces the Gastos tab's inert placeholder from #10's Phase 2 — the tab-strip mechanics (switching, counts) stay as #10 already built them.

**Tests**

- Vitest + RTL: the tab count matches the number of expenses; the list renders label/category/payer/amount per row with the pending flag shown only for unadjusted expenses; the detail view renders all fields for a given expense; zero expenses shows the empty state.

### Phase 3 — Agregar gasto dialog: add & edit

**What this phase delivers**

The "Agregar gasto" dialog: a label field, the category picker, an amount field with the original-currency dropdown, a payment-method toggle (Efectivo/Tarjeta), "Quién pagó" (single-select), and "Quién lo usa" (multi-select, defaulting to the whole crew checked). The same dialog, pre-filled, edits an existing expense's non-adjustment fields.

**Acceptance criteria**

- Saving the dialog for a new expense creates it with the entered label, category, amount, currency, payment method, payer, and using-it list, and it immediately shows up in the Gastos list, flagged pending.
- Opening the dialog on an existing expense pre-fills every field (including payment method) with its current values; saving updates it in place.
- "Quién lo usa" starts with every crew member checked on a new expense; unchecking someone excludes just them.
- Canceling the dialog (new or edit) discards any unsaved changes.

**Things to consider**

- "Quién pagó" can be anyone in the crew, including someone not in "Quién lo usa" — no validation forcing the payer to also be a user of the expense.
- Payment method defaults to unset — force an explicit choice on save rather than silently defaulting to one, since it changes which adjustment path (#16's card gate vs. cash bulk-sweep) the expense falls into later.

**Tests**

- Vitest + RTL: submitting the dialog for a new expense calls the create function with the right fields including payment method; opening it on an existing expense pre-fills correctly (including payment method) and submitting calls the edit function; the using-it picker starts fully checked; canceling doesn't call either function.
- Integration test: creating and then editing an expense through the real data functions round-trips all fields, including payment method, correctly.

### Phase 4 — Adjustment & removal

**What this phase delivers**

Editing an expense to add or change its adjusted amount (assumed to be in the trip's currency), which flips its displayed state from "Pendiente de ajuste" to the real adjusted number, and removing an expense outright. The field is labeled "Lo que cobró el banco" for a card-paid expense and just "Monto ajustado" (or equivalent) for cash, but it's the same underlying field and flow either way.

**Acceptance criteria**

- Setting an adjusted amount on a pending expense (card or cash) updates its displayed amount immediately and clears the "Pendiente de ajuste" flag, in both the list and the detail view.
- Changing an already-adjusted amount again just overwrites the adjusted value — the original amount/currency never change once logged.
- Removing an expense deletes it and it disappears from the list immediately, no confirmation prompt (matching the pattern #10 and #12/#13 already use for removal).
- A cash-paid expense with no adjusted amount stays fully usable and editable everywhere in this ticket — nothing here blocks on it; #16 is what later decides whether an unadjusted cash expense matters at finish time.

**Tests**

- Vitest + RTL: entering an adjusted amount on a pending expense (both payment methods) clears the pending flag and shows the new amount, with the field labeled correctly per payment method; re-editing an already-adjusted expense's amount overwrites it without touching the original fields; removing an expense removes its row.
- Integration test: setting an adjusted amount persists against the right expense and leaves its original amount/currency untouched; removing an expense deletes it outright.

## How to QA

- Open a city's Gastos tab with zero expenses and confirm you see an empty-state message, not a blank tab.
- Log a new expense with a label, category, an amount in a non-trip currency, a payment method, a payer, and a "who's using it" subset — confirm it shows up in the list flagged "Pendiente de ajuste."
- Open that expense's detail view and confirm every field you entered is there, including payment method and the full using-it list.
- Log one card-paid and one cash-paid expense and confirm the adjustment field's label reads "Lo que cobró el banco" for the card one and a plain adjusted-amount label for the cash one.
- Edit the expense to set its adjusted amount and confirm the list and detail view both update to show the real amount with the pending flag gone.
- Edit the adjusted amount again and confirm it just overwrites, with the original amount/currency unchanged.
- Remove an expense and confirm it disappears immediately with no confirmation prompt.
- Tab through the whole flow with the keyboard only — every focusable control shows the terracota focus ring.

## Rollout & Cleanup

Not applicable — pre-launch, no existing expense data to migrate.
