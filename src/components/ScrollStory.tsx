import { ChevronDown } from 'lucide-react';
import baseline from '../data/historicalBaseline.json';
import { BEAT_DESCRIPTORS } from '../scene/cameraWaypoints';
import type { AtmosphereSnapshot, BeatId, WeatherMode } from '../types/weather';

interface ScrollStoryProps {
  activeBeat: BeatId;
  snapshot: AtmosphereSnapshot;
  mode: WeatherMode;
  onToggleMode: (next: WeatherMode) => void;
  onJumpBeat: (beat: BeatId) => void;
  onReadBriefing?: () => void;
}

/** Beats where the globe visibly changes between today and the November event. */
const COMPARE_PROMPTS: Partial<Record<BeatId, { toEvent: string; toToday: string }>> = {
  2: { toEvent: 'See the vortex during the November event', toToday: 'See today’s vortex' },
  5: { toEvent: 'See the pattern during the November event', toToday: 'See today’s pattern' },
};

const MS_TO_MPH = 2.23694;
const CLIM = baseline.novemberClimatology;

function signed(n: number, digits = 1): string {
  return `${n > 0 ? '+' : ''}${n.toFixed(digits)}`;
}

/** One plain-English line on what today's vortex wind means. */
function vortexReading(windMs: number, isReversed: boolean): string {
  if (isReversed) return 'Reversed: blowing from the east. That’s SSW territory.';
  if (windMs < CLIM.zonalMeanWind10HpaMs) {
    return `Westerly, but weaker than a typical November (${Math.round(CLIM.zonalMeanWind10HpaMs)} m/s).`;
  }
  return `Westerly and spinning at least as fast as a typical November (${Math.round(CLIM.zonalMeanWind10HpaMs)} m/s).`;
}

/** One plain-English line on whether a Scandinavian block is in place. */
function battlegroundReading(scandiHpa: number, ukHpa: number): string {
  if (scandiHpa >= 1022 && scandiHpa > ukHpa) return 'High pressure over Scandinavia: a block is in place.';
  if (scandiHpa > ukHpa) return 'Pressure is higher to the east than over the UK.';
  return 'No Scandinavian high today. The dome on the globe shows what one would look like.';
}

/** One plain-English line on what the freezing level means on the ground. */
function freezingReading(levelM: number): string {
  if (levelM <= 50) return 'Freezing right down to ground level.';
  return `Freezing level ${Math.round(levelM)} m: hills higher than that are in sub-zero air.`;
}

/** How much of the atmosphere at 60°N has slower-than-normal westerlies right now. */
function dripReading(levels: AtmosphereSnapshot['verticalProfile']): string {
  const measured = levels.filter((l) => !l.noData);
  if (measured.length === 0) return 'No wind readings available by height.';
  const weaker = measured.filter((l) => l.anomalyMs < 0).length;
  return `Winds are weaker than normal at ${weaker} of ${measured.length} heights measured.`;
}

