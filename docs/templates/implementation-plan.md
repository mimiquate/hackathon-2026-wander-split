# Implementation Plan Template

> **What this doc is for**
> A plan someone can actually review for a scoped feature. Enough for a reviewer to
> sanity check the approach, the behavior, and the risks. Not the code. The real
> code details (function names, internal layout, how the tests are wired) belong in
> the PRs, not here.
>
> **Conventions** (apply to every section):
> - Say *what changes and what behavior has to hold*, not *how the code is written*. Prose and acceptance criteria beat file lists and code.
> - Order the phases so each one sets up the next, and each phase is something you could ship on its own.
> - Every phase brings its own tests. Don't dump all the testing into a final phase.
> - Only use a code block when the exact shape is the thing that matters (an event's fields, a signature callers depend on). Everything else stays prose.
> - **Keep the writing casual.** Write it the way you'd explain it to a teammate after you'd already thought it through a few times. Plain words, short sentences, no thesaurus. Go easy on em-dashes and semicolons. It should read like a person wrote it, not like a spec generator.

---

# [Feature Title]

## Context

<!--
A few sentences. Why now, what's broken or missing, what kicked this off, who it's
for. Link the epic / ticket / thread. Say what the goal is from the user's or
system's side, so it's clear what'll be different once this ships.
-->

## Scope

<!--
What this feature covers, in terms of behavior. Bullet list.
-->

- …

## Non-goals

<!--
What we're deliberately not doing, so reviewers don't expect it and nobody
scope-creeps into it.
-->

- …

## Implementation Strategy

<!--
THE SECTION THAT MATTERS MOST. This is where reviewers should spend their time.
Walk through the phases: name each one and give it a sentence or two on what it
delivers and why it lands where it does. It's the table of contents for the Phases
section below, so each bullet lines up with a phase. Someone should get the shape
of the whole thing from just this section.

Open with a sentence or two on the overall approach if it helps: how this fits
with what's already there, what you're reusing vs. building, any pattern you're
copying. Then list the phases. No code, no file lists.

Example:
There's a read path (so the modal can show the value) and a write path (so a
trader can override it). We lean on the existing NHL faceoff-update pattern for the
override instead of building something new.

1. **Phase 1 — Persist the value:** store it on the projection so the UI can read it.
2. **Phase 2 — Keep it in sync:** update the projection whenever an event changes it.
3. **Phase 3 — Show it in the modal:** add the section, wired to the live value.
4. **Phase 4 — Make it editable:** add the override command that writes the new value.
5. **Phase 5 — React to the change:** re-run the affected mechanics after an override.
-->

## Constraints & Things to Consider

<!--
Cross-cutting stuff only, the rules that span more than one phase or the whole
change. If something only matters for one phase, put it in that phase's "Things to
consider" instead. Keeps this from turning into a junk drawer, and someone can tell
at a glance what's global.

This is where the locked-in decisions that shape the work live. Just the rule, not
a code recipe. Keep it short and drop anything that isn't really load-bearing or
that a phase's acceptance criteria already covers.

Things worth covering when they apply:
- Compatibility: what existing behavior has to stay the same
- Data: replay/idempotency safety, schema changes, old records missing new fields, backfill
- Validation: what inputs are allowed, what gets rejected
- Flags / rollout: can it be toggled? default state? how big's the blast radius?
- Performance: latency budgets, concurrency limits
- Security / auth: anything beyond the usual
- Edge cases: races, weird state transitions, one-sided updates
-->

- …

## Phases

<!--
Each phase is a slice you could ship on its own. Describe it from up high: what it
delivers and the behavior it has to satisfy. Not the files or the code. Repeat the
block below for each phase. Keep them tight.
-->

### Phase 1 — [name]

**What this phase delivers**

<!-- A sentence or two: the slice of behavior this phase adds, at a high level. -->

**Acceptance criteria**

<!-- What's got to be true when the phase is done. Write them as things you can
check: "User can …", "System rejects …", "Existing X still works". -->

- …

**Things to consider**

<!-- Constraints, edge cases, or calls specific to this phase. Skip it if there
aren't any, and don't repeat the global Constraints section. -->

- …

**Tests**

<!-- What behavior this phase's tests need to lock in. Describe the intent, not the
test file mechanics. -->

- …

### Phase 2 — [name]

…

## How to QA

<!--
The steps a human runs to check the feature end to end. If the epic/ticket has
"To Test" steps, paste them here as-is. For this app it usually means driving a
match with the simulator: start a sim for a match with the data you need, FF to the
spot you care about (a phase or a specific Radar event), narrow the market/entity
switches, drive the UI, and watch what happens.
-->

- …

## Rollout & Cleanup

<!--
Only if there's a flag, prod data involved, or you're replacing an existing path.
Order matters: ship → enable → verify → clean up. Drop this section if none of that
applies.
-->

1. **Ship with flag off**: …
2. **Enable per environment**: staging → prod, watch …
3. **Cleanup follow-up**: …
