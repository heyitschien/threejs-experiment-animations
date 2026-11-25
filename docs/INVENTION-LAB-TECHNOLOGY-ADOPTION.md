# Invention Lab — technology adoption and validation protocol v1.0

**Start here before adding a tool or engineering capability.** Established 2026-11-25. Reuse first; experiment in isolation; promote only with evidence. This protocol applies to any capable agent, not just Codex. It may inform other labs without sharing sensitive data or coupling their runtimes.

[Manifesto](INVENTION-LAB-MANIFESTO.md) · [Tool landscape](INVENTION-LAB-TOOL-LANDSCAPE.md) · [Agent runbook](INVENTION-LAB-AGENT-RUNBOOK.md) · [Engineering tracker #19](https://github.com/heyitschien/threejs-experiment-animations/issues/19)

## 1. Technology adoption pipeline

| Stage | Required output / gate |
| --- | --- |
| Discover | Define actual capability gap; search upstream docs, repositories, research and existing internal work. Include the no-change baseline. |
| Investigate | Pin upstream SHA/release, inspect relevant source, licenses (including dependencies/data/assets), compatibility, maintenance, security, privacy, network/telemetry, installation footprint and exit strategy. Separate documented claims from test results. |
| Plan | Write a bounded hypothesis, fixture, expected outputs, acceptance thresholds, comparison method, time/cost ceiling, isolation and rollback. Obtain owner approval before installing or executing new third-party code. |
| Experiment | Use disposable worktree and separate pinned dependencies; least privilege, no secrets, no unapproved network/services, no shared agent settings changes. Capture failures and resource costs. |
| Compare | Run the same requirements against existing baseline and candidate. Test correctness, repeatability, failure handling, usability and actual integration friction. |
| Decide | Adopt intact, adapt a licensed component, learn from the method, defer, or reject. Explain the evidence and tradeoffs; unknowns do not score as passes. |
| Integrate | Only after approval: define versioned input/output interface, ownership, unit/coordinate and provenance contract, error semantics, environment/configuration, tests and rollback. Prefer CLI/file contracts over a new orchestration layer. Keep alternate CAD dialects isolated; never silently replace canonical source. |
| Preserve | Document decision, pinned sources, commands, versions, receipts, known limitations, maintenance owner and upgrade procedure. Update runbook and AGENTS.md only when behavior is accepted. |

## 2. Engineering validation pipeline

Define measurable requirements and scope → freeze baseline and fixtures → declare thresholds before execution → inspect source and dependencies → run controlled experiments → check geometry, units, signed orientation, assembly identity, interfaces and failure propagation → compare evidence → reproduce independently → review → approve or revise.

- Hard gates: lawful licensing/attribution, security/privacy, explicit authorization, validated artifact provenance, correctness on the agreed fixture, failure closed and reproducibility. Unknown gate = pending; do not promote.
- Suggested scorecard (only after gates): accuracy 25%; reproducibility 20%; interoperability 20%; agent independence 15%; maintainability 10%; resource efficiency 10%. Score 0–5 with concrete evidence; record unknowns separately. No automatic promotion based on score.
- Compare like-for-like specifications, fixtures, versions, operator effort, wall-clock time and compute/API cost where actually measured. Use identical output requirements; distinguish agent/model ability from tool capability.
- Use immutable run IDs, clean HEAD, locked dependencies, per-run outputs, exact artifact hashes and atomic success manifest. Validate upstream statuses, schema and actual files; include missing/stale/corrupt/incorrect orientation and failed-process cases.
- CAD/source defines geometry; meshes and images are derivatives. Dimensions and mesh fidelity do not establish real-world performance. For Phase F choose domain-specific solver, explicit material/boundary conditions, analytical reference or published benchmark, convergence/sensitivity and baseline comparison before claiming numerical behavior.
- Review with fresh context and preferably another agent product. Session 0.1 demonstrates same-host same-product fresh-session reproduction, not universal portability. Other OSes, complex assemblies and physics remain untested.
- Store evidence and failures; no fake pass, no silent threshold changes, no changing goldens without approval. Stop for human review before adoption or scope expansion.

## 3. Roles and handoff

Owner: research director, approves scope, dependencies, costs, risk and promotion.
Research coordinator: upstream reconnaissance, comparison design, decisions, independent review and documentation.
Local coding agent: source-level compatibility/security review, reproducible local experiments, receipts and proposed integration.
Independent reviewer: repeat and challenge conclusions without prior session assumptions.

Any agent can fill a role. Use GitHub issues, canonical runbook and evidence rather than conversational memory. Keep private machine paths and raw logs local. No merge/deploy/fabrication/purchases without authorization.

## 4. Current research register — 2026-11-25

Baseline: Session 0.1 at `686acc0c34dbb0128de36d5b7a89dd8dabc42bc3`, direct CadQuery → STEP/STL → verified Blender → GLB → Three.js, fresh-session same-Mac reproduction, signed landmarks and negative tests. See [evidence](../experiments/invention-lab/session-0.1/evidence) and [runbook](INVENTION-LAB-AGENT-RUNBOOK.md). Owner review still open. Existing installed Blender seal issue remains; verified separate copy used. Do not replace existing application without approval.

| Candidate / primary sources | Opportunity and concerns | Current decision |
| --- | --- | --- |
| [earthtojake/text-to-cad](https://github.com/earthtojake/text-to-cad), [model contract](https://github.com/earthtojake/text-to-cad/blob/main/skills/cad/references/model-contract.md), [engine](https://github.com/earthtojake/text-to-cad/blob/main/packages/cad/README.md), [install](https://github.com/earthtojake/text-to-cad/blob/main/docs/install.md) | MIT per repo; build123d-based model trees, joints, drawings, CLI/MCP, reusable skills. Installer discovers agent apps, enables updates; telemetry documented with opt-outs. Avoid global installer; examine pinned isolated local route, telemetry/update suppression and transitive licenses. | P1 investigate; prefer reusable skills/contract; no migration decision. |
| [jdilla1277/agentcad](https://github.com/jdilla1277/agentcad), [releases](https://github.com/jdilla1277/agentcad/releases) | Session 0 tested 0.8.1 on one solid in separate environment. Upstream documents STEP inspection, named part IDs, geometry diffs and spatial feedback. Evaluate exact pinned version on existing STEP without changing canonical CAD engine; verify optional cloud/feedback defaults. | P2 investigate as optional inspection adapter. |
| [MountainClimberJiwen/text-to-cad-assembly](https://github.com/MountainClimberJiwen/text-to-cad-assembly) | Structured task JSON, face/coaxial placement constraints, stepwise review, Three.js viewer, URDF exports. Documented Python 3.11 setup; verify source, license and compatibility before reuse. Optional vision-model checks excluded. | P3 study assembly contract; no install or copied code yet. |
| [huggingface/cadgenbench](https://github.com/huggingface/cadgenbench), [metrics](https://github.com/huggingface/cadgenbench/blob/main/docs/metrics.md), [validity](https://github.com/huggingface/cadgenbench/blob/main/docs/metrics/cad_validity.md), [baseline agent](https://github.com/huggingface/cadgenbench/blob/main/src/cadgenbench/baseline/agent.py) | Validity gate followed by shape, interface and topology metrics against reference STEP; feedback/revision loops. Borrow method; review source/data licenses separately. Avoid paid baseline API and full dependency stack unless needed. | P4 use as validation research reference. |

These findings are upstream documentation/source-reference reconnaissance, not local candidate validation. Pin exact current upstream revisions during local investigation. Do not confuse similarly named projects. Existing FreeCAD/CADPilot, build123d, BIM and simulation candidates remain in tool landscape; defer until capability gap is demonstrated.

## 5. First proposed comparison — a two-part digital hinge

Why: the Living Window needs named components, reference axes, relative transforms, movement and clearance. A hinge is a smaller, reproducible test than a 59-component assembly.

Proposed fixture: two named leaves, common signed hinge axis, known local/world transforms, declared bore/pin clearance and 0/45/90-degree configurations. Freeze exact dimensions, reference STEP, expected contacts/interference and tolerances BEFORE testing. Compare direct CadQuery baseline and one candidate adapter with the same brief; do not introduce two authoritative CAD models into production.

Required outcomes: valid solids; exact component IDs; bounds within predeclared limits; signed axes and transforms; correct motion, clearance and known interference cases; derivative GLB fidelity; unchanged non-target part after an edit; stale/invalid artifact rejection; reproducible receipts. Record what remains unvalidated (e.g., physical joint behavior, loads, friction). Use same-host second-agent reproduction where available.

Session 0.2 is read-only source reconnaissance and benchmark planning. No new third-party execution, package installation, replacement Blender install, Phase E/F, or full implementation authorized by this document. Prepare next isolated experiment for owner approval.

## 6. Research receipt template

Candidate / upstream URL / exact SHA or release / date / capability gap / source paths / documented claims / license and dependencies / platform and version constraints / security & network behavior / proposed configuration / fixture and thresholds / baseline vs candidate measured results / failures / decision / rollback / reviewer / next action.

Keep all unknowns explicit. Every adopted tool earns its place through a measured need. Every rejected tool can still teach us something.
