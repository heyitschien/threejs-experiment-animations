"""Import the exact recorded STL files and export their GLBs."""

import json
import math
from pathlib import Path
import sys

import bpy

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / "session-0"))
from blender_export import clear_scene, sha256, world_bounds


def main():
    out, run_id = sys.argv[sys.argv.index("--") + 1:]
    out = Path(out)
    cad_file = out / "cad.json"
    cad = json.loads(cad_file.read_text())
    if cad["passed"] is not True or cad["run_id"] != run_id:
        raise ValueError("CAD stage did not pass for this run")

    bpy.context.scene.unit_settings.system = "METRIC"
    bpy.context.scene.unit_settings.scale_length = 1.0
    material = bpy.data.materials.new(name="Calibration blue")
    material.diffuse_color = (0.08, 0.42, 0.72, 1.0)
    models = []
    for model in cad["models"]:
        clear_scene()
        name = model["id"]
        stl, glb = out / f"{name}.stl", out / f"{name}.glb"
        if sha256(stl) != model["stl_sha256"]:
            raise ValueError(f"{name}: STL provenance mismatch")
        result = bpy.ops.wm.stl_import(filepath=str(stl), global_scale=0.001,
                                      forward_axis="Y", up_axis="Z", use_scene_unit=False,
                                      use_facet_normal=False, use_mesh_validate=True)
        if result != {"FINISHED"}:
            raise ValueError(f"{name}: STL import did not finish")
        obj, = [obj for obj in bpy.context.selected_objects if obj.type == "MESH"]
        obj.name = name
        obj.data.name = f"{name}_mesh"
        obj.data.materials.append(material)
        low, high, _ = world_bounds(obj)
        target = model["cad"]["pocket_corner_mm"]
        vertices = [[float(c) * 1000 for c in obj.matrix_world @ v.co] for v in obj.data.vertices]
        if not all(math.isfinite(c) for point in vertices for c in point):
            raise ValueError(f"{name}: nonfinite mesh coordinates")
        corner = min(vertices, key=lambda v: math.dist(v, target))
        if math.dist(corner, target) > 0.5:
            raise ValueError(f"{name}: signed pocket landmark missing")
        result = bpy.ops.export_scene.gltf(filepath=str(glb), export_format="GLB",
                                           use_selection=True, export_yup=True,
                                           export_apply=True, export_materials="EXPORT")
        if result != {"FINISHED"} or not glb.is_file():
            raise ValueError(f"{name}: GLB export did not finish")
        models.append({"id": name, "passed": True, "stl_sha256": sha256(stl),
                       "glb_sha256": sha256(glb), "bounds_mm": [[v * 1000 for v in b] for b in (low, high)],
                       "pocket_corner_mm": corner, "triangles": len(obj.data.polygons)})
    report = {"schema": 1, "run_id": run_id, "passed": True, "input_units": "mm",
              "scene_units": "m", "export_axes": "[x,z,-y]", "cad_sha256": sha256(cad_file),
              "blender": bpy.app.version_string, "build": bpy.app.build_hash.decode(),
              "python": sys.version.split()[0], "models": models}
    (out / "blender.json").write_text(json.dumps(report, indent=2, allow_nan=False) + "\n")


if __name__ == "__main__":
    main()
