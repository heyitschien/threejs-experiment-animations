# Visual iteration and evidence

## Capture lane

1. Serve a clean checkout at a recorded base or candidate SHA over a loopback port. Match Node/npm, package lock hash, Playwright package and browser revision, OS/build, GPU/backend, browser flags and viewport across comparisons. Use one worker with hardware acceleration and record the actual WebGL renderer. Keep OS, browser, GPU and software-rendered lanes separate. [Playwright visual comparisons](https://playwright.dev/docs/test-snapshots)
2. Capture `hero-desktop` at 1440 × 900 CSS pixels / DPR 1 and `hero-mobile` at 390 × 844 / DPR 3 with touch enabled. Export CSS-pixel PNGs and record effective renderer and composer DPR. Use `resetView()` and `freezeAt(3.4)`, wait for the canvas, fonts and two animation frames, then check that two captures agree. Mask the live FPS counter in pixel regression shots.
3. Add a named-shot harness in Stage 2. Record full camera position, target, up, FOV and pose time in a manifest. Add front, side and rear silhouette shots, a three-quarter mantle close-up, and alternate poses at 0 and 6.8 seconds. Keep these preset definitions under review so a camera move cannot silently change the comparison. Human review also uses a short turntable and live motion.
4. Store approved, compressed goldens from the designated lane and their manifest. Keep raw candidates, diffs, clips and traces in local evidence or approved PR artifacts. Link evidence from the PR and ledger, and record artifact expiry. Use `<sha12>-<shot>-<pose>-<lane>.png`. Inspect repeated identical runs to choose a per-shot tolerance for driver and raster variation. Bless new goldens only after reviewing the diff. Compare reference fidelity separately using paired, consistently cropped images and the visual rubric.

## Functional and performance gates

- Require passing math and geometry checks and a successful build. Test drag, pinch/scroll, reset, pause/resume, reduced-motion startup, orientation/resize, and the WebGL-unavailable fallback. Require zero page errors, unexpected failed requests, shader diagnostics, and unexpected WebGL context loss. Capture browser emulation and run a physical mobile smoke test. Record missing coverage as unverified.
- Run unpaused performance trials separately without screenshots or DevTools overlays. Warm up for 5 seconds and collect 3 × 15 seconds of foreground rAF frame intervals. Record p50/p95/p99 frame times, counts above 16.7/33.3 ms, trial FPS and refresh rate. Log cold startup separately. For quality tiers, record viewport, DPR and effective buffer sizes.
- Capture full-frame draw calls and triangles with `renderer.info.autoReset = false` during the sample and reset once per complete composer frame. Report texture and geometry counts, render-target formats and sizes, and estimate buffer bytes from attachment dimensions, format, mip levels and samples. GPU timer queries are optional when supported and valid. Label estimates and CPU wall time as such.
- Initial targets for named hardware are desktop p95 ≤18 ms at 60 Hz and physical mobile p95 ≤34 ms at 30 FPS minimum. Confirm these targets with Stage 2 device measurements. Until the budget is reviewed, flag a >10% p95 regression or >15% growth in draw calls or triangles on the same lane. Log peak attachment estimates and compare them to the baseline. Document any exception with independent reviewer sign-off.

## Agent handoff and ledger

Codex implements one scoped hypothesis. A human or separately authorized vision-capable reviewer judges artifact pairs independently and supplies a verdict with evidence. GitHub issues and PRs are the durable handoff. Stage 2 should introduce a small tracked iteration ledger, with one entry per attempt:

```text
Date / issue / phase / builder / independent reviewer
Base SHA / candidate SHA / lane and manifest / reference hash
Hypothesis / targeted rubric row / change and rollback commit
Before / after / diff / turntable links
Tests and browser findings / timing and resource deltas
Independent rubric and rationale / keep, iterate or revert / next task
```

If integrity or budget regresses, isolate or revert the candidate commit and rerun the last passing manifest. Preserve the rejected result and rationale in the ledger.
