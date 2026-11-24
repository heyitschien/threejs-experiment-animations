# Architecture

[Case study](AGENT-OPERATED-3D-CASE-STUDY.md) · [Playbook](IMPLEMENTATION-PLAYBOOK.md)

```mermaid
flowchart LR
    C["Codex · scripts and QA"] --> P["Blender · headless Python"]
    P --> G["glTF binary · GLB"]
    G --> T["Three.js · optional asset loader"]
    T --> Q["Playwright · geometry, UI and render evidence"]
    Q --> H["GitHub · draft PR and pinned evidence"]
    H --> R["Human · independent review and approval"]
    T --> F["Procedural arm · default and load fallback"]
    P --> S["Cycles · static material evidence"]
    S --> H
```

Study A binds one local GLB mesh assembly to the existing arm centerline. Three.js updates vertex positions and normals on the CPU. The other seven arms remain procedural. Both modes use the same interaction controls, and the default loads eight procedural arms. The development-only QA hook reads the live mesh at fixed poses.

Study B exports a separate static GLB and renders the editable Blender scene with Cycles. Three.js loads that separate model for material inspection. Neither Study B asset is a dependency of OCTO.

Git commits pin source and artifact provenance. Performance evidence describes the tested workstation and emulated viewport. Reviewers decide whether the visible result and the tested constraints justify integration.
