# OCTO walkthrough transcript

Narration uses the macOS Samantha voice.

## OCTO · Agent-operated 3D

OCTO started as a procedural robotic octopus in Three J S. This case study tests a specific engineering workflow. Can a coding agent use professional authoring software, produce a reproducible asset, bring it into a browser, and leave enough evidence for someone else to evaluate it? The concept image is the visual reference.

## Study A · Asset integration

The first study kept the existing scene and replaced one foreground arm behind a URL option. Blender's bundled Python generated the geometry and exported a G L B. From a clean checkout, the regenerated file matched the original byte for byte. The deployed browser code would only need Three J S and the model file.

## Study A · Actual deformation

The browser moves the imported mesh along the original procedural path. Here the left arm is the original and the right is Blender authored. The revised browser test reads the actual positions and normals at three poses. It also checks that the root stays attached, that the readable label matches the active mode, and that a malformed file preserves the default.

## Study A · Tradeoffs

The Blender variant adds three draw calls and just over six thousand scene triangles in this test. The extra armor reads most clearly in close-up. Mobile emulation uses the same desktop hardware, so the frame timing does not tell us how a real phone would behave. Keeping the feature optional limits the impact of those unknowns.

## Study B · Controlled material comparison

The second study evaluates material design separately. A static section has fitted metal plates, recessed suckers, internal ribs, and light channels. Both Cycles renders show the same geometry under the same camera and lighting. Only the shell material changes. On the left, light and visible internals reveal depth. The opaque control on the right hides them.

## Study B · Browser evidence

The browser version also shows the layers, with a simpler reflection and transmission treatment. That demonstrates an inspectable three dimensional material sample. The Blender camera orbit moves around the static piece. There is no evidence yet that this transparent construction bends convincingly, or that it is practical in a full animated browser scene.

## Independent review

The draft case study links the original concept, Python scripts, exact commits, captures, and test reports. A reviewer can reproduce the integration and decide whether the visible results justify keeping the option. The repository stack remains in draft. Integration, release, and issue closure are separate approval decisions.
