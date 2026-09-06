---
name: implementation-plan
description: Write a scoped implementation plan doc (docs/plans/<order>-<ticket>-<slug>.md) for a feature or GitHub issue, following this repo's docs/templates/implementation-plan.md pattern — the one already used for auth and the landing page. Use when starting design/spec work on a new epic or ticket before implementation begins.
---

# Implementation plan

This repo plans features as a single markdown doc under `docs/plans/`, built from `docs/templates/implementation-plan.md`. Two examples already exist: `docs/plans/2-2-auth.md` and `docs/plans/1-1-landing-page.md` — read both before writing a new one. They show the voice and the level of detail expected, not just the section headers.

## When to use this

The user asks for an implementation plan for a feature, epic, or GitHub issue — e.g. "write the plan for #8", "plan out the route builder", "let's spec out issue X before building it".

## Process

1. **Read `docs/templates/implementation-plan.md` first, every time.** It carries the section-by-section instructions as HTML comments. Don't wing the structure from memory of a previous plan — the template is the source of truth for shape, and it states the "keep the writing casual" rule directly; don't drop it.

2. **Gather everything the plan depends on:**
   - The GitHub issue(s) this plan covers (github MCP tools, or `gh issue view`) — title, body, checklist, and **all comments**. Design-mapping notes get left as comments, not folded into the body (see the pattern already on issues #7-#17: a comment naming the Claude Design link and the specific screen(s) it maps to, plus any gaps found against the checklist).
   - Any Claude Design project linked from the issue or its comments — pull it via the DesignSync MCP tool (`get_project` / `list_files` / `get_file`) and actually read the relevant screen(s) end to end, not just the file list.
   - Existing `docs/plans/*.md` — a new plan almost always sits on top of foundational work another plan already did (app scaffold, design tokens, a data layer, an invite/crew model). Say so explicitly in Context or Implementation Strategy instead of re-covering it — the way `2-2-auth.md` points back at `1-1-landing-page.md`'s Phase 1 for the Next.js scaffold and tokens.
   - Existing `docs/adr/*.md` — reuse a standing decision instead of re-litigating it, and link it from Scope or Constraints the way `2-2-auth.md` links ADRs 0003-0005.

3. **Surface architecture decisions before writing the plan around them.** If the feature needs a decision that isn't already an ADR (a library choice, a data-modeling call, a pattern to follow or deliberately not follow), write it as a new `docs/adr/NNNN-kebab-title.md` first — next sequential number, title is the decision itself as a sentence, body is one paragraph: what was chosen, what it costs, why it beats the alternative. Match the voice of the 5 existing ADRs (no frontmatter, no section headers, just the one paragraph). Link the new ADR(s) from the plan.

4. **Grill the user on every open doubt, in rounds, until none remain.** Never guess at a judgment call. Doubts turn up constantly while gathering context and drafting: a state the design doesn't spell out (an error/empty/edge screen), scope that's genuinely ambiguous between two readings of the issue, a non-goal that's a judgment call rather than an obvious exclusion, a phase-ordering choice, a constraint that could reasonably go either way. Don't collect these silently and dump them at the end, and don't drip-feed them one at a time either — work like the `grilling` skill:
   - Track open doubts as a **design tree**: each decision can branch into further decisions that only make sense once it's settled.
   - The **frontier** is every doubt you can ask right now without depending on an answer you don't have yet. Ask the whole frontier in one round, numbered, each with your recommended answer (you have an opinion — say it):
     ```
     ❓ **Q1** - **<title>**: <the doubt, plus the options if there are more than one>

     ➡️ <your recommended answer>
     ```
   - Wait for the user's answers before the next round. Their answers settle some branches and unblock others — recompute the frontier and ask the next round. A doubt that depends on a still-open answer waits for a later round, not this one.
   - Anything you could resolve yourself (reading another file, checking how an existing plan or ADR handled it, an issue comment you haven't pulled yet) is *your* job — go look it up or dispatch a sub-agent, don't put it to the user as a question.
   - Keep going until a round comes back empty — no more doubts surface. Only then move on; don't start writing the plan while questions are still open.

5. **Write `docs/plans/<order>-<ticket>-<slug>.md`** (kebab-case feature name), filling in every section of the template. `<order>` is this ticket's position in `docs/roadmap.md`'s build sequence (two tickets meant to run in parallel share the same number); `<ticket>` is the GitHub issue number(s), hyphenated if the plan covers more than one (e.g. `6-12-13-booking-attribution-vouchers.md` for #12+#13). A plan for a ticket the roadmap doesn't cover (or that's since been closed as not planned) stays unnumbered.
   - **Context** — why now, the issue link(s), the design link and what screen(s)/file it points to, what this plan depends on.
   - **Scope** — behavior bullets, not files.
   - **Non-goals** — things a reviewer would otherwise assume are included, and why each is deliberately cut, not just "later."
   - **Implementation Strategy** — 1-2 sentences on the overall approach, then the numbered phase list. This list has to work as a table of contents for the Phases section: one bullet per phase, no more, no code.
   - **Constraints & Things to Consider** — only cross-cutting rules that span more than one phase; a single-phase concern belongs in that phase's own "Things to consider" instead.
   - **Phases** — each one shippable on its own, ordered the way a real user/system would hit them, each with its own acceptance criteria and its own tests. Never a final "testing phase."
   - **How to QA** — the steps a human runs end to end; pull from the issue's "To Test" section verbatim if it has one.
   - **Rollout & Cleanup** — only if there's a flag, prod data, or an existing path being replaced. Otherwise write "Not applicable" and say why (pre-launch, brand-new route, no existing users), matching both existing plans.

6. **Voice check before finishing.** Read the draft back and cut anything that sounds like a spec generator — short sentences, plain words, no thesaurus, go easy on em-dashes and semicolons. It should read like a teammate explaining a plan they've already thought through a few times, the way both existing plans do.

## Don't

- Don't invent file names, function names, or internal layout — that's PR-review material, not plan material.
- Don't dump every phase's tests into one final "testing" phase.
- Don't skip reading the existing two plans because "the template already covers it" — the template says *what* each section is for, the existing plans show *how much* and *what tone*.
- Don't leave Non-goals as a shrugged-off leftovers list — each one should read like a decision that was actually made.
- Don't ask the user something you could find out yourself, and don't start writing the plan while a grilling round is still open.
