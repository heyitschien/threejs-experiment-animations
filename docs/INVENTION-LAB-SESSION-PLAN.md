# OCTO Invention Lab — integration session and verification playbook

> **Status: prepared, not executed.** No tools are installed by this document; commands, directories and measurements below are **proposals**. Begin only after approval under [Issue #19](https://github.com/heyitschien/threejs-experiment-animations/issues/19). Use an isolated branch/worktree and preserve [OCTO Study v1.0](FINAL-VALIDATION.md) unchanged.

[Pilot and decision](INVENTION-LAB-PROPOSAL.md) · [Tool reuse landscape](INVENTION-LAB-TOOL-LANDSCAPE.md) · [Study A](STUDY-A-ASSET-INTEGRATION.md) · [Study B](STUDY-B-MATERIAL-EVALUATION.md)

**Prepared concept references:** [four-view mock, variant comparison, nominal dimensional sheet, and machine-readable brief](../reference/invention-lab/leaf-to-light/README.md). Read the numerical limits from `model-brief.json`, **not** from pixel measurements of the generated photos. Revalidate all dimensions/feature clearances from the CAD solids.

## Session objective and expected result

**Pilot:** **Leaf to Light**, a 300 × 300 mm tabletop, non-load-bearing shading-screen comparison (A straight slats, B leaf branching, C bamboo-rhythm geometry). Test the **agent-operated engineering handoff** from source CAD to STEP, tessellation, Blender, and browser, with simple, clearly bounded sunlight/shadow metrics.

**At session end, answer:** (1) Was each file genuinely derived from the same versioned CAD parameters? (2) Were scales and dimensions preserved? (3) Can another reviewer compare designs under controlled conditions? (4) What failed, what did the agent fix, and what remains unverified? (5) Is a small physical sample warranted?

**Not in scope:** full octopus armor, new infrastructure framework, production deploy, structural engineering, certified environmental simulation, permit-ready architecture, account signups, purchases or public LinkedIn posts.

## Approve these before typing an installation command

| Input | Required decision / record |
| --- | --- |
| Target and safety | Human-approved tabletop prototype; no load-bearing or public-use safety claims |
| Machine | OS/CPU architecture, Python and Node versions; Blender/FreeCAD availability; disk budget |
| One CAD dialect | Default CadQuery; switch to build123d only with a documented reason |
| Dependencies | Check licenses, provenance and pinned compatible versions; avoid global installs and arbitrary downloads |
| Manufacturing assumption | Material, thickness, smallest web/slot, edge clearance and method **if** making a prototype; otherwise label unvalidated |
| Numeric tolerances | Declare valid B-rep/solid count, CAD dimensions, mesh tessellation tolerance and conversion error **before results**; propose ≤0.5 mm absolute deviation on 300 mm overall GLB/STEP bounds as an integration threshold, not a manufacturing guarantee |
| Time/cost cap | Suggested *planning estimate*: four sessions of ~2 hours; stop/escalate if tool installation consumes first session or exceeds agreed budget |
| Agent authority | No credentials or GitHub write tokens exposed to model-generated scripts; restricted workspace and explicit approval for external changes |

## Proposed run order

### Session 0: 60–120 minutes — environment recon and reuse decision

1. Read this document, [tool inventory](INVENTION-LAB-TOOL-LANDSCAPE.md), repository instructions and approved issue. Record clean base SHA and working branch; confirm existing `npm run check` baseline **without replacing OCTO goldens**.
2. Record actual Python/Blender/Node/FreeCAD availability. Do not install anything automatically. Review license, release state, dependency compatibility and security of **agentcad** and FreeCAD MCP alternatives.
3. If approved, run one disposable, no-secret **simple solid** through agentcad; compare to a minimal direct CadQuery script. Keep whichever yields valid STEP, deterministic dimensions, clear errors and simple cleanup. Do **not** write a custom MCP server to bridge a first-pass gap.
4. If the first session cannot get a valid CAD file in the approved time, **stop**, report environment blockers and request a revised tool choice.

### Session 1: ~2 hours — precise CAD and testable variants

1. Finalize brief and parameter schema (mm). Define common 300 × 300 mm envelope, same nominal thickness and material assumption, and specified minimum web/slot limits.
2. Have the agent generate variants **A/B/C** using the one approved CAD dialect. One small explicit parameter family per variant; avoid hidden manual Blender edits.
3. Export STEP and a controlled tessellation, log shape validity, solid counts, bounds, volume, min-feature checks where measurable, and generation errors. Reject null/invalid shapes and impossible clearances.
4. Change at least **two meaningful parameters** (e.g. pattern density and thickness) and regenerate. Require reproducible geometry metrics across reruns; binary hash equality is useful only if output metadata/serialization are stable.

### Session 2: ~2 hours — CAD → visual → browser integrity

1. Import STEP into FreeCAD or validate with another OCCT-based path, **if approved and practical**. Record dimensional check results; FreeCAD is not an automatic prerequisite for a successful first vertical slice.
2. Tessellate each CAD model with a recorded tolerance. State exactly how mm CAD dimensions translate to Blender and the viewer's scene-unit convention; compare bounding boxes at every handoff. A GLB is **derived evidence**, not a source for STEP edits.
3. Use Blender Python for a **controlled visual material study** with fixed cameras/lights (e.g. neutral material, plywood/bamboo-look, recycled polymer). Use the same settings for meaningful material A/B comparisons; preserve CAD geometry.
4. Build a **separate** Three.js inspector that loads A/B/C, orbits, toggles variant, displays units, and clearly handles missing/malformed model files. Do not modify the released OCTO runtime or historical goldens.

### Session 3: ~2 hours — measurements, evidence and review

1. Under the **same** light direction, camera, panel orientation and display scale, compare open area and projected shadow coverage. Record algorithm, geometry assumptions and test positions. These are **geometric shadow measurements only**, not validated thermal or annual daylight savings.
2. Compare solid volume under the same material assumption; provide percentages relative to straight-slat A, but **do not** turn volume into material cost without density, waste and process assumptions.
3. Save at least four matched inspection views (front, side, isometric, underside if relevant), a Blender material comparison, the browser visual, a screenshot of one failure and recovery, and machine-readable metric output.
4. Produce a case-study summary with **PROVEN / REPORTED / INFERRED / NOT VALIDATED**, exact tool versions, base/head SHAs, any setup friction, model interventions, time/cost **only if measured**, and the next decision. Ask an independent reviewer to inspect it.
5. Discuss **optional** physical fabrication (one small panel) under a separate budget/safety/approval gate. Photograph and measure it, and compare physical versus model dimensions before claiming prototype success.

## Proposed artifact contract after approval

Create these inside a dedicated future experiment directory; **none exist yet**:

```text
experiments/invention-lab/leaf-to-light/
  brief.md                 # question, safety, material, dimensions, units
  versions.json            # pinned executable/library versions and licenses
  model.py                 # authoritative CadQuery source
  parameters/              # control, leaf, bamboo variants
  exports/                 # STEP + tessellated derivatives; provenance
  checks/                  # JSON metrics, comparisons, failure logs
  renders/                 # controlled Blender views and A/B material stills
  viewer/                  # standalone Three.js inspector
  results.md               # facts, limitations, human review, conclusion
```

Store only necessary distributable artifacts, respect repository binary-size constraints, and keep private/local evidence and machine paths out of Git. Use commit-pinned artifact links when sharing results.

## Acceptance matrix: what actually counts as success?

| Gate | Pass condition | Evidence |
| --- | --- | --- |
| Install and provenance | Tools chosen from inventory, versions/licenses recorded, exact commands documented, no unapproved service or global install | `versions.json`, setup log |
| Source reproducibility | Three variants and two controlled parameter changes regenerate from code without manually resculpting CAD | Source, config snapshots, repeat-run geometry metrics |
| Exact CAD model | STEP imports, non-empty valid solid(s), expected overall bounds and finite positive volume; failures surfaced | CAD validity report, measured bounding box, exported files |
| CAD-to-GLB integrity | Coordinates/units and geometry orientation explicitly mapped; overall dims within **pre-agreed** threshold (initial suggestion ≤0.5 mm); no unreported topology change | Per-boundary metrics JSON, fixed screenshots |
| Controlled visuals | A/B/C shown from identical cameras and lighting; visual/material conclusions scoped to tested comparisons | Matched PNGs and Blender scene provenance |
| Browser behavior | Each variant loads, orbit/selector works, unit display accurate, invalid asset gives clear fallback/error | Browser QA, console/visual results |
| Comparison | Measurable shadow/open area and volume from controlled inputs, baseline-relative results, documented algorithm and uncertainty | CSV/JSON + chart/table |
| Case study | Exact SHAs; failures/corrections; reviewer signs off; explicit tested vs untested claims | `results.md`, review checklist |
| Physical reality | **Optional additional gate**, not implicit in digital success: approved sample measured and photographed; material/process assumptions checked | Prototype evidence and reviewer note |

**Stop and report** if STEP or GLB cannot be linked to one authoritative source, two CAD dialects drift, numerical checks are omitted, material/cost assumptions are invented, or the agent only produces beautiful pictures. A documented failure is evidence; an untested claim is not.

## Future publication: technical case study, then LinkedIn

Public posting is **not authorized by this planning PR**. After independent review and approval, prepare a public summary with:

1. **The question:** Can an AI agent operate a repeatable engineering/visual design workflow?
2. **The pipeline:** selected CAD tool, FreeCAD check if used, Blender, Three.js, data and exact handoffs.
3. **The visual evidence:** same-angle A/B/C, material study, browser clip, and if completed a physical prototype photo.
4. **The engineering evidence:** numerical validity, dimensions and conversion error, shadow/volume baseline table, failures and corrections.
5. **The honest limits:** non-load-bearing model, non-certified simulation, physical test status, hardware/agent budget.
6. **What others can reuse:** public source, exact environment versions, commands, artifact links and one short takeaway about agent integration.

Suggested LinkedIn framing **after testing**: *"We tested whether an AI coding agent could take a nature-inspired design from parametric CAD through Blender into an interactive Three.js viewer—and measured where geometry stayed faithful, where conversions failed, and what the tools actually proved."* Replace this with verified findings and metrics; do not present projected benefits as results.

**Next human decision:** review [PR #20](https://github.com/heyitschien/threejs-experiment-animations/pull/20) / [Issue #19](https://github.com/heyitschien/threejs-experiment-animations/issues/19), select one pilot, and approve the bounded first environment-recon session. This document alone starts no work.
