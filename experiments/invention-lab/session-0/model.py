#!/usr/bin/env python3
"""Generate and verify the Session 0 CadQuery calibration solids."""

from __future__ import annotations

import argparse
import hashlib
import json
import math
from pathlib import Path
from typing import Any

import cadquery as cq


def bounds(shape: cq.Shape) -> dict[str, list[float]]:
    box = shape.BoundingBox()
    return {
        "min_mm": [box.xmin, box.ymin, box.zmin],
        "max_mm": [box.xmax, box.ymax, box.zmax],
        "dimensions_mm": [box.xlen, box.ylen, box.zlen],
    }


def max_error(actual: list[float], expected: list[float]) -> float:
    return max(abs(a - b) for a, b in zip(actual, expected, strict=True))


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def generate_model(
    parameters: dict[str, Any],
    output_dir: Path,
    linear_tolerance_mm: float,
    angular_tolerance_radians: float,
    threshold_mm: float,
) -> dict[str, Any]:
    model_id = parameters["id"]
    expected = [
        float(parameters["width_mm"]),
        float(parameters["depth_mm"]),
        float(parameters["height_mm"]),
    ]
    expected_volume = math.prod(expected)

    workplane = cq.Workplane("XY").box(*expected, centered=(True, True, False))
    shape = workplane.val()
    if not shape.isValid():
        raise RuntimeError(f"{model_id}: generated B-rep is invalid")
    if shape.Volume() <= 0:
        raise RuntimeError(f"{model_id}: generated volume is not positive")

    step_path = output_dir / f"{model_id}.step"
    stl_path = output_dir / f"{model_id}.stl"
    cq.exporters.export(workplane, str(step_path), exportType="STEP")
    cq.exporters.export(
        workplane,
        str(stl_path),
        exportType="STL",
        tolerance=linear_tolerance_mm,
        angularTolerance=angular_tolerance_radians,
    )

    imported = cq.importers.importStep(str(step_path)).val()
    if not imported.isValid():
        raise RuntimeError(f"{model_id}: re-imported STEP is invalid")

    vertices, triangles = imported.tessellate(
        linear_tolerance_mm, angular_tolerance_radians
    )
    mesh_min = [min(getattr(vertex, axis) for vertex in vertices) for axis in "xyz"]
    mesh_max = [max(getattr(vertex, axis) for vertex in vertices) for axis in "xyz"]
    mesh_dimensions = [high - low for low, high in zip(mesh_min, mesh_max, strict=True)]

    cad_bounds = bounds(shape)
    step_bounds = bounds(imported)
    cad_error = max_error(cad_bounds["dimensions_mm"], expected)
    step_error = max_error(step_bounds["dimensions_mm"], expected)
    mesh_error = max_error(mesh_dimensions, expected)
    volume_error = abs(imported.Volume() - expected_volume)
    passed = all(
        error <= threshold_mm for error in (cad_error, step_error, mesh_error)
    ) and volume_error <= 1e-6
    if not passed:
        raise RuntimeError(f"{model_id}: dimensional or volume validation failed")

    return {
        "id": model_id,
        "label": parameters["label"],
        "expected_dimensions_mm": expected,
        "expected_volume_mm3": expected_volume,
        "cad": {
            "valid": shape.isValid(),
            "solid_count": len(workplane.solids().vals()),
            "volume_mm3": shape.Volume(),
            "bounds": cad_bounds,
            "max_dimension_error_mm": cad_error,
        },
        "step_reimport": {
            "valid": imported.isValid(),
            "volume_mm3": imported.Volume(),
            "volume_error_mm3": volume_error,
            "bounds": step_bounds,
            "max_dimension_error_mm": step_error,
        },
        "mesh": {
            "linear_tolerance_mm": linear_tolerance_mm,
            "angular_tolerance_radians": angular_tolerance_radians,
            "vertex_count": len(vertices),
            "triangle_count": len(triangles),
            "bounds": {
                "min_mm": mesh_min,
                "max_mm": mesh_max,
                "dimensions_mm": mesh_dimensions,
            },
            "max_dimension_error_mm": mesh_error,
        },
        "artifacts": {
            "step": step_path.name,
            "step_sha256": sha256(step_path),
            "stl": stl_path.name,
            "stl_sha256": sha256(stl_path),
        },
        "passed": passed,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--parameters", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, required=True)
    args = parser.parse_args()

    config = json.loads(args.parameters.read_text())
    args.output_dir.mkdir(parents=True, exist_ok=True)
    tessellation = config["tessellation"]
    results = [
        generate_model(
            model,
            args.output_dir,
            float(tessellation["linear_tolerance_mm"]),
            float(tessellation["angular_tolerance_radians"]),
            float(config["integration_threshold_mm"]),
        )
        for model in config["models"]
    ]
    report = {
        "schema_version": 1,
        "source_units": config["units"],
        "integration_threshold_mm": config["integration_threshold_mm"],
        "coordinate_contract": {
            "cad": "millimetres, right-handed, Z-up",
            "stl": "unitless numeric coordinates interpreted as millimetres",
            "blender": "metres, right-handed, Z-up",
            "glb_threejs": "metres, right-handed, Y-up",
        },
        "models": results,
        "passed": all(result["passed"] for result in results),
    }
    metrics_path = args.output_dir / "cad-metrics.json"
    metrics_path.write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
