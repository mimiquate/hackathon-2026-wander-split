# 1 · #1 — wonderSplit Marketing Landing Page

## Context

[Issue #1](https://github.com/mimiquate/wonder_split/issues/1) asks for a landing page for the app: define the layout/sections, implement it, check it's responsive. A high-fidelity design already exists for this — a Claude Design project ("Apps landing page UI mockup") with a full handoff bundle: the page spec (`Landing Page.dc.html`), a detailed README, real geo route-map code, and the wonderSplit design system ("Ruta Terracota") as portable React source with tokens. Copy is final, Rioplatense Spanish throughout.

The repo is currently empty (no frontend exists yet), so this plan also covers standing up the app itself, using Next.js (App Router). This app is meant to become the whole future wondersplit web app, not a throwaway marketing site — the landing page is just what it starts as. Once this ships, `/` shows visitors the value prop (plan the route together, keep bookings in one place, we do the math) with a real product mock as proof, and sends them to create a trip.

## Scope

- A new Next.js app in this repo, since none exists yet.
- The full landing page at `/`: sticky header/nav, hero (copy + CTAs + live trip-card mock), route map strip, "cómo funciona", "gastos" settle-up demo, "vouchers" stop cards, final CTA ("precios"), footer.
- Just the design-system pieces this page actually needs, ported into the repo as our own components: Button, Icon, Avatar/AvatarGroup, Card, StatusChip, LedgerRow, SettleRow, StopCard — plus the shared tokens (color/type/spacing/elevation/motion) they depend on.
- The static demo dataset (crew, ledger rows, settlements, stops) copied verbatim from the design, since the page has no backend to call.
- The responsive behavior the design spells out for narrow viewports (stacked grids, collapsed nav, no side-by-side money columns).
- Light theme only, since that's how the design ships marketing (product default is dark, out of scope here).

## Non-goals

- No sign-up/auth or real trip-creation flow — CTAs are static anchors/links for now, not wired to a backend. That's app functionality, not this ticket.
- No dark-mode toggle on this page (the design keeps a `theme` prop for later, but marketing ships light-only).
- No self-hosting of the Google Fonts / Lucide icons / world-atlas map data — keep the same CDN sources the prototype uses. Self-hosting is a later hardening task, not blocking here.
- No i18n or CMS — copy is static, hardcoded, Spanish only.
- No other app screens (the mobile Ruta/Gastos/Saldar/Vouchers UI kit) — just this one marketing page.
- No page metadata — title, meta description, OG/Twitter card image, favicon. The design doesn't specify any of this. Known gap, tracked as a follow-up ticket rather than blocking this one.

## Implementation Strategy

Since there's no app to build on top of yet, the first phase is just getting a Next.js app running with the design system's tokens wired in globally. From there we port over only the handful of components this one page needs (8 of the design system's 22), rather than the whole library — the rest can come later if/when other pages need them. Then the page gets built up section by section, starting with anything that has no data dependency, then the sections that lean on the demo dataset, then the one genuinely dynamic piece (the d3/topojson route map), and finishing with the responsive/accessibility pass the ticket calls out explicitly.

Tests use Vitest + React Testing Library for component/rendering-level checks (Phases 1–4), and Playwright for anything that needs a real browser — the route map's d3/resize behavior (Phase 5) and the breakpoint/focus/motion checks (Phase 6).

1. **Phase 1 — App scaffold & design tokens:** get a Next.js app running with the Ruta Terracota tokens loaded globally, and the test tooling in place.
2. **Phase 2 — Core design-system primitives:** port the 8 components this page needs, matching the provided source's look and behavior.
3. **Phase 3 — Static page shell:** header/nav, hero copy, "cómo funciona", final CTA, footer — everything with no data dependency.
4. **Phase 4 — Product-proof sections:** the hero trip-card mock, "gastos" settle-up demo, and "vouchers" stop cards — the sections wired to the demo dataset.
5. **Phase 5 — Route map:** the real-geography map strip, ported from the provided `route-map.js`.
6. **Phase 6 — Responsive & accessibility pass:** the mobile breakpoint behavior and the a11y details (focus rings, reduced motion, tap targets).

## Constraints & Things to Consider

- Always use the `var(--token)` that already exists for a given value — never a hardcoded hex or px where a token covers it. Keeps this reusable if the product app ever shares the same design system.
- Copy is Rioplatense Spanish (vos), sentence case, no emoji, money/dates in mono with comma decimals — copy it verbatim from the design, don't "clean up" or translate it.
- Traveller avatar colors are assigned per person and must stay stable across the whole page (e.g. María is always the same color wherever she shows up) — never recompute by list position.
- Nothing tappable should end up under 44px once the mobile nav kicks in.
- `prefers-reduced-motion` has to collapse the one entrance animation to ~0ms.
- CTAs can be static/no-op links for now — don't build the actual trip-creation or sign-in flows to make them "work".

## Phases

### Phase 1 — App scaffold & design tokens

**What this phase delivers**

A running Next.js app (an empty page is fine at this point) with the Ruta Terracota tokens loading globally, and Vitest + React Testing Library and Playwright wired up, so everything built after this can just reach for `var(--token)` and every later phase can add tests without re-deciding tooling.

**Acceptance criteria**

- App boots locally and serves a page.
- Global styles load the token files (fonts, colors, typography, spacing, elevation, motion) in the same order as the design system, plus the Google Fonts import for Bricolage Grotesque / Karla / IBM Plex Mono.
- The page defaults to light mode (`data-theme="light"` or no attribute, matching the tokens' `:root` default) — dark-mode values must not leak in.
- `npm run test` (Vitest) and a Playwright test run both work end to end, even with just a placeholder test each.

**Things to consider**

- Keep the token files separate (mirroring the source's `tokens/colors.css`, `tokens/typography.css`, etc.) rather than merging them into one file, so future changes stay easy to diff against the design system.

**Tests**

- A basic smoke check that the app renders and that an element styled with a couple of tokens (e.g. `var(--primary)`, `var(--font-display)`) resolves to the expected computed values.

### Phase 2 — Core design-system primitives

**What this phase delivers**

The 8 components this page actually uses — Button, Icon, Avatar, AvatarGroup, Card, StatusChip, LedgerRow, SettleRow, StopCard — built as this repo's own components, matching the provided design-system source's look and behavior.

**Acceptance criteria**

- Button supports the primary/secondary/ghost variants, sm/md/lg sizes, and optional left/right icon; hover shifts fill color (never opacity-only on a filled button), press shows the scale-down + darker fill, focus shows the terracota ring (never a default blue outline).
- StatusChip falls back to the correct default label per state (`thinking` → "Lo estamos pensando", `urgent` → "Hay que comprarlo YA", `booked` → "¡Reservado!") when no children are passed.
- AvatarGroup caps at its `max` prop and shows a "+N" overflow badge past that; Avatar draws its color from the fixed 5-tone ramp assigned per person, not by position.
- Card, LedgerRow, SettleRow, StopCard render with the paper surface / hairline border / pill radii / dashed-divider treatment described in the design.

**Things to consider**

- These are adapted into this repo's own conventions, not copy-pasted verbatim — but behavior and visual output need to match the source exactly.

**Tests**

- Vitest + RTL rendering tests covering: each Button variant/size renders without error and shows the right visual state on hover/press/focus; StatusChip's default label per state; AvatarGroup's overflow badge appearing past `max`.

### Phase 3 — Static page shell

**What this phase delivers**

The structural sections that don't depend on the demo dataset: sticky header/nav, hero copy + CTAs, "cómo funciona" 3-column block, final "precios" CTA section, and footer, assembled on `/`.

**Acceptance criteria**

- All copy matches the design verbatim.
- Header is sticky and opaque, with the 4 in-page nav anchors (`#como-funciona`, `#gastos`, `#vouchers`, `#precios`) and the Ingresar / Armar un viaje buttons.
- Hero plays its entrance animation once on load (respecting reduced motion).
- "Cómo funciona" shows its 3 items (map/ticket/scale icons + copy) in a 3-column grid.
- The final CTA section has exactly one button plus the reassurance row copy — no second button, no email capture, no pricing table.
- Footer shows the wordmark line and version string.

**Tests**

- A Vitest + RTL page-level test asserting the nav anchors and section ids exist, and that the final CTA section has exactly one button.

### Phase 4 — Product-proof sections

**What this phase delivers**

The sections that show the actual product: the hero's trip-card mock (status chips + ledger rows + settle row), the "gastos" settle-up demo card, and the "vouchers" stop cards — all wired to the static demo dataset copied verbatim from the design.

**Acceptance criteria**

- Hero card shows the 3 status chips, the 2 ledger rows (converted currency shown muted), and one settle row, matching the given copy and amounts.
- "Gastos" shows 3 settle rows (Juan→María, Sofi→María, Nico→Tomás with the last one marked done/settled) plus the total and footnote copy.
- "Vouchers" shows the 3 stop cards (Sevilla, Madrid, Barcelona) with their items, dates, nights, and status.
- The same person shows the same avatar color in every section they appear in.

**Things to consider**

- Pull the demo data (crew list + its slices, ledger/settle/stop entries) from one shared module used by all three sections, instead of redeclaring it — otherwise the "same color everywhere" rule can silently drift.

**Tests**

- Vitest tests asserting the shared demo-data module produces the exact crew/slice arrays from the design, and that a given person's color index is identical everywhere they're referenced.

### Phase 5 — Route map

**What this phase delivers**

The "la ruta" strip: the real-geography map (Sevilla → Madrid → Barcelona), ported from the provided `route-map.js`.

**Acceptance criteria**

- Renders an SVG map (d3-geo Mercator projection) showing Spain/Portugal/France, with Spain/Portugal/France filled as "visited", the dashed route line connecting the 3 stops, and labeled stop dots.
- Redraws when its container resizes.
- Carries an accessible label (`role="img"`, `aria-label`) since the content is graphical, not text.

**Things to consider**

- Country/atlas data still comes from the `world-atlas` CDN, same as the prototype — self-hosting it is explicitly a non-goal here.
- This needs to be a client-rendered piece (it touches the DOM/d3 directly) even if the rest of the page is server-rendered.

**Tests**

- A Playwright test (real browser, since this needs a real ResizeObserver and DOM/SVG rendering that jsdom can't faithfully simulate): the map mounts without error, shows the 3 labeled stop dots, and redraws when the viewport is resized.

### Phase 6 — Responsive & accessibility pass

**What this phase delivers**

The ticket's explicit "responsive/mobile check": layout behavior below ~900px, plus the accessibility details the design calls out (focus rings, reduced motion, tap targets).

**Acceptance criteria**

- Below ~900px: hero and "gastos" grids stack to one column, "cómo funciona" collapses to one column, header nav collapses (hidden or menu). The stop-card grid already auto-fits via `minmax(300px, 1fr)`, so nothing extra needed there.
- No money/settle columns ever sit side by side on mobile.
- Every interactive element shows the terracota focus ring on keyboard focus, never a default blue outline.
- `prefers-reduced-motion: reduce` collapses the hero's entrance animation to ~0ms.
- All tappable controls are ≥44px once the mobile nav is active.

**Things to consider**

- This is CSS/breakpoint work layered on Phases 3–5 — no new components should be needed here.

**Tests**

- Playwright tests at a few viewport widths (desktop, ~900px, ~375px) asserting: header nav collapses, hero/gastos grids go single-column, no two money columns render side by side, and keyboard-focusing a button/link shows the terracota focus ring (not the browser default).
- A Playwright check that `prefers-reduced-motion: reduce` (emulated media) results in ~0 animation duration on the hero entrance.
- Manual QA pass as a supplement (see below) for anything visual that's awkward to assert programmatically.

## How to QA

- Run the app locally, open `/`.
- Spot-check the copy against the design handoff — it should be exact, unmodified Rioplatense Spanish.
- Click each of the 4 nav links and confirm it scrolls to the right section.
- Tab through the whole page with the keyboard only — every focusable control should show the terracota focus ring, never blue.
- Shrink the window to ~375px: header nav collapses, hero and "gastos" go single-column, "cómo funciona" goes single-column, stop cards stack/wrap, and no money columns sit side by side anywhere.
- Turn on "reduce motion" at the OS level and reload — the hero entrance shouldn't visibly animate.
- Confirm the route map shows Sevilla/Madrid/Barcelona correctly labeled, and redraws cleanly when the window is resized.

## Rollout & Cleanup

Not applicable — this is a brand-new route with nothing behind a flag and no existing behavior to migrate. Ship it once Phase 6's QA passes.
