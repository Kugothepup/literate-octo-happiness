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
  if (diffMin < 60) return `${diffMin}m ago`;
  const hrs = Math.round(diffMin / 60);
  return `${hrs}h ago`;
}

function getSourceBadge(fetchSource: FetchSource): { label: string; cls: string; dot: string } {
  switch (fetchSource) {
    case 'live-api':
      return {
        label: 'LIVE FEED',
        cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
        dot: 'bg-emerald-400',
      };
    case 'cached-live':
      return {
        label: 'CACHED LIVE',
        cls: 'bg-sky-500/15 text-sky-300 border-sky-500/40',
        dot: 'bg-sky-400',
      };
    case 'offline-fallback':
      return {
        label: 'FALLBACK',
        cls: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
        dot: 'bg-amber-400',
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
      ? `Nov 2026 Archive · Valid ${formatValidUtc(snapshot.validTimeIso)}`
      : `Pulled ${formatUtcHm(snapshot.fetchedAtIso)} (${formatRelativeAge(snapshot.fetchedAtIso, nowMs)}) · Valid ${formatValidUtc(snapshot.validTimeIso)}`;

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
                className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-mono font-semibold border ${badge.cls}`}
              >
                <span className={`inline-block w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                {badge.label}
              </span>
            </div>
            <div className="mt-0.5 flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
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
              <ArrowUp className="w-3.5 h-3.5" />
              <span>3D Globe</span>
            </button>
          )}
          <div className="flex items-center rounded-xl border border-slate-800 bg-slate-950/80 backdrop-blur-md p-1 shadow-lg">
            <button
              type="button"
              onClick={() => onToggleMode('live')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${
                mode === 'live'
                  ? 'bg-sky-500/20 text-sky-200 border border-sky-400/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Live Atmosphere
            </button>
            <button
              type="button"
              onClick={() => onToggleMode('case-study')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${
                mode === 'case-study'
                  ? 'bg-violet-500/20 text-violet-200 border border-violet-400/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Nov 2026 Case Study
            </button>
            {mode === 'live' && (
              <button
                type="button"
                onClick={onRefreshLive}
                title="Force Fresh Open-Meteo Pull"
                className="ml-1 p-1 rounded-lg text-slate-400 hover:text-sky-300 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-sky-400' : ''}`} />
              </button>
            )}
          </div>

          <div className="flex items-center rounded-xl border border-slate-800 bg-slate-950/80 backdrop-blur-md p-1 shadow-lg">
            <Box className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-1" />
            <button
              type="button"
              onClick={() => onToggleModelSource('glb')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition ${
                modelSource === 'glb'
                  ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Blender GLB
            </button>
            <button
              type="button"
              onClick={() => onToggleModelSource('procedural')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition ${
                modelSource === 'procedural'
                  ? 'bg-amber-500/20 text-amber-200 border border-amber-400/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Procedural
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
