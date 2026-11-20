import baseline from '../data/historicalBaseline.json';
import { jetGridUrl, parseJetTrack } from './jetTrack';
import fallbackJson from '../data/fallbackData.json';
import type {
  AtmosphereSnapshot,
  PolarTempPoint,
  RingSample60N,
  VerticalLevelPoint,
  ZonalWindPoint,
} from '../types/weather';

const CACHE_KEY = 'ssw_live_atmosphere_v3'; // v3 adds the jet stream track
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

const RING_LONGITUDES = [-135, -90, -45, 0, 45, 90, 135, 180] as const;

const PRESSURE_META: ReadonlyArray<{ hpa: number; altKm: number; climU: number; fbTempC: number }> = [
  { hpa: 10, altKm: 30.0, climU: baseline.verticalClimatology60N_Nov['10'], fbTempC: -36.4 },
  { hpa: 20, altKm: 26.0, climU: baseline.verticalClimatology60N_Nov['20'], fbTempC: -42.1 },
  { hpa: 50, altKm: 20.5, climU: baseline.verticalClimatology60N_Nov['50'], fbTempC: -51.4 },
  { hpa: 100, altKm: 16.0, climU: baseline.verticalClimatology60N_Nov['100'], fbTempC: -56.8 },
  { hpa: 250, altKm: 10.4, climU: baseline.verticalClimatology60N_Nov['250'], fbTempC: -52.2 },
  { hpa: 500, altKm: 5.5, climU: baseline.verticalClimatology60N_Nov['500'], fbTempC: -30.5 },
  { hpa: 850, altKm: 1.5, climU: baseline.verticalClimatology60N_Nov['850'], fbTempC: -8.6 },
  { hpa: 1000, altKm: 0.1, climU: baseline.verticalClimatology60N_Nov['1000'], fbTempC: -3.4 },
];

export function windToZonalU(speedMs: number, dirFromDeg: number): number {
  return -speedMs * Math.sin((dirFromDeg * Math.PI) / 180);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function safeNum(val: unknown, fallback: number): number {
  return typeof val === 'number' && Number.isFinite(val) ? val : fallback;
}

function computeHarmonicAmplitude(
  longitudesDeg: number[],
  values: number[],
  wavenumber: number
): number {
  const n = Math.min(longitudesDeg.length, values.length);
  if (n === 0) return 0;
  let a = 0;
  let b = 0;
  for (let i = 0; i < n; i++) {
    const lam = (longitudesDeg[i] * Math.PI) / 180;
    a += values[i] * Math.cos(wavenumber * lam);
    b += values[i] * Math.sin(wavenumber * lam);
  }
  a = (2 * a) / n;
  b = (2 * b) / n;
  return Math.sqrt(a * a + b * b);
}

export function getCaseStudySnapshot(): AtmosphereSnapshot {
  return fallbackJson as AtmosphereSnapshot;
}

interface OpenMeteoLocationPayload {
  hourly?: Record<string, Array<number | null> | string[]>;
}

function findCurrentHourIndex(times: string[] | undefined): number {
  if (!times || times.length === 0) return 0;
  const nowMs = Date.now();
  let bestIdx = 0;
  let bestDiff = Infinity;
  for (let i = 0; i < times.length; i++) {
    const tMs = Date.parse(times[i].endsWith('Z') ? times[i] : `${times[i]}Z`);
    if (!Number.isNaN(tMs)) {
      const diff = Math.abs(tMs - nowMs);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestIdx = i;
      }
    }
  }
  return bestIdx;
}

function readHourlyAt(
  payload: OpenMeteoLocationPayload | undefined,
  key: string,
  idx: number,
  fallbackVal: number
): number {
  const arr = payload?.hourly?.[key];
  if (!Array.isArray(arr) || idx < 0 || idx >= arr.length) return fallbackVal;
  return safeNum(arr[idx], fallbackVal);
}

function toUtcIso(raw: string | undefined, fallbackIso: string): string {
  if (!raw) return fallbackIso;
  const norm = raw.endsWith('Z') ? raw : `${raw}:00Z`.replace(':00:00Z', ':00Z');
  const d = Date.parse(norm);
  return Number.isNaN(d) ? fallbackIso : new Date(d).toISOString();
}

