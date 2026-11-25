"""Author and measure HNG-001 in the Session 0.1 CadQuery environment."""

import json
import math
from pathlib import Path
import sys

import cadquery as cq
from OCP.Bnd import Bnd_Box
from OCP.BRepAdaptor import BRepAdaptor_Surface
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


def cylinder(radius, z):
    return cq.Solid.makeCylinder(radius, z[1] - z[0], cq.Vector(0, 0, z[0]))


def fixed_leaf(f):
    bridges = [solid_box([f["bridge_xy"][0] + [z[0]], f["bridge_xy"][1] + [z[1]]])
               for z in f["collar_z"]]
    collars = [cylinder(f["collar_r"], z) for z in f["collar_z"]]
    return solid_box(f["backbone"]).fuse(*bridges, *collars, cylinder(f["pin_r"], f["pin_z"])).clean()


def moving_leaf(f, radius=None, xmax=None):
    low, high = f["leaf"]
    high = high if xmax is None else [xmax, *high[1:]]
    tube = cylinder(f["eye_r"], [low[2], high[2]])
    cutter = cylinder(f["bore_r"] if radius is None else radius, [low[2] - 1, high[2] + 1])
    return tube.fuse(solid_box([low, high])).cut(cutter).clean()


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


def interface(shape, radius, end_planes, tol):
    faces = [(face, BRepAdaptor_Surface(face.wrapped).Cylinder()) for face in shape.Faces()
             if face.geomType() == "CYLINDER"]
    matches = [(face, cyl) for face, cyl in faces if abs(cyl.Radius() - radius) <= tol["cad_mm"]]
    require(len(matches) == 1, f"expected one cylinder for radius {radius}, got {len(matches)}")
    face, cyl = matches[0]
    axis = cyl.Axis()
    loc, direction = axis.Location(), axis.Direction()
    dx, dy, dz = direction.X(), direction.Y(), direction.Z()
    origin = [loc.X() - loc.Z() * dx / dz, loc.Y() - loc.Z() * dy / dz, 0]
    vectors(origin, [0, 0, 0], tol["cad_mm"], "axis origin")
    near(math.degrees(math.acos(min(1, abs(dz)))), 0, tol["axis_deg"], "axis angle")
    z = [b[2] for b in exact_bounds(face)]
    vectors(z, end_planes, tol["cad_mm"], "cylindrical face end planes")
    return {"radius_mm": cyl.Radius(), "axis_origin_mm": origin, "unsigned_axis": [dx, dy, dz],
            "z_mm": z}


def location(angle, joint, *, enforce=True):
    if enforce:
        require(math.isfinite(angle) and joint["limits_deg"][0] <= angle <= joint["limits_deg"][1],
                f"angle {angle} outside the joint range")
    return cq.Location(cq.Vector(*joint["origin"]), cq.Vector(*joint["axis"]), angle)


def overlap(a, b):
    measured = a.intersect(b)
    return sum(solid.Volume() for solid in measured.Solids())


def symmetric_difference(a, b):
    return a.cut(b).Volume() + b.cut(a).Volume()


def label_name(label):
    value = TDataStd_Name()
    require(label.FindAttribute(TDataStd_Name.GetID_s(), value), "STEP node has no name")
    return value.Get().ToExtString()


def labels(values):
    return [values.Value(i) for i in range(1, values.Length() + 1)]


def step_assembly(file, fixed_id, moving_id, root, angle, tol):
    doc = TDocStd_Document(TCollection_ExtendedString("HNG-001"))
    reader = STEPCAFControl_Reader()
    reader.SetNameMode(True)
    require(reader.ReadFile(str(file)) == IFSelect_RetDone and reader.Transfer(doc), "STEPCAF read failed")
    tool = XCAFDoc_DocumentTool.ShapeTool_s(doc.Main())
    roots = TDF_LabelSequence()
    tool.GetFreeShapes(roots)
    top, = labels(roots)
    require(label_name(top) == root and tool.IsAssembly_s(top), "wrong STEP assembly root")
    children = TDF_LabelSequence()
    tool.GetComponents_s(top, children, False)
    nodes = {}
    for child in labels(children):
        definition = TDF_Label()
        require(tool.GetReferredShape_s(child, definition), "STEP occurrence has no definition")
        name = label_name(definition)
        require(name not in nodes and not tool.IsAssembly_s(definition), f"duplicate or nested STEP node {name}")
        trsf = tool.GetLocation_s(child).Transformation()
        matrix = [[trsf.Value(i, j) for j in range(1, 5)] for i in range(1, 4)] + [[0, 0, 0, 1]]
        nodes[name] = (cq.Shape.cast(tool.GetShape_s(child)), matrix)
    require(set(nodes) == {fixed_id, moving_id}, f"Unexpected STEP component labels {list(nodes)}")
    for name, (_, matrix) in nodes.items():
        t = math.radians(angle if name == moving_id else 0)
        c, s = math.cos(t), math.sin(t)
        want = [[c, -s, 0, 0], [s, c, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]]
        cols = list(zip(*(row[:3] for row in matrix[:3])))
        for i in range(3):
            for j in range(3):
                near(sum(a * b for a, b in zip(cols[i], cols[j])), int(i == j), tol["rigid_matrix"],
                     "STEP rotation orthogonality")
        near(trsf_det(matrix), 1, tol["rigid_matrix"], "STEP determinant")
        for actual, expected in zip(matrix, want, strict=True):
            vectors(actual, expected, tol["rigid_matrix"], f"{name} STEP signed transform")
    return nodes


