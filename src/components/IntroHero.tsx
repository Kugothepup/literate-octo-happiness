import { ChevronDown } from 'lucide-react';
import { useProgress } from '@react-three/drei';
import { SOURCE_VIDEO } from '../data/source';

interface IntroHeroProps {
  onStart: () => void;
  onSkipToBriefing: () => void;
}

export function IntroHero({ onStart, onSkipToBriefing }: IntroHeroProps) {
  // Tracks Three.js loaders (GLB + textures) so the first screen never looks broken.
  const { active, progress } = useProgress();
  const loading = active && progress < 100;

  return (
    <section
      id="intro"
      aria-labelledby="intro-title"
      className="relative z-10 min-h-screen flex items-center px-4 sm:px-8 pt-24 pb-16 bg-gradient-to-r from-[#040914]/95 via-[#040914]/70 to-transparent"
    >
      <div className="max-w-xl space-y-5">
        <p className="text-[11px] font-mono uppercase tracking-widest text-sky-300">
          An explainer in five scrolls · November 2026
        </p>

        <h1 id="intro-title" className="text-4xl sm:text-5xl font-bold tracking-tight text-white leading-[1.05] text-balance">
          The cold that starts 30&nbsp;km&nbsp;up
        </h1>

        <p className="text-base sm:text-lg leading-relaxed text-slate-200 text-pretty">
          In early November, the winds that circle high above the North Pole took their biggest early-season
          battering since records began in the 1940s.
        </p>
        <p className="text-sm sm:text-base leading-relaxed text-slate-300 text-pretty">
          Scroll to follow that shock down to the ground, and see why it raises the odds of a cold spell this
          December without promising one.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onStart}
            className="inline-flex items-center gap-2 rounded-xl bg-sky-500/20 border border-sky-400/50 px-4 py-2.5 text-sm font-medium text-sky-100 hover:bg-sky-500/30 transition-[transform,background-color] active:scale-[0.96]"
          >
            Start at ground level
            <ChevronDown className="w-4 h-4 animate-bounce motion-reduce:animate-none" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onSkipToBriefing}
            className="text-sm text-slate-400 hover:text-slate-200 underline-offset-4 hover:underline transition"
          >
            Or skip to the full story
          </button>
        </div>

        <p className="text-[11px] font-mono text-slate-400" aria-live="polite">
          {loading ? `Loading the globe… ${Math.round(progress)}%` : 'Globe ready. Scroll down to begin.'}
        </p>

        <p className="text-xs text-slate-400 max-w-md text-pretty">
          Based on the Met Office’s{' '}
          <a
            href={SOURCE_VIDEO.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-300 underline underline-offset-2 hover:text-white"
          >
            Deep Dive of {SOURCE_VIDEO.published}
          </a>
          , presented by {SOURCE_VIDEO.presenter}. Live readings from Open-Meteo.
        </p>
      </div>
    </section>
  );
}
