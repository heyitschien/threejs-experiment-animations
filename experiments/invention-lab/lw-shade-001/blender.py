"""Import verified component STL derivatives and export LW-SHADE-001 poses."""

import json
import math
from pathlib import Path
import sys

import bpy

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "session-0"))
from blender_export import clear_scene, sha256


def require(condition, message):
    if not condition:
        raise ValueError(message)


def load_part(out, part_key, part_id, digest, parent, color):
    stl = out / (part_id + ".stl")
    require(sha256(stl) == digest, f"{part_id}: STL digest mismatch")
    bpy.ops.object.select_all(action="DESELECT")
    result = bpy.ops.wm.stl_import(filepath=str(stl), global_scale=0.001,
                                  forward_axis="Y", up_axis="Z", use_scene_unit=False,
                                  use_facet_normal=False, use_mesh_validate=True)
    require(result == {"FINISHED"}, f"{part_id}: failed to import STL")
    mesh, = [obj for obj in bpy.context.selected_objects if obj.type == "MESH"]
    mesh.name = part_id
    mesh.data.name = part_id + "_mesh"
    mesh["part_id"] = part_id
    mesh.parent = parent
    material = bpy.data.materials.new(name=part_id + "_material")
    material.diffuse_color = color
    mesh.data.materials.append(material)
    for face in mesh.data.polygons:
        face.use_smooth = False
    return mesh


def measure(mesh, bounds, witness, tolerance):
    points = [tuple(c * 1000 for c in mesh.matrix_world @ v.co) for v in mesh.data.vertices]
    require(points and all(math.isfinite(v) for point in points for v in point), "invalid Blender vertices")
    low, high = [[func(p[i] for p in points) for i in range(3)] for func in (min, max)]
    error = max(abs(a - b) for got, want in zip([low, high], bounds, strict=True)
                for a, b in zip(got, want, strict=True))
    corner = min(points, key=lambda p: math.dist(p, witness))
    require(error <= tolerance and math.dist(corner, witness) <= tolerance, "Blender positional check failed")
    matrix = [[float(v) for v in row] for row in mesh.matrix_world]
    return {"bounds_mm": [low, high], "witness_mm": corner, "bounds_error_mm": error,
            "matrix_world_scene_units": matrix, "triangles": len(mesh.data.polygons)}


def set_transform(mesh, part_key, angle):
    theta = math.radians(angle)
    c = math.cos(theta)
    sn = math.sin(theta)
    if part_key == "ground":
        mesh.location = (0, 0, 0)
        mesh.rotation_euler = (0, 0, 0)
    elif part_key in ("slat_lower", "crank_lower"):
        mesh.location = (0, 0, 0)
        mesh.rotation_euler = (-theta, 0, 0)
    elif part_key in ("slat_upper", "crank_upper"):
        mesh.location = (0, 0, 0.08)
        mesh.rotation_euler = (-theta, 0, 0)
    elif part_key == "coupler":
        mesh.location = (0, 0.02 * c, -0.02 * sn)
        mesh.rotation_euler = (0, 0, 0)
    else:
        raise ValueError(part_key)


def main():
    out, run_id = sys.argv[sys.argv.index("--") + 1:]
    out = Path(out)
    cad_file, fixture = out / "cad.json", out / "fixture.json"
    cad, spec = [json.loads(file.read_text()) for file in (cad_file, fixture)]
    require(cad["run_id"] == run_id and cad["passed"] is True and
            cad["fixture_sha256"] == sha256(fixture), "stale CAD receipt")
    clear_scene()
    bpy.context.scene.unit_settings.system = "METRIC"
    bpy.context.scene.unit_settings.scale_length = 1
    root = bpy.data.objects.new(spec["root"], None)
    bpy.context.collection.objects.link(root)
    root["assembly_id"] = spec["root"]
    root["joint_id"] = spec["joint"]["id"]
    root["joint_axis_cad"] = spec["joint"]["axis"]

    parts_spec = spec["parts"]
    colors = {
        "ground": (0.2, 0.2, 0.2, 1),
        "slat_lower": (0.76, 0.37, 0.10, 1),
        "slat_upper": (0.76, 0.37, 0.10, 1),
        "crank_lower": (0.13, 0.37, 0.53, 1),
        "crank_upper": (0.13, 0.37, 0.53, 1),
        "coupler": (0.3, 0.6, 0.3, 1),
    }
    meshes = {}
    for key, p in parts_spec.items():
        pid = p["id"]
        mesh = load_part(out, key, pid, cad["parts"][key]["stl_sha256"], root, colors.get(key, (0.5, 0.5, 0.5, 1)))
        meshes[key] = mesh

    results = {}
    for pose in spec["poses"]:
        angle, pose_id = pose["angle_deg"], pose["id"]
        root["pose_id"] = pose_id
        root["angle_deg"] = angle
        geometry = {}
        for key, mesh in meshes.items():
            set_transform(mesh, key, angle)
        bpy.context.view_layer.update()
        for key, mesh in meshes.items():
            p = parts_spec[key]
            if key == "ground":
                bounds = p["bounds"]
                witness = p["witness"]
            else:
                bounds = pose["parts"][key]["bounds"]
                witness = pose["parts"][key]["witness"]
            geometry[mesh.name] = measure(mesh, bounds, witness, spec["tolerances"]["glb_mm"])
        path = out / (pose_id + ".glb")
        result = bpy.ops.export_scene.gltf(filepath=str(path), export_format="GLB", export_yup=True,
                                           export_apply=True, export_materials="EXPORT", export_extras=True)
        require(result == {"FINISHED"} and path.is_file(), "Blender GLB export failed")
        results[pose_id] = {"angle_deg": angle, "glb_sha256": sha256(path), "parts": geometry,
                            "step_sha256": cad["poses"][pose_id]["step_sha256"] if pose_id in cad["poses"] else None}
    # cad poses keys are pose ids; okay
    receipt = {"schema": 1, "run_id": run_id, "passed": True, "blender": bpy.app.version_string,
               "build": bpy.app.build_hash.decode(), "python": sys.version.split()[0],
               "cad_sha256": sha256(cad_file), "scene_units": "m", "axes": "[x,z,-y]", "poses": results}
    (out / "blender.json").write_text(json.dumps(receipt, indent=2, allow_nan=False) + "\n")


if __name__ == "__main__":
    main()
