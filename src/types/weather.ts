export type WeatherMode = 'live' | 'case-study';
export type FetchSource = 'live-api' | 'cached-live' | 'offline-fallback' | 'case-study';
export type ModelSource = 'glb' | 'procedural';
export type BeatId = 1 | 2 | 3 | 4 | 5;

export interface VerticalLevelPoint {
  pressureHpa: number;
  altitudeKm: number;
  windSpeedMs: number;
  windDirectionDeg: number;
  zonalUMs: number;
  climatologyUMs: number;
  anomalyMs: number;
  tempC: number;
}

export interface RingSample60N {
  lonDeg: number;
  windSpeedMs: number;
  windDirectionDeg: number;
  zonalUMs: number;
  geopotentialHeightM: number;
  tempC: number;
}

export interface ZonalWindPoint {
  time: string;
  zonalWindMs: number;
}

export interface PolarTempPoint {
  time: string;
  polarTempC: number;
  lat60TempC: number;
}

export interface WaveMetrics {
  wave1HeightAmpM: number;
  wave2HeightAmpM: number;
  era5NovClimWave1M: number;
  era5NovClimWave2M: number;
  wave1Norm: number;
  wave2Norm: number;
  historicPercentileEarlyNov: number;
}

export interface AtmosphereSnapshot {
  mode: WeatherMode;
  fetchSource: FetchSource;
  sourceLabel: string;
  isLiveSuccess: boolean;
  fetchedAtIso: string;
  validTimeIso: string;
  ukSurface: {
    tempC: number;
    feelsLikeC: number;
    windSpeed10mMs: number;
    windGusts10mMs: number;
    windDirection10mDeg: number;
    pressureMslHpa: number;
    temp850HpaC: number;
    freezingLevelM: number;
    snowfallCmHr: number;
    jetSpeed250HpaMs: number;
    jetDirection250HpaDeg: number;
    scotlandColdSnapRange: string;
  };
  scandiHigh: {
    pressureMslHpa: number;
    tempC: number;
    feelsLikeC: number;
    temp850HpaC: number;
  };
  atlanticLow: {
    pressureMslHpa: number;
    tempC: number;
    feelsLikeC: number;
    temp850HpaC: number;
  };
  stratosphere60N: {
    zonalMeanWindMs: number;
    temp10HpaC: number;
    polarCapTemp10HpaC: number;
    polarCapTempAnomalyC: number;
    temp60NAnomalyC: number;
    poleTo60NGradientC: number;
    polarTemp24hDeltaC: number;
    geopotentialHeight10HpaM: number;
    sswThresholdMs: number;
    isReversed: boolean;
    stratThermalFeelNote: string;
    timeSeries24hMs: ZonalWindPoint[];
    tempSeries24hC: PolarTempPoint[];
    ringSamples: RingSample60N[];
  };
  waves: WaveMetrics;
  verticalProfile: VerticalLevelPoint[];
  battlegroundSummary: string;
}

export interface BeatDescriptor {
  id: BeatId;
  range: [number, number];
  kicker: string;
  title: string;
  subtitle: string;
  pressureLabel: string;
  altitudeLabel: string;
  body: string;
  takeaway: string;
}
