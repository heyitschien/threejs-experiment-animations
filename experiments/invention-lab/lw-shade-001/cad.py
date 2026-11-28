"""Author and measure LW-SHADE-001 in the Session 0.1 CadQuery environment."""

import json
import math
from pathlib import Path
import sys

import cadquery as cq
from OCP.Bnd import Bnd_Box
from OCP.BRepBndLib import BRepBndLib
from OCP.IFSelect import IFSelect_RetDone
from OCP.STEPCAFControl import STEPCAFControl_Reader
from OCP.TCollection import TCollection_ExtendedString
from OCP.TDataStd import TDataStd_Name
from OCP.TDF import TDF_Label, TDF_LabelSequence
from OCP.TDocStd import TDocStd_Document
from OCP.XCAFDoc import XCAFDoc_DocumentTool

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "session-0"))
from model import sha256


def require(condition, message):
    if not condition:
        raise ValueError(message)


def near(value, expected, tolerance, label):
    require(math.isfinite(value) and abs(value - expected) <= tolerance,
            f"{label}: {value} differs from {expected} by more than {tolerance}")


def vectors(actual, expected, tolerance, label):
    for got, want in zip(actual, expected, strict=True):
        near(got, want, tolerance, label)


def solid_box(bounds):
    low, high = bounds
    return cq.Solid.makeBox(*(hi - lo for lo, hi in zip(low, high, strict=True)), cq.Vector(*low))


def cylinder(radius, length, origin, direction):
    return cq.Solid.makeCylinder(radius, length, cq.Vector(*origin), cq.Vector(*direction))


def make_part(pid):
    if pid == "ground":
        s = cq.Solid.makeBox(3, 45, 100, cq.Vector(152, -40, -10))
        for z in (0, 80):
            s = s.cut(cylinder(1.7, 3, (152, 0, z), (1, 0, 0))).clean()
        return s
    if pid.startswith("slat"):
        s = cq.Solid.makeBox(300, 60, 4, cq.Vector(-150, -30, -2))
        s = s.cut(cylinder(1.7, 300, (-150, 0, 0), (1, 0, 0))).clean()
        return s
    if pid.startswith("crank"):
        s = cq.Solid.makeBox(3, 20, 10, cq.Vector(156, 0, -5))
        for y in (0, 20):
            s = s.cut(cylinder(1.7, 3, (156, y, 0), (1, 0, 0))).clean()
        return s
    if pid == "coupler":
        s = cq.Solid.makeBox(3, 10, 80, cq.Vector(160, -5, 0))
        for z in (0, 80):
            s = s.cut(cylinder(1.7, 3, (160, 0, z), (1, 0, 0))).clean()
        return s
    raise ValueError(pid)


def transform_location(pid, angle):
    theta = math.radians(angle)
    c, sn = math.cos(theta), math.sin(theta)
    if pid == "ground":
        return cq.Location()
    if pid == "slat_lower":
        return cq.Location(cq.Vector(0, 0, 0), cq.Vector(1, 0, 0), -angle)
    if pid == "slat_upper":
        return cq.Location(cq.Vector(0, 0, 80), cq.Vector(1, 0, 0), -angle)
    if pid == "crank_lower":
        return cq.Location(cq.Vector(0, 0, 0), cq.Vector(1, 0, 0), -angle)
    if pid == "crank_upper":
        return cq.Location(cq.Vector(0, 0, 80), cq.Vector(1, 0, 0), -angle)
    if pid == "coupler":
        return cq.Location(cq.Vector(0, 20 * c, -20 * sn))
    raise ValueError(pid)


def place(pid, angle):
    return make_part(pid).located(transform_location(pid, angle))


def exact_bounds(shape):
    bound = Bnd_Box()
    BRepBndLib.AddOptimal_s(shape.wrapped, bound, False, False)
    values = list(bound.Get())
    return [values[:3], values[3:]]


def inspect_solid(shape, bounds, witness, volume, tol, name):
    require(shape.isValid() and len(shape.Solids()) == 1 and len(shape.Shells()) == 1
            and shape.Shells()[0].wrapped.Closed(), f"{name}: invalid or open single solid")
    box = exact_bounds(shape)
    for actual, expected in zip(box, bounds, strict=True):
        vectors(actual, expected, tol["cad_mm"], name + " bounds")
    actual = min((v.toTuple() for v in shape.Vertices()), key=lambda v: math.dist(v, witness))
    require(math.dist(actual, witness) <= tol["witness_mm"], f"{name}: signed witness {actual}")
    near(shape.Volume(), volume, max(tol["volume_mm3"], tol["step_volume_relative"] * volume),
         name + " volume")
    return {"valid": True, "solids": 1, "closed_shells": 1, "bounds_mm": box,
            "witness_mm": actual, "volume_mm3": shape.Volume()}


def export_part(out, name, shape, bounds, witness, volume, tol):
    step, stl = out / f"{name}.step", out / f"{name}.stl"
    source = inspect_solid(shape, bounds, witness, volume, tol, name)
    cq.exporters.export(shape, str(step), exportType="STEP")
    reread = cq.importers.importStep(str(step)).val()
    imported = inspect_solid(reread, bounds, witness, source["volume_mm3"], tol, name + " STEP")
    cq.exporters.export(shape, str(stl), exportType="STL", tolerance=tol["linear_mesh_mm"],
                        angularTolerance=tol["angular_mesh_rad"])
    return {"cad": source, "step": imported, "step_sha256": sha256(step), "stl_sha256": sha256(stl)}


def overlap(a, b):
    measured = a.intersect(b)
    return sum(solid.Volume() for solid in measured.Solids())


def main():
    out, run_id = Path(sys.argv[1]), sys.argv[2]
    fixture = out / "fixture.json"
    spec = json.loads(fixture.read_text())
    tol = spec["tolerances"]
    parts_spec = spec["parts"]
    moving_ids = spec["moving_ids"]
    ids = list(parts_spec.keys())

    parts = {}
    for pid in ids:
        p = parts_spec[pid]
        shape = make_part(pid)
        parts[pid] = export_part(out, p["id"], shape, p["bounds"], p["witness"], p["volume"], tol)

    # interference samples
    samples = []
    for i in range(0, 61, 5):
        placed = {pid: place(pid, i) for pid in ids}
        maxinter = 0.0
        for a in range(len(ids)):
            for b in range(a + 1, len(ids)):
                inter = overlap(placed[ids[a]], placed[ids[b]])
                if inter > maxinter:
                    maxinter = inter
        samples.append({"angle_deg": i, "max_intersection_mm3": maxinter})
        require(maxinter <= tol["volume_mm3"] * 10, f"interference at {i}: {maxinter}")

    # poses
    poses = {}
    for pose in spec["poses"]:
        angle = pose["angle_deg"]
        pid_pose = pose["id"]
        file = out / (pid_pose + ".step")
        group = cq.Assembly(name=spec["root"])
        for pid in ids:
            p = parts_spec[pid]
            group.add(make_part(pid), name=p["id"], loc=transform_location(pid, angle))
        group.export(str(file))
        poses[pid_pose] = {"angle_deg": angle, "step_sha256": sha256(file)}

    report = {"schema": 1, "run_id": run_id, "passed": True, "fixture_sha256": sha256(fixture),
              "units": spec["units"], "root": spec["root"], "joint": spec["joint"],
              "parts": parts, "poses": poses, "samples": samples}
    (out / "cad.json").write_text(json.dumps(report, indent=2, allow_nan=False) + "\n")


if __name__ == "__main__":
    main()
