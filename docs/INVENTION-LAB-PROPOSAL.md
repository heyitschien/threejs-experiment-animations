# OCTO Invention Lab — design-to-evidence research proposal

> **Status: draft planning document, researched 2026-11-24.** This extends [Issue #19](https://github.com/heyitschien/threejs-experiment-animations/issues/19) and does not authorize setup, execution, procurement, fabrication, publication, or changes to the released OCTO runtime. [OCTO Study v1.0](https://github.com/heyitschien/threejs-experiment-animations/releases/tag/octo-study-v1.0) remains a separate, completed non-production case study.

**Decision requested at the next lab session:** approve or revise one bounded pilot and its explicit time/cost ceiling. The recommended pilot is **Leaf to Light**, a non-load-bearing, 300 × 300 mm tabletop architectural shading-panel study. A bamboo connector is retained as an optional geometry calibration exercise, **not** the flagship invention.

Read alongside the [current open-source landscape](INVENTION-LAB-TOOL-LANDSCAPE.md) and the [integration session and acceptance playbook](INVENTION-LAB-SESSION-PLAN.md).

## The question

Can a coding agent turn a nature-inspired brief into **one dimensionally authoritative parametric CAD model**, produce mechanically faithful derived meshes for Blender and Three.js, run controlled numerical and visual checks, and package honest evidence another person can reproduce?

The objective is **integration, workflow design, validation, and reusable knowledge**—not becoming a 3D art studio, building a general-purpose CAD agent from scratch, or implying a render is a certified design.

## Current OCTO evidence versus the unproven leap

| Claim | Evidence status | Reference |
| --- | --- | --- |
| Blender/Python can author an asset, export a GLB, and integrate an opt-in arm in Three.js with fallback | **Demonstrated within OCTO**; same-agent tests, not an independent lab replication | [Study A](STUDY-A-ASSET-INTEGRATION.md), [final validation](FINAL-VALIDATION.md) |
| Controlled Blender material study can reveal internal structures, with browser representations of the same static scene | **Demonstrated static visual comparison**, not physical material behavior | [Study B](STUDY-B-MATERIAL-EVALUATION.md) |
| Exact CAD-to-mesh handoff, engineering units and dimensions, FreeCAD round trip | **Not tested in OCTO** | This proposed pilot |
| Physical manufacturability, prototype fit, daylight/thermal performance, structural safety | **Not tested** | Separate future evidence gates |

The next study therefore targets **CAD authority and cross-tool verification**, not additional chrome armor or a complete octopus redesign.

## Technical ownership and the one-way source of truth

| Layer | Default choice | Authoritative artifact | Rule |
| --- | --- | --- | --- |
| Specification | Human-reviewed Markdown + structured parameters | Brief with dimensions in **mm**, use case, limits, test thresholds | Resolve ambiguities before generating geometry |
| Parametric geometry | **CadQuery + Python** | `.py` model and STEP (`.step`) | Exact geometry and parameters belong here; STL/GLB are derivatives |
| CAD inspection | **FreeCAD**, optional at first | Imported STEP + inspection receipt | Verify validity/dimensions; if edited, explicitly version and re-export |
| Presentation | **Blender Python** | `.blend`, images, derived mesh | Lighting/materials only; dimensional changes need CAD regeneration |
| Browser inspection | **Three.js** | GLB scene + version/units overlay | Viewer for comprehension, not the authority for engineering dimensions |
| Repeatability | Python tests + browser QA | JSON/CSV measurements, images, logs, SHAs | State exactly what passed and what was not tested |
| Independent assessment | Human reviewer | Review decision + unresolved issues | No automatic structural/fabrication certification |

CadQuery and alternative **build123d** both rely on Open Cascade. Pick **one** as the pilot's source-code CAD dialect; benchmark the other only if concrete friction justifies switching. Evaluate an existing orchestration package such as **agentcad** before adding our own MCP server or agent framework. Do not introduce FreeCAD as a mandatory second modeling engine without a verified need.

**Interop contract:** source `.py` → STEP solid → explicitly tessellated mesh → Blender scene → GLB → Three.js. STEP carries precise geometry for CAD interchange, but **not** the editable Python feature history. The GLB is a visual mesh, not an exact CAD master. Record unit conversions (CAD mm; explicit viewer/GLB convention), mesh tolerance, geometry bounds, and derivative provenance.

## Recommended pilot: Leaf to Light

**What we will design:** three variants of one **300 × 300 mm, non-load-bearing tabletop architectural shade-screen panel** under the same nominal material thickness and visual conditions:

1. **A — ordinary straight slats:** the simple baseline.
2. **B — leaf-venation-inspired branching pattern:** biological form translated into adjustable geometry.
3. **C — bamboo-rhythm-inspired repeated members:** natural spacing and modularity, without claiming literal bamboo structural behavior.

**Scope:** abstract, accessible tabletop design study. No wall anchoring, building envelope, roof, occupied structure, wind-load rating, seismic design, public installation, or permit-ready drawing. A full-sized facade or pavilion is a later, separately approved discipline.

**Proposed model parameters** (values except outer dimensions resolved at kickoff): `panel_width_mm`, `panel_height_mm`, `panel_thickness_mm`, `frame_width_mm`, `pattern_density`, `minimum_web_mm`, `opening_rule`, and `variant`. Record manufacturing method and its minimum feature/clearance assumptions before selecting final dimensions.

**Useful test questions:**

- Can one agent generate **three comparable valid solids** from one documented specification and revise them without manual sculpting?
- Does the STEP → mesh → Blender → GLB handoff preserve panel bounding dimensions and orientation within a declared tolerance?
- Compared at identical light angle and geometry envelope, how do projected shadow/open-area ratios differ? (This is **not** an energy-savings estimate.)
- How does solid volume / approximate material usage differ between designs given the same material assumption?
- Can a second person inspect the models in a browser, understand constraints, and reproduce the measurements?

**Differentiation:** the invention is **not** a claim that leaf-pattern panels do not already exist. It is a documented, agent-operable design-to-evidence loop that makes visual/physical tradeoffs inspectable and repeatable.

## Why not start with the bamboo connector?

The literature already documents clamps, caps, custom parametric connectors, and experimentally tested 3D-printed bio-composite bamboo joints ([2024 connection review](https://www.mdpi.com/2075-5309/14/4/1126); [2021 experimental paper](https://infoscience.epfl.ch/entities/publication/e5a0be91-347d-4224-9d01-98696efa671c)). It is a **good low-complexity precision smoke test**, but limited differentiation as an invention. Use a connector only if the shading pilot's model complexity blocks the CAD export/validation learning goal.

Other future, **unapproved** themes: an everyday repairable mechanism (e.g. bin hinge), lightweight furniture, a non-load-bearing bamboo pavilion *concept*, and a botanically inspired adaptive screen. Each needs a new brief and its own go/no-go gate.

## Gates, boundaries, and finish line

1. **Research gate:** verify licenses, current tool compatibility, project maturity, security and API changes; prefer existing open-source components. Document which projects were **read** vs **actually installed/tested**.
2. **Environment gate:** approval of one pilot, explicit model parameter schema, safe execution environment, version pins and a capped time/cost budget. No private credentials in CAD agents or public outputs.
3. **Digital evidence gate:** three regenerable parameter sets, valid STEP solids, controlled geometry/scale comparisons, matched Blender renders, working browser viewer, machine-readable check results, and at least one documented failure/recovery scenario.
4. **Real-world gate:** **separately approved** prototype fabrication and measurement, material assumptions, safe-use classification. Engineering simulation or a print alone does not establish safety.
5. **Communication gate:** publish a factual technical case study and then draft a LinkedIn summary only after results are verified; never substitute conceptual images for measured evidence.

**Stop** if the first integration session becomes a new orchestration framework, introduces uncontrolled SaaS cost, needs major changes to the released OCTO app, or cannot answer a measurable question. A failed experiment with clear boundary diagnostics is a valid case-study result.

## Approval needed before implementation

- [ ] Approve Leaf to Light or choose the alternate one-part calibration pilot.
- [ ] Choose a specific fabrication assumption (e.g. tabletop printed test piece vs laser-cut sheet); physical work remains separately approved.
- [ ] Confirm available computer, installed versions, maximum setup time and any allowable API budget.
- [ ] Assign human reviewer, acceptance thresholds and stop conditions from the [session playbook](INVENTION-LAB-SESSION-PLAN.md).

No dependencies, CAD files, media, remote services or runtime changes are included in this planning PR.
