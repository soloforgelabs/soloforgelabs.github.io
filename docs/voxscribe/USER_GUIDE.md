# 🟣 VoxScribe — User Guide & NVIDIA NeMo ONNX Engine Manual

> **VoxScribe:** 100% Offline NVIDIA-Powered desktop voice dictation, realtime streaming, direct speech translation, and local text refinement for Windows.

[![Version](https://img.shields.io/badge/Version-1.0.0-7C3AED?style=flat)](https://github.com/soloforgelabs/soloforgelabs.github.io/releases)
[![Platform](https://img.shields.io/badge/Platform-Windows_10%2F11-0078D6?style=flat&logo=windows)](https://github.com/soloforgelabs/soloforgelabs.github.io/releases)
[![Engine](https://img.shields.io/badge/Engine-NVIDIA_NeMo_ONNX-76B900?style=flat&logo=nvidia&logoColor=white)](https://github.com/soloforgelabs/soloforgelabs.github.io/releases)
[![Privacy](https://img.shields.io/badge/Privacy-100%25_Air--Gapped-00E5FF?style=flat)](https://github.com/soloforgelabs/soloforgelabs.github.io/releases)
[![Support](https://img.shields.io/badge/Support-Ko--fi-FF5E5B?style=flat&logo=kofi&logoColor=white)](https://ko-fi.com/soloforgelabs)

---

## 🟣 What is VoxScribe?

**VoxScribe** is our flagship 100% offline desktop voice engine and the high-performance architectural brother to **DeskScribe**. While DeskScribe uses OpenAI's autoregressive Whisper (`faster-whisper`), VoxScribe replaces the entire speech recognition stack with **NVIDIA NeMo FastConformer** models (**Parakeet-TDT-0.6B-v3**, **Canary-1B-v2**, and **Parakeet-TDT-CTC-110M**) compiled into a lightweight C++/ONNX runtime (`sherpa-onnx` & `onnx-asr`).

### Why NVIDIA NeMo Over Whisper?
1. **2x–4x Faster Decoding (TDT Architecture):** Instead of generating tokens one by one like Whisper's Seq2Seq decoder, NVIDIA's **Token-and-Duration Transducer (TDT)** jointly predicts both the token and its temporal duration, skipping blank audio frames entirely. Real hardware latency averages **~307–439 ms**.
2. **True Zero-Hallucination Immunity:** Whisper is notorious for inventing phantom phrases (*"Subtitles by Amara.org"*, *"Thank you for watching"*) during pauses or quiet breaths. Transducer (TDT) and CTC acoustic models are structurally immune to silence hallucinations.
3. **True Realtime Live Streaming (Mode B):** Whisper is locked to 30-second chunk windows. VoxScribe supports **Cache-Aware Streaming FastConformer**, typing words directly into your active window *while you are still speaking* with 80–200 ms look-ahead latency.
4. **Single-Pass Direct Speech Translation (`Canary-1B-v2`):** Translates spoken audio across 25 European languages directly into English text (and vice versa) in a single neural pass (`Audio → Target Text`) without requiring an intermediate LLM translation step.
5. **Silence-Aware Long Monologue Segmentation:** Automatically splits long recordings (>30s) in RAM at 50 ms minimum-RMS silence valleys (~25s windows), preventing quadratic $O(T^2)$ self-attention slowdowns and cutting 60–120s monologue latency by more than 50%.

---

## 📦 Distribution Formats: Installer vs. Portable

VoxScribe is available in two standalone formats from [Releases](https://github.com/soloforgelabs/soloforgelabs.github.io/releases):

| Format | File | When to Choose |
| :--- | :--- | :--- |
| **Windows Installer** | `VoxScribe_Setup_v1.0.0.exe` | **Recommended:** Cleanly installs VoxScribe into Windows, creates Desktop & Start Menu shortcuts, and registers an uninstaller. Bundles the complete C++/ONNX runtime, Silero VAD v6, and llama-cpp engine. |
| **Portable Archive** | `VoxScribe_v1.0.0_Portable.zip` | **No installation needed:** Extract anywhere and run `Run_VoxScribe.bat` or `VoxScribe\VoxScribe.exe`. 100% self-contained without registry modifications. |

---

## 🧠 NVIDIA NeMo ONNX Model Catalog

You can download, verify (SHA-256), and hot-swap models anytime in **Settings** $\rightarrow$ **Models** or via the **Setup Wizard** without restarting the app:

| Model | Parameters / Size | Languages | Architecture | Best Suited For |
| :--- | :--- | :--- | :--- | :--- |
| **`parakeet-tdt-0.6b-v3`** *(Default)* | ~600M (~670 MB INT8) | **25 European languages** (EN, RU, UK, DE, FR, ES, IT, PL, etc.) | FastConformer + TDT (`sherpa-onnx`) | **Daily driver.** Built-in punctuation & capitalization, ~300–430 ms latency, zero silence hallucinations. |
| **`canary-1b-v2`** | ~1B (~981 MB INT8) | **25 European languages** | FastConformer + Transformer (`onnx-asr`) | **Multilingual ASR + Native AST.** Features an 8-step greedy acoustic language probe and single-pass `X ↔ EN` audio-to-text translation. |
| **`parakeet-tdt_ctc-110m`** | ~114M (~120 MB INT8) | English (`en`) | Hybrid TDT + CTC | **Ultra-lightweight English.** Blazingly fast on older office CPUs with minimal RAM footprint. |
| **`fastconformer-streaming`** | 110M–600M | EN / Multilingual | Cache-Aware Conformer | **Realtime Live Dictation (Mode B).** Types words incrementally as you speak. |

### Local LLM Refinement Engine (`llama-cpp-python` GGUF)
For 4-tier speech cleanup, adaptive business polish, and non-English target translation (`X → Y`), VoxScribe pairs NVIDIA ASR with local quantized **Qwen 2.5 Instruct GGUF** models (`0.5B`, `1.5B`, `3B`), protected by a **Semantic Negation Guard** (preserving Cyrillic prefix negations like *"неправильно"* and 34 English lexical negations) and **Sentence-Level Length Retry**.

---

## 🎯 How to Use

The glowing neon **Voice Orb** floats unobtrusively over your desktop:

1. Place your cursor in any application (IDE, Slack, Word, Telegram, browser).
2. Press **`Ctrl + Space`** (or enable **Hands-Free Silero VAD** mode).
3. Speak naturally. The Orb renders a 60 FPS live RMS audio waveform.
4. Press **`Ctrl + Space`** to finish (or let VAD auto-finalize on silence).
5. VoxScribe transcribes your speech in memory and streams Unicode keystrokes directly into your active window via Win32 `SendInput` (**Zero Clipboard Footprint**).

### Hotkeys & 4-Tier Rewriting Depth:
* **`Ctrl + Shift + C`** — Clean Dictation mode (Green Orb)
* **`Ctrl + Shift + T`** — Instant Translation mode (Blue Orb)
* **`Ctrl + Shift + B`** — Quick jump to Level 3 Business Polish (Purple Orb)
* **`Ctrl + Shift + 1..4`** — Switch rewriting depth on the fly:
  * **Level 1 (Literal Verbatim):** Pure NVIDIA NeMo output with native punctuation & capitalization (0% LLM latency).
  * **Level 2 (Fluent Speech):** Strips filler words, stutters, and self-corrections while keeping your natural tone.
  * **Level 3 (Business Polish):** Two-stage syntax elevation into crisp executive workplace prose.
  * **Level 4 (Academic & Formal):** Rigorous analytical and scholarly phrasing.

---

## ☕ Support Independent Engineering

If VoxScribe accelerates your workflow while keeping your voice 100% private and offline, consider supporting our independent studio:

👉 **[Support SoloForge Labs on Ko-fi](https://ko-fi.com/soloforgelabs)**
