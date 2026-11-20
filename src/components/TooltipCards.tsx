import { Html } from '@react-three/drei';
import type * as THREE from 'three';
import type { AtmosphereSnapshot, BeatId } from '../types/weather';
import type { AnchorName } from '../scene/cameraWaypoints';
import { PolarTempSparkline, VerticalProfileChart, ZonalWindSparkline } from './Sparklines';

/**
 * The figures for each beat. On wider screens they float over the globe, pinned to a place.
 * On phones there's no room for that, so the same panels sit inside the story card instead.
 */

type Surface = 'floating' | 'inline';

interface PanelProps {
  snapshot: AtmosphereSnapshot;
  surface: Surface;
  /** Width for floating panels; inline panels fill the card. */
  width?: string;
}

const COMPASS = ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'];
function compassFrom(deg: number): string {
  return COMPASS[Math.round((((deg % 360) + 360) % 360) / 45) % 8];
}

function panelClass(surface: Surface, border: string, width = 'w-72'): string {
  return surface === 'floating'
    ? `${width} rounded-xl border ${border} bg-slate-950/95 backdrop-blur-md p-3 shadow-2xl text-slate-100`
    : `w-full rounded-xl border ${border} bg-slate-900/70 p-3 text-slate-100`;
}

/** Amber means high pressure, so Scandinavia only turns amber when there is a high there. */
function isBlock(s: AtmosphereSnapshot): boolean {
  return s.scandiHigh.pressureMslHpa >= 1022 && s.scandiHigh.pressureMslHpa > s.ukSurface.pressureMslHpa;
}

function AnchorDot({ colorClass }: { colorClass: string }) {
  return <span className={`relative inline-flex h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-white/25 ${colorClass}`} />;
}

function UkPanel({ snapshot, surface, width }: PanelProps) {
  const uk = snapshot.ukSurface;
  const isCold850 = uk.temp850HpaC <= -5;
  return (
    <div className={panelClass(surface, 'border-slate-700/80', width)}>
      <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-slate-300">
        <span>Scottish Highlands</span>
        <span>1000 hPa</span>
      </div>
      <div className="mt-1 flex items-baseline justify-between gap-2">
        <div className="flex items-baseline gap-1.5">
          <span className="text-lg font-semibold font-mono text-white">{uk.tempC.toFixed(1)}°C</span>
          <span className="text-xs font-mono text-sky-300">Feels {uk.feelsLikeC.toFixed(1)}°C</span>
        </div>
        <span className="text-[11px] font-mono text-slate-400">{Math.round(uk.pressureMslHpa)} hPa</span>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-1.5 rounded-lg bg-slate-900/85 border border-slate-800 px-2 py-1.5 text-[11px] font-mono">
        <div>
          <span className="block text-[11px] text-slate-400">WIND · GUST</span>
          <span className="text-slate-100">
            {uk.windSpeed10mMs.toFixed(0)} · {uk.windGusts10mMs.toFixed(0)} m/s
          </span>
        </div>
        <div>
          <span className="block text-[11px] text-slate-400">1.5 KM UP</span>
          <span className={isCold850 ? 'text-sky-300 font-semibold' : 'text-slate-100'}>
            {uk.temp850HpaC.toFixed(1)}°C
          </span>
        </div>
        <div>
          <span className="block text-[11px] text-slate-400">FREEZING AT</span>
          <span className="text-slate-100">{uk.freezingLevelM} m</span>
        </div>
      </div>
      <p className="mt-1.5 text-xs leading-snug text-slate-300">
        Mid-November lows in the glens, seen and forecast:{' '}
        <span className="text-sky-300 font-medium">{uk.scotlandColdSnapRange}</span>
        {uk.snowfallCmHr > 0 ? `. Snow falling now: ${uk.snowfallCmHr} cm an hour.` : '.'}
      </p>
    </div>
  );
}

function JetPanel({ snapshot, surface, width }: PanelProps) {
  const uk = snapshot.ukSurface;
  return (
    <div className={panelClass(surface, 'border-sky-500/40', width)}>
      <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-sky-300">
        <span>Jet stream</span>
        <span>250 hPa</span>
      </div>
      <div className="mt-1 text-base font-semibold font-mono text-white">{uk.jetSpeed250HpaMs.toFixed(1)} m/s</div>
      <div className="text-[11px] font-mono text-slate-400">
        {Math.round(uk.jetSpeed250HpaMs * 2.23694)} mph · from the {compassFrom(uk.jetDirection250HpaDeg)}
      </div>
    </div>
  );
}

