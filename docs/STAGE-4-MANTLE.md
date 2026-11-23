# Stage 4 · Procedural mantle

**Recommendation: keep for independent review.** The old stacked cap and sphere became a single swept chrome shell with a distinct neck and crown, a framed chamber set into the shell, and a plated rear spine. The new profile takes its direction from the raised mantle and inset glowing cavity in the [original concept](../reference/octopus-concept.png). The tentacles, body and head motion, camera presets, materials, lights, postprocessing, UI, dependencies and v0.1 goldens are unchanged. The replacement reactor rotates its internal rotor. Stage 4 is geometry only.

| Checkpoint | Commit |
| --- | --- |
| Stage 3 base / PR #6 | `9052650a8e3da6c89567003537192e292fb3b30c` |
| Bare loft, aperture and bearing prototype | `558e30e949a5e9c19d7a5710e5011def1e49b22b` |
| Final render and test candidate | `fddaa6ceb82fab49e181106cbc925b923cb56415` |

## Engineering

- `src/mantleGeometry.js` sweeps elliptical cross-sections along a Catmull–Rom centerline, with a changing angular interval for the cutout. The same rim vertices define the dark throat, convex glass and metal frame. The shell is indexed and capped at both ends.
- `src/mantle.js` adds long armor strips on the loft, a recessed rotor with twelve instanced gold vanes, a smaller optic, and a bearing fixed to the root cluster. The dorsal panel and rails break up the rear without creating a second bright focal point. All head meshes are built once.
- `src/octopus.js` mounts the new head and spins the rotor with the existing animation time. Tentacle geometry, socket placement and arm animation code remain unedited.
- `tests/mantleGeometry.test.js` checks indexing, finite unit normals, a single aperture boundary, opposite winding along internal edges, end-cap direction, and neck and socket seating at 0.25-second intervals through 24 seconds.

## Matched review

The bare prototype was rendered and reviewed before adding the chamber assembly. In the front and three-quarter shots, the long cheek merges into the crown and the aperture has a clear recess. In profile the shell rolls over the chamber, and from the rear the new rails and dark panel mark the spine. The glass shows the warm reactor inside under the same light rig, with a separate smaller optic below. The rear rail accents and some internal gold fins are subtle at phone scale, and the overhead highlights can partially wash out the bevel in the close-up. Neither mobile hero clips the crown or overlaps the controls.

| Provisional builder rubric | Stage 3 → Stage 4 |
| --- | --- |
| Whole-creature silhouette | 2 → 2. More coherent head-to-neck line; the preserved arms still overlap from some angles. |
| Mantle | 2 → 3. Clear improvement from front, side and rear. |
| Materials and lighting | 2 → 2. Same lighting and materials, with different highlight shapes from the loft. |
| Motion | 2 → 2. Roots stay seated, head tilt and arm motion are preserved. |
| Composition | 2 → 2. Full sculpture fits desktop and both tested phone widths. |

