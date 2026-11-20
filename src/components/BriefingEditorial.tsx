import {
  ArrowUp,
  BarChart3,
  BookOpen,
  CloudRain,
  Compass,
  Eye,
  Globe2,
  Mail,
  Quote,
  Snowflake,
  Sparkles,
  Waves,
  Youtube,
} from 'lucide-react';
import baseline from '../data/historicalBaseline.json';
import type { AtmosphereSnapshot, BeatId } from '../types/weather';

interface BriefingEditorialProps {
  snapshot: AtmosphereSnapshot;
  onJumpBeat: (beat: BeatId) => void;
}

const SECTION_LINKS = [
  { id: 'briefing-exec', label: 'Executive Summary' },
  { id: 'briefing-uk', label: 'UK Weather' },
  { id: 'briefing-ssw', label: 'SSW & Waves' },
  { id: 'briefing-outlook', label: 'Winter Outlook' },
  { id: 'briefing-global', label: 'Global Events' },
  { id: 'briefing-quotes', label: 'Key Quotes' },
] as const;

const UK_FORECAST_ROWS = [
  {
    timeframe: 'Mid-Week (Wed–Fri)',
    characteristics:
      'North-South Split; messy rain across south; drier, sunnier in north.',
    context:
      'Southern rain is beneficial for severe drought conditions and ongoing hosepipe bans.',
  },
  {
    timeframe: 'Friday Night / Sat Morning',
    characteristics:
      'Clear, fine start in many areas before incoming low pressure.',
    context:
      'Extreme cold; potential overnight lows of -8°C to -9°C (following -7.7°C at Tulloch Bridge).',
  },
  {
    timeframe: 'Late Saturday – Sunday',
    characteristics:
      'Low pressure interacts with jet stream; wet weather moves east.',
    context: 'Transition to milder air accompanied by rain and wind.',
  },
] as const;

