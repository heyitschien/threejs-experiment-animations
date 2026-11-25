# Leaf to Light — visual reference package (concept rev 01)

> **Design input only — NOT engineered, manufactured, measured or certified.** These references establish a shared aesthetic and nominal geometric brief for a future agent-operated CadQuery → Blender → Three.js experiment. The image-generation views may not preserve exact internal aperture geometry between angles. **A valid generated CAD model and verified measurements must supersede the pictures.**

## Reference files and their authority

1. **`concept-multiview.jpg`** — appearance reference for the same leaf-inspired panel from front, three-quarter, rear and edge-close-up angles. Shows wood grain and cut-through leaf geometry; visually inspiring but **not dimensionally authoritative**.
2. **`concept-variants.jpg`** — three presentation references in left-to-right order: A straight-slats control, B leaf venation, C bamboo-rhythm. These photos are *concept visualizations*, not measured render outputs.
3. **`leaf-to-light-dimensioned-reference.svg`** — scalable technical reference with labeled outer envelope, side/edge view, legend and A/B/C schematic. Only the **stated numeric envelope/design constraints** are intended as requirements; illustrative aperture contours are **not CNC cut paths**.
4. **`model-brief.json`** — structured default parameters and proposed acceptance criteria. At kickoff, review each assumption and record any change before building CAD.

## Form and dimensions for the design agent

| ID | Parameter | Proposed value | Meaning |
| --- | --- | --- | --- |
| L1 | Outer envelope | **300 × 300 mm** | The complete physical square panel, every variant |
| L2 | Nominal thickness | **6 mm** | Single-piece flat sheet, not a hollow frame |
| L3 | Perimeter frame | **18 mm minimum** | No void may break into the outer frame zone |
| L4 | Remaining internal web | **6 mm minimum** | Measured shortest bridge between cutout edges; must be tested in CAD |
| L5 | Leaf central spine | **12 mm minimum** | Measured after cutouts for B |
| L6 | Corner radius | **R12 mm** | Outer corners; manufacturing rounding still to be validated |
| L7 | Comparison aperture target | **40% ± 5 percentage points** of 264 × 264 mm inner field | Same basis for A/B/C; report if geometry cannot satisfy it |
| L8 | STEP ↔ GLB outer-bound mismatch | **≤ 0.5 mm proposed** | Digital conversion tolerance, not machining/fabrication acceptance |

**Material is provisional:** a 6 mm bamboo-look laminated plywood sheet in the concept images. We have not selected a supplier, actual bamboo species, grain/lamination direction, adhesive, cutting method, kerf, finish, material strength, durability or physical tolerances. No mounting holes, fasteners, support structure or outdoor-use design are included.

**Coordinate convention:** model panel in the CAD XY plane. Lower-left outer envelope at `(0,0,0)` and upper-right at `(300,300,0)`. Extrude the source panel from `z=0` to `z=6 mm`. Record any Blender / Three.js axis or unit conversions explicitly. Do not let a visualization program silently alter CAD-authoritative geometry.

## The three designs

- **A / Conventional slats:** repeated long vertical capsule-shaped holes with clear rounded ends. Exact count and slot width are solved by the CAD generator to meet the shared aperture and web targets. This is the control.
- **B / Leaf venation:** one continuous central vertical spine with bilateral branching secondary ribs and organic lens-shaped negative-space cells. The leaf picture is *inspiration*; the CAD code must generate valid, non-overlapping cutout contours, obey the minimum web and avoid isolated solids.
- **C / Bamboo rhythm:** mostly vertical strips with deliberate grouped spacing and occasional connecting cross-members. Avoid fragile decorative nodes and disconnected pieces. The pattern must be generated as a real, connected 6 mm thick CAD solid.

For fair comparison, keep the same outer dimensions, nominal thickness, material assumption, front-facing orientation, light direction, and photograph/render camera parameters. Measure volume, open area and projected shadow geometry; do not infer real annual daylight, wind resistance, carbon savings, structural strength or material cost from concept renders.

## Visual shots that the future CAD / Blender / browser pipeline must regenerate

1. **Front orthographic:** A/B/C in same framing, show openings and overall silhouette.
2. **Back orthographic:** same coordinate orientation, check unwanted occlusion and cut-through geometry.
3. **Side edge:** show true 6 mm thickness with scale reference and no hidden backing plate.
4. **Three-quarter isometric:** matched camera for all variants; reveal thickness and material.
5. **Detail macro:** perimeter frame, minimum internal web, rounded-cutout transition, any tooling artifacts or edge finish.
6. **Controlled material study:** neutral clay versus bamboo-look, same lights/camera/geometry; optional recycled-polymer study if added by approval.
7. **Shadow comparison:** controlled light incidence (document direction and distance), same receiving plane, same orientation; save A/B/C shadow silhouettes and computed shaded fraction.
8. **Browser viewer:** A/B/C selector, mm readout, orbit, camera reset, and malformed/missing GLB fallback.

Treat the generated concept mockups as **targets to investigate**, not evidence of geometry validity. Ensure every technical output is generated from one source CAD script and versioned parameter files.

## Copy/paste implementation brief for a coding agent — execution requires approval

> Work only in an isolated `experiments/invention-lab/leaf-to-light/` directory of `heyitschien/threejs-experiment-animations`, after human approval of the pilot. Read repository `AGENTS.md`, [Invention Lab proposal](../../../docs/INVENTION-LAB-PROPOSAL.md), [tools inventory](../../../docs/INVENTION-LAB-TOOL-LANDSCAPE.md) and [session playbook](../../../docs/INVENTION-LAB-SESSION-PLAN.md). Treat `model-brief.json` and the dimensioned SVG as numeric design inputs. Use the two concept JPEGs solely as non-exact aesthetic references. Evaluate existing `agentcad` tooling before writing a custom agent bridge. Choose CadQuery as the default CAD source; generate valid parametric STEP solids for variants A/B/C with 300 × 300 × 6 mm outer dimensions, 18 mm frame, ≥6 mm webs, and report the 40% ±5pp aperture target. Verify CAD solid validity, dimensions, volume, and minimum features. Tessellate with recorded tolerance, render matched Blender material/front/side/rear/isometric views, and display derived GLBs with unit readouts in a standalone Three.js inspector. Measure shadow/volume under identical conditions, record failures/revisions and exact versions/SHAs, keep released OCTO unchanged, and report **PROVEN / REPORTED / INFERRED / NOT VALIDATED**. Do not install, purchase, deploy, fabricate, merge or publish without specific approval.

## Human review and decision gate

- [ ] Approve the nominal geometry (or record revised values in JSON).
- [ ] Choose fabrication assumption/limitations before assessing manufacturability.
- [ ] Review visual design B (leaf-venation) with A and C as controls.
- [ ] Authorize **only** the initial environment and CAD-smoke-test session with a bounded time budget.
- [ ] Accept digital results only after CAD/mesh/viewer measurements; handle physical prototypes and LinkedIn publication as **separate** later approvals.

No design, file or image here is a verified physical prototype or production drawing.
