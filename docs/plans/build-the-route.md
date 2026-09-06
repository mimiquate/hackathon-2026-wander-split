# wonderSplit Build the Route

## Context

[Issue #8](https://github.com/mimiquate/wonder_split/issues/8) is where a trip actually becomes an itinerary: set the trip dates, pick which cities to visit and how many nights in each, and say how you get from one to the next. It's a sub-issue of [#3](https://github.com/mimiquate/wonder_split/issues/3) ("Trip setup and itinerary building") and, per the phase plan in [docs/roadmap.md](../roadmap.md), it's the first thing that can start once [#7](../plans/create-trip-invite.md) exists — nothing about cities/route exists without a trip and crew first.

The design ("Armar el viaje" Claude Design project, `Armar el viaje.dc.html`) covers this with the **Ruta — panel** screen (see the design-mapping comment on the issue): search-to-add cities, a draggable stop list with a per-stop nights stepper (dates recompute automatically), a max-10-stops guard, and — sharing the same screen — a per-stop status chip (thinking/urgent/booked) that cycles on click. The design has no control at all for transportation method between stops; that's a real gap this plan has to invent a place for. This plan also reuses the `RouteMap` component the landing page's Phase 5 already built (see [ADR 0002](../adr/0002-route-map-react-component.md)), rendering it alongside the panel in an interactive "tap to add" mode — the same component #9 later reuses read-only for the full map view.

This is also the first screen in the flow where the design's persistent in-trip chrome appears — the trip name/dates header plus the Ruta/Grupo/Gastos/Balance tab bar (`showTripBar`/`tripTabs` in the design's state) that #9, #14, #15, and #16's plans all assume exists but none of them build. Since it first turns on at this screen (the design gates it off during #7's "Nuevo viaje"/"Invitar" onboarding steps and turns it on starting here), this ticket owns building that shared shell; later tickets render their tab's content inside it rather than rebuilding the chrome.

## Scope

