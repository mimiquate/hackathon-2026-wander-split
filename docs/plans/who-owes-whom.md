# wonderSplit Who Owes Whom

## Context

[Issue #15](https://github.com/mimiquate/wonder_split/issues/15) is the "magic summary": the app crunches every expense and tells the group exactly who needs to transfer what to whom to settle up, using as few transfers as possible.

There's no design to build against here — a comment already on the issue confirms `Armar el viaje.dc.html` has no settle-up/balance screen anywhere; the per-city Gastos tab only totals that one city's own spend. This plan invents the screen's shell, kept simple and in the app's existing visual language rather than over-designed.

An earlier comment on #15 said this ticket should split bookings using the "who's using it" field #12 introduces. That's superseded now: [#12/#13's plan](./booking-attribution-vouchers.md) shipped bookings as attribution/voucher records with no price of their own, and [#14's plan](./expense-tracking-and-adjustment.md) is what actually owns money — amount, who paid, who's using it — for everything in the trip, bookings included (a booking's real cost gets logged as a #14 expense, e.g. under the "Alojamiento" category). So this ticket reads exclusively from #14's expenses, never from bookings. A comment clarifying this is left on #15 alongside this plan.

Per [docs/roadmap.md](../roadmap.md) this is Phase 6, needing #12 (crew/currency by way of #7, really) and #14 (the actual expense data) to exist first. It runs alongside #16 (mark trip finished) rather than after it — the two don't depend on each other.

## Scope

- A pure calculation, given a trip's expenses and crew: each person's net balance (what they paid across all expenses, minus their share of what they consumed), and a minimal-transfer list telling each debtor exactly who to pay and how much.
- Splitting rule: an expense's relevant amount (its adjusted amount if set, otherwise its original logged amount at face value, per #14's "Pendiente de ajuste" handling) divides evenly across its "who's using it" people. Whoever paid it gets credited the full amount; everyone in "who's using it" (payer included, if they're in that list) gets debited their even share.
- A new "Balance" tab on the trip hub, at the same level as #8's route panel and #9's map, showing the per-person balance list and the transfer list.
- Live, uncached math — the Balance tab always reflects the current state of the trip's expenses, recalculated on every view. Nothing here is stored.
- A visible note when the balance includes any pending (unadjusted) expenses, since those numbers might still move once the real statement comes in.
- An empty state (no expenses yet — everyone at zero, nothing to transfer) and an all-settled state (every net balance already at zero — no transfers to show).

## Non-goals

- **Reading bookings (#12/13) for cost data.** Bookings don't carry a price; #14's expenses are the only source of money-in-motion. See the Context section and the clarifying comment left on #15.
- **A provably optimal minimum-transaction solver.** The transfer list comes from a greedy heuristic (repeatedly matching the largest creditor with the largest debtor) — the same approach apps like Splitwise use. Finding the mathematically smallest possible transfer count is NP-hard and not worth the complexity here.
- **Tracking whether a suggested transfer actually happened.** This ticket only produces a live summary ("Juan needs to transfer $50 to María"); it doesn't let anyone mark a transfer as paid or keep a settlement ledger. If that's wanted later, it's a separate ticket.
- **Freezing or snapshotting the balance at any point** (including when #16 closes a trip). The Balance tab always computes live off current data; if a frozen "final" snapshot is ever wanted, that's #17's concern, not this one.
- **Any gating on #16's closed-trip state.** The Balance tab is visible and live whether the trip is open or closed. #15 and #16 don't depend on each other.
- **Currency conversion.** Every expense amount #15 reads is already in the trip's own currency (#7's `Trip.currency`) by the time #14 hands it over — nothing here does its own conversion.
- **Per-role permission gating** on who can view the Balance tab. Any trip member can, matching every other screen's precedent so far.

## Implementation Strategy

There's no new persisted data here — this is pure computation over what #7 and #14 already store, plus one new screen to show it. So this is a two-phase plan: build and lock down the math first (it's the part most worth getting right and testing hard), then wire it into a screen.

1. **Phase 1 — Balance calculation:** the pure functions that turn a trip's expenses + crew into a net-balance-per-person list and a minimal-transfer list, fully unit tested. No UI, no schema changes.
2. **Phase 2 — Balance tab:** the new trip-hub tab, wired to Phase 1's calculation, with the empty, all-settled, and pending-included states.

## Constraints & Things to Consider

- Splitting an expense's amount evenly across an odd-sized "who's using it" group can leave a leftover cent (e.g. splitting $10 three ways) — give the leftover to one person deterministically (e.g. the first person in the "who's using it" list, sorted consistently) rather than losing or duplicating a cent. Round to the currency's smallest unit (cents) throughout; never carry floating-point remainders into the transfer math.
- The greedy transfer algorithm: compute every person's net balance, then repeatedly take the largest creditor and largest debtor, transfer `min(creditor's credit, debtor's debt)` between them, and repeat until everyone's within a cent of zero. This produces at most crew-size-minus-one transfers.
- A pending (unadjusted) expense's face-value amount counts toward the balance right away, same as #14 already documents — the Balance tab just needs to visibly flag that some of what it's showing could still change.
- Reuse the Ruta Terracota tokens/components already ported everywhere else — `var(--token)`, terracota focus ring, ≥44px tap targets, `prefers-reduced-motion` collapsing entrance animation.
- Copy is Rioplatense Spanish (vos), invented here since no design covers this screen — keep it plain and match the voice used elsewhere ("Balance," "Juan le transfiere $50 a María," "Todo saldado").

## Phases

### Phase 1 — Balance calculation

**What this phase delivers**

A pure calculation module: given a trip's expenses (each with an amount, who paid, and who's using it) and its crew, it returns each person's net balance (paid minus their share of consumed) and a minimal-transfer list (who pays whom, how much) using the greedy largest-creditor/largest-debtor heuristic. No screens, no new Prisma models — this reads #7's crew and #14's expense data as they already exist.

**Acceptance criteria**

- For a set of expenses, each person's net balance equals what they paid minus their even share of every expense they're listed as using.
- The transfer list fully settles every balance to zero (or within a cent, if rounding leftover applies) using no more than crew-size-minus-one transfers.
- A pending (unadjusted) expense's original amount counts toward the balance the same as an adjusted one would.
- An expense whose "who's using it" list doesn't include its payer still credits the payer in full and debits only the people actually using it.
- Zero expenses produces zero balances for everyone and an empty transfer list.
- A group already perfectly balanced (all net balances at zero) produces an empty transfer list.

**Things to consider**

- Splitting an odd amount across an odd-sized group needs a deterministic rounding rule (see Constraints) so the same input always produces the same output, and so the sum of every person's share always equals the original expense amount exactly.

**Tests**

- Unit tests: a simple two-person, one-expense case nets out correctly; a multi-expense, multi-person case with different payers and different "who's using it" subsets nets out correctly; an expense split across an odd-sized group rounds deterministically and sums back to the original amount; a pending expense counts at face value; a fully balanced group produces no transfers; the transfer list never exceeds crew-size-minus-one entries and always fully zeroes every balance.

### Phase 2 — Balance tab

**What this phase delivers**

A new "Balance" tab on the trip hub (alongside the route panel and map), showing the per-person balance list (paid, consumed, net) and the transfer list from Phase 1, plus empty, all-settled, and pending-included states.

**Acceptance criteria**

- Opening the Balance tab shows every crew member's paid total, consumed total, and net balance.
- Below that, the transfer list shows each suggested transfer in plain language ("X le transfiere $Y a Z").
- A trip with zero expenses shows an empty-state message instead of a blank tab.
- A trip whose balances are all already at zero shows an all-settled message instead of an empty transfer list.
- If any expense counted toward the balance is still pending adjustment, a visible note says so, without blocking or hiding the rest of the numbers.
- The tab is visible and fully functional whether the trip is open or closed (no dependency on #16).

**Things to consider**

- This is a read-only tab — no controls to edit expenses live here; that stays on the Gastos tab #14 built. Someone who spots a wrong number goes fix the underlying expense, not this screen.

**Tests**

- Vitest + RTL: the balance list renders the right paid/consumed/net numbers for a given set of expenses; the transfer list renders in plain language; zero expenses shows the empty state; all-zero balances show the all-settled state; a pending expense in the mix shows the pending note.
- Playwright test: navigating to the Balance tab from the trip hub shows live numbers that update after adding a new expense on the Gastos tab.

## How to QA

- Open a trip with no expenses yet and confirm the Balance tab shows an empty state, not a blank screen.
- Log a few expenses across different payers and different "who's using it" subsets (include at least one still-pending, unadjusted expense), then open the Balance tab and confirm each person's paid/consumed/net numbers look right by hand.
- Confirm the transfer list settles everyone up in a small number of transfers, and that following it (on paper) actually zeroes every balance.
- Confirm the pending-expense note shows up while any unadjusted expense is included, and disappears once you adjust it from the Gastos tab.
- Add one more expense that exactly balances the group and confirm the tab switches to the all-settled state with no transfer list.
- Tab through the whole screen with the keyboard only — every focusable control shows the terracota focus ring.

## Rollout & Cleanup

Not applicable — pre-launch, no existing balance feature to migrate off of.
