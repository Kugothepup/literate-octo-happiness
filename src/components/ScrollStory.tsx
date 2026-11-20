import { ChevronDown } from 'lucide-react';
import baseline from '../data/historicalBaseline.json';
import { BEAT_DESCRIPTORS } from '../scene/cameraWaypoints';
import type { AtmosphereSnapshot, BeatId, WeatherMode } from '../types/weather';
import { BeatFigures } from './TooltipCards';

interface ScrollStoryProps {
  activeBeat: BeatId;
  snapshot: AtmosphereSnapshot;
  mode: WeatherMode;
  onToggleMode: (next: WeatherMode) => void;
  /** Phones: show the beat's figures inside the card instead of over the globe. */
  inlineFigures?: boolean;
  scrollProgress: number;
  onJumpBeat: (beat: BeatId) => void;
  onReadBriefing?: () => void;
}

/** Beats where the globe visibly changes between today and the November event. */
const COMPARE_PROMPTS: Partial<Record<BeatId, { toEvent: string; toToday: string }>> = {
  2: { toEvent: 'See the vortex during the November event', toToday: 'See today’s vortex' },
  5: { toEvent: 'See the pattern during the November event', toToday: 'See today’s pattern' },
};

const CLIM = baseline.novemberClimatology;

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

/** What the temperature over the pole means, in words (the tooltip has the figures). */
function thermalReading(anomalyC: number): string {
  if (anomalyC >= 12) return 'The air over the pole is far warmer than usual: the signature of a sudden warming.';
  if (anomalyC >= 3) return 'The air over the pole is warmer than a typical November.';
  if (anomalyC <= -3) return 'The air over the pole is colder than a typical November.';
  return 'The air over the pole is about normal for November.';
}

/** How big the waves are compared with a typical November. */
function waveReading(waves: AtmosphereSnapshot['waves']): string {
  const ratio = (waves.wave1HeightAmpM / CLIM.wave1GeopotentialAmpM + waves.wave2HeightAmpM / CLIM.wave2GeopotentialAmpM) / 2;
  if (ratio < 1.25) return 'These waves are close to their usual November size.';
  return `These waves are about ${ratio.toFixed(1)}× their usual November size.`;
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
  inlineFigures = false,
  scrollProgress,
  onJumpBeat,
  onReadBriefing,
}: ScrollStoryProps) {
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
            className="min-h-screen flex items-end md:items-center px-4 sm:px-8 pb-10 pt-[55vh] md:py-24"
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
                className="mt-2.5 font-serif text-2xl sm:text-[1.75rem] leading-tight font-semibold tracking-tight text-white text-balance"
              >
                {beat.title}
              </h2>
              <p className="mt-0.5 text-[13px] font-medium text-sky-200/80 text-pretty">{beat.subtitle}</p>

              <p className="mt-3 font-serif text-base sm:text-[17px] leading-relaxed text-slate-200 text-pretty">{beat.body}</p>

              <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/75 px-3.5 py-2.5 text-xs text-slate-200">
                <span className="font-mono text-[11px] uppercase tracking-wider text-slate-300 block mb-0.5">
                  Why it matters
                </span>
                {beat.takeaway}
              </div>

              {/* What the data means for this beat. The figures themselves live in the 3D tooltip. */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 text-[13px] leading-snug text-slate-300 space-y-1">
                <span className="block font-mono text-[11px] uppercase tracking-wider text-slate-400">
                  {dataLabel}
                </span>
                {beat.id === 1 && <p>{freezingReading(snapshot.ukSurface.freezingLevelM)}</p>}
                {beat.id === 2 && (
                  <>
                    <p>{vortexReading(s60.zonalMeanWindMs, s60.isReversed)}</p>
                    <p>{thermalReading(s60.polarCapTempAnomalyC)}</p>
                    <p className="text-slate-400">On the globe, the ring’s spin, colour and shape follow these readings.</p>
                  </>
                )}
                {beat.id === 3 && <p>{waveReading(snapshot.waves)}</p>}
                {beat.id === 4 && <p>{dripReading(snapshot.verticalProfile)}</p>}
                {beat.id === 5 && (
                  <p>{battlegroundReading(snapshot.scandiHigh.pressureMslHpa, snapshot.ukSurface.pressureMslHpa)}</p>
                )}
                {inlineFigures && <BeatFigures beat={beat.id} snapshot={snapshot} scrollProgress={scrollProgress} />}
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                {compare && canCompare ? (
                  <button
                    type="button"
                    onClick={() => onToggleMode(mode === 'live' ? 'case-study' : 'live')}
                    className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-medium transition-[transform,background-color] active:scale-[0.96] ${
                      mode === 'live'
                        ? 'border-violet-400/35 bg-violet-500/10 text-violet-200 hover:bg-violet-500/20'
                        : 'border-emerald-400/35 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20'
                    }`}
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
