# wonderSplit Final Trip Summary

## Status: closed as not planned, folded into #15

[Issue #17](https://github.com/mimiquate/wonder_split/issues/17) is closed as not planned (2026-09-06, grilled with Florencia). The "Armar el viaje" design was refreshed since this plan was first written, and it now has a real Balance screen (see [who-owes-whom.md](./who-owes-whom.md)) — but still no separate "Resumen"/summary tab or screen anywhere. The design's own trip-fact data (`tripFactsResumen`: total spend, per-traveler share) renders directly inside the Balance tab instead of a distinct screen.

Decision: rather than keep inventing a standalone summary screen with no design to build against (same reasoning #11's [status-board.md](./status-board.md) already applied to that gap), #17's three checklist items fold permanently into #15's scope:

- **Total trip spend** and **breakdown by category** — extend #15's Balance tab with these rollups.
- **Final cost per person** — #15's calculation module already computes each person's consumed share on the way to netting a balance; #15's plan now surfaces that value directly on the Balance tab too, alongside (not replacing) the net-owed number.

No code ships from this doc. See [who-owes-whom.md](./who-owes-whom.md) for the actual implementation plan covering this scope.

## Rollout & Cleanup

Not applicable — nothing ships from this ticket.
