# OCTO walkthrough audio provenance

## Local synthesis

- **Model** · hexgrad Kokoro-82M v1.0, Apache-2.0. The original model card is pinned at `f3ff3571791e39611d31c381e3a41a3af07b4987`. The ONNX conversion and voice pack came from the Kokoro ONNX v1.0 model-files release (GitHub release ID `197246951` and asset IDs below). [Original model card](https://huggingface.co/hexgrad/Kokoro-82M/blob/f3ff3571791e39611d31c381e3a41a3af07b4987/README.md) · [ONNX release](https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.0)
- **Backend** · MIT-licensed `kokoro-onnx==0.4.9`, ONNX Runtime 1.32.0 and CPython 3.12.12 arm64, in an isolated environment on macOS. Preinstalled eSpeak NG 1.52.0 supplied the phonemizer library and dictionary after the bundled path failed. No global Python or Blender changes were needed. [Backend license](https://github.com/thewh1teagle/kokoro-onnx/blob/main/LICENSE)
- **Voice** · Stock US English `af_sarah` at 0.96× Kokoro speed, 24 kHz mono synthesis. Text was generated sentence by sentence with short joins and chapter pauses. No voice cloning, music, or remote speech processing was used.
- **Mastering** · FFmpeg 8.1.1 two-pass loudness normalization and AAC encoding. The existing seven visual chapters and shots were reused and retimed. The caption strip uses the same sentence timebase as the downloadable VTT and SRT.

| Download | Bytes | SHA-256 |
| --- | ---: | --- |
| `kokoro-v1.0.onnx` · asset `224414194` | 325,532,387 | `7d5df8ecf7d4b1878015a32686053fd0eebe2bc377234608764cc0ef3636a6c5` |
| `voices-v1.0.bin` · asset `227558528` | 28,214,398 | `bca610b8308e8d99f32e6fe4197e7ec01679264efed0cac9140fe9c29f1fbf7d` |

## Voice trials

All voices read the [same technical excerpt](voice-trials/trial-script.txt) with the same speed and gaps. Displayed peaks are from the raw trials. Published samples are loudness-matched.

| Voice | Duration | Raw peak amplitude | Local speech-recognition result |
| --- | ---: | ---: | --- |
| [af_sarah](voice-trials/af_sarah.mp3) · selected | 19.05 s | 0.832 | Recovered the complete excerpt and all technical terms. |
| [af_heart](voice-trials/af_heart.mp3) | 19.54 s | 0.696 | Recovered the excerpt but added a spurious closing phrase at the tail in the recognizer output. |
| [am_michael](voice-trials/am_michael.mp3) | 21.10 s | 0.919 | Recovered the complete excerpt. The render was slower and had less peak headroom. |

The selection used recognition, pacing, and peak headroom. Independent listening for naturalness and preference remains pending.

## Pronunciation and verification

The [exact synthesis input](spoken-script.md) spells out Three.js as “Three Jay Ess,” GLB as “Gee El Bee,” and WebGL as “Web Gee El.” The phonemizer output and local speech recognition were checked for these terms, plus Blender, Python, and Playwright. The final AAC track was decoded and transcribed locally using `faster-whisper==1.2.1`, CTranslate2 4.9.1, and the pinned Systran base.en conversion (MIT, 145,216,508-byte model file). Speech recognition is a check for intelligibility and omissions. It cannot establish human listening quality. [Recognition model](https://huggingface.co/Systran/faster-whisper-base.en/tree/3d3d5dee26484f91867d81cb899cfcf72b96be6c)

The [validation receipt](media-validation.json) records full audio/video decode, duration, peak levels, and cue counts. All 30 caption midpoints were checked against the rendered video, chapter timestamps were matched to the synthesis timeline, and Chromium playback reached the end.

[Archived original walkthrough and transcript](https://github.com/heyitschien/threejs-experiment-animations/tree/afba0d2e83d2fcb1408525306b8558d926f2a489)
