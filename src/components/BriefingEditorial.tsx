import { ArrowUp, BarChart3, Compass, Gauge, Waves } from 'lucide-react';
import baseline from '../data/historicalBaseline.json';
import { SOURCE_VIDEO } from '../data/source';
import { getCaseStudySnapshot } from '../services/weatherData';
import type { AtmosphereSnapshot, BeatId, ModelSource, WeatherMode } from '../types/weather';
import { VideoCredit } from './VideoCredit';
import { scrollToId } from '../lib/scroll';

interface BriefingEditorialProps {
  snapshot: AtmosphereSnapshot;
  mode: WeatherMode;
  onToggleMode: (next: WeatherMode) => void;
  modelSource: ModelSource;
  onChangeModel: (next: ModelSource) => void;
  onJumpBeat: (beat: BeatId) => void;
}

const SECTION_LINKS = [
  { id: 'briefing-video', label: 'Watch the video' },
  { id: 'briefing-ssw', label: 'What happened' },
  { id: 'briefing-unusual', label: 'How unusual' },
  { id: 'briefing-outlook', label: 'Into December' },
  { id: 'briefing-now', label: 'Then and now' },
] as const;

const CLIM = baseline.novemberClimatology;
const EVENT = getCaseStudySnapshot();

const jumpToSection = scrollToId;

function signed(n: number, digits = 1): string {
  return `${n > 0 ? '+' : ''}${n.toFixed(digits)}`;
}

