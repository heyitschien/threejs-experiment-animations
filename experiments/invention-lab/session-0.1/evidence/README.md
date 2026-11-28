# Session 0.1 verification record

November 25, 2026, America/Los_Angeles. The original calibration and baseline are at `e59fc23f6ca14f96225037bb828c43f247efc478`. The clean candidate tested here is `072120c70fbb4374bf6d997666a71b7f9dc64943`. The [canonical runbook](../../../../docs/INVENTION-LAB-AGENT-RUNBOOK.md) describes the supported setup.

## Primary execution

I created a new worktree and Python environment, ran the hash-enforcing bootstrap, and ran the remaining commands in a fresh `zsh -f` shell with `BLENDER_BIN` pointing to the verified Blender app.

```bash
lab=experiments/invention-lab/session-0.1/lab.mjs
node "$lab" bootstrap
node "$lab" doctor
npm run check
mkdir -p invention-lab-runs
run=invention-lab-runs/session01-primary
node "$lab" run --out "$run"
node "$lab" verify --out "$run"
node "$lab" negative --from "$run" --out "$run-negative"
node "$lab" viewer --out "$run" --port 4175
```

The host was macOS 26.6.2 arm64. The run recorded Python 3.12.12, uv 0.6.9, CadQuery 2.8.0, OCP 7.9.3.1, Blender 4.4.0 build `05377985c527` with Python 3.11.11, Node 26.13.0, npm 11.20.0, Three.js 0.187.0, Playwright 1.65.1 and Chromium 159.0.8154.6. The OCTO baseline and candidate each passed 17 tests and built with Vite 7.3.8. Both builds reported the existing chunk-size warning.

| Check | Base model | Variant |
| --- | ---: | ---: |
| CAD X/Y/Z size (mm) | 100 × 60 × 20 | 120 × 70 × 15 |
| Source and re-imported STEP volume (mm³) | 119,384 | 125,244 |
| Three.js X/Y/Z size (mm, rounded) | 100 × 20 × 60 | 120 × 15 × 70 |
| Three.js signed pocket corner (mm, rounded) | (12, 13, 19) | (19, 9, 23) |
| Oriented triangles matched | 28 | 28 |
| Maximum axis error (mm) | 0.000002375 | 0.000002850 |

The browser independently parsed the served GLB and compared the display against the verifier's measurements. Orbit, variant selection and recovery passed. Browser tests rejected a missing GLB, stale receipt, mismatched GLB hash and invalid receipt bounds. The only HTTP and console error matched the intentionally missing asset's 404. The [CLI rejection tests](negative.json) passed 11/11, including a reflected GLB with unchanged bounds and a real Blender Python exception that exited 23 and produced no completion manifest. An earlier development run caught a source edit that occurred during calibration and also produced no completion manifest.

[Base screenshot](browser-calibration.png) · [Variant screenshot](browser-variant.png) · [Missing asset screenshot](browser-missing.png)

[Run metadata](run.json) · [CAD and STEP receipt](cad.json) · [Blender receipt](blender.json) · [Three.js measurements](geometry.json) · [Browser QA](browser.json) · [Artifact SHA-256 manifest](manifest.json)

These published receipts include screenshots and metrics. The verified local run and its downloadable archive also contain the complete STEP/STL/GLB set referenced by the manifest. Raw command logs and failed-run fixtures stay in local run directories.

## Blender integrity decision

The existing application presented the Blender Foundation Developer ID but failed `codesign --verify --deep --strict` and `spctl --assess --type execute`. Strict verification listed six added Python bytecode cache files and a Blender asset catalog backup. These diagnostics establish a seal change. They do not establish who or what added the files.

The separate official [4.4.0 arm64 DMG](https://download.blender.org/release/Blender4.4/blender-4.4.0-macos-arm64.dmg) matched the [published SHA-256](https://download.blender.org/release/Blender4.4/blender-4.4.0.sha256) `c3a1192d36d6202cd233081a54391c5778f3dd7aa3ca5af077f641e87a412104`. The read-only mounted bundle passed the strict seal and Gatekeeper checks. Gatekeeper reported `accepted` and `source=Notarized Developer ID`. The calibration and deliberate Blender failure used that mounted copy. The existing application was left in place. Approve a replacement separately if you want the default application path repaired.

## Second-agent reproduction

A second coding agent started with a fresh conversation, the repository and candidate SHA, and the approved Blender executable location. It read repository instructions and Issue #19, checked out the same clean commit in a separate worktree and bootstrapped its own Python and npm/browser environment. Both agents were Codex workers. This run tests handoff without conversation history or shared worktree dependencies on one Mac. A different agent product and other operating systems remain untested.

The second agent ran `bootstrap`, `npm run check`, `doctor`, `run`, `verify` and `negative` from the runbook. Its independent run and verification passed, with the same versions, signed corners, triangle counts and dimensional errors. The two GLBs, two STLs and all three browser PNGs were byte-identical across runs. The two STEP pairs differed only in the `FILE_NAME` timestamp. The negative suite rejected all 11 cases. The first CadQuery import was the slow step. The agent also reported informational uv and npm install-script warnings and the baseline Vite chunk-size warning. No source edits or shared venv were needed.

[Second run metadata](independent/run.json) · [SHA-256 manifest](independent/manifest.json) · [Three.js measurements](independent/geometry.json) · [Browser QA](independent/browser.json) · [Negative tests](independent/negative.json)

The second agent also ran `node "$lab" viewer --out "$run" --port 4176` and exercised orbit, variant labels, missing-file fallback and recovery. It used port 4176 because the primary viewer occupied 4175. The independent worktree remained clean.

The receipts are ready for owner review under Issue #19.
