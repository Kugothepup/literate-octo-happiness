import type { JetTrackPoint } from '../types/weather';

/**
 * Finding today's jet stream.
 *
 * We sample 250 hPa winds (about 10 km up) on a grid over the North Atlantic and Europe, and at
 * each longitude take the latitude where the westerly wind is strongest: the jet's core. The
 * grid is coarse (10° by 5°), so the core latitude is refined between grid rows and smoothed
 * along the track. This is a fair sketch of the jet's path, not a forecast-grade analysis.
 */

export const JET_LONGITUDES = [-70, -60, -50, -40, -30, -20, -10, 0, 10, 20, 30, 40] as const;
export const JET_LATITUDES = [30, 35, 40, 45, 50, 55, 60, 65, 70, 75] as const;
const LAT_STEP = 5;

export function jetGridUrl(): string {
  const lats: number[] = [];
  const lons: number[] = [];
  for (const lon of JET_LONGITUDES) {
    for (const lat of JET_LATITUDES) {
      lats.push(lat);
      lons.push(lon);
    }
  }
  return (
    'https://api.open-meteo.com/v1/forecast' +
    `?latitude=${lats.join(',')}&longitude=${lons.join(',')}` +
    '&hourly=wind_speed_250hPa,wind_direction_250hPa&forecast_hours=1&wind_speed_unit=ms&timezone=UTC'
  );
}

interface GridPayload {
  latitude: number;
  longitude: number;
  hourly?: { wind_speed_250hPa?: Array<number | null>; wind_direction_250hPa?: Array<number | null> };
}

/** Westerly (west-to-east) part of the wind, m/s. */
function westerly(speed: number, dirDeg: number): number {
  return -speed * Math.sin((dirDeg * Math.PI) / 180);
}

interface Candidate {
  lat: number;
  u: number;
}

/** Local maxima of the westerly wind in one column, refined between grid rows. */
function columnCandidates(u: number[]): Candidate[] {
  const peak = Math.max(...u);
  const out: Candidate[] = [];
  for (let i = 0; i < u.length; i++) {
    const below = i > 0 ? u[i - 1] : -Infinity;
    const above = i < u.length - 1 ? u[i + 1] : -Infinity;
    if (u[i] < below || u[i] < above || u[i] < 0.8 * peak) continue;
    let offset = 0;
    if (Number.isFinite(below) && Number.isFinite(above)) {
      const curvature = below - 2 * u[i] + above;
      if (curvature < 0) offset = Math.max(-0.5, Math.min(0.5, (0.5 * (below - above)) / curvature));
    }
    out.push({ lat: JET_LATITUDES[i] + offset * LAT_STEP, u: u[i] });
  }
  return out;
}

export function parseJetTrack(payload: unknown): JetTrackPoint[] | undefined {
  const list = (Array.isArray(payload) ? payload : [payload]) as GridPayload[];
  const columns = new Map<number, number[]>();
  for (const loc of list) {
    const lon = JET_LONGITUDES.find((l) => Math.abs(l - loc.longitude) < 1);
    const latIdx = JET_LATITUDES.findIndex((l) => Math.abs(l - loc.latitude) < 1);
    const ws = loc.hourly?.wind_speed_250hPa?.[0];
    const wd = loc.hourly?.wind_direction_250hPa?.[0];
    if (lon === undefined || latIdx < 0 || typeof ws !== 'number' || typeof wd !== 'number') continue;
    const col = columns.get(lon) ?? new Array(JET_LATITUDES.length).fill(Number.NaN);
    col[latIdx] = westerly(ws, wd);
    columns.set(lon, col);
  }
  if (columns.size < JET_LONGITUDES.length) return undefined;

  const cands = JET_LONGITUDES.map((lon) => {
    const col = columns.get(lon)!;
    if (col.some((v) => Number.isNaN(v))) return [] as Candidate[];
    return columnCandidates(col);
  });
  if (cands.some((c) => c.length === 0)) return undefined;

  // Start from the strongest core anywhere, then walk west and east choosing, at each longitude,
  // the core closest to its neighbour so the track doesn't jump between two branches.
  let startIdx = 0;
  let startBest = -Infinity;
  cands.forEach((c, i) => {
    const m = Math.max(...c.map((x) => x.u));
    if (m > startBest) {
      startBest = m;
      startIdx = i;
    }
  });
  const chosen: Candidate[] = new Array(cands.length);
  chosen[startIdx] = cands[startIdx].reduce((a, b) => (b.u > a.u ? b : a));
  const pickNear = (i: number, prevLat: number) =>
    cands[i].reduce((a, b) => (Math.abs(b.lat - prevLat) < Math.abs(a.lat - prevLat) ? b : a));
  for (let i = startIdx - 1; i >= 0; i--) chosen[i] = pickNear(i, chosen[i + 1].lat);
  for (let i = startIdx + 1; i < cands.length; i++) chosen[i] = pickNear(i, chosen[i - 1].lat);

  // Gentle smoothing along the track.
  const lats = chosen.map((c) => c.lat);
  const smoothed = lats.map((lat, i) =>
    i === 0 || i === lats.length - 1 ? lat : 0.25 * lats[i - 1] + 0.5 * lat + 0.25 * lats[i + 1]
  );

  return JET_LONGITUDES.map((lon, i) => ({
    lonDeg: lon,
    latDeg: Number(smoothed[i].toFixed(2)),
    speedMs: Number(Math.max(0, chosen[i].u).toFixed(1)),
  }));
}

/** Latitude and speed of the jet core at a given longitude, by linear interpolation. */
export function jetAt(track: JetTrackPoint[], lonDeg: number): { latDeg: number; speedMs: number } {
  if (lonDeg <= track[0].lonDeg) return { latDeg: track[0].latDeg, speedMs: track[0].speedMs };
  const last = track[track.length - 1];
  if (lonDeg >= last.lonDeg) return { latDeg: last.latDeg, speedMs: last.speedMs };
  for (let i = 0; i < track.length - 1; i++) {
    const a = track[i];
    const b = track[i + 1];
    if (lonDeg >= a.lonDeg && lonDeg <= b.lonDeg) {
      const t = (lonDeg - a.lonDeg) / (b.lonDeg - a.lonDeg);
      return { latDeg: a.latDeg + (b.latDeg - a.latDeg) * t, speedMs: a.speedMs + (b.speedMs - a.speedMs) * t };
    }
  }
  return { latDeg: last.latDeg, speedMs: last.speedMs };
}
