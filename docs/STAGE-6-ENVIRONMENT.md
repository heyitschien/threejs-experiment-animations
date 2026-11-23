# Stage 6 · Hero composition and cinematic ground

**Builder recommendation: keep for independent review.** The creature has more visual weight and a clearer relationship to the ground. The stage keeps the dark, space-like setting and adds light streaks, contact shading and a low atmospheric layer. The octopus geometry, animation, Stage 5 materials and lights, camera controls, dependencies and original goldens are preserved.

| Checkpoint | Exact commit |
| --- | --- |
| Stage 5 baseline, draft PR #10 | `df1843351ed3540533bda2996cbffeafe91b7346` |
| Selected hero framing and layout | `777bb250eb44739236ceb14cedcd7f0fb6a0018d` |
| Environment | `60916f90faf8d0d5651d05e8a8c1a267b5b76969` |
| Final runtime and QA | `8738d86562a27021d0f89db14cbc4af37a0e75dc` |

## A · Framing first

The original view, a closer view and a bolder view were rendered under the Stage 5 environment at 0, 3.4 and 6.8 seconds. All nine frames per viewport use the same browser, DPR and pose. Only the opening camera changes across the three columns.

| Arm shell projected width at 3.4 s | Current | Close | Bold |
| --- | ---: | ---: | ---: |
| 1440 px desktop | 698.8 px | 772.2 px | 816.9 px |
| 360 px touch emulation | 295.4 px | 308.5 px | 320.8 px |
| 390 px touch emulation | 318.7 px | 332.8 px | 346.1 px |

The closer view gains **10.5% desktop and 4.4% on both phone widths**. The bolder view crowds the right telemetry panel and reduces clearance for the animated tips on mobile. The selected view shifts the subject slightly right on desktop and centers it on phones. The same headline, actions and specimen panel move just enough on wide desktop to clear the arm sweep in the reviewed poses. The dedicated opening preset lives in `src/heroFraming.js` and eases toward the original framing at intermediate widths. The fixed front, side, rear, three-quarter and detail presets in `qa/shots.js` are unchanged.

