import React, { useState } from 'react';
import { Coffee, Menu, X, Layers, BookOpen, Clock } from 'lucide-react';
import { GithubIcon } from './GithubIcon';

interface NavbarProps {
  onSelectProduct?: (productId: string) => void;
  onGoHome?: () => void;
  isDeepDive?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onGoHome, isDeepDive }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-obsidian-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand / Logo */}
        <button
          onClick={onGoHome}
          className="group flex items-center gap-3 text-left transition-all hover:opacity-90 focus:outline-none"
        >
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-obsidian-900 border border-white/15 overflow-hidden shadow-[0_0_18px_-3px_rgba(0,229,255,0.4)] transition-transform group-hover:scale-105">
            <img src="./sfl-logo.png" alt="SoloForge Labs" className="h-full w-full object-cover" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-white group-hover:text-cyan-400 transition-colors">
              SoloForge Labs
            </span>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
              Software Studio
            </span>
          </div>
        </button>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-300">
          <a
            href="#suite"
            onClick={(e) => {
              if (isDeepDive && onGoHome) {
                e.preventDefault();
                onGoHome();
                setTimeout(() => {
                  document.getElementById('suite')?.scrollIntoView({ behavior: 'smooth' });
                }, 50);
              }
            }}
            className="flex items-center gap-1.5 transition-colors hover:text-cyan-400"
          >
            <Layers className="h-4 w-4 text-cyan-400/80" />
            Products
          </a>
          <a
            href="https://github.com/soloforgelabs/soloforgelabs.github.io/blob/main/docs/COMPARISON.md"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 transition-colors hover:text-white"
          >
            <BookOpen className="h-4 w-4 text-slate-400" />
            Documentation
          </a>
          <a
            href="#updates"
            onClick={(e) => {
              if (isDeepDive && onGoHome) {
                e.preventDefault();
                onGoHome();
                setTimeout(() => {
                  document.getElementById('updates')?.scrollIntoView({ behavior: 'smooth' });
                }, 50);
              }
            }}
            className="flex items-center gap-1.5 transition-colors hover:text-white"
          >
            <Clock className="h-4 w-4 text-slate-400" />
            Changelog
          </a>
          <a
            href="https://ko-fi.com/soloforgelabs"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-rose-300 hover:text-rose-200 transition-colors"
          >
            <Coffee className="h-4 w-4 text-rose-400" />
            Support Studio
          </a>
        </nav>

        {/* Right Action Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <a
            href="https://ko-fi.com/soloforgelabs"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3.5 py-1.5 text-xs font-semibold text-rose-300 shadow-sm transition-all hover:bg-rose-500/20 hover:border-rose-400"
          >
            <Coffee className="h-3.5 w-3.5 text-rose-400" />
            <span>Ko-fi</span>
          </a>
          <a
            href="https://github.com/soloforgelabs"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-white/10 hover:border-cyan-400/50"
          >
            <GithubIcon className="h-3.5 w-3.5 text-slate-300" />
            <span>GitHub</span>
          </a>
        </div>

        {/* Mobile menu button */}
        <div className="flex md:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-400 hover:text-white focus:outline-none"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="border-b border-white/10 bg-obsidian-900 px-4 py-5 md:hidden space-y-4">
          <div className="flex flex-col gap-3 text-sm font-medium">
            <a
              href="#suite"
              onClick={() => {
                setMobileMenuOpen(false);
                if (isDeepDive && onGoHome) onGoHome();
              }}
              className="px-2 py-1.5 text-slate-200 hover:text-cyan-400"
            >
              Products
            </a>
            <a
              href="https://github.com/soloforgelabs/soloforgelabs.github.io/blob/main/docs/COMPARISON.md"
              target="_blank"
              rel="noopener noreferrer"
              className="px-2 py-1.5 text-slate-200 hover:text-cyan-400"
            >
              Documentation
            </a>
            <a
              href="#updates"
              onClick={() => {
                setMobileMenuOpen(false);
                if (isDeepDive && onGoHome) onGoHome();
              }}
              className="px-2 py-1.5 text-slate-200 hover:text-cyan-400"
            >
              Changelog
            </a>
            <a
              href="https://ko-fi.com/soloforgelabs"
              target="_blank"
              rel="noopener noreferrer"
              className="px-2 py-1.5 text-rose-300 hover:text-rose-200"
            >
              Support on Ko-fi
            </a>
          </div>
          <div className="pt-2 flex items-center gap-3">
            <a
              href="https://ko-fi.com/soloforgelabs"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-center py-2 rounded-lg border border-rose-500/30 bg-rose-500/10 text-xs font-semibold text-rose-300"
            >
              ☕ Support ($3)
            </a>
            <a
              href="https://github.com/soloforgelabs"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-center py-2 rounded-lg border border-white/10 bg-white/5 text-xs font-semibold text-white"
            >
              GitHub Org
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
