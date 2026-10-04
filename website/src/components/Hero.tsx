import React from 'react';
import { Terminal } from 'lucide-react';

export const Hero: React.FC = () => {
  return (
    <section className="relative overflow-hidden pt-16 pb-12 text-center md:pt-24 md:pb-16">
      {/* Ambient background glow */}
      <div 
        aria-hidden="true" 
        className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-[340px] w-[650px] rounded-full bg-gradient-to-tr from-cyan-500/10 via-emerald-500/10 to-indigo-500/10 blur-[100px]" 
      />

      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Studio badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1 text-xs font-mono text-slate-300 backdrop-blur-md mb-6 shadow-inner-glow">
          <Terminal className="h-3.5 w-3.5 text-cyan-400" />
          <span>INDEPENDENT DIGITAL LABORATORY</span>
          <span className="text-white/20">•</span>
          <span className="text-emerald-400 flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            v1.2.0 Live
          </span>
        </div>

        {/* Display Title */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white mb-6">
          SoloForge Labs
        </h1>

        {/* Tagline */}
        <p className="mx-auto max-w-2xl text-lg sm:text-xl text-slate-400 font-normal leading-relaxed">
          Crafting tools for developers and creators. High performance. Elegant design.
        </p>

        {/* Quick Philosophy Statement */}
        <p className="mt-3 text-xs sm:text-sm font-mono text-slate-500 tracking-wide uppercase">
          Zero bloat • Privacy by default • Native performance
        </p>
      </div>
    </section>
  );
};
