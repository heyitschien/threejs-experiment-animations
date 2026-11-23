# Stage 3 tentacle review

Issue #5 tests whether a continuous, tapered shell improves the tentacle silhouette. The original link cylinders, circular rims and twin emitters produced visible joints and interrupted the highlight along each arm. A simple smooth tube would close those gaps but lose the mechanical segmentation. The chosen sweep keeps a closed dark underside and narrow seams under the chrome plates, with one inset amber emitter and gold housing per plate.

## Prototype and implementation

Baseline and stack base: `b742d7dae92cd9788d705731fc58cff9e44adb2e`. The first trial replaced only the lower-right foreground arm at `02745bf29d7d1f330c7071cb634ff10b2f0bc439`. It removed link gaps but exposed a weak mid-arm highlight and tip reversals in the geometry scan. A broader armor band helped highlights, but a modified version of the original curl still folded against itself. The one-arm proof at `0cd980be24bbdb92da1ce4de871f1205ebaef78c` used a tangent-aligned moving arc. Front, side, rear and front poses at 0, 3.4 and 6.8 seconds showed a continuous surface, a seated root and a readable open curl. The retained local sheet compares that one arm against the seven original arms and v0.1.

- `src/tentacleMath.js` keeps the eight mount locations and uses different curl angles, phase-offset shoulder movement and delayed tip travel. Its tip arc avoids the cancellation of the earlier inward turn.
- `src/tentacleSweep.js` approximates arc length from 145 centerline samples. It distributes 61 rings over 12 shallow armor panels, transports the local frame along the tangent, and computes normals from surface differences. It creates closed indexed topology and reusable arrays once, then writes positions and normals each animation update.
- `src/sculptedTentacles.js` places two instanced batches for gold housings and amber emitters along the transported underside. `src/octopus.js` wires in all eight sweeps and retains the original sockets. The mantle, lighting, materials, camera, controls and layout are carried through.
- `tests/tentacleSweep.test.js` checks closed and consistently wound topology, finite positions and unit normals, outward faces, taper, attachment, ring/frame continuity and sampled clearances. It checks all eight arms every 0.25 seconds through 24 seconds. Envelope clearance excludes intended root proximity and neighboring rings. It is a sampled geometric check.

## Matched evidence

The final render candidate is `fec773d631ee1deb860267a4c5c696707d841d48`. Both captures used Playwright 1.65.1, Chrome for Testing 159.0.815.4.6 revision 1255, macOS arm64, and ANGLE Metal on Apple M3 Max. The [nine original PNGs and their manifest](../qa/goldens/) are unchanged in Git. Baseline tests freshly matched each original image. The candidate records the same poses, camera values within 1e-12, viewports (1440 × 900 at DPR 1 and 390 × 844 touch at DPR 3), and effective renderer/composer DPR.

Local evidence under `octo-evidence/stage3/` includes the original run records in `before/`, the one-arm trials, the nine candidate PNGs and provenance in `after/`, strict actual/expected/diff outputs in `strict/`, and a combined `manifest.json` and `after-comparison.jpg`. These files are ignored. Use the reviewer's local capture lane for reproduction. Repository PNGs remain at their original Stage 2 hashes.

| Rubric, provisional builder score | v0.1 → Stage 3 | Observations |
| --- | --- | --- |
| Silhouette | 1 → 2 | Long uninterrupted bends and taper separate the sweeping foreground arms. Some projected curls still overlap; the side view compresses several arms. |
| Mantle | 2 → 2 | The mantle and optic retain their original geometry. The reduced clutter at the arm junction changes their framing. |
| Materials and lighting | 2 → 2 | Same materials and lights. Long panels show broader continuous highlights in the close-up. The narrower dark undersides and fine tips read less brightly at small scale. |
| Motion | 1 → 2 | Phase-offset curls and transported details remain seated across sampled poses. The overlap checks cover sampled 3D envelopes; the turntable remains useful for evaluating projected crossings. |
| Composition | 2 → 2 | Both hero sizes fit the whole sculpture. A few skinny tips compete with scene rings in the mobile image, and some curls approach the desktop copy region. |

## Validation and reproduction

Use the installed Stage 2 pins and the same loopback test lane. Run the base from a separate checkout and save its test and benchmark artifacts before reusing an output directory.

```sh
npm run check
npm run qa:browser
OCTO_CAPTURE_CANDIDATE=1 npm run qa:browser
npm run qa:perf
```

