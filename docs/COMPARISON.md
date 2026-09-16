# ⚡ The Scribe Duality: BlinkScribe vs. DeskScribe

> **Cloud Speed vs. 100% Offline Privacy — Which Engine Fits Your Workflow?**

SoloForge Labs engineered two sister applications designed to solve one universal pain point: **frictionless voice-to-text dictation, live translation, and adaptive text polish directly into any active Windows application.**

While both applications share our signature floating acrylic Voice Orb, direct Unicode stream typing (zero clipboard interference), and three operational modes, their underlying architectures are fundamentally different.

---

## 📊 Comprehensive Comparison Matrix

| Feature / Metric | ⚡ BlinkScribe | 🛡️ DeskScribe |
| :--- | :--- | :--- |
| **Architecture** | Cloud-Accelerated (Groq LPU) | 100% Offline-First (Local Silicon) |
| **Speech Recognition** | `whisper-large-v3-turbo` | `faster-whisper` (CTranslate2) |
| **Local Speech Models** | None (Cloud inference) | `tiny`, `base`, `small`, `medium`, `large-v3-turbo` |
| **Text Polish Engine** | `llama-3.3-70b-versatile` | Local `llama-cpp-python` (`Qwen2.5` GGUF) |
| **4-Tier Rewriting Depth**| ✅ Full Support (`Ctrl+Shift+1..4`) | ✅ Full Support (`Ctrl+Shift+1..4`) |
| **Transcription Latency** | **Sub-second (~300–600 ms)** | ~300ms (CUDA GPU) to ~1.2s (Multi-core CPU) |
| **RAM Consumption** | **< 60 MB** | ~800 MB (Base model) to ~3.5 GB (Large model) |
| **GPU / CPU Load** | **0% local compute load** | Uses local NVIDIA CUDA cores or multi-core CPU |
| **Internet Connection** | **Required** (Secure HTTPS API) | **None required (Air-gapped capable)** |
| **Data Privacy** | Audio streamed over TLS to Groq API | **Zero bytes leave machine; in-memory buffers only** |
| **Installation Size** | **~73 MB** (Single portable executable) | **~1.38 GB** (Setup) / **~1.96 GB** (Portable with models) |
| **Account / Setup** | Free Groq API key needed | **Zero accounts, zero keys, zero signups** |
| **Recommended Environment**| Laptops, ultra-portables, fast everyday work | Confidential meetings, NDAs, planes, air-gapped labs |

---

## 🎯 Which One Should You Choose?

```
Do you handle strictly confidential, NDA, or medical/legal data?
 ├── YES ──▶ Choose 🛡️ DeskScribe (100% air-gapped, zero telemetry)
 └── NO
      │
      Does your PC have limited RAM (<8 GB) or an older CPU without NVIDIA GPU?
       ├── YES ──▶ Choose ⚡ BlinkScribe (Featherweight, 0% local load)
       └── NO
            │
            Do you work frequently on airplanes, remote locations, or offline?
             ├── YES ──▶ Choose 🛡️ DeskScribe (Runs anywhere without internet)
             └── NO  ──▶ Choose ⚡ BlinkScribe (Sub-second cloud response)
```

---

## 🔄 The Hybrid Workflow

Many professionals keep **both tools installed**:
* **BlinkScribe** as the daily default driver: always running in the background, consuming practically zero battery and RAM, delivering instant dictation in emails, chats, and code reviews.
* **DeskScribe** pinned for confidential sessions: activated during private client meetings, proprietary code discussions, or when traveling without stable Wi-Fi.

---

## 🔗 Quick Links

* [⚡ BlinkScribe User Guide](blinkscribe/USER_GUIDE.md)
* [🛡️ DeskScribe User Guide](deskscribe/USER_GUIDE.md)
* [📦 Download Releases](https://github.com/soloforgelabs/soloforgelabs.github.io/releases)
* [☕ Support SoloForge Labs on Ko-fi](https://ko-fi.com/soloforgelabs)
