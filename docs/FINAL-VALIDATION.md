# Final integration and validation record

[Case study](AGENT-OPERATED-3D-CASE-STUDY.md) · [Evidence index](EVIDENCE-INDEX.md) · [Playbook](IMPLEMENTATION-PLAYBOOK.md)

This record covers the parent-first integration of the eight reviewed OCTO PRs into `main` and the validation run that preceded it. It is a non-production case-study record. Nothing is deployed.

## Integrated stack

Each step confirmed that the pinned head was reachable from `main`, that the retargeted diff matched the reviewed stage patch, and that `main` matched the rehearsed tree. Every PR used a merge commit, so the reviewed heads remain ancestors of `main`.

| Order | PR | Reviewed head | Merge commit on `main` |
| --- | --- | --- | --- |
| 1 | [#2](https://github.com/heyitschien/threejs-experiment-animations/pull/2) · Studio foundation | `e5a2060161708716af42de9734151d5c1f00709c` | `b0e28d95e939486664013d750cf93448decb69d0` |
| 2 | [#4](https://github.com/heyitschien/threejs-experiment-animations/pull/4) · Stage 2 QA and goldens | `b742d7dae92cd9788d705731fc58cff9e44adb2e` | `e89cc970708e513dad5cd146f67fed0bc09bacac` |
| 3 | [#6](https://github.com/heyitschien/threejs-experiment-animations/pull/6) · Sculpted tentacles | `9052650a8e3da6c89567003537192e292fb3b30c` | `8b58966cff1980b48e2c31e29091ec73b35e0f49` |
| 4 | [#8](https://github.com/heyitschien/threejs-experiment-animations/pull/8) · Mantle and chamber | `f292943de3a1387b0ed76ca642b0ae17bc33c1b9` | `0ad5ea2cecb9a608e0d148fefeafde507058a7f5` |
| 5 | [#10](https://github.com/heyitschien/threejs-experiment-animations/pull/10) · Glass, chrome and studio light | `df1843351ed3540533bda2996cbffeafe91b7346` | `86081d765a37a565362754ce0fa2dcf6c3885f09` |
| 6 | [#12](https://github.com/heyitschien/threejs-experiment-animations/pull/12) · Cinematic stage | `27c2c5c9c7bc3876f20a42d26770dceb857c557f` | `6a1b538526d18705714c26e446b7c75c6c943a1a` |
| 7 | [#15](https://github.com/heyitschien/threejs-experiment-animations/pull/15) · Optional Blender tentacle | `a92477920108285dd8903e7f8c7083090dc89204` | `925c7f75dde92032c55864124e64bb94f7235165` |
| 8 | [#17](https://github.com/heyitschien/threejs-experiment-animations/pull/17) · Case study and release review | `f6354ff677e567d56489c9de7b23295eeb95a8d0` | `84964523946fd81af5195f65df9f9eb5fc982e0d` |

The integrated `main` tree at `84964523946fd81af5195f65df9f9eb5fc982e0d` was byte-identical to the rehearsal tree that passed the validation below. No branch protection or ruleset exists on `main`, so no protection was bypassed. No force push was used, and all eight PR head branches were kept.

## Validation commands and results

Host: macOS arm64, Apple M3 Max, ANGLE Metal, Node.js 22.23.3, Playwright 1.65.1, pinned Chromium 159.0.8154.6. Blender 5.2.4 LTS build `cd5dc428cce1`, the signed and notarized app in `~/Applications`.

| Gate | Command | Result |
| --- | --- | --- |
| Clean install | `npm ci` | Installed the lockfile with zero advisories reported by npm. |
| Build | `npm run build` | Passed. Vite reports the existing bundle-size advisory for the 661.85 kB app chunk. |
| Node tests | `npm test` | 17 of 17 passed. |
| GLB reproducibility | `blender -b --factory-startup --python scripts/build_blender_tentacle.py -- octo-evidence/reproduced.glb` | Byte-identical to `src/assets/blender-tentacle.glb`. SHA-256 `cd0eaaeedac44f0ff6ed273b14a9be3b7ebc29209214ec134cd8b65d27d8d305`. |
| Default browser suite | `npm run qa:browser` | 6 passed, 9 failed. The failures are the strict v0.1 golden comparisons described below. |
| Blender opt-in suite | `OCTO_BLENDER=1 npm run qa:browser` | 6 passed, 9 failed. The same nine strict golden cases failed. |
| Default candidate lane | `OCTO_CAPTURE_CANDIDATE=1 OCTO_REVISION_VIEWS=1 OCTO_ARM_DETAIL=1 npm run qa:browser` | 25 of 25 passed. |
| Blender candidate lane | same as above with `OCTO_BLENDER=1` | 25 of 25 passed. |
| Procedural frame timing | `npm run qa:perf` | 2 of 2 passed. Headed foreground Chromium. |
| Blender frame timing | `OCTO_BLENDER=1 npm run qa:perf` | 2 of 2 passed. Headed foreground Chromium. |
| Documentation links | Relative paths and 86 external GitHub/raw URLs | All relative links resolve. All external URLs returned 200 on retry. Two transient 503 responses cleared on retry. |

The Blender and procedural suites both included the WebGL-unavailable fallback, the malformed-GLB fallback, and the fixed-pose and playback deformation checks. The 6 default passing cases were the Blender opt-in and deformation tests plus the four smoke tests. The Blender opt-in test showed that the original arm still renders when its GLB fails.

### Strict v0.1 golden comparison

The nine strict historical comparisons are the 1440 × 900 hero and mobile captures plus the seven fixed-pose captures. They fail on integrated `main` because later stages changed the scene. The goldens remain unchanged, and the candidate lanes record the current scene separately.

| Golden case | Default lane differing pixels |
| --- | --- |
| hero-desktop | 167,386 (0.13) |
| hero-mobile | 26,037 (0.08) |
| front | 121,443 (0.10) |
| three-quarter | 124,197 (0.10) |
| side | 94,728 (0.08) |
| rear | 120,048 (0.10) |
| mantle-detail | 431,591 (0.34) |
| front-pose-0 | 110,389 (0.09) |
| front-pose-6-8 | 107,139 (0.09) |

The Blender lane fails the same nine cases, with counts within about 1 percent of the default lane. A control run on the Stage 2 commit `b742d7dae92cd9788d705731fc58cff9e44adb2e` on the same host passed 13 of 13 cases, including all nine goldens. The difference therefore comes from the later scene changes, not from the environment or a regenerated asset. Do not treat these as regressions to hide. The playbook calls for a separate visual approval before publishing new release baselines.

### Frame timing

Three 15-second headed foreground trials per profile after a five-second warm-up. Values are medians of the trial percentiles.

| Variant | Profile | p50 | p95 | p99 | Scene draw calls | Triangles | Geometries | Textures |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| A procedural | desktop | 16.7 ms | 17.6 ms | 17.7 ms | 83 | 73,250 | 62 | 15 |
| A procedural | 390 px emulation | 16.7 ms | 17.7 ms | 17.7 ms | 83 | 73,250 | 62 | 15 |
| B Blender | desktop | 16.7 ms | 17.6 ms | 17.6 ms | 86 | 79,470 | 67 | 15 |
| B Blender | 390 px emulation | 16.7 ms | 17.6 ms | 17.7 ms | 86 | 79,470 | 67 | 15 |

This host's display cadence was capped at 60 fps for every trial. The earlier closure run measured 120 fps on a different display, so the two sets of timings are not directly comparable. The frame-timing results show that both variants held the display cadence on this host. They do not show GPU headroom, phone-class performance, or any cost of the optional arm in isolation.

## Limitations

- The strict v0.1 golden lane fails by design on integrated `main`. Visual acceptance of the current scene, and any replacement baselines, need a separate review.
- The validation run was performed by the same agent on one workstation. It is not an independent rerun.
- Timing was measured only on the Apple M3 Max with ANGLE Metal, at a 60 Hz display cadence. Physical phones, other browsers, GPU headroom, and sustained thermal behavior were not measured.
- The Blender arm remains optional and off by default. Its deformation checks are sampled. They do not prove winding, collision or complete rig continuity.
- Study B is preserved as static evidence on `evidence/octo-material-study` and is not part of the OCTO runtime.
- Node.js 22.23.3 was used in this run, while the closure document recorded Node.js 26.13.0.
- Dependency advisories are a point-in-time npm result and require separate remediation review if they change.

## Pinned evidence

- Walkthrough video (captioned, remastered): [walkthrough.mp4](https://raw.githubusercontent.com/heyitschien/threejs-experiment-animations/2c15c0b5568e8a30094e716d436f0ac27512a988/walkthrough.mp4)
- Captions: [WebVTT](https://raw.githubusercontent.com/heyitschien/threejs-experiment-animations/2c15c0b5568e8a30094e716d436f0ac27512a988/walkthrough.vtt) · [SRT](https://raw.githubusercontent.com/heyitschien/threejs-experiment-animations/2c15c0b5568e8a30094e716d436f0ac27512a988/walkthrough.srt)
- Provenance: [audio provenance](https://github.com/heyitschien/threejs-experiment-animations/blob/2c15c0b5568e8a30094e716d436f0ac27512a988/AUDIO-PROVENANCE.md) · [media validation](https://raw.githubusercontent.com/heyitschien/threejs-experiment-animations/2c15c0b5568e8a30094e716d436f0ac27512a988/media-validation.json)
- Study B static evidence branch: [`evidence/octo-material-study`](https://github.com/heyitschien/threejs-experiment-animations/tree/f5a724a58d3ef95bf19ce0b7cfb99031f05b5866)
- Closure branches: [`evidence/octo-completion`](https://github.com/heyitschien/threejs-experiment-animations/tree/afba0d2e83d2fcb1408525306b8558d926f2a489)
