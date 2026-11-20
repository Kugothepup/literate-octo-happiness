import {
  ArrowUp,
  BarChart3,
  BookOpen,
  CloudRain,
  Compass,
  Eye,
  Globe2,
  Quote,
  Snowflake,
  Sparkles,
  Waves,
} from 'lucide-react';
import baseline from '../data/historicalBaseline.json';
import type { AtmosphereSnapshot, BeatId } from '../types/weather';

interface BriefingEditorialProps {
  snapshot: AtmosphereSnapshot;
  onJumpBeat: (beat: BeatId) => void;
}

const SECTION_LINKS = [
  { id: 'briefing-exec', label: 'In short' },
  { id: 'briefing-uk', label: 'UK this week' },
  { id: 'briefing-ssw', label: 'What happened up high' },
  { id: 'briefing-outlook', label: 'Into December' },
  { id: 'briefing-global', label: 'Around the world' },
  { id: 'briefing-quotes', label: 'In their words' },
] as const;

const UK_FORECAST_ROWS = [
  {
    timeframe: 'Midweek (Wed–Fri)',
    characteristics: 'A north–south split: messy rain in the south, drier and sunnier in the north.',
    context: 'Welcome rain for the south, where drought and hosepipe bans continue.',
  },
  {
    timeframe: 'Friday night to Saturday morning',
    characteristics: 'A clear, fine start for many before low pressure arrives.',
    context: 'Very cold: lows of -8°C to -9°C possible, after -7.7°C at Tulloch Bridge.',
  },
  {
    timeframe: 'Late Saturday to Sunday',
    characteristics: 'Low pressure meets the jet stream and rain spreads east.',
    context: 'Turning milder, with rain and wind.',
  },
] as const;

// Quotes are kept word for word. Only the topic and context lines are editorial.
const DEDICATED_QUOTES = [
  {
    topic: 'On measuring snow',
    quote:
      "It's actually really tricky for us to know too clearly because we don't have a huge number of snow depth gauges around the country. It's unfortunate. We don't have anywhere near as many as we do rain gauges or thermometers...",
    author: 'Alex Burkill',
    context: 'on why snow totals are hard to pin down.',
  },
  {
    topic: 'On how strong the waves were',
    quote:
      "A wave it was a significantly strong wave two, the strongest in this data record which goes back to the 1940s, not the strongest wave one, but when you combine the two together much stronger than anything we'd had in the past and much stronger than previous El Nino years...",
    author: 'Alex Burkill',
    context: "summing up Nick Silksman's analysis of the records.",
  },
  {
    topic: 'On the drip down',
    quote:
      "...what you can see is that those darker blues are sort of dripping down, oozing through the atmosphere and then impacting the weather nearer the surface and we're going to feel the influence of that slowing down of that usual westerly wind...",
    author: 'Alex Burkill',
    context: 'on how the slowdown high up reaches the surface.',
  },
  {
    topic: 'On Cyclonic Storm Akvan',
    quote:
      "This area has already seen two tropical cyclones in less than a month. So the ground is very saturated. There's the potential for a further 150, maybe 250 millimetres of rain, large storm surge, strong, gusty winds.",
    author: 'Alex Burkill',
    context: 'on the risks for India and Bangladesh.',
  },
] as const;