export function BriefingEditorial({
  snapshot,
  mode,
  onToggleMode,
  modelSource,
  onChangeModel,
  onJumpBeat,
}: BriefingEditorialProps) {
  const maxBarWave1 = Math.max(...baseline.historicalComparisonBars.map((b) => b.wave1M));
  const isLive = snapshot.fetchSource === 'live-api' || snapshot.fetchSource === 'cached-live';
  const now = isLive ? snapshot : null;

  const thenAndNow = [
    {
      label: 'Vortex wind at 60°N, 30 km up',
      typical: `${signed(CLIM.zonalMeanWind10HpaMs)} m/s`,
      event: `${signed(EVENT.stratosphere60N.zonalMeanWindMs)} m/s`,
      today: now ? `${signed(now.stratosphere60N.zonalMeanWindMs)} m/s` : null,
      note: 'Below zero means the winds have reversed.',
    },
    {
      label: 'Temperature over the pole, 30 km up',
      typical: `${CLIM.polarCapTemp10HpaC.toFixed(1)}°C`,
      event: `${EVENT.stratosphere60N.polarCapTemp10HpaC.toFixed(1)}°C`,
      today: now ? `${now.stratosphere60N.polarCapTemp10HpaC.toFixed(1)}°C` : null,
      note: 'A sudden warming shows up as a jump here.',
    },
    {
      label: 'Wave 1 and wave 2 height',
      typical: `${CLIM.wave1GeopotentialAmpM} · ${CLIM.wave2GeopotentialAmpM} m`,
      event: `${EVENT.waves.wave1HeightAmpM} · ${EVENT.waves.wave2HeightAmpM} m`,
      today: now ? `${now.waves.wave1HeightAmpM} · ${now.waves.wave2HeightAmpM} m` : null,
      note: 'Bigger waves give the vortex a harder knock.',
    },
    {
      label: 'Pressure over Scandinavia',
      typical: '—',
      event: `${Math.round(EVENT.scandiHigh.pressureMslHpa)} hPa`,
      today: now ? `${Math.round(now.scandiHigh.pressureMslHpa)} hPa` : null,
      note: 'Higher pressure here favours a block and colder easterlies.',
    },
  ];

  return (
    <section
      id="briefing-editorial"
      aria-labelledby="briefing-title"
      className="relative z-20 pointer-events-auto bg-gradient-to-b from-[#040914]/0 via-[#050b18]/95 to-[#050b18] pt-24 pb-24"
    >
      <div className="bg-[#050b18]/95 border-t border-slate-800/80 backdrop-blur-md">
        <div className="mx-auto max-w-5xl px-4 sm:px-8 pt-14 pb-8 space-y-16">
          {/* Header */}
          <header className="space-y-5">
            <h2 id="briefing-title" className="font-serif text-4xl sm:text-5xl font-semibold tracking-tight text-white leading-[1.08] text-balance">
              Inside November’s polar vortex shock
            </h2>
            <p className="font-serif text-lg sm:text-xl leading-relaxed text-slate-300 max-w-[60ch] text-pretty">
              How the vortex was knocked off course, how unusual that was, and what it could mean for the UK’s
              weather into December.
            </p>
            <nav aria-label="Sections" className="flex flex-wrap gap-2 pt-1">
              {SECTION_LINKS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => jumpToSection(item.id)}
                  className="rounded-full border border-slate-800 bg-slate-900/75 hover:border-sky-400/50 hover:bg-sky-500/10 hover:text-sky-200 px-3.5 py-1.5 text-xs font-medium text-slate-300 transition"
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </header>

          {/* Source video */}
          <section id="briefing-video" className="scroll-mt-24" aria-label="Source video">
            <VideoCredit />
          </section>

          {/* 1. What happened */}
          <section id="briefing-ssw" className="scroll-mt-24 space-y-6">
            <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
              <Waves className="w-5 h-5 text-sky-400" aria-hidden="true" />
              <h3 className="font-serif text-[1.75rem] leading-tight font-semibold text-white text-balance">What happened 30 km up</h3>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-serif text-xl font-semibold text-white text-balance">How a polar vortex breaks down</h4>
                  <button
                    type="button"
                    onClick={() => onJumpBeat(3)}
                    className="text-xs font-medium text-sky-300 hover:text-sky-200 transition-colors shrink-0"
                  >
                    Watch it in 3D →
                  </button>
                </div>
                <p className="font-serif text-base leading-relaxed text-slate-200 text-pretty">
                  About 30 km above the Arctic, a ring of westerly winds circles the North Pole every autumn and
                  winter. It keeps the coldest air penned in over the pole. This is the polar vortex.
                </p>
                <p className="font-serif text-base leading-relaxed text-slate-200 text-pretty">
                  Sometimes the ring gets knocked off balance. Its winds slow down or even turn round, and the air
                  inside sinks and heats up fast. That’s why it’s called a sudden stratospheric warming, or SSW.
                </p>

                <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 space-y-3 text-[13px] leading-snug">
                  <div className="rounded-lg border border-indigo-500/40 bg-indigo-500/10 px-3 py-2 text-center text-indigo-200 font-semibold">
                    The polar vortex, 30 km up
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2.5 pl-3 border-l-2 border-slate-700">
                    <div className="rounded-lg border border-fuchsia-500/35 bg-fuchsia-500/10 p-2.5 text-slate-200">
                      <span className="block font-mono text-[11px] text-fuchsia-300 font-semibold mb-0.5">Wave 2 · late October</span>
                      Squeezed it into a dumbbell shape, slowing it and splitting it in two
                    </div>
                    <div className="rounded-lg border border-lime-400/35 bg-lime-400/10 p-2.5 text-slate-200">
                      <span className="block font-mono text-[11px] text-lime-300 font-semibold mb-0.5">Wave 1 · early November</span>
                      One huge ridge pushed what was left off the pole, towards Russia
                    </div>
                  </div>
                  <div className="rounded-lg border border-sky-500/40 bg-sky-500/10 px-3 py-2 text-center text-sky-200 font-semibold">
                    The result: a likely major SSW, then a slow drip down to the ground over 2–6 weeks
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-3 self-start">
                <h4 className="font-serif text-xl font-semibold text-white text-balance">Major or minor?</h4>
                <p className="font-serif text-base leading-relaxed text-slate-200 text-pretty">
                  Probably major. That means the winds didn’t just slow down: they reversed and blew from the east.
                </p>
                <p className="font-serif text-base leading-relaxed text-slate-200 text-pretty">
                  It won’t be confirmed until the data has been formally re-analysed. For our weather, though, it
                  makes little difference. Winds that reverse and winds that nearly stop have much the same effect
                  at the surface.
                </p>
              </div>
            </div>
          </section>

          {/* 2. How unusual */}
          <section id="briefing-unusual" className="scroll-mt-24 space-y-6">
            <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
              <BarChart3 className="w-5 h-5 text-sky-400" aria-hidden="true" />
              <h3 className="font-serif text-[1.75rem] leading-tight font-semibold text-white text-balance">How unusual was it?</h3>
            </div>

            <p className="font-serif text-[17px] leading-relaxed text-slate-200 max-w-[65ch] text-pretty">
              At the end of October, <strong className="text-white">Nick Silkstone</strong>, Deputy Chief
              Meteorologist at the Met Office, checked how rare this was. He compared the waves with ERA5 records
              going back to the 1940s, including very strong El Niño years.
            </p>

            <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold text-white">How big were the waves?</h4>
                  <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
                    <span className="inline-flex items-center gap-1">
                      <span className="inline-block w-2.5 h-2.5 rounded-full bg-lime-300" aria-hidden="true" />
                      Wave 1
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="inline-block w-2.5 h-2.5 rounded-full bg-fuchsia-400" aria-hidden="true" />
                      Wave 2
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-400">
                  Height of each wave in metres, from ERA5 records since 1940. Bigger waves give the vortex a harder
                  knock.
                </p>
                <div className="space-y-3">
                  {baseline.historicalComparisonBars.map((row) => (
                    <div key={row.label} className="space-y-1 text-xs">
                      <div className="flex justify-between font-mono text-slate-300">
                        <span>{row.label}</span>
                        <span>
                          {row.wave1M} · {row.wave2M} m
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-lime-300 rounded-full"
                            style={{ width: `${Math.round((row.wave1M / maxBarWave1) * 100)}%` }}
                          />
                        </div>
                        <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-fuchsia-400 rounded-full"
                            style={{ width: `${Math.round((row.wave2M / maxBarWave1) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <ol className="grid gap-3 font-serif text-[15px] leading-relaxed text-slate-200">
                <li className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                  <span className="font-mono text-xs text-fuchsia-300 font-semibold block mb-1">
                    Wave 2 · late October to 2 November
                  </span>
                  Pressure rising and falling across thousands of miles squeezed the vortex into a dumbbell and split
                  it. It was the strongest early-season wave 2 on record.
                </li>
                <li className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                  <span className="font-mono text-xs text-lime-300 font-semibold block mb-1">
                    Wave 1 · up to 6 November
                  </span>
                  A single huge ridge of high pressure, building from the Pacific and North America, pushed east and
                  shoved the vortex off the pole towards Russia.
                </li>
                <li className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                  <span className="font-mono text-xs text-sky-300 font-semibold block mb-1">The two together</span>
                  There have been stronger wave 1 events. But the two together were far stronger than anything
                  before, even in strong El Niño years. (El Niño years don’t reliably bring stronger early
                  warmings.)
                </li>
              </ol>
            </div>

            <blockquote className="border-l-2 border-slate-600 pl-4 font-serif italic text-lg leading-relaxed text-slate-200 max-w-[60ch]">
              &ldquo;A wave it was a significantly strong wave two, the strongest in this data record which goes back to
              the 1940s… when you combine the two together much stronger than anything we’d had in the past and
              much stronger than previous El Niño years…&rdquo;
              <footer className="mt-2 not-italic font-sans text-xs text-slate-400">
                — {SOURCE_VIDEO.presenter}, Met Office
              </footer>
            </blockquote>
          </section>

          {/* 3. Into December */}
          <section id="briefing-outlook" className="scroll-mt-24 space-y-6">
            <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
              <Compass className="w-5 h-5 text-amber-400" aria-hidden="true" />
              <h3 className="font-serif text-[1.75rem] leading-tight font-semibold text-white text-balance">Into December</h3>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="font-serif text-xl font-semibold text-white text-balance">The drip down</h4>
                <div className="flex items-center gap-3 text-xs">
                  <button
                    type="button"
                    onClick={() => onJumpBeat(4)}
                    className="text-sky-300 hover:text-sky-200 transition"
                  >
                    Watch the drip in 3D →
                  </button>
                  <button
                    type="button"
                    onClick={() => onJumpBeat(5)}
                    className="text-amber-300 hover:text-amber-200 transition"
                  >
                    See the block in 3D →
                  </button>
                </div>
              </div>
              <p className="font-serif text-base leading-relaxed text-slate-200 text-pretty">
                The slowdown doesn’t stay up high. Wind readings at{' '}
                <span className="font-mono text-sky-200">60°N</span>, the latitude of Shetland, show it working its
                way down through the atmosphere, layer by layer.
              </p>
              <blockquote className="border-l-2 border-slate-600 pl-4 font-serif italic text-lg leading-relaxed text-slate-200 max-w-[60ch]">
                &ldquo;…what you can see is that those darker blues are sort of dripping down, oozing through the
                atmosphere and then impacting the weather nearer the surface and we’re going to feel the influence of
                that slowing down of that usual westerly wind…&rdquo;
                <footer className="mt-2 not-italic font-sans text-xs text-slate-400">
                  — {SOURCE_VIDEO.presenter}, Met Office
                </footer>
              </blockquote>
            </div>

            <div className="space-y-3">
              <h4 className="font-serif text-xl font-semibold text-white text-balance">What the forecasts showed on 17 November</h4>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/65 p-5 space-y-2">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-sky-300">From 23 November</span>
                  <p className="font-serif text-base leading-relaxed text-slate-200 text-pretty">
                    High pressure building to the east, over Scandinavia, with low pressure to the west. That brings
                    milder southerly winds for a while, but a small shift could swing in colder easterlies.
                  </p>
                </div>
                <div className="rounded-2xl border border-amber-500/35 bg-slate-900/65 p-5 space-y-2">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-amber-300">Early December</span>
                  <p className="font-serif text-base leading-relaxed text-slate-200 text-pretty">
                    Forecast models suggest high pressure moving over or close to the UK. That raises the chance of
                    easterly winds and colder weather, the classic sign at ground level two to six weeks after a
                    stratospheric shock.
                  </p>
                </div>
                <div className="rounded-2xl border border-indigo-400/35 bg-slate-900/65 p-5 space-y-2">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-indigo-300">
                    A second warming?
                  </span>
                  <p className="font-serif text-base leading-relaxed text-slate-200 text-pretty">
                    European (ECMWF) forecasts show the vortex winds recovering, but only to a weak westerly. A
                    minority of model runs suggest another slowdown, or even a reversal, in late December.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* 4. Then and now */}
          <section id="briefing-now" className="scroll-mt-24 space-y-6">
            <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
              <Gauge className="w-5 h-5 text-emerald-400" aria-hidden="true" />
              <h3 className="font-serif text-[1.75rem] leading-tight font-semibold text-white text-balance">Then and now</h3>
            </div>
            <p className="font-serif text-[17px] leading-relaxed text-slate-200 max-w-[65ch] text-pretty">
              Has the atmosphere settled down since November? Compare a typical November, the event itself and
              today’s readings.
            </p>

            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-mono uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Reading</th>
                    <th className="px-4 py-3">Typical November</th>
                    <th className="px-4 py-3 text-violet-300">November event</th>
                    <th className="px-4 py-3 text-emerald-300">Today</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-slate-300">
                  {thenAndNow.map((row) => (
                    <tr key={row.label}>
                      <td className="px-4 py-3.5">
                        <span className="block font-medium text-white">{row.label}</span>
                        <span className="block text-xs text-slate-400">{row.note}</span>
                      </td>
                      <td className="px-4 py-3.5 font-mono whitespace-nowrap">{row.typical}</td>
                      <td className="px-4 py-3.5 font-mono whitespace-nowrap text-violet-200">{row.event}</td>
                      <td className="px-4 py-3.5 font-mono whitespace-nowrap text-emerald-200">
                        {row.today ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
              <p>
                {now
                  ? 'Today’s readings come live from Open-Meteo and refresh every hour. Typical values are ERA5 averages.'
                  : 'Live readings aren’t showing right now. Typical values are ERA5 averages.'}
              </p>
              {!now && mode === 'case-study' && (
                <button
                  type="button"
                  onClick={() => onToggleMode('live')}
                  className="rounded-lg border border-emerald-400/35 bg-emerald-500/10 px-2.5 py-1 font-medium text-emerald-200 hover:bg-emerald-500/20 transition"
                >
                  Show today’s readings
                </button>
              )}
            </div>
          </section>

          {/* Credits */}
          <footer className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2 text-xs text-slate-300 max-w-2xl">
              <div className="text-[11px] font-mono uppercase tracking-widest text-slate-400">Sources and credit</div>
              <p>
                Story and quotes: the Met Office’s Deep Dive of {SOURCE_VIDEO.published}, “Stratosphere downwards”,
                presented by {SOURCE_VIDEO.presenter}.{' '}
                <a
                  href={SOURCE_VIDEO.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sky-300 underline underline-offset-2 hover:text-sky-200"
                >
                  Watch it on YouTube
                </a>
                .
              </p>
              <p>Live readings: Open-Meteo. Historical comparisons: ERA5 reanalysis (Copernicus / ECMWF).</p>
              <p className="text-slate-400">
                This is an independent explainer. It isn’t made by or affiliated with the Met Office.
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-2" role="group" aria-label="3D globe detail">
                <span className="text-slate-400">3D globe:</span>
                {(
                  [
                    ['glb', 'Detailed'],
                    ['procedural', 'Simple, for slower devices'],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={modelSource === value}
                    onClick={() => onChangeModel(value)}
                    className={`rounded-lg border px-2.5 py-1 transition-colors ${
                      modelSource === value
                        ? 'border-slate-500/60 bg-slate-700/60 text-white'
                        : 'border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => onJumpBeat(1)}
              className="shrink-0 inline-flex items-center gap-1.5 rounded-xl border border-sky-500/40 bg-sky-500/15 hover:bg-sky-500/25 px-4 py-2 text-xs font-medium text-sky-200 transition"
            >
              <ArrowUp className="w-3.5 h-3.5" aria-hidden="true" />
              Back to the globe
            </button>
          </footer>
        </div>
      </div>
    </section>
  );
}