const DEDICATED_QUOTES = [
  {
    topic: 'On Snow Depth Data Deficits',
    quote:
      "It's actually really tricky for us to know too clearly because we don't have a huge number of snow depth gauges around the country. It's unfortunate. We don't have anywhere near as many as we do rain gauges or thermometers...",
    author: 'Alex Burkill',
    context: 'Addressing the observational challenges during early winter snow events.',
  },
  {
    topic: 'On the Unprecedented Nature of the Stratospheric Waves',
    quote:
      "A wave it was a significantly strong wave two, the strongest in this data record which goes back to the 1940s, not the strongest wave one, but when you combine the two together much stronger than anything we'd had in the past and much stronger than previous El Nino years...",
    author: 'Alex Burkill',
    context: "Synthesizing Deputy Chief Meteorologist Nick Silksman's ERA5 re-analysis.",
  },
  {
    topic: 'On Atmospheric Downward Propagation ("Oozing")',
    quote:
      "...what you can see is that those darker blues are sort of dripping down, oozing through the atmosphere and then impacting the weather nearer the surface and we're going to feel the influence of that slowing down of that usual westerly wind...",
    author: 'Alex Burkill',
    context: 'Explaining how stratospheric wind disruptions descend to surface weather levels.',
  },
  {
    topic: 'On the Severe Impacts of Cyclonic Storm Akvan',
    quote:
      "This area has already seen two tropical cyclones in less than a month. So the ground is very saturated. There's the potential for a further 150, maybe 250 millimetres of rain, large storm surge, strong, gusty winds.",
    author: 'Alex Burkill',
    context: 'Highlighting compounding weather risks in India and Bangladesh.',
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

  return (
    <section
      id="briefing-editorial"
      className="relative z-20 pointer-events-auto bg-gradient-to-b from-[#040914]/0 via-[#050b18]/95 to-[#050b18] pt-24 pb-24"
    >
      <div className="bg-[#050b18]/95 border-t border-slate-800/80 backdrop-blur-md">
        <div className="mx-auto max-w-5xl px-4 sm:px-8 pt-14 pb-8 space-y-16">
          {/* Editorial Hero Header + Sticky-Style Jump Pills */}
          <header className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-sky-500/35 bg-sky-500/10 px-3 py-1 text-[11px] font-mono uppercase tracking-widest text-sky-300">
                <BookOpen className="w-3.5 h-3.5" />
                Briefing Document · Met Office Deep Dive Synthesis
              </span>
              <button
                type="button"
                onClick={() => onJumpBeat(1)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-900/80 hover:border-sky-400/50 hover:text-sky-200 px-3 py-1.5 text-xs font-mono text-slate-300 transition"
              >
                <ArrowUp className="w-3.5 h-3.5" />
                Return to 3D Globe
              </button>
            </div>

            <div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
                Stratospheric Dynamics, UK Winter Outlook, and Global Weather Phenomena
              </h1>
              <p className="mt-3 text-sm sm:text-base text-slate-300 max-w-3xl">
                Complete meteorological synthesis of the Met Office weekly Deep Dive analysis, linking the
                record-breaking early Sudden Stratospheric Warming to UK winter probabilities and active global weather events.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono text-slate-300">
              <span className="rounded-lg border border-slate-800 bg-slate-900/80 px-2.5 py-1">
                Presenter: <strong className="text-white">Alex Burkill</strong> (Meteorologist)
              </span>
              <span className="rounded-lg border border-slate-800 bg-slate-900/80 px-2.5 py-1">
                ERA5 Analysis: <strong className="text-white">Nick Silksman</strong> (Deputy Chief Meteorologist)
              </span>
              <span className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1 text-indigo-200">
                Active Telemetry: UK {snapshot.ukSurface.tempC.toFixed(1)}°C (Feels{' '}
                {snapshot.ukSurface.feelsLikeC.toFixed(1)}°C) · 60°N u10{' '}
                {snapshot.stratosphere60N.zonalMeanWindMs.toFixed(1)} m/s · Scandi{' '}
                {Math.round(snapshot.scandiHigh.pressureMslHpa)} hPa
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

          {/* 1. Executive Summary */}
          <section id="briefing-exec" className="scroll-mt-24 space-y-6">
            <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
              <Sparkles className="w-5 h-5 text-sky-400" />
              <h2 className="text-2xl font-semibold text-white">Executive Summary</h2>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-violet-500/30 bg-slate-900/70 p-4">
                <div className="text-[10px] font-mono uppercase tracking-wider text-violet-300">
                  ERA5 Historical Rank
                </div>
                <div className="mt-1 text-xl font-bold font-mono text-white">1940s+ Record</div>
                <p className="mt-1 text-xs text-slate-400">
                  Unprecedented combined Wave 2 + Wave 1 forcing in late Oct / early Nov.
                </p>
              </div>
              <div className="rounded-xl border border-sky-500/30 bg-slate-900/70 p-4">
                <div className="text-[10px] font-mono uppercase tracking-wider text-sky-300">
                  Surface Coupling Lag
                </div>
                <div className="mt-1 text-xl font-bold font-mono text-white">2–6 Weeks</div>
                <p className="mt-1 text-xs text-slate-400">
                  Stratospheric signals dripping down toward early December blocking.
                </p>
              </div>
              <div className="rounded-xl border border-amber-500/30 bg-slate-900/70 p-4">
                <div className="text-[10px] font-mono uppercase tracking-wider text-amber-300">
                  Short-Term Northern Cold
                </div>
                <div className="mt-1 text-xl font-bold font-mono text-white">-8°C to -9°C</div>
                <p className="mt-1 text-xs text-slate-400">
                  Sharp frosts in the north while southern jet rains ease drought.
                </p>
              </div>
              <div className="rounded-xl border border-rose-500/30 bg-slate-900/70 p-4">
                <div className="text-[10px] font-mono uppercase tracking-wider text-rose-300">
                  Cyclonic Storm Akvan
                </div>
                <div className="mt-1 text-xl font-bold font-mono text-white">150–250 mm</div>
                <p className="mt-1 text-xs text-slate-400">
                  Extreme rainfall threat over saturated ground in India &amp; Bangladesh.
                </p>
              </div>
            </div>

            <div className="space-y-4 text-sm sm:text-base leading-relaxed text-slate-300">
              <p>
                This briefing document synthesizes key meteorological insights, stratospheric analyses, and global
                weather events detailed in the Met Office&apos;s weekly Deep Dive analysis presented by meteorologist{' '}
                <strong className="text-white">Alex Burkill</strong>.
              </p>
              <p>
                The primary takeaway is the occurrence of an exceptionally early{' '}
                <strong className="text-white">Sudden Stratospheric Warming (SSW)</strong> event driven by an
                unprecedented combination of planetary wave activities. Historical re-analysis back to the 1940s reveals
                that the combined force of Wave 2 and Wave 1 atmospheric disturbances in late October and early November
                was stronger than any previously recorded early-season event, including those during strong El Niño years.
              </p>
              <p>
                This stratospheric breakdown is currently &ldquo;dripping down&rdquo; through the atmosphere, with
                surface-level impacts expected to materialize over the next two to six weeks. While short-term UK
                weather remains dominated by a jet stream positioned to the south—bringing heavy rain to drought-stricken
                southern regions and sharp frosts reaching <span className="font-mono text-sky-200">-8°C to -9°C</span> in
                the north—the medium-to-long-term outlook points to an increased likelihood of atmospheric blocking high
                pressure and colder conditions developing by early December.
              </p>
              <p>
                Globally, significant weather phenomena include Cyclonic Storm Akvan approaching India and Bangladesh with
                heavy rainfall (150–250 mm), a severe tropical cyclone in the South Pacific, the annual weather-triggered
                red crab migration on Christmas Island, and variable viewing conditions for the peak of the Leonid
                meteor shower.
              </p>
            </div>
          </section>

          {/* 2. Short-Term UK Weather & Observational Data */}
          <section id="briefing-uk" className="scroll-mt-24 space-y-6">
            <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
              <Snowflake className="w-5 h-5 text-sky-400" />
              <h2 className="text-2xl font-semibold text-white">Short-Term UK Weather &amp; Observational Data</h2>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-lg font-semibold text-white">
                  Recent Snowfall &amp; Measurement Challenges
                </h3>
                <button
                  type="button"
                  onClick={() => onJumpBeat(1)}
                  className="text-xs font-mono text-sky-300 hover:text-sky-200 transition"
                >
                  Inspect Beat 1 in 3D →
                </button>
              </div>
              <p className="text-sm leading-relaxed text-slate-300">
                Recent weather brought accumulated snowfall of several centimeters to parts of northern England and
                southern Scotland as incoming weather systems interacted with cold air masses.
              </p>
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-slate-200">
                <span className="font-mono text-[10px] uppercase tracking-wider text-amber-300 block mb-1">
                  Observational Limitation
                </span>
                The Met Office highlighted the challenge in measuring precise snow accumulation due to a nationwide
                shortage of dedicated snow depth gauges compared to standard rain gauges and thermometers.
              </div>
              <blockquote className="border-l-2 border-sky-400 pl-4 italic text-sm text-slate-300">
                &ldquo;Exactly how much snow? It&apos;s actually really tricky for us to know too clearly because we
                don&apos;t have a huge number of snow depth gauges around the country. It&apos;s unfortunate. We don&apos;t
                have anywhere near as many as we do rain gauges or thermometers...&rdquo;
                <footer className="mt-1 not-italic text-xs font-mono text-sky-300">— Alex Burkill</footer>
              </blockquote>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-white">Mid-to-Late November UK Forecast</h3>
              <p className="text-sm text-slate-300">
                The immediate pattern is shaped by a strong jet stream running south of the UK, maintaining cold air over
                northern regions while changeable conditions affect the south.
              </p>
              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-mono uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="px-4 py-3">Timeframe / Region</th>
                      <th className="px-4 py-3">Weather Characteristics</th>
                      <th className="px-4 py-3">Temperature / Environmental Context</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 text-slate-300">
                    {UK_FORECAST_ROWS.map((row) => (
                      <tr key={row.timeframe} className="hover:bg-slate-800/30 transition">
                        <td className="px-4 py-3.5 font-medium text-white whitespace-nowrap">
                          {row.timeframe}
                        </td>
                        <td className="px-4 py-3.5">{row.characteristics}</td>
                        <td className="px-4 py-3.5">{row.context}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* 3. SSW Mechanics & Planetary Wave Analysis */}
          <section id="briefing-ssw" className="scroll-mt-24 space-y-6">
            <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
              <Waves className="w-5 h-5 text-violet-400" />
              <h2 className="text-2xl font-semibold text-white">
                Sudden Stratospheric Warming (SSW) Mechanics &amp; Wave Analysis
              </h2>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Breakdown Mechanism + Diagram */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-lg font-semibold text-white">Atmospheric Breakdown Mechanism</h3>
                  <button
                    type="button"
                    onClick={() => onJumpBeat(3)}
                    className="text-xs font-mono text-violet-300 hover:text-violet-200 transition"
                  >
                    Inspect Beat 3 in 3D →
                  </button>
                </div>
                <p className="text-sm leading-relaxed text-slate-300">
                  An SSW occurs approximately 30 kilometers above the Earth&apos;s surface in the stratosphere (at the 10
                  hectopascal pressure level). During autumn and winter, cold air over the North Pole is encircled by
                  westerly winds forming the stratospheric polar vortex. When this vortex breaks down, winds slow or
                  reverse to an easterly direction, causing air within the vortex to merge, sink, and rapidly warm.
                </p>

                {/* Clean Flow Diagram mirroring the SSW schematic */}
                <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 space-y-3 font-mono text-xs">
                  <div className="rounded-lg border border-indigo-500/40 bg-indigo-500/10 px-3 py-2 text-center text-indigo-200 font-semibold">
                    Stratospheric Polar Vortex (10 hPa / ~30 km up)
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2.5 pl-3 border-l-2 border-slate-700">
                    <div className="rounded-lg border border-violet-500/35 bg-violet-500/10 p-2.5 text-slate-200">
                      <span className="block text-[10px] text-violet-300 font-semibold">
                        Wave 2 (Late Oct)
                      </span>
                      Pinches vortex into dumbbell shape (Slowing / Splitting)
                    </div>
                    <div className="rounded-lg border border-rose-500/35 bg-rose-500/10 p-2.5 text-slate-200">
                      <span className="block text-[10px] text-rose-300 font-semibold">
                        Wave 1 (Early Nov)
                      </span>
                      Single ridge displaces vortex toward Russia
                    </div>
                  </div>
                  <div className="rounded-lg border border-sky-500/40 bg-sky-500/10 px-3 py-2 text-center text-sky-200 font-semibold">
                    Result: Major SSW Event &amp; Downward Atmospheric Propagation (~2–6 Weeks to Surface)
                  </div>
                </div>
              </div>

              {/* Classification + Historical Comparison Bars */}
              <div className="space-y-6">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-3">
                  <h3 className="text-lg font-semibold text-white">Classification: Major vs. Minor SSW</h3>
                  <ul className="space-y-2.5 text-sm text-slate-300">
                    <li>
                      <strong className="text-white">Status:</strong> The event is highly likely to have been a{' '}
                      <span className="text-rose-300 font-medium">Major SSW</span>, which requires stratospheric
                      westerly winds to fully reverse to an easterly direction.
                    </li>
                    <li>
                      <strong className="text-white">Verification:</strong> Full 100% confirmation requires formal
                      meteorological re-analysis. However, the surface-level impacts remain functionally identical
                      whether the winds fully reversed or merely decayed into a very weak westerly pattern.
                    </li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-white">
                    <BarChart3 className="w-4 h-4 text-violet-400" />
                    <span>ERA5 Planetary Wave Comparison (1940–present)</span>
                  </div>
                  <div className="space-y-3">
                    {baseline.historicalComparisonBars.map((row) => (
                      <div key={row.label} className="space-y-1 text-xs">
                        <div className="flex justify-between font-mono text-slate-300">
                          <span>{row.label}</span>
                          <span>
                            W1 {row.wave1M} m · W2 {row.wave2M} m
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

            {/* Nick Silksman 3-point Diagnostic + Verbatim Quote */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
              <h3 className="text-lg font-semibold text-white">
                Planetary Wave Diagnostics &amp; Historical Record
              </h3>
              <p className="text-sm text-slate-300">
                <strong className="text-white">Nick Silksman</strong>, Deputy Chief Meteorologist at the Met Office,
                conducted an analysis evaluating the uniqueness of this early-season event using ERA5 re-analysis data
                dating back to the 1940s:
              </p>
              <ol className="grid gap-3 md:grid-cols-3 text-sm text-slate-300">
                <li className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                  <span className="font-mono text-xs text-violet-300 font-semibold block mb-1">
                    1. Wave 2 Dynamics (Late Oct – Nov 2)
                  </span>
                  Atmospheric pressure rises and falls over thousands of miles pinched the polar vortex into a dumbbell
                  shape, splitting it. This Wave 2 disturbance was significantly stronger than any early-season Wave 2
                  event recorded since the 1940s.
                </li>
                <li className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                  <span className="font-mono text-xs text-rose-300 font-semibold block mb-1">
                    2. Wave 1 Dynamics (Up to Nov 6)
                  </span>
                  A single prominent ridge originating over the Pacific and North America pushed eastwards, displacing the
                  core of the polar vortex away from the North Pole toward Russia.
                </li>
                <li className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                  <span className="font-mono text-xs text-sky-300 font-semibold block mb-1">
                    3. Combined Impact
                  </span>
                  While individual Wave 1 events have been stronger in past records, the combined Wave 1 and Wave 2
                  sequence is off the historical chart—surpassing strong El Niño benchmarks (with no direct correlation
                  between El Niño and early SSW strength).
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

          {/* 4. Downward Propagation & UK Winter Outlook */}
          <section id="briefing-outlook" className="scroll-mt-24 space-y-6">
            <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
              <Compass className="w-5 h-5 text-amber-400" />
              <h2 className="text-2xl font-semibold text-white">
                Downward Atmospheric Propagation &amp; UK Winter Outlook
              </h2>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-lg font-semibold text-white">Downward Propagation Mechanism</h3>
                <div className="flex items-center gap-3 text-xs font-mono">
                  <button
                    type="button"
                    onClick={() => onJumpBeat(4)}
                    className="text-sky-300 hover:text-sky-200 transition"
                  >
                    Inspect Slice (Beat 4) →
                  </button>
                  <button
                    type="button"
                    onClick={() => onJumpBeat(5)}
                    className="text-amber-300 hover:text-amber-200 transition"
                  >
                    Inspect Blocking (Beat 5) →
                  </button>
                </div>
              </div>
              <p className="text-sm leading-relaxed text-slate-300">
                Analysis of zonal wind anomalies at <span className="font-mono text-sky-200">60°N</span> (latitude of
                Shetland) across pressure levels from 10 hPa down to 1000 hPa (near surface) confirms that wind
                deceleration signals are &ldquo;dripping down&rdquo; or &ldquo;oozing&rdquo; through lower atmospheric
                layers.
              </p>
              <blockquote className="border-l-2 border-sky-400 pl-4 italic text-sm text-slate-300">
                &ldquo;...what you can see is that those darker blues are sort of dripping down, oozing through the
                atmosphere and then impacting the weather nearer the surface and we&apos;re going to feel the influence of
                that slowing down of that usual westerly wind...&rdquo;
                <footer className="mt-1 not-italic text-xs font-mono text-sky-300">— Alex Burkill</footer>
              </blockquote>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-white">
                Medium-to-Long-Range Outlook (Late November into December)
              </h3>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/65 p-5 space-y-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-sky-300">
                    Late November (Nov 23 onwards)
                  </span>
                  <p className="text-sm leading-relaxed text-slate-300">
                    Atmospheric pressure setups favor high pressure situated to the east (Scandinavia) and low pressure
                    to the west. This alignment draws in milder southerly air for a period, though slight positional
                    shifts could introduce cooler easterly flows.
                  </p>
                </div>
                <div className="rounded-2xl border border-amber-500/35 bg-slate-900/65 p-5 space-y-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300">
                    Early December
                  </span>
                  <p className="text-sm leading-relaxed text-slate-300">
                    Ensemble modeling indicates high pressure moving directly over or near the UK. This increases the
                    probability of blocking patterns, easterly winds, and colder winter weather—a classic surface
                    manifestation occurring 2 to 6 weeks following a stratospheric disruption.
                  </p>
                </div>
                <div className="rounded-2xl border border-violet-500/35 bg-slate-900/65 p-5 space-y-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-violet-300">
                    Potential Secondary SSW
                  </span>
                  <p className="text-sm leading-relaxed text-slate-300">
                    ECMWF zonal mean wind forecasts indicate the primary vortex winds are currently recovering to a weak
                    westerly. However, a minority of ensemble members suggest a potential secondary weakening or reversal
                    in late December.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* 5. Global Weather & Ecological Phenomena */}
          <section id="briefing-global" className="scroll-mt-24 space-y-6">
            <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
              <Globe2 className="w-5 h-5 text-emerald-400" />
              <h2 className="text-2xl font-semibold text-white">Global Weather &amp; Ecological Phenomena</h2>
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
              {/* Tropical Cyclones */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/65 p-5 space-y-3">
                <div className="flex items-center gap-2 text-rose-300 font-semibold">
                  <CloudRain className="w-4 h-4 shrink-0" />
                  <h3>Tropical Cyclone Activity</h3>
                </div>
                <div className="space-y-3 text-sm text-slate-300">
                  <div>
                    <strong className="text-white block">South Pacific Severe Tropical Cyclone</strong>
                    Satellite imagery highlights a well-defined eye. The system remains offshore to the northeast of Fiji
                    and Samoa, posing no direct landfall threat.
                  </div>
                  <div className="pt-2 border-t border-slate-800 space-y-1.5">
                    <strong className="text-white block">Cyclonic Storm Akvan (Bay of Bengal)</strong>
                    Moving northwards toward eastern/northeast India and Bangladesh, with landfall expected late
                    Thursday into Friday.
                    <ul className="list-disc list-inside text-xs text-slate-400 space-y-1 pt-1">
                      <li>
                        <strong className="text-slate-200">Expected Impacts:</strong> 150–250 mm rainfall, severe coastal
                        storm surge, high winds.
                      </li>
                      <li>
                        <strong className="text-slate-200">Environmental Vulnerability:</strong> Third cyclone in under
                        a month striking saturated ground in a normally dry post-monsoon period.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Christmas Island Crabs */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/65 p-5 space-y-3">
                <div className="flex items-center gap-2 text-amber-300 font-semibold">
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <h3>Christmas Island Red Crab Migration</h3>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Tens of millions of red crabs on Australia&apos;s Christmas Island have initiated their annual migration
                  from forest habitats to the ocean to breed.
                </p>
                <ul className="space-y-2 text-xs text-slate-300 pt-1">
                  <li className="rounded-lg bg-slate-950/70 border border-slate-800 p-3">
                    <strong className="text-sky-300 block mb-0.5">Weather Trigger</strong>
                    The migration is directly triggered by the arrival of the first seasonal rains.
                  </li>
                  <li className="rounded-lg bg-slate-950/70 border border-slate-800 p-3">
                    <strong className="text-emerald-300 block mb-0.5">Conservation Measures</strong>
                    National park rangers spend months preparing infrastructure, including constructing dedicated bridges
                    and enforcing road closures to ensure safe passage.
                  </li>
                </ul>
              </div>

              {/* Leonid Meteor Shower */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/65 p-5 space-y-3">
                <div className="flex items-center gap-2 text-indigo-300 font-semibold">
                  <Eye className="w-4 h-4 shrink-0" />
                  <h3>Astronomical Forecast: Leonid Meteor Shower</h3>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  The annual Leonid meteor shower reached its peak on the night of November 17, though activity continues
                  through November 30.
                </p>
                <div className="space-y-2 text-xs text-slate-300">
                  <div>
                    <strong className="text-white">Origin:</strong> Dust particles from comet{' '}
                    <span className="font-mono text-indigo-200">55P/Tempel-Tuttle</span>.
                  </div>
                  <div>
                    <strong className="text-white">Peak Activity:</strong> 10 to 15 meteors/hr, best viewed between
                    midnight and early morning away from artificial light.
                  </div>
                  <div className="rounded-lg bg-slate-950/70 border border-slate-800 p-3 space-y-1.5">
                    <strong className="text-white block">UK Viewing Conditions</strong>
                    <p className="text-slate-400">
                      <strong className="text-slate-200">Peak Night (Nov 17):</strong> Unfavorable under thick cloud and
                      rain across Scotland, Northern England, and Northern Ireland; limited breaks over Wales, SW England,
                      and the Republic of Ireland.
                    </p>
                    <p className="text-slate-400">
                      <strong className="text-slate-200">Subsequent Days:</strong> Cloud persists through Thursday; best
                      viewing Friday night into Saturday under clear, cold, frosty northern skies.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 6. Dedicated Key Insights & Verbatim Quotes */}
          <section id="briefing-quotes" className="scroll-mt-24 space-y-6">
            <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
              <Quote className="w-5 h-5 text-sky-400" />
              <h2 className="text-2xl font-semibold text-white">Dedicated Key Insights &amp; Verbatim Quotes</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {DEDICATED_QUOTES.map((q) => (
                <figure
                  key={q.topic}
                  className="rounded-2xl border border-slate-800 bg-slate-900/65 p-5 flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="text-[11px] font-mono uppercase tracking-wider text-sky-300 mb-2">
                      {q.topic}
                    </div>
                    <blockquote className="text-sm italic leading-relaxed text-slate-200">
                      &ldquo;{q.quote}&rdquo;
                    </blockquote>
                  </div>
                  <figcaption className="pt-2 border-t border-slate-800/80 text-xs text-slate-400">
                    <strong className="text-white font-mono">— {q.author}</strong>, {q.context}
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>

          {/* 7. Operational Notes & Footer */}
          <footer className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2 text-xs text-slate-300">
              <div className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                Operational Notes &amp; Viewer Submissions
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <a
                  href="mailto:weatherpix@metoffice.gov.uk"
                  className="inline-flex items-center gap-1.5 text-sky-300 hover:text-sky-200 transition font-mono"
                >
                  <Mail className="w-3.5 h-3.5" />
                  weatherpix@metoffice.gov.uk
                </a>
                <span className="inline-flex items-center gap-1.5 text-slate-300">
                  <Youtube className="w-3.5 h-3.5 text-rose-400" />
                  Met Office YouTube: 450,000+ subscribers (targeting 500,000 by Christmas)
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onJumpBeat(1)}
              className="shrink-0 inline-flex items-center gap-1.5 rounded-xl border border-sky-500/40 bg-sky-500/15 hover:bg-sky-500/25 px-4 py-2 text-xs font-mono text-sky-200 transition"
            >
              <ArrowUp className="w-3.5 h-3.5" />
              Back to Top · 3D Globe
            </button>
          </footer>
        </div>
      </div>
    </section>
  );
}