def trsf_det(m):
    a, b, c = m[0][:3]
    d, e, f = m[1][:3]
    g, h, i = m[2][:3]
    return a * (e*i - f*h) - b * (d*i - f*g) + c * (d*h - e*g)


def export_part(out, name, shape, bounds, witness, volume, tol):
    step, stl = out / f"{name}.step", out / f"{name}.stl"
    source = inspect_solid(shape, bounds, witness, volume, tol, name)
    cq.exporters.export(shape, str(step), exportType="STEP")
    reread = cq.importers.importStep(str(step)).val()
    imported = inspect_solid(reread, bounds, witness, source["volume_mm3"], tol, name + " STEP")
    cq.exporters.export(shape, str(stl), exportType="STL", tolerance=tol["linear_mesh_mm"],
                        angularTolerance=tol["angular_mesh_rad"])
    return {"cad": source, "step": imported, "step_sha256": sha256(step), "stl_sha256": sha256(stl)}


def check_fit(fixed, moving, fixed_spec, moving_spec, spec):
    fit, tol = spec["fit"], spec["tolerances"]
    mm, mm3 = tol["cad_mm"], tol["volume_mm3"]
    pin = interface(fixed, fixed_spec["pin_r"], fixed_spec["exposed_pin_z"], tol)
    bore = interface(moving, moving_spec["bore_r"], [moving_spec["leaf"][0][2], moving_spec["leaf"][1][2]], tol)
    radial = bore["radius_mm"] - pin["radius_mm"]
    axial = [bore["z_mm"][0] - pin["z_mm"][0], pin["z_mm"][1] - bore["z_mm"][1]]
    near(radial, fit["radial_gap"], mm, "radial clearance")
    vectors(axial, fit["axial_gap"], mm, "shoulder clearances")
    samples = []
    for degrees in range(0, 91, fit["sample_step_deg"]):
        placed = moving.located(location(degrees, spec["joint"]))
        intersection, distance = overlap(fixed, placed), fixed.distance(placed)
        require(intersection <= mm3, f"nominal interference at {degrees}°")
        near(distance, fit["radial_gap"], mm, f"minimum separation at {degrees}°")
        samples.append({"angle_deg": degrees, "intersection_mm3": intersection, "min_distance_mm": distance})
    keep_in, keep_out = [cylinder(fit[tag]["r"], fit[tag]["z"]) for tag in ("keep_in", "keep_out")]
    missing = max(0.0, keep_in.Volume() - overlap(keep_in, fixed))
    occupied = overlap(keep_out, moving)
    require(missing <= mm3 and occupied <= mm3, "keep-in or keep-out check failed")
    return {"pin": pin, "bore": bore, "radial_gap_mm": radial, "axial_gaps_mm": axial, "samples": samples,
            "keep_in_missing_mm3": missing, "keep_out_occupied_mm3": occupied}


def controls(fixed, moving, fixed_spec, moving_spec, spec):
    fit, tol = spec["fit"], spec["tolerances"]
    mm, mm3 = tol["cad_mm"], tol["volume_mm3"]
    contact_r = fit["contact_bore_r"]
    contact = moving_leaf(moving_spec, radius=contact_r)
    contact_measure = {"radial_gap_mm": contact_r - fixed_spec["pin_r"],
                       "distance_mm": fixed.distance(contact), "intersection_mm3": overlap(fixed, contact)}
    near(contact_measure["radial_gap_mm"], 0, mm, "contact radial gap")
    near(contact_measure["distance_mm"], 0, mm, "contact minimum distance")
    require(contact_measure["intersection_mm3"] <= mm3, "contact control overlaps")
    control_geometry = [
        ("undersize_bore", moving_leaf(moving_spec, radius=fit["undersize_bore_r"])),
        ("offset_x", moving.translate(cq.Vector(fit["offset_x_mm"], 0, 0))),
        ("offset_z", moving.translate(cq.Vector(0, 0, fit["offset_z_mm"]))),
    ]
    cases = {name: {"intersection_mm3": overlap(fixed, shape)} for name, shape in control_geometry}
    undersize = interface(control_geometry[0][1], fit["undersize_bore_r"],
                          [moving_spec["leaf"][0][2], moving_spec["leaf"][1][2]], tol)
    cases["undersize_bore"]["radial_gap_mm"] = undersize["radius_mm"] - fixed_spec["pin_r"]
    near(cases["undersize_bore"]["radial_gap_mm"], fit["undersize_radial_gap"], mm, "undersize radial gap")
    near(cases["undersize_bore"]["intersection_mm3"], fit["undersize_overlap_mm3"],
         tol["control_overlap_mm3"], "undersize volume")
    offset = exact_bounds(control_geometry[1][1])[0][0] - moving_spec["bounds"][0][0]
    cases["offset_x"]["radial_residual_mm"] = moving_spec["bore_r"] - fixed_spec["pin_r"] - abs(offset)
    near(cases["offset_x"]["radial_residual_mm"], fit["offset_gap"], mm, "offset radial residual")
    cases["offset_z"]["shoulder_overlap_mm"] = fixed_spec["exposed_pin_z"][0] - exact_bounds(control_geometry[2][1])[0][2]
    near(cases["offset_z"]["shoulder_overlap_mm"], fit["shoulder_overlap_mm"], mm, "shoulder overlap")
    for case in cases.values():
        require(case["intersection_mm3"] > mm3, "interference control was not detected")
        case["nominal_rejected"] = True
    rejected = []
    for angle in fit["rejected_angles_deg"]:
        try:
            location(angle, spec["joint"])
        except ValueError:
            rejected.append(angle)
    require(rejected == fit["rejected_angles_deg"], "joint limit rejection missing")
    half = spec["poses"][1]
    backward = moving.located(location(fit["wrong_signed_pose_deg"], spec["joint"], enforce=False))
    witness_error = min(math.dist(vertex.toTuple(), half["moving_witness"]) for vertex in backward.Vertices())
    require(witness_error > tol["witness_mm"], "opposite rotation passed signed witness")
    return {"contact": contact_measure, "interference": cases, "rejected_angles_deg": rejected,
            "wrong_signed_pose_witness_error_mm": witness_error}


