import React from 'react';
import { ChangelogItem } from '../types/product';
import { ArrowRight, ExternalLink } from 'lucide-react';

interface UpdatesSectionProps {
  changelogs: ChangelogItem[];
}

export const UpdatesSection: React.FC<UpdatesSectionProps> = ({ changelogs }) => {
  return (
    <section id="updates" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-20">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Latest Updates & Upcoming
          </h2>
          <p className="text-sm text-slate-400 mt-1 font-mono">
            ENGINEERING LOGS // RELEASE RADAR
          </p>
        </div>
        <a
          href="https://ko-fi.com/soloforgelabs"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:inline-flex items-center gap-1.5 text-xs font-mono text-cyan-400 hover:text-cyan-300"
        >
          <span>View all DevLogs on Ko-fi</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {changelogs.map((item) => {
          return (
            <div
              key={item.id}
              className="group relative flex flex-col justify-between rounded-2xl border border-white/10 bg-obsidian-900/80 p-6 sm:p-7 backdrop-blur-xl transition-all duration-200 hover:border-white/20 hover:bg-obsidian-900"
            >
              <div>
                {/* Header Tag & Date */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-mono font-medium ${
                      item.accent === 'cyan'
                        ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20'
                        : item.accent === 'mint'
                        ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                        : item.accent === 'amber'
                        ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                        : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                    }`}
                  >
                    {item.tag}
                  </span>
                  <span className="text-xs font-mono text-slate-500">{item.date}</span>
                </div>

                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-400 mb-4 leading-relaxed">
                  {item.summary}
                </p>

                {/* Bullet Points */}
                <ul className="space-y-2 mb-6">
                  {item.bullets.map((bullet, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-400">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400/80" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Link CTA */}
              {item.linkUrl && (
                <div className="pt-4 border-t border-white/[0.06]">
                  <a
                    href={item.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
                  >
                    <span>{item.linkText || 'Learn More'}</span>
                    <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
