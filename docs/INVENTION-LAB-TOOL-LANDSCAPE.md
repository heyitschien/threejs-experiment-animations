# Agent-operated CAD and architecture landscape — review as of 2026-11-24

> **Research inventory, not an integration test.** Links below were reviewed from primary project documentation, source repositories or published research. Availability, versions, licenses, costs and tool interfaces can change; recheck and pin at kickoff. A project's advertised capability is **not** a capability proven in OCTO.

> **2026-11-24 Session 0 update:** direct CadQuery 2.8.0 and an isolated agentcad 0.8.1 CadQuery-mode smoke test were run. Direct CadQuery was selected for the calibration pipeline; see the [measured setup receipt](../experiments/invention-lab/session-0/README.md). Other projects in this landscape remain research-only.

[Decision and pilot](INVENTION-LAB-PROPOSAL.md) · [Lab session playbook](INVENTION-LAB-SESSION-PLAN.md) · [OCTO evidence](EVIDENCE-INDEX.md)

## Our buy/adopt/build decision

**Default:** write the smallest CAD source scripts we need, **reuse** mature CAD/graphics frameworks, and **evaluate** agent-native wrappers before implementing a custom tool bridge. Add a library only when it clears a bounded smoke test. MCP is a tool transport, not a substitute for checking geometry or engineering assumptions.

