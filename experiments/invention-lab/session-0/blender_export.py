#!/usr/bin/env python3
"""Import Session 0 STL derivatives at mm scale and export Y-up GLBs."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import sys

import bpy
from mathutils import Vector


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def world_bounds(obj: bpy.types.Object) -> tuple[list[float], list[float], list[float]]:
    points = [obj.matrix_world @ Vector(corner) for corner in obj.bound_box]
    minimum = [min(point[index] for point in points) for index in range(3)]
    maximum = [max(point[index] for point in points) for index in range(3)]
    dimensions = [high - low for low, high in zip(minimum, maximum, strict=True)]
    return minimum, maximum, dimensions


def clear_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)


def main() -> None:
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    parser = argparse.ArgumentParser()
    parser.add_argument("--cad-metrics", type=Path, required=True)
    parser.add_argument("--artifact-dir", type=Path, required=True)
    args = parser.parse_args(argv)

    cad_report = json.loads(args.cad_metrics.read_text())
    threshold_mm = float(cad_report["integration_threshold_mm"])
    bpy.context.scene.unit_settings.system = "METRIC"
    bpy.context.scene.unit_settings.scale_length = 1.0
    results = []

    for index, model in enumerate(cad_report["models"]):
        clear_scene()
        model_id = model["id"]
        stl_path = args.artifact_dir / model["artifacts"]["stl"]
        glb_path = args.artifact_dir / f"{model_id}.glb"
        bpy.ops.wm.stl_import(
            filepath=str(stl_path),
            global_scale=0.001,
            use_scene_unit=False,
            use_facet_normal=False,
            forward_axis="Y",
            up_axis="Z",
            use_mesh_validate=True,
        )
        objects = [obj for obj in bpy.context.selected_objects if obj.type == "MESH"]
        if len(objects) != 1:
            raise RuntimeError(f"{model_id}: expected one imported mesh, got {len(objects)}")
        obj = objects[0]
        obj.name = model_id
        obj.data.name = f"{model_id}_mesh"

        material = bpy.data.materials.new(name="Calibration blue")
        material.diffuse_color = (0.08, 0.42, 0.72, 1.0)
        obj.data.materials.append(material)

        minimum, maximum, dimensions_m = world_bounds(obj)
        dimensions_mm = [value * 1000.0 for value in dimensions_m]
        expected = model["expected_dimensions_mm"]
        error_mm = max(
            abs(actual - target)
            for actual, target in zip(dimensions_mm, expected, strict=True)
        )
        if error_mm > threshold_mm:
            raise RuntimeError(
                f"{model_id}: Blender bounds error {error_mm:.6f} mm exceeds {threshold_mm} mm"
            )

        bpy.ops.object.select_all(action="DESELECT")
        obj.select_set(True)
        bpy.context.view_layer.objects.active = obj
        bpy.ops.export_scene.gltf(
            filepath=str(glb_path),
            export_format="GLB",
            use_selection=True,
            export_yup=True,
            export_apply=True,
            export_materials="EXPORT",
        )
        results.append(
            {
                "id": model_id,
                "source_stl": stl_path.name,
                "blender_bounds_m_z_up": {
                    "min": minimum,
                    "max": maximum,
                    "dimensions": dimensions_m,
                },
                "expected_dimensions_mm": expected,
                "max_dimension_error_mm": error_mm,
                "glb": glb_path.name,
                "glb_sha256": sha256(glb_path),
                "passed": True,
            }
        )

    report = {
        "schema_version": 1,
        "blender_version": bpy.app.version_string,
        "blender_python": sys.version.split()[0],
        "import_contract": "STL numeric coordinates treated as mm; global_scale=0.001 to Blender metres/Z-up",
        "export_contract": "glTF exporter export_yup=true; Three.js receives metres/Y-up",
        "models": results,
        "passed": all(result["passed"] for result in results),
    }
    output = args.artifact_dir / "blender-metrics.json"
    output.write_text(json.dumps(report, indent=2) + "\n")
    print("BLENDER_METRICS " + json.dumps(report, separators=(",", ":")))


if __name__ == "__main__":
    main()
