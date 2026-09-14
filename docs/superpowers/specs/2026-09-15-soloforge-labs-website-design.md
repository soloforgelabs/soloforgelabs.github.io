# Design Specification: SoloForge Labs Website & Showcase Hub

**Date:** 2026-09-15  
**Brand:** SoloForge Labs  
**Repository:** [github.com/soloforgelabs/soloforgelabs.github.io](https://github.com/soloforgelabs/soloforgelabs.github.io)  
**Target Domain:** https://soloforgelabs.github.io/

---

## 1. Executive Summary & Brand Identity

**SoloForge Labs** is an independent software engineering studio and digital laboratory dedicated to crafting high-performance desktop utilities, focused developer tools, and intelligent mobile applications.

### Brand Positioning
* **Core Philosophy:** *\"Precision tools for speed, focus, and privacy. Engineered independently.\"*
* **Anti-Pattern (AI Slop Avoidance):** We intentionally avoid cheap, loud \"AI-powered\" marketing cliches. Modern users and engineers value reliability, performance, privacy, and craftsmanship. When AI is utilized (e.g. speech transcription or computer vision), it is framed as an engineered capability (*On-device Whisper*, *Zero-latency Cloud API*), not a promotional gimmick.
* **The Scribe Duality:** A signature highlight of the studio is the contrast between **BlinkScribe** (instant cloud transcription, zero CPU/RAM impact) and **DeskScribe** (100% offline, private on-device local models).

---

## 2. Visual Direction & Selected Design

The chosen design approach is **The Modular Suite Switcher** (inspired by the aesthetics and density of Vercel, Raycast, and JetBrains).

### Primary Reference: Main Hub Layout
![SoloForge Labs Modular Suite Design](../assets/selected_design_modular_suite.jpg)

### Secondary Reference: In-Depth Product Landing (Hybrid Architecture)
![Product Deep Dive Page Reference](../assets/product_landing_reference.jpg)

---

## 3. Information Architecture & Page Structure

### A. Global Navigation Bar (Header)
* **Logo:** Geometric digital forge / anvil emblem + crisp typographic title SoloForge Labs.
* **Navigation Links:**
  * **Products:** Quick jump to the suite stage.
  * **Philosophy:** The engineering principles of the studio.
  * **Changelog:** Recent releases and progress telemetry.
  * **GitHub:** Direct link to https://github.com/soloforgelabs.

### B. Hero Section
* **Title:** **SoloForge Labs**
* **Tagline:** *\"Crafting tools for developers and creators. High performance. Elegant design.\"*
* **Sub-manifesto:** Highlighting native speed, privacy by default, and craft.

### C. The Core Interactive Suite Stage (Heart of the Website)
A horizontal interactive pill-selector allowing visitors to inspect each product without page reloads:
`
[ ⚡ BlinkScribe | 🛡️ DeskScribe | 📐 SizeRadar | 🥗 FoodLens | 💓 VitalPulse ]
`

#### Active Product Display Specifications:
1. **⚡ BlinkScribe (Desktop / Windows):**
   * *Type:* Cloud-Accelerated Audio Transcription & Quick Notes.
   * *Key Specs:* 0ms local compute load, minimal RAM footprint (<30MB), ultra-low latency.
   * *CTAs:* Download (.exe) | View In-Depth Product Page & Docs →.
   * *Duality Switcher:* Quick toggle to compare with DeskScribe.

2. **🛡️ DeskScribe (Desktop / Windows):**
   * *Type:* 100% Offline & Private Local Audio Transcription.
   * *Key Specs:* Runs Whisper & Qwen locally, air-gapped security, zero telemetry.
   * *CTAs:* Download Installer (.exe) | Portable (.zip) | View In-Depth Product Page →.

3. **📐 SizeRadar (Desktop Utility):**
   * *Type:* Pixel-accurate screen layout, dimension & alignment inspection tool.
   * *Key Specs:* Native responsiveness, hotkey activation, zero lag.
   * *CTAs:* Download (.exe) | Explore Features →.

4. **🥗 FoodLens (Mobile / Android):**
   * *Type:* Smart Food Analysis & Nutrition Camera.
   * *Key Specs:* Instant visual macronutrient scanner, offline caching, zero ad bloat.
   * *CTAs:* Download Android APK | Explore Mobile App →.

5. **💓 VitalPulse / PulseTrack (Mobile / Android - In Development):**
   * *Type:* Personal Health Telemetry & Habit Monitor.
   * *Key Specs:* Blood pressure trend analysis, hydration reminders, medication schedules, 100% local database encryption.
   * *Status Badge:* In Active Development (Beta coming soon).

### D. Philosophy & Engineering Standards
* **Zero Bloat:** Lightning-fast cold start, no background telemetry, resource-conscious.
* **Privacy & Local Choice:** You decide whether your data stays offline or uses cloud acceleration.
* **Craftsmanship:** Designed with obsession over micro-interactions and developer keyboard shortcuts.

### E. Release Telemetry (Changelog)
* Compact cards highlighting latest release tags (e.g. *BlinkScribe v1.0.0 Initial Release*, *DeskScribe Local Model Support*).

### F. Global Footer
* Copyright © 2026 SoloForge Labs.
* Links: GitHub Organization, License, Feedback / Issues.

---

## 4. Technical Architecture for Implementation

* **Runtime / Bundler:** Vite
* **Framework:** React + TypeScript (or modern lightweight static bundle)
* **Styling:** Tailwind CSS (Obsidian dark palette: #090a0f, slate card borders, cyber-amber and violet glows)
* **Icons:** Lucide React
* **Hosting:** GitHub Pages via GitHub Actions (deploy to main root or gh-pages)

---

## 5. Next Steps
1. Review and approve this Design Specification document.
2. Formulate the technical implementation plan (creating project files, styling, interactive state, and deployment workflow).
