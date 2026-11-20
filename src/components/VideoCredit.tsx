import { useState } from 'react';
import { ExternalLink, Play } from 'lucide-react';
import { SOURCE_VIDEO, sswStartUrl } from '../data/source';

/**
 * Credits the source video. Nothing loads from YouTube until the viewer presses play,
 * and the player uses the youtube-nocookie domain.
 */
export function VideoCredit() {
  const [playing, setPlaying] = useState(false);
  const { youtubeId, sswStartSeconds, sswStartLabel } = SOURCE_VIDEO;

  return (
    <div className="grid gap-6 md:grid-cols-[1.1fr_1fr] items-center rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6">
      <div className="relative aspect-video overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
        {playing ? (
          <iframe
            className="absolute inset-0 h-full w-full"
            src={`https://www.youtube-nocookie.com/embed/${youtubeId}?start=${sswStartSeconds}&autoplay=1&rel=0`}
            title={`${SOURCE_VIDEO.channel}: ${SOURCE_VIDEO.title}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            aria-label={`Play the Met Office Deep Dive from ${sswStartLabel}`}
            className="group absolute inset-0 h-full w-full"
          >
            <img
              src={`https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover opacity-80 group-hover:opacity-100 transition-opacity outline outline-1 -outline-offset-1 outline-white/10"
            />
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-950/85 border border-slate-700 px-4 py-2 text-sm text-white group-hover:border-sky-400/60 transition">
                <Play className="w-4 h-4 fill-current" aria-hidden="true" />
                Play from {sswStartLabel}
              </span>
            </span>
          </button>
        )}
      </div>

      <div className="space-y-3">
        <p className="text-[11px] font-mono uppercase tracking-widest text-sky-300">Where this story comes from</p>
        <h3 className="text-xl font-semibold text-white">Watch the Met Office Deep Dive</h3>
        <p className="text-sm leading-relaxed text-slate-300">
          This explainer is drawn from the Met Office’s weekly Deep Dive of {SOURCE_VIDEO.published},
          “Stratosphere downwards”, presented by meteorologist {SOURCE_VIDEO.presenter}. The part about the
          stratosphere starts at {sswStartLabel}.
        </p>
        <a
          href={sswStartUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-sky-300 hover:text-sky-200 transition"
        >
          Watch on YouTube
          <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}
