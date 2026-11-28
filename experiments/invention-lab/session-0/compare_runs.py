#!/usr/bin/env python3
"""Compare two CadQuery runs without treating STEP header timestamps as geometry."""

from __future__ import annotations

import argparse
import json
from pathlib import Path


def semantic_metrics(model: dict) -> dict:
    return {
        "expected_dimensions_mm": model["expected_dimensions_mm"],
        "expected_volume_mm3": model["expected_volume_mm3"],
        "cad": model["cad"],
        "step_reimport": model["step_reimport"],
        "mesh": model["mesh"],
        "passed": model["passed"],
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("reference", type=Path)
    parser.add_argument("candidate", type=Path)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument(
        "--comparison",
        default="fresh second generation in the same pinned environment",
    )
    args = parser.parse_args()
    reference = json.loads(args.reference.read_text())
    candidate = json.loads(args.candidate.read_text())
    candidate_by_id = {model["id"]: model for model in candidate["models"]}
    results = []
    for model in reference["models"]:
        other = candidate_by_id[model["id"]]
        metrics_equal = semantic_metrics(model) == semantic_metrics(other)
        step_bytes_equal = (
            model["artifacts"]["step_sha256"] == other["artifacts"]["step_sha256"]
        )
        stl_bytes_equal = (
            model["artifacts"]["stl_sha256"] == other["artifacts"]["stl_sha256"]
        )
        results.append(
            {
                "id": model["id"],
                "geometry_metrics_equal": metrics_equal,
                "stl_bytes_equal": stl_bytes_equal,
                "step_bytes_equal": step_bytes_equal,
                "step_binary_note": "OpenCascade writes generation time in the STEP header; compare imported geometry metrics, not raw STEP bytes.",
                "passed": metrics_equal and stl_bytes_equal,
            }
        )
    report = {
        "schema_version": 1,
        "comparison": args.comparison,
        "models": results,
        "passed": all(result["passed"] for result in results),
    }
    args.output.write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
