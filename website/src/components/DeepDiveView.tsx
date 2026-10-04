import React, { useState } from 'react';
import { Product } from '../types/product';
import { 
  ArrowLeft, 
  Download, 
  Copy, 
  Check, 
  ExternalLink, 
  Layers 
} from 'lucide-react';

interface DeepDiveViewProps {
  product: Product;
  allProducts: Product[];
  onSelectProduct: (product: Product) => void;
  onBackToHub: () => void;
}

export const DeepDiveView: React.FC<DeepDiveViewProps> = ({
  product,
  allProducts,
  onSelectProduct,
  onBackToHub,
}) => {
  const [activeTab, setActiveTab] = useState<'features' | 'requirements' | 'docs'>('features');
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const handleCopySha = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2500);
  };

  const otherProducts = allProducts.filter((p) => p.id !== product.id);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mb-8">
        <button
          onClick={onBackToHub}
          className="hover:text-cyan-400 transition-colors flex items-center gap-1.5"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>SoloForge Labs</span>
        </button>
        <span>/</span>
        <button onClick={onBackToHub} className="hover:text-cyan-400 transition-colors">
          Products
        </button>
        <span>/</span>
        <span className="text-white font-semibold">{product.name}</span>
      </div>

      {/* Hero Showcase (Directly matching 02_product_deep_dive_page.jpg) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center mb-16">
        {/* Left Column: Heading, Badges, Direct Download */}
        <div className="lg:col-span-6 space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1 text-xs font-mono text-slate-300">
            <span>{product.category}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            {product.name} — <br />
            <span className="text-slate-400 font-semibold">{product.headline}</span>
          </h1>

          {/* Quick Technology Tags */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-mono text-slate-300">
              {product.id === 'deskscribe' ? '100% Offline' : 'Cloud LPU'}
            </span>
            <span className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-mono text-slate-300">
              Win32 DirectInput
            </span>
            <span className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-mono text-slate-300">
              Multilingual (13 Languages)
            </span>
            <span className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-mono text-slate-300">
              4-Tier Rewrite Engine
            </span>
          </div>

          <p className="text-base text-slate-400 leading-relaxed max-w-xl">
            {product.description}
          </p>

          {/* Download CTAs */}
          <div className="pt-2 flex flex-wrap items-center gap-4">
            {product.downloads.primary && (
              <a
                href={product.downloads.primary.url}
                className="flex items-center gap-3 rounded-xl bg-white px-6 py-3 text-sm font-bold text-obsidian-950 shadow-xl transition-all hover:bg-slate-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Download className="h-4 w-4" />
                <span>{product.downloads.primary.label}</span>
                <span className="rounded bg-obsidian-950/10 px-2 py-0.5 text-xs font-mono font-bold">
                  {product.version}
                </span>
              </a>
            )}

            {product.downloads.secondary && (
              <a
                href={product.downloads.secondary.url}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-medium text-slate-200 transition-all hover:bg-white/10"
              >
                <span>{product.downloads.secondary.label}</span>
              </a>
            )}
          </div>

          {/* Checksum and Size */}
          {product.downloads.primary?.sha256 && (
            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={() => handleCopySha(product.downloads.primary!.sha256!)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-1.5 text-xs font-mono text-slate-400 hover:text-white transition-colors"
              >
                {copiedHash === product.downloads.primary.sha256 ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-emerald-400">SHA-256 Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-slate-500" />
                    <span>Copy SHA-256: {product.downloads.primary.sha256.slice(0, 16)}...</span>
                  </>
                )}
              </button>
              <span className="text-xs text-slate-500 font-mono">
                Size: {product.downloads.primary.size}
              </span>
            </div>
          )}
        </div>

        {/* Right Column: High Fidelity App Window Mockup */}
        <div className="lg:col-span-6">
          <div className="relative rounded-2xl border border-white/15 bg-obsidian-950 p-6 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-rose-500/80"></div>
                <div className="h-3 w-3 rounded-full bg-amber-500/80"></div>
                <div className="h-3 w-3 rounded-full bg-emerald-500/80"></div>
                <span className="ml-2 font-mono text-xs text-slate-400">{product.name} App Interface</span>
              </div>
              <span className="text-xs font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 px-2.5 py-0.5 rounded-full">
                Active Session
              </span>
            </div>

            {/* Simulated Voice Waveform & Transcription Area */}
            <div className="space-y-4">
              <div className="rounded-xl border border-white/10 bg-obsidian-900/90 p-4">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-mono">
                  <span>LIVE TRANSCRIPTION BUFFER</span>
                  <span className="text-emerald-400">English (US) / Level 3 Business Polish</span>
                </div>
                <p className="text-sm text-slate-200 font-sans leading-relaxed">
                  "I have updated the release deployment scripts to automate portable zip bundling, SHA-256 integrity hashing, and Ko-fi changelog publication directly into active production."
                </p>
              </div>

              {/* Dynamic waveform simulation */}
              <div className="flex items-center justify-center gap-1.5 h-14 px-4 bg-obsidian-900/50 rounded-xl border border-white/[0.05]">
                {[15, 30, 50, 75, 40, 85, 95, 65, 45, 80, 100, 90, 70, 50, 35, 65, 80, 45, 25, 15].map((h, i) => (
                  <div
                    key={i}
                    style={{ height: `${h}%` }}
                    className={`w-1 sm:w-1.5 rounded-full ${
                      product.accent === 'cyan' ? 'bg-cyan-400 shadow-[0_0_8px_rgba(0,229,255,0.6)]' :
                      product.accent === 'mint' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.6)]' :
                      product.accent === 'amber' ? 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.6)]' :
                      'bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.6)]'
                    } opacity-90 transition-all duration-300`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section: Features / System Requirements / Documentation */}
      <div className="border-t border-white/10 pt-10 mb-16">
        <div className="flex items-center gap-4 border-b border-white/10 pb-4 mb-8">
          <button
            onClick={() => setActiveTab('features')}
            className={`text-sm font-semibold transition-colors pb-1 ${
              activeTab === 'features'
                ? 'text-white border-b-2 border-cyan-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Features & Highlights
          </button>
          <button
            onClick={() => setActiveTab('requirements')}
            className={`text-sm font-semibold transition-colors pb-1 ${
              activeTab === 'requirements'
                ? 'text-white border-b-2 border-cyan-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            System Requirements
          </button>
          <button
            onClick={() => setActiveTab('docs')}
            className={`text-sm font-semibold transition-colors pb-1 ${
              activeTab === 'docs'
                ? 'text-white border-b-2 border-cyan-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Documentation & Setup
          </button>
        </div>

        {/* Tab 1: Features */}
        {activeTab === 'features' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {product.details.keyHighlights.map((highlight, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 rounded-2xl border border-white/10 bg-obsidian-900/60 p-5"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 font-mono text-xs font-bold">
                  {idx + 1}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-200 leading-snug">
                    {highlight}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 2: Requirements */}
        {activeTab === 'requirements' && (
          <div className="rounded-2xl border border-white/10 bg-obsidian-900/60 p-6 space-y-4">
            <h3 className="text-base font-bold text-white mb-2">Hardware & Runtime Specifications</h3>
            <ul className="space-y-2.5">
              {product.details.systemRequirements.map((req, idx) => (
                <li key={idx} className="flex items-center gap-3 text-sm text-slate-300">
                  <Check className="h-4 w-4 text-emerald-400" />
                  <span>{req}</span>
                </li>
              ))}
            </ul>
            <div className="pt-4 border-t border-white/[0.08] mt-4">
              <p className="text-xs font-mono text-slate-400">
                <span className="text-white font-semibold">Hardware Acceleration:</span> {product.details.hardwareAcceleration}
              </p>
              <p className="text-xs font-mono text-slate-400 mt-2">
                <span className="text-white font-semibold">Privacy Model:</span> {product.details.privacyModel}
              </p>
            </div>
          </div>
        )}

        {/* Tab 3: Documentation */}
        {activeTab === 'docs' && (
          <div className="rounded-2xl border border-white/10 bg-obsidian-900/60 p-6 space-y-4">
            <h3 className="text-base font-bold text-white">Official Guides on GitHub</h3>
            <p className="text-sm text-slate-400">
              Comprehensive manuals covering hotkey configurations, Whisper language parameters, offline models, and Win32 DirectInput behavior are openly maintained on GitHub.
            </p>
            <div className="pt-2">
              <a
                href={product.details.docUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-5 py-2.5 text-xs font-semibold text-white hover:bg-white/20 transition-colors"
              >
                <span>Read Full User Guide on GitHub</span>
                <ExternalLink className="h-3.5 w-3.5 text-cyan-400" />
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Switcher Carousel (Directly matching 02_product_deep_dive_page.jpg bottom) */}
      <div className="border-t border-white/10 pt-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-mono uppercase tracking-wider text-slate-400">
            Switcher carousel to other products:
          </h2>
          <button
            onClick={onBackToHub}
            className="text-xs font-mono text-cyan-400 hover:underline"
          >
            Back to Suite Hub ↑
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {otherProducts.map((other) => (
            <button
              key={other.id}
              onClick={() => onSelectProduct(other)}
              className="flex items-center gap-3 rounded-2xl border border-white/10 bg-obsidian-900/70 p-4 text-left transition-all hover:border-white/30 hover:bg-obsidian-900 group focus:outline-none"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] border border-white/10 group-hover:scale-105 transition-transform">
                <Layers className="h-5 w-5 text-cyan-400" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors truncate">
                  {other.name}
                </h3>
                <p className="text-xs text-slate-400 truncate">
                  {other.tagline}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
