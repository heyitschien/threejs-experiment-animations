# OCTO Studio

- Follow the scope of the approved issue. Stage 2 covers local evidence and QA infrastructure. Scene geometry, materials, external assets, alternate renderers, deployments and paid services require separate authorization.
- Start with `npm run check` and the browser commands in [Stage 2 validation](docs/STAGE-2-VALIDATION.md). Preserve the designated browser lane and the golden manifest.
- Record exact base and candidate SHAs, screenshot pairs, timings, and independent review in the [iteration ledger](docs/ITERATION-LEDGER.md). Review a semantic reference comparison separately from pixel stability.
- Keep raw, private, and host-specific evidence out of Git. Use an isolated branch and draft PR for review. Regenerate goldens only with deliberate approval of the changed pixels.
