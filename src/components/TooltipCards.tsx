import { Html } from '@react-three/drei';
import type * as THREE from 'three';
import type { AtmosphereSnapshot, BeatId } from '../types/weather';
import type { AnchorName } from '../scene/cameraWaypoints';
import { PolarTempSparkline, VerticalProfileChart, ZonalWindSparkline } from './Sparklines';

interface TooltipOverlay3DProps {
  activeBeat: BeatId;
  scrollProgress: number;
  anchors: Record<AnchorName, THREE.Vector3>;
  snapshot: AtmosphereSnapshot;
}

const COMPASS = ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'];
function compassFrom(deg: number): string {
  return COMPASS[Math.round((((deg % 360) + 360) % 360) / 45) % 8];
}

function AnchorDot({ colorClass }: { colorClass: string }) {
  return (
    <span className="relative flex h-2.5 w-2.5 shrink-0">
      <span
        className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${colorClass}`}
      />
      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${colorClass}`} />
    </span>
  );
}

export function TooltipOverlay3D({
  activeBeat,
  scrollProgress,
  anchors,
  snapshot,
}: TooltipOverlay3DProps) {
  const wave2Dominant = scrollProgress < 0.5;
  const s60 = snapshot.stratosphere60N;
  const isThermalReversal = s60.poleTo60NGradientC > 0;
  const isCold850 = snapshot.ukSurface.temp850HpaC <= -5;
  // How many times bigger than a typical November the two waves are, on average.
  const waveRatio =
    (snapshot.waves.wave1HeightAmpM / snapshot.waves.era5NovClimWave1M +
      snapshot.waves.wave2HeightAmpM / snapshot.waves.era5NovClimWave2M) /
    2;

  return (
    <group>
      {/* Beat 1: UK Surface (Temp, Feels Like, 850 hPa, Freezing Level) + Jet Stream */}
      {activeBeat === 1 && (
        <>
          <Html
            position={anchors.Anchor_UK_Surface}
            className="pointer-events-none select-none"
            style={{ pointerEvents: 'none' }}
          >
            <div className="flex items-start gap-2 -translate-y-6 translate-x-3">
              <AnchorDot colorClass="bg-amber-400" />
              <div className="w-64 rounded-xl border border-slate-700/80 bg-slate-950/88 backdrop-blur-md p-3 shadow-2xl text-slate-100">
                <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-amber-300">
                  <span>Scottish Highlands</span>
                  <span>1000 hPa</span>
                </div>
                <div className="mt-1 flex items-baseline justify-between gap-2">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-lg font-semibold font-mono text-white">
                      {snapshot.ukSurface.tempC.toFixed(1)}°C
                    </span>
                    <span className="text-xs font-mono text-sky-300">
                      Feels {snapshot.ukSurface.feelsLikeC.toFixed(1)}°C
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    {Math.round(snapshot.ukSurface.pressureMslHpa)} hPa
                  </span>
                </div>

                <div className="mt-2 grid grid-cols-3 gap-1.5 rounded-lg bg-slate-900/85 border border-slate-800 px-2 py-1.5 text-[10px] font-mono">
                  <div>
                    <span className="block text-[9px] text-slate-400">WIND · GUST</span>
                    <span className="text-slate-100">
                      {snapshot.ukSurface.windSpeed10mMs.toFixed(0)} · {snapshot.ukSurface.windGusts10mMs.toFixed(0)} m/s
                    </span>
                  </div>
                  <div>
                    <span className="block text-[9px] text-slate-400">1.5 KM UP</span>
                    <span className={isCold850 ? 'text-sky-300 font-semibold' : 'text-slate-100'}>
                      {snapshot.ukSurface.temp850HpaC.toFixed(1)}°C
                    </span>
                  </div>
                  <div>
                    <span className="block text-[9px] text-slate-400">FREEZING AT</span>
                    <span className="text-slate-100">{snapshot.ukSurface.freezingLevelM} m</span>
                  </div>
                </div>

                <p className="mt-1.5 text-[10.5px] leading-snug text-slate-300">
                  Mid-November lows in the glens, seen and forecast:{' '}
                  <span className="text-sky-300 font-medium">
                    {snapshot.ukSurface.scotlandColdSnapRange}
                  </span>
                  {snapshot.ukSurface.snowfallCmHr > 0
                    ? `. Snow falling now: ${snapshot.ukSurface.snowfallCmHr} cm an hour.`
                    : '.'}
                </p>
              </div>
            </div>
          </Html>

          <Html
            position={anchors.Anchor_JetStream}
            className="pointer-events-none select-none"
            style={{ pointerEvents: 'none' }}
          >
            <div className="flex items-start gap-2 translate-y-6 translate-x-2">
              <AnchorDot colorClass="bg-sky-400" />
              <div className="w-52 rounded-xl border border-sky-500/40 bg-slate-950/88 backdrop-blur-md p-2.5 shadow-2xl text-slate-100">
                <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-sky-300">
                  <span>Jet stream</span>
                  <span>250 hPa</span>
                </div>
                <div className="mt-1 text-base font-semibold font-mono text-white">
                  {snapshot.ukSurface.jetSpeed250HpaMs.toFixed(1)} m/s
                </div>
                <div className="text-[10px] font-mono text-slate-400">
                  {Math.round(snapshot.ukSurface.jetSpeed250HpaMs * 2.23694)} mph · from the{' '}
                  {compassFrom(snapshot.ukSurface.jetDirection250HpaDeg)}
                </div>
                <p className="mt-1 text-[10.5px] text-slate-300">
                  Running south of the UK, steering wet Atlantic weather under the colder air to the north.
                </p>
              </div>
            </div>
          </Html>
        </>
      )}

      {/* Beat 2: Stratospheric Polar Vortex Winds + Thermal SSW Diagnostic */}
      {activeBeat === 2 && (
        <Html
          position={anchors.Anchor_Shetland_60N}
          className="pointer-events-none select-none"
          style={{ pointerEvents: 'none' }}
        >
          <div className="flex items-end gap-2 translate-x-3 -translate-y-full">
            <AnchorDot colorClass={s60.isReversed ? 'bg-rose-400' : 'bg-sky-400'} />
            <div className="w-72 rounded-xl border border-indigo-400/45 bg-slate-950/90 backdrop-blur-md p-3 shadow-2xl text-slate-100 space-y-2">
              <div>
                <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-indigo-300">
                  <span>Vortex wind · 60°N</span>
                  <span>10 hPa</span>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-lg font-semibold font-mono text-white">
                    {s60.zonalMeanWindMs > 0 ? '+' : ''}
                    {s60.zonalMeanWindMs.toFixed(1)} m/s
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[9.5px] font-mono font-semibold ${
                      s60.isReversed
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                    }`}
                  >
                    {s60.isReversed ? 'REVERSED: SSW' : 'SPINNING WESTERLY'}
                  </span>
                </div>
                <div className="mt-1">
                  <ZonalWindSparkline series={s60.timeSeries24hMs} />
                </div>
              </div>

              {/* Stratospheric Thermal & Apparent-Cold Context */}
              <div className="pt-2 border-t border-slate-800/90">
                <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-orange-300">
                  <span>Temperature 30 km up</span>
                  <span
                    className={`px-1 py-0.5 rounded text-[9px] ${
                      isThermalReversal
                        ? 'bg-orange-500/20 text-orange-200 border border-orange-500/40'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {isThermalReversal ? 'POLE WARMER THAN 60°N' : `${s60.polarCapTempAnomalyC >= 0 ? '+' : ''}${s60.polarCapTempAnomalyC.toFixed(1)}°C VS NORMAL`}
                  </span>
                </div>

                <div className="mt-1 grid grid-cols-3 gap-1.5 text-[10px] font-mono">
                  <div className="rounded bg-slate-900/90 px-1.5 py-1">
                    <span className="block text-[8.5px] text-slate-400">NORTH POLE</span>
                    <span className="text-orange-300 font-semibold">
                      {s60.polarCapTemp10HpaC.toFixed(1)}°C
                    </span>
                  </div>
                  <div className="rounded bg-slate-900/90 px-1.5 py-1">
                    <span className="block text-[8.5px] text-slate-400">AT 60°N</span>
                    <span className="text-sky-300 font-semibold">{s60.temp10HpaC.toFixed(1)}°C</span>
                  </div>
                  <div className="rounded bg-slate-900/90 px-1.5 py-1">
                    <span className="block text-[8.5px] text-slate-400">DIFFERENCE</span>
                    <span className={isThermalReversal ? 'text-rose-300 font-semibold' : 'text-slate-200'}>
                      {s60.poleTo60NGradientC >= 0 ? '+' : ''}
                      {s60.poleTo60NGradientC.toFixed(1)}°C
                    </span>
                  </div>
                </div>

                <div className="mt-1.5">
                  <PolarTempSparkline series={s60.tempSeries24hC} />
                </div>
                <p className="mt-1 text-[10px] leading-snug text-slate-400">
                  {s60.stratThermalFeelNote}
                </p>
              </div>
            </div>
          </div>
        </Html>
      )}

      {/* Beat 3: Planetary Waves 1 & 2 */}
      {activeBeat === 3 && (
        <Html
          position={anchors.Anchor_Vortex_Core}
          className="pointer-events-none select-none"
          style={{ pointerEvents: 'none' }}
        >
          <div className="flex items-start gap-2 translate-x-4 -translate-y-4">
            <AnchorDot colorClass="bg-violet-400" />
            <div className="w-64 rounded-xl border border-violet-400/45 bg-slate-950/90 backdrop-blur-md p-3 shadow-2xl text-slate-100">
              <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-violet-300">
                <span>{wave2Dominant ? 'First: the squeeze' : 'Then: the shove'}</span>
                <span>{waveRatio.toFixed(1)}× typical size</span>
              </div>

              <div className="mt-2 space-y-2 text-[11px]">
                <div>
                  <div className="flex justify-between font-mono text-slate-200">
                    <span>Wave 1 · the shove</span>
                    <span>{snapshot.waves.wave1HeightAmpM} m</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-rose-400 rounded-full"
                      style={{ width: `${Math.round(snapshot.waves.wave1Norm * 100)}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-slate-400 font-mono">
                    Typical November: {snapshot.waves.era5NovClimWave1M} m
                  </span>
                </div>

                <div>
                  <div className="flex justify-between font-mono text-slate-200">
                    <span>Wave 2 · the squeeze</span>
                    <span>{snapshot.waves.wave2HeightAmpM} m</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-violet-400 rounded-full"
                      style={{ width: `${Math.round(snapshot.waves.wave2Norm * 100)}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-slate-400 font-mono">
                    Typical November: {snapshot.waves.era5NovClimWave2M} m
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Html>
      )}

      {/* Beat 4: Dripping Down Vertical Wind & Temp Profile */}
      {activeBeat === 4 && (
        <Html
          position={anchors.Anchor_Vertical_Slice}
          className="pointer-events-none select-none"
          style={{ pointerEvents: 'none' }}
        >
          <div className="flex items-start gap-2 translate-x-4 -translate-y-8">
            <AnchorDot colorClass="bg-sky-400" />
            <div className="w-72 rounded-xl border border-sky-400/45 bg-slate-950/90 backdrop-blur-md p-3 shadow-2xl text-slate-100">
              <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-sky-300">
                <span>Wind change by height · 60°N</span>
                <span>2–6 weeks</span>
              </div>
              <div className="mt-1 mb-1.5 flex items-center justify-between text-[9.5px] font-mono text-slate-400">
                <span>Wind vs normal (m/s)</span>
                <span>Temp (°C)</span>
              </div>
              <VerticalProfileChart levels={snapshot.verticalProfile} />
            </div>
          </div>
        </Html>
      )}

      {/* Beat 5: Scandinavian Blocking Battleground with Temps & Feels Like */}
      {activeBeat === 5 && (
        <Html
          position={anchors.Anchor_Scandi_High}
          className="pointer-events-none select-none"
          style={{ pointerEvents: 'none' }}
        >
          <div className="flex items-start gap-2 translate-x-3 -translate-y-4">
            <AnchorDot colorClass="bg-amber-400" />
            <div className="w-72 rounded-xl border border-amber-400/45 bg-slate-950/90 backdrop-blur-md p-3 shadow-2xl text-slate-100">
              <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-amber-300">
                <span>The battleground</span>
                <span>Pressure · temp</span>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-1.5 text-center font-mono">
                <div className="rounded-lg bg-slate-900/90 border border-sky-500/30 p-1.5">
                  <div className="text-[9px] text-sky-300">ATLANTIC</div>
                  <div className="text-xs font-semibold text-white">
                    {Math.round(snapshot.atlanticLow.pressureMslHpa)} hPa
                  </div>
                  <div className="text-[10px] text-slate-200">
                    {snapshot.atlanticLow.tempC.toFixed(1)}°C
                  </div>
                  <div className="text-[9px] text-slate-400">
                    Feels {snapshot.atlanticLow.feelsLikeC.toFixed(0)}°C
                  </div>
                </div>
                <div className="rounded-lg bg-slate-900/90 border border-slate-700 p-1.5">
                  <div className="text-[9px] text-slate-300">UK</div>
                  <div className="text-xs font-semibold text-white">
                    {Math.round(snapshot.ukSurface.pressureMslHpa)} hPa
                  </div>
                  <div className="text-[10px] text-slate-200">
                    {snapshot.ukSurface.tempC.toFixed(1)}°C
                  </div>
                  <div className="text-[9px] text-sky-300">
                    Feels {snapshot.ukSurface.feelsLikeC.toFixed(0)}°C
                  </div>
                </div>
                <div className="rounded-lg bg-slate-900/90 border border-amber-500/40 p-1.5">
                  <div className="text-[9px] text-amber-300">SCANDINAVIA</div>
                  <div className="text-xs font-semibold text-amber-200">
                    {Math.round(snapshot.scandiHigh.pressureMslHpa)} hPa
                  </div>
                  <div className="text-[10px] text-amber-100">
                    {snapshot.scandiHigh.tempC.toFixed(1)}°C
                  </div>
                  <div className="text-[9px] text-amber-300/80">
                    Feels {snapshot.scandiHigh.feelsLikeC.toFixed(0)}°C
                  </div>
                </div>
              </div>
              <p className="mt-2 text-[10.5px] leading-snug text-slate-300">
                {snapshot.battlegroundSummary}
              </p>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}
