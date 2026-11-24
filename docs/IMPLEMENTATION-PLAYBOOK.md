# Implementation and release playbook

[Case study](AGENT-OPERATED-3D-CASE-STUDY.md) · [Evidence index](EVIDENCE-INDEX.md)

## Repeatable workflow

1. Pin the approved brief, parent SHA, asset acceptance criteria and review owner. Use an isolated worktree and keep the shipped visual baseline separate from candidate comparisons.
2. Verify Blender's official arm64 checksum and app signature against the recorded [Stage 7 setup](STAGE-7-BLENDER-PILOT.md). Run from a clean worktree with `npm ci` and install the lockfile's Playwright Chromium via `npm run qa:install`. Blender supplies its own Python.
3. Run the exact [Study A commands](STUDY-A-ASSET-INTEGRATION.md#reproduce). Compare the export byte for byte, then build and browse the regenerated file. If the hash differs, inspect tool/build identity and export settings before accepting a new binary.
4. Check the default, opt-in and invalid-asset paths. A WebGL failure should show the fallback message. Compare stills at matched size, DPR, camera and pose. Save candidate results outside the legacy golden path. A browser compositor delta can occur independently of geometry; retain the failure record and rerun unchanged before interpreting it.
5. Benchmark A and B serially with the headed browser foregrounded. Record host class, renderer, profile and raw frame intervals. A visual review should also open the original concept and see the actual arm under motion. Keep evidence scoped, strip private metadata and publish only approved technical artifacts.
6. Hand off a draft with exact SHAs, commands, receipts, limitations and the fallback. Visual acceptance and any integration action remain explicit decisions.

## Stack and integration sequence

Initial audit found seven open drafts, each with the exact parent shown in the [audit table](EVIDENCE-INDEX.md#stack-audit). The only dependency addition from v0.1 through the audited stack is Playwright 1.65.1 and its lockfile entries for local QA. Study A and the completion package leave package manifests unchanged. Study B stays on its evidence ref.

After approval, refresh every ref and stop if a reviewed tip moved. In a scratch integration worktree, use `git merge-base --is-ancestor` for each parent/tip and rehearse the reviewed linear stack from current `main`. If main diverged, prepare a fresh integration branch and request review of any conflict-resolution diff. Avoid force-pushing a reviewed branch.

| Order | After sign-off | Required gate |
| --- | --- | --- |
| 1 | Merge #2 into main. Keep its head branch. | Approve foundation and scope. |
| 2 | Retarget #4 to main, confirm its diff is confined to Stage 2, and merge it. | Review the lockfile change and run clean install, build, browser and v0.1 goldens using the pinned Chromium. Record any environment-only strict pixel mismatch. |
| 3 | Repeat retarget, diff review and merge for #6, #8, #10 and #12, in that order. | Review each stage's visuals and test suite. Use matched candidates for expected scene changes. Preserve all nine v0.1 golden blobs and the source concept. |
| 4 | Retarget #15 to main and merge after independent sign-off. | Rerun regenerated GLB, default/opt-in/fallback and deformation tests, both candidate lanes, and A/B timings. Keep the Blender option off by default. |
| 5 | Retarget the case-study draft to main and merge after documentation sign-off. | Confirm its diff is documentation-only and all pinned public artifacts open without local credentials. |

Use merge commits to retain ancestry if repository policy permits them. Before each retarget, verify the previous head is reachable from main and confirm the retargeted diff matches the audited stage. Keep child and evidence branches through the last review. If merge policy requires squash or rebase, rehearse on a new branch and re-review the resulting diffs and SHAs before proceeding.

## Release and rollback

- Record the exact integrated SHA, approved UI behavior, verified evidence links, clean build and candidate browser results. Document current npm audit results and leave any dependency remediation to separately reviewed work.
- Keep v0.1 labeled as the historical baseline. Expected v0.1 pixel differences arise after scene changes. Publish fresh release baselines only by separate visual approval. Label the Blender variant experimental and the material study static.
- For an immediate session fallback, remove `?tentacle=blender`. For a source rollback after integration, revert the offending merge using its mainline parent on a reviewed branch. If later stages depend on that merge, revert those stages in reverse order and rerun the full gate. Keep the previous known-good main SHA and reference/evidence commits available.
- Record independent review, integration authorization and the intended release label before any merge. Deployment, tagging and issue closure require their own approval.
