# 🛡️ DeskScribe — User Guide & Local Engine Manual

> **DeskScribe:** 100% Offline-First, zero-cloud desktop voice dictation, transcription, and text refinement for Windows.

[![Version](https://img.shields.io/badge/Version-1.0.0-7C3AED?style=flat)](https://github.com/soloforgelabs/soloforgelabs.github.io/releases)
[![Platform](https://img.shields.io/badge/Platform-Windows_10%2F11-0078D6?style=flat&logo=windows)](https://github.com/soloforgelabs/soloforgelabs.github.io/releases)
[![Privacy](https://img.shields.io/badge/Privacy-100%25_Air--Gapped-00E5FF?style=flat)](https://github.com/soloforgelabs/soloforgelabs.github.io/releases)
[![Support](https://img.shields.io/badge/Support-Ko--fi-FF5E5B?style=flat&logo=kofi&logoColor=white)](https://ko-fi.com/soloforgelabs)

---

## 🛡️ What is DeskScribe?

DeskScribe is an autonomous, on-device voice dictation and text refinement tool engineered for maximum privacy and resilience. Whether you are handling confidential client data, medical/legal notes, proprietary codebase discussions under strict NDAs, or simply working without an internet connection, DeskScribe ensures **not a single byte of audio or text ever leaves your computer**.

### Key Highlights:
* **Air-Gapped & Zero Telemetry:** Runs entirely on your local silicon. No network calls, no cloud APIs, no external telemetry.
* **In-Memory Audio Architecture:** Audio recordings reside strictly in transient memory buffers (`io.BytesIO`) and are wiped immediately upon inference. Nothing is written to temp disk files.
* **Hardware-Aware Acceleration:** Automatically detects NVIDIA CUDA GPUs for high-speed tensor acceleration; gracefully falls back to multi-threaded CPU execution.
* **Full Model Autonomy:** Powered by local `faster-whisper` (CTranslate2) and local GGUF models via `llama-cpp-python`.
* **Zero Clipboard Interference:** Emits direct Unicode keystroke events via Win32 `SendInput`.

---

## 📦 Distribution Formats: Installer vs. Portable

DeskScribe is available in two distinct packages from [Releases](https://github.com/soloforgelabs/soloforgelabs.github.io/releases):

| Format | File | Size | When to Choose |
| :--- | :--- | :--- | :--- |
| **Windows Installer** | `DeskScribe_Setup_v1.0.0.exe` | ~1.38 GB | **Recommended:** Installs DeskScribe cleanly into Windows, creates Desktop & Start Menu shortcuts, registers an uninstaller. Bundles default local models and runtime libraries. |
| **Portable Archive** | `DeskScribe_v1.0.0_Portable.zip` | ~1.96 GB | **No installation needed:** Extract anywhere (e.g. `C:\Tools\DeskScribe` or a fast NVMe drive / USB). Fully self-contained with bundled models and CUDA runtime dependencies. |

---

## 🚀 Quick Start (Step-by-Step)

### Step 1: Install or Extract
* **Using Installer:** Run `DeskScribe_Setup_v1.0.0.exe` and follow the setup wizard.
* **Using Portable:** Extract `DeskScribe_v1.0.0_Portable.zip` into a folder with write permissions (e.g., `C:\DeskScribe`).

### Step 2: First Launch & Windows SmartScreen
When launching for the first time:
* Windows SmartScreen may show a protective prompt (common for independent open software without corporate signing certificates).
* Click **"More info"** $\rightarrow$ **"Run anyway"**.

### Step 3: Hardware Verification
On startup, DeskScribe inspects your hardware:
* **NVIDIA GPU Detected:** Automatically enables CUDA fp16 execution for sub-second recognition.
* **Standard / AMD / Intel CPU:** Automatically allocates optimal CPU worker threads (using int8 quantization) to ensure responsive performance without freezing your system.

---

## 🧠 Local Models Architecture

### 1. Whisper Speech Recognition Models (`faster-whisper`)
You can switch Whisper models anytime in **Settings** $\rightarrow$ **Local Speech Model**:

| Model | Weights Size | Speed on CPU | RAM / VRAM Required | Recommended Usage |
| :--- | :--- | :--- | :--- | :--- |
| **`tiny`** | ~75 MB | Extremely fast (~150ms) | < 500 MB | Fast notes on low-end laptops |
| **`base`** *(Default)* | ~145 MB | Very fast (~300ms) | < 1 GB | **Best balance** of speed and accuracy |
| **`small`** | ~480 MB | Moderate (~700ms) | < 2 GB | High accuracy for complex technical terminology |
| **`medium`** | ~1.5 GB | Deliberate | < 4 GB | Professional transcriptions |
| **`large-v3-turbo`**| ~1.6 GB | Real-time on CUDA | 4–6 GB VRAM | Maximum precision when GPU is present |

### 2. Text Refinement Models (GGUF via `llama-cpp-python`)
For stutter removal, capitalization, translation, and business polishing:
* Supports standard **GGUF** quantized models (`Q4_K_M`, `Q5_K_M`).
* Bundled/Recommended: **`Qwen2.5-1.5B-Instruct-Q4_K_M.gguf`** (~1.1 GB) — provides exceptional punctuation and tone adaptation at minimal computational cost.

---

## 🎯 How to Use

The glowing obsidian-violet **Voice Orb** floats above your active windows:

1. Click into any application where you wish to write.
2. Press **`Ctrl + Space`** (or double-click the Orb).
3. Speak naturally. The Orb pulses to indicate local audio capture.
4. Press **`Ctrl + Space`** to complete dictation.
5. Your local CPU/GPU processes the audio and types the refined text directly at your cursor.

### Operating Modes (Switch with Hotkeys):
* 🟢 **Clean Speech (`Ctrl + Shift + C`):** Pure local transcription with stutter/filler stripping.
* 🔵 **Translation (`Ctrl + Shift + T`):** Local speech translation into English.
* 🟣 **Business Polish (`Ctrl + Shift + B`):** Local LLM refines spoken phrasing into concise, professional prose.

---

## 🛠️ Troubleshooting & FAQ

#### Q: Can DeskScribe run completely without internet?
* **Yes, absolutely.** You can run DeskScribe with your network card disabled or in an air-gapped secure environment. All model weights and engines reside on your local disk.

#### Q: How do I enable GPU acceleration if I have an NVIDIA card?
* DeskScribe automatically detects NVIDIA drivers. In **Settings** $\rightarrow$ **Hardware**, ensure `Device` is set to `Auto` or `CUDA`.

#### Q: Can I bring my own custom GGUF models?
* **Yes.** In Settings $\rightarrow$ Local AI Models, point the GGUF model path to any custom HuggingFace GGUF model on your drive.

---

## ☕ Support Independent Engineering

If DeskScribe protects your privacy and enhances your workflow, support further updates and model optimizations:

👉 **[Support SoloForge Labs on Ko-fi](https://ko-fi.com/soloforgelabs)**
