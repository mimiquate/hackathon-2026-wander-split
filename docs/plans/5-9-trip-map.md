# 5 · #9 — wonderSplit Trip on the Map

## Context

[Issue #9](https://github.com/mimiquate/wonder_split/issues/9) ("The trip on the map") wants a way to see the whole route on an interactive map: destinations marked, connected by arrows/lines, with a transportation icon on each connection. It's a sub-issue of the now-closed [#3](https://github.com/mimiquate/wonder_split/issues/3), and per [docs/roadmap.md](../roadmap.md) it's one of the two things that can start once [#8](./4-8-build-the-route.md) exists (the other being #10, which runs in parallel and doesn't block this).

Most of the heavy lifting here is already done. #8 built the `RouteMap` component (see [ADR 0002](../adr/0002-route-map-react-component.md)) and already renders it, with numbered markers and a dashed connecting line, on its own "Ruta — mapa" screen while you're editing the route. #8's plan also left a stub: the panel's "Ver el viaje" button exists but does nothing, "wired to whatever #9 ends up being," because this screen didn't exist yet. So this ticket is really two things: give the trip a dedicated, read-only "view the whole trip" screen (which un-stubs that button and satisfies the first two checklist items for free, since they're already true of the shared map component), and teach that shared map to draw a transportation icon on each connector, now that #8's Phase 5 gives every leg a stored transport mode.

The design ("Armar el viaje" Claude Design project, `Armar el viaje.dc.html`) has a screen for this, "El viaje en el mapa" (see the design-mapping comment on the issue), reusing the same `RouteMap` component in read-only mode. The design actually explores three layout variants for it (a designer-only "Variantes" toggle: `panel`, `timeline`, `full`), but only via that toggle — there's no product decision recorded anywhere for which one ships. `panel` is the toggle's own default, and it reuses the same aside-plus-map shell #8 already built (an aside stop list next to the map) rather than a new full-bleed layout with a floating card — the same call #8 made when it kept `search` as the default way to add cities over the `maptap`/`drag` toggle options. This plan builds `panel` and treats the other two as design exploration, not scope.

The design-mapping comment on the issue also flags the real gap: connections in the design are a plain dashed line with no transportation icon, "depends on the transport-method field from #8" — which now exists.

## Scope

- Un-stubbing #8's "Ver el viaje" button: enabled once the trip has at least one stop, navigating to this new screen.
- The dedicated trip map screen: the same `RouteMap`, in read-only mode, showing every stop as a numbered marker connected in order by the existing dashed route line.
- An aside summary panel next to the map: trip eyebrow line, route signature (city names strung together, or the trip name if there's only one stop), the trip facts strip (stop count / total km / total nights), and one card per stop showing its city, date/night meta, and status chip.
- An "Editar ruta" button in the aside, returning to #8's route screen.
- A transportation icon on each connector segment, added to the shared `RouteMap` component so it shows wherever the map draws connections (this screen and #8's own route-builder map alike), reflecting that leg's stored mode (flight/train/rental car). A leg with no mode chosen yet keeps today's plain dashed line, no icon.

## Non-goals

- **Opening a city's detail screen from here.** The design wires stop cards and map markers to jump into the "Ciudad — detalle" screen, but that's #10, and the roadmap runs #9 and #10 in parallel — #10 may well not exist yet when this ships. Same pattern #8 used for this ticket's own button: stop cards and markers stay visibly clickable but are inert for now, not wired to a route that doesn't exist.
- **The `full` and `timeline` map layouts.** Both are alternate presentations the design explored through its variant toggle (a floating summary card over a full-bleed map, and a vertical timeline list instead of cards). Only the default `panel` aside layout ships here.
- **Any editing from this screen.** Nights, reordering, status cycling, and picking a leg's transport mode all stay #8's job. This screen only reads that data.
- **Duration, cost, or booking logic behind the transportation icon.** It just shows which mode was picked, nothing more.
- **Arrowheads on the connecting line.** Direction is already conveyed by the numbered stop markers, same as #8's own map — no new arrow glyph invented here.

## Implementation Strategy

Ship the dedicated screen first, since it's what un-stubs #8's button and already satisfies "interactive map with marked destinations" and "arrows/connections between destinations" for free (both already true of the shared component). The transportation icon lands second: it only matters once there's a screen showing the whole trip to look at, though because it's a change to the shared component it'll also start appearing on #8's own route-builder map.

1. **Phase 1 — Dedicated trip map screen:** the read-only "view the whole trip" screen, the aside summary panel, and un-stubbing #8's "Ver el viaje" button.
2. **Phase 2 — Transportation icon on each connector:** teach the shared `RouteMap` component to draw the right icon on a leg that has a transport mode set.

## Constraints & Things to Consider

- Reuse the Ruta Terracota tokens/components already ported for auth, the landing page, #7, #8, and #22 — nothing new to decide on tokens, focus rings, or tap targets here.
- Copy is Rioplatense Spanish (vos), taken verbatim from the design where it exists.
- The transportation icon change lives in the shared `RouteMap` component (see [ADR 0002](../adr/0002-route-map-react-component.md)), not in a copy of it, so it shows consistently everywhere the map draws connections rather than just on this new screen.
- This screen has no editing affordance at all — every control either navigates elsewhere (#8's route screen, eventually #10's city screen) or is inert. Keep that boundary crisp; nothing here should grow into a quiet edit path.
- Getting back to the trip list works through the shared header nav's "Viajes" link that #22 already added — this screen doesn't need its own separate "back to home" control.

## Phases

### Phase 1 — Dedicated trip map screen

**What this phase delivers**

A new screen showing the whole trip: the shared map with every stop marked and connected, plus an aside panel with the trip's summary stats and a read-only card per stop. #8's "Ver el viaje" button becomes real and takes you here.

**Acceptance criteria**

- On #8's route screen, "Ver el viaje" is enabled once the trip has at least one stop, and disabled with zero stops.
- Clicking "Ver el viaje" opens this screen for that trip.
- The map shows every stop as a numbered marker, connected in stop order by the dashed route line — a trip with one stop shows just that marker, no line.
- The aside shows the trip eyebrow, the route signature (or the trip name if there's just one stop), the trip facts strip (stop count, total km, total nights), and one card per stop with its city, date/night meta, and status chip.
- "Editar ruta" in the aside returns to #8's route screen for the same trip.
- Clicking a stop card or a map marker doesn't error or navigate anywhere (see Non-goals) — it's visibly inert, not broken.

**Things to consider**

- A trip's stop data (position, dates, status) already exists from #8 — this phase only reads it, no new persistence.

**Tests**

- Vitest + RTL: the aside renders the right trip facts and one card per stop with the right status chip; "Ver el viaje" is disabled at zero stops and enabled at one or more; "Editar ruta" navigates back to the route screen.
- Playwright: the map renders the right number of labeled, numbered markers connected by the dashed route line for a multi-stop trip, and just a single marker with no line for a one-stop trip.

### Phase 2 — Transportation icon on each connector

**What this phase delivers**

A small icon on each connector segment of the shared map, showing the transportation mode (flight/train/rental car) stored for that leg in #8.

**Acceptance criteria**

- A leg with a transport mode set shows the matching icon along its connecting segment.
- A leg with no mode set yet shows the same plain dashed line as before, no icon.
- The icon shows up identically on this screen and on #8's own route-builder map, since both render the same component.
- Reordering or removing stops in #8 doesn't leave an icon pointing at the wrong pair of stops or hanging off a connector that no longer exists — it always reflects the current, live leg list.

**Things to consider**

- Keep the icon itself simple — a small badge sitting at the segment's midpoint is enough; the design has no visual spec for this at all, so there's no existing treatment to match beyond "show which mode it is."

**Tests**

- Playwright: a trip with a mix of set and unset legs shows the right icon on each set leg and a plain dashed line on the unset one; reordering stops moves the icon with its correct leg rather than leaving it attached to the old pair.

## How to QA

- From a trip's route screen (#8) with zero stops, confirm "Ver el viaje" is disabled; add a stop and confirm it becomes clickable.
- Click "Ver el viaje" and confirm you land on the new map screen with every stop marked, numbered, and connected by the dashed line.
- Confirm the aside shows the right stop count/km/nights and a card per stop with its status chip.
- Click "Editar ruta" and confirm you're back on the route screen for the same trip.
- Back on the route screen, set a transportation mode on a leg, then open "Ver el viaje" again and confirm that connector now shows the matching icon, while a leg with no mode set still shows a plain dashed line.
- Reorder the stops on the route screen, open the map again, and confirm the icon followed its correct leg rather than staying attached to the old pair of cities.
- Click a stop card and a map marker on the new screen and confirm nothing happens — no error, no dead navigation.

## Rollout & Cleanup

Not applicable — pre-launch, no existing "view the trip" path to replace. The only existing behavior this touches is un-stubbing #8's disabled button, which isn't a flag or migration concern.
