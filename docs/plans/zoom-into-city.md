# wonderSplit Zoom Into Each City

## Context

[Issue #10](https://github.com/mimiquate/wonder_split/issues/10) is the city-detail screen: tap a city and see everything happening there — hotel, excursions, arrival/departure — in one place. It's a sub-issue of [#3](https://github.com/mimiquate/wonder_split/issues/3) and, per [docs/roadmap.md](../roadmap.md), it runs in parallel with [#9](https://github.com/mimiquate/wonder_split/issues/9) (trip on the map) once [#8](https://github.com/mimiquate/wonder_split/issues/8) (build the route, see [docs/plans/build-the-route.md](./build-the-route.md)) exists — #10 only needs a stop to exist, not #9's full-map view.

The design ("Armar el viaje" Claude Design project, `Armar el viaje.dc.html`) covers this with the **Ciudad — detalle** screen (see the design-mapping comment on the issue): a header (city name, status chip, back button), a city map alongside a 4-tab panel (Plan / Reservas / Gastos / Notas). This ticket only builds the **Plan** tab — a dates/nights card, the map, and the list of places the group has marked in that city (including where they're staying, tagged the same as any other marked place). The other three tabs belong to later tickets: Reservas to [#12](https://github.com/mimiquate/wonder_split/issues/12)/[#13](https://github.com/mimiquate/wonder_split/issues/13), Gastos to [#14](https://github.com/mimiquate/wonder_split/issues/14)-[#17](https://github.com/mimiquate/wonder_split/issues/17), Notas to [#23](https://github.com/mimiquate/wonder_split/issues/23).

Two real gaps between the design and a shippable product drove some decisions here (see Constraints): the design's own "add a place" search is a hardcoded list of a handful of landmarks per city, useless for a real trip anywhere in the world, so this plan replaces it with a live, city-scoped search ([ADR 0007](../adr/0007-mapbox-search-box-city-scoped-places.md)). And the design's map is a bare SVG pin-plot with no real streets at all, which this plan upgrades to a real basemap ([ADR 0008](../adr/0008-city-map-mapbox-gl-basemap.md)).

## Scope

- The city-detail screen: a header with a back button, the city name, its status chip (read-only here — cycling it stays #8's job), and a line of computed date range / night count / stop position ("12–14 oct · 2 noches · parada 1 de 3").
- Entry point: clicking a stop row in #8's existing route panel opens this screen for that city. (#8's plan didn't cover this hand-off — see Constraints.)
- The 4-tab strip (Plan / Reservas / Gastos / Notas), with tab counts where the design shows them (marked-places count on Plan, vouchers count on Reservas, notes count on Notas). Only Plan renders real content; the other three are present but inert, same treatment auth gave its inert account-menu items.
- The Plan tab's dates/nights card: the same nights +/− stepper #8's route panel has, operating on the same stop, shown here too for convenience.
- The Plan tab's map: every place marked in this city, pinned on a real basemap ([ADR 0008](../adr/0008-city-map-mapbox-gl-basemap.md)), color-coded by kind (alojamiento/plan/idea/transporte), framed initially to fit all of the city's pins, with normal pan/zoom after that.
- The Plan tab's place list: one row per marked place (name, kind), synced with the map — clicking a row or a pin highlights the other.
- Adding a place: a city-scoped live search ([ADR 0007](../adr/0007-mapbox-search-box-city-scoped-places.md)) for landmarks/venues/hotels in the active city. Picking a result opens a small confirm step — name (pre-filled from the result, editable) and a kind picker (Alojamiento/Plan/Idea/Transporte) — before it's saved as a pin.
- Removing a place: deletes it from the trip's data for that city, no confirmation dialog (matches the design's single-click remove).

## Non-goals

- **Reservas, Gastos, and Notas tab content.** The tab strip ships with all 4 tabs; only Plan has anything behind it. The other three are inert placeholders until #12/#13, #14-17, and #23 respectively.
- **A separate arrival/departure time field.** The issue checklist asks to "show arrival/departure," but the computed date range (this stop's start date = arrival, start + nights = departure) already covers it — no new field invented. Matches the known-gap note already on the issue.
- **Editing a place's name or kind after it's saved.** Only add and remove exist, matching the design (no edit affordance on a place row). Getting the kind wrong means removing it and re-adding.
- **Tying the "alojamiento" pin to a real booking/voucher.** A place marked "Alojamiento" here is just a pin like any other — connecting it to an actual reservation/voucher record is #12/#13's job.
- **A hardcoded per-city place list or a manual tap-to-drop-pin flow.** The design has both (a static POI list and an unwired tap-the-map dialog); neither ships. Search is the only way to add a place — see [ADR 0007](../adr/0007-mapbox-search-box-city-scoped-places.md).
- **Restricting which kinds a city can have** (e.g. "only one Alojamiento pin"). Any number of any kind, matching the design's unconstrained data.
- **Geocoding/search coverage guarantees.** Same non-goal #8 already carries — Mapbox's result set is what it is.
- **A stacked/mobile layout redesign beyond basic reflow.** The design only ever shows the side-by-side map+panel layout; a real mobile breakpoint pass (if the split layout doesn't reflow acceptably) is a follow-up, not blocking here.

## Implementation Strategy

The place data and search have to exist before any of the screen works, so that's Phase 1, same shape as #7/#8/auth. From there the screen gets built up in the order a user actually hits it: the shell and how you get into it first, then the read-only Plan tab content, then the ability to add and remove places.

1. **Phase 1 — Place data model & city-scoped search:** Prisma schema for a marked place (stop, label, kind, lat/lon), the Mapbox Search Box-backed search function scoped to the active city, and the add/remove server functions. No UI yet.
2. **Phase 2 — Screen shell & entry point:** the city-detail header, the 4-tab strip (Plan wired, the rest inert), and the click-to-open hand-off added onto #8's route-panel stop rows.
3. **Phase 3 — Plan tab: dates & map:** the nights stepper card and the city map showing every marked place, framed to fit, with pan/zoom and pin/row highlight sync.
4. **Phase 4 — Add & remove a place:** the city-scoped search, the name+kind confirm step, and removing a pin.

## Constraints & Things to Consider

- Reuse the Ruta Terracota tokens/components already ported for auth, the landing page, #7, and #8 — `var(--token)`, terracota focus ring, ≥44px tap targets, `prefers-reduced-motion` collapsing entrance animation.
- Copy is Rioplatense Spanish (vos), taken verbatim from the design where it exists; the confirm-step copy (invented, since the design has no live-search result flow) matches that voice.
- Both Mapbox integrations ([ADR 0007](../adr/0007-mapbox-search-box-city-scoped-places.md), [ADR 0008](../adr/0008-city-map-mapbox-gl-basemap.md)) proxy through the server the same way #8's city search does — no Mapbox key embedded in the client bundle.
- A marked place belongs to a stop (city instance), not a bare city name — matches how #8 already models stops, and keeps two visits to the same city (if that's ever possible) from sharing pins.
- The status chip shown in this screen's header is read-only — cycling thinking/urgent/booked stays an action that lives on #8's stop rows and map cards, not duplicated here.

## Phases

### Phase 1 — Place data model & city-scoped search

**What this phase delivers**

A Prisma model for a marked place (stop, label, kind, lat/lon), server-side add/remove functions, and a search function that calls Mapbox's Search Box API biased to the active stop's coordinates. No screens yet.

**Acceptance criteria**

- Adding a place to a stop persists it with its label, kind, and coordinates.
- Removing a place deletes it outright — a removed place doesn't reappear on reload.
- The search function returns real results (name + coordinates) for a query, biased toward the given city's coordinates rather than global results (mocked Mapbox response in tests).
- Places are scoped per stop — two different stops never share or leak each other's places.

**Things to consider**

- Model places as their own table (stop + label + kind + lat/lon), not embedded JSON on the stop, matching the pattern #7/#8 used for `TripMembership`/stops.

**Tests**

- Integration tests against the data functions directly: adding persists the right fields; removing deletes and doesn't resurrect on refetch; the search function returns city-biased results for a known query (mocked Mapbox response); places for one stop never show up under another.

### Phase 2 — Screen shell & entry point

**What this phase delivers**

The city-detail screen itself: back button, city name, read-only status chip, the computed date-range/nights/stop-position line, and the 4-tab strip with Plan active and wired, Reservas/Gastos/Notas present but inert. Also the hand-off: clicking a stop row in #8's route panel now opens this screen for that city.

**Acceptance criteria**

- Clicking a stop row in the route panel opens this screen showing that city's name, status chip, and date/nights/position line.
- "Volver" returns to wherever the user came from (the route panel, or #9's map once that exists) rather than a hardcoded destination.
- All 4 tabs render; clicking Reservas, Gastos, or Notas does nothing yet (no dead link/error — same treatment as auth's inert menu items); Plan shows real content.
- Tab counts show real numbers where #10's own data exists (Plan's marked-places count) and `0`/hidden for tabs with no data source yet.

**Things to consider**

- This is a small, additive change to #8's already-planned route-panel stop rows (an `onClick` that navigates here), not a rework of that screen.

**Tests**

- Vitest + RTL: the header renders the right city name/status/date line for a given stop; clicking each inert tab doesn't navigate or error; Plan's tab count matches the number of marked places.
- Playwright test: clicking a stop row in the route panel lands on this screen for the right city; "Volver" returns to the route panel.

### Phase 3 — Plan tab: dates & map

**What this phase delivers**

The dates/nights card (same nights +/− stepper #8 already has, operating on the same stop) and the city map: every marked place for this stop, pinned on a real basemap ([ADR 0008](../adr/0008-city-map-mapbox-gl-basemap.md)), color-coded by kind, initially framed to fit all pins, with normal pan/zoom after. Clicking a pin or its matching row in the place list highlights the other.

**Acceptance criteria**

- Bumping nights up/down here updates the shown date range immediately and persists, the same way it does from #8's route panel.
- The map shows one pin per marked place, colored by kind, initially framed so every pin is visible.
- After the initial frame, the user can freely pan and zoom the map.
- Clicking a pin highlights its row in the place list, and clicking a row highlights its pin; only one place is highlighted at a time.
- A city with zero marked places yet shows an empty map (still centered/framed on the city) and an empty-state message in the place list instead of an empty white box.

**Things to consider**

- Reuse #8's existing nights-bump function against the same stop record — don't fork a second code path for the same mutation.

**Tests**

- Vitest + RTL: the nights stepper updates the shown date range and calls the same mutation #8's stepper does; the place list renders one row per marked place with the right kind label; clicking a row sets the highlighted pin and vice versa; zero places shows the empty state.
- Playwright test (real map rendering): the map frames to fit all pins on load and supports pan/zoom afterward.

### Phase 4 — Add & remove a place

**What this phase delivers**

The city-scoped search input, the name+kind confirm step after picking a result, and removing an existing place.

**Acceptance criteria**

- Typing in the search box shows results scoped to the active city after a debounce.
- Picking a result opens the confirm step with the result's name pre-filled (editable) and a kind picker (Alojamiento/Plan/Idea/Transporte).
- Saving the confirm step adds the place as a new pin/row with the chosen name and kind; canceling discards it without adding anything.
- Removing a place deletes it from both the map and the list immediately, no confirmation prompt.

**Tests**

- Vitest + RTL: search results render from a mocked search response; picking one opens the confirm step pre-filled with that result's name; saving adds the place with the chosen kind; canceling adds nothing; removing a place removes its pin and row together.
- Integration test: saving a confirmed place persists it against the right stop with the chosen kind.

## How to QA

- From #8's route panel, click a stop row and confirm you land on that city's detail screen with the right name, status chip, and date/nights/position line.
- Click through all 4 tabs; confirm Reservas/Gastos/Notas do nothing and Plan shows the map + place list.
- Bump the nights stepper up and down and confirm the date range updates immediately, matching what you'd see if you changed it from the route panel instead.
- Search for a real landmark or hotel in that city, pick a result, fill in/edit the name, pick a kind, and save; confirm it shows up as a colored pin on the map and a row in the list.
- Click the new pin and confirm its row highlights, then click a different row and confirm the pin highlights instead.
- Pan and zoom the map manually and confirm it responds like a normal map.
- Remove a place and confirm it disappears from both the map and the list with no confirmation prompt.
- Click "Volver" and confirm it returns you to the route panel you came from.
- Tab through the whole screen with the keyboard only — every focusable control shows the terracota focus ring.

## Rollout & Cleanup

Not applicable — pre-launch, no existing city-detail path to migrate off of.
