# OCTO Studio production foundation

**Planning draft for Issue #1 · 2026-11-21**

## v0.1 audit

Local and remote `main` matched at `20283f48f2e6869e1b783652b5c5dec86acca7d0`. The starting tree was clean and GitHub listed no open PRs. The lockfile SHA-256 was `82cc3ffcee874aa866ce0604e8e723033014036036ecb19eac34d1438e78f20d`.

- `src/tentacleMath.js` generates eight deterministic, tapered centerlines. `src/octopus.js` represents 160 links with four instanced batches for arm cores, chrome shells, rims and emitters, plus separate sockets and mantle meshes. Current gaps include visible segmentation, limited depth separation, and no collision or clearance gate.
- `src/main.js` uses WebGL 2, procedural PMREM reflectors, point lights, sRGB output, ACES tone mapping, and a single RenderPass → UnrealBloomPass → OutputPass chain. Renderer DPR is capped at 1.5 and composer DPR at 1. The floor uses material and ring cues without scene reflections. The highest payoff comes from reworking the arms, sculpting the mantle, then tuning materials and lighting.
- Orbit, reset, reduced motion, responsive HTML/CSS, and `freezeAt(3.4)` are available. There is no named camera API, pinned screenshot harness, formal golden set, frame-time distribution, or GPU budget. The existing freeze hook changes pose on the animation loop, so capture must wait for the rendered frame. Earlier operator screenshots are qualitative evidence. Formal browser and performance validation starts in Stage 2.
- Read-only checks used installed tools. `npm ls --depth=0` matched the lockfile, `npm audit --json` reported zero advisories at review time, all six Node tests passed, and an offline Vite build to a temporary directory succeeded. Vite reported a 598 kB minified entry exceeding its 500 kB warning threshold. Treat transfer size, startup, and frame time as separate metrics.

## Stack decisions and candidate pins

| Layer | Pin and license | Decision and compatibility |
| --- | --- | --- |
| Runtime | Three.js 0.187.0 · MIT | Keep vanilla ES modules, WebGLRenderer and the existing Three.js addons. Registry latest matched the lock. Upgrade Three and its addons together in a dedicated PR when a fix or measured benefit warrants it. [WebGLRenderer](https://threejs.org/docs/pages/WebGLRenderer.html) |
| Build | Vite 7.3.8 · MIT | Keep the lock and installed Vite 7.3.8, the newest observed 7.x. Vite 8.3.8 was the observed latest major and changes the bundler to Rolldown. Evaluate separately after goldens exist. Verify Node engines, dependency optimization, build output and browser parity. [Vite releases](https://github.com/vitejs/vite/releases) · [Vite migration guide](https://vite.dev/guide/migration.html) |
| Host | Node 26.13.0 / npm 11.20.0 | Observed working pair. Node release metadata marks this line LTS and the pair satisfies the locked Vite engine and Playwright ≥20. Pin one verified pair across capture hosts. Review subsequent security patches before a fresh host bootstrap. [Node releases](https://nodejs.org/dist/index.json) |
| Visual QA | Playwright Test 1.65.1 · Apache-2.0 | First proposed dev-only addition. Exact package pin plus lockfile integrity and its bundled Chromium build 1255, browser 159.0.8154.6. Smoke-test acceleration and WebGL 2 before blessing that lane. [Package](https://www.npmjs.com/package/@playwright/test/v/1.65.1) · [Browser manifest](https://github.com/microsoft/playwright/blob/v1.65.1/packages/playwright-core/browsers.json) |
| Alternate compositor | postprocessing 6.39.6 · Zlib | Optional single-chain A/B once baseline bloom has been tuned. Peers declare Three ≥0.168.0 and <0.188.0, covering 0.187.0. Validate output transform, selective bloom and frame cost. [Upstream](https://github.com/pmndrs/postprocessing) |
| Environment | Procedural panels first · optional Poly Haven CC0 HDRI | Keep procedural reflectors as the $0 fallback. A/B a single approved studio HDRI at 1K, with 2K as a measured desktop option. PMREM and fixed exposure before bloom. Import via a pinned local asset if accepted. [Physical material](https://threejs.org/docs/pages/MeshPhysicalMaterial.html) · [Poly Haven license](https://polyhaven.com/license) |
| Research | img2threejs skill 2.0.1 · Apache-2.0 | Candidate isolated A/B, exact commit and installer analysis in the [setup plan](SETUP-PLAN.md). The existing app and dependencies stay independent of this workflow. |
| Deferred | WebGPURenderer/TSL, Blender, React Three Fiber/drei | WebGPU uses a separate renderer/material/post pipeline even with its WebGL 2 backend. Sandbox only for a named feature or measured win. Blender 4.4.0 is present and is a future procedural Python/glTF option subject to an explicit asset-scope change. R3F 9.8.2 peers with React 19; revisit only for a future React host. Keep this app in JavaScript. [WebGPU guide](https://threejs.org/manual/pages/webgpurenderer) · [R3F docs](https://r3f.docs.pmnd.rs/) |

Reproduce package metadata with `npm view <package>@<version> version license engines peerDependencies dist.integrity --json`. Licensing fees for the selected local tools are $0. Browser downloads, disk, device time, and review time are the expected costs.

## Phased roadmap

1. **Stage 2 · Evidence.** Approve the dev-only Playwright dependency and browser download. Bootstrap one pinned capture lane, archive v0.1 goldens, smoke-test a physical phone, and establish measured budgets. Review that PR before geometry work.
2. **Stage 3 · Geometry.** Prototype swept tentacles and the integrated mantle on a separate branch. Gate fit and motion with centerline and mesh tests, fixed shots, and a turntable. Review one geometry hypothesis per iteration.
3. **Stage 4 · Look development.** Tune material response, studio light hierarchy, local bloom and floor contact. Compare procedural panels with a licensed HDRI only after asset approval. Recheck the mobile budget at each pass.
4. **Stage 5 · Research.** Consider img2threejs alone in a sandbox once there is a stable baseline to beat. Apply a separate value and scope review to WebGPU or Blender. Each adoption decision gets its own PR and rollback path.
