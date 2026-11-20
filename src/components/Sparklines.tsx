import type { PolarTempPoint, VerticalLevelPoint, ZonalWindPoint } from '../types/weather';

interface ZonalSparklineProps {
  series: ZonalWindPoint[];
}

export function ZonalWindSparkline({ series }: ZonalSparklineProps) {
  const width = 220;
  const height = 64;
  const padX = 10;
  const padY = 9;

  const vals = series.map((s) => s.zonalWindMs);
  const minVal = Math.min(-18, ...vals) - 2;
  const maxVal = Math.max(32, ...vals) + 2;
  const span = Math.max(1, maxVal - minVal);

  const toX = (i: number) =>
    padX + (i / Math.max(1, series.length - 1)) * (width - padX * 2);
  const toY = (v: number) =>
    height - padY - ((v - minVal) / span) * (height - padY * 2);

  const zeroY = toY(0);
  const pts = series.map((s, i) => `${toX(i).toFixed(1)},${toY(s.zonalWindMs).toFixed(1)}`);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-[64px] overflow-visible">
      <rect
        x={padX}
        y={zeroY}
        width={width - padX * 2}
        height={Math.max(0, height - padY - zeroY)}
        fill="rgba(244, 63, 94, 0.14)"
        rx={3}
      />
      <line
        x1={padX}
        y1={zeroY}
        x2={width - padX}
        y2={zeroY}
        stroke="#fb7185"
        strokeWidth="1"
        strokeDasharray="3 3"
      />
      <text x={width - padX - 2} y={zeroY - 3} textAnchor="end" fontSize="8" fill="#fda4af">
        0 m/s SSW
      </text>

      <polyline
        fill="none"
        stroke="#38bdf8"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={pts.join(' ')}
      />

      {series.map((s, idx) => (
        <circle
          key={`${s.time}-${idx}`}
          cx={toX(idx)}
          cy={toY(s.zonalWindMs)}
          r={s.time === 'Now' ? 3.5 : 2}
          fill={s.zonalWindMs < 0 ? '#f43f5e' : '#38bdf8'}
        />
      ))}
    </svg>
  );
}

interface PolarTempSparklineProps {
  series: PolarTempPoint[];
}

export function PolarTempSparkline({ series }: PolarTempSparklineProps) {
  const width = 220;
  const height = 56;
  const padX = 10;
  const padY = 8;

  const allTemps = series.flatMap((s) => [s.polarTempC, s.lat60TempC]);
  const minT = Math.min(-78, ...allTemps) - 2;
  const maxT = Math.max(-22, ...allTemps) + 2;
  const span = Math.max(1, maxT - minT);

  const toX = (i: number) =>
    padX + (i / Math.max(1, series.length - 1)) * (width - padX * 2);
  const toY = (v: number) =>
    height - padY - ((v - minT) / span) * (height - padY * 2);

  const polePts = series.map((s, i) => `${toX(i).toFixed(1)},${toY(s.polarTempC).toFixed(1)}`);
  const lat60Pts = series.map((s, i) => `${toX(i).toFixed(1)},${toY(s.lat60TempC).toFixed(1)}`);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-[56px] overflow-visible">
      {/* ERA5 Nov Polar Cap reference (-71.8°C) */}
      <line
        x1={padX}
        y1={toY(-71.8)}
        x2={width - padX}
        y2={toY(-71.8)}
        stroke="#475569"
        strokeWidth="1"
        strokeDasharray="2 3"
      />
      <polyline
        fill="none"
        stroke="#38bdf8"
        strokeWidth="1.6"
        strokeDasharray="3 2"
        strokeLinejoin="round"
        points={lat60Pts.join(' ')}
      />
      <polyline
        fill="none"
        stroke="#fb923c"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={polePts.join(' ')}
      />
      {series.map((s, idx) => (
        <circle
          key={`p-${s.time}-${idx}`}
          cx={toX(idx)}
          cy={toY(s.polarTempC)}
          r={s.time === 'Now' ? 3 : 1.6}
          fill="#fb923c"
        />
      ))}
    </svg>
  );
}

interface VerticalProfileChartProps {
  levels: VerticalLevelPoint[];
}

export function VerticalProfileChart({ levels }: VerticalProfileChartProps) {
  const maxAbs = Math.max(30, ...levels.map((l) => Math.abs(l.anomalyMs)));
  return (
    <div className="space-y-1">
      {levels.map((lvl) => {
        const pct = Math.min(100, (Math.abs(lvl.anomalyMs) / maxAbs) * 100);
        const isWeakened = lvl.anomalyMs < 0;
        return (
          <div
            key={lvl.pressureHpa}
            className="grid grid-cols-[44px_1fr_42px_40px] items-center gap-1.5 text-[10px]"
          >
            <span className="font-mono text-slate-400 text-right">{lvl.pressureHpa} hPa</span>
            <div className="h-2 bg-slate-800/90 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  isWeakened ? 'bg-gradient-to-r from-sky-400 to-indigo-400' : 'bg-amber-400'
                }`}
                style={{ width: `${Math.max(8, pct)}%` }}
              />
            </div>
            <span className={`font-mono text-right ${isWeakened ? 'text-sky-300' : 'text-amber-300'}`}>
              {lvl.anomalyMs > 0 ? `+${lvl.anomalyMs}` : lvl.anomalyMs}
            </span>
            <span className="font-mono text-right text-slate-300">
              {lvl.tempC.toFixed(0)}°C
            </span>
          </div>
        );
      })}
    </div>
  );
}
