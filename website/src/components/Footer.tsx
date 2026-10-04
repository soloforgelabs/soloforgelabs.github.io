import React from 'react';
import { Coffee, ExternalLink } from 'lucide-react';
import { GithubIcon } from './GithubIcon';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-white/[0.08] bg-obsidian-950 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center justify-between pb-10 border-b border-white/[0.06]">
          {/* Studio Brand */}
          <div className="md:col-span-6 space-y-2">
            <div className="flex items-center gap-3">
              <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-obsidian-900 border border-white/10 overflow-hidden shadow-[0_0_12px_-2px_rgba(0,229,255,0.3)]">
                <img src="./sfl-logo.png" alt="SoloForge Labs" className="h-full w-full object-cover" />
              </div>
              <span className="text-base font-bold text-white tracking-tight">SoloForge Labs</span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Independent digital laboratory engineering precision desktop & mobile utilities.
            </p>
          </div>

          {/* Quick External Links */}
          <div className="md:col-span-6 flex flex-wrap items-center justify-start md:justify-end gap-6 text-xs font-mono text-slate-400">
            <a
              href="https://github.com/soloforgelabs/soloforgelabs.github.io/blob/main/docs/COMPARISON.md"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-cyan-400 transition-colors flex items-center gap-1"
            >
              <span>Guides</span>
              <ExternalLink className="h-3 w-3" />
            </a>
            <a
              href="https://github.com/soloforgelabs/soloforgelabs.github.io/releases"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-cyan-400 transition-colors flex items-center gap-1"
            >
              <span>Releases</span>
              <ExternalLink className="h-3 w-3" />
            </a>
            <a
              href="https://github.com/soloforgelabs/soloforgelabs.github.io"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-cyan-400 transition-colors flex items-center gap-1"
            >
              <GithubIcon className="h-3.5 w-3.5 text-slate-400" />
              <span>GitHub</span>
            </a>
            <a
              href="https://ko-fi.com/soloforgelabs"
              target="_blank"
              rel="noopener noreferrer"
              className="text-rose-400 hover:text-rose-300 transition-colors flex items-center gap-1.5"
            >
              <Coffee className="h-3.5 w-3.5" />
              <span>Donate on Ko-fi</span>
            </a>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-500">
          <p>© 2026 SoloForge Labs. All rights reserved.</p>
          <p className="tracking-wide uppercase text-[11px] text-slate-600">
            ENGINEERED INDEPENDENTLY • PRECISION SOFTWARE
          </p>
        </div>
      </div>
    </footer>
  );
};
