# Agent-operated 3D implementation case study

OCTO began as a procedural Three.js octopus. The engineering question was whether an agent could work across a professional authoring tool and a live browser, then leave a result somebody else could reproduce and review. The evaluation ended with two bounded experiments.

| Study | What was delivered | Decision |
| --- | --- | --- |
| [A · Asset integration](STUDY-A-ASSET-INTEGRATION.md) | A reproducible Blender GLB for one foreground arm, animated in Three.js and isolated behind a URL flag. | Keep it optional. The close-up benefit is real in the published renders, while phone-scale detail is limited. |
| [B · Material evaluation](STUDY-B-MATERIAL-EVALUATION.md) | A static metal-and-translucent section, matched material renders, browser inspection and editable source. | Keep it as evidence of material design and export. |

The chain starts with an approved brief and ends at independent review. Blender produces the asset, Three.js gives it a runtime, Playwright checks behavior and captures views, and GitHub gives reviewers immutable evidence. [Architecture](ARCHITECTURE.md) · [Evidence and short demo](EVIDENCE-INDEX.md) · [Implementation and release playbook](IMPLEMENTATION-PLAYBOOK.md)

## What the evidence supports

| Status | Meaning and outcome |
| --- | --- |
| **PROVEN** | Directly exercised or inspectable here. A clean worktree reproduced the pinned Study A GLB byte for byte. Browser tests checked actual mesh deformation, socket attachment, UI, and malformed-file fallback. Study B's published stills show a same-view material comparison. |
| **REPORTED** | Prior observations with traceable records. The original Stage 7 report documents installation checks, local load timing, and a benchmark with blank-page controls. Study B's original browser run reported successful drag and material-toggle checks. |
| **INFERRED** | An interpretation of the artifacts. The layered Study B shell offers a more convincing sense of depth. Reusable geometry and fixed cameras make further visual comparisons easier to interpret. |
| **NOT YET VALIDATED** | Independent rerun and final visual approval, physical mobile performance, GPU headroom, sustained production behavior, and animation of the translucent Study B design. |

## Implementation lessons

- **Connect tools at stable boundaries.** Blender's bundled Python and GLB export made modeling scriptable and reproducible. The browser used the same checked-in bytes. Playwright checked the actual handoff rather than inferring it from a successful export.
- **Write criteria that test the result.** The first animation check only confirmed that playback time advanced. Independent review prompted a test of vertex positions, normals and socket placement. The same review caught misleading UI copy on the hybrid path.
- **Use separate visual and functional checks.** Fixed cameras and poses make comparison possible. A reviewer still decides whether seams, materials and motion look convincing. A strict historical golden and a candidate capture serve different review needs.
- **Keep a recoverable default.** A failed optional import leaves the procedural arm and its copy in place. Keep the authoring tool outside the browser dependency chain and keep large review media on evidence refs.
- **Measure the tradeoff you actually tested.** The optional arm adds geometry, draw calls, asset transfer and runtime deformation work. Reproduction and local QA were automated using an existing verified Blender installation. There is no measurement of human hours, labor savings, setup cost, unattended reliability, customer adoption or production readiness.

The technical evaluation is ready for independent review. Integration, release and issue closure remain approval gates.
