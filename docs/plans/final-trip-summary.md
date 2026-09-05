# wonderSplit Final Trip Summary

## Context

[Issue #17](https://github.com/mimiquate/wonder_split/issues/17) is the "look back on it" screen: once a trip's done, show the total spend, where the money went by category, and what it actually cost each person. A comment already on the issue confirms there's nothing to build against — no summary screen (totals / by-category / per-person) exists anywhere in `Armar el viaje.dc.html`, same gap as [#15](./who-owes-whom.md) and [#16](./trip-finished.md) hit.

This is the last ticket in the [roadmap](../roadmap.md)'s Phase 4-7 sequence — Phase 7, needing both [#15](./who-owes-whom.md) (the settle-up math) and [#16](./trip-finished.md) (the closed-trip state) to exist first, narratively. But it doesn't actually *depend* on #16's closed state to render — same call #15 made, this ticket's new tab is visible and live any time, not gated on the trip being finished, even though the issue's own wording ("once the trip is closed, a summary is shown") reads like it could be closed-only. Consistency with #15's precedent won out.

This also isn't a new calculation from scratch. #15's balance module (see [docs/plans/who-owes-whom.md](./who-owes-whom.md) Phase 1) already computes, for every person, what they paid and their share of what they consumed, on the way to netting those two into a balance. "Final cost per person" here is that same consumed-share number, just surfaced on its own instead of netted against what they paid — a different question ("what did this trip cost me") than #15's ("what do I still owe or get owed"). This plan extends #15's calculation module rather than re-deriving the same sum a second time.

**Open gap, not resolved by this plan (same one #15 flags):** this plan describes the Resumen tab as living "at the same level as #8's route panel, #9's map, and #15's Balance tab" — but no plan (#8, #9, #15, or #16) or ADR actually defines that shared trip-level tab strip/header. It's assumed here, not specified. Needs a small design pass before implementation if it doesn't already exist by then.

## Scope

- A new "Resumen" tab on the trip hub, at the same level as #8's route panel, #9's map, and #15's Balance tab — always visible, whether the trip is open or finished.
- **Total trip spend**: the sum of every expense's relevant amount (adjusted if set, otherwise the original logged amount at face value, per [#14](./expense-tracking-and-adjustment.md)'s "pending" handling) across the whole trip — every stop combined, not just one city's Gastos tab total.
- **Breakdown by category**: that same total, grouped by #14's existing fixed category list (Transporte/Alojamiento/Comida/Actividades/Otro).
- **Final cost per person**: each person's total consumption share across every expense they're listed in "who's using it" for, regardless of who paid — reusing/extending #15's existing per-person-consumed calculation.
- Live, uncached numbers — recalculated on every view, same as #15's Balance tab, since #16 explicitly allows editing and adjusting expenses even after a trip is finished.
- The same "some numbers are still pending adjustment" note #15's Balance tab shows, for the same reason.
- An empty state for a trip with no expenses yet.

## Non-goals

- **Gating the tab on the trip being finished.** The issue's wording could read that way, but this ticket follows #15's precedent instead: always visible, informational any time, not hidden until "Finalizar viaje" is tapped.
- **A frozen snapshot at finish time.** #15's plan explicitly left this decision to #17; it's resolved here as always-live, not a snapshot — a post-finish adjustment (which #16 explicitly still allows) needs to show up here too, not go stale.
- **Reusing #15's net balance as "final cost per person."** They're different numbers. Net balance (paid minus consumed) stays on the Balance tab; this ticket's per-person number is the consumed side only.
- **A new category list.** Reuses #14's fixed list as-is; no new categories invented here.
- **Any editing.** Same as #15's Balance tab, this is read-only — fixing a wrong number means going to the Gastos tab where the underlying expense lives, not here.
- **A per-city breakdown.** #14's own Gastos tab already totals a single city's spend; this ticket is specifically the trip-wide rollup across every stop.
- **Per-role permission gating.** Any trip member can view it, matching every other screen's precedent so far.

## Implementation Strategy

Same shape as #15: get the math right first, then put a screen on top of it. Phase 1 extends #15's existing calculation module instead of writing a second one, since two of #17's three numbers (total spend, per-person cost) are just different rollups of the same expense data #15 already crunches; only the by-category grouping is genuinely new. Phase 2 is the new tab.

1. **Phase 1 — Summary calculation:** extend #15's calculation module with a category-breakdown rollup and a standalone per-person-consumed number (not netted against paid), plus a trip-wide total spend. Fully unit tested. No UI, no schema changes.
2. **Phase 2 — Resumen tab:** the new trip-hub tab, wired to Phase 1, with the empty and pending-included states.

## Constraints & Things to Consider

- Extend #15's calculation module (add the category rollup and expose the existing per-person-consumed intermediate value on its own) rather than writing a second module that re-sums the same expenses — two sources of truth for "how much did this person consume" is exactly the kind of drift worth avoiding.
- Every number here reads from #14's expenses across every stop in the trip, not just one city's — the trip-wide aggregation is the whole point of this ticket, distinct from #14's own per-city Gastos tab total.
- A pending (unadjusted) expense's face-value amount counts toward every one of #17's three numbers right away, same as #15 already does — flag it, don't exclude it.
- Reuse the Ruta Terracota tokens/components already ported everywhere else — `var(--token)`, terracota focus ring, ≥44px tap targets, `prefers-reduced-motion` collapsing entrance animation.
- Copy is Rioplatense Spanish (vos), invented here since no design covers this screen — match the plain voice #15 already established for its own invented copy ("Balance," "Todo saldado").

## Phases

### Phase 1 — Summary calculation

**What this phase delivers**

An extension to #15's calculation module: a trip-wide total spend, a spend-by-category breakdown (using #14's fixed category list), and a per-person total-consumed number exposed on its own (the same intermediate value #15's net-balance calculation already produces internally, just surfaced directly instead of netted against what that person paid). No screens, no new Prisma models — reads #7's crew and #14's expense data across every stop in the trip, the same sources #15 already reads.

**Acceptance criteria**

- Total trip spend equals the sum of every expense's relevant amount (adjusted or pending face-value) across every stop in the trip.
- The category breakdown's totals sum back to the same total trip spend, with every one of #14's fixed categories represented (even at $0, so the UI doesn't have to guess which categories exist).
- Each person's total-consumed number equals their share of every expense they're listed in "who's using it" for, using the same even-split-with-deterministic-rounding rule #15's module already applies — regardless of who paid.
- A pending (unadjusted) expense's original amount counts toward all three numbers, same as #15 treats it.
- Zero expenses produces a $0 total, an all-zero category breakdown, and $0 for every person.

**Things to consider**

- If #15's existing calculation module doesn't already expose the per-person-consumed value on its own (only the netted balance), this phase's job is to refactor that module to expose it, not duplicate the summing logic in a new function.

**Tests**

- Unit tests: a multi-expense, multi-category, multi-person case sums correctly across all three numbers; the category breakdown always sums to the total; a pending expense counts at face value in all three; zero expenses produces all-zero output; a person's consumed total matches the sum of their share across only the expenses they're listed as using, independent of who paid.

### Phase 2 — Resumen tab

**What this phase delivers**

A new "Resumen" tab on the trip hub, alongside the route panel, map, and Balance tab, showing the total trip spend, the category breakdown, and the per-person cost list from Phase 1, plus an empty state and the pending-adjustment note.

**Acceptance criteria**

- Opening the Resumen tab shows the total trip spend, a breakdown by category, and every crew member's total cost for the trip.
- A trip with zero expenses shows an empty-state message instead of a blank tab.
- If any expense counted toward these numbers is still pending adjustment, a visible note says so, without blocking or hiding the rest of the numbers — same treatment as #15's Balance tab.
- The tab is visible and fully functional whether the trip is open or finished (no dependency on #16's state).

**Things to consider**

- This is a read-only tab, same as #15's Balance tab — no controls to edit an expense live here.

**Tests**

- Vitest + RTL: the total, category breakdown, and per-person list render the right numbers for a given set of expenses; zero expenses shows the empty state; a pending expense in the mix shows the pending note.
- Playwright test: navigating to the Resumen tab from the trip hub shows live numbers that update after adding a new expense on the Gastos tab.

## How to QA

- Open a trip with no expenses yet and confirm the Resumen tab shows an empty state, not a blank screen.
- Log a handful of expenses across different categories, payers, and "who's using it" subsets (include at least one still-pending, unadjusted expense), then open Resumen and confirm the total, the category breakdown, and each person's cost look right by hand.
- Confirm the category breakdown's numbers add up to the same total shown at the top.
- Confirm the pending-expense note shows up while any unadjusted expense is included, and disappears once you adjust it from the Gastos tab.
- Finish the trip (#16's action) and confirm the Resumen tab still shows the same live numbers afterward, and that adjusting an expense post-finish still updates it.
- Tab through the whole screen with the keyboard only — every focusable control shows the terracota focus ring.

## Rollout & Cleanup

Not applicable — pre-launch, no existing summary feature to migrate off of.
