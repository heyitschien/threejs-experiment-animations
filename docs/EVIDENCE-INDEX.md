# OCTO evidence index

[Case study](AGENT-OPERATED-3D-CASE-STUDY.md) · [Architecture](ARCHITECTURE.md) · [Reproduce and release](IMPLEMENTATION-PLAYBOOK.md)

## Start here

| Evidence | Pinned links |
| --- | --- |
| Original concept and prototype | [Concept image](https://raw.githubusercontent.com/heyitschien/threejs-experiment-animations/20283f48f2e6869e1b783652b5c5dec86acca7d0/reference/octopus-concept.png) · [v0.1 source](https://github.com/heyitschien/threejs-experiment-animations/tree/20283f48f2e6869e1b783652b5c5dec86acca7d0) · [Nine historical goldens and manifest](https://github.com/heyitschien/threejs-experiment-animations/tree/b742d7dae92cd9788d705731fc58cff9e44adb2e/qa/goldens) |
| Stage 6 base scene | [Desktop](https://raw.githubusercontent.com/heyitschien/threejs-experiment-animations/9e888ab8b6ae05cd9e6c19bc60f90c9eeef98715/desktop.jpg) · [Motion](https://raw.githubusercontent.com/heyitschien/threejs-experiment-animations/9e888ab8b6ae05cd9e6c19bc60f90c9eeef98715/stage6-turntable.mp4) |
| Study A original A/B | [Close-up](https://raw.githubusercontent.com/heyitschien/threejs-experiment-animations/a59f46e65363987809666ab96c2830fa874c7892/tentacle-detail-ab.jpg) · [390 px](https://raw.githubusercontent.com/heyitschien/threejs-experiment-animations/a59f46e65363987809666ab96c2830fa874c7892/hero-mobile-390-3.4-ab.jpg) · [Six-second motion](https://raw.githubusercontent.com/heyitschien/threejs-experiment-animations/a59f46e65363987809666ab96c2830fa874c7892/motion-ab.mp4) · [Original benchmark and capture manifest](https://raw.githubusercontent.com/heyitschien/threejs-experiment-animations/a59f46e65363987809666ab96c2830fa874c7892/manifest.json) |
| Study A correction source | [Python generator](https://github.com/heyitschien/threejs-experiment-animations/blob/a92477920108285dd8903e7f8c7083090dc89204/scripts/build_blender_tentacle.py) · [GLB](https://github.com/heyitschien/threejs-experiment-animations/blob/a92477920108285dd8903e7f8c7083090dc89204/src/assets/blender-tentacle.glb) · [Runtime deformation](https://github.com/heyitschien/threejs-experiment-animations/blob/a92477920108285dd8903e7f8c7083090dc89204/src/blenderTentacle.js) · [Browser checks](https://github.com/heyitschien/threejs-experiment-animations/blob/a92477920108285dd8903e7f8c7083090dc89204/qa/blender.spec.js) |
| Study B static renders and browser evidence | [Cycles translucent vs. opaque](https://raw.githubusercontent.com/heyitschien/threejs-experiment-animations/f5a724a58d3ef95bf19ce0b7cfb99031f05b5866/material-ab.png) · [Browser underside](https://raw.githubusercontent.com/heyitschien/threejs-experiment-animations/f5a724a58d3ef95bf19ce0b7cfb99031f05b5866/browser-underside.png) · [Camera orbit of the static sample](https://raw.githubusercontent.com/heyitschien/threejs-experiment-animations/f5a724a58d3ef95bf19ce0b7cfb99031f05b5866/orbit.mp4) |
| Study B source | [Editable Blender scene](https://raw.githubusercontent.com/heyitschien/threejs-experiment-animations/f5a724a58d3ef95bf19ce0b7cfb99031f05b5866/material-study.blend) · [Python generator](https://github.com/heyitschien/threejs-experiment-animations/blob/f5a724a58d3ef95bf19ce0b7cfb99031f05b5866/build.py) · [GLB](https://raw.githubusercontent.com/heyitschien/threejs-experiment-animations/f5a724a58d3ef95bf19ce0b7cfb99031f05b5866/section.glb) |

Original Study A screenshots predate the label correction. The closure archive below shows the revised labels.

## Stack audit

All seven PRs were open drafts with matching base refs and a clean GitHub merge state at intake. This table identifies the original audited heads. The Stage 7 correction is one appended commit.

| PR | Stage | Target | Audited head |
| --- | --- | --- | --- |
| [#2](https://github.com/heyitschien/threejs-experiment-animations/pull/2) | Foundation | `main` | `e5a2060161708716af42de9734151d5c1f00709c` |
| [#4](https://github.com/heyitschien/threejs-experiment-animations/pull/4) | QA and v0.1 goldens | `docs/octo-studio-foundation` | `b742d7dae92cd9788d705731fc58cff9e44adb2e` |
| [#6](https://github.com/heyitschien/threejs-experiment-animations/pull/6) | Tentacle geometry | `qa/octo-stage-2` | `9052650a8e3da6c89567003537192e292fb3b30c` |
| [#8](https://github.com/heyitschien/threejs-experiment-animations/pull/8) | Mantle and chamber | `feat/octo-v0.2-sculpted-tentacles` | `f292943de3a1387b0ed76ca642b0ae17bc33c1b9` |
| [#10](https://github.com/heyitschien/threejs-experiment-animations/pull/10) | Materials and lighting | `feat/octo-stage-4-mantle` | `df1843351ed3540533bda2996cbffeafe91b7346` |
| [#12](https://github.com/heyitschien/threejs-experiment-animations/pull/12) | Environment and framing | `feat/octo-stage-5-studio` | `27c2c5c9c7bc3876f20a42d26770dceb857c557f` |
| [#15](https://github.com/heyitschien/threejs-experiment-animations/pull/15) | Optional Blender pilot | `feat/octo-stage-6-cinematic-stage` | `f2b4a4306374fc074c732d5a72a4cd57266c08c5` |

The #15 correction revision is `a92477920108285dd8903e7f8c7083090dc89204`. Main at audit was `20283f48f2e6869e1b783652b5c5dec86acca7d0`. All six preceding heads and the reference and golden blobs are preserved.

## Closure evidence

| Deliverable | Pinned links |
| --- | --- |
| Narrated demo | [2:20 walkthrough](https://raw.githubusercontent.com/heyitschien/threejs-experiment-animations/afba0d2e83d2fcb1408525306b8558d926f2a489/walkthrough.mp4) · [Transcript](https://github.com/heyitschien/threejs-experiment-animations/blob/afba0d2e83d2fcb1408525306b8558d926f2a489/walkthrough-transcript.md) |
| Corrected runtime captures | [A desktop](https://raw.githubusercontent.com/heyitschien/threejs-experiment-animations/afba0d2e83d2fcb1408525306b8558d926f2a489/a-hero-desktop.png) · [B desktop](https://raw.githubusercontent.com/heyitschien/threejs-experiment-animations/afba0d2e83d2fcb1408525306b8558d926f2a489/b-hero-desktop.png) · [A mobile](https://raw.githubusercontent.com/heyitschien/threejs-experiment-animations/afba0d2e83d2fcb1408525306b8558d926f2a489/a-hero-mobile-390-3.4.png) · [B mobile](https://raw.githubusercontent.com/heyitschien/threejs-experiment-animations/afba0d2e83d2fcb1408525306b8558d926f2a489/b-hero-mobile-390-3.4.png) |
| Closure test report and timing | [GLB hash, test cases, pose metrics, screenshot provenance, dependencies and timing](https://raw.githubusercontent.com/heyitschien/threejs-experiment-animations/afba0d2e83d2fcb1408525306b8558d926f2a489/validation.json) · [Raw frame intervals and all closure evidence](https://github.com/heyitschien/threejs-experiment-animations/tree/afba0d2e83d2fcb1408525306b8558d926f2a489) |

The closure dependency audit returned zero advisories at execution time. This is a point-in-time registry result.
