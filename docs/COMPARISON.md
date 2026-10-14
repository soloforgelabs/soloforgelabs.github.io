# ⚡ The Scribe Trinity: BlinkScribe vs. DeskScribe vs. VoxScribe

> **Cloud LPU Speed vs. Offline Whisper Versatility vs. Offline NVIDIA NeMo Next-Gen — Which Engine Fits Your Workflow?**

SoloForge Labs engineered three specialized voice dictation applications designed around one shared mission: **frictionless voice-to-text dictation, live translation, and adaptive 4-tier text refinement directly into any active Windows application.**

All three applications share our signature floating acrylic **Voice Orb**, direct Win32 `SendInput` Unicode stream typing (**zero clipboard interference**), in-memory audio buffers (**zero `.wav` files written to disk**), and 4-tier rewriting depth (`Ctrl+Shift+1..4`). However, their underlying speech engines are purpose-built for different hardware profiles and privacy requirements.

---

## 📊 Comprehensive 3-Way Comparison Matrix

| Feature / Metric | ⚡ BlinkScribe | 🛡️ DeskScribe | 🟣 VoxScribe |
| :--- | :--- | :--- | :--- |
| **Core Architecture** | Cloud-Accelerated (Groq LPU) | 100% Offline (OpenAI Whisper Stack) | **100% Offline (NVIDIA NeMo ONNX Stack)** |
| **Speech Engine (ASR)** | `whisper-large-v3-turbo` (Cloud) | `faster-whisper` (CTranslate2 Seq2Seq) | **NVIDIA NeMo FastConformer** (`sherpa-onnx` / `onnx-asr`) |
| **Speech Models** | Cloud Managed | `tiny`, `base`, `small`, `medium`, `large-v3-turbo` | **`Parakeet-TDT-0.6B-v3`**, **`Canary-1B-v2`**, **`Parakeet-110M`** |
| **Supported Languages** | **99+ languages** (Global Whisper) | **99+ languages** (Global Whisper) | **25 European languages** (EN, RU, UK, DE, FR, ES, IT, PL, etc.) |
| **Transcription Latency** | **Sub-second (~300–600 ms)** | ~350 ms (CUDA GPU) to ~1.2 s (CPU) | **~307–439 ms (2x–4x faster via TDT frame-skipping)** |
| **Realtime Live Streaming?** | ❌ Batch after speech ends | ❌ Batch after speech ends (30s window) | **✅ Yes (Mode B: Cache-Aware Streaming types while you speak)** |
| **Silence Hallucinations?** | Filtered via prompts | Filtered (Seq2Seq can loop on silence) | **🛡️ Structurally Immune (TDT/CTC never invents phantom subtitles)** |
| **Speech Translation** | Cloud Whisper / Llama 3.3 70B | Two-pass (Whisper STT $\rightarrow$ Qwen GGUF) | **Single-pass Native AST (`Canary-1B-v2`)** + Hybrid Qwen GGUF |
| **Long Monologues (>60s)** | Cloud chunked | Fixed 30s sliding window | **Silence-Aware RMS Segmentation ($O(T)$ linear speed)** |
| **Text Polish Engine** | `llama-3.3-70b-versatile` (Cloud) | Local `llama-cpp-python` (`Qwen2.5` GGUF) | Local `llama-cpp-python` (`Qwen2.5` GGUF + Negation Guard) |
| **RAM Footprint** | **< 60 MB** | ~800 MB (`base`) to ~3.5 GB (`large`) | **~600 MB (`110M`) to ~1.8 GB (`Parakeet-0.6B` / `Canary-1B`)** |
| **Internet Required?** | **Yes** (Free Groq API key) | **No (100% Air-Gapped)** | **No (100% Air-Gapped)** |
| **Data Privacy** | Encrypted TLS to Cloud API | **Zero bytes leave machine** | **Zero bytes leave machine** |

---

## ⚖️ Deep-Dive: Pros & Cons of Each Scribe Engine

### 🟣 VoxScribe (Offline NVIDIA NeMo FastConformer / TDT / Canary)
**The Next-Gen Local Engine for European Languages & Realtime Dictation**
* ✅ **Pros (Where VoxScribe Wins):**
  * **2x–4x Faster Local Decoding:** NVIDIA's Token-and-Duration Transducer (`Parakeet-TDT-0.6B-v3`) predicts tokens and their durations simultaneously, skipping empty audio frames for ~307–439 ms turnaround even on CPU.
  * **Zero Silence Hallucinations:** Unlike Whisper, which can hallucinate *"Subtitles by..."* or repeat phrases on quiet sighs, TDT and CTC architectures never invent phantom words during pauses.
  * **True Realtime Live Streaming (Mode B):** Supports Cache-Aware Streaming FastConformer to type words into your active editor *as you speak* with 80–200 ms latency.
  * **Single-Pass Audio Translation (`Canary-1B-v2`):** Translates spoken Russian, Ukrainian, German, French, etc. directly into English text in a single pass without waiting for a separate LLM translation step.
  * **Unified ONNX Runtime:** Both Silero VAD v6 and NVIDIA ASR run on a unified C++/ONNX stack (`sherpa-onnx` / `onnxruntime`), eliminating OpenMP DLL clashes.