function jumpToSection(id: string) {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

export function BriefingEditorial({ snapshot, onJumpBeat }: BriefingEditorialProps) {
  const maxBarWave1 = Math.max(...baseline.historicalComparisonBars.map((b) => b.wave1M));
  const isLive = snapshot.fetchSource === 'live-api' || snapshot.fetchSource === 'cached-live';
  const vortexWind = snapshot.stratosphere60N.zonalMeanWindMs;

  return (
    <section
      id="briefing-editorial"
      className="relative z-20 pointer-events-auto bg-gradient-to-b from-[#040914]/0 via-[#050b18]/95 to-[#050b18] pt-24 pb-24"
    >
      <div className="bg-[#050b18]/95 border-t border-slate-800/80 backdrop-blur-md">
        <div className="mx-auto max-w-5xl px-4 sm:px-8 pt-14 pb-8 space-y-16">
          {/* Header + section links */}
          <header className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-sky-500/35 bg-sky-500/10 px-3 py-1 text-[11px] font-mono uppercase tracking-widest text-sky-300">
                <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
                The full briefing · Met Office Deep Dive, 17 Nov 2026
              </span>
            </div>

            <div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
                What November’s polar vortex shock could mean for winter
              </h1>
              <p className="mt-3 text-sm sm:text-base text-slate-300 max-w-3xl">
                A plain-English summary of the Met Office’s weekly Deep Dive: what happened 30 km above the Arctic,
                what it could mean for UK weather into December, and what else forecasters were watching.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono text-slate-300">
              <span className="rounded-lg border border-slate-800 bg-slate-900/80 px-2.5 py-1">
                Presented by <strong className="text-white">Alex Burkill</strong>, Met Office meteorologist
              </span>
              <span className="rounded-lg border border-slate-800 bg-slate-900/80 px-2.5 py-1">
                Records analysis by <strong className="text-white">Nick Silksman</strong>, Deputy Chief Meteorologist
              </span>
              <span className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1 text-indigo-200">
                {isLive ? 'Live now' : 'Case study'}: UK {snapshot.ukSurface.tempC.toFixed(1)}°C (feels{' '}
                {snapshot.ukSurface.feelsLikeC.toFixed(1)}°C) · vortex wind {vortexWind > 0 ? '+' : ''}
                {vortexWind.toFixed(1)} m/s · Scandinavia {Math.round(snapshot.scandiHigh.pressureMslHpa)} hPa
              </span>
            </div>

            <nav aria-label="Briefing sections" className="flex flex-wrap gap-2 pt-2">
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

          {/* 1. In short */}
          <section id="briefing-exec" className="scroll-mt-24 space-y-6">
            <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
              <Sparkles className="w-5 h-5 text-sky-400" aria-hidden="true" />
              <h2 className="text-2xl font-semibold text-white">In short</h2>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-violet-500/30 bg-slate-900/70 p-4">
                <div className="text-[10px] font-mono uppercase tracking-wider text-violet-300">
                  Since records began (1940s)
                </div>
                <div className="mt-1 text-xl font-bold font-mono text-white">Strongest</div>
                <p className="mt-1 text-xs text-slate-400">
                  Wave 1 and wave 2 together, for so early in the season.
                </p>
              </div>
              <div className="rounded-xl border border-sky-500/30 bg-slate-900/70 p-4">
                <div className="text-[10px] font-mono uppercase tracking-wider text-sky-300">
                  Time to reach the ground
                </div>
                <div className="mt-1 text-xl font-bold font-mono text-white">2–6 weeks</div>
                <p className="mt-1 text-xs text-slate-400">
                  For the shock to drip down, pointing to early December.
                </p>
              </div>
              <div className="rounded-xl border border-amber-500/30 bg-slate-900/70 p-4">
                <div className="text-[10px] font-mono uppercase tracking-wider text-amber-300">
                  Coldest nights forecast
                </div>
                <div className="mt-1 text-xl font-bold font-mono text-white">-8°C to -9°C</div>
                <p className="mt-1 text-xs text-slate-400">
                  Frost in the north, while rain in the south helps ease the drought.
                </p>
              </div>
              <div className="rounded-xl border border-rose-500/30 bg-slate-900/70 p-4">
                <div className="text-[10px] font-mono uppercase tracking-wider text-rose-300">
                  Cyclonic Storm Akvan
                </div>
                <div className="mt-1 text-xl font-bold font-mono text-white">150–250 mm</div>
                <p className="mt-1 text-xs text-slate-400">
                  More rain possible on saturated ground in India and Bangladesh.
                </p>
              </div>
            </div>

            <div className="space-y-4 text-sm sm:text-base leading-relaxed text-slate-300 max-w-3xl">
              <p>
                <strong className="text-white">The big story:</strong> the ring of winds circling the North Pole,
                30 km up, was knocked off course unusually early this winter. Two giant waves in the atmosphere hit it
                one after the other in late October and early November. Met Office analysis of records back to the
                1940s found that, together, they were stronger than any early-season event on record, including those
                in strong El Niño years.
              </p>
              <p>
                That shock is now &ldquo;dripping down&rdquo; through the atmosphere. If it follows the usual pattern,
                it will reach ground level over the next two to six weeks.
              </p>
              <p>
                For now, UK weather is set by a jet stream running to the south. That means rain for the drought-hit
                south and sharp frosts of <span className="font-mono text-sky-200">-8°C to -9°C</span> in the north.
                Further ahead, the chance of blocking high pressure and colder weather rises into early December.
              </p>
              <p>
                The Deep Dive also covered Cyclonic Storm Akvan heading for India and Bangladesh, a severe cyclone in
                the South Pacific, Christmas Island’s red crab migration and the Leonid meteor shower.
              </p>
            </div>
          </section>

          {/* 2. UK this week */}
          <section id="briefing-uk" className="scroll-mt-24 space-y-6">
            <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
              <Snowflake className="w-5 h-5 text-sky-400" aria-hidden="true" />
              <h2 className="text-2xl font-semibold text-white">UK weather this week</h2>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-lg font-semibold text-white">How much snow fell? Hard to say</h3>
                <button
                  type="button"
                  onClick={() => onJumpBeat(1)}
                  className="text-xs font-mono text-sky-300 hover:text-sky-200 transition"
                >
                  See the jet stream in 3D →
                </button>
              </div>
              <p className="text-sm leading-relaxed text-slate-300">
                Several centimetres of snow settled in parts of northern England and southern Scotland as weather
                systems ran into cold air.
              </p>
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-slate-200">
                <span className="font-mono text-[10px] uppercase tracking-wider text-amber-300 block mb-1">
                  Why it’s hard to measure
                </span>
                The UK has far fewer snow depth gauges than rain gauges or thermometers, so exact totals are
                uncertain.
              </div>
              <blockquote className="border-l-2 border-sky-400 pl-4 italic text-sm text-slate-300">
                &ldquo;Exactly how much snow? It&apos;s actually really tricky for us to know too clearly because we
                don&apos;t have a huge number of snow depth gauges around the country. It&apos;s unfortunate. We don&apos;t
                have anywhere near as many as we do rain gauges or thermometers...&rdquo;
                <footer className="mt-1 not-italic text-xs font-mono text-sky-300">— Alex Burkill</footer>
              </blockquote>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-white">The rest of November</h3>
              <p className="text-sm text-slate-300">
                A strong jet stream running south of the UK keeps cold air over the north and changeable weather in
                the south.
              </p>
              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-mono uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="px-4 py-3">When</th>
                      <th className="px-4 py-3">What to expect</th>
                      <th className="px-4 py-3">Worth knowing</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 text-slate-300">
                    {UK_FORECAST_ROWS.map((row) => (
                      <tr key={row.timeframe} className="hover:bg-slate-800/30 transition">
                        <td className="px-4 py-3.5 font-medium text-white whitespace-nowrap">{row.timeframe}</td>
                        <td className="px-4 py-3.5">{row.characteristics}</td>
                        <td className="px-4 py-3.5">{row.context}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* 3. What happened up high */}
          <section id="briefing-ssw" className="scroll-mt-24 space-y-6">
            <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
              <Waves className="w-5 h-5 text-violet-400" aria-hidden="true" />
              <h2 className="text-2xl font-semibold text-white">What happened 30 km up</h2>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* How it breaks down + diagram */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-lg font-semibold text-white">How a polar vortex breaks down</h3>
                  <button
                    type="button"
                    onClick={() => onJumpBeat(3)}
                    className="text-xs font-mono text-violet-300 hover:text-violet-200 transition shrink-0"
                  >
                    Watch it in 3D →
                  </button>
                </div>
                <p className="text-sm leading-relaxed text-slate-300">
                  About 30 km up, in the stratosphere, a ring of westerly winds circles the North Pole through autumn
                  and winter, trapping very cold air inside. This is the polar vortex. When it breaks down, the winds
                  slow or reverse, and the air inside sinks and warms quickly. That’s a sudden stratospheric warming,
                  or SSW.
                </p>

                <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 space-y-3 font-mono text-xs">
                  <div className="rounded-lg border border-indigo-500/40 bg-indigo-500/10 px-3 py-2 text-center text-indigo-200 font-semibold">
                    The polar vortex · 30 km up (10 hPa)
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2.5 pl-3 border-l-2 border-slate-700">
                    <div className="rounded-lg border border-violet-500/35 bg-violet-500/10 p-2.5 text-slate-200">
                      <span className="block text-[10px] text-violet-300 font-semibold">Wave 2 · late October</span>
                      Squeezes the vortex into a dumbbell, slowing and splitting it
                    </div>
                    <div className="rounded-lg border border-rose-500/35 bg-rose-500/10 p-2.5 text-slate-200">
                      <span className="block text-[10px] text-rose-300 font-semibold">Wave 1 · early November</span>
                      One big ridge pushes it off the pole towards Russia
                    </div>
                  </div>
                  <div className="rounded-lg border border-sky-500/40 bg-sky-500/10 px-3 py-2 text-center text-sky-200 font-semibold">
                    Result: a likely major SSW, then a slow drip down to the ground over 2–6 weeks
                  </div>
                </div>
              </div>

              {/* Major or minor + wave comparison */}
              <div className="space-y-6">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-3">
                  <h3 className="text-lg font-semibold text-white">Major or minor? Probably major</h3>
                  <ul className="space-y-2.5 text-sm text-slate-300">
                    <li>
                      <strong className="text-white">Likely major.</strong> That means the westerly winds fully
                      reversed to blow from the east.
                    </li>
                    <li>
                      <strong className="text-white">Not yet confirmed.</strong> That needs a formal re-analysis. For
                      our weather it barely matters: winds that fully reversed and winds that almost stopped have much
                      the same effect at the surface.
                    </li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-white">
                      <BarChart3 className="w-4 h-4 text-violet-400" aria-hidden="true" />
                      <span>How big were the waves?</span>
                    </div>
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
                  <p className="text-xs text-slate-400">Height of each wave in metres. ERA5 records, 1940 to now.</p>
                  <div className="space-y-3">
                    {baseline.historicalComparisonBars.map((row) => (
                      <div key={row.label} className="space-y-1 text-xs">
                        <div className="flex justify-between font-mono text-slate-300">
                          <span>{row.label}</span>
                          <span>
                            {row.wave1M} m · {row.wave2M} m
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
              </div>
            </div>

            {/* How unusual was it? */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
              <h3 className="text-lg font-semibold text-white">How unusual was it?</h3>
              <p className="text-sm text-slate-300">
                <strong className="text-white">Nick Silksman</strong>, Deputy Chief Meteorologist at the Met Office,
                compared this event with ERA5 records going back to the 1940s:
              </p>
              <ol className="grid gap-3 md:grid-cols-3 text-sm text-slate-300">
                <li className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                  <span className="font-mono text-xs text-violet-300 font-semibold block mb-1">
                    1. Wave 2 · late October to 2 November
                  </span>
                  Rising and falling pressure across thousands of miles squeezed the vortex into a dumbbell and split
                  it. It was the strongest early-season wave 2 in the record.
                </li>
                <li className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                  <span className="font-mono text-xs text-rose-300 font-semibold block mb-1">
                    2. Wave 1 · up to 6 November
                  </span>
                  One big ridge, starting over the Pacific and North America, pushed east and shoved the vortex off
                  the pole towards Russia.
                </li>
                <li className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                  <span className="font-mono text-xs text-sky-300 font-semibold block mb-1">3. Together</span>
                  Stronger wave 1 events have happened before. But the two together are off the chart, beyond even
                  strong El Niño years. (El Niño doesn’t reliably predict how strong an early SSW will be.)
                </li>
              </ol>

              <blockquote className="border-l-2 border-violet-400 pl-4 italic text-sm text-slate-300">
                &ldquo;A wave it was a significantly strong wave two, the strongest in this data record which goes back to
                the 1940s... when you combine the two together much stronger than anything we&apos;d had in the past and
                much stronger than previous El Nino years...&rdquo;
                <footer className="mt-1 not-italic text-xs font-mono text-violet-300">— Alex Burkill</footer>
              </blockquote>
            </div>
          </section>

          {/* 4. Into December */}
          <section id="briefing-outlook" className="scroll-mt-24 space-y-6">
            <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
              <Compass className="w-5 h-5 text-amber-400" aria-hidden="true" />
              <h2 className="text-2xl font-semibold text-white">Into December: what it could mean for the UK</h2>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-lg font-semibold text-white">The drip down</h3>
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
                Wind readings at <span className="font-mono text-sky-200">60°N</span>, the latitude of Shetland, from
                30 km up to ground level show the slowdown working its way down, &ldquo;dripping&rdquo; or
                &ldquo;oozing&rdquo; through the layers below.
              </p>
              <blockquote className="border-l-2 border-sky-400 pl-4 italic text-sm text-slate-300">
                &ldquo;...what you can see is that those darker blues are sort of dripping down, oozing through the
                atmosphere and then impacting the weather nearer the surface and we&apos;re going to feel the influence of
                that slowing down of that usual westerly wind...&rdquo;
                <footer className="mt-1 not-italic text-xs font-mono text-sky-300">— Alex Burkill</footer>
              </blockquote>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-white">The outlook</h3>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/65 p-5 space-y-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-sky-300">From 23 November</span>
                  <p className="text-sm leading-relaxed text-slate-300">
                    High pressure looks likely to the east, over Scandinavia, with low pressure to the west. That
                    brings milder southerly winds for a while, though a small shift could swing in colder easterlies.
                  </p>
                </div>
                <div className="rounded-2xl border border-amber-500/35 bg-slate-900/65 p-5 space-y-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300">Early December</span>
                  <p className="text-sm leading-relaxed text-slate-300">
                    Forecast models suggest high pressure moving over or near the UK. That raises the chance of
                    blocking, easterly winds and colder weather: the classic signal at the surface 2–6 weeks after a
                    stratospheric shock.
                  </p>
                </div>
                <div className="rounded-2xl border border-violet-500/35 bg-slate-900/65 p-5 space-y-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-violet-300">
                    A second warming?
                  </span>
                  <p className="text-sm leading-relaxed text-slate-300">
                    European (ECMWF) forecasts show the vortex winds recovering to a weak westerly. A minority of model
                    runs suggest another weakening, or even a reversal, in late December.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* 5. Around the world */}
          <section id="briefing-global" className="scroll-mt-24 space-y-6">
            <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
              <Globe2 className="w-5 h-5 text-emerald-400" aria-hidden="true" />
              <h2 className="text-2xl font-semibold text-white">Also in this week’s Deep Dive</h2>
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
              {/* Tropical cyclones */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/65 p-5 space-y-3">
                <div className="flex items-center gap-2 text-rose-300 font-semibold">
                  <CloudRain className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <h3>Tropical cyclones</h3>
                </div>
                <div className="space-y-3 text-sm text-slate-300">
                  <div>
                    <strong className="text-white block">A severe cyclone in the South Pacific</strong>
                    Satellite pictures show a clear eye. It’s staying out at sea, north-east of Fiji and Samoa, with no
                    landfall expected.
                  </div>
                  <div className="pt-2 border-t border-slate-800 space-y-1.5">
                    <strong className="text-white block">Cyclonic Storm Akvan, Bay of Bengal</strong>
                    Heading north towards eastern India and Bangladesh, due to make landfall late Thursday into Friday.
                    <ul className="list-disc list-inside text-xs text-slate-400 space-y-1 pt-1">
                      <li>
                        <strong className="text-slate-200">Expected:</strong> 150–250 mm of rain, a dangerous storm
                        surge and strong winds.
                      </li>
                      <li>
                        <strong className="text-slate-200">Why it’s worse:</strong> the third cyclone in under a month,
                        hitting saturated ground in what’s normally a dry season.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Christmas Island crabs */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/65 p-5 space-y-3">
                <div className="flex items-center gap-2 text-amber-300 font-semibold">
                  <Sparkles className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <h3>Christmas Island’s red crabs</h3>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Tens of millions of red crabs on Australia’s Christmas Island have started their yearly march from
                  the forest to the sea to breed.
                </p>
                <ul className="space-y-2 text-xs text-slate-300 pt-1">
                  <li className="rounded-lg bg-slate-950/70 border border-slate-800 p-3">
                    <strong className="text-sky-300 block mb-0.5">What sets them off</strong>
                    The first rains of the wet season.
                  </li>
                  <li className="rounded-lg bg-slate-950/70 border border-slate-800 p-3">
                    <strong className="text-emerald-300 block mb-0.5">Helping them across</strong>
                    Rangers spend months preparing, building crab bridges and closing roads.
                  </li>
                </ul>
              </div>

              {/* Leonids */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/65 p-5 space-y-3">
                <div className="flex items-center gap-2 text-indigo-300 font-semibold">
                  <Eye className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <h3>The Leonid meteor shower</h3>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  The Leonids peaked on the night of 17 November but carry on until 30 November.
                </p>
                <div className="space-y-2 text-xs text-slate-300">
                  <div>
                    <strong className="text-white">Where they come from:</strong> dust from comet{' '}
                    <span className="font-mono text-indigo-200">55P/Tempel-Tuttle</span>.
                  </div>
                  <div>
                    <strong className="text-white">How many:</strong> 10 to 15 an hour at the peak. Look after midnight,
                    away from street lights.
                  </div>
                  <div className="rounded-lg bg-slate-950/70 border border-slate-800 p-3 space-y-1.5">
                    <strong className="text-white block">Can we see them from the UK?</strong>
                    <p className="text-slate-400">
                      <strong className="text-slate-200">Peak night (17 Nov):</strong> mostly not. Thick cloud and rain
                      over Scotland, northern England and Northern Ireland; a few breaks over Wales, south-west England
                      and the Republic of Ireland.
                    </p>
                    <p className="text-slate-400">
                      <strong className="text-slate-200">After that:</strong> cloudy until Thursday. Friday night into
                      Saturday is the best bet, with clear, cold, frosty skies in the north.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 6. In their words */}
          <section id="briefing-quotes" className="scroll-mt-24 space-y-6">
            <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
              <Quote className="w-5 h-5 text-sky-400" aria-hidden="true" />
              <h2 className="text-2xl font-semibold text-white">In their words</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {DEDICATED_QUOTES.map((q) => (
                <figure
                  key={q.topic}
                  className="rounded-2xl border border-slate-800 bg-slate-900/65 p-5 flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="text-[11px] font-mono uppercase tracking-wider text-sky-300 mb-2">{q.topic}</div>
                    <blockquote className="text-sm italic leading-relaxed text-slate-200">&ldquo;{q.quote}&rdquo;</blockquote>
                  </div>
                  <figcaption className="pt-2 border-t border-slate-800/80 text-xs text-slate-400">
                    <strong className="text-white font-mono">— {q.author}</strong>, {q.context}
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>

          {/* Sources */}
          <footer className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2 text-xs text-slate-300 max-w-2xl">
              <div className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Sources</div>
              <p>
                Based on the Met Office’s weekly Deep Dive of 17 November 2026, presented by Alex Burkill. Quotes are
                from that video.
              </p>
              <p>
                Live readings from Open-Meteo. Historical comparisons from the ERA5 reanalysis (Copernicus / ECMWF).
              </p>
              <p className="text-slate-400">This is an independent explainer, not a Met Office product.</p>
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
