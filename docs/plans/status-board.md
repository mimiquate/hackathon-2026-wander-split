# wonderSplit Status Board

## Context

[Issue #11](https://github.com/mimiquate/wonder_split/issues/11) asks for "a super visual board to see where each thing in the trip stands" — a kanban-style view with three columns (thinking → urgent → booked) and items movable between them. Per [docs/roadmap.md](../roadmap.md) it's a Phase 4 track, buildable as soon as #8 exists and meant to extend later once #12/#13 land.

#8's plan ([docs/plans/build-the-route.md](./build-the-route.md), Phase 4) already ships the underlying capability for stops: a `status` field (thinking/urgent/booked) per stop, defaulting new stops to "thinking," and an inline chip on each stop row that cycles through the three states on click. That plan's own Non-goals section is explicit that this is deliberate: "the chip here is just the same click-to-cycle control the design shows inline in the stop row — the dedicated board view is #11."

So the open question for this plan was whether to actually build that dedicated board view. Checked the "Armar el viaje" Claude Design project (the same one #7-#23 were all mapped against) end to end via DesignSync — there is no kanban/board/tablero screen anywhere in it. The design's only status-related UI is the inline chip already covered by #8. The design-mapping notes on the issue already flagged this ("implemented as click-to-cycle chip per item, not a literal kanban board") but hadn't confirmed it as a hard gap rather than an oversight in the mapping pass.

Per the call made while grilling this plan: don't invent a board screen's layout, card content, or interaction pattern (drag vs. click, column headers, card design) with no design to build against. That's exactly the kind of decision this repo's plans are supposed to pull from a design, not make up. So this plan doesn't build anything — it documents the gap so it's visible when the Phase 4 plans are reviewed together, and leaves the actual board screen as a follow-up once a design exists for it.

## Scope

- Nothing new ships in this ticket. #8 already delivers the data (`status` field) and the only status-changing interaction the design specs (the inline chip).
- This doc records the gap between the issue's literal ask and what the design actually covers, so it doesn't get lost.

## Non-goals

- **A dedicated kanban/board screen** — columns, movable cards, any new layout. Not present anywhere in the "Armar el viaje" design (confirmed by reading the full design file, not just the screen list). Building one now means inventing UI with no source of truth, which this repo's plans deliberately avoid doing. Deferred until a design exists.
- **Drag-and-drop between columns** — moot until there's a board to drag within. If/when a board screen does get designed, note for whoever designs it: the existing precedent (#8's chip) is click-to-advance, not drag, so a future board should probably default to the same interaction unless the design says otherwise.
- **Extending anything to cover bookings/vouchers** (per the roadmap's "extends once #12/#13 land" note) — moot for the same reason; there's no board to extend yet.
- **Re-scoping or closing issue #11** — left to the user; this plan only surfaces the finding as an issue comment (see below), it doesn't decide the ticket's fate.

## Implementation Strategy

No phases — there's no build here. The only output of this plan is the design-gap flag below and a comment on the issue.

## Design gap (flag for review)

The issue's checklist asks for a literal kanban-style board (columns, move-between-columns). The design that every other Phase 4/earlier ticket was built from doesn't contain that screen — only the inline per-stop chip, which #8 already ships. Two ways to close this gap, left for the user to decide, not decided here:

1. Treat #11 as already satisfied by #8's status field + chip, and park "an actual board view" as a separate future ticket that waits for a design pass.
2. Keep #11 open as-is, and get the "Armar el viaje" design extended with an actual board screen before writing an implementation plan for it.

## How to QA

Nothing to QA beyond what #8's own "How to QA" already covers for the status chip (cycling thinking → urgent → booked on a stop row). No new user-facing behavior ships from this plan.

## Rollout & Cleanup

Not applicable — nothing ships.