* ⚠️ **Cons / Trade-offs:**
  * **25 European Languages Focus:** `Parakeet-TDT-0.6B-v3` and `Canary-1B-v2` are specialized for 25 European languages (including EN, RU, UK, DE, FR, ES, IT, PL, NL, CS, PT, SV). They do **not** cover Asian or Middle Eastern languages (e.g., Japanese, Korean, Arabic, Chinese, Hindi) — use **DeskScribe** or **BlinkScribe** for those.
  * **Local Model Storage:** Requires ~670 MB (`Parakeet-0.6B`) to ~981 MB (`Canary-1B`) of disk space and ~1–2 GB RAM, whereas **BlinkScribe** uses <60 MB RAM.

---

### 🛡️ DeskScribe (Offline OpenAI Whisper CTranslate2 + Qwen GGUF)
**The Universal 99-Language Air-Gapped Workhorse**
* ✅ **Pros (Where DeskScribe Wins):**
  * **Global 99+ Language Coverage:** Because it runs OpenAI Whisper (`tiny` through `large-v3-turbo`), DeskScribe transcribes Chinese, Japanese, Korean, Arabic, Turkish, Hebrew, Hindi, and 90+ other languages completely offline.
  * **Ultra-Tiny Footprint Option:** Supports `whisper-tiny` (~75 MB) and `whisper-base` (~145 MB) for machines with very tight disk or memory budgets.
  * **Battle-Tested Whisper Ecosystem:** Ideal if your workflow relies on Whisper-specific acoustic behavior across global non-European languages under strict air-gapped NDAs.
* ⚠️ **Cons / Trade-offs:**
  * **Autoregressive Seq2Seq Overhead:** Decodes token-by-token over fixed 30-second windows, making it slower on CPU than NVIDIA's frame-skipping TDT architecture.
  * **Whisper Silence Sensitivity:** Requires post-processing filters to suppress Whisper's inherent tendency to hallucinate on background noise or silence.
  * **Batch-Only Mode:** Does not support live word-by-word streaming while speaking.

---

### ⚡ BlinkScribe (Cloud Groq LPU Whisper Turbo + Llama 3.3 70B)
**The Featherweight Sub-Second Cloud Sprinter**
* ✅ **Pros (Where BlinkScribe Wins):**
  * **Zero Local Hardware Load:** Uses **< 60 MB of RAM** and **0% local CPU/GPU**, preserving 100% of your laptop battery and thermal headroom.
  * **70-Billion Parameter Rewriting:** Uses cloud `llama-3.3-70b-versatile` for Level 3 (Business) and Level 4 (Academic) polishing, offering deeper stylistic nuance than small local 1.5B–3B GGUF models.
  * **Tiny ~61 MB Download:** No multi-hundred-megabyte neural weights to download or store locally.
* ⚠️ **Cons / Trade-offs:**
  * **Requires Internet & API Key:** Cannot operate in air-gapped networks, on airplanes without Wi-Fi, or without a free Groq Cloud API key.
  * **Cloud Data Transit:** Audio is transmitted over encrypted TLS to Groq's cloud LPUs (though never stored on disk), which may not be permitted under strict enterprise/legal/medical air-gap policies.

---

## 🎯 Decision Tree: Which Scribe Should You Choose?

```text
Do you require 100% Offline / Air-Gapped Privacy (Zero Cloud, Zero Network)?
 ├── NO  ──▶ Choose ⚡ BlinkScribe
 │            (Featherweight <60 MB RAM, 0% GPU load, Llama-3.3-70B cloud polish)
 │
 └── YES (100% Offline Local Execution)
      │
      Do you dictate in English, Russian, Ukrainian, or other European languages (25 langs)
      and want 2x–4x faster decoding, zero silence hallucinations, or live streaming?
       ├── YES ──▶ Choose 🟣 VoxScribe
       │            (NVIDIA NeMo Parakeet-TDT & Canary-1B ONNX, ~307ms latency, Live Stream)
       │
       └── NO (Need Asian/Middle-Eastern/99+ global languages or ultra-small 75MB model)
            └──▶ Choose 🛡️ DeskScribe
                  (Local faster-whisper CTranslate2, 99+ languages, tiny..large-v3-turbo)
```

---

## 🔗 Quick Links

* [🟣 VoxScribe User Guide & NVIDIA Model Manual](voxscribe/USER_GUIDE.md)
* [🛡️ DeskScribe User Guide](deskscribe/USER_GUIDE.md)
* [⚡ BlinkScribe User Guide](blinkscribe/USER_GUIDE.md)
* [📦 Download Releases](https://github.com/soloforgelabs/soloforgelabs.github.io/releases)
* [☕ Support SoloForge Labs on Ko-fi](https://ko-fi.com/soloforgelabs)