export function ScrollStory({
  activeBeat,
  snapshot,
  mode,
  onToggleMode,
  onJumpBeat,
  onReadBriefing,
}: ScrollStoryProps) {
  const validLabel = new Date(snapshot.validTimeIso).toUTCString().slice(5, 22);
  const isLive = snapshot.fetchSource === 'live-api' || snapshot.fetchSource === 'cached-live';
  const dataLabel = isLive ? 'Live now' : 'November case study';
  const s60 = snapshot.stratosphere60N;
  // Offline: live mode is already showing the case study, so a comparison would do nothing.
  const canCompare = isLive || mode === 'case-study';

  return (
    <main className="relative z-10 pointer-events-none">
      {BEAT_DESCRIPTORS.map((beat, idx) => {
        const isCurrent = activeBeat === beat.id;
        const next = BEAT_DESCRIPTORS[idx + 1];
        const compare = COMPARE_PROMPTS[beat.id];
        return (
          <section
            key={beat.id}
            id={`beat-${beat.id}`}
            aria-labelledby={`beat-${beat.id}-title`}
            className="min-h-screen flex items-end md:items-center px-4 sm:px-8 pb-10 pt-24 md:py-24"
          >
            <article
              className={`pointer-events-auto max-w-md rounded-2xl border backdrop-blur-xl p-5 sm:p-6 shadow-2xl transition-[opacity,transform,border-color,background-color] duration-300 ${
                isCurrent
                  ? 'border-sky-400/45 bg-slate-950/82 opacity-100 translate-y-0'
                  : 'border-slate-800/70 bg-slate-950/60 opacity-70 translate-y-1'
              }`}
            >
              <div className="flex items-center justify-between gap-2 text-[11px] font-mono tracking-widest uppercase text-sky-300">
                <span>{beat.kicker}</span>
                <span className="rounded-md bg-slate-900 px-2 py-0.5 border border-slate-700/80 text-slate-300 normal-case tracking-normal">
                  {beat.pressureLabel}
                </span>
              </div>

              <h2
                id={`beat-${beat.id}-title`}
                className="mt-2.5 text-xl sm:text-2xl font-semibold tracking-tight text-white text-balance"
              >
                {beat.title}
              </h2>
              <p className="mt-0.5 text-[13px] font-medium text-sky-200/80 text-pretty">{beat.subtitle}</p>

              <p className="mt-3 text-[15px] leading-relaxed text-slate-300 text-pretty">{beat.body}</p>

              <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/75 px-3.5 py-2.5 text-xs text-slate-200">
                <span className="font-mono text-[11px] uppercase tracking-wider text-amber-300 block mb-0.5">
                  Why it matters
                </span>
                {beat.takeaway}
              </div>

              {/* What the data says for this beat, live or case study */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 text-xs text-slate-400 space-y-0.5">
                <span className="block font-mono text-[11px] uppercase tracking-wider text-slate-400">
                  {dataLabel}
                </span>
                {beat.id === 1 && (
                  <p className="font-mono">
                    Scottish Highlands:{' '}
                    <strong className="text-white">{snapshot.ukSurface.tempC.toFixed(1)}°C</strong>, feels like{' '}
                    <strong className="text-sky-300">{snapshot.ukSurface.feelsLikeC.toFixed(1)}°C</strong>
                  </p>
                )}
                {beat.id === 2 && (
                  <>
                    <p className="font-mono">
                      Vortex wind at 60°N:{' '}
                      <strong className={s60.isReversed ? 'text-rose-300' : 'text-sky-300'}>
                        {signed(s60.zonalMeanWindMs)} m/s
                      </strong>{' '}
                      <span className="text-slate-400">({Math.round(Math.abs(s60.zonalMeanWindMs) * MS_TO_MPH)} mph)</span>
                    </p>
                    <p>{vortexReading(s60.zonalMeanWindMs, s60.isReversed)}</p>
                    <p className="text-slate-400">On the globe, the ring’s spin, colour and shape follow these readings.</p>
                  </>
                )}
                {beat.id === 3 && (
                  <>
                    <p className="font-mono">
                      Wave 1: <strong className="text-rose-300">{snapshot.waves.wave1HeightAmpM} m</strong> · Wave 2:{' '}
                      <strong className="text-violet-300">{snapshot.waves.wave2HeightAmpM} m</strong>
                    </p>
                    <p>
                      A typical November: {CLIM.wave1GeopotentialAmpM} m and {CLIM.wave2GeopotentialAmpM} m.
                    </p>
                  </>
                )}
                {beat.id === 4 && <p>{dripReading(snapshot.verticalProfile)}</p>}
                {beat.id === 5 && (
                  <>
                    <p className="font-mono">
                      Scandinavia:{' '}
                      <strong className="text-amber-300">{Math.round(snapshot.scandiHigh.pressureMslHpa)} hPa</strong> ·
                      UK: <strong className="text-sky-300">{Math.round(snapshot.ukSurface.pressureMslHpa)} hPa</strong>
                    </p>
                    <p>{battlegroundReading(snapshot.scandiHigh.pressureMslHpa, snapshot.ukSurface.pressureMslHpa)}</p>
                  </>
                )}
                {beat.id === 1 && (
                  <>
                    <p>{freezingReading(snapshot.ukSurface.freezingLevelM)}</p>
                    <p className="text-[11px] font-mono text-slate-400">Data for {validLabel} UTC</p>
                  </>
                )}
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                {compare && canCompare ? (
                  <button
                    type="button"
                    onClick={() => onToggleMode(mode === 'live' ? 'case-study' : 'live')}
                    className="inline-flex items-center rounded-lg border border-violet-400/35 bg-violet-500/10 px-2.5 py-1 text-xs font-medium text-violet-200 hover:bg-violet-500/20 transition-[transform,background-color] active:scale-[0.96]"
                  >
                    {mode === 'live' ? compare.toEvent : compare.toToday}
                  </button>
                ) : (
                  <span />
                )}
                {next ? (
                  <button
                    type="button"
                    onClick={() => onJumpBeat(next.id)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-sky-300 hover:text-sky-200 transition-colors"
                  >
                    <span>Next: {next.shortTitle}</span>
                    <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                ) : (
                  onReadBriefing && (
                    <button
                      type="button"
                      onClick={onReadBriefing}
                      className="inline-flex items-center gap-1 rounded-lg bg-sky-500/15 border border-sky-400/35 px-2.5 py-1 text-xs font-medium text-sky-200 hover:bg-sky-500/25 transition-[transform,background-color] active:scale-[0.96]"
                    >
                      <span>Read the full story</span>
                      <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  )
                )}
              </div>
            </article>
          </section>
        );
      })}
    </main>
  );
}
