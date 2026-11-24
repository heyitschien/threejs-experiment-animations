# Study A · Agent-operated asset integration

[Case study](AGENT-OPERATED-3D-CASE-STUDY.md) · [Evidence index](EVIDENCE-INDEX.md)

The original prototype generated all eight arms in Three.js. Stage 7 added one Blender-authored foreground arm behind `?tentacle=blender`. The local 194,652-byte GLB holds five indexed textureless meshes and 11,044 triangles. Blender authors the shape. Three.js loads it on demand and applies the existing animated centerline and transported frames to its vertices and normals. The original arm stays visible while loading and survives a failed import.

The original Stage 7 installation report records the official signed Apple Silicon Blender 5.2.4 LTS package, Python 3.13.13, a headless exporter smoke cube and two identical exports. The closure run reused that installation with a fresh dependency tree and Chromium install. No permission prompts or human execution steps were needed in the closure run. Neither setup cost nor human time was measured. [Installation provenance](STAGE-7-BLENDER-PILOT.md#reproduce)

## Reproduce

Start from verified revision `a92477920108285dd8903e7f8c7083090dc89204` in a clean worktree. The closure environment used macOS 26.6.2 arm64, Node 26.13.0, npm 11.20.0, Blender 5.2.4 LTS build `cd5dc428cce1`, Three.js 0.187.0, and Vite 7.3.8. Playwright 1.65.1 installed Chromium 159.0.8154.6.

```sh
npm ci
npm run qa:install
mkdir -p octo-evidence
octo_blender="$HOME/Applications/Blender-5.2.4.app/Contents/MacOS/Blender"
"$octo_blender" -b --factory-startup --python-exit-code 1 \
  --python scripts/build_blender_tentacle.py -- octo-evidence/reproduced.glb
cmp src/assets/blender-tentacle.glb octo-evidence/reproduced.glb
shasum -a 256 octo-evidence/reproduced.glb
cp octo-evidence/reproduced.glb src/assets/blender-tentacle.glb
npm run check
OCTO_CAPTURE_CANDIDATE=1 OCTO_REVISION_VIEWS=1 OCTO_ARM_DETAIL=1 npm run qa:browser
OCTO_CAPTURE_CANDIDATE=1 OCTO_REVISION_VIEWS=1 OCTO_ARM_DETAIL=1 OCTO_BLENDER=1 npm run qa:browser
npm run qa:perf
OCTO_BLENDER=1 npm run qa:perf
```

`npm run dev` starts the local viewer with the procedural scene as its default. Append `?tentacle=blender` for the hybrid scene. The development-only `octo-qa` query flag enables deterministic inspection.

## Closure results

- **PROVEN** · The fresh export matched the checked-in GLB exactly, SHA-256 `cd0eaaeedac44f0ff6ed273b14a9be3b7ebc29209214ec134cd8b65d27d8d305`. Node parsed the regenerated asset and the browser exercised it. Seventeen Node tests, the Vite build and 25 Playwright cases in each candidate lane passed. Vite retained its bundle-size advisory.
- **PROVEN** · At 0, 3.4 and 6.8 seconds browser QA read positions and normals from all five live meshes. Each mesh changed between poses, all components stayed finite, normal lengths stayed within 0.01 of unit length, and the transformed spine-root centroid remained within 0.00001 scene units of the procedural socket. The test also resumed live playback and asserted browser health. These are sampled checks, without a proof of winding, collision or full-loop continuity.
- **PROVEN** · A requests no GLB. A malformed GLB retains the procedural model and its original display copy. B displays one Blender-authored arm and seven procedural arms after the asset binds. The visual goldens from Stage 2 are unchanged.
- **REPORTED** · Stage 7's earlier blank-page-controlled benchmark and localhost load timings are preserved separately. [Original timing report](STAGE-7-BLENDER-PILOT.md#validation)
- **INFERRED** · The Blender armor visibly adds detail at close range. Some of that detail is hard to distinguish in the 390 px hero frame. The optional mode is a reasonable limit for this asset.
- **NOT YET VALIDATED** · Independent rerun, physical-mobile and cross-browser timing, GPU headroom, perfect rig continuity and model collision.

All 19 default captures matched their pre-correction Stage 7 counterparts pixel for pixel. The revised candidate run captured another 19 opt-in views. The strict historical comparison again differed in nine views, as it did on Stage 6. Those snapshots are v0.1 references and were preserved. The live root error peaked at approximately `4.62e-9` scene units in the fixed-pose test.

## Performance rerun

Headed Chromium on Apple M3 Max with ANGLE Metal. Three 15-second foreground trials per profile and variant after five seconds of warm-up. Values are medians of trial percentiles.

| Metric | Procedural A | Blender B |
| --- | ---: | ---: |
| Draw calls | 83 | 86 |
| Scene triangles | 73,250 | 79,470 |
| Geometries | 62 | 67 |
| Textures | 15 | 15 |
| Desktop rAF p50 / p95 / p99 | 8.3 / 9.2 / 9.3 ms | 8.3 / 9.2 / 9.3 ms |
| 390 px emulated rAF p50 / p95 / p99 | 8.3 / 9.2 / 9.3 ms | 8.3 / 9.2 / 9.3 ms |

Observed FPS was 119.99–120.00 across all trials, with no intervals above 16.7 ms. This run measured browser presentation cadence at the workstation's refresh ceiling. It did not include a new blank-page control. GPU time, CPU deformation cost in isolation, and physical-phone timing remain unmeasured. The prior run bracketed the variants with blank-page controls and reported a desktop median-trial p95 of 9.9 → 10.2 ms. That small difference is not a reliable causal estimate of asset cost.