| Layer | Open-source candidate and primary source | Cost/license | Proposed disposition |
| --- | --- | --- | --- |
| Parametric CAD source | [CadQuery](https://cadquery.readthedocs.io/en/latest/) / [GitHub](https://github.com/CadQuery/cadquery) | Free, Apache-2.0 | **SELECT first:** Python scripted solids, STEP and mesh export; minimize new dependencies |
| Alternative CAD-as-code | [build123d](https://build123d.readthedocs.io/en/stable/) / [GitHub](https://github.com/gumyr/build123d) | Free, Apache-2.0 | **HOLD as alternate:** modern typed/algebraic CAD API, strong agent-tool ecosystem; not simultaneous source of truth |
| CAD GUI and checks | [FreeCAD](https://github.com/FreeCAD/FreeCAD) / [Python scripting](https://github.com/FreeCAD/FreeCAD-documentation/blob/main/wiki/Python_scripting_tutorial.md) | Free, LGPL-2.1 | **OPTIONAL STEP verifier**; use for dimensions, solid inspection, and later engineering review |
| 3D materials/rendering | [Blender](https://www.blender.org/about/) / [Python API](https://docs.blender.org/api/current/) | Free, GPL | **REUSE proven OCTO Blender automation**, matched camera/lights, material evidence |
| Browser interaction | [Three.js](https://threejs.org/) / [glTF loader](https://threejs.org/docs/pages/GLTFLoader.html) | Free, MIT | **REUSE proven OCTO browser know-how**, but isolate the invention viewer from the released octopus |
| Architecture semantics | [Bonsai Studio](https://bonsaibim.org/studio.html) / [IfcOpenShell](https://docs.ifcopenshell.org/introduction.html) | Free, open source; Bonsai describes itself as **alpha** | **LATER:** IFC/BIM model, classifications and building elements; GLB alone is not BIM |
| Daylight/environment | [Ladybug Tools](https://www.ladybug.tools/about) / [Honeybee](https://github.com/ladybug-tools/honeybee) | Open-source Python tools; commonly used proprietary Rhino/Grasshopper interface is **not** free | **LATER / optional:** first run simple controlled shadow study; use Radiance/EnergyPlus studies only when justified |
| Structural finite-element analysis | [FreeCAD FEM workbench](https://github.com/FreeCAD/FreeCAD-documentation/blob/main/wiki/FEM_Workbench.md) (Gmsh / CalculiX) | Open-source tools; setup and solver availability vary | **NOT in pilot 1**; load cases, material models and expert validation required |

**Commercial reference, not a dependency:** [Autodesk Fusion generative design](https://help.autodesk.com/view/fusion360/ENU/?contextId=GD-OVERVIEW) already uses geometry and manufacturing constraints to produce design alternatives, but subscription/cloud workloads can cost money. [Rhino/Grasshopper](https://www.ladybug.tools/about) is a mature architectural parametric interface but Rhino is proprietary. We can learn from the workflows without buying those stacks.

## Agent-native projects: investigate before duplicating

| Project | What its maintainers say it does | How to evaluate in OCTO Lab | Disposition |
| --- | --- | --- | --- |
| [agentcad](https://github.com/jdilla1277/agentcad) / [docs](https://agentcad.dev/docs) | CLI/MCP for build123d-native, CadQuery-compatible CAD execution, STEP/mesh export, PNG views, metrics, validity checks and a Three.js preview | Run a no-network, disposable one-part example and inspect artifact provenance, version, geometry, cleanup, attack surface, and license | **FIRST existing orchestration candidate**; don't assume maturity or install globally |
| [blwfish/freecad-mcp](https://github.com/blwfish/freecad-mcp) | Community FreeCAD tool server with modeling operations | Only if an agent needs interactive or headless FreeCAD actions that Python scripting alone cannot provide | **DEFER** pending need/security review |
| [CADPilot](https://github.com/LBurny/cadpilot) | Agent-controlled constrained sketches, part features, assemblies, journal/review | Compare with FreeCAD's native scripting and check actual tool/OS compatibility | **DEFER** to assembly/constraint study |
| [CADGenBench](https://github.com/huggingface/cadgenbench) / [agent baseline](https://github.com/huggingface/cadgenbench/blob/main/src/cadgenbench/baseline/agent.py) | Research benchmark; reference agent iterates Python CAD source after seeing generated STEP renders and validity feedback | Reuse its **methodology** for validity and render-inspect-revise loops; do not claim its scores as our results | **BENCHMARK REFERENCE** |

The useful pattern already exists: *code → exact solid → render/check → feedback → revise*. OCTO should contribute a verified **inter-application** case study (CAD authority → visualization → browser → measured comparison), not an unneeded replacement for these toolchains.

**Security and repeatability:** Generated Python may execute arbitrary code. Run experiments in an isolated environment/worktree with scoped filesystem access, no secrets, minimized network access and explicit user approval for installation or external actions. Review project license, dependency tree, versions, installed binaries, model tokens and failure behaviors first. Capture what was actually tested rather than inheriting README marketing claims.

## Prior art and design value: bamboo and nature

- [2024 review of raw bamboo connections](https://www.mdpi.com/2075-5309/14/4/1126) documents clamp, capped, parametric and printed connection concepts. Another generic connector is **not inherently novel**.
- [2021 removable bio-composite joint study](https://infoscience.epfl.ch/entities/publication/e5a0be91-347d-4224-9d01-98696efa671c) reported physical compression testing. Do not transfer that study's rating to a different geometry or material.
- [ISO 22156:2021](https://www.iso.org/standard/73831.html) addresses structural design of certain round-bamboo building systems. It is **not** blanket approval to design/build a pavilion without a structural professional and applicable local review.

**Design choice:** a non-load-bearing **leaf/bamboo-inspired shade screen** offers a stronger first demonstration because it tests CAD variation, visual communication, and controlled shading/volume tradeoffs. It does **not** prove that biomimetic geometry outperforms straight slats; the study should measure and report the outcome. A connector stays on the backlog as a small mechanical geometry-calibration alternative.

## Format ownership and interoperability traps

| Format | Use | Limit |
| --- | --- | --- |
| Python + explicit parameter schema | **Authoritative editable parametric design** | Maintain versioned source and units; not itself a physical proof |
| STEP | Precise B-rep solid interchange between CAD tools | Does not preserve all original CadQuery feature-editing history; check imported units and topology |
| STL / OBJ | Tessellated manufacturing or visual intermediate | Triangle approximations, not parametric models; STL does not reliably specify units |
| GLB / glTF | Efficient browser visual model (also for Blender delivery) | Geometry/material fidelity is conversion-dependent; browser rendering is not a mechanical simulation |
| IFC via IfcOpenShell / Bonsai | Building elements, metadata, and interoperability | Separate semantic modeling work; converting CAD geometry to GLB does **not** produce BIM |

Check winding/solidity, volume, bounding box, orientation, explicit mm↔meters convention, tessellation deviation, and provenance at each boundary. FreeCAD's [CheckGeometry](https://github.com/FreeCAD/FreeCAD-documentation/blob/main/wiki/Part_CheckGeometry.md) is an example of a CAD validity check, not proof of construction safety.

## Research refresh checklist for the integration session

- [ ] Confirm current Python / CadQuery / OCP compatibility on the chosen machine.
- [ ] Check the latest release, license, maintained branches, dependencies, and security surface of agentcad; then either accept it for a **small** smoke test or use direct CadQuery scripts.
- [ ] Confirm Blender version, Python API and tessellation/export route; verify glTF import with the project's Three.js version.
- [ ] Confirm any FreeCAD executable and STEP-import support without installing an unnecessary second geometry system.
- [ ] Capture the date, URLs, exact versions, changes from this inventory and the rationale for every dependency.
- [ ] If architectural IFC or Radiance simulation is proposed, make a **new** decision gate rather than silently expanding pilot 1.

**Research classification:** project capabilities above are **documented by their maintainers or published authors**; **installation, compatibility, security, and scientific accuracy in our environment remain unvalidated** until the lab executes the tests.
