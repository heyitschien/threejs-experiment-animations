"""Author and verify the LW-SHADE-001 six-component shade assembly."""

import hashlib
import json
import math
from pathlib import Path
import subprocess
import sys
import time

import cadquery as cq
import OCP
from OCP.IFSelect import IFSelect_RetDone
from OCP.STEPCAFControl import STEPCAFControl_Reader
from OCP.TCollection import TCollection_ExtendedString
from OCP.TDataStd import TDataStd_Name
from OCP.TDF import TDF_Label, TDF_LabelSequence
from OCP.TDocStd import TDocStd_Document
from OCP.XCAFDoc import XCAFDoc_DocumentTool


def require(condition, message):
    if not condition:
        raise ValueError(message)


def sha256(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def near(actual, expected, tolerance, label):
    require(math.isfinite(actual) and abs(actual - expected) <= tolerance,
            f"{label}: {actual} differs from {expected} by more than {tolerance}")


def cylinder_x(radius, x0, x1, y=0, z=0):
    return cq.Solid.makeCylinder(radius, x1 - x0, cq.Vector(x0, y, z), cq.Vector(1, 0, 0))


def box(x0, x1, y0, y1, z0, z1):
    return cq.Solid.makeBox(x1 - x0, y1 - y0, z1 - z0, cq.Vector(x0, y0, z0))


def capsule_y(x0, x1, y0, y1, z, radius):
    return box(x0, x1, y0, y1, z - radius, z + radius).fuse(
        cylinder_x(radius, x0, x1, y0, z), cylinder_x(radius, x0, x1, y1, z)).clean()


def capsule_z(x0, x1, y, z0, z1, radius):
    return box(x0, x1, y - radius, y + radius, z0, z1).fuse(
        cylinder_x(radius, x0, x1, y, z0), cylinder_x(radius, x0, x1, y, z1)).clean()


def fixture():
    support = box(151, 154, -8, 8, -8, 88)
    cutters = [cylinder_x(1.7, 150, 155, 0, z) for z in (0, 80)]
    return support.cut(*cutters).clean()


def rotor():
    slat = box(-150, 150, -30, 30, -2, 2)
    shaft = cylinder_x(1.5, 148, 158, 0, 0)
    crank = capsule_y(155, 158, 0, 20, 0, 5)
    joint_pin = cylinder_x(1.5, 157.5, 164, 20, 0)
    retainer = cylinder_x(2.5, 162.5, 164, 20, 0)
    return slat.fuse(shaft, crank, joint_pin, retainer).clean()


def coupler(length=80, bore_radius=1.7):
    plate = capsule_z(158.5, 161.5, 20, 0, length, 5)
    return plate.cut(*[cylinder_x(bore_radius, 158, 162, 20, z) for z in (0, length)]).clean()


def washer():
    return cylinder_x(3.5, 162, 162.5, 20, 0).cut(cylinder_x(1.6, 161.5, 163, 20, 0)).clean()


def bounds(shape):
    bb = shape.BoundingBox()
    return [[bb.xmin, bb.ymin, bb.zmin], [bb.xmax, bb.ymax, bb.zmax]]


def inspect(shape):
    require(shape.isValid() and len(shape.Solids()) == 1, "expected one valid solid")
    return {"valid": True, "solids": 1, "bounds_mm": bounds(shape), "volume_mm3": shape.Volume()}


def overlap(a, b):
    return sum(s.Volume() for s in a.intersect(b).Solids())


def location(role, axis_z, theta, pitch=80):
    if role in ("rotor", "washer"):
        return cq.Location(cq.Vector(0, 0, axis_z), cq.Vector(1, 0, 0), -theta)
    if role == "coupler":
        r = math.radians(theta)
        return cq.Location(cq.Vector(0, 20 * math.cos(r) - 20, -20 * math.sin(r)))
    return cq.Location()


def world_shape(shape, loc):
    return shape.located(loc)


def matrix_for(role, axis_z, theta):
    if role in ("rotor", "washer"):
        r = math.radians(-theta)
        c, s = math.cos(r), math.sin(r)
        return [[1, 0, 0, 0], [0, c, -s, 0], [0, s, c, axis_z], [0, 0, 0, 1]]
    if role == "coupler":
        r = math.radians(theta)
        return [[1, 0, 0, 0], [0, 1, 0, 20 * math.cos(r) - 20],
                [0, 0, 1, -20 * math.sin(r)], [0, 0, 0, 1]]
    return [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]]


def label_name(label):
    value = TDataStd_Name()
    require(label.FindAttribute(TDataStd_Name.GetID_s(), value), "STEP node has no name")
    return value.Get().ToExtString()


def labels(sequence):
    return [sequence.Value(i) for i in range(1, sequence.Length() + 1)]