function VortexPanel({ snapshot, surface, width }: PanelProps) {
  const s60 = snapshot.stratosphere60N;
  const isThermalReversal = s60.poleTo60NGradientC > 0;
  return (
    <div className={`${panelClass(surface, 'border-indigo-400/45', width)} space-y-2`}>
      <div>
        <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-indigo-300">
          <span>Vortex wind · 60°N</span>
          <span>10 hPa</span>
        </div>
        <div className="mt-1 flex items-center justify-between gap-2">
          <span className="text-lg font-semibold font-mono text-white">
            {s60.zonalMeanWindMs > 0 ? '+' : ''}
            {s60.zonalMeanWindMs.toFixed(1)} m/s
            <span className="ml-1.5 text-xs font-normal text-slate-400">
              {Math.round(Math.abs(s60.zonalMeanWindMs) * 2.23694)} mph
            </span>
          </span>
          <span
            className={`px-1.5 py-0.5 rounded text-[11px] font-mono font-semibold whitespace-nowrap ${
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

      <div className="pt-2 border-t border-slate-800/90">
        <div className="flex items-center justify-between gap-2 text-[11px] font-mono uppercase tracking-wider text-orange-300">
          <span>Temperature 30 km up</span>
          <span
            className={`px-1 py-0.5 rounded text-[11px] ${
              isThermalReversal ? 'bg-orange-500/20 text-orange-200 border border-orange-500/40' : 'bg-slate-800 text-slate-300'
            }`}
          >
            {isThermalReversal
              ? 'POLE WARMER THAN 60°N'
              : `${s60.polarCapTempAnomalyC >= 0 ? '+' : ''}${s60.polarCapTempAnomalyC.toFixed(1)}°C VS NORMAL`}
          </span>
        </div>
        <div className="mt-1 grid grid-cols-3 gap-1.5 text-[11px] font-mono">
          <div className="rounded bg-slate-900/90 px-1.5 py-1">
            <span className="block text-[11px] text-slate-400">NORTH POLE</span>
            <span className="text-orange-300 font-semibold">{s60.polarCapTemp10HpaC.toFixed(1)}°C</span>
          </div>
          <div className="rounded bg-slate-900/90 px-1.5 py-1">
            <span className="block text-[11px] text-slate-400">AT 60°N</span>
            <span className="text-sky-300 font-semibold">{s60.temp10HpaC.toFixed(1)}°C</span>
          </div>
          <div className="rounded bg-slate-900/90 px-1.5 py-1">
            <span className="block text-[11px] text-slate-400">DIFFERENCE</span>
            <span className={isThermalReversal ? 'text-rose-300 font-semibold' : 'text-slate-200'}>
              {s60.poleTo60NGradientC >= 0 ? '+' : ''}
              {s60.poleTo60NGradientC.toFixed(1)}°C
            </span>
          </div>
        </div>
        <div className="mt-1.5">
          <PolarTempSparkline series={s60.tempSeries24hC} />
        </div>
      </div>
    </div>
  );
}

function WavesPanel({ snapshot, surface, width, wave2Dominant }: PanelProps & { wave2Dominant: boolean }) {
  const w = snapshot.waves;
  return (
    <div className={panelClass(surface, 'border-slate-700/80', width)}>
      <div className={`text-[11px] font-mono uppercase tracking-wider ${wave2Dominant ? 'text-fuchsia-300' : 'text-lime-300'}`}>
        {wave2Dominant ? 'First: the squeeze' : 'Then: the shove'}
      </div>
      <div className="mt-2 space-y-2 text-[11px]">
        <div>
          <div className="flex justify-between font-mono text-slate-200">
            <span className="text-lime-300">Wave 1 · the shove</span>
            <span>{w.wave1HeightAmpM} m</span>
          </div>
          <div className="mt-1 h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
            <div className="h-full bg-lime-300 rounded-full" style={{ width: `${Math.round(w.wave1Norm * 100)}%` }} />
          </div>
          <span className="text-[11px] text-slate-400 font-mono">Typical November: {w.era5NovClimWave1M} m</span>
        </div>
        <div>
          <div className="flex justify-between font-mono text-slate-200">
            <span className="text-fuchsia-300">Wave 2 · the squeeze</span>
            <span>{w.wave2HeightAmpM} m</span>
          </div>
          <div className="mt-1 h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
            <div className="h-full bg-fuchsia-400 rounded-full" style={{ width: `${Math.round(w.wave2Norm * 100)}%` }} />
          </div>
          <span className="text-[11px] text-slate-400 font-mono">Typical November: {w.era5NovClimWave2M} m</span>
        </div>
      </div>
    </div>
  );
}

function ProfilePanel({ snapshot, surface, width }: PanelProps) {
  return (
    <div className={panelClass(surface, 'border-sky-400/45', width)}>
      <div className="flex items-center justify-between gap-2 text-[11px] font-mono uppercase tracking-wider text-sky-300">
        <span>Wind change by height · 60°N</span>
        <span className="whitespace-nowrap">2–6 weeks</span>
      </div>
      <div className="mt-1 mb-1.5 flex items-center justify-between text-[11px] font-mono text-slate-400">
        <span>Wind vs normal (m/s)</span>
        <span>Temp (°C)</span>
      </div>
      <VerticalProfileChart levels={snapshot.verticalProfile} />
    </div>
  );
}

function BattlegroundPanel({ snapshot, surface, width }: PanelProps) {
  const block = isBlock(snapshot);
  const cell = (label: string, hpa: number, t: number, feels: number, highlight = false) => (
    <div className={`rounded-lg bg-slate-900/90 border p-1.5 ${highlight ? 'border-amber-500/50' : 'border-slate-700'}`}>
      <div className={`text-[11px] ${highlight ? 'text-amber-300' : 'text-slate-300'}`}>{label}</div>
      <div className={`text-xs font-semibold ${highlight ? 'text-amber-200' : 'text-white'}`}>{Math.round(hpa)} hPa</div>
      <div className="text-[11px] text-slate-200">{t.toFixed(1)}°C</div>
      <div className="text-[11px] text-slate-400">Feels {feels.toFixed(0)}°C</div>
    </div>
  );
  return (
    <div className={panelClass(surface, 'border-slate-700/80', width)}>
      <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-slate-300">
        <span>The battleground</span>
        <span>Pressure · temp</span>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-1.5 text-center font-mono">
        {cell('ATLANTIC', snapshot.atlanticLow.pressureMslHpa, snapshot.atlanticLow.tempC, snapshot.atlanticLow.feelsLikeC)}
        {cell('UK', snapshot.ukSurface.pressureMslHpa, snapshot.ukSurface.tempC, snapshot.ukSurface.feelsLikeC)}
        {cell(
          block ? 'SCANDINAVIA · HIGH' : 'SCANDINAVIA',
          snapshot.scandiHigh.pressureMslHpa,
          snapshot.scandiHigh.tempC,
          snapshot.scandiHigh.feelsLikeC,
          block
        )}
      </div>
    </div>
  );
}

/** Phones: the beat's figures, stacked inside its story card. */
export function BeatFigures({
  beat,
  snapshot,
  scrollProgress,
}: {
  beat: BeatId;
  snapshot: AtmosphereSnapshot;
  scrollProgress: number;
}) {
  const p = { snapshot, surface: 'inline' as const };
  return (
    <div className="mt-3 space-y-2">
      {beat === 1 && (
        <>
          <UkPanel {...p} />
          <JetPanel {...p} />
        </>
      )}
      {beat === 2 && <VortexPanel {...p} />}
      {beat === 3 && <WavesPanel {...p} wave2Dominant={scrollProgress < 0.5} />}
      {beat === 4 && <ProfilePanel {...p} />}
      {beat === 5 && <BattlegroundPanel {...p} />}
    </div>
  );
}

interface TooltipOverlay3DProps {
  activeBeat: BeatId;
  scrollProgress: number;
  anchors: Record<AnchorName, THREE.Vector3>;
  snapshot: AtmosphereSnapshot;
}

const htmlProps = { className: 'pointer-events-none select-none', style: { pointerEvents: 'none' as const } };

/** Wider screens: the beat's figures, pinned to places on the globe. */
export function TooltipOverlay3D({ activeBeat, scrollProgress, anchors, snapshot }: TooltipOverlay3DProps) {
  const wave2Dominant = scrollProgress < 0.5;
  const s60 = snapshot.stratosphere60N;
  const f = { snapshot, surface: 'floating' as const };

  return (
    <group>
      {activeBeat === 1 && (
        <>
          <Html position={anchors.Anchor_UK_Surface} {...htmlProps}>
            <div className="flex items-start gap-2 -translate-y-6 translate-x-3">
              <AnchorDot colorClass="bg-slate-200" />
              <UkPanel {...f} width="w-72" />
            </div>
          </Html>
          <Html position={anchors.Anchor_JetStream} {...htmlProps}>
            <div className="flex items-start gap-2 translate-y-6 translate-x-2">
              <AnchorDot colorClass="bg-sky-400" />
              <JetPanel {...f} width="w-60" />
            </div>
          </Html>
        </>
      )}

      {activeBeat === 2 && (
        <Html position={anchors.Anchor_Shetland_60N} {...htmlProps}>
          <div className="flex items-end gap-2 translate-x-3 -translate-y-full">
            <AnchorDot colorClass={s60.isReversed ? 'bg-rose-400' : 'bg-sky-400'} />
            <VortexPanel {...f} width="w-80" />
          </div>
        </Html>
      )}

      {activeBeat === 3 && (
        <Html position={anchors.Anchor_Vortex_Core} {...htmlProps}>
          <div className="flex items-start gap-2 translate-x-4 -translate-y-4">
            <AnchorDot colorClass={wave2Dominant ? 'bg-fuchsia-400' : 'bg-lime-300'} />
            <WavesPanel {...f} width="w-72" wave2Dominant={wave2Dominant} />
          </div>
        </Html>
      )}

      {activeBeat === 4 && (
        <Html position={anchors.Anchor_Vertical_Slice} {...htmlProps}>
          <div className="flex items-start gap-2 translate-x-4 -translate-y-8">
            <AnchorDot colorClass="bg-sky-400" />
            <ProfilePanel {...f} width="w-80" />
          </div>
        </Html>
      )}

      {activeBeat === 5 && (
        <Html position={anchors.Anchor_Scandi_High} {...htmlProps}>
          <div className="flex items-start gap-2 translate-x-3 -translate-y-4">
            <AnchorDot colorClass={isBlock(snapshot) ? 'bg-amber-400' : 'bg-slate-200'} />
            <BattlegroundPanel {...f} width="w-80" />
          </div>
        </Html>
      )}
    </group>
  );
}
