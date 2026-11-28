# Invention Lab agent runbook

The approved HNG-001 two-component assembly uses this same pinned environment. See the [HNG-001 assembly runbook](INVENTION-LAB-HNG-001-RUNBOOK.md) for its separate commands and evidence.

Session 0.1 is a calibration of CadQuery → STEP/STL → Blender → GLB → Three.js. Start with [AGENTS.md](../AGENTS.md) and [Issue #19](https://github.com/heyitschien/threejs-experiment-animations/issues/19). Use an isolated worktree and record its starting commit. The original [Session 0 evidence](../experiments/invention-lab/session-0/README.md) stays at calibration commit `e59fc23f6ca14f96225037bb828c43f247efc478`. Use the commands below for new calibrations.

## Supported host and tools

| Boundary | Session 0.1 pins |
| --- | --- |
| Host tested | macOS 26.6.2, Apple silicon / arm64 |
| Python | CPython 3.12.12, uv 0.6.9, CadQuery 2.8.0, OCP runtime 7.9.3.1 (wheel 7.9.3.1.1) |
| Blender | Foundation macOS arm64 4.4.0, build `05377985c527`, embedded Python 3.11.11 |
| JavaScript | Node 26.13.0, npm 11.20.0, Three.js 0.187.0, Playwright 1.65.1 |
| Browser | Playwright's local Chromium channel 159.0.8154.6 |

Other OSes, architectures, and versions need separate verification. The [Python lock](../experiments/invention-lab/session-0.1/requirements-macos-arm64.lock) records the exact PyPI wheel filename and published SHA-256 for each of 44 packages. Bootstrap forces binary wheels and checks hashes. npm uses the existing `package-lock.json` and obtains Chromium with the repository's `qa:install` command. Installs use public dependency endpoints and project-local environments. No privileged access or provider-specific agent state is required. Direct CadQuery is the calibration path. Agentcad is optional and FreeCAD is deferred.

## Trusted Blender

The CLI looks on `PATH` and then in the standard macOS Applications directory. Set `BLENDER_BIN` to select a different app copy. Doctor checks the bundle's strict seal, Blender Foundation identifier and Team ID `68UA947AUU`, and Gatekeeper notarization before invoking Blender. If checks fail, use a verified official app from a separate location or stop and escalate. Any replacement of an existing app requires approval. Factory startup and disabled auto-execution are used for the calibration.

The [official 4.4.0 hash list](https://download.blender.org/release/Blender4.4/blender-4.4.0.sha256) publishes SHA-256 `c3a1192d36d6202cd233081a54391c5778f3dd7aa3ca5af077f641e87a412104` for the [arm64 DMG](https://download.blender.org/release/Blender4.4/blender-4.4.0-macos-arm64.dmg), approximately 304 MB. A read-only mount is sufficient. For example, from the worktree root:

```bash
blender_dir="$(mktemp -d)"
curl -fL https://download.blender.org/release/Blender4.4/blender-4.4.0-macos-arm64.dmg \
  -o "$blender_dir/blender.dmg"
printf '%s  %s\n' c3a1192d36d6202cd233081a54391c5778f3dd7aa3ca5af077f641e87a412104 \
  "$blender_dir/blender.dmg" | shasum -a 256 -c
```

Continue only after the checksum reports OK.

```bash
hdiutil attach -readonly -nobrowse -mountpoint "$blender_dir/mount" "$blender_dir/blender.dmg"
codesign --verify --deep --strict --verbose=2 "$blender_dir/mount/Blender.app"
spctl --assess --type execute --verbose=4 "$blender_dir/mount/Blender.app"
export BLENDER_BIN="$blender_dir/mount/Blender.app/Contents/MacOS/Blender"
```

Leave the DMG mounted during the run. Once finished with Blender, detach with `hdiutil detach "$blender_dir/mount"`.

## Bootstrap, run, and verify

Run from the worktree root in a fresh shell. The first command needs Node, npm, `python3.12`, and uv on `PATH`. Optional executable overrides are `LAB_NPM`, `LAB_PYTHON` (bootstrap interpreter), `LAB_UV`, `CADQUERY_PYTHON` (already locked venv interpreter), and `BLENDER_BIN`. Use the pinned Node selected by your shell. The defaults are discovered from `PATH` or anchored to the worktree. No Homebrew prefix is required.

```bash
lab=experiments/invention-lab/session-0.1/lab.mjs
node "$lab" bootstrap
npm run check
node "$lab" doctor

mkdir -p invention-lab-runs
run="invention-lab-runs/calibration-$(date -u +%Y%m%dT%H%M%SZ)"
node "$lab" run --out "$run"
node "$lab" verify --out "$run"
node "$lab" negative --from "$run" --out "$run-negative"
```

For later runs with an existing locked environment, start at `doctor` and assign a new `run` path. Bootstrap requires a new venv directory and invokes `npm ci` in this worktree. If bootstrap was interrupted, inspect the failure and start in a fresh worktree or move the incomplete venv aside. A first import of native CAD wheels on macOS can take more than a minute. The stage timeout is 180 seconds. Investigate a timeout and use a new output directory on retry.

```bash
node "$lab" viewer --out "$run" --port 4175
```

Open the URL printed by the server on the same machine. Orbit, switch variants, and try the intentional missing file. The previous valid mesh and dimensions stay visible on failure. The automatic Playwright browser tests and screenshots are part of `run`. `verify` checks the saved QA evidence and recomputes Three.js geometry from GLB bytes. Use a new run directory to execute browser QA again. The viewer revalidates the selected run before serving and listens only on loopback.

## Run and evidence contract

- `--out` must be a new directory with an existing parent, outside the worktree or under ignored `invention-lab-runs/`. Success exits zero. Failures exit nonzero. A failed directory is retained for diagnosis and cannot be reused as a complete receipt.
- `run.json` records the run UUID, original calibration SHA, actual HEAD, worktree cleanliness, tool versions and SHA-256 of effective sources and locks. `spec.json` is the exact input snapshot.
- `cad.json` binds the spec and both STEP/STL pairs. It records solid validity, bounds, volume and a signed landmark for both source and STEP round trip. `blender.json` binds the CAD receipt and actual imported STL to the produced GLBs.
- `geometry.json` binds measured transformed GLB geometry to its hashes. The browser validates the receipt identity and actual GLB hash, measures the loaded model, and publishes units and dimensions from its measurements.
- `browser.json` and three PNGs record the base view, variant and intentional missing file. `manifest.json` appears atomically only after all stages pass and binds the actual files to the run UUID. A verifier checks the current effective sources and the exact artifact set. These hashes support consistency and provenance within the workflow. They are not a signed attestation against someone rewriting every file.
- Raw logs stay local and can contain machine paths. Share only reviewed receipts and screenshots. A nonzero Blender process, missing file, stale run ID, bad hash, wrong model set, invalid number, failed upstream status or orientation mismatch requires a fresh run after diagnosis.

The CAD axes are Z-up in millimetres. STL numeric coordinates keep that convention and Blender imports at scale 0.001. The Three.js scene is in metres and maps CAD `[x,y,z]` to `[x,z,-y]`. The off-center pocket establishes the sign. The integration limit is 0.5 mm per axis, with STL/GLB oriented triangle coordinates compared after rounding to 0.001 mm. The fixture checks one named root mesh, world-space bounds and geometry. The STEP round trip uses the same CAD kernel. Named assemblies, independent-kernel verification and other OSes remain future tests.

## Independent reproduction and review gate

Give a second agent a clean checkout at the candidate commit, this runbook and the Issue #19 reference. Use a fresh conversation. On the same supported host, have it run the commands above, save the manifest and screenshots, and report the clean HEAD, versions, signed landmark, maximum error, test outcomes and any friction. If a verified Blender app is already mounted, the operator can supply its executable via `BLENDER_BIN`. Distinguish same-host agent reproduction from OS portability. Review both receipts before approving any later Living Window work.