[Desktop framing options](https://raw.githubusercontent.com/heyitschien/threejs-experiment-animations/9e888ab8b6ae05cd9e6c19bc60f90c9eeef98715/framing-desktop.jpg) · [360 px options](https://raw.githubusercontent.com/heyitschien/threejs-experiment-animations/9e888ab8b6ae05cd9e6c19bc60f90c9eeef98715/framing-360.jpg) · [390 px options](https://raw.githubusercontent.com/heyitschien/threejs-experiment-animations/9e888ab8b6ae05cd9e6c19bc60f90c9eeef98715/framing-390.jpg) · [Selected framing with adjusted panel spacing](https://raw.githubusercontent.com/heyitschien/threejs-experiment-animations/9e888ab8b6ae05cd9e6c19bc60f90c9eeef98715/framing-selected.jpg).

## B · Ground and atmosphere second

`src/stageEnvironment.js` replaces the flat disc and four bright rings with a world-space dark floor, soft silver, violet, amber and cool reflection proxies, a shaded contact pool, a low haze plane and two restrained arcs. The streaks ripple irregularly and fade into the background. Haze is transparent and depth-tested. Both effects are simple shader surfaces with zero reflection render targets, texture downloads or new lights. The visual proxy suggests wet ground without reproducing a live mirror image of the creature. Existing chrome, bloom and UI remain. See the [desktop environment A/B](https://raw.githubusercontent.com/heyitschien/threejs-experiment-animations/9e888ab8b6ae05cd9e6c19bc60f90c9eeef98715/environment-ab.jpg) and [mobile environment A/B](https://raw.githubusercontent.com/heyitschien/threejs-experiment-animations/9e888ab8b6ae05cd9e6c19bc60f90c9eeef98715/environment-mobile-ab.jpg), which hold the selected camera and layout fixed.

| Provisional builder rubric | Stage 5 → Stage 6 |
| --- | --- |
| Composition | 2 → 3. The larger opening view reads as the focal point without sacrificing the reviewed control margins. |
| Ground and atmosphere | 1 → 2. Dark contact and colored streaks give depth. Reflections remain proxies. |
| Silhouette, glass/chrome and motion | 2 → 2. Existing sculpture, material and animation are carried through. |
| Mobile readability | 2 → 2. Larger subject and distinct ground, with some dark tips still subtle. |

[Original concept and combined before/after](https://raw.githubusercontent.com/heyitschien/threejs-experiment-animations/9e888ab8b6ae05cd9e6c19bc60f90c9eeef98715/concept-before-after.jpg) · [Desktop](https://raw.githubusercontent.com/heyitschien/threejs-experiment-animations/9e888ab8b6ae05cd9e6c19bc60f90c9eeef98715/desktop.jpg) · [360/390 mobile](https://raw.githubusercontent.com/heyitschien/threejs-experiment-animations/9e888ab8b6ae05cd9e6c19bc60f90c9eeef98715/mobile.jpg) · [Multi-angle and close-up](https://raw.githubusercontent.com/heyitschien/threejs-experiment-animations/9e888ab8b6ae05cd9e6c19bc60f90c9eeef98715/angles.jpg) · [Hero poses](https://raw.githubusercontent.com/heyitschien/threejs-experiment-animations/9e888ab8b6ae05cd9e6c19bc60f90c9eeef98715/motion-poses.jpg) · [Five-second turntable](https://raw.githubusercontent.com/heyitschien/threejs-experiment-animations/9e888ab8b6ae05cd9e6c19bc60f90c9eeef98715/stage6-turntable.mp4) · [Capture manifest](https://raw.githubusercontent.com/heyitschien/threejs-experiment-animations/9e888ab8b6ae05cd9e6c19bc60f90c9eeef98715/manifest.json) · [Full-resolution before/after files](https://github.com/heyitschien/threejs-experiment-animations/tree/9e888ab8b6ae05cd9e6c19bc60f90c9eeef98715).

The concept remains richer in environment detail and complex broad translucent armor. This stage does not change arm shape, add terrain or trace reflections. A later, separately approved code-vs-Blender/glTF A/B could compare a single detailed arm asset and the current procedural arm under identical cameras and lights, using fidelity, editability, triangles and frame cost as review criteria. No asset work belongs to this PR.

## Verification

- `npm run check` passed 16 Node tests and the production build, with the existing entry-size warning. The added test projects the existing arm shells at 97 sampled poses through 24 seconds and checks an 8 px lateral safety margin plus the mobile mask's fully visible band.
- `OCTO_CAPTURE_CANDIDATE=1 OCTO_REVISION_VIEWS=1 npm run qa:browser` passed 18 matched captures and four health/interaction cases, including orbit, wheel/pinch zoom, reset, pause, reduced motion, resize and WebGL fallback. There were no unexpected WebGL diagnostics. Early still runs had intermittent byte mismatches. A captured rear mismatch changed only 138 of 1,296,000 pixels by a single channel level at the far left edge, outside the model. Candidate stills now require identical bytes or at most one level of channel difference in 0.10% of decoded pixels. The legacy strict path retains its original exact check. Each final capture records its measured stability. The final run had one non-identical pair (643 single-level pixels, 0.050% of the front view).
- Direct pixel comparisons confirmed the expected differences against all nine v0.1 views. Original golden blobs remain unchanged. The strict legacy golden suite was not rerun.
- Tested with Playwright 1.65.1, Chrome for Testing 159.0.815.4.6 revision 1255, macOS 26.6.2 arm64 and ANGLE Metal on Apple M3 Max. Desktop is 1440 × 900 DPR 1. Touch emulation is 360/390 × 844 DPR 3. Matched metadata covers camera, pose, effective buffers, and SHA-256. Page-only published images are re-encoded and exclude local identity metadata. Existing tools were reused without downloads or spend.

## Performance

`npm run qa:perf` used headed Chromium and three 15-second foreground trials after 5 seconds of warmup in each profile. Blank-page controls were 120.00 and 119.99 FPS, with 8.7 and 8.4 ms p95.

| Run | FPS | p50 / p95 / p99 (ms) | Frames >16.7 / >33.3 ms |
| --- | ---: | --- | --- |
| Desktop Stage 5 1 | 120.04 | 8.30 / 8.80 / 9.30 | 0 / 0 |
| Desktop Stage 5 2 | 120.07 | 8.30 / 8.80 / 9.30 | 0 / 0 |
| Desktop Stage 5 3 | 119.97 | 8.30 / 8.90 / 9.30 | 0 / 0 |
| 390 px emulated Stage 5 1 | 120.10 | 8.30 / 9.00 / 9.30 | 0 / 0 |
| 390 px emulated Stage 5 2 | 120.04 | 8.30 / 9.20 / 9.30 | 0 / 0 |
| 390 px emulated Stage 5 3 | 120.03 | 8.30 / 9.10 / 9.30 | 0 / 0 |
| Desktop Stage 6 1 | 120.01 | 8.30 / 9.20 / 9.40 | 0 / 0 |
| Desktop Stage 6 2 | 120.00 | 8.30 / 9.30 / 9.40 | 0 / 0 |
| Desktop Stage 6 3 | 120.00 | 8.30 / 9.20 / 9.30 | 0 / 0 |
| 390 px emulated Stage 6 1 | 120.00 | 8.30 / 9.20 / 9.40 | 0 / 0 |
| 390 px emulated Stage 6 2 | 119.99 | 8.30 / 9.30 / 9.30 | 0 / 0 |
| 390 px emulated Stage 6 3 | 120.00 | 8.30 / 9.20 / 9.30 | 0 / 0 |

Full-frame counters changed from **84 calls, 76,782 triangles, 15 textures and 63 reported geometries** to **83 calls, 73,250 triangles, 15 textures and 62 reported geometries**. Estimated composer render targets remain 38.72 MiB desktop and 5.61 MiB in 390 px emulation. The floor and haze add no textures or render targets. These are foreground rAF intervals, which remain near the host's display cadence. GPU headroom and physical iPhone/Android performance are unverified. Raw intervals and prototype images stay in ignored local evidence.
