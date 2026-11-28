# Invention Lab Agent Startup Guide

Concise startup reference for local and remote agents executing pinned CAD-to-web Invention Lab modules (`session-0.1`, `hng-001`, `lw-shade-001`) on macOS arm64.

## 1. Approved Pinned Environment

Source the machine-local non-secret environment file on local shells, or rely on the pre-exported variables provided by the confined dispatcher worker shell (`account_scope.repo_overrides`):

```sh
# Local shell (do not commit host-local paths or override these variables in subshells)
set -a
source "$HOME/.config/invention-lab/env"
export BLENDER_USER_RESOURCES="${TMPDIR:-/tmp}/blender-user"
set +a
```

Required exported variables (do **not** overwrite `$CADQUERY_PYTHON` inside subshells):
- `LAB_NODE` (`26.13.0`), `LAB_NPM` (`11.20.0`), `LAB_PYTHON` (`3.12.12`), `LAB_UV` (`0.6.9`)
- `CADQUERY_PYTHON` (isolated arm64 venv with `CadQuery 2.8.0` / `OCP 7.9.3.1` matching `experiments/invention-lab/session-0.1/requirements-macos-arm64.lock`)
- `BLENDER_BIN` (notarized signed `Blender.app` `4.4.0`, `Identifier=org.blenderfoundation.blender`, `TeamIdentifier=68UA947AUU`)
- `PLAYWRIGHT_BROWSERS_PATH=0` (uses lockfile-verified `node_modules` bundled Chromium `159.0.8154.6`)
- `BLENDER_USER_RESOURCES` (job-local temp directory so Blender never probes `~/Library/Application Support/Blender`)

## 2. Standard Startup & Verification Commands

Run from an isolated worktree with lockfile-matched `node_modules`:

```sh
# 1. Verify all 13 pinned tool versions + Blender notarization
"$LAB_NODE" experiments/invention-lab/session-0.1/lab.mjs doctor

# 2. Run full LW-SHADE-001 CAD -> Blender -> GLB -> Vite -> Playwright pipeline
"$LAB_NODE" experiments/invention-lab/lw-shade-001/lab.mjs run --out /tmp/lw-shade-001-run

# 3. Run unit tests and repository baseline checks (OCTO preserved)
"$LAB_NPM" run lw-shade:unit
"$LAB_NPM" run check

# 4. Optional: serve built static preview locally for interactive inspection
"$LAB_NODE" -e "import('./experiments/invention-lab/lw-shade-001/browser.mjs').then(async ({ serve }) => { const s = await serve('experiments/invention-lab/lw-shade-001/dist'); console.log('Preview:', s.url); })"
```

Notes:
- `npm run qa:browser` runs the OCTO Playwright suite; on macOS arm64 software WebGL, `qa/capture.spec.js` golden pixel comparisons (`maxDiffPixels: 0`) differ from Linux CI goldens even with zero OCTO changes, while the 6 functional OCTO browser tests pass.
- For `LW-SHADE-001`, use `lab.mjs run` (or `$LAB_NPM run lw-shade:test -- <dist> <evidence>`) for module-specific desktop (`1360x820`), mobile-emulation (`390x844`), and missing-asset (`404`) browser QA.

## 3. Observed Sandbox Comparison & Security-Profile Recommendations

Empirical comparison on the exact same approved `Blender.app` (`Notarized Developer ID`) and `127.0.0.1` loopback server:

| Capability | Local Host | OpenCode Confined Seatbelt (`native-qa`) | Codex `workspace-write` (default `network_access=false`) | Codex `workspace-write` (`network_access=true`) |
|---|---|---|---|---|
| `codesign --verify --deep --strict Blender.app` | PASS (`0`) | PASS (`0`) | **FAIL (`1`)**: misleading `invalid signature` | PASS (`0`) |
| `spctl --assess --type execute Blender.app` | PASS (`Notarized Developer ID`) | PASS (`Notarized Developer ID`) | **FAIL (`1`)**: `internal error in Code Signing subsystem` | PASS (IPC unblocked) |
| `Blender --version` / headless export | PASS (`4.4.0`) | PASS (`4.4.0`) | PASS (`4.4.0`) | PASS (`4.4.0`) |
| Loopback `127.0.0.1` `listen()` (Vite / Playwright) | PASS | PASS (`localhost:*` allowed) | **FAIL**: `listen EPERM 127.0.0.1` | PASS |

### Demonstrated Blockers & Minimal Profile Guidance
1. **Codex `workspace-write` (`network_access=false` default):** Blocks both `127.0.0.1` loopback binds and macOS `Security.framework` / `trustd` / `syspolicy` verification IPC. This makes a completely intact notarized `Blender.app` fail `codesign` with a misleading `invalid signature` error and blocks all local Playwright tests.
   - *Recommendation:* Keep `workspace-write` default (`network_access=false`) for non-browser `native-dev` tasks. If running `codex_cli` on `native-qa` browser/Blender QA in the future, explicitly opt into `-c sandbox_workspace_write.network_access=true` and document the residual tradeoff that Codex's built-in toggle enables general network access (not loopback-only).
2. **OpenCode Confined Seatbelt (`native-qa` — recommended default for remote CAD-to-web QA):**
   - Keeps `(deny default)` host file isolation (no broad `$HOME`, `~/.config/gh`, `~/.config/agent-dispatch`, or `~/.local/share/opencode`) with only 4 narrow read-only runtime paths (`/Library/Fonts`, `.venv-invention-lab`, notarized `Blender.app`, `uv`), lockfile-SHA-256-pinned APFS CoW `node_modules` staging, strict allowlisted `worker_env`, job-local `BLENDER_USER_RESOURCES`, and `localhost:*` loopback + browser Mach rules (explicitly denying Keychain/security daemons as a documented browser-specific residual trust boundary).
   - Keep `BUN_CONFIG_HTTP_IDLE_TIMEOUT=0` scoped strictly to the dispatcher OpenCode shim so long CAD/Blender/browser runs do not hit OpenCode mini's ~360 s Bun HTTP wait timeout.
