# LW-SHADE-001 synchronized shade

This isolated experiment authors six named CadQuery solids, checks the two-slat parallelogram at 13 poses, exports named STEP parts and 0/25/60-degree assemblies, converts the components to GLB in Blender, and builds a static Three.js viewer. The original procedural washer is ID 3.2 × OD 7 × 0.5 mm; no catalog bytes are included.

From the repository root, use only the owner-approved pinned environment and a fresh output directory:

```sh
source "$HOME/.config/invention-lab/env"
export LAB_NPM CADQUERY_PYTHON BLENDER_BIN
"$LAB_NODE" experiments/invention-lab/session-0.1/lab.mjs doctor
"$LAB_NPM" run check
run="invention-lab-runs/lw-shade-001-$(date -u +%Y%m%dT%H%M%SZ)"
"$LAB_NODE" experiments/invention-lab/lw-shade-001/lab.mjs run --out "$run"
"$LAB_NODE" experiments/invention-lab/lw-shade-001/lab.mjs verify --out "$run"
"$LAB_NPM" run lw-shade:build
"$LAB_NPM" run lw-shade:test -- experiments/invention-lab/lw-shade-001/dist "$run/browser-repeat"
```

The static preview is `experiments/invention-lab/lw-shade-001/dist/`. Browser mobile coverage is Chromium emulation, not a physical-device test. Exploded mode is inspection only. The 13 B-rep poses are sampled evidence, not continuous collision, physical fit, retention, load, durability, wind, energy, or manufacturing validation.
