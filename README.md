<div align="center">

<img src="assets/branding/00_OFFICIAL_LOGO_SFL_FINAL.jpg" alt="SoloForge Labs Logo" width="220" />

# SoloForge Labs ⚡

> **Precision tools for speed, focus, and privacy. Engineered independently.**

[![Website](https://img.shields.io/badge/Website-soloforgelabs.github.io-00E5FF?style=for-the-badge&logo=firefox)](https://soloforgelabs.github.io/)
[![Releases](https://img.shields.io/badge/Releases-v1.0.0_Live-7C3AED?style=for-the-badge&logo=github)](https://github.com/soloforgelabs/soloforgelabs.github.io/releases)
[![Ko-fi Support](https://img.shields.io/badge/Support-Buy_us_a_coffee-FF5E5B?style=for-the-badge&logo=kofi&logoColor=white)](https://ko-fi.com/soloforgelabs)
[![Platform](https://img.shields.io/badge/Platform-Windows_10_%2F_11-0078D6?style=for-the-badge&logo=windows)](https://github.com/soloforgelabs/soloforgelabs.github.io/releases)

<p align="center">
  <a href="#-product-suite-matrix">Suite Matrix</a> •
  <a href="#-blinkscribe">BlinkScribe</a> •
  <a href="#%EF%B8%8F-deskscribe">DeskScribe</a> •
  <a href="#-the-scribe-duality-comparison">Comparison</a> •
  <a href="#-verification--checksums">Verification</a> •
  <a href="#-support-independent-engineering">Support</a>
</p>

</div>

---

## 🏛️ Studio Philosophy

**SoloForge Labs** is an independent software and digital engineering laboratory. We build focused desktop utilities, developer tools, and mobile applications with obsessive attention to craftsmanship, system performance, and user privacy.

* **Zero AI Slop:** We intentionally reject loud, hollow "AI-powered" marketing hype. AI in our tools is strictly framed as an engineered capability (*On-device Whisper*, *Zero-latency Cloud LPU*), optimized for responsiveness and utility.
* **Respect for System Resources:** Our utilities start instantly, consume minimal memory, and leave no background telemetry footprint.
* **Direct Input Engineering:** Both Scribe utilities bypass the system clipboard entirely, streaming Unicode text directly into active windows via low-level Win32 `SendInput` APIs.

---

## 🚀 Product Suite Matrix

| Product | Form Factor | Architecture | Status | Primary Capability |
| :--- | :--- | :--- | :--- | :--- |
| **⚡ [BlinkScribe](#-blinkscribe)** | Desktop (Windows) | Cloud-Accelerated LPU | **v1.0.0 Live** | Sub-second voice dictation, translation & business polish (<60 MB RAM) |
| **🛡️ [DeskScribe](#%EF%B8%8F-deskscribe)** | Desktop (Windows) | 100% Offline Local Silicon | **v1.0.0 Live** | Air-gapped on-device Whisper & Qwen GGUF dictation (Zero Telemetry) |
| **📐 SizeRadar** | Desktop Utility | Native Pixel Inspector | *In Dev* | Real-time screen layout, spacing, and visual dimension inspector |
| **🥗 FoodLens** | Mobile (Android) | On-device Computer Vision | *Roadmap* | Smart food macro identification & nutrition camera |
| **💓 VitalPulse** | Mobile (Android) | Encrypted Telemetry Suite | *Concept* | Private personal health tracker (blood pressure, hydration, medications) |

---

## ⚡ BlinkScribe

<div align="center">
  <p><strong>Featherweight, sub-second cloud-accelerated voice dictation for Windows.</strong></p>
  <p>
    <a href="https://github.com/soloforgelabs/soloforgelabs.github.io/releases/download/v1.0.0/BlinkScribe_v1.0.0.exe"><strong>⬇️ Download BlinkScribe.exe (73 MB)</strong></a> •
    <a href="https://github.com/soloforgelabs/soloforgelabs.github.io/releases/download/v1.0.0/BlinkScribe_v1.0.0_Portable.zip"><strong>📦 Download Portable .ZIP (73 MB)</strong></a> •
    <a href="docs/blinkscribe/USER_GUIDE.md"><strong>📖 Full User Guide & API Setup →</strong></a>
  </p>
</div>

BlinkScribe is engineered for users who want immediate voice dictation without loading their machine's CPU/GPU or downloading heavy neural network weights. It floats as an unobtrusive, glowing acrylic **Voice Orb** over your desktop, ready to type wherever your cursor rests.

### Key Capabilities:
* **Sub-Second Response:** Audio is streamed to Groq LPU cloud engines running `whisper-large-v3-turbo` and `llama-3.3-70b-versatile` with turnaround times typically under 600 ms.
* **Minimal System Footprint:** Uses less than 60 MB of RAM with 0% local GPU/CPU load during transcription.
* **Clipboard Immunity:** Types directly into chats, IDEs, or documents via Win32 Unicode injection without clearing or corrupting your clipboard.
* **Three Core Modes & Essence Extraction:**
  * 🟢 **Clean Dictation (`Ctrl+Shift+C`):** Adaptive speech cleanup and formatting in your original language.
  * 🔵 **Instant Translation (`Ctrl+Shift+T`):** Live speech-to-text translation into American or British English.
  * 🟣 **Adaptive Business Polish (`Ctrl+Shift+B`):** Quick jump to Executive & Business correspondence.
  * 🟠 **Essence Summary (`Ctrl+Shift+S`):** Distills long rambles into bulleted key takeaways.
* **4-Tier Depth Control (`Ctrl+Shift+1..4`):** Seamlessly scale text restructuring from literal verbatim to academic publication (see below).
* **Free API Requirement:** Requires a free Groq Cloud API key ([How to get your free key in 60 seconds](docs/blinkscribe/USER_GUIDE.md#step-3-connect-your-free-groq-api-key)).

---

## 🎛️ 4-Tier Rewriting & Intelligence Engine

Both **BlinkScribe** and **DeskScribe** share our signature multi-level text refinement pipeline. You can switch rewriting depth on the fly via keyboard shortcuts (`Ctrl+Shift+1..4`) or by clicking the floating Voice Orb:

| Tier | Hotkey | Mode Style | What It Does & When to Use |
| :---: | :---: | :--- | :--- |
| **Level 1** | `Ctrl + Shift + 1` | **Literal Verbatim (Стенограмма)** | **100% word-for-word accuracy.** Bypasses LLM rewriting. No words added, removed, or rephrased. Essential for legal depositions, direct quotes, and exact code identifiers. |
| **Level 2** | `Ctrl + Shift + 2` | **Fluent Speech (Грамотная речь)** | **Natural conversational clarity.** Automatically strips filler words (*"uh"*, *"um"*, *"like"*, repetitions, stutters), corrects grammatical cases, and inserts natural punctuation without altering sentence structure. |
| **Level 3** | `Ctrl + Shift + 3`<br>`Ctrl + Shift + B` | **Business Polish (Деловой стиль)** | **Executive workplace correspondence.** Transforms casual verbal rambling into crisp, polite, and persuasive business writing tailored for Slack, Jira, GitHub reviews, and professional emails. |
| **Level 4** | `Ctrl + Shift + 4` | **Academic & Formal (Академический)** | **Rigorous analytical delivery.** Uses precise vocabulary, formal rhetoric, logical syntax, and structured reasoning suitable for research papers, official documentation, and executive summaries. |
| **Summary** | `Ctrl + Shift + S` | **Essence Summary (Выжимка сути)** | **Key points extractor.** Distills a long spoken stream of thought into concise, actionable bullet points. |

---

## 🛡️ DeskScribe

<div align="center">
  <p><strong>100% Offline-First, zero-cloud desktop voice dictation and local text refinement.</strong></p>
  <p>
    <a href="https://github.com/soloforgelabs/soloforgelabs.github.io/releases/download/v1.0.0/DeskScribe_Setup_v1.0.0.exe"><strong>⬇️ Download Installer (1.38 GB)</strong></a> •
    <a href="https://github.com/soloforgelabs/soloforgelabs.github.io/releases/download/v1.0.0/DeskScribe_v1.0.0_Portable.zip"><strong>📦 Download Portable .ZIP (1.96 GB)</strong></a> •
    <a href="docs/deskscribe/USER_GUIDE.md"><strong>📖 Full User Guide & Model Guide →</strong></a>
  </p>
</div>

DeskScribe is built for security professionals, legal/medical practitioners, enterprise teams with strict NDAs, and anyone working in air-gapped or offline environments. **Not a single byte of audio or text ever leaves your machine.**

### Key Capabilities:
* **Air-Gapped Privacy:** Zero network sockets opened, zero external APIs, zero telemetry.
* **In-Memory Audio Buffers:** Audio lives strictly in volatile memory (`io.BytesIO`) and is wiped upon transcription completion. No audio files are ever written to your hard drive.
* **Hardware-Aware Tensor Acceleration:** Automatically detects NVIDIA CUDA GPUs for high-speed inference; gracefully optimizes multi-threaded CPU execution on non-NVIDIA systems.
* **Integrated Local Engines:**
  * Speech-to-Text: `faster-whisper` (CTranslate2) with swappable Whisper models (`tiny`, `base`, `small`, `medium`, `large-v3-turbo`).
  * Text Polish & Translation: Local `llama-cpp-python` running quantized GGUF models (`Qwen2.5-1.5B-Instruct`).
* **Available Formats:** Clean Windows Installer with Desktop/Start Menu shortcuts, or fully self-contained Portable ZIP with pre-bundled runtime and models.

---

## ⚖️ The Scribe Duality (Comparison)

| Specification | ⚡ BlinkScribe | 🛡️ DeskScribe |
| :--- | :--- | :--- |
| **Architecture** | Cloud-Accelerated (Groq LPU) | 100% Offline (Local Hardware) |
| **Speech Model** | `whisper-large-v3-turbo` (Cloud) | `faster-whisper` (`base` default, up to `large-v3`) |
| **Text Polish Model** | `llama-3.3-70b-versatile` (Cloud) | `Qwen2.5-1.5B-Instruct` (Local GGUF) |
| **Transcription Latency** | **Sub-second (~300–600 ms)** | ~300ms (CUDA GPU) to ~1.2s (CPU) |
| **RAM Footprint** | **< 60 MB** | ~800 MB (Base model) to ~3.5 GB (Large model) |
| **Internet Required?** | Yes (Free Groq API key) | **No (Works 100% offline & air-gapped)** |
| **Data Privacy** | Encrypted TLS to Cloud API | **100% Air-Gapped. Zero bytes leave machine.** |
| **Download Size** | **~73 MB** | **~1.38 GB** (Setup) / **~1.96 GB** (Portable) |
| **Best Suited For** | Everyday speed, laptops, light systems | Confidential data, NDAs, planes, privacy purists |

👉 *Read the complete architectural analysis in [docs/COMPARISON.md](docs/COMPARISON.md).*

---

## 🔒 Verification & Checksums

To verify the integrity and authenticity of downloaded binaries, compare the computed SHA-256 hash against the official cryptographic signatures below:

| File Name | Size | SHA-256 Hash |
| :--- | :--- | :--- |
| `BlinkScribe_v1.0.0.exe` | 73.3 MB | `F33AF1D1E4F579E648A722851E40683F0930DB1039AC63B0920AB7ABDBA783A2` |
| `BlinkScribe_v1.0.0_Portable.zip` | 72.8 MB | `3FA25C875EA6B260AE34B5CDBDE47163C4629807A09CC003E52B942D3D9EBE8E` |
| `DeskScribe_Setup_v1.0.0.exe` | 1.38 GB | `931876E4E392E6A645F0F86050A2F98F6EB79FA8C472E6155048BDE9BF56AC48` |
| `DeskScribe_v1.0.0_Portable.zip` | 1.96 GB | `56BF5D6D53D268C08192088C1369247D1CEA358234A1300874FB4163E578A370` |

*(A raw checksum file is also provided at [docs/checksums.sha256](docs/checksums.sha256)).*

### PowerShell Verification Command:
```powershell
Get-FileHash .\DeskScribe_Setup_v1.0.0.exe -Algorithm SHA256
```

---

## 💬 Community, Issues & Feedback

SoloForge Labs utilities are distributed as closed-source freeware. We welcome all community feedback, bug reports, and feature proposals!

* 🐛 **Found a bug?** Submit a [Bug Report](https://github.com/soloforgelabs/soloforgelabs.github.io/issues/new?template=bug_report.md).
* 💡 **Have a feature idea?** Submit a [Feature Request](https://github.com/soloforgelabs/soloforgelabs.github.io/issues/new?template=feature_request.md).
* 📋 **Questions or Discussions?** Open a ticket in the [Issues tab](https://github.com/soloforgelabs/soloforgelabs.github.io/issues).

---

## ☕ Support Independent Engineering

SoloForge Labs products are built and maintained independently. If BlinkScribe or DeskScribe saves you time and elevates your daily workflow, consider supporting future development:

<div align="center">

[![Support on Ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/soloforgelabs)

**[👉 Support SoloForge Labs on Ko-fi (ko-fi.com/soloforgelabs)](https://ko-fi.com/soloforgelabs)**

*Thank you for supporting independent software craftsmanship!*

</div>

---

<div align="center">
  <sub>© 2026 SoloForge Labs. All rights reserved. Precision tools for speed, focus, and privacy.</sub>
</div>
