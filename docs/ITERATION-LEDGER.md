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

## Stage 4 · Sculpted mantle and chamber

- Issue #7. Base `9052650a8e3da6c89567003537192e292fb3b30c`, silhouette proof `558e30e949a5e9c19d7a5710e5011def1e49b22b`, render candidate `fddaa6ceb82fab49e181106cbc925b923cb56415`.
- Hypothesis: one swept chrome shell with an aperture and seated neck reads as an integrated biomechanical object. Validate that primary form first, then add a recessed rotor, small optic, and rear plates. Preserved the original lights, arm behavior and nine goldens.
- Changed `src/mantleGeometry.js`, `src/mantle.js`, `src/octopus.js`, and `tests/mantleGeometry.test.js`. The [engineering report](STAGE-4-MANTLE.md) records matched evidence, browser and build results and same-lane timing deltas.
- Provisional mantle score **2 → 3**. Other rubric categories remain at 2. Keep for independent review. Review phone-scale chamber contrast and the subtle dorsal seams. The next lighting stage requires separate authorization. Roll back by reverting the Stage 4 commits as a unit.

### Stage 4 · Chamber focal point revision

- Review base `fdca0d3b843d63cb41b347e58ae10b1a51aeb0ec` → candidate `9f0362591159466fc3896eacd7ce743737ed0703`. [Independent feedback](https://github.com/heyitschien/threejs-experiment-animations/pull/8#issuecomment-7091010869) approved the mantle structure and asked for a bounded chamber revision.
- Focal rays found no shell occlusion. A shallower lens, wider recessed rotor and deeper backing give the existing internals clearer presence. The window remains blue and reflective. `src/mantle.js` and `tests/mantleGeometry.test.js` are the only runtime and test changes.
- The [validation record](STAGE-4-MANTLE.md#focused-chamber-revision) includes matched front, three-quarter, mantle-detail and 360/390 mobile evidence, a motion clip, tests and exact timing trials.
- Builder recommendation: keep the geometry pass for independent review. Defer physically clearer glass to a separately approved Stage 5 material/light comparison. Revert the two chamber revision commits together to roll back.

## Stage 5 · Neutral glazing and studio light

- Issue #9. Base `f292943de3a1387b0ed76ca642b0ae17bc33c1b9`, final runtime/QA `944929aead64b8de048a38d93019dacd4e722bf2`. [Engineering and visual evidence](STAGE-5-MATERIALS.md) records both material experiment SHAs, timings and capture provenance.
- Under identical Stage 4 lighting, the neutral glass held vane sharpness with the existing render budget. Physical transmission was slightly softer and required a second opaque pass. Keep the tuned neutral glass. The subsequent retune reused the five procedural panels, original lights and composer.
- Changed `src/octopus.js`, `src/main.js` and the targeted glazing test in `tests/mantleGeometry.test.js`. Mantle and tentacle geometry, animation, UI, assets and goldens were preserved.
- Provisional glass clarity **1 → 2**, chrome/lighting **2 → 3**. Keep for independent review. Ask whether the remaining dark-stage look fits the concept and whether the glass still needs more optical depth. Beyond this pass, the largest reference mismatch is the lack of a reflective, atmospheric ground. Hold separate environment work and merge pending review.

## Stage 6 · Closer hero and wet-stage proxies

- Issue #11. Base `df1843351ed3540533bda2996cbffeafe91b7346`, selected framing `777bb250eb44739236ceb14cedcd7f0fb6a0018d`, final runtime/QA `8738d86562a27021d0f89db14cbc4af37a0e75dc`.
- Tested current, close and bold opening shots at three dimensions and poses. Kept the closer view for silhouette clearance. Then added a dark procedural floor, soft reflection proxies and low haze with no reflection pass. Scope covers `src/main.js`, `src/style.css`, `src/heroFraming.js`, `src/stageEnvironment.js` a narrow framing test, and a candidate-only still noise bound in `qa/capture.spec.js`.
- [Evidence and engineering report](STAGE-6-ENVIRONMENT.md) separates framing from environment A/B, links sanitized frames and motion, and records timing trials. Provisional composition **2 → 3**, ground/atmosphere **1 → 2**. Keep for independent review. Ask whether the streaks read as wet ground at mobile scale and whether left copy stays sufficiently separate over the full loop.
- Roll back by reverting the Stage 6 commits as a unit. The geometry, material and goldens remain in the parent. Hold merge and Stage 7 pending review.

## Stage 7 · Single-arm Blender A/B pilot

- Issue #14. Verified Stage 6 base `27c2c5c9c7bc3876f20a42d26770dceb857c557f` → Stage 7 runtime and capture source `e7325344801997cacc4e96c92a0dee2c341a35c3`. Blender 5.2.4 LTS and bundled Python 3.13.13 passed signed-package and headless exporter validation. Two exports of the generated GLB matched byte-for-byte.
- Optional `?tentacle=blender` replaces foreground arm index 3 with swept layered armor and amber insets on the existing animation path. The default replays the Stage 6 captures exactly. Node/build and both A/B candidate Playwright suites passed. [Setup, matched visual evidence and benchmarks](STAGE-7-BLENDER-PILOT.md).
- Close-up chrome armor scored **2 → 3**. Mobile legibility and visible socket detail remain **2 → 2**. The asset adds 194,652 bytes, three draws and 6,220 scene triangles. Keep the procedural default and hold the Blender pilot for independent review. Drop the optional query to restore A.
