import { ChevronDown } from 'lucide-react';
import { BEAT_DESCRIPTORS } from '../scene/cameraWaypoints';
import type { AtmosphereSnapshot, BeatId } from '../types/weather';

interface ScrollStoryProps {
  activeBeat: BeatId;
  snapshot: AtmosphereSnapshot;
  onJumpBeat: (beat: BeatId) => void;
  onReadBriefing?: () => void;
}

export function ScrollStory({ activeBeat, snapshot, onJumpBeat, onReadBriefing }: ScrollStoryProps) {
  const validLabel = new Date(snapshot.validTimeIso).toUTCString().slice(5, 22);

  return (
    <main className="relative z-10 pointer-events-none">
      {BEAT_DESCRIPTORS.map((beat, idx) => {
        const isCurrent = activeBeat === beat.id;
        return (
          <section
            key={beat.id}
            id={`beat-${beat.id}`}
            className="min-h-screen flex items-end md:items-center px-4 sm:px-8 pb-10 pt-24 md:py-24"
          >
            <article
              className={`pointer-events-auto max-w-md rounded-2xl border backdrop-blur-xl p-5 sm:p-6 shadow-2xl transition-all duration-300 ${
                isCurrent
                  ? 'border-sky-400/45 bg-slate-950/82 opacity-100 translate-y-0'
                  : 'border-slate-800/70 bg-slate-950/60 opacity-70 translate-y-1'
              }`}
            >
              <div className="flex items-center justify-between gap-2 text-[10px] font-mono tracking-widest uppercase text-sky-300">
                <span>{beat.kicker}</span>
                <span className="rounded-md bg-slate-900 px-2 py-0.5 border border-slate-700/80 text-slate-300">
                  {beat.pressureLabel}
                </span>
              </div>

              <h2 className="mt-2.5 text-xl sm:text-2xl font-semibold tracking-tight text-white">
                {beat.title}
              </h2>
              <p className="mt-0.5 text-xs font-medium text-sky-200/80">{beat.subtitle}</p>

              <p className="mt-3 text-sm leading-relaxed text-slate-300">{beat.body}</p>

              <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/75 px-3.5 py-2.5 text-xs text-slate-200">
                <span className="font-mono text-[10px] uppercase tracking-wider text-amber-300 block mb-0.5">
                  Key Signal
                </span>
                {beat.takeaway}
              </div>

              {/* Quick Beat-specific live readout badge */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-800/80 text-[11px] font-mono text-slate-400">
                {beat.id === 1 && (
                  <span>
                    UK: <strong className="text-white">{snapshot.ukSurface.tempC.toFixed(1)}°C</strong> (feels{' '}
                    <strong className="text-sky-300">{snapshot.ukSurface.feelsLikeC.toFixed(1)}°C</strong>) · 850hPa:{' '}
                    <strong className="text-slate-200">{snapshot.ukSurface.temp850HpaC.toFixed(1)}°C</strong>
                  </span>
                )}
                {beat.id === 2 && (
                  <span>
                    60°N u10:{' '}
                    <strong
                      className={
                        snapshot.stratosphere60N.isReversed ? 'text-rose-300' : 'text-sky-300'
                      }
                    >
                      {snapshot.stratosphere60N.zonalMeanWindMs} m/s
                    </strong>{' '}
                    · Pole ΔT:{' '}
                    <strong className="text-orange-300">
                      {snapshot.stratosphere60N.polarCapTempAnomalyC >= 0 ? '+' : ''}
                      {snapshot.stratosphere60N.polarCapTempAnomalyC.toFixed(1)}°C
                    </strong>
                  </span>
                )}
                {beat.id === 3 && (
                  <span>
                    Wave 1: <strong className="text-rose-300">{snapshot.waves.wave1HeightAmpM} m</strong> ·
                    Wave 2: <strong className="text-violet-300">{snapshot.waves.wave2HeightAmpM} m</strong>
                  </span>
                )}
                {beat.id === 4 && (
                  <span>
                    10→1000 hPa Coupling Lag: <strong className="text-sky-300">2–6 weeks</strong>
                  </span>
                )}
                {beat.id === 5 && (
                  <span>
                    Scandi:{' '}
                    <strong className="text-amber-300">
                      {Math.round(snapshot.scandiHigh.pressureMslHpa)} hPa
                    </strong>{' '}
                    ({snapshot.scandiHigh.feelsLikeC.toFixed(0)}° feels) vs UK{' '}
                    <strong className="text-sky-300">{snapshot.ukSurface.feelsLikeC.toFixed(0)}° feels</strong>
                  </span>
                )}

                {idx < BEAT_DESCRIPTORS.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => onJumpBeat((beat.id + 1) as BeatId)}
                    className="inline-flex items-center gap-1 text-sky-300 hover:text-sky-200 transition"
                  >
                    <span>Next beat</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  onReadBriefing && (
                    <button
                      type="button"
                      onClick={onReadBriefing}
                      className="inline-flex items-center gap-1 rounded-lg bg-sky-500/15 border border-sky-400/35 px-2.5 py-1 text-sky-200 hover:bg-sky-500/25 transition"
                    >
                      <span>Read Full Briefing</span>
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  )
                )}
              </div>

              {beat.id === 1 && (
                <div className="mt-1.5 text-[10px] font-mono text-slate-500">
                  Forecast slot: {validLabel} UTC · Freeze lvl {snapshot.ukSurface.freezingLevelM} m
                </div>
              )}
            </article>
          </section>
        );
      })}
    </main>
  );
}
