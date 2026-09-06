# 6 · #23 — wonderSplit City Notes

## Context

[Issue #23](https://github.com/mimiquate/wonder_split/issues/23) is a free-text notes board per city — heads-up, reminders, warnings the group leaves for each other ("the Airbnb has four unlit steps, bring a flashlight"). It didn't map to any original issue checklist; it got added fresh once the design review turned up a "Notas" tab with no ticket behind it (see [docs/roadmap.md](../roadmap.md)).

[Zoom into each city](./5-10-zoom-into-city.md) (#10, already built) shipped the city-detail screen's 4-tab strip — Plan / Reservas / Gastos / Notas — but left Notas inert on purpose, a placeholder tab with a `0`/hidden count and no content behind it. This plan is what makes that tab real. It's one of three tracks running in parallel in Phase 4 (alongside #11 status board and #12/#13 booking-attribution + vouchers, each getting its own plan) — all three only need #10 to exist, and don't depend on each other.

The design ("Armar el viaje" Claude Design project, `Armar el viaje.dc.html`) covers this with the **Ciudad — detalle → Notas** tab: a card titled "Notas del grupo," a flat list of notes (avatar, note text, name + relative timestamp like "hace 2 días" underneath), and a single-line input with a "Mandar" button at the bottom to add a new one. The mock data always attributes new notes to a hardcoded "Juan" — standing in for "whoever's logged in," not a real author picker.

## Scope

- The Notas tab on the city-detail screen (#10) goes from inert to real: it lists every note left for that city, oldest first, each showing the author's avatar/name (per-trip identity, same as everywhere else in the app) and a human relative timestamp ("hace 2 días," "hace 4 horas," "recién").
- An input + "Mandar" button at the bottom of the tab adds a new note, attributed to whoever's logged in, appended to the bottom of the list immediately.
- The tab strip's Notas count (already wired by #10 as a placeholder) shows the real note count for that city.
- Any crew member can add a note, and every note is visible to the whole crew (per the issue's own checklist) — no per-note visibility or targeting.

## Non-goals

- **Editing or deleting a note after posting.** The design's Notas card only has an add affordance ("Mandar"); no edit or delete control shows on a note row. Same treatment #10 gave marked places (add/remove only, no edit) — here it's add-only, not even remove.
- **Threaded replies or reactions.** It's a flat chronological list in the design, nothing more.
- **Live/real-time delivery of a note to other viewers without a refresh.** Nothing else in this app pushes updates over a socket; a note shows up for other viewers on their next load of the tab, same as every other list in the product so far.
- **Rich text, attachments, or markdown in a note.** The design's composer is a single plain-text `Input` — no formatting, no images, no @mentions.
- **Private or per-person-targeted notes.** The issue explicitly says notes are "visible to the whole crew" — there's no scoped/DM-style note.
- **A character limit or draft-saving beyond the current session.** Not shown in the design; the input just clears after a successful send.

## Implementation Strategy

Small, self-contained ticket — one phase for the data model, one for wiring #10's already-existing (but inert) tab to it. No earlier read-only slice makes sense to ship separately here, since the tab needs both the list and the composer to be worth opening at all.

1. **Phase 1 — Note data model:** Prisma model for a city note (stop, author, text, timestamp) plus the add/list server functions.
2. **Phase 2 — Notas tab: list & add:** wire #10's inert Notas tab to real data — the note list, the composer, the empty state, and the tab count.

## Constraints & Things to Consider

- Reuse the Ruta Terracota tokens/components already ported everywhere else (`var(--token)`, terracota focus ring, ≥44px tap targets, `prefers-reduced-motion` handling).
- Copy is Rioplatense Spanish (vos), taken from the design where it exists ("Notas del grupo," "Escribí algo para el grupo," "Mandar").
- A note belongs to a stop (a city instance on this specific trip), not a bare city name — same modeling call #10 made for marked places, and for the same reason: two visits to the same city, if that's ever possible, shouldn't share notes.
- A note's author is the poster's `TripMembership` (per-trip display name + color, per [create-trip-invite.md](./3-7-create-trip-invite.md)'s model), not their account-level profile — matches how every other per-trip identity in the app already works.
- The relative timestamp ("hace 2 días," "recién") is computed at render time from a real stored `createdAt`, not a literal string — the design's mock hardcodes the display strings, but a real note needs a real timestamp to compute it from.

## Phases

### Phase 1 — Note data model

**What this phase delivers**

A Prisma model for a city note (stop, author membership, text, `createdAt`) and the server-side functions everything else calls into: add a note, list a stop's notes.

**Acceptance criteria**

- Adding a note persists its text, author, stop, and timestamp.
- Listing a stop's notes returns them oldest-first.
- Notes are scoped per stop — two different stops (even the same city visited twice, if that ever happens) never share or leak each other's notes.

**Things to consider**

- Model notes as their own table (stop + author + text + timestamp), matching the pattern #7/#8/#10 used for `TripMembership`/stops/places rather than embedding them as JSON on the stop.

**Tests**

- Integration tests against the data functions directly: adding persists the right fields; listing returns notes oldest-first; notes for one stop don't show up under another.

### Phase 2 — Notas tab: list & add

**What this phase delivers**

Wiring #10's existing (inert) Notas tab to Phase 1: the note list (avatar, text, name + relative time), the input + "Mandar" composer, an empty state for a city with zero notes, and a real count on the tab strip.

**Acceptance criteria**

- Opening Notas on a city with existing notes shows them oldest-first, each with the right author avatar/color/name and a human relative timestamp.
- Typing a note and clicking "Mandar" appends it to the bottom of the list immediately, attributed to the logged-in user, and clears the input.
- A city with zero notes shows a muted empty-state message instead of a blank card, matching the empty-state treatment #10 gave a city with zero marked places.
- The tab strip's Notas count matches the real number of notes for that city.
- Submitting an empty/whitespace-only note is a no-op — matches the design's own guard (`if (!t) return`).

**Things to consider**

- This only touches the Notas branch of #10's tab strip — Plan/Reservas/Gastos and the rest of the screen shell aren't touched.

**Tests**

- Vitest + RTL: the list renders from a mocked set of notes in the right order with the right author info; submitting a note calls the add function and appends it optimistically, then clears the input; an empty/whitespace submission does nothing; zero notes renders the empty state; the tab count matches the note count.
- Playwright test: adding a note and reloading the page shows it still there, in the same position.

## How to QA

- Open a city that already has notes (seeded via #10) and confirm they show oldest-first with the right avatar, name, text, and a relative time that makes sense.
- Type a note and click "Mandar"; confirm it lands at the bottom, attributed to you, and the input clears.
- Reload the page and confirm the note you added is still there.
- Open a city with no notes yet and confirm you see an empty-state message, not a blank card.
- Confirm the Notas tab's count matches the number of notes you can see.
- Try submitting an empty note (just spaces) and confirm nothing gets added.

## Rollout & Cleanup

Not applicable — pre-launch, #10's Notas tab is currently inert with no real notes to migrate off of.
