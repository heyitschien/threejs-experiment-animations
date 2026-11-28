# HNG-001 Session 0.3A verification record

25 November 2026, America/Los_Angeles · [Issue #22](https://github.com/heyitschien/threejs-experiment-animations/issues/22) · [Draft PR #20](https://github.com/heyitschien/threejs-experiment-animations/pull/20)

The accepted planning base was `742545fe46eb5b7bad040ae5b8a0f6cff1e45021`. The draft review base advanced to `fd01eebfaf8414468f953d56f33ac9abdcfa5e77` with the owner's ADR. The fixture freeze was replayed unchanged as `7a732fe6b85966b029dc85f7070b78d3fcce4d00` before implementation. Both published runs tested clean implementation HEAD `71d51100bbe9528f3f648dfbfa9ccc87fefed2f4`. The [operator runbook](../../../../docs/INVENTION-LAB-HNG-001-RUNBOOK.md) contains exact commands, dependency reuse and attribution. The Session 0 and 0.1 trees, npm lock, OCTO source and tests match their captured baseline. Additional spend was USD 0.

## Executed on the existing Session 0.1 stack

macOS 26.6.2 arm64, Python 3.12.12, CadQuery 2.8.0, OCP 7.9.3.1, uv 0.6.9, Blender 4.4.0 build `05377985c527` with embedded Python 3.11.11, Node 26.13.0, npm 11.20.0, Three.js 0.187.0, Vite 7.3.8, Playwright 1.65.1 and Chromium 159.0.8154.6. Doctor verified the strict seal and notarization of the existing read-only Blender copy. npm dependencies and Chromium were copied from the verified worktree. The Python interpreter came from the existing isolated environment. `npm run check` passed all **17** tests and the production build both before and after implementation, with the existing Vite chunk-size warning. [Run identity and versions](run.json)

```bash
node experiments/invention-lab/session-0.1/lab.mjs doctor
npm run check
lab=experiments/invention-lab/hng-001/lab.mjs
for run in invention-lab-runs/hng-001-primary invention-lab-runs/hng-001-repeat; do
  /usr/bin/time -p node "$lab" run --out "$run"
  node "$lab" verify --out "$run"
done
node "$lab" viewer --out invention-lab-runs/hng-001-primary --port 4177
```

The two runs took 17.00 s and 13.42 s, including browser QA and the forced Blender failure. Both verified. The three GLBs, three STLs, exact fixture and all four screenshots were byte-identical. For all six STEP pairs the sole byte difference was the `FILE_NAME` header timestamp. CAD fit receipts matched. This is a same-host repeat using the same installed environment. [Primary manifest](manifest.json) · [Repeat manifest](repeat/manifest.json) · [Repeat run identity](repeat/run.json)

## Measured engineering outcomes

Two named, valid closed solids survived STEP re-import. XCAF contained root `hinge`, occurrences `hinge.fixed_leaf` and `hinge.moving_leaf`, and measured proper signed transforms at 0°, 45° and 90°. The fixed and moving source volumes were **3,736.33293 mm³** and **1,704.08519 mm³**, respectively, matching their analytic oracles. The GLB joint axis is +Y and the CAD sidecar axis is +Z.

| Test | Measured result |
| --- | --- |
| Nominal radial and axial gaps | 0.200 mm radial and 0.500 mm at each shoulder |
| Fit samples at 5° intervals | 19 samples over 0°–90° with 0 mm³ overlap and 0.200 mm minimum separation |
| Interface gauges | 0 mm³ missing keep-in material and 0 mm³ occupied keep-out volume |
| Contact control, 3.00 mm bore radius | 0 mm separation, 0 mm³ overlap |
| Undersized bore, 2.80 mm radius | 40.086722 mm³ overlap, −0.20 mm radial fit |
| +0.30 mm X offset | 3.774499 mm³ overlap, −0.10 mm radial residual |
| −0.75 mm Z offset | 11.592477 mm³ overlap, 0.25 mm shoulder penetration |
| Joint sign and range | Opposite signed 45° pose missed its witness by 30.714 mm. −1° and 91° rejected. |
| Moving-leaf edit, X-max 32 → 36 mm | Added 176 mm³. Measured symmetric difference was 0 mm³ outside the edit slab and 0 mm³ on the regenerated fixed leaf. The fixed input STEP/STL bytes were retained. |
| Blender and GLB | Two named child meshes under one assembly root. All six pose/part surfaces matched their STL oriented triangles. Counts were 1,408 fixed and 956 moving at every pose. Worst GLB bounds or witness error was 0.00077510 mm against 0.50 mm. |

[CAD and STEP measurements](cad.json) · [Blender measurements](blender.json) · [GLB geometry and transform measurements](geometry.json)

## Browser and rejection evidence

Chromium verified the three separately baked poses, signed witness labels, orbit, 31.5° continuous positioning, autoplay and recovery. It rejected missing assets, stale receipts, hash mismatches and syntactically invalid GLB bytes with a matching test receipt hash. The expected missing asset gave the only resource/console error, and there were no page exceptions. The geometry verifier separately rejected duplicate IDs, reflected and wrong-sign poses and reversed winding. Real Blender Python exception exit 23 was propagated and the failed directory could not verify. An extracted archive was verified end to end. An extraction with the 45° GLB omitted failed verification. [Browser QA](browser.json) · [Negative controls](negative.json)

[0° screenshot](closed_000.png) · [45° screenshot](half_045.png) · [90° screenshot](open_090.png) · [Missing-asset recovery state](missing.png)

An early development invocation stopped when a trimmed cylinder face was passed to a surface API without a cylinder accessor. Using OCP's B-rep face adaptor resolved it and left the frozen fixture and thresholds unchanged. Raw host logs stay outside Git. The downloadable archive contains every file referenced by the primary manifest and has SHA-256 `d1afc4efb6ba913d4c60ae57b765b99f4f93d65d273eeccb340331004a64d389`.

The CAD checks sample geometry rather than perform continuous collision detection. Browser interpolation is for inspection. Physical assembly, retention, loads, safety, manufacturing fit, a different kernel, and other platforms remain unvalidated. Owner review is the next gate.
