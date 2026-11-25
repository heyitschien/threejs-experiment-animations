"""Session 0.1 source solid, STEP round trip, and tessellated STL."""

import json
import math
from pathlib import Path
import sys

import cadquery as cq
from OCP import __version__ as ocp_version

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / "session-0"))
from model import bounds, max_error, sha256


def inspect(shape, size, pocket, volume):
    box = bounds(shape)
    if (
        not shape.isValid() or len(shape.Solids()) != 1
        or not math.isclose(shape.Volume(), volume, abs_tol=1e-6)
        or max_error(box["dimensions_mm"], size) > 1e-5
        or not any(max_error(list(v.toTuple()), pocket) < 1e-5 for v in shape.Vertices())
    ):
        raise ValueError("Invalid solid, volume, dimensions, or signed pocket landmark")
    return {"valid": True, "solids": 1, "bounds_mm": [box["min_mm"], box["max_mm"]],
            "volume_mm3": shape.Volume(), "pocket_corner_mm": pocket}


def main():
    out = Path(sys.argv[1])
    spec_file = out / "spec.json"
    spec = json.loads(spec_file.read_text())
    models = []
    for model in spec["models"]:
        name, size = model["id"], model["size"]
        pocket, pocket_size = model["pocket_min"], model["pocket_size"]
        body = cq.Workplane("XY").box(*size, centered=(True, True, False))
        cutter = cq.Solid.makeBox(*pocket_size, cq.Vector(*pocket))
        part = body.cut(cutter).val()
        volume = math.prod(size) - math.prod(pocket_size)
        cad = inspect(part, size, pocket, volume)
        step, stl = out / f"{name}.step", out / f"{name}.stl"
        cq.exporters.export(part, str(step), exportType="STEP")
        step_check = inspect(cq.importers.importStep(str(step)).val(), size, pocket, volume)
        cq.exporters.export(part, str(stl), exportType="STL",
                            tolerance=spec["linear_tolerance_mm"],
                            angularTolerance=spec["angular_tolerance_rad"])
        models.append({"id": name, "cad": cad, "step": step_check,
                       "step_sha256": sha256(step), "stl_sha256": sha256(stl)})
    report = {"schema": 1, "passed": True, "run_id": sys.argv[2], "units": "mm",
              "spec_sha256": sha256(spec_file), "python": sys.version.split()[0],
              "cadquery": cq.__version__, "ocp": ocp_version, "models": models}
    (out / "cad.json").write_text(json.dumps(report, indent=2, allow_nan=False) + "\n")


if __name__ == "__main__":
    main()
