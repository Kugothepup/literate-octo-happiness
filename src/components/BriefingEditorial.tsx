import { ArrowUp, BarChart3, Compass, Gauge, Waves } from 'lucide-react';
import baseline from '../data/historicalBaseline.json';
import { SOURCE_VIDEO } from '../data/source';
import { getCaseStudySnapshot } from '../services/weatherData';
import type { AtmosphereSnapshot, BeatId, WeatherMode } from '../types/weather';
import { VideoCredit } from './VideoCredit';

interface BriefingEditorialProps {
  snapshot: AtmosphereSnapshot;
  mode: WeatherMode;
  onToggleMode: (next: WeatherMode) => void;
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

function jumpToSection(id: string) {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function signed(n: number, digits = 1): string {
  return `${n > 0 ? '+' : ''}${n.toFixed(digits)}`;
}

export function BriefingEditorial({ snapshot, mode, onToggleMode, onJumpBeat }: BriefingEditorialProps) {
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
            <h2 id="briefing-title" className="text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
              Inside November’s polar vortex shock
            </h2>
            <p className="text-base sm:text-lg text-slate-300 max-w-3xl">
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
              <Waves className="w-5 h-5 text-violet-400" aria-hidden="true" />
              <h3 className="text-2xl font-semibold text-white">What happened 30 km up</h3>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-lg font-semibold text-white">How a polar vortex breaks down</h4>
                  <button
                    type="button"
                    onClick={() => onJumpBeat(3)}
                    className="text-xs font-mono text-violet-300 hover:text-violet-200 transition shrink-0"
                  >
                    Watch it in 3D →
                  </button>
                </div>
                <p className="text-sm leading-relaxed text-slate-300">
                  About 30 km above the Arctic, a ring of westerly winds circles the North Pole every autumn and
                  winter. It keeps the coldest air penned in over the pole. This is the polar vortex.
                </p>
                <p className="text-sm leading-relaxed text-slate-300">
                  Sometimes the ring gets knocked off balance. Its winds slow down or even turn round, and the air
                  inside sinks and heats up fast. That’s why it’s called a sudden stratospheric warming, or SSW.
                </p>

                <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 space-y-3 font-mono text-xs">
                  <div className="rounded-lg border border-indigo-500/40 bg-indigo-500/10 px-3 py-2 text-center text-indigo-200 font-semibold">
                    The polar vortex, 30 km up
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2.5 pl-3 border-l-2 border-slate-700">
                    <div className="rounded-lg border border-violet-500/35 bg-violet-500/10 p-2.5 text-slate-200">
                      <span className="block text-[10px] text-violet-300 font-semibold">Wave 2 · late October</span>
                      Squeezed it into a dumbbell shape, slowing it and splitting it in two
                    </div>
                    <div className="rounded-lg border border-rose-500/35 bg-rose-500/10 p-2.5 text-slate-200">
                      <span className="block text-[10px] text-rose-300 font-semibold">Wave 1 · early November</span>
                      One huge ridge pushed what was left off the pole, towards Russia
                    </div>
                  </div>
                  <div className="rounded-lg border border-sky-500/40 bg-sky-500/10 px-3 py-2 text-center text-sky-200 font-semibold">
                    The result: a likely major SSW, then a slow drip down to the ground over 2–6 weeks
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-3 self-start">
                <h4 className="text-lg font-semibold text-white">Major or minor?</h4>
                <p className="text-sm leading-relaxed text-slate-300">
                  Probably major. That means the winds didn’t just slow down: they reversed and blew from the east.
                </p>
                <p className="text-sm leading-relaxed text-slate-300">
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
              <BarChart3 className="w-5 h-5 text-violet-400" aria-hidden="true" />
              <h3 className="text-2xl font-semibold text-white">How unusual was it?</h3>
            </div>

            <p className="text-sm sm:text-base leading-relaxed text-slate-300 max-w-3xl">
              At the end of October, <strong className="text-white">Nick Silksman</strong>, Deputy Chief
              Meteorologist at the Met Office, checked how rare this was. He compared the waves with ERA5 records
              going back to the 1940s, including very strong El Niño years.
            </p>

            <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold text-white">How big were the waves?</h4>
                  <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400">
                    <span className="inline-flex items-center gap-1">
                      <span className="inline-block w-2.5 h-2.5 rounded-full bg-rose-400" aria-hidden="true" />
                      Wave 1
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="inline-block w-2.5 h-2.5 rounded-full bg-violet-400" aria-hidden="true" />
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
                            className="h-full bg-rose-400 rounded-full"
                            style={{ width: `${Math.round((row.wave1M / maxBarWave1) * 100)}%` }}
                          />
                        </div>
                        <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-violet-400 rounded-full"
                            style={{ width: `${Math.round((row.wave2M / maxBarWave1) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <ol className="grid gap-3 text-sm text-slate-300">
                <li className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                  <span className="font-mono text-xs text-violet-300 font-semibold block mb-1">
                    Wave 2 · late October to 2 November
                  </span>
                  Pressure rising and falling across thousands of miles squeezed the vortex into a dumbbell and split
                  it. It was the strongest early-season wave 2 on record.
                </li>
                <li className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                  <span className="font-mono text-xs text-rose-300 font-semibold block mb-1">
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

            <blockquote className="border-l-2 border-violet-400 pl-4 italic text-sm text-slate-300 max-w-3xl">
              &ldquo;A wave it was a significantly strong wave two, the strongest in this data record which goes back to
              the 1940s... when you combine the two together much stronger than anything we&apos;d had in the past and
              much stronger than previous El Nino years...&rdquo;
              <footer className="mt-1 not-italic text-xs font-mono text-violet-300">
                — {SOURCE_VIDEO.presenter}, Met Office
              </footer>
            </blockquote>
          </section>

          {/* 3. Into December */}
          <section id="briefing-outlook" className="scroll-mt-24 space-y-6">
            <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
              <Compass className="w-5 h-5 text-amber-400" aria-hidden="true" />
              <h3 className="text-2xl font-semibold text-white">Into December</h3>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-lg font-semibold text-white">The drip down</h4>
                <div className="flex items-center gap-3 text-xs font-mono">
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
              <p className="text-sm leading-relaxed text-slate-300">
                The slowdown doesn’t stay up high. Wind readings at{' '}
                <span className="font-mono text-sky-200">60°N</span>, the latitude of Shetland, show it working its
                way down through the atmosphere, layer by layer.
              </p>
              <blockquote className="border-l-2 border-sky-400 pl-4 italic text-sm text-slate-300">
                &ldquo;...what you can see is that those darker blues are sort of dripping down, oozing through the
                atmosphere and then impacting the weather nearer the surface and we&apos;re going to feel the influence of
                that slowing down of that usual westerly wind...&rdquo;
                <footer className="mt-1 not-italic text-xs font-mono text-sky-300">
                  — {SOURCE_VIDEO.presenter}, Met Office
                </footer>
              </blockquote>
            </div>

            <div className="space-y-3">
              <h4 className="text-lg font-semibold text-white">What the forecasts showed on 17 November</h4>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/65 p-5 space-y-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-sky-300">From 23 November</span>
                  <p className="text-sm leading-relaxed text-slate-300">
                    High pressure building to the east, over Scandinavia, with low pressure to the west. That brings
                    milder southerly winds for a while, but a small shift could swing in colder easterlies.
                  </p>
                </div>
                <div className="rounded-2xl border border-amber-500/35 bg-slate-900/65 p-5 space-y-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300">Early December</span>
                  <p className="text-sm leading-relaxed text-slate-300">
                    Forecast models suggest high pressure moving over or close to the UK. That raises the chance of
                    easterly winds and colder weather, the classic sign at ground level two to six weeks after a
                    stratospheric shock.
                  </p>
                </div>
                <div className="rounded-2xl border border-violet-500/35 bg-slate-900/65 p-5 space-y-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-violet-300">
                    A second warming?
                  </span>
                  <p className="text-sm leading-relaxed text-slate-300">
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
              <h3 className="text-2xl font-semibold text-white">Then and now</h3>
            </div>
            <p className="text-sm sm:text-base leading-relaxed text-slate-300 max-w-3xl">
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
                  className="rounded-lg border border-emerald-400/35 bg-emerald-500/10 px-2.5 py-1 font-mono text-emerald-200 hover:bg-emerald-500/20 transition"
                >
                  Show today’s readings
                </button>
              )}
            </div>
          </section>

          {/* Credits */}
          <footer className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2 text-xs text-slate-300 max-w-2xl">
              <div className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Sources and credit</div>
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
            </div>

            <button
              type="button"
              onClick={() => onJumpBeat(1)}
              className="shrink-0 inline-flex items-center gap-1.5 rounded-xl border border-sky-500/40 bg-sky-500/15 hover:bg-sky-500/25 px-4 py-2 text-xs font-mono text-sky-200 transition"
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
