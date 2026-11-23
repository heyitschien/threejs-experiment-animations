# Stage 5 · Glass and studio lighting

**Builder recommendation: keep for independent review.** The aperture reads as clear glazing over a recessed gold rotor. Broad silver highlights now follow the mantle and arm plates, with graphite seams and restrained amber and violet accents. The [original concept](../reference/octopus-concept.png) remains the separate artistic target. Its reflective ground, atmosphere and complex optical effects remain beyond this stage.

| Checkpoint | Exact commit |
| --- | --- |
| Stage 4 baseline / draft PR #8 | `f292943de3a1387b0ed76ca642b0ae17bc33c1b9` |
| Neutral alpha glass comparison | `99bcdff47a8137f4fab93dd2e84075159b49872d` |
| Thin physical transmission comparison | `e9b72867449fb14196a9c477d4c2b782ade4f465` |
| Final studio render and QA | `944929aead64b8de048a38d93019dacd4e722bf2` |

## Glass decision before relighting

The three materials were captured at identical Stage 4 lighting, frozen time and camera settings. See [matched detail, front, three-quarter and side](https://raw.githubusercontent.com/heyitschien/threejs-experiment-animations/01dd45707db85d19b678685bb80d5f5c96abe480/glass-ab.jpg) and [360 px glass comparison](https://raw.githubusercontent.com/heyitschien/threejs-experiment-animations/01dd45707db85d19b678685bb80d5f5c96abe480/glass-mobile.jpg).

- **Existing blue alpha:** the colored specular sheet reads as a blue panel and competes with the vanes.
- **Neutral alpha:** removing the saturated tint makes the vane edges easier to distinguish. The 0.23-opacity comparison is slightly milky under the original lights. The final studio version uses 0.14 opacity and a lower neutral albedo to cut veil while preserving a rim reflection.
- **Physical transmission:** `transmission: 0.98`, `ior: 1.45`, `thickness: 0` for the open, thin surface, with `metalness: 0` and `opacity: 1`. This gives a clean surface accent, but the face softened the fine vane edges and broadened the bright center in the close-up. Its WebGL opaque prepass made for a large workload increase at similar observed browser cadence. [Three.js material documentation](https://threejs.org/docs/pages/MeshPhysicalMaterial.html)

An 8-second foreground diagnostic per profile after 3 seconds of warmup used headed pinned Chromium with the existing composer.

| Option | Desktop FPS / p50 / p95 / p99 ms | 390 px emulated FPS / p50 / p95 / p99 ms | Calls / triangles / textures |
| --- | --- | --- | --- |
| Existing alpha | 120.00 / 8.3 / 9.3 / 9.4 | 120.00 / 8.3 / 9.2 / 9.3 | 84 / 76,782 / 15 |
| Neutral alpha | 120.00 / 8.3 / 9.3 / 9.4 | 119.99 / 8.3 / 9.3 / 9.4 | 84 / 76,782 / 15 |
| Transmission | 120.00 / 8.3 / 9.3 / 9.4 | 120.00 / 8.3 / 9.3 / 9.3 | 145 / 142,578 / 16 |

Transmission added 61 calls (+72.6%), 65,796 triangles (+85.7%) and one texture. The installed r187 renderer takes an opaque-scene prepass into a mipmapped, multisampled target at the composer viewport. At RGBA16F the resolved color mip chain alone would be approximately 13.2 MiB at 1440 × 900 and 1.9 MiB at 390 × 481. That estimate excludes multisample/depth storage and driver overhead. These diagnostics compare work, and do not establish phone frame rates or GPU time. Neutral alpha won on sharper machinery and lower rendering work. It retains surface reflections with no physical refraction pass.

## Studio pass

`src/octopus.js` keeps the material classes and changes silver, graphite and glass settings plus warm core and emitter levels. `src/main.js` retunes the existing five procedural PMREM reflectors, four point lights and hemisphere light. The broad neutral key and fill draw silver bands across plates, and narrow violet, cool-white and warm strips separate edges. The original floor, rings, star field and composer are reused. ACES exposure is 0.98. Bloom strength is 0.17 and the threshold is 1.48. A dev-only QA toggle captures bloom on and off with the existing camera presets. `tests/mantleGeometry.test.js` guards the selected alpha path without transmission.

The final close-up shows more separation between the warm core, gold vanes and violet conductor. The wide desktop and mobile shots show less blue in the chrome and less glow on the dark seams. The rear now reads in silver bands even though the stronger amber focal effect is front-facing. At oblique views, glass is still a lightly reflective cover. Small phone-scale reactor details remain hard to distinguish at a glance. Bloom off retains the modeled surfaces and reduces the local halo around the brightest rims; subtle bloom on is the working default.

| Provisional visual rubric | Stage 4 → Stage 5 |
| --- | --- |
| Whole-creature silhouette and composition | 2 → 2. Same form, cameras and margins. |
| Chamber clarity | 1 → 2. The vanes and core separate from the frame; the glass remains an approximation. |
| Chrome and lighting | 2 → 3. Broader silver bands and warm/cool separation with less saturated spill. |
| Motion | 2 → 2. Same arms, head and rotor transforms. |
| Mobile readability | 2 → 2. Warm focal point is clearer; fine vanes remain small. |

[Concept vs. matched desktop renders](https://raw.githubusercontent.com/heyitschien/threejs-experiment-animations/01dd45707db85d19b678685bb80d5f5c96abe480/concept-before-after.jpg) · [Desktop](https://raw.githubusercontent.com/heyitschien/threejs-experiment-animations/01dd45707db85d19b678685bb80d5f5c96abe480/desktop.jpg) · [360/390 mobile](https://raw.githubusercontent.com/heyitschien/threejs-experiment-animations/01dd45707db85d19b678685bb80d5f5c96abe480/mobile.jpg) · [Front, three-quarter, side, rear and detail](https://raw.githubusercontent.com/heyitschien/threejs-experiment-animations/01dd45707db85d19b678685bb80d5f5c96abe480/angles.jpg) · [Pose sequence](https://raw.githubusercontent.com/heyitschien/threejs-experiment-animations/01dd45707db85d19b678685bb80d5f5c96abe480/poses.jpg) · [Bloom comparison](https://raw.githubusercontent.com/heyitschien/threejs-experiment-animations/01dd45707db85d19b678685bb80d5f5c96abe480/bloom.jpg) · [Five-second turntable](https://raw.githubusercontent.com/heyitschien/threejs-experiment-animations/01dd45707db85d19b678685bb80d5f5c96abe480/stage5-turntable.mp4) · [Capture manifest](https://raw.githubusercontent.com/heyitschien/threejs-experiment-animations/01dd45707db85d19b678685bb80d5f5c96abe480/manifest.json). [Full-resolution before/after files](https://github.com/heyitschien/threejs-experiment-animations/tree/01dd45707db85d19b678685bb80d5f5c96abe480).

## Validation and limits

- `npm run check` passed 15 Node tests and the Vite build. The existing entry-size warning remains.
- `OCTO_CAPTURE_CANDIDATE=1 OCTO_REVISION_VIEWS=1 npm run qa:browser` passed 22 cases on both baseline and final (18 repeatable captures and four smoke tests). Orbit, wheel/pinch zoom, pause/resume, reset, reduced motion, resize and WebGL fallback passed. Healthy runs showed no unexpected warnings or errors.
- All nine v0.1 golden blobs were preserved. Direct pixel comparisons differ for all nine as expected. The strict Playwright golden suite was not rerun for this lighting pass.
- Lane: macOS 26.6.2 (25G83) arm64, Apple M3 Max ANGLE Metal, Playwright 1.65.1, Chrome for Testing 159.0.8154.6 revision 1255. Headless page-only captures use 1440 × 900 at DPR 1 and 360/390 × 844 touch emulation at DPR 3. Camera, pose and effective buffers were matched. GitHub evidence is sanitized and the manifest includes source SHAs and hashes.
- No dependencies, geometry, tentacle/head motion, UI, camera presets or goldens changed. No external assets were acquired and no fees incurred.

## Final timing

`npm run qa:perf` used headed Chromium, 5 seconds of warmup and three 15-second foreground trials in each profile. Ten-second blank-page controls measured 120.05 and 120.00 FPS with 8.5 and 8.5 ms p95.

| Run | FPS | p50 / p95 / p99 (ms) | Frames >16.7 / >33.3 ms |
| --- | ---: | --- | --- |
| Desktop Stage 4 1 | 120.00 | 8.30 / 9.30 / 9.40 | 0 / 0 |
| Desktop Stage 4 2 | 120.00 | 8.30 / 9.30 / 9.40 | 0 / 0 |
| Desktop Stage 4 3 | 120.00 | 8.30 / 9.30 / 9.40 | 0 / 0 |
| 390 px emulated Stage 4 1 | 120.00 | 8.30 / 9.30 / 9.40 | 0 / 0 |
| 390 px emulated Stage 4 2 | 120.00 | 8.30 / 9.30 / 9.40 | 0 / 0 |
| 390 px emulated Stage 4 3 | 120.00 | 8.30 / 9.30 / 9.40 | 0 / 0 |
| Desktop Stage 5 1 | 120.00 | 8.30 / 9.30 / 10.10 | 0 / 0 |
| Desktop Stage 5 2 | 120.01 | 8.30 / 9.30 / 9.40 | 0 / 0 |
| Desktop Stage 5 3 | 120.00 | 8.30 / 9.30 / 9.40 | 0 / 0 |
| 390 px emulated Stage 5 1 | 120.00 | 8.30 / 9.30 / 9.40 | 0 / 0 |
| 390 px emulated Stage 5 2 | 120.00 | 8.30 / 9.30 / 9.40 | 0 / 0 |
| 390 px emulated Stage 5 3 | 120.00 | 8.30 / 9.30 / 9.40 | 0 / 0 |

Both builds retained **84 draw calls**, **76,782 triangles**, **15 textures** and **63 reported geometries** per full frame. Estimated composer targets stay at 38.72 MiB desktop and 5.61 MiB in 390 px emulation, excluding GPU driver and other scene resources. The selected glazing allocates no transmission target. GPU headroom and physical-phone performance remain unverified because these are browser rAF intervals on the Mac. Raw frames and timing samples stay in ignored local evidence.
