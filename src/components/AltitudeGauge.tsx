import { sampleCameraState } from '../scene/cameraWaypoints';
import type { BeatId } from '../types/weather';

interface AltitudeGaugeProps {
  scrollProgress: number;
  activeBeat: BeatId;
  hidden?: boolean;
  onJumpBeat: (beat: BeatId) => void;
  onJumpEditorial?: () => void;
}

const BANDS: Array<{ beat: BeatId; label: string; hpa: string; km: string }> = [
  { beat: 2, label: 'Polar Vortex', hpa: '10 hPa', km: '30 km' },
  { beat: 3, label: 'Waves 1 & 2', hpa: '10 hPa', km: '30 km' },
  { beat: 4, label: 'Coupling', hpa: '100 hPa', km: '16 km' },
  { beat: 1, label: 'Jet Stream', hpa: '250 hPa', km: '10 km' },
  { beat: 5, label: 'UK Surface', hpa: '1000 hPa', km: '0 km' },
];

export function AltitudeGauge({
  scrollProgress,
  activeBeat,
  hidden = false,
  onJumpBeat,
  onJumpEditorial,
}: AltitudeGaugeProps) {
  const cam = sampleCameraState(scrollProgress);
  const altRatio = Math.min(1, Math.max(0, cam.altitudeKm / 30));

  return (
    <aside
      className={`fixed right-4 top-1/2 -translate-y-1/2 z-20 hidden md:flex flex-col items-end gap-3 transition-all duration-300 ${
        hidden ? 'opacity-0 pointer-events-none translate-x-4' : 'pointer-events-auto opacity-100 translate-x-0'
      }`}
    >
      <div className="rounded-2xl border border-slate-800/90 bg-slate-950/75 backdrop-blur-md px-3.5 py-4 shadow-2xl w-44">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
            Altitude
          </span>
          <span className="text-xs font-mono font-semibold text-sky-300">
            {cam.altitudeKm.toFixed(1)} km · {cam.pressureHpa} hPa
          </span>
        </div>

        <div className="relative pl-4 space-y-2.5">
          {/* Vertical track + active marker */}
          <div className="absolute left-1 top-1 bottom-1 w-1 rounded-full bg-slate-800">
            <div
              className="absolute bottom-0 left-0 right-0 rounded-full bg-gradient-to-t from-amber-400 via-sky-400 to-indigo-400 transition-all duration-150"
              style={{ height: `${Math.round(altRatio * 100)}%` }}
            />
          </div>

          {BANDS.map((b) => {
            const active = activeBeat === b.beat;
            return (
              <button
                key={b.beat}
                type="button"
                onClick={() => onJumpBeat(b.beat)}
                className={`w-full text-left rounded-lg px-2 py-1 transition ${
                  active
                    ? 'bg-sky-500/15 border border-sky-400/40 text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-medium">
                  <span>{b.label}</span>
                  <span className="font-mono text-[10px] text-slate-400">{b.hpa}</span>
                </div>
              </button>
            );
          })}
        </div>

        {onJumpEditorial && (
          <button
            type="button"
            onClick={onJumpEditorial}
            className="mt-3 w-full rounded-lg border border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20 px-2.5 py-1.5 text-[10.5px] font-mono text-sky-200 transition text-center"
          >
            Full Briefing ↓
          </button>
        )}
      </div>
    </aside>
  );
}

