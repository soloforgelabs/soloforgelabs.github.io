<div align="center">

<img src="assets/branding/00_OFFICIAL_LOGO_SFL_FINAL.jpg" alt="SoloForge Labs Logo" width="220" />

# SoloForge Labs ⚡

> **Precision tools for speed, focus, and privacy. Engineered independently.**

[![Website](https://img.shields.io/badge/Website-soloforgelabs.github.io-00E5FF?style=for-the-badge&logo=firefox)](https://soloforgelabs.github.io/)
[![Releases](https://img.shields.io/badge/Releases-Scribe_Trinity_+_MeetScribe_Beta_Live-7C3AED?style=for-the-badge&logo=github)](https://github.com/soloforgelabs/soloforgelabs.github.io/releases)
[![Patreon Support](https://img.shields.io/badge/Support-Patreon_Shop-FF424D?style=for-the-badge&logo=patreon&logoColor=white)](https://www.patreon.com/SoloForgeLabs/shop)
[![Platform](https://img.shields.io/badge/Platform-Windows_10_%2F_11-0078D6?style=for-the-badge&logo=windows)](https://github.com/soloforgelabs/soloforgelabs.github.io/releases)

<p align="center">
  <a href="#-product-suite-matrix">Suite Matrix</a> •
  <a href="#-blinkscribe">BlinkScribe</a> •
  <a href="#%EF%B8%8F-deskscribe">DeskScribe</a> •
  <a href="#-voxscribe">VoxScribe</a> •
  <a href="#-the-scribe-trinity-comparison">Comparison</a> •
  <a href="#-verification--checksums">Verification</a> •
  <a href="#-support-independent-engineering">Support</a>
</p>

</div>

---

## 🏛️ Studio Philosophy

**SoloForge Labs** is an independent software and digital engineering laboratory. We build focused desktop utilities, developer tools, and mobile applications with obsessive attention to craftsmanship, system performance, and user privacy.

* **Zero AI Slop:** We intentionally reject loud, hollow "AI-powered" marketing hype. AI in our tools is strictly framed as an engineered capability (*On-device NVIDIA NeMo ONNX*, *On-device Whisper*, *Zero-latency Cloud LPU*), optimized for responsiveness and utility.
* **Respect for System Resources:** Our utilities start instantly, consume minimal memory, and leave no background telemetry footprint.
* **Direct Input Engineering:** All Scribe utilities bypass the system clipboard entirely, streaming Unicode text directly into active windows via low-level Win32 `SendInput` APIs.

---

## 🚀 Product Suite Matrix

| Product | Form Factor | Architecture | Status | Primary Capability |
| :--- | :--- | :--- | :--- | :--- |
| **⚡ [BlinkScribe](#-blinkscribe)** | Desktop (Windows) | Cloud-Accelerated LPU | **v1.5.0 Live** | Sub-second voice dictation, translation & business polish (<60 MB RAM) |
| **🛡️ [DeskScribe](#%EF%B8%8F-deskscribe)** | Desktop (Windows) | 100% Offline Local Whisper | **v1.5.0 Live** | Air-gapped 99-language Whisper & Qwen GGUF dictation (Zero Telemetry) |
| **🟣 [VoxScribe](#-voxscribe)** | Desktop (Windows) | 100% Offline NVIDIA NeMo ONNX | **v1.5.0 Live** | Next-gen Parakeet-TDT & Canary-1B dictation, live streaming & single-pass AST |
| **🎙️ [MeetScribe](#%EF%B8%8F-meetscribe-public-beta)** | Desktop (Windows) | Hybrid Dual WASAPI + CAM++ | **v1.5.0 Beta** | Dual mic+loopback meeting recorder, local speaker diarization & stealth overlay |
| **📐 SizeRadar** | Desktop Utility | Native Pixel & Storage Inspector | *RC Q4 2026* | Intelligent disk map, perceptual duplicate finder & dev debris cleaner |
| **🥗 FoodLens** | Mobile (Android) | On-device Computer Vision | *Roadmap* | Smart food macro identification & nutrition camera |
| **💓 PulseTrack** | Mobile (Android) | Encrypted Telemetry Suite | *Concept* | Private personal health tracker (blood pressure, hydration, medications) |

---

## ⚡ BlinkScribe

<div align="center">
  <p><strong>Featherweight, sub-second cloud-accelerated voice dictation for Windows.</strong></p>
  <p>
    <a href="https://github.com/soloforgelabs/soloforgelabs.github.io/releases/download/blinkscribe-v1.5.0/BlinkScribe_Setup_v1.5.0.exe"><strong>⬇️ Download Installer (45.9 MB)</strong></a> •
    <a href="https://github.com/soloforgelabs/soloforgelabs.github.io/releases/download/blinkscribe-v1.5.0/BlinkScribe_Portable_v1.5.0.zip"><strong>📦 Download Portable .ZIP (43.9 MB)</strong></a> •
    <a href="docs/blinkscribe/USER_GUIDE.md"><strong>📖 Full User Guide & API Setup →</strong></a>
  </p>
</div>

BlinkScribe is engineered for users who want immediate voice dictation without loading their machine's CPU/GPU or downloading heavy neural network weights. It floats as an unobtrusive, glowing acrylic **Voice Orb** over your desktop, ready to type wherever your cursor rests.

### Key Capabilities:
* **Sub-Second Response:** Audio is streamed to Groq LPU cloud engines running `whisper-large-v3-turbo` and `llama-3.3-70b-versatile` with turnaround times typically under 600 ms.
* **Minimal System Footprint:** Uses less than 60 MB of RAM with 0% local GPU/CPU load during transcription.
* **Clipboard Immunity:** Types directly into chats, IDEs, or documents via Win32 Unicode injection without clearing or corrupting your clipboard.
* **Two Core Modes & Quick Business Jump:**
  * 🟢 **Clean Dictation (`Ctrl+Shift+C`):** Adaptive speech cleanup and formatting in your original language.
  * 🔵 **Instant Translation (`Ctrl+Shift+T`):** Live speech-to-text translation into American or British English.
  * 🟣 **Adaptive Business Polish (`Ctrl+Shift+B`):** Quick jump directly to Level 3 (Business correspondence).
* **4-Tier Depth Control (`Ctrl+Shift+1..4`):** Seamlessly scale text restructuring from literal verbatim to academic publication (see below).
* **Free API Requirement:** Requires a free Groq Cloud API key ([How to get your free key in 60 seconds](docs/blinkscribe/USER_GUIDE.md#step-3-connect-your-free-groq-api-key)).

---

## 🎛️ 4-Tier Rewriting & Intelligence Engine

All three Scribe tools (**BlinkScribe**, **DeskScribe**, and **VoxScribe**) share our signature multi-level text refinement pipeline. You can switch rewriting depth on the fly via keyboard shortcuts (`Ctrl+Shift+1..4`) or by right-clicking the floating Voice Orb:

| Tier | Hotkey | Mode Style | What It Does & When to Use |
| :---: | :---: | :--- | :--- |
| **Level 1** | `Ctrl + Shift + 1` | **Literal Verbatim (Стенограмма)** | **100% word-for-word accuracy.** Bypasses LLM rewriting. No words added, removed, or rephrased. Essential for legal depositions, direct quotes, and exact code identifiers. |
| **Level 2** | `Ctrl + Shift + 2` | **Fluent Speech (Грамотная речь)** | **Natural conversational clarity.** Automatically strips filler words (*"uh"*, *"um"*, repetitions, stutters), corrects grammatical cases, and inserts natural punctuation without altering sentence structure. |
| **Level 3** | `Ctrl + Shift + 3`<br>`Ctrl + Shift + B` | **Business Polish (Деловой стиль)** | **Executive workplace correspondence.** Transforms casual verbal rambling into crisp, polite, and persuasive business writing tailored for Slack, Jira, GitHub reviews, and professional emails. |
| **Level 4** | `Ctrl + Shift + 4` | **Academic & Formal (Академический)** | **Rigorous analytical delivery.** Uses precise vocabulary, formal rhetoric, logical syntax, and structured reasoning suitable for research papers, official documentation, and executive summaries. |

---

## 🛡️ DeskScribe

<div align="center">
  <p><strong>100% Offline-First, zero-cloud 99-language Whisper voice dictation and local text refinement.</strong></p>
  <p>
    <a href="https://github.com/soloforgelabs/soloforgelabs.github.io/releases/download/deskscribe-v1.5.0/DeskScribe_Setup_v1.5.0.exe"><strong>⬇️ Download Installer (93.5 MB)</strong></a> •
    <a href="https://github.com/soloforgelabs/soloforgelabs.github.io/releases/download/deskscribe-v1.5.0/DeskScribe_v1.5.0_Portable.zip"><strong>📦 Download Portable .ZIP (143.6 MB)</strong></a> •
    <a href="docs/deskscribe/USER_GUIDE.md"><strong>📖 Full User Guide & Model Guide →</strong></a>
  </p>
</div>

DeskScribe is built for security professionals, legal/medical practitioners, enterprise teams with strict NDAs, and global workflows requiring **99+ languages** in air-gapped or offline environments. **Not a single byte of audio or text ever leaves your machine.**

### Key Capabilities:
* **Air-Gapped Privacy:** Zero network sockets opened, zero external APIs, zero telemetry.
* **In-Memory Audio Buffers:** Audio lives strictly in volatile memory (`io.BytesIO`) and is wiped upon transcription completion. No audio files are ever written to your hard drive.
* **Hardware-Aware Tensor Acceleration:** Automatically detects NVIDIA CUDA GPUs for high-speed inference; gracefully optimizes multi-threaded CPU execution on non-NVIDIA systems.
* **Integrated Local Engines:**
  * Speech-to-Text: `faster-whisper` (CTranslate2) with swappable Whisper models (`tiny`, `base`, `small`, `medium`, `large-v3-turbo`) across 99+ global languages.
  * Text Polish & Translation: Local `llama-cpp-python` running quantized GGUF models (`Qwen2.5-1.5B-Instruct`).

---

## 🟣 VoxScribe

<div align="center">
  <p><strong>100% Offline NVIDIA NeMo FastConformer voice dictation, realtime live streaming & single-pass translation.</strong></p>
  <p>
    <a href="https://github.com/soloforgelabs/soloforgelabs.github.io/releases/download/voxscribe-v1.5.0/VoxScribe_Setup_v1.5.0.exe"><strong>⬇️ Download Installer (59.1 MB)</strong></a> •
    <a href="https://github.com/soloforgelabs/soloforgelabs.github.io/releases/download/voxscribe-v1.5.0/VoxScribe_v1.5.0_Portable.zip"><strong>📦 Download Portable .ZIP (96.6 MB)</strong></a> •
    <a href="docs/voxscribe/USER_GUIDE.md"><strong>📖 Full User Guide & NVIDIA Models Manual →</strong></a>
  </p>
</div>

**VoxScribe** is our flagship next-generation offline voice assistant and the high-speed architectural brother to DeskScribe. It replaces OpenAI's autoregressive Whisper with **NVIDIA NeMo FastConformer** models (**`Parakeet-TDT-0.6B-v3`**, **`Canary-1B-v2`**, **`Parakeet-TDT-CTC-110M`**) running on a lightweight C++/ONNX runtime (`sherpa-onnx` & `onnx-asr`) — no heavy PyTorch or NeMo Toolkit required.

### Key Capabilities:
* **2x–4x Faster Decoding (TDT Architecture):** NVIDIA's **Token-and-Duration Transducer (TDT)** jointly predicts tokens and their durations, skipping blank audio frames to achieve **~307–439 ms** real hardware latency across 25 European languages (including EN, RU, UK, DE, FR, ES, IT, PL).
* **Structural Immunity to Silence Hallucinations:** Unlike Whisper, which can loop or invent *"Subtitles by..."* on quiet breaths, Transducer (TDT) and CTC models never hallucinate phantom words on silence.
* **True Realtime Live Streaming (Mode B):** Supports **Cache-Aware Streaming FastConformer** to type words directly into your active window *while you are still speaking* with 80–200 ms look-ahead latency.
* **Single-Pass Audio Translation (`Canary-1B-v2`):** Features an 8-step greedy acoustic language probe and translates spoken audio directly into English text (`X ↔ EN`) in a single neural pass without waiting for an LLM, or pairs with local **Qwen 2.5 GGUF** (with Semantic Negation Guard) for 4-tier Business & Academic refinement.
* **Silence-Aware Monologue Segmentation:** Automatically segments long recordings (>30s) in RAM at 50 ms minimum-RMS silence valleys (~25s windows), preventing quadratic $O(T^2)$ Conformer slowdowns.

---

## ⚖️ The Scribe Trinity (Comparison & Trade-Offs)

| Specification | ⚡ BlinkScribe | 🛡️ DeskScribe | 🟣 VoxScribe |
| :--- | :--- | :--- | :--- |
| **Architecture** | Cloud-Accelerated (Groq LPU) | 100% Offline (Local Whisper) | **100% Offline (NVIDIA NeMo ONNX)** |
| **Speech Model** | `whisper-large-v3-turbo` (Cloud) | `faster-whisper` (`tiny`..`large-v3`) | **`Parakeet-TDT-0.6B-v3` / `Canary-1B-v2` / `Parakeet-110M`** |
| **Language Coverage** | **99+ Global Languages** | **99+ Global Languages** (incl. Asian/ME) | **25 European Languages** (EN, RU, UK, DE, FR, ES, IT, PL...) |
| **Transcription Latency** | **Sub-second (~300–600 ms)** | ~350 ms (CUDA) to ~1.2 s (CPU) | **~307–439 ms (2x–4x faster via TDT frame-skipping)** |
| **Realtime Live Streaming?** | ❌ Batch after speech | ❌ Batch after speech (30s window) | **✅ Yes (Mode B: types words while you speak)** |
| **Silence Hallucinations?** | Filtered via prompts | Filtered (Seq2Seq can loop) | **🛡️ Structurally Immune (TDT/CTC never hallucinates)** |
| **Speech Translation** | Cloud Whisper / Llama 3.3 70B | Two-pass (Whisper + Qwen GGUF) | **Single-pass Native AST (`Canary-1B`) + Hybrid Qwen GGUF** |
| **Text Polish Model** | `llama-3.3-70b-versatile` (Cloud) | `Qwen2.5-1.5B-Instruct` (Local GGUF) | `Qwen2.5-1.5B/3B-Instruct` (Local GGUF + Negation Guard) |
| **RAM Footprint** | **< 60 MB** | ~800 MB to ~3.5 GB | **~600 MB to ~1.8 GB** |
| **Internet Required?** | Yes (Free Groq API key) | **No (100% Air-Gapped)** | **No (100% Air-Gapped)** |
| **Download Size** | **45.9 MB** (Setup) / **43.9 MB** (ZIP) | **93.5 MB** (Setup) / **143.6 MB** (ZIP) | **59.1 MB** (Setup) / **96.6 MB** (ZIP) |
| **Best Suited For** | Featherweight laptops, 0% GPU load | Global 99+ languages under NDA | **Fastest offline European ASR, live streaming & zero hallucinations** |

👉 *Read the complete pros & cons analysis in [docs/COMPARISON.md](docs/COMPARISON.md).*

---

## 🎙️ MeetScribe (Public Beta)

<div align="center">
  <p><strong>Hybrid meeting recorder, local NVIDIA Parakeet transcriber &amp; CAM++ speaker diarization for Windows.</strong></p>
  <p>
    <a href="https://github.com/soloforgelabs/soloforgelabs.github.io/releases/download/meetscribe-v1.5.0/MeetScribe_Setup_v1.5.0.exe"><strong>⬇️ Download Installer (149.4 MB)</strong></a> •
    <a href="https://github.com/soloforgelabs/soloforgelabs.github.io/releases/download/meetscribe-v1.5.0/MeetScribe_v1.5.0_Portable.zip"><strong>📦 Download Portable .ZIP (147.6 MB)</strong></a> •
    <a href="https://github.com/soloforgelabs/soloforgelabs.github.io/releases/tag/meetscribe-v1.5.0"><strong>📋 Beta Release Notes →</strong></a>
  </p>
</div>

* **Dual WASAPI Mic + Loopback Capture:** Records both your voice and remote Zoom/Teams/Meet audio directly on Windows without bots joining the call.
* **CAM++ 192-d Speaker Diarization:** Identifies and labels speakers locally using persistent voiceprints.
* **Screen-Share Stealth Overlay:** Protected with `WDA_EXCLUDEFROMCAPTURE` so live transcripts remain invisible during screen sharing.

---

## 🔒 Verification & Checksums

To verify the integrity and authenticity of downloaded binaries, compare the computed SHA-256 hash against the official cryptographic signatures below:

| File Name | Size | SHA-256 Hash |
| :--- | :--- | :--- |
| `BlinkScribe_Setup_v1.5.0.exe` | 45.9 MB | `D2069803318615DF865CC2BC80FD92E22B5F4EB7FF5CF0B851303FD6759676AF` |
| `BlinkScribe_Portable_v1.5.0.zip` | 43.9 MB | `AF778394E40FD846B4EF5476709FFAF91C31290360CFBBA8667C78D2D18AE943` |
| `DeskScribe_Setup_v1.5.0.exe` | 93.5 MB | `BC6021CB1ECAA548E08F938ABEB7226937549D40DD932EED9448DD061F2E180B` |
| `DeskScribe_v1.5.0_Portable.zip` | 143.6 MB | `7FBD0D0D3465BFF7A46C88D3217B1D4B61B02FA09473856D9120F0EC3F7BB5EF` |
| `VoxScribe_Setup_v1.5.0.exe` | 59.1 MB | `ACC789E0117344DA972BACB055A9EA146E79ACD579C7C7DEFC5C8593AE3DA4F7` |
| `VoxScribe_v1.5.0_Portable.zip` | 96.6 MB | `6D99D0B2E1827AC9515517DACE56564BBF949ECE7DA3C4EB702BB901FF9B1698` |
| `MeetScribe_Setup_v1.5.0.exe` | 149.4 MB | `6EA42F85FB8B9D24318B3E027B235DFD7BC337B0E61FE31B0EC9EF5DC6D8AB0B` |
| `MeetScribe_v1.5.0_Portable.zip` | 147.6 MB | `5769AB37554D1AEFC0FC6E63C2684CE3CCE07EB08A4291F93551E0F3A728FF1B` |

*(A raw checksum file is also provided at [docs/checksums.sha256](docs/checksums.sha256)).*

### PowerShell Verification Command:
```powershell
Get-FileHash .\VoxScribe_Setup_v1.5.0.exe -Algorithm SHA256
```

---

## 💬 Community, Issues & Feedback

SoloForge Labs utilities are distributed as closed-source freeware. We welcome all community feedback, bug reports, and feature proposals!

* 🐛 **Found a bug?** Submit a [Bug Report](https://github.com/soloforgelabs/soloforgelabs.github.io/issues/new?template=bug_report.md).
* 💡 **Have a feature idea?** Submit a [Feature Request](https://github.com/soloforgelabs/soloforgelabs.github.io/issues/new?template=feature_request.md).
* 📋 **Questions or Discussions?** Open a ticket in the [Issues tab](https://github.com/soloforgelabs/soloforgelabs.github.io/issues).

---

## 🧡 Support Independent Engineering & Licensing

SoloForge Labs products are built and maintained independently with unlimited free Verbatim dictation and 20 Free Pro Trial runs. Support ongoing development or unlock perpetual desktop licenses + Full-App Metallic & Coin Orb skins on our Patreon Shop:

* **$3 Bronze Supporter Tip** (`1 PC`): **Bronze Coin Orb + Full-App Bronze Skin** across all 3 apps (keeps Free Tier limits)
* **$5 Single Edition** (`1 PC`): Unlock 1 Scribe app + **Silver Coin Orb + Full-App Silver Skin**
* **$13 Duo Pack** (`2 PCs`): Unlock BlinkScribe + 1 Offline engine + **Gold Coin Orb + Full-App Gold Skin**
* **$15 Scribe Trinity** (`5 PCs`): Unlock all 3 Scribe apps + Browser Extension + **Platinum Coin Orb, Full-App Platinum Skin & Custom PNG Orb**

<div align="center">

[![Support on Patreon](https://img.shields.io/badge/Patreon-SoloForge_Labs_Shop-FF424D?style=for-the-badge&logo=patreon&logoColor=white)](https://www.patreon.com/SoloForgeLabs/shop)

**[👉 Support SoloForge Labs on Patreon Shop (patreon.com/SoloForgeLabs/shop)](https://www.patreon.com/SoloForgeLabs/shop)**

*Thank you for supporting independent software craftsmanship!*

</div>

---

<div align="center">
  <sub>© 2026 SoloForge Labs. All rights reserved. Precision tools for speed, focus, and privacy.</sub>
</div>
