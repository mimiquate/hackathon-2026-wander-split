# wonderSplit Booking Attribution & Vouchers

## Context

[Issue #12](https://github.com/mimiquate/wonder_split/issues/12) ("Who shows their face vs. who puts the card") and [issue #13](https://github.com/mimiquate/wonder_split/issues/13) ("The voucher folder") are both sub-issues of the closed #4 parent, and per [docs/roadmap.md](../roadmap.md) they build together — one dialog, two tickets. #12 wants every booking to record whose name it's under, who actually paid, and who's using it (so a cost only splits across the people it covers, not the whole group). #13 wants a real file — PDF, screenshot, booking code — attached to that same booking, so whoever's responsible for showing it can pull it up fast on their phone.

The design ("Armar el viaje" Claude Design project, `Armar el viaje.dc.html`) covers both with the same **"Sumar reserva"** dialog, reachable from the city-detail screen's **Reservas** tab (design-mapping comments already left on both issues). That dialog has "Quién reservó" and "Quién pagó" selects, and a PDF upload (drag or browse); the voucher detail view shows the uploaded file as a chip next to who it's "a nombre de." Two real gaps between the design and the checklists came out of that mapping pass: there's no "who's using it" subset picker anywhere yet (the voucher detail's "X of Y crew staying" list is read-only mock data), and the upload only accepts PDF where the checklist also wants images, with no distinct mobile/offline view at all (desktop panel only).

This plan builds on top of [docs/plans/zoom-into-city.md](./zoom-into-city.md) (#10), which already ships the city-detail screen's 4-tab strip with Reservas present but inert — a placeholder that does nothing. This is the plan that makes Reservas real. It also depends on #7's trip/crew model for who can be picked as "reservó," "pagó," or "usa."

A comment on #12 already scopes this down for us: this ticket owns the booking *data* — whose name, who paid, who's using it — not the expense-split math. That's #15's job, which will consume "who's using it" as an input once it exists.

## Scope

- The Reservas tab going from inert to real: a list of bookings for that stop (label, who it's under, a voucher-file indicator), and a detail view for one booking showing all its fields plus its voucher file(s).
- The "Sumar reserva" dialog, used for both adding a new booking and editing an existing one (the design's dialog already doubles as both): a free-text label, a "Quién reservó" select (whose name it's under, one person), a "Quién pagó" select (one person), and a "Quién lo usa" multi-select (a subset of the trip's crew, defaulting to everyone checked).
- Attaching one or more voucher files (PDF or image) to a booking through that same dialog, stored via Vercel Blob ([ADR 0009](../adr/0009-vercel-blob-voucher-storage.md)), and replacing or removing an attached file.
- Removing a booking outright, voucher files included.
- A responsive pass on the Reservas tab, list, detail, and dialog so the flow holds up on a phone — the scoped-down answer to #13's "quick access from the phone" ask (see Non-goals for what that deliberately isn't).

## Non-goals

- **Expense-split/balance math.** "Who's using it" is captured here as data; turning it into an actual split or balance is #15's job, per the scope-clarification comment already on #12.
- **A booking type/category field** (hotel vs. flight vs. activity, with a matching icon). Neither checklist asks for one, and the design's own icons are just per-screen flavor, not a modeled field — a booking is a labeled entry, nothing more, for now.
- **True offline/PWA support.** "Quick access from the phone" is scoped to a responsive layout of the same screens, not caching files for zero-connectivity use — see the phone-access question this plan resolved. Real offline support is a much bigger, separate investment for later if usage shows it's actually needed.
- **The Gastos (expenses) tab and its own split-subset picker.** The same design-mapping comment flagged that the "Sumar gasto" form has the identical missing-picker gap, but that tab belongs to #14-#17, not here.
- **Any per-role permission model** (admin vs. participant) gating who can add/edit/remove a booking. Any trip member can, matching how #8 and #10 already treat editing a stop or a marked place — there's no role system in this app yet.
- **A cap on voucher files per booking, or a custom file-size limit** beyond whatever Vercel Blob itself enforces. No invented restriction.

## Implementation Strategy

The data model and file-storage plumbing have to exist before anything else, so that's Phase 1. From there this follows the same read-before-write order #10 used: the Reservas tab's real read path first (so there's something to look at), then the add/edit dialog for the booking fields, then voucher files specifically (since a booking can exist before its voucher arrives), then removal and the responsive pass last, since neither blocks anything else shipping.

1. **Phase 1 — Booking & voucher data model, Blob wiring:** Prisma schema for a booking (stop, label, who reserved, who paid, who's using it) and its voucher files, plus the Vercel Blob client-upload token endpoint and the add/remove-booking server functions. No UI yet.
2. **Phase 2 — Reservas tab: read path:** the tab goes from inert to listing real bookings, and a booking detail view showing every field, the "using it" list, and any attached voucher file(s).
3. **Phase 3 — Sumar reserva dialog: add & edit:** the dialog itself, wired to create a new booking and to edit an existing one, including the "who's using it" picker defaulting to the whole crew.
4. **Phase 4 — Voucher files:** uploading one or more PDF/image files to a booking through the dialog, and replacing or removing an attached file.
5. **Phase 5 — Removal & responsive pass:** removing a booking outright, and making the whole Reservas flow (tab, list, detail, dialog) hold up on a phone-sized viewport.

## Constraints & Things to Consider

- Reuse the Ruta Terracota tokens/components already ported for auth, the landing page, and #7/#8/#10 — `var(--token)`, terracota focus ring, ≥44px tap targets, `prefers-reduced-motion` collapsing entrance animation.
- Copy is Rioplatense Spanish (vos), taken verbatim from the design where it exists ("Quién reservó," "Quién pagó," "a nombre de"). "Quién lo usa" has no design precedent (the picker doesn't exist yet) and is invented here in the same voice.
- "Quién reservó," "Quién pagó," and every person selectable in "Quién lo usa" are drawn from the trip's existing crew/membership list from #7 — no free-text names.
- "Quién lo usa" defaults to the entire crew checked when the dialog opens for a new booking; the user unchecks whoever isn't covered, rather than starting from nobody.
- The voucher chip's "a nombre de" person is the same field as "Quién reservó" — #13's "person responsible for presenting it" and #12's "whose name it's under" are one field, not two, matching how the design's own voucher-detail chip is already tied to "a nombre de."
- A booking belongs to a stop, same as #10 modeled marked places — nothing floats free of a city.
- Voucher uploads go straight from the browser to Vercel Blob using a short-lived upload token the server issues (see [ADR 0009](../adr/0009-vercel-blob-voucher-storage.md)) — no file body routed through a server function, no storage credentials in the client bundle.

## Phases

### Phase 1 — Booking & voucher data model, Blob wiring

**What this phase delivers**

A Prisma schema for a booking (stop, label, who-reserved, who-paid, who's-using-it) and its voucher files (booking, blob URL, filename, mime type), server-side add/edit/remove functions for a booking, and an endpoint that issues a scoped Vercel Blob client-upload token. No screens yet.

**Acceptance criteria**

- Adding a booking persists its label, reserved-by, paid-by, and using-it list against the right stop.
- Editing a booking updates any of those fields without touching the others.
- Removing a booking deletes it and any voucher files attached to it.
- The upload-token endpoint returns a token scoped to a single booking, usable for a direct client-to-Blob upload (mocked Blob client in tests).
- Bookings are scoped per stop — two different stops never share or leak each other's bookings.

**Things to consider**

- Model bookings and voucher files as their own tables (booking has many voucher files), not embedded JSON, matching the pattern #7/#8/#10 already used for memberships/stops/places.
- "Who's using it" is a many-to-many against trip members, not a fixed-size list — a booking can cover anywhere from one person to the whole crew.

**Tests**

- Integration tests against the data functions directly: adding persists all four fields correctly; editing changes only the fields passed; removing deletes the booking and cascades to its voucher files; a mocked upload-token call returns a token scoped to the right booking; bookings for one stop never show up under another.

### Phase 2 — Reservas tab: read path

**What this phase delivers**

The Reservas tab (currently inert per #10) now lists real bookings for the stop — label, who it's under, a voucher-attached indicator — and clicking one opens a detail view showing every field (reserved by, paid by, who's using it) and any attached voucher file(s).

**Acceptance criteria**

- The Reservas tab count (already shown in #10's tab strip) reflects the real number of bookings.
- The booking list shows each booking's label, who it's under, and whether it has a voucher file attached.
- Opening a booking shows reserved-by, paid-by, the full "who's using it" list, and its voucher file(s) if any.
- A stop with zero bookings shows an empty-state message instead of a blank tab.

**Things to consider**

- This only replaces the Reservas tab's inert placeholder from #10's Phase 2 — the other tab-strip mechanics (tab switching, counts) stay as #10 already built them.

**Tests**

- Vitest + RTL: the tab count matches the number of bookings; the list renders label/who's-under/voucher-indicator per row; the detail view renders all fields for a given booking; zero bookings shows the empty state.

### Phase 3 — Sumar reserva dialog: add & edit

**What this phase delivers**

The "Sumar reserva" dialog: a label field, "Quién reservó" and "Quién pagó" single-selects, and the new "Quién lo usa" multi-select (defaulting to the whole crew checked). The same dialog, pre-filled, edits an existing booking.

**Acceptance criteria**

- Saving the dialog for a new booking creates it with the entered label and selected reserved-by/paid-by/using-it values, and it immediately shows up in the Reservas list.
- Opening the dialog on an existing booking pre-fills every field with its current values; saving updates it in place.
- "Quién lo usa" starts with every crew member checked on a new booking; unchecking someone excludes just them.
- Canceling the dialog (new or edit) discards any unsaved changes.

**Things to consider**

- "Quién reservó" and "Quién pagó" can be the same person or different people — no validation forcing them apart or together.

**Tests**

- Vitest + RTL: submitting the dialog for a new booking calls the create function with the right fields; opening it on an existing booking pre-fills correctly and submitting calls the edit function; the using-it picker starts fully checked; canceling doesn't call either function.
- Integration test: creating and then editing a booking through the real data functions round-trips all four fields correctly.

### Phase 4 — Voucher files

**What this phase delivers**

Uploading one or more PDF or image files to a booking from within the Sumar reserva dialog (or the booking detail view), and replacing or removing an already-attached file.

**Acceptance criteria**

- Uploading a PDF or image file attaches it to the booking and shows it as a chip in the booking's detail view.
- A booking can have more than one voucher file attached.
- Removing an attached file deletes it from the booking's detail view and from Blob storage.
- An unsupported file type is rejected with an inline error, not a silent failure.

**Things to consider**

- The upload itself goes straight from the browser to Blob using Phase 1's scoped token — the server only ever sees the resulting file's metadata, not its bytes.

**Tests**

- Vitest + RTL: a mocked successful upload shows the new file as a chip; a mocked unsupported-type response shows the inline error; removing a file removes its chip.
- Integration test: an upload's resulting blob URL and metadata persist against the right booking; removing a file deletes its DB row (Blob call mocked).

### Phase 5 — Removal & responsive pass

**What this phase delivers**

Removing a booking outright, and a responsive pass across the Reservas tab, list, detail, and dialog so the whole flow holds up on a phone-sized viewport — the scoped-down version of #13's "quick access from the phone."

**Acceptance criteria**

- Removing a booking deletes it (and its voucher files) and it disappears from the list immediately, no confirmation prompt (matching the no-confirmation pattern #10 already used for removing a place).
- At a phone-width viewport, the Reservas list, booking detail, and Sumar reserva dialog stack to a single column with no cut-off content and no two columns fighting for the same row.
- Every tappable control in this flow stays ≥44px at phone width.

**Things to consider**

- No new component architecture here — this is a breakpoint/CSS pass over Phases 2-4's existing screens, same treatment the landing page's Phase 6 gave its own responsive pass.

**Tests**

- Vitest + RTL: removing a booking calls the remove function and it's gone from the list.
- Playwright tests at a phone-width viewport: the list/detail/dialog each render single-column with no overlapping content, and a keyboard-focused control still shows the terracota focus ring.

## How to QA

- Open a stop's Reservas tab and confirm it's now a real list (not the old inert placeholder), showing zero bookings with an empty state.
- Add a booking: fill in a label, pick who reserved it and who paid, confirm "Quién lo usa" starts with everyone checked, uncheck a couple of people, and save. Confirm it shows up in the list.
- Open that booking and confirm every field you entered shows correctly, including the trimmed-down "who's using it" list.
- Edit the same booking (change who paid, add someone back into "who's using it") and confirm the changes stick.
- Upload a PDF to the booking, then upload an image to the same booking, and confirm both show up as separate voucher chips.
- Try uploading an unsupported file type and confirm you get an inline error, not a silent failure.
- Remove one of the two voucher files and confirm only that one disappears.
- Remove the booking entirely and confirm it (and its remaining voucher file) are gone from the list with no confirmation prompt.
- Shrink the window to phone width and re-run the add/edit/upload flow — confirm nothing overlaps or gets cut off, and every button/field stays easily tappable.
- Tab through the dialog with the keyboard only — every focusable control shows the terracota focus ring.

## Rollout & Cleanup

Not applicable — pre-launch, and the Reservas tab is currently just an inert placeholder from #10 with no existing data to migrate off of.
