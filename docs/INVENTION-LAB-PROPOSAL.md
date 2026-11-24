# OCTO Invention Lab — proposed research lane

> **Status: parking-lot proposal only.** The completed, non-production [OCTO Study v1.0](https://github.com/heyitschien/threejs-experiment-animations/releases/tag/octo-study-v1.0) remains the released case study. This document creates **no implementation authorization**, new dependencies, services, deployments, hardware purchases, or modifications to the OCTO runtime. Track future approval under [#19](https://github.com/heyitschien/threejs-experiment-animations/issues/19).

## Purpose

Explore how software agents and programmable design tools can carry a human idea from **nature-inspired observation → precise parametric geometry → visual storytelling → interactive inspection → bounded verification → evidence-backed review**.

The opportunity is not to become a 3D art studio. It is to investigate where agent-operated, interoperable design tools can reduce friction between imagination and models that people can understand, measure, challenge and—after appropriate real-world validation—potentially fabricate.

This is independent of any other autonomous-systems laboratory. Reuse the **principles** (clear contracts, reproducibility, validation and human approval), not shared runtime infrastructure, data or execution authority.

## Tool boundaries: never confuse a pretty image with a verified part

| Layer | Primary tool | Owned artifact | What it does / does not validate |
| --- | --- | --- | --- |
| Brief and constraints | Human + research agent | Units, dimensions, functional intent, safety boundaries, acceptance criteria | Captures requirements, not proof of feasibility |
| Precise parametric design | **CadQuery / Python** | **CAD-authoritative script + STEP**, optional STL | Defines editable dimensions and solid geometry using OpenCascade; does not establish strength, safety, manufacturing fit or building-code compliance |
| Optional CAD inspection | **FreeCAD** | Imported STEP or explicit edited CAD version | Human-readable dimensional inspection / CAD review; not mandatory for the first pilot |
| Visual presentation | **Blender** | Material scene, tessellated meshes, cameras, GLB | Makes form, materials and environment legible; **must not silently alter CAD dimensions** |
| Interactive inspection | **Three.js** | Browser GLB viewer | Orbit, inspect and compare variants; WebGL appearance is not an engineering simulation |
| Automated verification | Python tests + browser checks | Machine-readable test receipts, fixed screenshots | Check units, bounds, shape validity, data handoffs and controls; only prove the checks actually performed |
| Review / provenance | GitHub + human reviewer | Draft, exact SHA, before/after evidence, limitations | Records accountable decisions; no automatic certification or production release |

### Why two geometry tools?

- **CadQuery is for "will this dimensioned solid fit?"** Maintain the parameterized CAD source and STEP master. This is where diameter, thickness, offsets, hole size and mechanical relationships belong.
- **Blender is for "can a person see and understand this design?"** Add credible textures, lighting, context, visual storytelling or organic detail to a *derived* mesh. Use explicit unit/scale checks when translating from STEP or CAD mesh to Blender and GLB.
- **FreeCAD is optional, not another engine to synchronize by default.** Use it when an interactive CAD inspection or an interchange check adds genuine value.
- **Three.js lets others inspect the derivative without installing CAD or Blender.** Share lightweight browser results, but never infer mechanical safety from rendering quality.

One authoritative CAD model flows **one way** into visualization. A modified GLB must not be treated as an updated STEP design. The tessellation/interchange step needs an explicit traceable conversion, unit definition, and geometric comparison.

## Candidate themes (choose one per experiment)

1. **Bamboo / biomimetic architecture** — explore nature-inspired geometry and modular connection details. Make small **non-load-bearing** demonstrators, not building plans, structural specifications or construction recommendations.
2. **Everyday-object redesign** — repairable hinges, modular trash-bin mechanisms, replaceable parts, accessible interfaces and material-use exploration.
3. **Biologically inspired mechanisms** — borrow a *functional principle* from leaves, joints or shells rather than merely copying natural aesthetics.

Architecture is compelling because nature provides forms to study; engineering introduces constraints that challenge those forms. Actual bamboo variability, moisture, load ratings, code, anchorage and construction safety require specialist review and physical testing.

## Proposed first pilot — *not approved for execution*

**One small bamboo-inspired modular connector**, with two dimensional configurations. Select the exact design and parameter values only at kickoff.

| Stage | Required output | Pass criterion |
| --- | --- | --- |
| Brief | Tube diameter, connector angle, wall thickness, fastener clearance, mm units, intended use | One bounded non-load-bearing question and explicit tolerances/assumptions |
| CadQuery | Python script, STEP, tessellated output, measured properties for both variants | Both outputs are reproducible; solids are valid; units, dimensions, volumes/bounds and designated clearances pass numerical checks |
| Blender | Two matched render views and GLB(s) from exported CAD geometry | Appearance improves clarity; dimensional scale is checked against CAD source |
| Three.js | Simple standalone model inspector, variant switch, mm scale readout | Browser loads both, shows correct geometry/scale, controls work, failed model load is handled |
| Report | Source + generated assets + exact SHAs + tests + failure evidence + conclusion | Clear **PROVEN / REPORTED / INFERRED / UNVALIDATED** distinctions and a go/no-go decision |

Keep this a **separate path/branch** with no change to the released octopus. No unnecessary agent framework, online CAD SaaS account, AI model benchmark, new 3D sculpture or autonomous background worker. An agent comparison (Codex vs Claude Code) is **optional future research**, and if run must use matched tool access, budget and rubric.

## Gatekeeping and stopping

**Now:** preserve this proposal and [issue #19](https://github.com/heyitschien/threejs-experiment-animations/issues/19), then **stop**. Do not begin installation or implementation.

**At future approval:** name one intended user, one physical question, dimensions/units, safety assumptions, available resources, a capped effort budget, and a reviewer. Confirm compatible software licenses and environment. Build one pipeline **vertical slice**, not an extensible platform.

**Done when:** parameter changes regenerate a valid CAD solid; STEP and browser mesh consistently reflect the stated units and dimensions; tests and evidence are repeatable; limitations and human approvals are recorded. A successful render or simulation alone does **not** certify manufacturability, strength, environmental performance or code compliance.

**Reject expansion when:** there is no measurable question, the plan is primarily art polish, toolchain costs are escalating, or it displaces existing priorities.

## References

- [CadQuery documentation](https://cadquery.readthedocs.io/en/stable/)
- [FreeCAD features and file interchange](https://www.freecad.org/features.php)
- [Blender Python API](https://docs.blender.org/api/current/)
- [OCTO Study v1.0 baseline](https://github.com/heyitschien/threejs-experiment-animations/releases/tag/octo-study-v1.0)
- [Proposed research issue #19](https://github.com/heyitschien/threejs-experiment-animations/issues/19)
