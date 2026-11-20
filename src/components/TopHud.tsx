import { useEffect, useState } from 'react';
import { ArrowUp, Box, Clock, CloudLightning, RefreshCw } from 'lucide-react';
import type { AtmosphereSnapshot, BeatId, FetchSource, ModelSource, WeatherMode } from '../types/weather';

interface TopHudProps {
  mode: WeatherMode;
  modelSource: ModelSource;
  snapshot: AtmosphereSnapshot;
  isLoading: boolean;
  inEditorial?: boolean;
  onJumpBeat?: (beat: BeatId) => void;
  onToggleMode: (next: WeatherMode) => void;
  onToggleModelSource: (next: ModelSource) => void;
  onRefreshLive: () => void;
}

function formatUtcHm(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  return `${hh}:${mm} UTC`;
}

function formatValidUtc(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const day = d.getUTCDate();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const mon = months[d.getUTCMonth()];
  const hh = String(d.getUTCHours()).padStart(2, '0');
  return `${day} ${mon} · ${hh}:00 UTC`;
}

function formatRelativeAge(iso: string, nowMs: number): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return '';
  const diffMin = Math.max(0, Math.round((nowMs - t) / 60000));
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  const hrs = Math.round(diffMin / 60);
  return `${hrs} hr ago`;
}

function getSourceBadge(fetchSource: FetchSource): { label: string; cls: string; dot: string } {
  switch (fetchSource) {
    case 'live-api':
      return {
        label: 'LIVE',
        cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
        dot: 'bg-emerald-400',
      };
    case 'cached-live':
      return {
        label: 'LIVE',
        cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
        dot: 'bg-emerald-400',
      };
    case 'offline-fallback':
      return {
        label: 'OFFLINE',
        cls: 'bg-slate-500/15 text-slate-300 border-slate-500/40',
        dot: 'bg-slate-400',
      };
    case 'case-study':
    default:
      return {
        label: 'CASE STUDY',
        cls: 'bg-violet-500/15 text-violet-300 border-violet-500/40',
        dot: 'bg-violet-400',
      };
  }
}

export function TopHud({
  mode,
  modelSource,
  snapshot,
  isLoading,
  inEditorial = false,
  onJumpBeat,
  onToggleMode,
  onToggleModelSource,
  onRefreshLive,
}: TopHudProps) {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 30000);
    return () => window.clearInterval(id);
  }, []);

  const badge = getSourceBadge(snapshot.fetchSource);
  const pullText =
    snapshot.fetchSource === 'case-study'
      ? `Case study · data for ${formatValidUtc(snapshot.validTimeIso)}`
      : snapshot.fetchSource === 'offline-fallback'
        ? 'Live data unavailable · showing the case study'
        : `Updated ${formatRelativeAge(snapshot.fetchedAtIso, nowMs)} (${formatUtcHm(snapshot.fetchedAtIso)}) · forecast for ${formatValidUtc(snapshot.validTimeIso)}`;

  return (
    <header className="fixed top-0 inset-x-0 z-30 pointer-events-none px-4 py-3 md:px-8">
      <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-3">
        {/* Title & Live Freshness Pill */}
        <div className="pointer-events-auto flex items-center gap-3 rounded-xl border border-slate-800/90 bg-slate-950/80 backdrop-blur-md px-3.5 py-2 shadow-lg">
          <CloudLightning className="w-4 h-4 text-sky-400 shrink-0" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold tracking-wide text-white">
                STRATOSPHERE DOWNWARDS
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-mono font-semibold border ${badge.cls}`}
              >
                <span className={`inline-block w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                {badge.label}
              </span>
            </div>
            <div className="mt-0.5 flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
              <Clock className="w-3 h-3 text-slate-500 shrink-0" />
              <span className="truncate max-w-[300px] sm:max-w-[440px]">{pullText}</span>
            </div>
          </div>
        </div>

        {/* Interactive Data Mode + Geometry Source Toggles */}
        <div className="pointer-events-auto flex flex-wrap items-center gap-2">
          {inEditorial && onJumpBeat && (
            <button
              type="button"
              onClick={() => onJumpBeat(1)}
              className="inline-flex items-center gap-1 rounded-xl border border-sky-500/40 bg-slate-950/85 hover:bg-sky-500/15 backdrop-blur-md px-3 py-1.5 text-[11px] font-mono text-sky-200 shadow-lg transition"
            >
              <ArrowUp className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Back to the globe</span>
            </button>
          )}
          <div
            role="group"
            aria-label="Data source"
            className="flex items-center rounded-xl border border-slate-800 bg-slate-950/80 backdrop-blur-md p-1 shadow-lg"
          >
            <button
              type="button"
              aria-pressed={mode === 'live'}
              title="Today's atmosphere from Open-Meteo"
              onClick={() => onToggleMode('live')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${
                mode === 'live'
                  ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Live data
            </button>
            <button
              type="button"
              aria-pressed={mode === 'case-study'}
              title="The November 2026 event, as it happened"
              onClick={() => onToggleMode('case-study')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${
                mode === 'case-study'
                  ? 'bg-violet-500/20 text-violet-200 border border-violet-400/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Case study
            </button>
            {mode === 'live' && (
              <button
                type="button"
                onClick={onRefreshLive}
                title="Refresh live data"
                aria-label="Refresh live data"
                className="ml-1 p-1 rounded-lg text-slate-400 hover:text-sky-300 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-sky-400' : ''}`} />
              </button>
            )}
          </div>

          <div
            role="group"
            aria-label="3D model"
            className="flex items-center rounded-xl border border-slate-800 bg-slate-950/80 backdrop-blur-md p-1 shadow-lg"
          >
            <Box className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-1" aria-hidden="true" />
            <button
              type="button"
              aria-pressed={modelSource === 'glb'}
              title="Full 3D model (about 4.5 MB)"
              onClick={() => onToggleModelSource('glb')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${
                modelSource === 'glb'
                  ? 'bg-slate-700/60 text-white border border-slate-500/60'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Detailed
            </button>
            <button
              type="button"
              aria-pressed={modelSource === 'procedural'}
              title="Lighter model for slower devices"
              onClick={() => onToggleModelSource('procedural')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${
                modelSource === 'procedural'
                  ? 'bg-slate-700/60 text-white border border-slate-500/60'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Simple
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