def main():
    out, run_id = Path(sys.argv[1]), sys.argv[2]
    fixture = out / "fixture.json"
    spec = json.loads(fixture.read_text())
    f, m, tol = spec["parts"]["fixed"], spec["parts"]["moving"], spec["tolerances"]
    fixed, moving = fixed_leaf(f), moving_leaf(m)
    parts = {f["id"]: export_part(out, f["id"], fixed, f["bounds"], f["witness"], f["volume"], tol),
             m["id"]: export_part(out, m["id"], moving, m["bounds"], m["witness"], m["volume"], tol)}
    fit = check_fit(fixed, moving, f, m, spec)
    negative = controls(fixed, moving, f, m, spec)
    poses = {}
    for pose in spec["poses"]:
        file = out / (pose["id"] + ".step")
        group = cq.Assembly(name=spec["root"])
        group.add(fixed, name=f["id"])
        group.add(moving, name=m["id"], loc=location(pose["angle_deg"], spec["joint"]))
        group.export(str(file))
        nodes = step_assembly(file, f["id"], m["id"], spec["root"], pose["angle_deg"], tol)
        checked = {}
        for entry, bounds, witness in [(f, f["bounds"], f["witness"]),
                                        (m, pose["moving_bounds"], pose["moving_witness"])]:
            shape, matrix = nodes[entry["id"]]
            checked[entry["id"]] = {"step": inspect_solid(shape, bounds, witness, entry["volume"], tol, pose["id"]),
                                    "world_from_local_cad": matrix}
        poses[pose["id"]] = {"angle_deg": pose["angle_deg"], "step_sha256": sha256(file), "parts": checked}
    xmax = spec["edit"]["x_max_mm"]
    edited = moving_leaf(m, xmax=xmax)
    fixed_again = fixed_leaf(f)
    slab = solid_box(spec["edit"]["allowed_slab"])
    changed_outside = symmetric_difference(edited.cut(slab), moving.cut(slab))
    fixed_delta = symmetric_difference(fixed, fixed_again)
    added = edited.Volume() - moving.Volume()
    near(added, spec["edit"]["added_volume_mm3"], tol["volume_mm3"], "added motion leaf volume")
    require(max(changed_outside, fixed_delta) <= tol["volume_mm3"], "non-target geometry changed")
    # Exercise the interface again after the isolated feature edit.
    changed_bore = interface(edited, m["bore_r"], fit["bore"]["z_mm"], tol)
    fixed_bytes = all(sha256(out / (f["id"] + suffix)) == parts[f["id"]][key]
                      for suffix, key in [(".step", "step_sha256"), (".stl", "stl_sha256")])
    require(fixed_bytes, "fixed derivative bytes were changed")
    edit = export_part(out, "moving_edited", edited, [m["bounds"][0], [xmax, *m["bounds"][1][1:]]],
                       [xmax, *m["witness"][1:]], m["volume"] + spec["edit"]["added_volume_mm3"], tol)
    report = {"schema": 1, "run_id": run_id, "passed": True, "fixture_sha256": sha256(fixture),
              "units": spec["units"], "root": spec["root"], "joint": spec["joint"], "parts": parts,
              "poses": poses, "fit": fit, "controls": negative,
              "edit": {"added_mm3": added, "outside_edit_slab_mm3": changed_outside,
                       "fixed_symmetric_difference_mm3": fixed_delta, "fixed_input_hashes_unchanged": fixed_bytes,
                       "bore": changed_bore, "moving": edit}}
    (out / "cad.json").write_text(json.dumps(report, indent=2, allow_nan=False) + "\n")


if __name__ == "__main__":
    main()
