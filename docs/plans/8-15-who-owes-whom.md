# 8 · #15 — wonderSplit Who Owes Whom

## Context

[Issue #15](https://github.com/mimiquate/wonder_split/issues/15) is the "magic summary": the app crunches every expense and tells the group exactly who needs to transfer what to whom to settle up, using as few transfers as possible.

There was no design to build against when this plan was first written — a comment on the issue confirmed `Armar el viaje.dc.html` had no settle-up/balance screen anywhere. **The design has since been refreshed and now has a real Balance tab** (part of the persistent Ruta/Grupo/Gastos/Balance shell #8's plan builds — see below), which this revision aligns to: a per-person paid/consumed/net table, a transfer list, and a "Marcar como saldada" action per transfer that's only enabled once the trip is finished (`canSettle: !!finished && !done` in the design's state). It also folds in what #17 asked for (total spend, category breakdown, final cost per person) — see the Scope changes below; #17 is closed as not planned, folded into this ticket (see [final-trip-summary.md](./final-trip-summary.md), left unnumbered since it's a closed redirect doc, not an active plan).

An earlier comment on #15 said this ticket should split bookings using the "who's using it" field #12 introduces. That's superseded now: [#12/#13's plan](./6-12-13-booking-attribution-vouchers.md) shipped bookings as attribution/voucher records with no price of their own, and [#14's plan](./7-14-expense-tracking-and-adjustment.md) is what actually owns money — amount, who paid, who's using it — for everything in the trip, bookings included (a booking's real cost gets logged as a #14 expense, e.g. under the "Alojamiento" category). So this ticket reads exclusively from #14's expenses, never from bookings. A comment clarifying this is left on #15 alongside this plan.

Per [docs/roadmap.md](../roadmap.md) this is Phase 6, needing #7 (crew/currency) and #14 (the actual expense data) to exist first. It runs alongside #16 (mark trip finished) rather than after it — the two don't depend on each other.

**Previously an open gap, now resolved:** this plan used to flag that no plan defined the shared trip-level tab strip it assumed. [#8's plan](./4-8-build-the-route.md) now owns building that persistent header/tab bar (Ruta/Grupo/Gastos/Balance) as its own Phase 2, since the refreshed design has one and #8 is the first screen where it turns on — this ticket's Balance tab renders as one tab's content inside that shell rather than building any chrome of its own.

## Scope

- A pure calculation, given a trip's expenses and crew: each person's net balance (what they paid across all expenses, minus their share of what they consumed), and a minimal-transfer list telling each debtor exactly who to pay and how much.
- Splitting rule: an expense's relevant amount (its adjusted amount if set, otherwise its original logged amount at face value, per #14's "Pendiente de ajuste" handling) divides evenly across its "who's using it" people. Whoever paid it gets credited the full amount; everyone in "who's using it" (payer included, if they're in that list) gets debited their even share.
- A new "Balance" tab on the trip hub (the shared shell #8's plan builds), showing the per-person balance list and the transfer list.
- **Marking a transfer as settled** ("Marcar como saldada"), one action per transfer in the list. **Only enabled once #16 has marked the trip finished** — before that, the transfer list is informational only, with no way to mark anything paid. This is a real, persisted fact (someone actually paid someone back), not a derived value like the rest of this ticket — see Phase 3.
- A settled transfer stays visible in the list (greyed out / marked done), rather than disappearing — so the group can see the full settle-up history, not just what's still outstanding.
- **Trip-wide totals, absorbed from the now-closed #17:** total trip spend (every expense's relevant amount, across every stop), a breakdown by #14's fixed category list, and each person's final cost (their total consumption share, regardless of who paid — the same consumed-side number this ticket's net-balance calc already produces internally, now also surfaced on its own rather than only netted against what they paid).
- Live, uncached math for everything except the settled-transfer records themselves — the Balance tab's numbers always reflect the current state of the trip's expenses, recalculated on every view.
- A visible note when the balance includes any pending (unadjusted) expenses, since those numbers might still move once the real statement comes in.
- An empty state (no expenses yet — everyone at zero, nothing to transfer) and an all-settled state (every net balance already at zero, or every transfer already marked settled — no outstanding transfers to show).

## Non-goals

- **Reading bookings (#12/13) for cost data.** Bookings don't carry a price; #14's expenses are the only source of money-in-motion. See the Context section and the clarifying comment left on #15.
- **A provably optimal minimum-transaction solver.** The transfer list comes from a greedy heuristic (repeatedly matching the largest creditor with the largest debtor) — the same approach apps like Splitwise use. Finding the mathematically smallest possible transfer count is NP-hard and not worth the complexity here.
- **A settlement ledger beyond a done/not-done flag per transfer.** Marking a transfer settled just flips it done — no payment method, no timestamp, no partial payments, no un-settle action.
- **Freezing or snapshotting the balance/total numbers at any point** (including when #16 closes a trip). Every number here always computes live off current data — only whether a *transfer* is marked settled is a stored fact; the amounts themselves are never frozen.
- **Gating the Balance tab's visibility, or its computed numbers, on #16's closed-trip state.** The tab is visible and its math is live whether the trip is open or closed. The *only* thing #16's finished state gates is the "Marcar como saldada" action (see Scope) — everything else about this tab is unconditional.
- **Currency conversion.** #15 never converts currencies itself. An *adjusted* expense amount is already in the trip's own currency (#7's `Trip.currency`); a still-*pending* expense's original amount is counted at face value regardless of what currency it was actually logged in — the same numeric-face-value convention #14 already documents for a "Pendiente de ajuste" expense (see Constraints below), not a claim that every amount is already trip-currency.
- **Per-role permission gating** on who can view the Balance tab, or on who can mark a transfer settled. Any trip member can do either, matching every other screen's precedent so far.
- **A per-city breakdown of the absorbed totals.** #14's own Gastos tab already totals a single city's spend; this tab's total/category/per-person numbers are specifically the trip-wide rollup across every stop.
- **A new category list for the breakdown.** Reuses #14's fixed list (Transporte/Alojamiento/Comida/Actividades/Otro) as-is.

## Implementation Strategy

Most of this ticket is pure computation over what #7 and #14 already store — no new persisted data. So Phase 1 builds and locks down that math (the part most worth getting right and testing hard), Phase 2 wires it into a screen, and Phase 3 is the one piece that does need a small amount of real persisted state: which transfers have been marked settled.

1. **Phase 1 — Balance calculation:** the pure functions that turn a trip's expenses + crew into a net-balance-per-person list, a minimal-transfer list, and the absorbed #17 numbers (total spend, category breakdown, standalone per-person-consumed), fully unit tested. No UI, no schema changes.
2. **Phase 2 — Balance tab:** the new trip-hub tab, wired to Phase 1's calculation, with the empty, all-settled, and pending-included states.
3. **Phase 3 — Marking a transfer settled:** the "Marcar como saldada" action, gated on #16's finished state, plus the small persisted record of which transfers are done.

## Constraints & Things to Consider

- Splitting an expense's amount evenly across an odd-sized "who's using it" group can leave a leftover cent (e.g. splitting $10 three ways) — give the leftover to one person deterministically (e.g. the first person in the "who's using it" list, sorted consistently) rather than losing or duplicating a cent. Round to the currency's smallest unit (cents) throughout; never carry floating-point remainders into the transfer math.
- The greedy transfer algorithm: compute every person's net balance, then repeatedly take the largest creditor and largest debtor, transfer `min(creditor's credit, debtor's debt)` between them, and repeat until everyone's within a cent of zero. This produces at most crew-size-minus-one transfers.
- A pending (unadjusted) expense's face-value amount counts toward the balance right away, same as #14 already documents — the Balance tab just needs to visibly flag that some of what it's showing could still change.
- Reuse the Ruta Terracota tokens/components already ported everywhere else — `var(--token)`, terracota focus ring, ≥44px tap targets, `prefers-reduced-motion` collapsing entrance animation.
- Copy is Rioplatense Spanish (vos), taken from the design where it now exists (Balance tab, "Marcar como saldada") and matching that voice where invented ("Todo saldado," the absorbed totals section).
- **Net balance and "final cost per person" are different numbers, both shown on this tab.** Net balance is paid-minus-consumed (what #15 originally computed); final cost per person is the consumed side alone, regardless of who paid (what #17 asked for). Don't conflate them or drop one in favor of the other — expose both, reusing the same underlying consumed-share value for both rather than computing it twice.

## Phases

### Phase 1 — Balance calculation

**What this phase delivers**

A pure calculation module: given a trip's expenses (each with an amount, who paid, and who's using it) and its crew, it returns each person's net balance (paid minus their share of consumed), a minimal-transfer list (who pays whom, how much) using the greedy largest-creditor/largest-debtor heuristic, and the absorbed #17 numbers: a trip-wide total spend, a spend-by-category breakdown (#14's fixed category list), and each person's total-consumed number exposed on its own (the same intermediate value the net-balance calc already produces, just also surfaced directly). No screens, no new Prisma models — this reads #7's crew and #14's expense data as they already exist.

**Acceptance criteria**

- For a set of expenses, each person's net balance equals what they paid minus their even share of every expense they're listed as using.
- The transfer list fully settles every balance to zero (or within a cent, if rounding leftover applies) using no more than crew-size-minus-one transfers.
- A pending (unadjusted) expense's original amount counts toward the balance the same as an adjusted one would.
- An expense whose "who's using it" list doesn't include its payer still credits the payer in full and debits only the people actually using it.
- Zero expenses produces zero balances for everyone and an empty transfer list.
- A group already perfectly balanced (all net balances at zero) produces an empty transfer list.
- Total trip spend equals the sum of every expense's relevant amount across every stop; the category breakdown sums back to that same total, with every one of #14's fixed categories represented (even at $0).
- Each person's standalone consumed number matches the consumed side of their net-balance calculation exactly — same value, exposed twice.

**Things to consider**

- Splitting an odd amount across an odd-sized group needs a deterministic rounding rule (see Constraints) so the same input always produces the same output, and so the sum of every person's share always equals the original expense amount exactly.
- Expose the per-person-consumed value as its own return field from the start, rather than only the netted balance — #17's absorption needs it standalone, not re-derived.

**Tests**

- Unit tests: a simple two-person, one-expense case nets out correctly; a multi-expense, multi-person case with different payers and different "who's using it" subsets nets out correctly; an expense split across an odd-sized group rounds deterministically and sums back to the original amount; a pending expense counts at face value; a fully balanced group produces no transfers; the transfer list never exceeds crew-size-minus-one entries and always fully zeroes every balance; the category breakdown always sums to the total; zero expenses produces all-zero output across every number.

### Phase 2 — Balance tab

**What this phase delivers**

A new "Balance" tab inside #8's persistent trip-hub shell, showing the per-person balance list (paid, consumed, net), the transfer list from Phase 1, and the absorbed #17 numbers (total spend, category breakdown, final cost per person), plus empty, all-settled, and pending-included states.

**Acceptance criteria**

- Opening the Balance tab shows every crew member's paid total, consumed total, and net balance.
- Below that, the transfer list shows each suggested transfer in plain language ("X le transfiere $Y a Z").
- The tab also shows the trip-wide total spend, the category breakdown, and each person's final cost (their consumed total, same number as above, presented as its own line so it reads clearly even for someone who only cares "what did this cost me").
- A trip with zero expenses shows an empty-state message instead of a blank tab.
- A trip whose balances are all already at zero (or every transfer is already marked settled — see Phase 3) shows an all-settled message instead of an outstanding transfer list.
- If any expense counted toward the balance is still pending adjustment, a visible note says so, without blocking or hiding the rest of the numbers.
- The tab is visible and fully functional whether the trip is open or closed (no dependency on #16) — only the "Marcar como saldada" action itself is gated, see Phase 3.

**Things to consider**

- Read-only except for Phase 3's settle action — no controls to edit expenses live here; that stays on the Gastos tab #14 built. Someone who spots a wrong number goes fix the underlying expense, not this screen.

**Tests**

- Vitest + RTL: the balance list renders the right paid/consumed/net numbers for a given set of expenses; the transfer list renders in plain language; the total spend/category breakdown/final-cost numbers render correctly; zero expenses shows the empty state; all-zero balances show the all-settled state; a pending expense in the mix shows the pending note.
- Playwright test: navigating to the Balance tab from the trip hub shows live numbers that update after adding a new expense on the Gastos tab.

### Phase 3 — Marking a transfer settled

**What this phase delivers**

The "Marcar como saldada" action on each transfer in the list, and the small persisted record of which transfers are done. Enabled only once #16 has marked the trip finished; a settled transfer stays in the list (visually marked done) rather than disappearing.

**Acceptance criteria**

- Before the trip is finished, every transfer's "Marcar como saldada" action is disabled (or hidden) — there's no way to mark anything settled yet.
- Once #16 finishes the trip, every outstanding transfer's action becomes available; clicking it persists that specific transfer as settled.
- A settled transfer stays visible in the list, visually distinguished (e.g. greyed out) from outstanding ones — it doesn't disappear or get removed.
- If every transfer in the list is settled, the tab shows the all-settled state.
- Re-computing the balance/transfer list (e.g. after a post-finish expense edit, which #16 still allows) doesn't lose which transfers were already marked settled, as long as the same debtor/creditor/amount transfer still applies; if the underlying numbers change enough that a previously-settled transfer no longer matches any current suggested transfer, don't silently drop the settled record — surface it as historical rather than erroring.

**Things to consider**

- This is the one piece of real persisted state in this ticket — model it as its own small table (trip + debtor + creditor + amount + settled-at), not a field bolted onto the computed transfer list, since the computed list is regenerated fresh on every view.

**Tests**

- Vitest + RTL: the settle action is disabled before finish and enabled after; clicking it marks that transfer done and keeps it visible, greyed out; all-settled state shows once every transfer is done.
- Integration test: marking a transfer settled before the trip is finished is rejected server-side even if the UI were bypassed; a settled transfer's record survives a recomputation of the live balance.

## How to QA

- Open a trip with no expenses yet and confirm the Balance tab shows an empty state, not a blank screen.
- Log a few expenses across different payers, categories, and different "who's using it" subsets (include at least one still-pending, unadjusted expense), then open the Balance tab and confirm each person's paid/consumed/net numbers, the total spend, the category breakdown, and each person's final cost all look right by hand.
- Confirm the transfer list settles everyone up in a small number of transfers, and that following it (on paper) actually zeroes every balance.
- Confirm the pending-expense note shows up while any unadjusted expense is included, and disappears once you adjust it from the Gastos tab.
- Add one more expense that exactly balances the group and confirm the tab switches to the all-settled state with no outstanding transfer list.
- Before finishing the trip, confirm "Marcar como saldada" isn't available on any transfer.
- Finish the trip (#16's action), then mark a transfer settled and confirm it stays visible, greyed out, rather than disappearing.
- Tab through the whole screen with the keyboard only — every focusable control shows the terracota focus ring.

## Rollout & Cleanup

Not applicable — pre-launch, no existing balance feature to migrate off of.
