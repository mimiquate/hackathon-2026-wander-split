## Implementation plans

- Writing a plan: use the `write-plan` skill.
- Building a plan: use the `implement-plan` skill.
- One plan (`docs/plans/*.md`) equals one PR, opened as a draft once Phase 1 is committed.
- Each phase lands as exactly one commit, pushed, with the agent pausing for the user's go-ahead before starting the next phase.
- Never rewrite or force-push a phase commit once the user has approved it — fix forward with a new commit instead.
- The user, not the agent, flips the PR from draft to ready for review.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
