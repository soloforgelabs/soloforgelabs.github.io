# ⚡ SoloForge Labs — Master Session Context & Project State

> **Persistent handover document:** This file captures the full state, technical decisions, branding assets, donation configurations, and roadmap for SoloForge Labs. Any new agent or chat session can immediately read this file to pick up development from the exact last step.

**Last Updated:** 2026-09-16  
**Primary Workspace:** `d:/Antigravity/SoloForgeLabs` (also aliased via Directory Junction `d:/Antigravity/SoloDevStudio`)  
**Git Repository:** `https://github.com/soloforgelabs/soloforgelabs.github.io` (`main` branch)  
**Live Website URL:** `https://soloforgelabs.github.io/`  
**Ko-fi Creator Profile:** `https://ko-fi.com/soloforgelabs`

---

## 1. Studio Identity & Brand Assets

* **Official Studio Name:** **SoloForge Labs**
* **Core Philosophy:** *"Precision tools for speed, focus, and privacy. Engineered independently."*
* **Anti-Pattern (AI Slop Avoidance):** We intentionally avoid cheap, loud "AI-powered" marketing hype. AI is framed as an engineered capability (*On-device Whisper*, *Zero-latency Cloud API*), emphasizing craftsmanship, performance, and privacy.
* **Official Logo Asset:**
  * File: `assets/branding/00_OFFICIAL_LOGO_SFL_FINAL.jpg`
  * Concept: Cyber-Forge Crest — inverted aerodynamic delta-wing monogram integrating **S**, **F**, and **L** in glowing neon cyan/mint on deep obsidian.
* **Website Layout & UI Spec:**
  * Spec Doc: `docs/superpowers/specs/2026-09-15-soloforge-labs-website-design.md`
  * Approved Design: **The Modular Suite Switcher** (inspired by Vercel, Raycast, and JetBrains).
  * Mockups: 
    * Main Suite Hub: `assets/mockups/01_selected_modular_suite_hub.jpg`
    * Product Deep Dive: `assets/mockups/02_product_deep_dive_page.jpg`

---

## 2. Product Portfolio & Technical Architecture

### ⚡ A. BlinkScribe
* **Path:** `d:/Antigravity/BlinkScribe`
* **Type:** Windows Desktop App (PySide6, Win32 DirectInput, Audio Stream).
* **Concept:** Featherweight, ultra-low latency cloud-accelerated voice dictation, instant translation, and adaptive business polish.
* **Tech Stack:**
  * Speech-to-Text: Groq Cloud API (`whisper-large-v3-turbo` with fallback to `whisper-large-v3`).
  * LLM Polish: `llama-3.3-70b-versatile` (with fallback cascade).
  * System Impact: Extremely low (<60 MB RAM), 0% local GPU load.
  * Win32 DirectInput: Streams typed text directly via `SendInput` Unicode events without touching the system clipboard.
  * Requirement: Free Groq API key (`https://console.groq.com/keys`).

### 🛡️ B. DeskScribe
* **Path:** `d:/Antigravity/DeskScribe`
* **Type:** Windows Desktop App (PySide6, Win32 DirectInput, Local In-Memory Audio).
* **Concept:** 100% Offline-First, zero-cloud desktop voice dictation and text refinement.
* **Tech Stack:**
  * Speech-to-Text: Local `faster-whisper` (CTranslate2) with local Whisper models (`tiny`, `base`, `small`, `medium`, `large-v3-turbo`).
  * LLM Polish: Local `llama-cpp-python` with quantized GGUF models (`Qwen2.5`).
  * Hardware Detection: Auto-detects NVIDIA CUDA GPU; gracefully falls back to multi-core CPU.
  * Privacy & Security: Absolute data sovereignty; zero bytes sent over the network. In-memory audio buffers (`io.BytesIO`).
  * System Impact: Requires disk space for model weights (~150MB to 1.5GB) and RAM/VRAM during inference.

### 📐 C. SizeRadar
* **Path:** `d:/Antigravity/SizeRadar`
* **Type:** Desktop Utility.
* **Concept:** Real-time visual screen sizing, spacing, and layout dimension inspector.

### 🥗 D. FoodLens
* **Path:** `d:/Antigravity/FoodLens`
* **Type:** Android Mobile App (Flutter / Computer Vision).
* **Concept:** Smart food and nutrition camera scanner for instant dietary analysis.

### 💓 E. VitalPulse (formerly PulseTrack)
* **Status:** In concept / early development.
* **Concept:** Personal health telemetry suite (blood pressure log, hydration tracker, medication reminders).

---

## 3. Monetization & Donation System (Ko-fi + PayPal)

* **Platform:** Ko-fi (`https://ko-fi.com/soloforgelabs`).
* **Backend:** Connected to verified PayPal personal account.
* **Why Ko-fi:** Solves the Ukrainian PayPal restriction (`paypal.me` custom links do not exist for Ukrainian personal accounts). Ko-fi serves as a public frontend with 0% platform fee, shielding the developer's personal PayPal email from scrapers and maintaining clean donation/gift status.
* **Settings Configured:**
  * Display Name: `SoloForge Labs`
  * Avatar: Official SFL Cyber-Forge logo uploaded.
  * Donation Unit: `$3.00` (Call to action: *"Donate"*).
  * Auto Thank You Note: Configured with gratitude and mission context.
