import { Product, ChangelogItem } from '../types/product';

export const PRODUCTS: Product[] = [
  {
    id: 'blinkscribe',
    name: 'BlinkScribe',
    version: 'v1.2.0',
    tagline: 'Featherweight, Sub-Second Cloud Dictation',
    headline: 'Cloud dictation, right where you type.',
    category: 'Cloud-Powered Voice Assistant',
    accent: 'cyan',
    statusBadge: 'Available (v1.2.0)',
    statusType: 'available',
    description: 'Sub-second cloud transcription with adaptive 4-tier LLM rewriting. Streams formatted text directly into any active Windows application without touching the clipboard.',
    features: [
      {
        title: 'Cloud-Powered Speed',
        subtitle: 'Groq LPU whisper-large-v3-turbo with sub-second turnaround',
        iconName: 'Cloud',
      },
      {
        title: 'Featherweight Footprint',
        subtitle: 'Less than 60 MB RAM usage, 0% local GPU load',
        iconName: 'Zap',
      },
      {
        title: 'Win32 DirectInput',
        subtitle: 'Sends synthetic Unicode key events with zero clipboard conflict',
        iconName: 'Keyboard',
      },
    ],
    downloads: {
      primary: {
        label: 'Download for Windows',
        sublabel: 'Installer (.exe) • 76.9 MB',
        filename: 'BlinkScribe_v1.2.0.exe',
        url: 'https://github.com/soloforgelabs/soloforgelabs.github.io/releases/download/blinkscribe-v1.2.0/BlinkScribe_v1.2.0.exe',
        size: '76.9 MB',
        sha256: 'E47A6A58FE9DEE60F12AA89BE29E654B27E3815DC9DB194E1646D01627E2C961',
      },
      secondary: {
        label: 'Portable Archive',
        sublabel: 'Standalone (.zip) • 76.4 MB',
        filename: 'BlinkScribe_v1.2.0_Portable.zip',
        url: 'https://github.com/soloforgelabs/soloforgelabs.github.io/releases/download/blinkscribe-v1.2.0/BlinkScribe_v1.2.0_Portable.zip',
        size: '76.4 MB',
        sha256: '41F2F7749E95A18F2D295255D8764CD5E756A46E0D7B271A90378DFBE83FF9FC',
      },
      guideUrl: 'https://github.com/soloforgelabs/soloforgelabs.github.io/blob/main/docs/blinkscribe/USER_GUIDE.md',
    },
    details: {
      systemRequirements: [
        'Windows 10 / 11 (64-bit)',
        'Working microphone / audio input',
        'Stable internet connection for Groq Cloud API',
        'Free Groq API Key (console.groq.com)',
      ],
      hardwareAcceleration: '0% local GPU load. Cloud-accelerated inference via Groq LPUs.',
      privacyModel: 'Audio streamed over TLS directly to Groq Whisper endpoint. In-memory buffer discarded immediately after processing.',
      keyHighlights: [
        '4-Tier Rewriting Engine: Literal Verbatim, Fluent Speech, Business Polish, Academic & Formal',
        'Direct Win32 SendInput streaming typing',
        'Multilingual support across 13 European languages',
        'Floating neon Voice Orb overlay',
      ],
      docUrl: 'https://github.com/soloforgelabs/soloforgelabs.github.io/blob/main/docs/blinkscribe/USER_GUIDE.md',
    },
    preview: {
      title: 'BlinkScribe Active Session',
      latency: '14ms',
      status: 'Live Cloud Stream',
      metaBadge: 'Project Aurora',
      codeLang: 'typescript',
      codePreview: `// BlinkScribe Win32 DirectInput Stream
const stream = await sfl.audio.captureVoiceStream({
  engine: "groq-whisper-turbo",
  rewriteLevel: 3, // Executive Business Polish
  targetHwnd: win32.getActiveWindow()
});

console.log("Transcribed in 340ms: Delivered directly into active editor.");`,
    },
  },
  {
    id: 'deskscribe',
    name: 'DeskScribe',
    version: 'v1.2.0',
    tagline: '100% Offline, Zero-Cloud & Ultimate Privacy',
    headline: 'Dictation and text refinement on your computer.',
    category: 'Air-Gapped Local Voice Utility',
    accent: 'mint',
    statusBadge: 'Available (v1.2.0)',
    statusType: 'available',
    description: 'Completely air-gapped local speech transcription and on-device text refinement. Powered by local Whisper models and quantized Qwen2.5 LLMs directly on your GPU or CPU.',
    features: [
      {
        title: '100% Offline-First',
        subtitle: 'Zero network telemetry; not a single byte leaves your hardware',
        iconName: 'ShieldCheck',
      },
      {
        title: 'Hardware Autodetection',
        subtitle: 'NVIDIA CUDA GPU acceleration with graceful CPU multicore fallback',
        iconName: 'Cpu',
      },
      {
        title: 'In-Memory Audio Buffer',
        subtitle: 'Audio stays strictly in RAM bytes, never saved to persistent disk',
        iconName: 'HardDrive',
      },
    ],
    downloads: {
      primary: {
        label: 'Download Installer',
        sublabel: 'Inno Setup (.exe) • 1.70 GB',
        filename: 'DeskScribe_Setup_v1.2.0.exe',
        url: 'https://github.com/soloforgelabs/soloforgelabs.github.io/releases/download/deskscribe-v1.2.0/DeskScribe_Setup_v1.2.0.exe',
        size: '1.70 GB',
        sha256: 'FFC2C32CB4F8321FDAD08EC96590258F2A844F03A09FE7AA26746E69E853A7F6',
      },
      secondary: {
        label: 'Portable Archive',
        sublabel: 'Self-contained (.zip) • 1.68 GB',
        filename: 'DeskScribe_v1.2.0_Portable.zip',
        url: 'https://github.com/soloforgelabs/soloforgelabs.github.io/releases/download/deskscribe-v1.2.0/DeskScribe_v1.2.0_Portable.zip',
        size: '1.68 GB',
        sha256: '44338BBF9AF3254481CEDED0D7B6B4E26003F6043D207F1AC1CAFB4DF78F02FC',
      },
      guideUrl: 'https://github.com/soloforgelabs/soloforgelabs.github.io/blob/main/docs/deskscribe/USER_GUIDE.md',
    },
    details: {
      systemRequirements: [
        'Windows 10 / 11 (64-bit)',
        'NVIDIA GPU with CUDA support recommended (or modern 6+ core CPU)',
        '4 GB available RAM (8 GB recommended for large models)',
        '2 GB free disk space for bundled local models',
      ],
      hardwareAcceleration: 'CTranslate2 faster-whisper + llama-cpp-python CUDA backend.',
      privacyModel: 'Strictly zero telemetry. Zero network sockets created. In-memory io.BytesIO audio buffers.',
      keyHighlights: [
        'Bundled local models: tiny, base, small, medium, large-v3-turbo',
        'Local quantized GGUF Qwen2.5 for context-aware polishing',
        'Instant batch Unicode injection via Win32 SendInput',
        'Air-gapped security suitable for NDA and legal workflows',
      ],
      docUrl: 'https://github.com/soloforgelabs/soloforgelabs.github.io/blob/main/docs/deskscribe/USER_GUIDE.md',
    },
    preview: {
      title: 'DeskScribe Local Pipeline',
      latency: '0ms Network',
      status: 'Air-Gapped Silicon',
      metaBadge: 'Local CUDA v12',
      codeLang: 'python',
      codePreview: `# DeskScribe 100% Offline Execution
stt = FasterWhisperEngine(device="cuda", compute_type="float16")
llm = LlamaCppEngine(model="qwen2.5-0.5b-instruct.gguf")

# Zero bytes leave local memory
tokens = stt.transcribe(pcm_buffer)
refined = llm.polish(tokens, level=RewriteLevel.MIDDLE)
win32_stream.inject(refined)`,
    },
  },
  {
    id: 'sizeradar',
    name: 'SizeRadar',
    version: 'v1.0.0-rc',
    tagline: 'Intelligent File Organization & Disk Assistant',
    headline: 'Put files in order with natural clarity.',
    category: 'Desktop Storage Hygiene Assistant',
    accent: 'amber',
    statusBadge: 'Release Ready',
    statusType: 'release-ready',
    description: 'Goes beyond standard disk analyzers. Proposes structured folder organization plans, executes batch renaming from natural language rules, and identifies deep cache and dev debris.',
    features: [
      {
        title: 'Intelligent Organization',
        subtitle: 'Suggests logical folder hierarchies and batch rename plans',
        iconName: 'FolderTree',
      },
      {
        title: 'Visual Duplicate Finder',
        subtitle: 'Detects exact byte duplicates and visually resized matching photos',
        iconName: 'Copy',
      },
      {
        title: 'Transparent Approval',
        subtitle: 'Every change is previewed as a plan you explicitly review and approve',
        iconName: 'CheckCircle',
      },
    ],
    downloads: {
      primary: {
        label: 'Release Candidate',
        sublabel: 'Windows Desktop (.exe) • Coming Soon',
        filename: 'SizeRadar_Setup.exe',
        url: '#',
        size: '42 MB',
      },
      guideUrl: '#',
    },
    details: {
      systemRequirements: [
        'Windows 10 / 11 (64-bit)',
        'Any modern CPU (Multi-core recommended for fast file hashing)',
        'Storage access permissions for scanned drives',
      ],
      hardwareAcceleration: 'Multi-threaded background file scanner with perceptual image hashing.',
      privacyModel: 'Scans files strictly locally. Cloud model integration is opt-in only with approved file metadata.',
      keyHighlights: [
        'Deep dev clean: node_modules, .pytest_cache, pip caches, temp scripts',
        'Batch photo sorting by EXIF date and event metadata',
        'Dry-run execution preview before any files are moved or deleted',
        'No deceptive marketing: user holds 100% control',
      ],
      docUrl: 'https://github.com/soloforgelabs/soloforgelabs.github.io',
    },
    preview: {
      title: 'SizeRadar Plan Analyzer',
      latency: '1.2 GB Reclaimed',
      status: 'Plan Ready for Review',
      metaBadge: '412 Files Scanned',
      codeLang: 'json',
      codePreview: `// SizeRadar Cleanup & Organization Plan
{
  "scanned_path": "D:/Projects/Dev",
  "candidates": {
    "node_modules": "840 MB (Safe to delete)",
    ".pytest_cache": "42 MB (Safe to delete)",
    "duplicate_images": "18 files (Identical perceptually)"
  },
  "action": "Awaiting User Approval"
}`,
    },
  },
  {
    id: 'foodlens',
    name: 'FoodLens',
    version: 'v0.9.0',
    tagline: 'Computer Vision Nutrition & Calorie Scanner',
    headline: 'Instant visual dietary analysis without the bloat.',
    category: 'Mobile Computer Vision App',
    accent: 'lime',
    statusBadge: 'In Development',
    statusType: 'planned',
    description: 'Smart food and nutrition camera scanner for instant dietary analysis. Snap a meal photo, speak your portion, or log dietary intake without ads or subscription paywalls.',
    features: [
      {
        title: 'Visual Meal Recognition',
        subtitle: 'Detects dish ingredients and estimates macro distributions',
        iconName: 'Camera',
      },
      {
        title: 'Voice & Multimodal Log',
        subtitle: 'Speak your ingredients naturally; voice-to-macro telemetry',
        iconName: 'Mic',
      },
      {
        title: 'Privacy-Conscious Health',
        subtitle: '100% encrypted local history; no commercial ad tracking',
        iconName: 'Heart',
      },
    ],
    downloads: {
      primary: {
        label: 'Android APK (Preview)',
        sublabel: 'Android 10+ (.apk) • Coming Soon',
        filename: 'FoodLens_Preview.apk',
        url: '#',
        size: '34 MB',
      },
    },
    details: {
      systemRequirements: [
        'Android 10.0 or higher',
        'Camera permissions for visual food scanning',
        'Optional local on-device neural model acceleration',
      ],
      hardwareAcceleration: 'TensorFlow Lite on-device neural inference.',
      privacyModel: 'Personal dietary logs stay locally stored. Optional cloud sync is fully end-to-end encrypted.',
      keyHighlights: [
        'Zero advertisements or manipulative calorie counting gamification',
        'Instant barcode and visual dish scanner',
        'Comprehensive micronutrient and electrolyte telemetry',
      ],
      docUrl: 'https://github.com/soloforgelabs/soloforgelabs.github.io',
    },
    preview: {
      title: 'FoodLens Telemetry Screen',
      latency: '220ms Scan',
      status: 'Vision Model Active',
      metaBadge: 'Meal: Mediterranean Bowl',
      codeLang: 'json',
      codePreview: `// FoodLens Meal Telemetry
{
  "detected_dish": "Mediterranean Quinoa Bowl",
  "calories_est": 520,
  "protein_g": 24.5,
  "healthy_fats_g": 18.0,
  "confidence": 0.96
}`,
    },
  },
  {
    id: 'pulsetrack',
    name: 'PulseTrack',
    version: 'v0.8.0',
    tagline: 'Personal Health Telemetry & Blood Pressure Suite',
    headline: 'Smart vitals logging and cardiovascular telemetry.',
    category: 'Personal Health Monitor',
    accent: 'rose',
    statusBadge: 'Planned',
    statusType: 'planned',
    description: 'Designed for effortless logging of blood pressure, heart rate, hydration, and daily medications. Features optical gauge recognition and actionable trend diagnostics.',
    features: [
      {
        title: 'Optical Tonometer Capture',
        subtitle: 'Photograph your blood pressure monitor for automated digit parsing',
        iconName: 'Activity',
      },
      {
        title: 'Statistical Trends',
        subtitle: 'Identifies spikes, time-of-day correlations, and medication impact',
        iconName: 'TrendingUp',
      },
      {
        title: 'Encrypted Health Vault',
        subtitle: 'Local SQLite encrypted storage, exportable directly to PDF for your doctor',
        iconName: 'Lock',
      },
    ],
    downloads: {
      primary: {
        label: 'Android Early Access',
        sublabel: 'Android (.apk) • In Development',
        filename: 'PulseTrack_Alpha.apk',
        url: '#',
        size: '28 MB',
      },
    },
    details: {
      systemRequirements: [
        'Android / Cross-platform',
        'Camera access for tonometer OCR',
      ],
      hardwareAcceleration: 'On-device OCR and offline cardiovascular statistical computation.',
      privacyModel: 'Health data is sensitive. Zero external ad network sync; strictly local encrypted vault.',
      keyHighlights: [
        'One-tap doctor export (PDF & CSV formatted reports)',
        'Configurable hydration and medication reminders',
        'Smart resting heart rate anomaly notifications',
      ],
      docUrl: 'https://github.com/soloforgelabs/soloforgelabs.github.io',
    },
    preview: {
      title: 'PulseTrack Vitals Vault',
      latency: 'Local Secure DB',
      status: 'Nominal Vitals',
      metaBadge: 'BP: 118 / 78 mmHg',
      codeLang: 'json',
      codePreview: `// PulseTrack Vitals Telemetry
{
  "systolic": 118,
  "diastolic": 78,
  "pulse_bpm": 64,
  "timestamp": "2026-10-04T08:30:00Z",
  "classification": "Optimal (ESC/ESH Guidelines)"
}`,
    },
  },
];