export async function fetchLiveAtmosphere(forceRefresh = false): Promise<AtmosphereSnapshot> {
  if (!forceRefresh) {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { savedAt: number; data: AtmosphereSnapshot };
        if (Date.now() - parsed.savedAt < CACHE_TTL_MS && parsed.data?.isLiveSuccess) {
          return {
            ...parsed.data,
            fetchSource: 'cached-live',
          };
        }
      }
    } catch {
      // Ignore storage read issues
    }
  }

  const fb = getCaseStudySnapshot();

  // Request A: UK (56.8,-4.7), Scandi (61.0,13.0), Atlantic (54.0,-28.0), Polar Cap (89.0,0.0)
  const surfaceUrl =
    'https://api.open-meteo.com/v1/forecast' +
    '?latitude=56.8,61.0,54.0,89.0&longitude=-4.7,13.0,-28.0,0.0' +
    '&hourly=temperature_2m,apparent_temperature,pressure_msl,wind_speed_10m,wind_gusts_10m,' +
    'wind_direction_10m,freezing_level_height,snowfall,temperature_850hPa,wind_speed_250hPa,' +
    'wind_direction_250hPa,temperature_10hPa' +
    '&wind_speed_unit=ms&forecast_days=2&timezone=UTC';

  // Request B: 60°N Shetland ring (8 longitudes) across 10..1000 hPa winds + temperatures
  const ringLonsParam = RING_LONGITUDES.join(',');
  const ringLatsParam = RING_LONGITUDES.map(() => '60').join(',');
  const ringUrl =
    `https://api.open-meteo.com/v1/forecast?latitude=${ringLatsParam}&longitude=${ringLonsParam}` +
    '&hourly=wind_speed_10hPa,wind_direction_10hPa,geopotential_height_10hPa,temperature_10hPa,' +
    'wind_speed_20hPa,wind_direction_20hPa,temperature_20hPa,' +
    'wind_speed_50hPa,wind_direction_50hPa,temperature_50hPa,' +
    'wind_speed_100hPa,wind_direction_100hPa,temperature_100hPa,' +
    'wind_speed_250hPa,wind_direction_250hPa,temperature_250hPa,' +
    'wind_speed_500hPa,wind_direction_500hPa,temperature_500hPa,' +
    'wind_speed_850hPa,wind_direction_850hPa,temperature_850hPa,' +
    'wind_speed_1000hPa,wind_direction_1000hPa,temperature_1000hPa' +
    '&wind_speed_unit=ms&forecast_days=2&timezone=UTC';

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 9000);

  // Request C: 250 hPa wind grid for the jet stream's track. Optional: if it fails, the rest of
  // the live data still loads and the globe falls back to the illustrative path.
  const jetPromise = fetch(jetGridUrl(), { signal: controller.signal })
    .then((r) => (r.ok ? r.json() : undefined))
    .then((json) => (json ? parseJetTrack(json) : undefined))
    .catch(() => undefined);

  try {
    const [surfaceRes, ringRes] = await Promise.all([
      fetch(surfaceUrl, { signal: controller.signal }),
      fetch(ringUrl, { signal: controller.signal }),
    ]);

    if (!surfaceRes.ok || !ringRes.ok) {
      throw new Error(`Open-Meteo HTTP ${surfaceRes.status}/${ringRes.status}`);
    }

    const surfaceJson = (await surfaceRes.json()) as
      | OpenMeteoLocationPayload
      | OpenMeteoLocationPayload[];
    const ringJson = (await ringRes.json()) as
      | OpenMeteoLocationPayload
      | OpenMeteoLocationPayload[];

    const surfaceList = Array.isArray(surfaceJson) ? surfaceJson : [surfaceJson];
    const ringList = Array.isArray(ringJson) ? ringJson : [ringJson];

    if (surfaceList.length < 4 || ringList.length < 8) {
      throw new Error('Unexpected Open-Meteo array shape');
    }

    const ukPayload = surfaceList[0];
    const scandiPayload = surfaceList[1];
    const atlanticPayload = surfaceList[2];
    const polarPayload = surfaceList[3];

    const ukTimes = ukPayload.hourly?.time as string[] | undefined;
    const nowIdx = findCurrentHourIndex(ukTimes);
    const validTimeIso = toUtcIso(ukTimes?.[nowIdx], new Date().toISOString());

    const ukTemp = readHourlyAt(ukPayload, 'temperature_2m', nowIdx, fb.ukSurface.tempC);
    const ukFeels = readHourlyAt(ukPayload, 'apparent_temperature', nowIdx, fb.ukSurface.feelsLikeC);
    const ukWind10 = readHourlyAt(ukPayload, 'wind_speed_10m', nowIdx, fb.ukSurface.windSpeed10mMs);
    const ukGusts10 = readHourlyAt(ukPayload, 'wind_gusts_10m', nowIdx, fb.ukSurface.windGusts10mMs);
    const ukDir10 = readHourlyAt(ukPayload, 'wind_direction_10m', nowIdx, fb.ukSurface.windDirection10mDeg);
    const ukMslp = readHourlyAt(ukPayload, 'pressure_msl', nowIdx, fb.ukSurface.pressureMslHpa);
    const ukT850 = readHourlyAt(ukPayload, 'temperature_850hPa', nowIdx, fb.ukSurface.temp850HpaC);
    const ukFreezeM = readHourlyAt(ukPayload, 'freezing_level_height', nowIdx, fb.ukSurface.freezingLevelM);
    const ukSnow = readHourlyAt(ukPayload, 'snowfall', nowIdx, fb.ukSurface.snowfallCmHr);
    const jetSpeed = readHourlyAt(ukPayload, 'wind_speed_250hPa', nowIdx, fb.ukSurface.jetSpeed250HpaMs);
    const jetDir = readHourlyAt(ukPayload, 'wind_direction_250hPa', nowIdx, fb.ukSurface.jetDirection250HpaDeg);

    const scandiMslp = readHourlyAt(scandiPayload, 'pressure_msl', nowIdx, fb.scandiHigh.pressureMslHpa);
    const scandiTemp = readHourlyAt(scandiPayload, 'temperature_2m', nowIdx, fb.scandiHigh.tempC);
    const scandiFeels = readHourlyAt(scandiPayload, 'apparent_temperature', nowIdx, fb.scandiHigh.feelsLikeC);
    const scandiT850 = readHourlyAt(scandiPayload, 'temperature_850hPa', nowIdx, fb.scandiHigh.temp850HpaC);

    const atlanticMslp = readHourlyAt(atlanticPayload, 'pressure_msl', nowIdx, fb.atlanticLow.pressureMslHpa);
    const atlanticTemp = readHourlyAt(atlanticPayload, 'temperature_2m', nowIdx, fb.atlanticLow.tempC);
    const atlanticFeels = readHourlyAt(atlanticPayload, 'apparent_temperature', nowIdx, fb.atlanticLow.feelsLikeC);
    const atlanticT850 = readHourlyAt(atlanticPayload, 'temperature_850hPa', nowIdx, fb.atlanticLow.temp850HpaC);

    const polarCapTemp10 = readHourlyAt(polarPayload, 'temperature_10hPa', nowIdx, fb.stratosphere60N.polarCapTemp10HpaC);

    const ringTimes = ringList[0].hourly?.time as string[] | undefined;
    const ringNowIdx = findCurrentHourIndex(ringTimes);

    const ringSamples: RingSample60N[] = RING_LONGITUDES.map((lonDeg, idx) => {
      const p = ringList[idx];
      const fbSample = fb.stratosphere60N.ringSamples[idx] ?? fb.stratosphere60N.ringSamples[0];
      const ws = readHourlyAt(p, 'wind_speed_10hPa', ringNowIdx, fbSample.windSpeedMs);
      const wd = readHourlyAt(p, 'wind_direction_10hPa', ringNowIdx, fbSample.windDirectionDeg);
      const gh = readHourlyAt(p, 'geopotential_height_10hPa', ringNowIdx, fbSample.geopotentialHeightM);
      const t10 = readHourlyAt(p, 'temperature_10hPa', ringNowIdx, fbSample.tempC);
      return {
        lonDeg,
        windSpeedMs: Number(ws.toFixed(1)),
        windDirectionDeg: Math.round(wd),
        zonalUMs: Number(windToZonalU(ws, wd).toFixed(1)),
        geopotentialHeightM: Math.round(gh),
        tempC: Number(t10.toFixed(1)),
      };
    });

    const zonalMean10 =
      ringSamples.reduce((acc, s) => acc + s.zonalUMs, 0) / ringSamples.length;
    const meanTemp10 =
      ringSamples.reduce((acc, s) => acc + s.tempC, 0) / ringSamples.length;
    const meanGh10 =
      ringSamples.reduce((acc, s) => acc + s.geopotentialHeightM, 0) / ringSamples.length;

    const polarAnomC = polarCapTemp10 - baseline.novemberClimatology.polarCapTemp10HpaC;
    const lat60AnomC = meanTemp10 - baseline.novemberClimatology.temp10HpaC;
    const poleTo60NGrad = polarCapTemp10 - meanTemp10;

    // 24h zonal wind + stratospheric temperature evolution around current forecast hour
    const offsets = [-18, -12, -6, 0, 6, 12, 18];
    const totalLen = (ringList[0].hourly?.wind_speed_10hPa?.length ?? 24) - 1;
    const timeSeries24hMs: ZonalWindPoint[] = [];
    const tempSeries24hC: PolarTempPoint[] = [];

    for (const off of offsets) {
      const i = clamp(ringNowIdx + off, 0, Math.max(0, totalLen));
      let uSum = 0;
      let tSum = 0;
      for (let k = 0; k < ringList.length; k++) {
        const ws = readHourlyAt(ringList[k], 'wind_speed_10hPa', i, 20);
        const wd = readHourlyAt(ringList[k], 'wind_direction_10hPa', i, 270);
        const t10 = readHourlyAt(ringList[k], 'temperature_10hPa', i, meanTemp10);
        uSum += windToZonalU(ws, wd);
        tSum += t10;
      }
      const pCapAtOff = readHourlyAt(polarPayload, 'temperature_10hPa', i, polarCapTemp10);
      const label = off === 0 ? 'Now' : off > 0 ? `+${off}h` : `${off}h`;
      timeSeries24hMs.push({
        time: label,
        zonalWindMs: Number((uSum / ringList.length).toFixed(1)),
      });
      tempSeries24hC.push({
        time: label,
        polarTempC: Number(pCapAtOff.toFixed(1)),
        lat60TempC: Number((tSum / ringList.length).toFixed(1)),
      });
    }

    const earliestPolar = tempSeries24hC[0]?.polarTempC ?? polarCapTemp10;
    const polarTemp24hDeltaC = Number((polarCapTemp10 - earliestPolar).toFixed(1));

    const lons = ringSamples.map((s) => s.lonDeg);
    const heights = ringSamples.map((s) => s.geopotentialHeightM);
    const w1Amp = Math.round(computeHarmonicAmplitude(lons, heights, 1));
    const w2Amp = Math.round(computeHarmonicAmplitude(lons, heights, 2));

    const wave1Norm = clamp(w1Amp / 900, 0.08, 1.0);
    const wave2Norm = clamp(w2Amp / 650, 0.08, 1.0);
    const combinedRatio =
      (w1Amp / baseline.novemberClimatology.wave1GeopotentialAmpM +
        w2Amp / baseline.novemberClimatology.wave2GeopotentialAmpM) *
      0.5;
    const historicPercentileEarlyNov = Math.round(clamp(50 + combinedRatio * 20, 15, 99));

    const verticalProfile: VerticalLevelPoint[] = PRESSURE_META.map((meta) => {
      let spdSum = 0;
      let uSum = 0;
      let tSum = 0;
      let dirX = 0;
      let dirY = 0;
      let liveSamples = 0;
      for (let k = 0; k < ringList.length; k++) {
        const rawWs = ringList[k]?.hourly?.[`wind_speed_${meta.hpa}hPa`]?.[ringNowIdx];
        if (typeof rawWs === 'number' && Number.isFinite(rawWs)) liveSamples++;
        const ws = readHourlyAt(ringList[k], `wind_speed_${meta.hpa}hPa`, ringNowIdx, Math.abs(meta.climU));
        const wd = readHourlyAt(ringList[k], `wind_direction_${meta.hpa}hPa`, ringNowIdx, 265);
        const tc = readHourlyAt(ringList[k], `temperature_${meta.hpa}hPa`, ringNowIdx, meta.fbTempC);
        spdSum += ws;
        uSum += windToZonalU(ws, wd);
        tSum += tc;
        const rad = (wd * Math.PI) / 180;
        dirX += Math.cos(rad);
        dirY += Math.sin(rad);
      }
      const meanSpd = spdSum / ringList.length;
      const meanU = uSum / ringList.length;
      const meanT = tSum / ringList.length;
      const meanDir = ((Math.atan2(dirY, dirX) * 180) / Math.PI + 360) % 360;
      return {
        pressureHpa: meta.hpa,
        altitudeKm: meta.altKm,
        windSpeedMs: Number(meanSpd.toFixed(1)),
        windDirectionDeg: Math.round(meanDir),
        zonalUMs: Number(meanU.toFixed(1)),
        climatologyUMs: meta.climU,
        anomalyMs: Number((meanU - meta.climU).toFixed(1)),
        tempC: Number(meanT.toFixed(1)),
        noData: liveSamples === 0,
      };
    });

    const pressureDiff = scandiMslp - atlanticMslp;
    const battlegroundSummary =
      scandiMslp >= 1022
        ? `High pressure over Scandinavia (${Math.round(scandiMslp)} hPa) is holding back the Atlantic low (${Math.round(atlanticMslp)} hPa). That can steer cold continental air towards the UK.`
        : pressureDiff > 15
          ? `Pressure is rising towards Scandinavia (${Math.round(scandiMslp)} hPa) against deeper Atlantic lows (${Math.round(atlanticMslp)} hPa), with the UK caught between.`
          : `No block today. Atlantic weather is in charge (${Math.round(atlanticMslp)} hPa west, ${Math.round(scandiMslp)} hPa east), keeping the UK changeable.`;

    const anomAbs = Math.abs(polarAnomC).toFixed(1);
    const anomWord = polarAnomC >= 0 ? 'warmer' : 'colder';
    const stratThermalFeelNote =
      `Over the pole, 30 km up: ${polarCapTemp10.toFixed(1)}°C, ${anomAbs}°C ${anomWord} than a typical November.` +
      (polarAnomC >= 12 ? ' A jump like that is the signature of a sudden warming.' : '');

    const jetTrack = await jetPromise;

    const snapshot: AtmosphereSnapshot = {
      mode: 'live',
      fetchSource: 'live-api',
      sourceLabel: 'Open-Meteo Live GFS/ECMWF Pressure-Level Feed',
      isLiveSuccess: true,
      fetchedAtIso: new Date().toISOString(),
      validTimeIso,
      ukSurface: {
        tempC: Number(ukTemp.toFixed(1)),
        feelsLikeC: Number(ukFeels.toFixed(1)),
        windSpeed10mMs: Number(ukWind10.toFixed(1)),
        windGusts10mMs: Number(ukGusts10.toFixed(1)),
        windDirection10mDeg: Math.round(ukDir10),
        pressureMslHpa: Number(ukMslp.toFixed(1)),
        temp850HpaC: Number(ukT850.toFixed(1)),
        freezingLevelM: Math.round(ukFreezeM),
        snowfallCmHr: Number(ukSnow.toFixed(1)),
        jetSpeed250HpaMs: Number(jetSpeed.toFixed(1)),
        jetDirection250HpaDeg: Math.round(jetDir),
        scotlandColdSnapRange: '-7.7°C to -9.0°C',
      },
      scandiHigh: {
        pressureMslHpa: Number(scandiMslp.toFixed(1)),
        tempC: Number(scandiTemp.toFixed(1)),
        feelsLikeC: Number(scandiFeels.toFixed(1)),
        temp850HpaC: Number(scandiT850.toFixed(1)),
      },
      atlanticLow: {
        pressureMslHpa: Number(atlanticMslp.toFixed(1)),
        tempC: Number(atlanticTemp.toFixed(1)),
        feelsLikeC: Number(atlanticFeels.toFixed(1)),
        temp850HpaC: Number(atlanticT850.toFixed(1)),
      },
      stratosphere60N: {
        zonalMeanWindMs: Number(zonalMean10.toFixed(1)),
        temp10HpaC: Number(meanTemp10.toFixed(1)),
        polarCapTemp10HpaC: Number(polarCapTemp10.toFixed(1)),
        polarCapTempAnomalyC: Number(polarAnomC.toFixed(1)),
        temp60NAnomalyC: Number(lat60AnomC.toFixed(1)),
        poleTo60NGradientC: Number(poleTo60NGrad.toFixed(1)),
        polarTemp24hDeltaC,
        geopotentialHeight10HpaM: Math.round(meanGh10),
        sswThresholdMs: 0.0,
        isReversed: zonalMean10 < 0,
        stratThermalFeelNote,
        timeSeries24hMs,
        tempSeries24hC,
        ringSamples,
      },
      waves: {
        wave1HeightAmpM: w1Amp,
        wave2HeightAmpM: w2Amp,
        era5NovClimWave1M: baseline.novemberClimatology.wave1GeopotentialAmpM,
        era5NovClimWave2M: baseline.novemberClimatology.wave2GeopotentialAmpM,
        wave1Norm,
        wave2Norm,
        historicPercentileEarlyNov,
      },
      verticalProfile,
      battlegroundSummary,
      jetTrack,
    };

    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ savedAt: Date.now(), data: snapshot }));
    } catch {
      // Ignore storage quota issues
    }

    return snapshot;
  } catch (err) {
    console.warn('Live Open-Meteo fetch failed, using offline snapshot:', err);
    return {
      ...fb,
      mode: 'live',
      fetchSource: 'offline-fallback',
      sourceLabel: 'Offline Fallback (Open-Meteo unreachable — showing Met Office Case Study)',
      isLiveSuccess: false,
      fetchedAtIso: new Date().toISOString(),
    };
  } finally {
    window.clearTimeout(timer);
  }
}
