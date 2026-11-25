# This file is intentionally run by `agentcad run --runtime cadquery`.
# `cq` and `show_object` are injected by agentcad's CadQuery preamble.
model = cq.Workplane("XY").box(100.0, 60.0, 20.0, centered=(True, True, False))
show_object(model, name="Session 0 calibration box")
