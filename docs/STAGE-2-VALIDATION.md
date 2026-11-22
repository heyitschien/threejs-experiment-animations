# Stage 2 baseline and reproduction

Stage 2 is stacked on foundation commit `e5a2060161708716af42de9734151d5c1f00709c`. Stable v0.1 remains at `20283f48f2e6869e1b783652b5c5dec86acca7d0`. Captures and timing runs were made from harness commit `91b88f1bb53bc9b4849a905de218ec9eb6a5fd13`. The shipped HTML, CSS and JS were byte-identical to v0.1 on the validation host.

## Setup and commands

Validation used Node 26.13.0 / npm 11.20.0 on macOS 26.6.2 (25G83), arm64, with 104 GiB free before installation. Registry metadata and the lock diff showed three new dev-only Apache-2.0 packages, all at 1.65.1. Install scripts were disabled during npm install. The preflight lock SHA-256 was `82cc3ffcee874aa866ce0604e8e723033014036036ecb19eac34d1438e78f20d`. The post-install lock SHA-256 and reference hash are in the [golden manifest](../qa/goldens/manifest.json).

```sh
npm ci --ignore-scripts
npm run qa:install
npm run check
npm audit
npm run qa:browser
npm run qa:perf
```

The package scripts use a POSIX shell and a strict loopback Vite server at `127.0.0.1:5199`. Browser setup fetches official Chrome for Testing 159.0.8154.6, revision 1255, and the CLI's accompanying FFmpeg into the worktree's ignored `node_modules` browser cache. The mac-arm64 payload was about 193 MiB compressed and 380 MiB on disk. The browser installer uses Playwright's CDN. Installation uses the npm registry, and the test pages use the local Vite server. The run incurred $0 in fees. Check the [Playwright browser manifest](https://github.com/microsoft/playwright/blob/v1.65.1/packages/playwright-core/browsers.json) before changing the pin.

## Captures and comparison

The [goldens](../qa/goldens/) are nine lossless PNGs totaling about 6.2 MiB. The checked manifest records both hero camera poses and the explicit diagnostic presets, pose time, browser, viewport, DPR, renderer, capture commit and image hashes. Hero captures keep the UI and hide live FPS digits. Diagnostic shots hide UI overlays and include intentional framing for the mantle detail. Capture waits for fonts and at least two completed scene frames after freezing. Each case compares two fresh screenshots byte-for-byte and then uses a zero-changed-pixel regression check against the named golden. A different OS, GPU, font rasterizer or browser is a separate comparison lane.

Review failed diffs and captured JSON under `octo-evidence/test-results/` before updating any baseline. Save needed artifacts before rerunning the same suite. Use `npm run qa:browser -- capture.spec.js --update-snapshots` only for a deliberate golden change, and update capture provenance and image hashes together. Review the resulting images against the [reference rubric](VISUAL-TARGET.md). Benchmark samples and diagnostics remain ignored. To roll back, switch to the foundation checkout or remove this isolated worktree after retaining any authorized local evidence. A later integrated rollback should revert the Stage 2 commits together.

## Coverage and limits

Browser coverage includes desktop and touch-emulated orbit, wheel/pinch zoom, reset, pause/resume, reduced motion, viewport/orientation resize, WebGL 2, and forced WebGL initialization failure. The fallback test asserts the existing user-visible message and expected initialization exception. Healthy runs require zero browser warnings/errors, failed requests, and context losses. GNU/Linux, Safari, and physical mobile are unverified. The paired phone was offline during validation. Mobile emulation exercises Chromium on the Mac GPU and supplies no physical-mobile performance evidence.

## Measured baseline

Headed pinned Chromium reported ANGLE Metal on Apple M3 Max for both profiles. One foreground worker, 5 seconds warmup and three consecutive 15-second unpaused samples per profile. The timing signal is rAF cadence, which includes browser scheduling. GPU execution time and the physical display refresh were not verified.

| Profile | Trial | Frames | FPS | p50 / p95 / p99 (ms) | >16.7 ms | >33.3 ms |
| --- | ---: | ---: | ---: | --- | ---: | ---: |
| Desktop | 1 | 451 | 30.03 | 33.3 / 34.2 / 34.3 | 451 | 240 |
| Desktop | 2 | 451 | 30.02 | 33.3 / 34.2 / 34.3 | 451 | 228 |
| Desktop | 3 | 451 | 30.07 | 33.3 / 34.2 / 34.3 | 451 | 263 |
| Mobile emulation | 1 | 450 | 30.00 | 33.3 / 34.2 / 34.3 | 450 | 256 |
| Mobile emulation | 2 | 450 | 30.00 | 33.3 / 34.2 / 34.3 | 450 | 242 |
| Mobile emulation | 3 | 450 | 30.00 | 33.3 / 34.2 / 34.3 | 450 | 269 |

Both profiles peaked at 92 draw calls and 159,790 triangles per complete composer frame, with 15 textures and 79 geometries reported by Three.js. Desktop drawing buffer was 1440 × 900 (renderer/composer DPR 1/1). Mobile buffer was 585 × 721 (1.5/1). Approximate composer/bloom attachment storage was 40,604,400 bytes (38.72 MiB) desktop and 5,883,320 bytes (5.61 MiB) mobile. Estimates use measured target dimensions, RGBA16F at 8 bytes/pixel and 4 bytes/pixel for allocated depth, with no MSAA or mips in these targets. They exclude the default framebuffer, PMREM, buffers, textures outside these targets, driver overhead and browser memory. Local target layouts, counters and raw intervals are under `octo-evidence/performance/`.

Fresh-context navigation to the first QA readiness probe took about 290 ms desktop and 200 ms emulated, sampled once per profile on a localhost Vite dev server. This includes browser/test polling and may reuse server-side prebundling. It is not a production cold-load guarantee.

The observed desktop p95 of 34.2 ms missed the 18 ms target in this run. A comparable verified 60 Hz lane and the physical-mobile 34 ms gate remain unverified. A separate 10-second foreground blank-page run in the same headed browser measured 30.01 FPS and 33.3 / 34.1 / 34.3 ms p50/p95/p99. That control was within 0.1 ms of scene p95 and indicates a lane cadence limit. It does not isolate GPU headroom. After independent review and Stage 3 authorization, test a single continuous tapered tentacle sweep with seated roots and clear foreground/rear spacing, then compare it against these goldens and rerun on the same verified timing lane.

`npm run check` passed six tests and the production build, with the pre-existing entry-size warning. `npm audit` reported zero advisories at review time. The lockfile delta contains only the Playwright package family. All 13 capture/smoke tests passed again against the saved goldens with no updates. Both benchmark cases completed. Node emitted a color-environment warning during Playwright setup.
