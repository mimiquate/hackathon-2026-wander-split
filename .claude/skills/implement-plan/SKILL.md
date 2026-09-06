---
name: implement-plan
description: Build a plan doc (docs/plans/<slug>.md) that's already written — one PR per plan, one commit per phase, paused for a go-ahead between phases. Use when the user wants to start building a plan, e.g. "implement the plan for #8", "build issue #22", "start phase 1 of build-the-route".
---

# Implement plan

This repo builds a feature phase by phase straight from its `docs/plans/<slug>.md`, written by the `write-plan` skill. One plan equals one PR; each phase lands as its own commit, and the agent stops after every phase to let the user check it before moving on.

## When to use this

The user asks to start building a plan that already exists — "implement the plan for #8", "let's build the route builder", "start phase 2 of auth". If `docs/plans/<slug>.md` doesn't exist yet, use the `write-plan` skill first.

## Process

1. **Read the plan doc fully** (`docs/plans/<slug>.md`) — Context, Scope, Non-goals, Constraints, every Phase, How to QA. Note the GitHub issue number it's tied to.

2. **Set up the branch and PR, once, before Phase 1:**
   - Branch off latest `main`, named `issue-N-<slug>` (N = the plan's linked issue).
   - Commit and push Phase 1 (see step 3), then open the PR as a **draft** — don't open it before there's a commit on the branch.
   - Fill the PR description immediately: a checklist mirroring the plan's Implementation Strategy (one line per phase), plus an empty "Deviations from plan" section.

3. **Work one phase at a time:**
   - Implement the phase, committing as often as you want while iterating — nothing here is final yet.
   - Before considering the phase done, run its tests (and typecheck/lint if configured). A failure blocks the commit — fix it, don't skip it.
   - Squash the phase's commits into exactly one, with a message that leads with the phase's exact heading from the plan doc (e.g. "Phase 2 — Keep it in sync: ..."), followed by a one-line summary of what changed.
   - Push it. Force-pushing your own commit here is fine — nobody has approved it yet.
   - Check the PR's checklist item for this phase, and fill in the "Deviations from plan" section if anything about this phase's implementation diverged from what the plan said (small stuff only — see step 5 for the bigger kind).
   - Report a chat summary: what shipped, and how to QA it (pull from the phase's acceptance criteria and the plan's "How to QA" section). **Then stop and wait** for the user to say go before touching the next phase.

4. **Before starting the next phase**, check whether `main` has moved. If it has, `git merge main` into the branch — never rebase, and never force-push a phase commit the user has already approved by saying go. A merge commit on the feature branch is fine; rewriting an approved phase commit is not.

5. **If a bug turns up in an already-approved phase** (found while working a later one): add a new, separate commit that fixes it, with a message naming which phase it fixes (e.g. "Fixup (Phase 1): ..."). Never rewrite or force-push the original phase commit once the user has moved past it.

6. **If the implementation reveals the plan's actual shape is wrong** — not a small deviation, but the approach doesn't work, phases need reordering, scope needs to change — stop. Don't fold this into the "Deviations from plan" section. Go back through the `write-plan` skill's grilling process to update the plan doc itself, then resume once it's settled.

7. **Once every phase is committed and passing**, tell the user the plan is fully built. Don't flip the PR out of draft yourself — that's the user's call, not something to do automatically just because the checklist is complete.

## Don't

- Don't skip a phase's tests to save time — a failing phase blocks its own commit, no exceptions.
- Don't rebase, amend, or force-push a phase commit the user has already said "go" on. Fix forward with a new fixup commit instead.
- Don't squash across phase boundaries — one phase, one commit (a later fixup commit is its own separate commit, not folded back in).
- Don't silently continue to the next phase without the user's explicit go-ahead.
- Don't write off a real plan-shape change as a "deviation" — that belongs back in `write-plan`'s grilling process, not a PR-description footnote.
- Don't mark the PR ready for review yourself.
