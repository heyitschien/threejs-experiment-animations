#!/usr/bin/env bash
set -euo pipefail

session_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_dir="$(cd "$session_dir/../../.." && pwd)"
python_bin="${CADQUERY_PYTHON:-$repo_dir/.venv-cadquery/bin/python}"
blender_bin="${BLENDER_BIN:-/Applications/Blender.app/Contents/MacOS/Blender}"
artifact_dir="$session_dir/artifacts"

"$python_bin" "$session_dir/model.py" \
  --parameters "$session_dir/parameters.json" \
  --output-dir "$artifact_dir"

"$blender_bin" --background --factory-startup \
  --python "$session_dir/blender_export.py" -- \
  --cad-metrics "$artifact_dir/cad-metrics.json" \
  --artifact-dir "$artifact_dir"

node "$session_dir/validate_glb.mjs" "$artifact_dir"
