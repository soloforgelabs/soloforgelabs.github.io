# ⚡ BlinkScribe — User Guide & Setup Manual

> **BlinkScribe:** Featherweight, sub-second cloud-accelerated voice dictation, instant translation, and adaptive business polish for Windows.

[![Version](https://img.shields.io/badge/Version-1.4.0-00E5FF?style=flat)](https://github.com/soloforgelabs/soloforgelabs.github.io/releases)
[![Platform](https://img.shields.io/badge/Platform-Windows_10%2F11-0078D6?style=flat&logo=windows)](https://github.com/soloforgelabs/soloforgelabs.github.io/releases)
[![Patreon](https://img.shields.io/badge/Support-Patreon_Shop-FF424D?style=flat&logo=patreon&logoColor=white)](https://www.patreon.com/SoloForgeLabs/shop)

---

## 🌟 What is BlinkScribe?

BlinkScribe is a precision desktop voice assistant designed for developers, writers, and power users. It floats unobtrusively over all active windows as a glowing neon acrylic Voice Orb. 

When you dictate, BlinkScribe captures audio in memory, streams it to Groq's high-speed cloud LPU inference engines, and types the refined text directly into whichever application has keyboard focus (Word, VS Code, Telegram, browser, terminal).

### Key Highlights:
* **Zero Clipboard Interference:** Uses Win32 `SendInput` Unicode streaming. Your clipboard history remains completely untouched.
* **Featherweight Footprint:** Consumes less than 60 MB of RAM with 0% local CPU/GPU load during transcription.
* **Sub-Second Latency:** Speech-to-text turnaround typically takes under 600 ms via `whisper-large-v3-turbo`.
* **Three Operating Modes:** Clean Speech, Instant English Translation, and Adaptive Business Polish.

---

## 🚀 Quick Start (Step-by-Step)

### Step 1: Download & Location
1. Download **`BlinkScribe_Setup_v1.4.0.exe`** (44.8 MB) or **`BlinkScribe_Portable_v1.4.0.zip`** (42.8 MB) from [Releases](https://github.com/soloforgelabs/soloforgelabs.github.io/releases).
2. You can install via the Setup wizard or extract the Portable archive (no installation required).
3. *Recommended (Portable):* Extract into a folder (e.g., `C:\Tools\BlinkScribe`) so that its runtime settings stay neatly grouped.

### Step 2: First Launch & Windows SmartScreen
Because BlinkScribe is an independently built executable without an expensive corporate EV certificate, Windows SmartScreen may show an alert:
* Click **"More info"** (*Подробнее*).
* Click **"Run anyway"** (*Выполнить в любом случае*).

### Step 3: Connect Your Free Groq API Key
On initial launch, the Settings window opens automatically:
1. Visit the Groq Cloud Console: [https://console.groq.com/keys](https://console.groq.com/keys)
2. Sign in with your Google or GitHub account.
3. Click **"Create API Key"**, provide a name, and copy the generated key (`gsk_...`).
4. Paste it into the **"Groq API Key"** field in BlinkScribe Settings.
5. Click **"Test Connection"** $\rightarrow$ **"Save & Apply"**.

*(Groq provides a generous free tier that is more than sufficient for thousands of dictations per day).*

---

## 🎯 How to Use

Once launched, the floating neon **Voice Orb** appears on your screen. You can drag and drop it anywhere.

### 🎙️ Recording & Typing:
1. Place your text cursor into any target application (chat, code editor, email).
2. Press the global hotkey: **`Ctrl + Space`** (or double-click the Voice Orb).
3. Speak naturally. The Orb will pulse with a rhythmic glow matching your voice intensity.
4. Press **`Ctrl + Space`** again to finish recording.
5. Within fractions of a second, the transcribed and polished text is typed directly at your cursor!

---

## 🎛️ Modes & 4-Tier Rewriting Levels

BlinkScribe provides both dedicated task modes and a granular 4-tier rewriting depth controller.

### 1. Global Operating Modes:

| Mode | Shortcut | Default Glow | Description |
| :--- | :--- | :--- | :--- |
| **Clean Dictation** | `Ctrl + Shift + C` | 🟢 Neon Green | Transcribes speech in your native language, strips filler words, and refines grammar according to your selected tier. |
| **Instant Translation** | `Ctrl + Shift + T` | 🔵 Electric Blue | Transcribes speech in any language and instantly translates it into fluent English (American or British dialect). |
| **Business Jump** | `Ctrl + Shift + B` | 🟣 Cyber Violet | Instant shortcut directly to **Level 3 (Business Polish)** for professional correspondence. |

---

### 2. The 4 Rewriting Tiers (`Ctrl + Shift + 1..4`):

You can change the rewriting depth at any second using keyboard shortcuts or by clicking the Voice Orb:

| Tier | Shortcut | Badge | Style & Behavior |
| :---: | :---: | :---: | :--- |
| **Level 1 (Low)** | `Ctrl + Shift + 1` | `1` | **Literal Verbatim (Стенограмма):** 100% word-for-word transcript directly from Whisper STT without LLM intervention. Preserves every word, hesitation, and exact naming verbatim. |
| **Level 2 (Middle)** | `Ctrl + Shift + 2` | `2` | **Fluent Speech (Грамотная речь):** Cleans up stuttering, removes filler words (*"uh"*, *"um"*, *"like"*, repetitions), fixes punctuation and case endings while keeping your original phrasing natural. |
| **Level 3 (High)** | `Ctrl + Shift + 3`<br>`Ctrl + Shift + B` | `3` | **Business Polish (Деловой стиль):** Re-structures verbal speech into concise, professional business prose ideal for Jira tickets, Slack updates, client emails, and pull request reviews. |
| **Level 4 (Extra-High)** | `Ctrl + Shift + 4` | `4` | **Academic & Formal (Академический):** Elevates speech to rigorous academic and executive language with precise technical terminology and formal logic. |

---

## ⚙️ Settings & Customization

Right-click the Voice Orb and select **"Settings"**:
* **Appearance & Glow:** Customize the exact RGB glow colors for each of the three modes.
* **Dark / Light Theme:** Toggle settings interface theme.
* **Audio Input Device:** Select a specific microphone hardware input.
* **English Dialect:** Choose between US or UK English for translation mode.
* **Quota Inspector:** Single left-click on the Orb to view your live Groq daily API quota and token telemetry.

---

## 🛠️ Troubleshooting & FAQ

#### Q: The Orb is not pulsing when I speak.
* **Resolution:** Ensure microphone permissions are enabled for desktop applications in Windows:
  `Settings` $\rightarrow$ `Privacy & Security` $\rightarrow$ `Microphone` $\rightarrow$ Turn on *"Let desktop apps access your microphone"*.

#### Q: SmartScreen blocks the application.
* **Resolution:** Click "More info" and "Run anyway". All binaries are compiled directly from source and verified with SHA-256 checksums.

#### Q: API error indicator on the Orb.
* **Resolution:** Single-click the Orb to view API telemetry. Verify your internet connection and ensure your Groq API key is valid and not expired.

---

## 🧡 Support Independent Engineering & Licensing

If BlinkScribe speeds up your daily workflow, consider supporting ongoing development or unlocking a lifetime license & metallic Voice Orb skins ($3 Bronze Tip / $5 Single / $13 Duo / $15 Scribe Trinity):

👉 **[Support SoloForge Labs on Patreon Shop](https://www.patreon.com/SoloForgeLabs/shop)**
