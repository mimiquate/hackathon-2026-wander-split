# Trip-planning implementation roadmap

## Context

The "Armar el viaje" Claude Design project (https://claude.ai/design/p/2e3f39d2-11e3-4040-9983-0f345c015ec3?file=Armar+el+viaje.dc.html) was reviewed screen by screen against the open trip-planning issues. Design notes (which screen maps to which issue, and any gaps found against the checklist) were left as comments on [#7](https://github.com/mimiquate/wonder_split/issues/7)-[#17](https://github.com/mimiquate/wonder_split/issues/17); two screens had no matching issue and got new ones, [#22](https://github.com/mimiquate/wonder_split/issues/22) (home dashboard) and [#23](https://github.com/mimiquate/wonder_split/issues/23) (city notes). This doc doesn't repeat that mapping — it lays out the order to build all of it in, based on what data each screen actually needs from another, not effort or priority. Doesn't cover #1 (landing) or #2 (auth), which are their own track.

## Order

**Phase 1 (sequential foundation):** #7 Create the trip and invite the group — nothing else exists without a trip + crew.

**Phase 2 (parallel, both need only #7):** #22 Home dashboard · #8 Build the route

**Phase 3 (parallel, both need #8):** #9 Trip on the map · #10 Zoom into each city

**Phase 4 (parallel, all need #10):** #23 Notes per city · (#12 Who shows their face vs. who puts the card + #13 The voucher folder — build these two together, they share one dialog) · #11 Status board (can actually start as soon as #8 exists, for stop states, and just gets extended once #12/#13 land, for voucher states)

**Phase 5 (needs #12):** #14 Card statement adjustment — it's an extension of the expense data model #12 introduces

**Phase 6 (parallel, both need #12 + #14):** #15 Who owes whom (the settle-up math needs the "who's using it" field from #12 and the adjusted amounts from #14) · #16 Mark trip finished (only needs expenses to exist, not the settle-up math, so it can run alongside #15 instead of after it)

**Phase 7 (sequential, needs #15 + #16):** #17 Final trip summary — needs both the closed-trip state and the balance numbers

If you've got people to spare, Phase 4 is the widest parallel batch (three independent tracks) — that's the best place to put extra hands once #7 → #8 → #10 are in.
