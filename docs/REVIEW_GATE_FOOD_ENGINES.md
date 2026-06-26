# Food Engines Review Gate

This project follows the standing Neuroforge build rule before it can be called done:

- Locate or confirm the review loop/subloops.
- Run the review loop.
- Fix all findings.
- Document blockers instead of claiming completion.
- Do not push or deploy without explicit user authorization.

## Applied Loop For This Static Game

1. Build integrity: run `npm ci`, `npm run typecheck`, `npm run build`, and `npm audit --audit-level=moderate`.
2. Browser proof: run `npm run playtest` for title/start/grid/plant/water/harvest/engine/request/ending/copy-recap/overflow checks, then `npm run playtest:full` for the deterministic 21-day public-demo balance probe.
3. Screenshot proof: capture all requested screenshots under `output/playwright/`.
4. Package isolation: create `food-engines-review.zip` excluding dependency/build/cache/git/temp artifacts and old zips.
5. Exact package proof: extract the ZIP to a temporary folder and rerun install, typecheck, build, audit, smoke playtest, and full-run playtest.
6. Review pass: inspect source/docs/package for IP leakage, private infrastructure dependency, missing proof, unsupported claims, or gameplay blockers.

## Review Questions

- Does the farm loop read quickly in screenshots?
- Are crop/request/engine choices understandable without a tutorial wall?
- Does the submission framing clearly fit Independence Engines?
- Are there any commercial game references too close for comfort?
- Is the package portable for another AI/human reviewer?
