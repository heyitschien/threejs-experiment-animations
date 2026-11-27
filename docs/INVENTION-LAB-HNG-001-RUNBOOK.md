# HNG-001 assembly operator runbook

Session 0.3A validates a two-part digital hinge. Start with [AGENTS.md](../AGENTS.md), the current [authorization and acceptance checklist](https://github.com/heyitschien/threejs-experiment-animations/issues/22), and the [Session 0.1 environment and trust instructions](INVENTION-LAB-AGENT-RUNBOOK.md). This is a separate lane from the original calibration and OCTO.

## Freeze and attribution

The [approved specification](INVENTION-LAB-SESSION-0.2-RESEARCH.md#5-proposed-two-component-hinge-benchmark) is from `742545fe46eb5b7bad040ae5b8a0f6cff1e45021`. [HNG-001 v1](../experiments/invention-lab/hng-001/fixture.json) was committed before the executables. Its original freeze `35dadf6f2a35bbde7271c8307d9949b722ae60ca` was replayed as `7a732fe6b85966b029dc85f7070b78d3fcce4d00` on the updated draft head, with identical SHA-256 `edf75a20d444e57a10f940ffd5d8371ee0c1f7458053e51f6d210397349d1fa2`. The runner binds that SHA and snapshot. An approved revision needs a fresh freeze commit, expectations and corresponding runner pin.

The fixture uses lab-owned component IDs and a signed ground/revolute frame, inspired by Text-to-CAD's [model contract and labels](https://github.com/earthtojake/text-to-cad/blob/b61fb3a974737e27d7b87a2b518a846d11861bc9/skills/cad/references/model-contract.md) and [named mechanism states](https://github.com/earthtojake/text-to-cad/blob/b61fb3a974737e27d7b87a2b518a846d11861bc9/skills/cad/references/kinematics.md). The explicit input/placement sidecar follows the idea in [Assembly Harness's task schema](https://github.com/MountainClimberJiwen/text-to-cad-assembly/blob/f0c768537e3d1ef6b9f8cd49618905ae5152f64d/cad_asm/schemas/task.py). The validity-first order and positive/negative interface gauges were adapted conceptually from [CADGenBench evaluation](https://github.com/huggingface/cadgenbench/blob/33304cf771fc5639144b1df9611e347251052cf8/src/cadgenbench/eval/evaluate.py) and its [keep-in/keep-out method](https://github.com/huggingface/cadgenbench/blob/33304cf771fc5639144b1df9611e347251052cf8/docs/metrics/interface_match.md). This implementation contains lab code and original geometry.

## Run from an isolated worktree

Use the Node/npm versions and the already installed locked Session 0.1 packages. If these live in another worktree, copy only its existing `node_modules` tree to this worktree. On the tested Mac, `cp -cR "$session01_worktree/node_modules" ./node_modules` makes a copy-on-write copy, with the previously downloaded Playwright Chromium inside. This keeps Vite's worktree-local cache writes separate. The existing Python interpreter can be used by absolute path. Confirm the copied worktree has the same `package-lock.json` and set `BLENDER_BIN` to the verified read-only Blender copy from the canonical runbook. On the current host this is Blender 4.4.0. Do not use the installed app that failed its seal check.

```bash
export CADQUERY_PYTHON="$session01_worktree/.venv-invention-lab/bin/python"
export BLENDER_BIN="$verified_blender_app/Contents/MacOS/Blender"
node experiments/invention-lab/session-0.1/lab.mjs doctor
npm run check

lab=experiments/invention-lab/hng-001/lab.mjs
mkdir -p invention-lab-runs
run="invention-lab-runs/hng-001-$(date -u +%Y%m%dT%H%M%SZ)"
node "$lab" run --out "$run"
node "$lab" verify --out "$run"
node "$lab" viewer --out "$run" --port 4177
```

Each run uses a new directory with an existing parent. The runner bounds native stages to 180 seconds, invokes factory-startup Blender with auto-execution disabled and Python error exit code 23, and never rewrites an existing directory. The package locks and earlier evidence stay outside the write scope. A failed run cannot produce its completion manifest. Inspect stage logs and start a new run after diagnosing a failure. The viewer is loopback-only and re-verifies the selected run before serving. Stop it with Ctrl-C. A second run uses a new path and should reproduce the geometry and test receipts.

## Artifacts and interpretation

- `fixture.json` freezes dimensions, geometry, signed frames, analytic expected values and thresholds. `run.json` binds the source hashes, baseline/freeze/tested commits, tool versions and UUID.
- `cad.json` covers the nominal parts, actual STEP XCAF occurrences and signed transforms, 19 sampled fit checks at 5° increments, explicit contact and interference controls, and the moving-leaf edit. `hinge.*.step/stl` are component-local derivatives. `closed_000.step`, `half_045.step`, and `open_090.step` are separate placed assembly snapshots. STEP stores placements. The sidecar stores the joint and its allowed range.
- `blender.json` binds the CAD receipt and exported GLB hashes. `geometry.json` records actual parameters measured in Three.js, part IDs, scene matrices, witnesses and per-part correspondence. CAD uses right-handed millimetres and +Z. GLB uses metres and +Y, with `[x,y,z] → [x,z,-y]`. The importer keeps native mesh coordinates and applies the 0.001 scale as a node transform.
- `browser.json` covers actual asset loads, named-pose labels and witnesses, continuous slider and autoplay, orbit and recovery. The named buttons load the separately baked GLBs. Continuous display rotates the moving node about the same signed joint axis. Its interpolation is a visualization. B-rep collision evidence is limited to tested samples.
- `geometry.json` compares the edited STL with an expected surface derived independently from the nominal moving-leaf STL and the frozen X-extent edit. It also rechecks edited CAD/STEP bounds, witness, volume and bore plus the frozen offset/shoulder interference oracles.
- `negative.json` records invalid GLB graph/geometry controls, a deliberately wrong edited X extent and a real Blender process failure. Expected fit and pose control results are in `cad.json`. Browser rejects missing/corrupt/stale assets while holding the previous valid view, with an expected 404 recorded separately. `manifest.json` is written atomically after all gates and binds evidence, PNGs and all selected output hashes. Local logs are intentionally kept out of shared receipts.

Finish at the review gate in Issue #22. Bring the verification report and screenshot links. This fixture validates digital interoperation, sampled geometric interference, and isolated editing. Physical insertion, loads, tolerances for manufacture, friction, continuous collision and portability beyond the tested host remain unverified.
