# Invention Lab — session closeout and next-agent handoff

**Snapshot: early morning November 25, 2026, Pacific time.** This closes the Nov 24–25 working session, not the project. Next work is subject to the outstanding review/authorization gates. [Draft PR #20](https://github.com/heyitschien/threejs-experiment-animations/pull/20) remains open; reviewed evidence head `faa4cf5b859725893164718512b8ad5e64809214`. The GitHub branch may advance with documentation; always verify current HEAD.

## November 27 update — integrated hinge baseline and operational readiness

The owner approved the HNG-001 correction. [PR #23](https://github.com/heyitschien/threejs-experiment-animations/pull/23) is merged into `docs/invention-lab-proposal` at `8be36661a87acc526b3c037f983df54b235883bc`; PR #20 remains draft. [Exact-head validation report](https://github.com/heyitschien/threejs-experiment-animations/pull/23#issuecomment-7230975825) records a fresh clean pinned-Mac run and verify: edited mesh 956 triangles, zero measured correspondence error, 6/6 negative controls, 23 hashed artifacts, HNG browser QA, 20/20 unit tests and build. Antigravity also reported 3/3 focused tests via the working remote dispatcher. These are bounded digital engineering results, not independent coordinator execution or physical validation. Nine legacy OCTO golden-image differences remain disclosed; no changes to OCTO scene or QA code. Preserve historical evidence.

**For actual engineering runs:** use the existing approved machine-local lab environment and pinned tools. Fresh remote worktrees lack ignored dependencies; reuse the approved dependency tree only after lockfile verification. See the canonical runbooks; do not expose local configuration values or host-specific paths in public artifacts. If access is blocked, report the missing capability rather than add infrastructure or silently change versions. The local candidate startup wrapper is not yet verified in the integrated branch and is not a prerequisite for productive work.

**Next direction:** a small four-bar/parallel linkage experiment connects the single hinge to coupled Living Window slats, using the existing direct CadQuery/Blender/Three.js stack. Keep the optional AgentCAD trial deferred unless a real need justifies it; no new tool adoption or architecture prerequisite. Define the geometry and kinematic test expectations with the actual invention assignment. Phase E/F, physical manufacture, and broader PR #20 promotion remain separate decisions. The historical snapshot below is retained; this update supersedes its completed hinge follow-up.

## What we accomplished

| Milestone | Immutable evidence | Outcome and limits |
| --- | --- | --- |
| OCTO | [Final validation](FINAL-VALIDATION.md) | Existing completed non-production case study; preserve release and goldens. |
| Founding principles and invention method | [Manifesto](INVENTION-LAB-MANIFESTO.md), [Art of Curiosity](INVENTION-LAB-ART-OF-CURIOSITY.md) | Curiosity-led digital invention, nature-inspired research, reusable learning; no requirement to fabricate or commercialize. |
| Living Window / 001 | [Source and inventory](../reference/invention-lab/living-window/v0.2/README.md), [#19](https://github.com/heyitschien/threejs-experiment-animations/issues/19) | A–D generated, preliminary 59-component geometry; some original binary assets still outside Git. E/F not started. |
| Session 0 | [e59fc23](https://github.com/heyitschien/threejs-experiment-animations/tree/e59fc23f6ca14f96225037bb828c43f247efc478/experiments/invention-lab/session-0) | Two simple parametric solids; measured CAD → STEP/STL → Blender → GLB → browser handoff. |
| Session 0.1 | [686acc0](https://github.com/heyitschien/threejs-experiment-animations/tree/686acc0c34dbb0128de36d5b7a89dd8dabc42bc3/experiments/invention-lab/session-0.1/evidence) | Pinned environment, per-run manifests, orientation/geometry checks, 11 negative tests, fresh Codex session reproduced on same Mac. Not yet independently run by a different agent product. |
| Session 0.2 | [742545f research](https://github.com/heyitschien/threejs-experiment-animations/blob/742545fe46eb5b7bad040ae5b8a0f6cff1e45021/docs/INVENTION-LAB-SESSION-0.2-RESEARCH.md) | Pinned upstream source study; adopted conventions and validation methods, no new runtime execution. |
| Decision framework | [Adoption & validation protocol](INVENTION-LAB-TECHNOLOGY-ADOPTION.md), [ADR-001](INVENTION-LAB-ADR-001-OPEN-SOURCE-INTEGRATION.md) | Retain direct CadQuery; adapt Text-to-CAD conventions, learn assembly patterns and CADGenBench validation; optional isolated AgentCAD comparison pending; reconsider based on evidence. |
| Session 0.3A | [faa4cf5 evidence](https://github.com/heyitschien/threejs-experiment-animations/tree/faa4cf5b859725893164718512b8ad5e64809214/experiments/invention-lab/hng-001/evidence), [runbook](INVENTION-LAB-HNG-001-RUNBOOK.md) | HNG-001 two named components, signed joint, 0/45/90° poses, 19 sampled CAD interference checks with zero overlap, 0.20 mm radial / 0.50 mm shoulder gaps, measured interference controls, isolated edit and interactive browser. Two same-host runs passed; $0 extra spend reported. Review gate remains open. |

Session 0.3A fixture freeze `7a732fe`, implementation `71d5110`, evidence `faa4cf5`. Maximum GLB bounds/witness error reported 0.00077510 mm against 0.50 mm integration limit. Both manifests contain matching hashes for three GLBs, three STLs and four screenshots. STEP timestamp-only differences are agent-reported. OCTO 17/17 tests and build passed per receipt. Coordinator reviewed source and committed receipts, not a local rerun. Comparison from 686acc0 to faa4cf5 shows no changes to src/, tests/, qa/, package-lock.json, or Session 0/0.1 evidence trees.

**Important distinction:** animated motion is a visualization; the CAD checks cover sampled poses only. Physical fit, insertion, retention, loads, continuous collision, manufacturing safety and environmental performance are unvalidated. Do not present integration thresholds as manufacturing tolerances.

## Where to start as a new agent

1. Read [AGENTS.md](../AGENTS.md), this handoff, [adoption protocol](INVENTION-LAB-TECHNOLOGY-ADOPTION.md), [ADR-001](INVENTION-LAB-ADR-001-OPEN-SOURCE-INTEGRATION.md), [#19](https://github.com/heyitschien/threejs-experiment-animations/issues/19) and [#22](https://github.com/heyitschien/threejs-experiment-animations/issues/22). Confirm authorized scope; no reliance on past chat.
2. Verify the actual remote branch and HEAD, local dirty state and existing worktrees. Do not reset, stash, delete or overwrite existing work. Preserve immutable evidence commits and use a separate worktree. Report exact clean base/candidate SHAs.
3. Use [Session 0.1 agent runbook](INVENTION-LAB-AGENT-RUNBOOK.md) for bootstrap, doctor, run, verify and negative controls. Use [HNG-001 runbook](INVENTION-LAB-HNG-001-RUNBOOK.md) for assembly reproduction. Only tested host is macOS arm64; use pinned versions, hash-locked Python wheels, npm lock and verified read-only Blender 4.4.0 copy. Do not use installed app with broken seal or bypass security. Never overwrite prior run outputs.
4. Review generated manifests, IDs, exact geometry, signed frames, expected failure cases and browser QA, plus `npm run check`. Report versioned evidence, timings, discrepancies, blockers and actual agent product. Fresh conversation does not equal different agent product. No secrets or raw host paths in Git.

## Next session — priority and gates

- [ ] Owner review of Session 0.1 and HNG-001; retain as bounded calibration baselines. No merge implied.
- [x] HNG-001 validation gap closed in PR #23 (see November 27 update). Historical task: In `verify.mjs`, `compareSurface(edited, edited, ...)` is self-comparison, not independent edit-mesh verification. Compare against independently derived expected edited geometry, add a deliberately wrong edited mesh negative, verify offset/shoulder and edited geometry receipts against frozen oracles. Preserve prior evidence and spec; no weakening thresholds. Request bounded approval before code execution.
- [ ] Assign a different agent product (e.g. Cursor, Claude Code, OpenCode) in a fresh conversation and isolated worktree to reproduce Session 0.1 and, after correction, HNG-001 from the runbooks. Record setup friction, source SHAs, tool versions, manifests and failures. Same host first; OS portability separate. No new runtime install beyond previously authorized locked setup without approval.
- [ ] Session 0.3B proposed only: prepare AgentCAD isolated STEP-in/JSON-out inspection trial. Same HNG-001 reference and negative/edit pairs. Confirm exact candidate wheel closure, notices, resource cap, read-only inputs, process-tree egress denial and no credentials/telemetry. Compare actionable incremental value to baseline; obtain separate owner approval before dependency intake/execution. Do not duplicate inspectors.
- [ ] Before substantial custom assembly/drawing work, compare Text-to-CAD on the same fixture; isolated OCP 8 lane, no global installer, verify network/update policies. Measure effort and correctness, not just feature lists. Follow ADR-001 for reconsideration.
- [ ] Recover/verify original Living Window assets, then approve exact Phase E assembly scope and Phase F study separately. Leaf to Light remains a proposed study; no simultaneous implementation. Physical fabrication is excluded.

## Preservation and housekeeping

Canonical tracking: #19 environment, cross-agent reproduction and invention A–F; #22 research, HNG-001 and candidate review gates; #21 standing project instructions maintenance (keep open). Draft PR #20 contains implementation and decisions. The original planning documents are historical; this handoff is the dated current status, not an authorization to execute new work.

- Original Living Window CAD source and geometry are in Git; original A–D/STEP/GLB packages remain a pending import. Use #19 inventory hashes and review rights/size before sharing binaries.
- HNG-001 full archive is reported saved locally by Codex as `HNG-001-session-0.3A-verified.zip`, SHA-256 `d1afc4efb6ba913d4c60ae57b765b99f4f93d65d273eeccb340331004a64d389`. GitHub has source, manifests, receipts and screenshots; full STEP/STL/GLB archive bytes not independently available to coordinator. Retain local archive, verify hash, and back up to owner-approved storage; do not commit unknown large binaries or private paths. Same principle for Session 0.1 archive. No local files have been moved or deleted.
- Local viewer URLs are convenience links, not persistent deployments. Recreate with runbook if stopped. Local process shutdown and disk cleanup require local operator inspection; no destructive cleanup performed.
- Public repo: engineering records only; preserve personal strategy privately. No purchases, deployment, merges, fabrication, global configuration or replacement Blender app authorized.

## Lesson preserved

From imagination to dimensions, from single objects to relationships and movement, and from visually convincing output to evidence-backed experiments. Reuse upstream technology where it demonstrably helps; keep the common lab independent of any individual agent. The inventions become our curriculum; the pipeline becomes our laboratory; curiosity becomes our teacher.
