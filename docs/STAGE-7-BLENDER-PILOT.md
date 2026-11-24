# Stage 7 · Single-tentacle Blender pilot

[Issue #14](https://github.com/heyitschien/threejs-experiment-animations/issues/14) · Stage 6 base `27c2c5c9c7bc3876f20a42d26770dceb857c557f` · Runtime and capture source `e7325344801997cacc4e96c92a0dee2c341a35c3`

## Reproduce

The pilot used macOS 26.6.2 on Apple Silicon, Blender **5.2.4 LTS** (`cd5dc428cce1`) and its bundled Python **3.13.13**. The official arm64 disk image and checksum were fetched from the Blender release directory. The DMG SHA-256 was `e73d564f97061b2496ccc5a0bd738937d2d3d0acae23621a00bbc7534dfd135f`. The app passed `codesign --verify --deep --strict` with bundle ID `org.blenderfoundation.blender` and Team ID `68UA947AUU`. It was copied to the user Applications folder alongside the existing Blender 4.4. Blender is GPL software. The GLB is generated entirely by the checked-in script with no third-party content, plugins, textures or Python packages. [Official packages and checksums](https://download.blender.org/release/Blender5.2/) · [Blender license](https://www.blender.org/about/license/)

```sh
octo_blender="$HOME/Applications/Blender-5.2.4.app/Contents/MacOS/Blender"
mkdir -p octo-evidence
"$octo_blender" --background --factory-startup --python-exit-code 1 \
  --python scripts/build_blender_tentacle.py -- octo-evidence/export-smoke.glb --smoke
"$octo_blender" --background --factory-startup --python-exit-code 1 \
  --python scripts/build_blender_tentacle.py -- src/assets/blender-tentacle.glb
shasum -a 256 src/assets/blender-tentacle.glb
npm run check
npm run dev
```

The headless named smoke cube loaded through Three.js GLTFLoader with one PBR material and 12 triangles. Two independent exports of the pilot were byte-identical. The pilot GLB is **194,652 bytes**, SHA-256 `cd0eaaeedac44f0ff6ed273b14a9be3b7ebc29209214ec134cd8b65d27d8d305`. It contains 11,044 triangles across five indexed, textureless PBR meshes. Blender runs at authoring time only.

Open the local scene with its default URL for A and add `?tentacle=blender` for B. B lazily requests the loader and GLB and replaces arm index 3 after binding succeeds. A stays visible through loading and on fetch or parse failure. Browser deformation uses the existing sweep centerline and transported frames. The mount, motion phase, handoff, other seven arms and scene setup are shared. Scene disposal releases the attached asset geometry/materials, and a load completing after disposal releases its detached asset.

```sh
OCTO_CAPTURE_CANDIDATE=1 OCTO_REVISION_VIEWS=1 OCTO_ARM_DETAIL=1 npm run qa:browser
OCTO_CAPTURE_CANDIDATE=1 OCTO_REVISION_VIEWS=1 OCTO_ARM_DETAIL=1 OCTO_BLENDER=1 npm run qa:browser
npm run qa:perf
OCTO_BLENDER=1 npm run qa:perf
```

## Visual review

The first export established the recessed graphite spine and staggered plates. Iteration two turned the broader chrome faces toward the foreground and changed their highlight profile. The final pass opened the chrome seams around the amber sockets to improve front readability. The original concept has broad reflective armor, deeper translucent channels and brighter continuous amber accents. The pilot gets closer on plate contours and recesses. It retains the Stage 6 silhouette path and uses opaque material throughout. [Original concept at the verified base](https://github.com/heyitschien/threejs-experiment-animations/blob/27c2c5c9c7bc3876f20a42d26770dceb857c557f/reference/octopus-concept.png)

| Builder score (0–3) | A | B | Observation |
| --- | ---: | ---: | --- |
| Armor and chrome | 2 | 3 | The close-up shows a wider swept shoulder, layered plate lips and longer curved specular highlights. |
| Recessed mechanism and amber | 2 | 2 | The graphite channel adds depth. Some oblique views still hide parts of the warm insets behind the armor. |
| Motion | 2 | 2 | Both use the same phase and silhouette path. Plate spacing varies through the curl. |
| 360/390 px readability | 2 | 2 | The brighter curl reads on both viewports. Most of the seam and socket detail disappears at hero scale. |

**Keep the procedural arm as the default.** The Blender asset is worthwhile as an optional hero close-up study. Keep the pilot for independent review before committing to a Blender authoring pipeline for the other arms. The fitted normals approximate transport through the bend, and contact between neighboring arms has no collision simulation. Phone performance remains unmeasured.

## Validation

- `npm run check` passed all 17 Node tests and the production build. Vite reported its bundle-size advisory.
- Playwright 1.65.1 passed 25 cases per lane in pinned Chromium. Coverage includes default asset isolation, malformed-GLB fallback, controlled poses and playback, pause/resume, orbit, zoom, reset, resize, touch, reduced motion and WebGL fallback. The expected WebGL initialization error was observed only in the test that disables WebGL.
- All 18 captured A views replayed pixel-identically against the Stage 6 base. The first B run had a two-level compositor delta on one arm-detail still. The full rerun passed the inherited one-level, 0.1% candidate threshold without changing it. Both the exact Stage 6 base and Stage 7 A reported all nine differences in the strict v0.1 snapshot run. The nine originals are byte-for-byte unchanged.
- B added three draw calls and 6,220 scene triangles. Geometry allocations rose from 62 to 67, textures stayed at 15, and render attachments were unchanged. The old arm remains available while the optional chunk and GLB load. In 19 fresh capture contexts, localhost fetch plus body read took 1.8–4.7 ms and parse plus bind took 3.6–4.6 ms. These figures exclude the dynamic loader chunk and first GPU draw.

The timing trials ran serially in headed Chromium on Apple M3 Max with ANGLE Metal. Each lane used three 15 s foreground trials after a 5 s warm-up. Blank controls bracketed the two variants. rAF intervals describe browser presentation cadence, and this machine's approximately 120 Hz ceiling can mask GPU headroom differences. Mobile numbers are desktop emulation.

| Lane | Variant | FPS range | p50 (ms) | p95 by trial (ms) | p99 by trial (ms) |
| --- | --- | ---: | ---: | --- | --- |
| Desktop | A | 119.99–120.00 | 8.3 | 9.3 / 9.9 / 10.2 | 9.3 / 10.3 / 10.3 |
| Desktop | B | 120.00–120.01 | 8.3 | 10.1 / 10.2 / 10.2 | 10.3 / 10.3 / 10.3 |
| 390 px emulation | A | 120.00 | 8.3 | 10.2 / 10.2 / 10.0 | 10.3 / 10.3 / 10.3 |
| 390 px emulation | B | 120.00 | 8.3 | 10.2 / 10.2 / 10.2 | 10.3 / 10.4 / 10.3 |
| Blank control | Before / after | 119.90 / 120.00 | 8.3 / 8.3 | 8.4 / 8.5 | 9.1 / 10.1 |

Chromium was **159.0.8154.6**, with Three.js 0.187.0, Vite 7.3.8, Node 26.13.0 and npm 11.20.0. No trial recorded an interval above 16.7 ms. Desktop median-trial p95 rose 0.3 ms and the emulated mobile median-trial p95 held steady. The blank control tail shifted during the run, so the small changes do not establish a GPU cost. Compare broader deployment only after a physical phone run and independent visual review.

## Published evidence

The archive contains 29 matched pairs with cameras, viewport/DPR, hashes and timestamps. The six-second clip uses a fixed close-up camera and 144 poses per variant at 24 fps. A is on the left in paired media.

[All captures](https://github.com/heyitschien/threejs-experiment-animations/tree/a59f46e65363987809666ab96c2830fa874c7892) · [Desktop A/B](https://raw.githubusercontent.com/heyitschien/threejs-experiment-animations/a59f46e65363987809666ab96c2830fa874c7892/hero-desktop-ab.jpg) · [360 px A/B](https://raw.githubusercontent.com/heyitschien/threejs-experiment-animations/a59f46e65363987809666ab96c2830fa874c7892/hero-mobile-360-3.4-ab.jpg) · [390 px A/B](https://raw.githubusercontent.com/heyitschien/threejs-experiment-animations/a59f46e65363987809666ab96c2830fa874c7892/hero-mobile-390-3.4-ab.jpg) · [Arm detail](https://raw.githubusercontent.com/heyitschien/threejs-experiment-animations/a59f46e65363987809666ab96c2830fa874c7892/tentacle-detail-ab.jpg) · [Motion](https://raw.githubusercontent.com/heyitschien/threejs-experiment-animations/a59f46e65363987809666ab96c2830fa874c7892/motion-ab.mp4) · [Benchmark and capture manifest](https://raw.githubusercontent.com/heyitschien/threejs-experiment-animations/a59f46e65363987809666ab96c2830fa874c7892/manifest.json)