export const CHANGELOGS: ChangelogItem[] = [
  {
    id: 'c1',
    title: 'BlinkScribe v1.2.0 Live',
    tag: 'Release',
    date: 'October 2026',
    summary: 'Direct Win32 SendInput streaming typing with zero clipboard conflict and enhanced Groq Turbo fallback cascade.',
    bullets: [
      'Implemented instant typing via synthetic Win32 Unicode events.',
      'Added fallback cascade to whisper-large-v3 when Groq Turbo is under load.',
      'Upgraded floating neon Voice Orb with real-time audio volume visualizer.',
      'Verified zero clipboard contamination: paste buffers remain untouched.',
    ],
    linkText: 'Read GitHub Release Notes',
    linkUrl: 'https://github.com/soloforgelabs/soloforgelabs.github.io/releases/tag/blinkscribe-v1.2.0',
    accent: 'cyan',
  },
  {
    id: 'c2',
    title: 'DeskScribe v1.2.0 Live',
    tag: 'Release',
    date: 'October 2026',
    summary: '100% Offline-First architecture featuring local Whisper STT and quantized Qwen2.5 GGUF language models.',
    bullets: [
      'Bundled faster-whisper CTranslate2 runtime with auto CUDA/CPU detection.',
      'Integrated local Qwen2.5 GGUF for executive business polish without network calls.',
      'In-memory audio buffers strictly isolated in RAM (io.BytesIO).',
      'Air-gapped operation verified: zero outbound telemetry sockets.',
    ],
    linkText: 'Read GitHub Release Notes',
    linkUrl: 'https://github.com/soloforgelabs/soloforgelabs.github.io/releases/tag/deskscribe-v1.2.0',
    accent: 'mint',
  },
  {
    id: 'c3',
    title: 'SizeRadar Release Candidate',
    tag: 'Upcoming',
    date: 'Q4 2026',
    summary: 'Intelligent file organization and cleanup assistant entering final validation stage.',
    bullets: [
      'Transparent change preview: inspect every action before committing to disk.',
      'Visual perceptual duplicate finder for resized and cropped images.',
      'Clean developer workspace profiles for removing node_modules and compiler caches.',
    ],
    accent: 'amber',
  },
  {
    id: 'c4',
    title: 'Ko-fi Support & DevLogs Live',
    tag: 'Community',
    date: 'Active',
    summary: 'Support independent craftsmanship and follow behind-the-scenes engineering logs directly on Ko-fi.',
    bullets: [
      'Official creator profile active at ko-fi.com/soloforgelabs.',
      'Weekly automated devlogs covering audio pipelines and Win32 architecture.',
      'Zero platform fee donation tier directly funding independent development.',
    ],
    linkText: 'Visit Studio Ko-fi Page',
    linkUrl: 'https://ko-fi.com/soloforgelabs',
    accent: 'rose',
  },
];