def inspect_assembly(path, root_name, expected):
    doc = TDocStd_Document(TCollection_ExtendedString("LW-SHADE-001"))
    reader = STEPCAFControl_Reader()
    reader.SetNameMode(True)
    require(reader.ReadFile(str(path)) == IFSelect_RetDone and reader.Transfer(doc), "STEPCAF read failed")
    tool = XCAFDoc_DocumentTool.ShapeTool_s(doc.Main())
    roots = TDF_LabelSequence()
    tool.GetFreeShapes(roots)
    top, = labels(roots)
    require(label_name(top) == root_name and tool.IsAssembly_s(top), "wrong STEP assembly root")
    children = TDF_LabelSequence()
    tool.GetComponents_s(top, children, False)
    found = {}
    for child in labels(children):
        definition = TDF_Label()
        require(tool.GetReferredShape_s(child, definition), "STEP occurrence has no definition")
        name = label_name(definition)
        trsf = tool.GetLocation_s(child).Transformation()
        matrix = [[trsf.Value(i, j) for j in range(1, 5)] for i in range(1, 4)] + [[0, 0, 0, 1]]
        found[name] = matrix
    require(set(found) == set(expected), f"unexpected STEP component IDs: {sorted(found)}")
    for name, want in expected.items():
        for row, wanted in zip(found[name], want, strict=True):
            for actual, value in zip(row, wanted, strict=True):
                near(actual, value, 1e-6, f"{name} signed STEP matrix")
    return found


def endpoints(theta, crank=20, pitch=80):
    r = math.radians(theta)
    return [crank * math.cos(r), -crank * math.sin(r)], [crank * math.cos(r), pitch - crank * math.sin(r)]


def analytic(spec, theta, crank=20, pitch=80):
    c, d = endpoints(theta, crank, pitch)
    crank_low = math.hypot(*c)
    crank_high = math.hypot(d[0], d[1] - pitch)
    link = math.dist(c, d)
    low_angle = math.degrees(math.atan2(-c[1], c[0]))
    high_angle = math.degrees(math.atan2(-(d[1] - pitch), d[0]))
    closure = max(abs(crank_low - 20), abs(crank_high - 20), abs(link - 80))
    agreement = max(abs(low_angle - theta), abs(high_angle - theta))
    require(closure <= spec["oracles"]["loop_closure_mm"], "loop closure failed")
    require(agreement <= spec["oracles"]["angle_agreement_deg"], "angle agreement failed")
    return {"C_yz_mm": c, "D_yz_mm": d, "lower_crank_mm": crank_low,
            "upper_crank_mm": crank_high, "coupler_mm": link,
            "loop_closure_error_mm": closure, "angle_agreement_error_deg": agreement}


