# OCTO Studio

- Follow the scope of the approved issue. Stage 2 covers local evidence and QA infrastructure. Scene geometry, materials, external assets, alternate renderers, deployments and paid services require separate authorization.
- Start with `npm run check` and the browser commands in [Stage 2 validation](docs/STAGE-2-VALIDATION.md). Preserve the designated browser lane and the golden manifest.
- Record exact base and candidate SHAs, screenshot pairs, timings, and independent review in the [iteration ledger](docs/ITERATION-LEDGER.md). Review a semantic reference comparison separately from pixel stability.
- Keep raw, private, and host-specific evidence out of Git. Use an isolated branch and draft PR for review. Regenerate goldens only with deliberate approval of the changed pixels.

## Invention Lab

- Start with the [current dated handoff](docs/INVENTION-LAB-HANDOFF-2026-11-25.md) and [open-source integration ADR](docs/INVENTION-LAB-ADR-001-OPEN-SOURCE-INTEGRATION.md). Verify current branch, HEAD and scope in Issues #19 and #22; do not rely on chat memory. The handoff is a status record, not new execution authorization.

- Before proposing or adding any new technology, follow the [technology adoption and validation protocol](docs/INVENTION-LAB-TECHNOLOGY-ADOPTION.md). Research first; compare against the baseline; do not install or execute new third-party tools without owner approval. Current research assignment: [#22](https://github.com/heyitschien/threejs-experiment-animations/issues/22).

- Read [Issue #19](https://github.com/heyitschien/threejs-experiment-animations/issues/19) and the [canonical agent runbook](docs/INVENTION-LAB-AGENT-RUNBOOK.md) before running the engineering pipeline.
- Use the runbook commands and a fresh output directory for each calibration. Treat CAD and STEP as authoritative and keep the original Session 0 evidence intact.
- Stop at the relevant review gate defined by Issues #19 and #22. The calibration harness has its own viewer and evidence; preserve the OCTO app and goldens.
