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

## Stage 3 · Continuous tentacle sweep

- Issue #5. Base `b742d7dae92cd9788d705731fc58cff9e44adb2e`. One-arm proof `0cd980be24bbdb92da1ce4de871f1205ebaef78c`. Eight-arm render candidate `fec773d631ee1deb860267a4c5c696707d841d48`.
- Hypothesis: a parallel-transport sweep with smooth taper, shallow panel seams and seated underside details gives a clearer silhouette than independent cylinders. The first one-arm proof removed gaps but folded at some curl phases. The tangent-aligned arc replaced that curve before rollout. Earlier captures remain in local evidence.
- Changes: `src/tentacleMath.js`, `src/tentacleSweep.js`, `src/sculptedTentacles.js`, `src/octopus.js`, focused geometry tests, and an explicit candidate capture mode in `qa/capture.spec.js`.
- Evidence: the exact pinned baseline regenerated nine matching views. The paired candidate shots, capture provenance and comparison sheet are in ignored `octo-evidence/stage3/`. The [validation record](STAGE-3-TENTACLES.md) documents the lane, known projection overlaps, the provisional rubric, and full benchmark results. The committed Stage 2 goldens are preserved.
- Checks: nine Node tests and build passed, followed by 13 candidate browser cases. Strict v0.1 golden checks intentionally differed on all nine images and passed all four smoke cases. The composer frame used 106 calls (+15.22%) and 90,862 triangles (−43.14%). The draw-call increase needs reviewer sign-off. In the controlled desktop retest both held 120 FPS, with p95 9.2 → 8.4 ms and a matching 120 FPS blank-page cadence. The first, unstable timing run is also retained.
- Builder verdict: keep for review. Silhouette and motion improved in the matched views, with finer curls competing with scene rings at phone scale. Independent verdict is pending. Reproduce on a stable desktop and an actual phone before evaluating budgets. Review the thinnest tips and, if needed, batch the two arm materials across sweeps before accepting the geometry. Roll back by dropping the Stage 3 branch or reverting its commits together after integration.

### Stage 3 · Approved silhouette revision

- Reviewed base `8645c8cd9a9363e4e7e8231972664bceb0f543f7` → render/QA candidate `31d1b04561a4f25ca726e372b3bfe52313d763b1`. Scope authorized in [PR #6](https://github.com/heyitschien/threejs-experiment-animations/pull/6#issuecomment-7090377863).
- `src/tentacleMath.js` and `src/tentacleSweep.js` ease only the two terminal tapers and open one curl. `tests/tentacleMath.test.js` verifies the taper scope and monotonicity. `qa/capture.spec.js` adds opt-in pose/viewport evidence while preserving the original strict path.
- [Matched views, benchmark and test results](STAGE-3-TENTACLES.md#approved-silhouette-revision). Provisional silhouette score **2/3**. The right endpoint separates at the reviewed pose; some projected shaft overlap remains. Physical mobile and independent review remain pending. Roll back by reverting the two revision commits together.
