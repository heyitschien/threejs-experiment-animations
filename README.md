# OCTO / Procedural Intelligence · Three.js visual prototype

> **Invention Lab — start here:** [Current session handoff](docs/INVENTION-LAB-HANDOFF-2026-11-25.md) · [Technology adoption & validation protocol](docs/INVENTION-LAB-TECHNOLOGY-ADOPTION.md) · [Architecture decisions](docs/INVENTION-LAB-ADR-001-OPEN-SOURCE-INTEGRATION.md) · [Agent runbook](docs/INVENTION-LAB-AGENT-RUNBOOK.md) · [Manifesto](docs/INVENTION-LAB-MANIFESTO.md) · [Engineering tracker #19](https://github.com/heyitschien/threejs-experiment-animations/issues/19) · [Research and assembly tracker #22](https://github.com/heyitschien/threejs-experiment-animations/issues/22). Session 0–0.3A evidence recorded; owner review and additional agent-product reproduction remain open. Phase E/F and new candidate runtimes remain gated.

OCTO v0.1 is a code-only animated robotic octopus inspired by the [concept image](reference/octopus-concept.png). The integrated `main` branch defaults to eight procedural arms. Add `?tentacle=blender` to the local viewer URL to see seven procedural arms and one original, agent-authored Blender arm imported as a GLB. If the GLB fails to load, the procedural scene stays active. The concept image is used for visual comparison. Both modes run locally without API keys or paid services.

**Status:** `octo-study-v1.0` is a non-production case-study release. It is not deployed. See the [final validation record](docs/FINAL-VALIDATION.md) for the integrated commit, merged stack and test results.

## Quick start

Requires Node.js 20.19+ or 22.12+.

```bash
npm ci
npm run dev
# open the Vite URL printed in the terminal, normally http://localhost:5173
```

**Controls:** drag to orbit; scroll/pinch to zoom; pause/resume the tentacles; reset the camera. Reduced-motion preferences start paused. For deterministic screenshots, add `?octo-qa` in development and use `window.__OCTO_DEBUG__.freezeAt(3.4)`. Use `?tentacle=blender&octo-qa` to inspect the hybrid mode.

## Validation

```bash
npm run check
```

`npm run check` runs the Node tests for geometry, framing and GLB parsing and compiles the web app. It **does not** prove visual fidelity, smooth frame rates, accessibility, or cross-device compatibility; those require browser inspection and measurements.

## Architecture

- `src/tentacleMath.js`: 8 independent math-driven tentacle curves and taper formulas, unit tested.
- `src/octopus.js`, `src/mantle.js`, and `src/sculptedTentacles.js` assemble the mantle, reactor, swept arms and instanced emitters.
- `src/blenderTentacle.js` loads and deforms the optional original GLB along the existing procedural arm path. The [Study A report](docs/STUDY-A-ASSET-INTEGRATION.md) documents its Blender source and export.
- `src/main.js`: scene, camera, live lighting, reflections, star field, orbit rings, floor, bloom postprocessing, interaction and FPS indicator.
- `src/style.css`: responsive typography and glass-panel UI. The UI is HTML/CSS, not geometry.
- `reference/octopus-concept.png`: original target concept for screenshot evaluation.

## Design intent and honest limitations

The visual target is a **procedural interpretation**, not a pixel-identical reconstruction of the concept image. Chrome highlights, reflective glass and lively tentacle articulation should make the first version visually engaging. Generating the exact intricacy of the pictured sculpture solely from code requires further artistic and engineering refinement.

This is a deliberately isolated Vite experiment. It does not connect to any user data, paid model APIs, GitHub automation, robotics or trading systems. It downloads ordinary npm dependencies during installation; runtime fonts use local system fonts. No deployment is included.

## Original v0.1 archive validation notes

These are historical instructions for the code-only baseline. The approved Stage 7 experiment adds the optional GLB described above.

1. Run `npm install`, `npm run check`, then `npm run dev`.
2. Use Playwright or a real browser to capture 1440×900 and 390×844 screenshots with `window.__OCTO_DEBUG__.freezeAt(3.4)`.
3. Inspect browser console for errors, WebGL shader warnings, clipping, density and visibility. Compare to `reference/octopus-concept.png`.
4. Prioritize **silhouette** (obvious eight tentacles), **materials** (chrome, translucent dome), then **lighting** (gold/violet/cyan) and frame performance.
5. Fix defects and iterate with screenshots. Do not add Blender/GLB assets, paid APIs, or deploy. Keep changes isolated and report tested evidence and measured FPS.

## OCTO Studio planning draft

v0.1 is the historical procedural baseline. These planning documents record the early project scope and review process.

- [Stack, compatibility and roadmap](docs/OCTO-STUDIO-STACK.md)
- [Cinematic reference and visual rubric](docs/VISUAL-TARGET.md)
- [Capture, measurement and iteration workflow](docs/VISUAL-ITERATION-PROTOCOL.md)
- [Setup plan and approvals](docs/SETUP-PLAN.md)

## Stage 2 browser validation

With the approved dev tooling installed, run `npm run qa:install` once. Playwright starts and stops its own localhost Vite server on `127.0.0.1:5199`. Use the [Study A candidate commands](docs/STUDY-A-ASSET-INTEGRATION.md#reproduce) for the current scene. Plain `npm run qa:browser` includes the strict v0.1 reference comparison. On integrated `main`, its nine golden cases fail by design because later stages changed the scene; the goldens are preserved unchanged. Run `npm run qa:perf` separately in an active graphical session. See [validation commands, baseline and limitations](docs/STAGE-2-VALIDATION.md), the [final validation record](docs/FINAL-VALIDATION.md) and the [iteration ledger](docs/ITERATION-LEDGER.md).

## Implementation case study

[2:36 captioned walkthrough](https://raw.githubusercontent.com/heyitschien/threejs-experiment-animations/2c15c0b5568e8a30094e716d436f0ac27512a988/walkthrough.mp4) · [WebVTT captions](https://raw.githubusercontent.com/heyitschien/threejs-experiment-animations/2c15c0b5568e8a30094e716d436f0ac27512a988/walkthrough.vtt) · [Case study](docs/AGENT-OPERATED-3D-CASE-STUDY.md) · [Evidence index](docs/EVIDENCE-INDEX.md)

## Future research (not part of OCTO v1.0)

[Invention Lab proposal](docs/INVENTION-LAB-PROPOSAL.md) · [Dated open-source landscape and reuse decision](docs/INVENTION-LAB-TOOL-LANDSCAPE.md) · [Integration session and acceptance playbook](docs/INVENTION-LAB-SESSION-PLAN.md) · [Session 0 calibration evidence](experiments/invention-lab/session-0/README.md) · [Tracking issue #19](https://github.com/heyitschien/threejs-experiment-animations/issues/19). The recommended **Leaf to Light** tabletop shade-panel pilot explores agent-assisted parametric CAD → Blender → Three.js, with measured geometry/visualization handoffs. [Multi-angle concept renders, dimensioned reference sheet and machine-readable design brief](reference/invention-lab/leaf-to-light/README.md) are available for planning. They are **unvalidated concept inputs**, not engineered CAD or performance evidence. Sessions 0, 0.1 and 0.3A calibration experiments have run; Session 0.2 research and architecture decisions are documented. See the current handoff above for evidence and pending gates. Full invention Phase E/F remains unimplemented and requires review. This does not alter the released demo.
