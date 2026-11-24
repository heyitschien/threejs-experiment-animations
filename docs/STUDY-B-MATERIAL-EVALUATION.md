# Study B · Agent-operated material evaluation

[Case study](AGENT-OPERATED-3D-CASE-STUDY.md) · [Evidence](EVIDENCE-INDEX.md)

**Static material and design demonstration.** One curved tentacle section combines three fitted satin-nickel armor plates, 13 internal ribs, four light channels and five recessed suckers. Blender 5.2.4 LTS generated an editable scene and a 911,748-byte GLB with 41,602 triangles. The authoring script, scene, GLB and outputs are pinned at `f5a724a58d3ef95bf19ce0b7cfb99031f05b5866`. [Study B artifact tree](https://github.com/heyitschien/threejs-experiment-animations/tree/f5a724a58d3ef95bf19ce0b7cfb99031f05b5866)

## Controlled comparison

The same Cycles camera, geometry, lights and framing were used for the translucent and opaque stills. Only the outer shell material changes. The clay still offers a separate view of the underlying form. The four-second video moves the camera around the static sample under fixed lights. [Matched comparison](https://raw.githubusercontent.com/heyitschien/threejs-experiment-animations/f5a724a58d3ef95bf19ce0b7cfb99031f05b5866/material-ab.png) · [Orbit](https://raw.githubusercontent.com/heyitschien/threejs-experiment-animations/f5a724a58d3ef95bf19ce0b7cfb99031f05b5866/orbit.mp4)

| Classification | Finding |
| --- | --- |
| **PROVEN** | The published Cycles A/B visibly reveals ribs and light channels through the transmissive wall. The opaque control masks them. Published Three.js stills show visible interior structure in the live-rendered model. |
| **REPORTED** | The original browser run passed GLB loading, inspection views, opacity toggle and drag orbit. |
| **INFERRED** | The wall and recessed internals communicate depth. At some angles the metal plates read as one smooth casing and the suckers read as fittings. The browser stills show simpler reflections. The original report records that the Blender procedural metal microtexture was lost in export. |
| **NOT YET VALIDATED** | Bending or rigging, full-arm deformation, realistic browser refraction across devices, and runtime cost in the whole OCTO scene. The model has open demonstration ends. |

The Cycles versus WebGL comparison is qualitative. Their lighting and rendering differ. The translucent versus opaque comparison within Cycles is the controlled test. Study B remains separate evidence and adds no runtime dependency to OCTO.

Regenerate from a scratch copy of the evidence tree using Blender's bundled Python. The script writes the editable scene, GLB and stills alongside itself. Add `-- --orbit` to also render the individual orbit frames.

```sh
blender -b --factory-startup --python-exit-code 1 --python build.py
```