- Stage 2 base: 6 math tests, production build, 9 exact golden comparisons, 4 smoke cases, and 2 benchmark cases passed.
- Stage 3: all 9 Node tests and the build passed. The existing entry-size warning remains. All 13 candidate capture/smoke cases passed, including repeated byte-identical candidate screenshots and healthy WebGL 2. This mode writes candidate evidence. The default browser command continues checking the original goldens. It reported 9 intentional pixel mismatches and 4 passing smoke cases. No golden was refreshed.
- Browser checks exercised drag, pinch, wheel, reset, pause/resume, reduced motion, resize and forced WebGL fallback. No unexpected browser diagnostics were found in the passing smoke/candidate runs.
- The existing Stage 2 browser and dependencies were reused. No new installs, fees, assets or paid providers. Browser validation used loopback and GitHub was used for repository review. Physical-phone coverage remains unverified.

## Performance

Same physical Mac, headed pinned Chromium and stage-specific source SHA. Each profile used three 15-second runs after 5 seconds of warmup. These are foreground rAF intervals, including scheduling, and the mobile profile was desktop emulation.

| Profile and run | FPS | p50 / p95 / p99 (ms) | Frames >16.7 / >33.3 ms |
| --- | --- | --- | --- |
| Desktop base 1 | 30.00 | 33.3 / 34.2 / 34.3 | 450 / 236 |
| Desktop base 2 | 30.00 | 33.3 / 34.1 / 34.3 | 451 / 227 |
| Desktop base 3 | 30.00 | 33.3 / 34.2 / 34.3 | 450 / 258 |
| Desktop candidate 1 | 38.44 | 30.1 / 35.1 / 91.3 | 410 / 152 |
| Desktop candidate 2 | 27.45 | 24.4 / 105.6 / 220.3 | 280 / 134 |
| Desktop candidate 3 | 56.46 | 16.6 / 34.8 / 50.2 | 366 / 66 |
| Emulation base 1 | 30.00 | 33.3 / 34.2 / 34.3 | 450 / 258 |
| Emulation base 2 | 30.00 | 33.3 / 34.2 / 34.3 | 451 / 211 |
| Emulation base 3 | 30.00 | 33.3 / 34.2 / 34.3 | 451 / 268 |
| Emulation candidate 1 | 54.39 | 16.1 / 34.0 / 43.7 | 365 / 86 |
| Emulation candidate 2 | 74.25 | 8.4 / 33.4 / 41.7 | 237 / 67 |
| Emulation candidate 3 | 95.59 | 8.4 / 24.2 / 32.4 | 149 / 10 |

The full composer frame changed from **92 to 106 calls (+15.22%)** and **159,790 to 90,862 triangles (−43.14%)** in both profiles. Eight sweeps use 16 draw calls across chrome and core, plus two shared instanced emitter batches, replacing four old link batches. Accepting that call count exceeds the 15% review threshold and requires a reviewer decision. Texture count stayed at 15 and geometry count moved from 79 to 85. Composer attachment estimates stayed at 38.72 MiB desktop and 5.61 MiB emulated. They exclude mesh buffers and driver memory. The sweep updates about 138 KiB of position/normal data plus approximately 12 KiB of emitter matrices per animated frame using reusable buffers. The measured CPU/GPU contribution of those uploads remains unknown.

### Controlled desktop retest

The first pass mixed a 30 FPS base with unstable candidate cadence, including a 105.6 ms p95 outlier. That run cannot attribute the outlier to the geometry or establish a >10% p95 regression. A second back-to-back desktop run bracketed both builds with 10-second blank-page controls at 120.09 and 120.00 FPS (9.1 and 8.9 ms p95 respectively).

| Retest | FPS, all three trials | p50 / p95 / p99 (ms) | Frames >16.7 / >33.3 ms |
| --- | --- | --- | --- |
| Desktop v0.1 | 120.00 | 8.3 / 9.2 / 9.3–9.4 | 0 / 0 in each trial |
| Desktop candidate | 120.00 | 8.3 / 8.4 / 9.2–9.3 | 0 / 0 in each trial |

Both passed the 18 ms desktop rAF target in this stable host session. The measured p95 difference was −0.8 ms (−8.7%). The display cadence capped both profiles, so GPU headroom and physical-phone timing remain unverified. Raw intervals and JSON are kept locally in the `before-performance/`, `after-performance/`, and `retest-*-desktop/` evidence subdirectories. Independent visual review and a decision on the draw-call increase are pending.

## Approved silhouette revision