def main():
    started = time.perf_counter()
    out = Path(sys.argv[1])
    out.mkdir(parents=True, exist_ok=True)
    spec_path = Path(__file__).with_name("spec.json")
    spec = json.loads(spec_path.read_text())
    (out / "spec.json").write_bytes(spec_path.read_bytes())
    shapes = {
        "shade.fixture": fixture(),
        "shade.lower_slat_rotor": rotor(),
        "shade.upper_slat_rotor": rotor(),
        "shade.coupler": coupler(),
        "shade.lower_washer": washer(),
        "shade.upper_washer": washer(),
    }
    records = {}
    by_id = {part["id"]: part for part in spec["parts"]}
    for part_id, shape in shapes.items():
        file = by_id[part_id]["file"]
        step, stl = out / f"{file}.step", out / f"{file}.stl"
        source = inspect(shape)
        cq.exporters.export(shape, str(step), exportType="STEP")
        reread = cq.importers.importStep(str(step)).val()
        imported = inspect(reread)
        near(imported["volume_mm3"], source["volume_mm3"],
             max(0.01, source["volume_mm3"] * spec["oracles"]["step_relative_volume"]),
             f"{part_id} STEP volume")
        for a, b in zip(sum(imported["bounds_mm"], []), sum(source["bounds_mm"], []), strict=True):
            near(a, b, 0.01, f"{part_id} STEP bounds")
        cq.exporters.export(shape, str(stl), exportType="STL", tolerance=0.05, angularTolerance=0.1)
        records[part_id] = {"file": file, "cad": source, "step": imported,
                            "step_sha256": sha256(step), "stl_sha256": sha256(stl)}

    samples = []
    ids = [part["id"] for part in spec["parts"]]
    threshold = spec["oracles"]["non_intended_intersection_mm3"]
    for theta in spec["motion"]["sample_angles_deg"]:
        placed = {}
        for part in spec["parts"]:
            placed[part["id"]] = world_shape(shapes[part["id"]], location(
                part["role"], part.get("axis_z_mm", 0), theta))
        intersections = []
        for i, first in enumerate(ids):
            for second in ids[i + 1:]:
                volume = overlap(placed[first], placed[second])
                require(volume <= threshold, f"{theta} deg: {first}/{second} overlap {volume} mm3")
                intersections.append({"parts": [first, second], "intersection_mm3": volume})
        samples.append({"angle_deg": theta, "analytic": analytic(spec, theta),
                        "pairwise_checks": len(intersections), "intersections": intersections})

    poses = {}
    for pose in spec["poses"]:
        theta = pose["angle_deg"]
        assembly = cq.Assembly(name=spec["root"])
        expected = {}
        for part in spec["parts"]:
            loc = location(part["role"], part.get("axis_z_mm", 0), theta)
            assembly.add(shapes[part["id"]], name=part["id"], loc=loc)
            expected[part["id"]] = matrix_for(part["role"], part.get("axis_z_mm", 0), theta)
        path = out / f"{pose['id']}.step"
        assembly.export(str(path))
        matrices = inspect_assembly(path, spec["root"], expected)
        poses[pose["id"]] = {"angle_deg": theta, "step_sha256": sha256(path),
                              "world_from_local_cad": matrices}

    bad_link = analytic({**spec, "oracles": {**spec["oracles"], "loop_closure_mm": 2}}, 25,
                        pitch=spec["oracles"]["incorrect_link_length_mm"])
    require(abs(bad_link["coupler_mm"] - 80) >= 1, "incorrect link control was not detected")
    c, _ = endpoints(25)
    _, wrong_d = endpoints(26)
    wrong_pose_error = abs(math.dist(c, wrong_d) - 80)
    require(wrong_pose_error > spec["oracles"]["loop_closure_mm"], "wrong pose control was not detected")
    interference = overlap(fixture(), rotor())
    tight_support = box(151, 154, -8, 8, -8, 88).cut(
        *[cylinder_x(1.4, 150, 155, 0, z) for z in (0, 80)]).clean()
    tight_overlap = overlap(tight_support, rotor())
    require(interference <= threshold and tight_overlap > threshold, "pin clearance negative control failed")
    rejected = [angle for angle in spec["oracles"]["rejected_angles_deg"]
                if not spec["motion"]["limits_deg"][0] <= angle <= spec["motion"]["limits_deg"][1]]
    require(rejected == spec["oracles"]["rejected_angles_deg"], "out-of-range controls failed")
    invalid_ids = ids + [ids[0]]
    require(len(set(invalid_ids)) != len(invalid_ids), "duplicate ID control failed")
    repo = Path(__file__).resolve().parents[3]
    head = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=repo, text=True).strip()
    clean = subprocess.run(["git", "status", "--porcelain", "--untracked-files=no"], cwd=repo,
                           text=True, capture_output=True, check=True).stdout == ""
    report = {"schema": 1, "id": spec["id"], "passed": True, "units": "mm",
              "spec_sha256": sha256(out / "spec.json"), "parts": records, "poses": poses,
              "samples": samples, "sample_count": len(samples),
              "pairwise_checks_per_sample": len(ids) * (len(ids) - 1) // 2,
              "clearances": {"shaft_support_radial_mm": 0.2, "pin_coupler_radial_mm": 0.2,
                             "pin_washer_radial_mm": 0.1, "moving_plate_axial_mm": 0.5},
              "negative_controls": {"incorrect_link_error_mm": abs(bad_link["coupler_mm"] - 80),
                                    "wrong_pose_loop_error_mm": wrong_pose_error,
                                    "tight_support_intersection_mm3": tight_overlap,
                                    "rejected_angles_deg": rejected,
                                    "duplicate_id_rejected": True},
              "provenance": {"source_commit": spec["source_commit"], "head_at_generation": head,
                             "candidate": "WORKTREE_UNCOMMITTED", "tracked_tree_clean": clean,
                             "python": sys.version.split()[0], "cadquery": cq.__version__,
                             "ocp": OCP.__version__},
              "elapsed_seconds": time.perf_counter() - started}
    (out / "cad.json").write_text(json.dumps(report, indent=2, allow_nan=False) + "\n")
    artifact_files = ["spec.json", "cad.json",
                      *[f"{part['file']}.{suffix}" for part in spec["parts"] for suffix in ("step", "stl")],
                      *[f"{pose['id']}.step" for pose in spec["poses"]]]
    manifest = {"schema": 1, "id": spec["id"], "passed": True, "stage": "cad",
                "source_commit": spec["source_commit"], "head_at_generation": head,
                "candidate": "WORKTREE_UNCOMMITTED", "files": {
                    file: sha256(out / file) for file in sorted(artifact_files)}}
    (out / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")


if __name__ == "__main__":
    main()