* **Developer Blog / Devlog on Ko-fi:**
  * Can be used for "Build in Public" release notes, screenshots, feature polls, and behind-the-scenes engineering logs.

---

## 4. Prepared Artifact: First Ko-fi Blog Post

A ready-to-publish introductory post comparing **BlinkScribe** and **DeskScribe**:

### English Title:
> **BlinkScribe vs. DeskScribe: Cloud Speed vs. 100% Offline Privacy — Which One Fits Your Workflow?**

### English Body:
```markdown
Welcome to the first dev log from **SoloForge Labs**! 🚀

Today, we want to introduce two sister tools built to solve one everyday developer and creator pain point: **effortless voice-to-text dictation, instant translation, and adaptive business polish directly into any active Windows application.**

Both apps share the same DNA — our signature floating acrylic neon Voice Orb, direct Unicode stream typing (zero clipboard interference), and three distinct modes:
* 🟢 **Clean Dictation:** Transcribes your speech while removing stutters, filler words, and adding punctuation.
* 🔵 **Instant Translation:** Live speech-to-text translation into English on the fly.
* 🟣 **Adaptive Business Polish:** Refines casual, rambling voice notes into clear, articulate business correspondence.

However, they were built for two fundamentally different working environments. Here is how to choose between them:

---

### ⚡ 1. BlinkScribe: Featherweight & Sub-Second Cloud Speed

If you want immediate voice dictation without loading your laptop’s CPU/GPU or downloading heavy model weights, **BlinkScribe** is built for you.

* **How it works:** Audio is securely streamed to the blazing-fast Groq LPU cloud engine.
* **Models:** Uses state-of-the-art `whisper-large-v3-turbo` for speech recognition and `llama-3.3-70b-versatile` for lightning-fast business text polishing.
* **System Footprint:** Extremely light (<60 MB RAM). Starts instantly and runs smoothly even on older laptops.
* **What you need:** A free Groq API key.
  👉 *How to get it:*
  1. Visit https://console.groq.com/keys
  2. Sign in with your Google or GitHub account
  3. Click **"Create API Key"**, copy it, and paste it into BlinkScribe’s settings dialog. That’s it!

---

### 🛡️ 2. DeskScribe: 100% Offline, Zero-Cloud & Ultimate Privacy

If you handle confidential business meetings, NDAs, medical/legal notes, or simply work without a stable internet connection, **DeskScribe** keeps everything on your own silicon.

* **How it works:** 100% Offline-First. Not a single byte of audio or text ever leaves your computer.
* **Hardware-Aware:** When launched, DeskScribe inspects your machine. If an NVIDIA GPU is detected, it utilizes CUDA acceleration; otherwise, it seamlessly optimizes for multi-threaded CPU execution.
* **Local Models:** DeskScribe prompts you to download your preferred local Whisper models (from lightweight `tiny`/`base` up to high-precision `medium` or `large-v3-turbo` via `faster-whisper`), as well as local GGUF models (`Qwen2.5`) for text polishing.
* **Trade-off:** Requires disk space for local models (from ~150 MB to 1.5 GB) and takes computer RAM/VRAM during speech processing, but guarantees **absolute data sovereignty and zero recurring API costs**.

---

### 💡 The Philosophy Behind SoloForge Labs
We don't believe in "one size fits all" software. Whether you need the instantaneous, featherweight speed of **BlinkScribe** or the airtight, local-only privacy of **DeskScribe**, you get the exact same sleek, distraction-free desktop experience.

Thank you for stopping by! If you find these tools useful, dropping a coffee here directly supports independent, craftsmanship-driven open software development. ☕✨
```

---

## 5. Immediate Next Steps & Roadmap

When returning to this project in any chat session, the agreed workflow is:

1. **Embed Ko-fi Donation Links in Desktop Apps:**
   * **BlinkScribe:** Add Ko-fi badge & link (`https://ko-fi.com/soloforgelabs`) to `README.md` and UI About dialog / HUD popup.
   * **DeskScribe:** Add Ko-fi badge & link (`https://ko-fi.com/soloforgelabs`) to `README.md` and UI About dialog / HUD popup.
2. **Build the SoloForge Labs Showcase Website:**
   * Directory: `d:/Antigravity/SoloForgeLabs/website` (or root deployment for GitHub Pages).
   * Implement the approved **Modular Suite Switcher** with dark obsidian theme, neon accents, interactive product tabs, and links to downloads and Ko-fi.
   * Deploy to GitHub Pages (`soloforgelabs.github.io`).
3. **Publish First Blog Post on Ko-fi:**
   * Paste the prepared post, attach the official logo cover image, and publish publicly.
