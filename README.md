# OCTO / Procedural Intelligence · Three.js visual prototype

An experimental **code-only** animated robotic octopus inspired by `reference/octopus-concept.png`. No Blender, no GLB meshes, no stock 3D assets, no API keys, and no paid services. The concept image is **only a visual reference** and is not used as a texture or a fake animated background.

## Quick start

Requires Node.js 20.19+ or 22.12+.

```bash
npm install
npm run dev
# open the Vite URL printed in the terminal, normally http://localhost:5173
```

**Controls:** drag to orbit; scroll/pinch to zoom; pause/resume the tentacles; reset the camera. Reduced-motion preferences start paused. A debug hook `window.__OCTO_DEBUG__.freezeAt(3.4)` makes screenshot comparisons reproducible.

## Validation

```bash
npm run check
```

`npm run check` runs unit tests for the procedural tentacle math and compiles the web app. It **does not** prove visual fidelity, smooth frame rates, accessibility, or cross-device compatibility; those require browser inspection and measurements.

## Architecture

- `src/tentacleMath.js`: 8 independent math-driven tentacle curves and taper formulas, unit tested.
- `src/octopus.js`: all 3D meshes, mechanical head, transparent dome, reactors, 160 articulated links drawn with four instanced meshes, emissive cups and chrome collars.
- `src/main.js`: scene, camera, live lighting, reflections, star field, orbit rings, floor, bloom postprocessing, interaction and FPS indicator.
- `src/style.css`: responsive typography and glass-panel UI. The UI is HTML/CSS, not geometry.
- `reference/octopus-concept.png`: original target concept for screenshot evaluation.

## Design intent and honest limitations

The visual target is a **procedural interpretation**, not a pixel-identical reconstruction of the concept image. Chrome highlights, reflective glass and lively tentacle articulation should make the first version visually engaging. Generating the exact intricacy of the pictured sculpture solely from code requires further artistic and engineering refinement.

This is a deliberately isolated Vite experiment. It does not connect to any user data, paid model APIs, GitHub automation, robotics or trading systems. It downloads ordinary npm dependencies during installation; runtime fonts use local system fonts. No deployment is included.

## Original archive validation notes

1. Run `npm install`, `npm run check`, then `npm run dev`.
2. Use Playwright or a real browser to capture 1440×900 and 390×844 screenshots with `window.__OCTO_DEBUG__.freezeAt(3.4)`.
3. Inspect browser console for errors, WebGL shader warnings, clipping, density and visibility. Compare to `reference/octopus-concept.png`.
4. Prioritize **silhouette** (obvious eight tentacles), **materials** (chrome, translucent dome), then **lighting** (gold/violet/cyan) and frame performance.
5. Fix defects and iterate with screenshots. Do not add Blender/GLB assets, paid APIs, or deploy. Keep changes isolated and report tested evidence and measured FPS.

## OCTO Studio planning draft

v0.1 is the current procedural baseline. The planning documents propose future work for review.

- [Stack, compatibility and roadmap](docs/OCTO-STUDIO-STACK.md)
- [Cinematic reference and visual rubric](docs/VISUAL-TARGET.md)
- [Capture, measurement and iteration workflow](docs/VISUAL-ITERATION-PROTOCOL.md)
- [Setup plan and approvals](docs/SETUP-PLAN.md)

## Stage 2 browser validation

With the approved dev tooling installed, run `npm run qa:install` once, then `npm run qa:browser` for smoke and screenshot checks. Run `npm run qa:perf` separately in an active graphical session. See [validation commands, baseline and limitations](docs/STAGE-2-VALIDATION.md) and the [iteration ledger](docs/ITERATION-LEDGER.md).

## Implementation case study

[Read the two-study evaluation](docs/AGENT-OPERATED-3D-CASE-STUDY.md) or [open the walkthrough and pinned evidence](docs/EVIDENCE-INDEX.md).
