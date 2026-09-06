# wonderSplit Status Board

## Status: closed as not planned

[Issue #11](https://github.com/mimiquate/wonder_split/issues/11) is closed as not planned (2026-09-05, grilled with Florencia). It asked for "a super visual board to see where each thing in the trip stands" — a kanban-style view with three columns (thinking → urgent → booked) and items movable between them.

The "Armar el viaje" Claude Design project (the same one #7-#23 were all mapped against) was checked end to end via DesignSync — there is no kanban/board/tablero screen anywhere in it. The design's only status-related UI is the inline per-stop chip that [#8's plan](./4-8-build-the-route.md) already ships (Phase 5): a `status` field (thinking/urgent/booked) per stop, cycling through the three states on click. That plan's own Non-goals section already called this out: "the chip here is just the same click-to-cycle control the design shows inline in the stop row — the dedicated board view is #11."

Decision: rather than invent a board screen's layout, card content, or interaction pattern (drag vs. click, column headers, card design) with no design to build against, #11 is treated as already satisfied by #8's status field + chip. A dedicated board view is deferred — parked as a separate future ticket, to be picked up only if a design for one ever exists (see [docs/roadmap.md](../roadmap.md)).

No code ships from this doc.

## Rollout & Cleanup

Not applicable — nothing ships from this ticket.
