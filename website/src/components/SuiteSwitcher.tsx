import React, { useState } from 'react';
import { Product } from '../types/product';
import { 
  Zap, 
  Shield, 
  Layers, 
  Utensils, 
  Heart, 
  Download, 
  ArrowRight, 
  Check, 
  Copy, 
  Cpu, 
  Cloud, 
  Keyboard, 
  ShieldCheck, 
  HardDrive, 
  FolderTree, 
  Camera, 
  Activity, 
  ExternalLink 
} from 'lucide-react';

interface SuiteSwitcherProps {
  products: Product[];
  activeProductId: string;
  onSelectProduct: (id: string) => void;
  onExploreProduct: (product: Product) => void;
}

export const SuiteSwitcher: React.FC<SuiteSwitcherProps> = ({
  products,
  activeProductId,
  onSelectProduct,
  onExploreProduct,
}) => {
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const activeProduct = products.find((p) => p.id === activeProductId) || products[0];

  const handleCopySha = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2500);
  };

  // Helper for Product Tab Icon
  const getProductIcon = (id: string) => {
    switch (id) {
      case 'blinkscribe':
        return <Zap className="h-4 w-4" />;
      case 'deskscribe':
        return <Shield className="h-4 w-4" />;
      case 'sizeradar':
        return <Layers className="h-4 w-4" />;
      case 'foodlens':
        return <Utensils className="h-4 w-4" />;
      case 'pulsetrack':
        return <Heart className="h-4 w-4" />;
      default:
        return <Zap className="h-4 w-4" />;
    }
  };

  // Helper for Feature Bullet Icons
  const renderFeatureIcon = (name: string, accent: string) => {
    const iconClass = `h-5 w-5 ${
      accent === 'cyan' ? 'text-cyan-400' :
      accent === 'mint' ? 'text-emerald-400' :
      accent === 'amber' ? 'text-amber-400' :
      accent === 'lime' ? 'text-lime-400' :
      'text-rose-400'
    }`;

    switch (name) {
      case 'Cloud':
        return <Cloud className={iconClass} />;
      case 'Zap':
        return <Zap className={iconClass} />;
      case 'Keyboard':
        return <Keyboard className={iconClass} />;
      case 'ShieldCheck':
        return <ShieldCheck className={iconClass} />;
      case 'Cpu':
        return <Cpu className={iconClass} />;
      case 'HardDrive':
        return <HardDrive className={iconClass} />;
      case 'FolderTree':
        return <FolderTree className={iconClass} />;
      case 'Camera':
        return <Camera className={iconClass} />;
      case 'Activity':
        return <Activity className={iconClass} />;
      default:
        return <Zap className={iconClass} />;
    }
  };

  // Accent styling mappings
  const getTabGlowClass = (id: string, isActive: boolean) => {
    if (!isActive) return 'border-white/10 bg-white/[0.03] text-slate-400 hover:text-white hover:border-white/20';
    switch (id) {
      case 'blinkscribe':
        return 'border-cyan-400 bg-cyan-950/40 text-cyan-300 shadow-[0_0_20px_-3px_rgba(0,229,255,0.4)]';
      case 'deskscribe':
        return 'border-emerald-400 bg-emerald-950/40 text-emerald-300 shadow-[0_0_20px_-3px_rgba(16,185,129,0.4)]';
      case 'sizeradar':
        return 'border-amber-400 bg-amber-950/40 text-amber-300 shadow-[0_0_20px_-3px_rgba(245,158,11,0.4)]';
      case 'foodlens':
        return 'border-lime-400 bg-lime-950/40 text-lime-300 shadow-[0_0_20px_-3px_rgba(132,204,22,0.4)]';
      case 'pulsetrack':
        return 'border-rose-400 bg-rose-950/40 text-rose-300 shadow-[0_0_20px_-3px_rgba(244,63,94,0.4)]';
      default:
        return 'border-cyan-400 bg-cyan-950/40 text-cyan-300';
    }
  };

  const getBorderGlowClass = (accent: string) => {
    switch (accent) {
      case 'cyan':
        return 'border-cyan-500/30 shadow-[0_0_50px_-15px_rgba(0,229,255,0.2)]';
      case 'mint':
        return 'border-emerald-500/30 shadow-[0_0_50px_-15px_rgba(16,185,129,0.2)]';
      case 'amber':
        return 'border-amber-500/30 shadow-[0_0_50px_-15px_rgba(245,158,11,0.2)]';
      case 'lime':
        return 'border-lime-500/30 shadow-[0_0_50px_-15px_rgba(132,204,22,0.2)]';
      case 'rose':
        return 'border-rose-500/30 shadow-[0_0_50px_-15px_rgba(244,63,94,0.2)]';
      default:
        return 'border-white/10';
    }
  };

  return (
    <section id="suite" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-20">
      {/* 1. Interactive Capsule Switcher Bar (Directly matching 01_selected_modular_suite_hub.jpg) */}
      <div className="flex items-center justify-center mb-10 overflow-x-auto py-2 no-scrollbar">
        <div className="inline-flex items-center gap-2 sm:gap-3 rounded-full border border-white/10 bg-obsidian-900/90 p-1.5 backdrop-blur-xl shadow-2xl">
          {products.map((product) => {
            const isActive = product.id === activeProductId;
            return (
              <button
                key={product.id}
                onClick={() => onSelectProduct(product.id)}
                className={`flex items-center gap-2 rounded-full px-4 sm:px-5 py-2 text-xs sm:text-sm font-semibold transition-all duration-200 border ${getTabGlowClass(
                  product.id,
                  isActive
                )}`}
              >
                {getProductIcon(product.id)}
                <span>{product.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Main Selected Suite Stage Card */}
      <div
        className={`relative overflow-hidden rounded-3xl border bg-gradient-to-b from-obsidian-900/95 to-obsidian-950/95 p-6 sm:p-8 lg:p-10 backdrop-blur-2xl transition-all duration-300 ${getBorderGlowClass(
          activeProduct.accent
        )}`}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Key Pillars, CTAs, Deep Dive link */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-7">
            <div>
              {/* Product header & badge */}
              <div className="flex items-center gap-2.5 mb-3">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                  {activeProduct.category}
                </span>
                <span className="text-white/20">•</span>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-mono font-medium ${
                    activeProduct.statusType === 'available'
                      ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                      : activeProduct.statusType === 'release-ready'
                      ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                      : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                  }`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
                  {activeProduct.statusBadge}
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
                {activeProduct.tagline}
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                {activeProduct.description}
              </p>
            </div>

            {/* 3 Core Engineering Pillars */}
            <div className="space-y-4">
              {activeProduct.features.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-3.5">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] border border-white/10">
                    {renderFeatureIcon(feature.iconName, activeProduct.accent)}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">
                      {feature.title}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {feature.subtitle}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Download Buttons and Checksum */}
            <div className="space-y-3 pt-2">
              <div className="flex flex-wrap items-center gap-3">
                {activeProduct.downloads.primary && (
                  <a
                    href={activeProduct.downloads.primary.url}
                    className="flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs sm:text-sm font-bold text-obsidian-950 shadow-md transition-all hover:bg-slate-200 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Download className="h-4 w-4 text-obsidian-950" />
                    <span>{activeProduct.downloads.primary.label}</span>
                  </a>
                )}

                {activeProduct.downloads.secondary && (
                  <a
                    href={activeProduct.downloads.secondary.url}
                    className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-xs sm:text-sm font-medium text-slate-200 transition-all hover:bg-white/10 hover:border-white/20"
                  >
                    <span>{activeProduct.downloads.secondary.label}</span>
                  </a>
                )}
              </div>

              {/* SHA-256 Copy Pill */}
              {activeProduct.downloads.primary?.sha256 && (
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => handleCopySha(activeProduct.downloads.primary!.sha256!)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.02] px-2.5 py-1 text-[11px] font-mono text-slate-400 hover:text-white hover:border-white/20 transition-colors"
                    title="Click to copy SHA-256 checksum"
                  >
                    {copiedHash === activeProduct.downloads.primary.sha256 ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-400" />
                        <span className="text-emerald-400">SHA-256 Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3 text-slate-500" />
                        <span>SHA-256: {activeProduct.downloads.primary.sha256.slice(0, 12)}...</span>
                      </>
                    )}
                  </button>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {activeProduct.downloads.primary.size}
                  </span>
                </div>
              )}
            </div>

            {/* Deep Dive Action Link (Matching mockup right-bottom text) */}
            <div className="pt-2 border-t border-white/[0.06]">
              <button
                onClick={() => onExploreProduct(activeProduct)}
                className={`inline-flex items-center gap-2 text-sm font-bold tracking-tight transition-colors group ${
                  activeProduct.accent === 'cyan' ? 'text-cyan-400 hover:text-cyan-300' :
                  activeProduct.accent === 'mint' ? 'text-emerald-400 hover:text-emerald-300' :
                  activeProduct.accent === 'amber' ? 'text-amber-400 hover:text-amber-300' :
                  activeProduct.accent === 'lime' ? 'text-lime-400 hover:text-lime-300' :
                  'text-rose-400 hover:text-rose-300'
                }`}
              >
                <span>View In-Depth Landing Page & Documentation</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>

          {/* Right Column: Interactive App Window Simulation */}
          <div className="lg:col-span-7">
            <div className="relative rounded-2xl border border-white/10 bg-obsidian-950 p-4 sm:p-6 shadow-2xl overflow-hidden">
              {/* Window Title Bar */}
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 mb-5">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-rose-500/80"></div>
                  <div className="h-3 w-3 rounded-full bg-amber-500/80"></div>
                  <div className="h-3 w-3 rounded-full bg-emerald-500/80"></div>
                  <span className="ml-2 font-mono text-xs text-slate-400">
                    {activeProduct.preview.title}
                  </span>
                </div>

                {/* Telemetry Status Pills */}
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-0.5 text-[11px] font-mono text-cyan-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping"></span>
                    {activeProduct.preview.latency}
                  </span>
                  <span className="hidden sm:inline-flex items-center rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-0.5 text-[11px] font-mono text-slate-300">
                    {activeProduct.preview.metaBadge}
                  </span>
                </div>
              </div>

              {/* Code / Visualizer Canvas Display */}
              <div className="relative rounded-xl bg-obsidian-900 border border-white/[0.06] p-4 font-mono text-xs text-slate-300 overflow-x-auto min-h-[220px]">
                <div className="flex items-center justify-between text-[11px] text-slate-500 border-b border-white/[0.05] pb-2 mb-3">
                  <span>RUNTIME STREAM // ACTIVE</span>
                  <span className="uppercase">{activeProduct.preview.codeLang}</span>
                </div>
                <pre className="text-slate-300 leading-relaxed font-mono whitespace-pre-wrap">
                  {activeProduct.preview.codePreview}
                </pre>
              </div>

              {/* Dynamic waveform or file structure preview */}
              {activeProduct.id === 'blinkscribe' || activeProduct.id === 'deskscribe' ? (
                <div className="mt-3 flex items-center justify-center gap-1.5 h-10 px-4 bg-obsidian-900/60 rounded-xl border border-white/[0.05]">
                  {[18, 35, 55, 80, 45, 90, 100, 70, 48, 85, 95, 85, 65, 45, 30, 60, 75, 40, 22, 12].map((h, i) => (
                    <div
                      key={i}
                      style={{ height: `${h}%` }}
                      className={`w-1 rounded-full ${
                        activeProduct.accent === 'cyan' ? 'bg-cyan-400 shadow-[0_0_8px_rgba(0,229,255,0.7)]' : 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.7)]'
                      } opacity-90 transition-all duration-300`}
                    />
                  ))}
                </div>
              ) : activeProduct.id === 'sizeradar' ? (
                <div className="mt-3 flex items-center justify-between px-3 py-2 bg-obsidian-900/60 rounded-xl border border-white/[0.05] text-[11px] font-mono text-amber-400">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-amber-400"></span>
                    <span>TREE: root/src (4.2 GB) → node_modules (840 MB marked)</span>
                  </span>
                  <span className="text-slate-500">EXIF + DUP SCAN: READY</span>
                </div>
              ) : null}

              {/* Window Footer Status */}
              <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                  <span className="font-mono text-[11px] text-slate-400">
                    {activeProduct.preview.status}
                  </span>
                </div>
                <button
                  onClick={() => onExploreProduct(activeProduct)}
                  className="font-mono text-[11px] text-cyan-400 hover:underline flex items-center gap-1"
                >
                  <span>Explore Specs</span>
                  <ExternalLink className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
