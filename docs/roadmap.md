# Trip-planning implementation roadmap

## Context

The "Armar el viaje" Claude Design project (https://claude.ai/design/p/2e3f39d2-11e3-4040-9983-0f345c015ec3?file=Armar+el+viaje.dc.html) was reviewed screen by screen against the open trip-planning issues. Design notes (which screen maps to which issue, and any gaps found against the checklist) were left as comments on [#7](https://github.com/mimiquate/wonder_split/issues/7)-[#17](https://github.com/mimiquate/wonder_split/issues/17); two screens had no matching issue and got new ones, [#22](https://github.com/mimiquate/wonder_split/issues/22) (home dashboard) and [#23](https://github.com/mimiquate/wonder_split/issues/23) (city notes). This doc doesn't repeat that mapping — it lays out the order to build all of it in, based on what data each screen actually needs from another, not effort or priority. Doesn't cover #1 (landing) or #2 (auth), which are their own track.

## Order

**Phase 1 (sequential foundation):** #7 Create the trip and invite the group — nothing else exists without a trip + crew.

**Phase 2 (parallel, both need only #7):** #22 Home dashboard · #8 Build the route

**Phase 3 (parallel, both need #8):** #9 Trip on the map · #10 Zoom into each city

**Phase 4 (parallel, all need #10):** #23 Notes per city · (#12 Who shows their face vs. who puts the card + #13 The voucher folder — build these two together, they share one dialog)

~~#11 Status board~~ — closed as not planned: no kanban/board screen exists anywhere in the design, only #8's per-stop status chip (thinking/urgent/booked), which already ships as part of #8. Reopen only if a board screen gets designed later.

**Phase 5 (needs #7 + #10):** #14 Card statement adjustment — the implementation plan found that bookings (#12/#13) carry no price of their own, so #14 owns the entire expense data model from scratch rather than extending one #12 introduces; a booking's real cost gets logged as a #14 expense instead (e.g. under an "Alojamiento" category)

**Phase 6 (parallel, both need #14):** #15 Who owes whom (the settle-up math reads exclusively from #14's expenses — amount, who paid, who's using it — never from booking records) · #16 Mark trip finished (only needs expenses to exist, not the settle-up math, so it can run alongside #15 instead of after it)

**Phase 7 (sequential, needs #15 + #16):** #17 Final trip summary — needs both the closed-trip state and the balance numbers

If you've got people to spare, Phase 4 is the widest parallel batch (three independent tracks) — that's the best place to put extra hands once #7 → #8 → #10 are in.

**Deferred (needs #12/#13 + #14 shipped, blocks nothing):** [#37](https://github.com/mimiquate/wonder_split/issues/37) Link a booking to the expense that represents its real cost — #14's plan left this an open Non-goal since there's no real usage data yet to know if the drift risk (a booking's "who's using it" silently diverging from its logged expense's) is worth a schema change for. Revisit once #12/#13 and #14 have real trip data to judge it against; not on the critical path for #15/#16/#17.
