# Living Window — R&D v0.2 (digital-only)
Separate invention concept alongside Leaf to Light; this does not change the approved status of the OCTO pipeline pilot or the released OCTO runtime. Original development brief is retained verbatim as a historical record. Its physical-test and manufacturing steps are hypothetical only: the owner has subsequently specified digital research, design, simulation and visualization only. No fabrication, purchasing, installation, deployment or claim of engineering certification.

## Repository contents
- ENGINEERING_BRIEF.md — original research, dimensions, first-order estimates and limitations.
- build_model.py — original CAD/mesh generator (59 components).
- geometry.json — original nominal geometry in mm, Z-up.
- preview.py — original concept board renderer.

All four Git blob hashes matched the original local files before committing. The original ZIP also contains three generated artifacts (STEP, GLB, PNG) not transferred in this commit because the chat connector has no direct local-file upload bridge. The original v0.1 proposal DOCX and v0.2 ZIP likewise remain outside the repository for now. Preserve their original bytes when importing; do not describe regeneration as byte-identical unless hashes match.

## Reproduce in a local isolated Python environment
Dependencies: cadquery, numpy, trimesh, matplotlib. Original package did not pin versions. After reviewing dependencies, run `python build_model.py` followed by `python preview.py` from this directory. Generation writes living_window.step, living_window.glb, geometry.json and concept_board.png. The model includes schematic solid envelopes, not construction CAD. Original build reported GLB count and width/height checks; this repository handoff does not rerun engineering tests. Review output geometry and compare hashes; timestamps and dependency differences can change exports.

## Next digital deliverables
1. Final modern industrial-design hero and consistent multi-view board.
2. CAD-derived dimensioned orthographic visual blueprint, with all callouts verified against geometry.json.
3. Section/cutaway and exploded views, labeled schematic airflow and modular serviceability.
4. Interactive Three.js visualization; preserve CAD as geometry authority. Optional bounded digital airflow/solar studies with explicit assumptions, baseline and limitations.

No physical prototype is planned. Generated concept renders are illustrative, not dimensional or simulation evidence.

## Original SHA-256 inventory
```
b0e61d18c0483dd785fde9a1cba12594cf52f8ad47f8245a8cd182c686742227  ENGINEERING_BRIEF.md
cfe08373177c6c915935747a335baac1335254e929ea3c48718202f2fcf3b1a2  build_model.py
627e768fbeac261dd4529d2d16e4341e832d7c01e58ea81fc19c4896f6c85a5d  concept_board.png
67a13cbca7ea0b27bcdf4ebd34f655977a1b4779b93a4a54e23b824b1014401e  geometry.json
f42feddec81052f6deb412405a31e37e0698c5c73f61e660a7c038a8fa26ea8f  living_window.glb
62d126fed96c7b1f5aebd5b298edf69499ee78cc274ecdc9c53700148f0b45dc  living_window.step
cc8fda592baf8d57127cbe65dd9cb1784f4a0878316a881f58edb2987d5158f4  preview.py
090768a48a739f2c09526a4d1386421c25d65b3702b01a1e2e84e66453771064  living_window_v02_package.zip
d177fcee91169dabd7c88c9384ae85558d03eb923932a6c69e3c6fc8f6f77e52  invention_001_living_window_pr.docx
```