- The onboarding hand-off from #7's invite panel into the route builder: a "Continuar" action that advances the existing new-trip/invite/route stepper to its third step, since #7 stopped at "a trip exists with a crew."
- The persistent in-trip header and Ruta/Grupo/Gastos/Balance tab bar (the shared shell #9/#14/#15/#16 all render their own tab inside): the trip name/dates row (reusing #7's "Datos del viaje" edit dialog) and the pill tab strip. This screen renders as the "Ruta" tab's content; other tickets are responsible only for their own tab's content, not the chrome around it.
- Search-to-add cities: a debounced worldwide city search (see [ADR 0006](../adr/0006-mapbox-geocoding-city-search.md)) with results showing city + country, added to the trip on click. **A city already in the route can be added again as a separate, non-consecutive stop** (e.g. a return-flight hub city) — stop identity is the stop itself, never the city name, so duplicates are allowed and never merged or deduped anywhere (this screen, #9's map, #10's per-stop view, or any future summary).
- The stop list: each stop shows its city, its computed date range and night count, a nights +/− stepper, and a remove action. Dates cascade automatically off the trip's start date (set at creation and, since #7, editable afterward — see Constraints) plus each stop's nights — there's no separate "trip dates" control in this screen, since the design doesn't have one and #7 owns the start date.
- A max of 10 stops per trip, with a warning banner once hit and the add-city search disabled past that point.
- Reordering stops: native drag-and-drop for pointer devices (matching the design), plus up/down move buttons as a touch-friendly fallback, since the design's own drag interaction doesn't work on mobile at all.
- A per-stop status chip (thinking/urgent/booked) that cycles through the three states on click, defaulting a newly added stop to "thinking." It's part of this screen in the design, so it ships here — later tickets (like #11) build further status-driven views on top of the same field.
- A transportation-method field between each consecutive pair of stops (flight/train/rental car), shown as a small connector control in the stop list since the design has no field for it at all — invented here in the same spot #9 will need it for its connector icon.
- The aggregate footer stats (total km, nights, date range) and the "Ver el viaje" exit button, wired to whatever #9 ends up being (disabled/hidden until #9 exists — see Non-goals).

## Non-goals

- **The "Ver el viaje" destination screen itself.** That's #9's map view. This ticket's button is a stub (disabled, or simply not shown) until #9 lands — not a placeholder screen built here.
- **App-level nav across trips** (a header/dropdown for switching trips, profile/account settings). That's a separate, still-undesigned piece of work — the design's old authenticated top-nav (Viajes/Gastos/Vouchers/Perfil) turned out to be dead code, unrendered anywhere once the in-trip tab bar exists. This ticket only builds the *in-trip* Ruta/Grupo/Gastos/Balance tab bar (see Scope), which is itself the always-available way back into route editing once inside a trip — no separate "edit route" entry point needed beyond clicking its "Ruta" tab.
- **Per-leg transportation logic beyond storing the choice.** No duration/cost estimation, no booking integration — just picking flight/train/rental car per leg and showing it.
- **A default/suggested transportation mode** (e.g. auto-picking "flight" over a long distance). Every leg starts unset and the user picks explicitly.
- **Geocoding coverage guarantees.** Mapbox's result set is what it is; an extremely obscure destination not in their index is out of scope to work around.
- **Editing the trip's name, start date, or currency from this screen.** Those stay owned by #7's "Datos del viaje" dialog (reused here as part of the shared header, see Scope) — this screen's stop dates just consume the start date and recompute automatically when it changes, they don't provide their own way to change it.
- **A literal kanban/status-board view.** The chip here is just the same click-to-cycle control the design shows inline in the stop row — the dedicated board view is #11.

## Implementation Strategy

The city-search + stop data has to exist before any of the screen works, so that's Phase 1, same shape as how auth and #7 both started with their data layer. From there the panel gets built up in the order a user actually interacts with it: search and add cities first (the core of the ticket), then the ability to fix a mistake (reorder, remove), then the two per-stop details the design also carries on this screen (status, then the invented transportation field), since neither blocks the others.

1. **Phase 1 — Stop data model & city search:** Prisma schema for a trip's ordered stops (city, country, coordinates, nights, position, status, transport-from-previous), the Mapbox-backed search endpoint, and the server-side add/remove/reorder/nights functions. No UI yet.
2. **Phase 2 — Persistent trip header & tab bar:** the shared in-trip shell (trip name/dates row + Ruta/Grupo/Gastos/Balance tab bar) every later trip-level ticket renders inside.
3. **Phase 3 — Route panel: search, add, and the stop list:** the "Ruta — panel" screen wired to Phase 1, rendered as the "Ruta" tab's content inside Phase 2's shell — search results, adding a stop (including a duplicate city as its own separate stop), the nights stepper, remove, the max-10 guard, and the aggregate footer stats. Includes the hand-off from #7's invite panel into this screen.
4. **Phase 4 — Reorder:** drag-and-drop for pointer devices plus up/down buttons for touch, both writing the same reordered stop list.
5. **Phase 5 — Per-stop status:** the click-to-cycle thinking/urgent/booked chip on each stop row.
6. **Phase 6 — Transportation between stops:** the flight/train/rental-car connector control between consecutive stop rows.

## Constraints & Things to Consider

- Reuse the Ruta Terracota tokens/components already ported for auth, the landing page, and #7 — `var(--token)`, terracota focus ring, ≥44px tap targets, `prefers-reduced-motion` collapsing entrance animation.
- Copy is Rioplatense Spanish (vos), taken verbatim from the design where it exists; anything invented (the transportation control's own copy) matches that voice.
- The Mapbox API key is a server-side secret — the app's server proxies the search, the client never calls Mapbox directly with a key embedded in the bundle.
- Stop order is a first-class, persisted field (not inferred from insertion order) so drag/up-down reordering, nights recompute, and the eventual map/city screens (#9/#10) all read the same sequence.
- A stop's computed date range is always derived (trip start date + cumulative prior nights), never stored as its own start/end fields — recomputing avoids a stale date sitting next to an edited earlier stop's nights, and means #7's start-date edit (see its Phase 6) needs no special handling here beyond reading whatever the trip's current start date is.
- A stop's identity is its own row (an opaque id), never the city name — the city search's "already in the route" check (if any) is purely informational, never a hard block, since the same city can legitimately appear twice as separate, non-consecutive stops.

## Phases

### Phase 1 — Stop data model & city search

**What this phase delivers**

Prisma models for a trip's stops (city, country, lat/lon, nights, position, status, and the transport mode used to arrive from the previous stop), plus the server-side functions everything downstream calls into: add a stop, remove a stop, reorder stops, change a stop's nights, cycle a stop's status, set a leg's transport mode, and a Mapbox-backed city search. No screens yet.

**Acceptance criteria**

- Adding a stop to a trip persists it with the next position, default status `thinking`, and 1 night.
- Removing a stop closes the gap in position for the remaining stops without leaving a hole.
- Reordering persists the new position for every affected stop, not just the one moved.
- The city search function returns real worldwide results (name, country, lat/lon) for a query, backed by Mapbox.
- A trip capped at 10 stops rejects an 11th add server-side, not just in the UI.

**Things to consider**

- Model stops as their own ordered table (trip + city + position, not embedded JSON on `Trip`) so reordering and per-stop fields (nights, status, transport) are independently queryable and updatable, matching the pattern #7 used for `TripMembership`.

**Tests**

- Integration tests against the data functions directly: adding sets position/defaults correctly; removing reindexes remaining positions; reordering updates every affected stop; an 11th add on a full trip is rejected; the search function returns results for a known city query (mocked Mapbox response).

### Phase 2 — Persistent trip header & tab bar

**What this phase delivers**

The shared in-trip shell: the trip name/dates row (reusing #7's "Datos del viaje" edit dialog) and the Ruta/Grupo/Gastos/Balance pill tab bar. Renders around whatever the active tab's content is — starting with Phase 3's route panel, and later #9/#14/#15/#16's own tab content.

**Acceptance criteria**

- The header and tab bar render for any trip that's past #7's onboarding (i.e. has left the "Nuevo viaje"/"Invitar" steps), on every trip-level screen.
- Clicking a tab switches the active content without a full page reload; the "Ruta" tab is selected by default when arriving via #7's "Continuar" hand-off.
- The trip name/dates row opens #7's "Datos del viaje" dialog on click, exactly as #7 specifies.
- Tabs whose content doesn't exist yet in this codebase (Grupo/Gastos/Balance, until their own tickets land) can render a stub rather than blocking this phase — the chrome and navigation are what this phase owns.

**Tests**

- Vitest + RTL: the tab bar renders all four tabs; clicking one switches the active tab without navigating away; the header click opens the dates dialog.

### Phase 3 — Route panel: search, add, and the stop list

**What this phase delivers**

The "Ruta — panel" screen: the debounced city search with its results dropdown, clicking a result adds it to the stop list, each stop row shows its computed dates and a nights +/− stepper, a remove action, the max-10-stops warning banner once hit, and the footer's aggregate stats (stop count, total km, total nights, date range). Also the "Continuar" hand-off from #7's invite panel that lands the trip creator here.

**Acceptance criteria**

- Typing in the search box shows matching cities (name + country) after a debounce; clicking one adds it as a new stop with 1 night and status "thinking," and clears the search.
- Adding a city already in the trip creates a second, independent stop (its own id, own nights, own position) — not a no-op, and never merged with the existing one.
- Each stop shows its computed date range and night count, both of which update immediately (no reload) when nights change anywhere earlier in the list.
- Hitting 10 stops shows the warning banner and disables adding further cities; removing a stop re-enables it.
- The footer shows the right total stop count, total nights, and total distance for the current stop list.
- From the invite panel, "Continuar" lands the user on this screen for their new trip.

**Things to consider**

- Total km, like the design's own `haversine` helper, is a straight-line distance between consecutive stops — not a routing-API driving/flying distance. Good enough for the aggregate stat this screen shows; not meant to be an accurate travel-time estimate.

**Tests**

- Vitest + RTL: search results render from a mocked search response; clicking a result adds the stop and clears the query; adding a city already in the trip creates a second independent stop rather than being blocked; nights stepper updates the shown date range for every later stop; the 10th add shows the warning and blocks an 11th until one's removed.
- Integration test: the invite-panel "Continuar" action routes into this screen for the right trip.

### Phase 4 — Reorder

**What this phase delivers**

Drag-and-drop reordering of stops for pointer devices, matching the design, plus up/down move buttons on each row so reordering also works on touch.

**Acceptance criteria**

- Dragging a stop to a new position persists the new order and recomputes every stop's dates.
- The up/down buttons move a stop one position at a time, disabled at the top/bottom edges respectively, and persist + recompute the same way drag does.
- Both paths produce the same end state — no divergent "drag order" vs. "button order."

**Tests**

- Playwright test: dragging a stop to a new position updates the rendered order and the shown dates for stops after it.
- Vitest + RTL: the up/down buttons move a stop, are disabled at the respective edge, and call the same reorder function drag uses.

### Phase 5 — Per-stop status

**What this phase delivers**

The click-to-cycle status chip (thinking → urgent → booked → thinking) on each stop row.

**Acceptance criteria**

- Clicking a stop's chip advances it to the next state in the cycle and persists it.
- A newly added stop always starts at "thinking."
- Clicking the chip doesn't also trigger the row's other click behavior (opening the stop, dragging it).

**Tests**

- Vitest + RTL: clicking the chip cycles through all three states in order and stops the click from bubbling to the row.

### Phase 6 — Transportation between stops

**What this phase delivers**

A small connector control between each consecutive pair of stops in the list, letting the user pick flight, train, or rental car for that leg.

**Acceptance criteria**

- Every leg (the space between two consecutive stops) shows a transportation picker, starting unset.
- Picking a mode persists it against that specific leg (i.e. against the later stop of the pair, as "how I got here").
- Reordering stops doesn't carry a leg's transport choice along with the wrong pair — a leg's mode is tied to its position in the sequence, not to a specific city.
- Removing a stop doesn't leave an orphaned transport choice hanging off a leg that no longer exists.

**Things to consider**

- Since a leg's transport is stored as "how I arrived here" on the later stop, reordering has to make clear whether the picked mode should reset for legs the reorder changes (recommended default: reset the leg's transport when the stops on either side of it change, rather than silently keeping a stale choice).

**Tests**

- Vitest + RTL: each leg renders its own independent picker; picking a mode updates that leg only.
- Integration test: reordering stops around an existing leg resets that leg's transport rather than misattributing it; removing a stop cleans up its leg's transport state.

## How to QA

- From a fresh trip (post-invite), click "Continuar" and confirm you land on the route builder, with the Ruta/Grupo/Gastos/Balance tab bar visible and "Ruta" selected.
- Search for a city (try one from a different continent than the design's Iberian cities) and add it; confirm it appears in the stop list with 1 night and "Lo estamos pensando."
- Add the same city again and confirm it appears as a second, separate stop rather than being blocked or merged.
- Bump its nights up and down and confirm the shown date range updates immediately.
- Add cities up to 10 (counting each duplicate as its own stop) and confirm the 11th is blocked with the warning banner; remove one and confirm you can add again.
- Drag a stop to reorder it, then use the up/down buttons on another stop, and confirm both update the list and every affected stop's dates.
- Click a stop's status chip repeatedly and confirm it cycles thinking → urgent → booked → thinking.
- Set a transportation mode on a leg, reorder the stops around it, and confirm the leg's transport choice doesn't silently attach to the wrong pair.
- Remove a stop involved in a leg with a transport mode set and confirm nothing errors.
- Tab through the whole screen with the keyboard only — every focusable control shows the terracota focus ring.
- Shrink to a mobile-width viewport and confirm you can still reorder stops using the up/down buttons.

## Rollout & Cleanup

Not applicable — pre-launch, no existing route-building path to migrate off of.