[Desktop comparison](https://raw.githubusercontent.com/heyitschien/threejs-experiment-animations/325442b152f91f274684f28b4298bdea1d070c0e/desktop.jpg) · [360/390 mobile](https://raw.githubusercontent.com/heyitschien/threejs-experiment-animations/325442b152f91f274684f28b4298bdea1d070c0e/mobile.jpg) · [Front, side, rear, three-quarter and mantle detail](https://raw.githubusercontent.com/heyitschien/threejs-experiment-animations/325442b152f91f274684f28b4298bdea1d070c0e/mantle-angles.jpg) · [Bare prototype](https://raw.githubusercontent.com/heyitschien/threejs-experiment-animations/325442b152f91f274684f28b4298bdea1d070c0e/prototype-angles.jpg) · [Fixed pose sequence](https://raw.githubusercontent.com/heyitschien/threejs-experiment-animations/325442b152f91f274684f28b4298bdea1d070c0e/poses.jpg) · [Turntable](https://raw.githubusercontent.com/heyitschien/threejs-experiment-animations/325442b152f91f274684f28b4298bdea1d070c0e/turntable.mp4) · [Capture manifest](https://raw.githubusercontent.com/heyitschien/threejs-experiment-animations/325442b152f91f274684f28b4298bdea1d070c0e/manifest.json). Full-resolution images are in the `before/` and `after/` directories of the [evidence commit](https://github.com/heyitschien/threejs-experiment-animations/tree/325442b152f91f274684f28b4298bdea1d070c0e).

The 18 matched captures per runtime build use Playwright 1.65.1 and Chromium 159.0.8154.6 (revision 1255), ANGLE Metal on Apple M3 Max, 1440 × 900 DPR 1 desktop and 360/390 × 844 DPR 3 touch emulation. Metadata checks matched pose, viewport, camera within 1e-12 and effective render buffers. The published page-only PNGs were re-encoded without metadata. The manifest records the original capture hashes and separately identifies the published files.

## Validation

- `npm run check` passed all 13 Node tests and the Vite production build. The existing bundle-size warning remains.
- `OCTO_CAPTURE_CANDIDATE=1 OCTO_REVISION_VIEWS=1 npm run qa:browser` passed 22 cases on each build (18 repeatable captures, four smoke tests). Ten silhouette-only browser captures also passed. Smoke covers WebGL 2, fallback, orbit, zoom, pause, reset, reduced motion and resize. No unexpected browser errors or warnings were detected.
- The nine original goldens are byte-identical. Direct comparison against each verified that the Stage 4 render differs in all nine. The strict Playwright golden suite was not rerun, and no golden was replaced. These differences are expected when comparing new geometry with the v0.1 images.
- Local evidence includes archived prototype, before and after candidate captures, benchmark JSON and raw intervals. The public branch carries sanitized imagery and capture provenance. Existing local browser and FFmpeg tools were reused without installs or new assets. No spend.

## Performance

Both runs used `npm run qa:perf` on headed pinned Chromium and Apple M3 Max with 5 seconds of warmup and three 15-second foreground trials per profile. Surrounding 10-second blank-page controls were 120.06 and 120.00 FPS, with 9.1 and 9.3 ms p95 respectively.

| Run | FPS | p50 / p95 / p99 (ms) | Frames >16.7 / >33.3 ms |
| --- | ---: | --- | --- |
| Desktop Stage 3 1 | 120.07 | 8.30 / 8.40 / 8.70 | 0 / 0 |
| Desktop Stage 3 2 | 119.93 | 8.30 / 9.20 / 9.30 | 0 / 0 |
| Desktop Stage 3 3 | 120.00 | 8.30 / 8.40 / 9.00 | 0 / 0 |
| 390 px emulated Stage 3 1 | 120.00 | 8.30 / 8.60 / 9.30 | 0 / 0 |
| 390 px emulated Stage 3 2 | 120.00 | 8.30 / 8.50 / 9.30 | 0 / 0 |
| 390 px emulated Stage 3 3 | 120.00 | 8.30 / 8.70 / 9.40 | 0 / 0 |
| Desktop Stage 4 1 | 120.00 | 8.30 / 9.20 / 9.30 | 0 / 0 |
| Desktop Stage 4 2 | 120.00 | 8.30 / 9.20 / 9.30 | 0 / 0 |
| Desktop Stage 4 3 | 119.99 | 8.30 / 9.10 / 9.40 | 0 / 0 |
| 390 px emulated Stage 4 1 | 120.04 | 8.30 / 9.20 / 9.30 | 0 / 0 |
| 390 px emulated Stage 4 2 | 120.00 | 8.30 / 9.20 / 9.30 | 0 / 0 |
| 390 px emulated Stage 4 3 | 119.99 | 8.30 / 9.20 / 9.30 | 0 / 0 |

The new mantle replaces many separately drawn rings and rivets. Full-frame draw calls dropped **106 → 84 (−20.8%)**, triangles **90,862 → 76,782 (−15.5%)**, geometries **85 → 63**, with textures unchanged at 15. Timing stayed near the 120 FPS cadence limit. Desktop p95 remained within the prior range. The emulated mobile p95 increased 0.5–0.7 ms with unchanged display-rate throughput and no interval above 16.7 ms. GPU headroom and physical-phone performance remain unverified.