Reviewed base `8645c8cd9a9363e4e7e8231972664bceb0f543f7`. Render and QA candidate `31d1b04561a4f25ca726e372b3bfe52313d763b1`. The revision adds up to 0.014 scene units of radius over the final 14% of arc length on the lower-left and upper-right arms (arms 3 and 6, one-based). Both tips still taper monotonically to their existing closed caps. The foreground lower-right arm (arm 4) opens its terminal curl by 0.55 radians, smoothly blended after the first 28% of the curl. The mantle, materials, lighting, UI, dependencies and all nine v0.1 goldens were preserved.

Playwright 1.65.1 and pinned Chromium 159.0.8154.6 (revision 1255), macOS arm64, ANGLE Metal on Apple M3 Max. Matched page-only captures used 1440 × 900 at DPR 1 and 360 × 844 and 390 × 844 at emulated DPR 3. Compared hero and front at 0, 3.4 and 6.8 seconds and checked side, rear, three-quarter and mantle-detail at 3.4 seconds. Camera, viewport and pose metadata matched within numerical precision. The 360 and 390 images retain a more legible tip edge without thickening the shafts. The lower-right endpoint now reads separately from the neighboring shaft, though the shafts can still overlap in projection. At 3.4 seconds, the sampled projected endpoint-to-neighbor-centerline distance rose from 5.5 to 13.3 CSS pixels at 360, and from 5.6 to 14.1 at 390. This diagnostic measures centerlines, not the gap between individual rendered edges. Provisional silhouette score stays **2/3**, with the named defects improved and some view-dependent overlap remaining. Independent review is pending.

[Matched 360/390 renders](https://raw.githubusercontent.com/heyitschien/threejs-experiment-animations/cbe3097f5fe47f0a91396d97dc1cfadea78b99b1/mobile-before-after.jpg) · [Desktop hero/front](https://raw.githubusercontent.com/heyitschien/threejs-experiment-animations/cbe3097f5fe47f0a91396d97dc1cfadea78b99b1/desktop-before-after.jpg) · [Three-pose sequence](https://raw.githubusercontent.com/heyitschien/threejs-experiment-animations/cbe3097f5fe47f0a91396d97dc1cfadea78b99b1/mobile-pose-sequence.jpg).

`npm run check` passed 10 Node tests and the build with the existing bundle-size warning. `OCTO_CAPTURE_CANDIDATE=1 OCTO_REVISION_VIEWS=1 npm run qa:browser` passed 18 deterministic captures and four smoke cases. The nine original golden files have identical Git blobs. Direct pixel comparison confirmed differences for all nine candidate views, so those strict-golden mismatches remain expected. The strict suite was not rerun for this revision.

### Revision timing check

Reran `npm run qa:perf` on both runtime commits. Headed pinned Chromium with Apple M3 Max ANGLE Metal, 5-second warmup, three 15-second foreground trials in each profile.

| Run | FPS | p50 / p95 / p99 (ms) | Frames >16.7 / >33.3 ms |
| --- | ---: | --- | --- |
| Desktop Reviewed 1 | 120.00 | 8.30 / 9.20 / 9.30 | 0 / 0 |
| Desktop Reviewed 2 | 120.00 | 8.30 / 9.10 / 9.30 | 0 / 0 |
| Desktop Reviewed 3 | 120.00 | 8.30 / 9.10 / 9.30 | 0 / 0 |
| 390 px emulated Reviewed 1 | 120.00 | 8.30 / 8.90 / 9.30 | 0 / 0 |
| 390 px emulated Reviewed 2 | 120.00 | 8.30 / 8.80 / 9.30 | 0 / 0 |
| 390 px emulated Reviewed 3 | 120.00 | 8.30 / 9.20 / 9.40 | 0 / 0 |
| Desktop Revision 1 | 120.00 | 8.30 / 8.70 / 9.30 | 0 / 0 |
| Desktop Revision 2 | 120.00 | 8.30 / 8.80 / 9.30 | 0 / 0 |
| Desktop Revision 3 | 120.00 | 8.30 / 8.70 / 9.30 | 0 / 0 |
| 390 px emulated Revision 1 | 120.00 | 8.30 / 8.50 / 9.30 | 0 / 0 |
| 390 px emulated Revision 2 | 120.01 | 8.30 / 8.50 / 9.30 | 0 / 0 |
| 390 px emulated Revision 3 | 120.00 | 8.30 / 8.40 / 9.30 | 0 / 0 |

All runs used 106 calls and 90,862 triangles per composer frame. The approved Stage 3 draw-call exception remains in effect. The cadence measurements are browser rAF intervals. Physical mobile and GPU headroom remain unverified. Raw captures, manifests and intervals are local and ignored.
