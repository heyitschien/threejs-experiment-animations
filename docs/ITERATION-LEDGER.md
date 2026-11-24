# Visual iteration ledger

Append one entry per attempt. Preserve rejected results and link a revert or follow-up commit when applicable.

## Stage 2 · v0.1 baseline

- Issue #3. Base `e5a2060161708716af42de9734151d5c1f00709c`, captured at `91b88f1bb53bc9b4849a905de218ec9eb6a5fd13`.
- Hypothesis: deterministic capture and full-frame telemetry can be added while the v0.1 production output stays byte-identical.
- Evidence: [goldens and manifest](../qa/goldens/) · [validation and resource measurements](STAGE-2-VALIDATION.md).
- Builder review: hero silhouettes fit both profiles. The lower-left desktop arm approaches the copy and controls. Side and rear views expose existing limb overlap and depth compression. The close-up intentionally crops limbs. These are observations of v0.1 for future art review.
- Independent verdict: pending. Keep the baseline for draft review. The next candidate, once authorized, should isolate tentacle silhouette improvements.

## Entry template

```text
Date / issue / phase / builder / independent reviewer
Base SHA / candidate SHA / capture lane / manifest / reference hash
Hypothesis / rubric dimension / affected behavior / rollback commit
Before / after / pixel diff / turntable evidence
Checks / browser findings / frame timing and resource deltas
Independent visual verdict and rationale / keep, iterate or revert / next step
```
