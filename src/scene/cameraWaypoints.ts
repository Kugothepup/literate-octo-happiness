import * as THREE from 'three';
import type { BeatDescriptor, BeatId } from '../types/weather';

export const EARTH_RADIUS = 2.0;

/**
 * Convert geographic latitude/longitude (deg) and radial distance to Three.js Y-up coords.
 * Matches glTF export (X, Z, -Y) from Blender build_atmosphere.py.
 */
export function geoToThree(latDeg: number, lonDeg: number, radius: number): THREE.Vector3 {
  const lat = THREE.MathUtils.degToRad(latDeg);
  const lon = THREE.MathUtils.degToRad(lonDeg);
  return new THREE.Vector3(
    radius * Math.cos(lat) * Math.sin(lon),
    radius * Math.sin(lat),
    radius * Math.cos(lat) * Math.cos(lon)
  );
}

export const ANCHOR_NAMES = [
  'Anchor_UK_Surface',
  'Anchor_JetStream',
  'Anchor_Shetland_60N',
  'Anchor_Vortex_Core',
  'Anchor_Vertical_Slice',
  'Anchor_Scandi_High',
] as const;

export type AnchorName = (typeof ANCHOR_NAMES)[number];

export const DEFAULT_ANCHOR_POSITIONS: Record<AnchorName, THREE.Vector3> = {
  Anchor_UK_Surface: geoToThree(56.8, -4.7, 2.05),
  Anchor_JetStream: geoToThree(48.5, -18.0, 2.13),
  Anchor_Shetland_60N: geoToThree(60.2, -1.2, 2.53),
  Anchor_Vortex_Core: geoToThree(78.0, 45.0, 2.56),
  Anchor_Vertical_Slice: geoToThree(62.0, -2.0, 2.29),
  Anchor_Scandi_High: geoToThree(61.0, 13.0, 2.24),
};

export interface CameraWaypoint {
  progress: number;
  position: THREE.Vector3;
  target: THREE.Vector3;
  altitudeKm: number;
  pressureHpa: number;
}

export const CAMERA_WAYPOINTS: CameraWaypoint[] = [
  {
    progress: 0.0,
    position: new THREE.Vector3(-1.15, 2.25, 3.05),
    target: new THREE.Vector3(-0.32, 1.50, 1.05),
    altitudeKm: 1.5,
    pressureHpa: 850,
  },
  {
    progress: 0.15,
    position: new THREE.Vector3(-0.95, 2.55, 2.80),
    target: new THREE.Vector3(-0.26, 1.62, 1.00),
    altitudeKm: 10.4,
    pressureHpa: 250,
  },
  {
    progress: 0.30,
    position: new THREE.Vector3(-0.18, 4.78, 1.48),
    target: new THREE.Vector3(-0.08, 2.15, 0.15),
    altitudeKm: 30.0,
    pressureHpa: 10,
  },
  {
    progress: 0.50,
    position: new THREE.Vector3(1.52, 4.35, 2.20),
    target: new THREE.Vector3(0.08, 2.18, 0.12),
    altitudeKm: 30.0,
    pressureHpa: 10,
  },
  {
    progress: 0.70,
    position: new THREE.Vector3(-2.42, 2.48, 2.20),
    target: new THREE.Vector3(-0.14, 1.92, 0.92),
    altitudeKm: 16.0,
    pressureHpa: 100,
  },
  {
    progress: 0.92,
    position: new THREE.Vector3(-0.55, 2.55, 3.10),
    target: new THREE.Vector3(-0.10, 1.66, 1.02),
    altitudeKm: 0.1,
    pressureHpa: 1000,
  },
  {
    progress: 1.0,
    position: new THREE.Vector3(-0.55, 2.55, 3.10),
    target: new THREE.Vector3(-0.10, 1.66, 1.02),
    altitudeKm: 0.1,
    pressureHpa: 1000,
  },
];

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

export function sampleCameraState(progress: number): {
  position: THREE.Vector3;
  target: THREE.Vector3;
  altitudeKm: number;
  pressureHpa: number;
} {
  const p = THREE.MathUtils.clamp(progress, 0, 1);
  let i = 0;
  while (i < CAMERA_WAYPOINTS.length - 2 && p > CAMERA_WAYPOINTS[i + 1].progress) {
    i++;
  }
  const a = CAMERA_WAYPOINTS[i];
  const b = CAMERA_WAYPOINTS[i + 1];
  const span = Math.max(1e-5, b.progress - a.progress);
  const t = smoothstep(THREE.MathUtils.clamp((p - a.progress) / span, 0, 1));

  return {
    position: a.position.clone().lerp(b.position, t),
    target: a.target.clone().lerp(b.target, t),
    altitudeKm: THREE.MathUtils.lerp(a.altitudeKm, b.altitudeKm, t),
    pressureHpa: Math.round(THREE.MathUtils.lerp(a.pressureHpa, b.pressureHpa, t)),
  };
}

export function progressToBeat(progress: number): BeatId {
  if (progress < 0.2) return 1;
  if (progress < 0.4) return 2;
  if (progress < 0.6) return 3;
  if (progress < 0.8) return 4;
  return 5;
}

export const BEAT_DESCRIPTORS: BeatDescriptor[] = [
  {
    id: 1,
    range: [0.0, 0.2],
    kicker: 'BEAT 01 · SURFACE TO 250 HPA',
    title: 'The Surface Setup & Jet Stream',
    subtitle: 'Why cold snaps often start miles above Scotland',
    pressureLabel: '1000 → 250 hPa',
    altitudeLabel: '0 → 10 km',
    body:
      'Down in the troposphere, an undulating jet stream runs south of the UK across the North Atlantic. Low pressure lingers over southern Britain while crisp arctic air drains over northern hills, primed for -7.7°C to -9°C Scottish cold snaps.',
    takeaway: 'Surface weather responds to steering currents 10 km up — and sometimes 30 km up.',
  },
  {
    id: 2,
    range: [0.2, 0.4],
    kicker: 'BEAT 02 · 30 KM STRATOSPHERE (10 HPA)',
    title: 'Ascending to the Polar Vortex',
    subtitle: 'Measuring the 60°N zonal collar near Shetland',
    pressureLabel: '10 hPa',
    altitudeLabel: '~30 km',
    body:
      'Thirty kilometres above the pole, winter darkness breeds a fierce westerly collar of stratospheric winds orbiting the Arctic. Meteorologists track zonal mean wind speed at 60°N — Shetland latitude — for signs of stress.',
    takeaway: 'When 60°N westerlies decelerate past 0 m/s to easterly, a Major SSW is declared.',
  },
  {
    id: 3,
    range: [0.4, 0.6],
    kicker: 'BEAT 03 · PLANETARY WAVES 1 & 2',
    title: 'Pinched, Tipped & Displaced',
    subtitle: 'Tropospheric ridges hammer the vortex from below',
    pressureLabel: '10 hPa · Wave Forcing',
    altitudeLabel: '~30 km',
    body:
      'Giant atmospheric planetary waves punch up into the stratosphere. First, two opposing Wave 2 ridges squeeze the vortex into an elongated dumbbell; then a colossal Wave 1 Pacific ridge tips it off the pole toward Russia.',
    takeaway: 'In Nov 2026, extreme Wave 1 + Wave 2 forcing hit unusually early in the winter.',
  },
  {
    id: 4,
    range: [0.6, 0.8],
    kicker: 'BEAT 04 · VERTICAL COUPLING',
    title: 'The “Dripping Down” Effect',
    subtitle: 'Stratospheric anomalies descend 10 hPa → 1000 hPa',
    pressureLabel: '10 → 1000 hPa',
    altitudeLabel: '30 → 0 km',
    body:
      'Reversed easterly anomalies do not drop to your garden overnight. Week by week, weakened westerly momentum visibly oozes down through 50 hPa, 100 hPa, and the 250 hPa jet stream — typically taking two to six weeks.',
    takeaway: 'Stratosphere-troposphere coupling links November disruption to December weather.',
  },
  {
    id: 5,
    range: [0.8, 1.0],
    kicker: 'BEAT 05 · SURFACE PAYOFF & UNCERTAINTY',
    title: 'Blocking Domes & Battlegrounds',
    subtitle: 'Where high pressure builds decides frost vs. rain',
    pressureLabel: '1000 hPa MSLP',
    altitudeLabel: 'Surface',
    body:
      'Back at the surface, high-pressure blocking domes bloom near Scandinavia, diverting Atlantic lows away or forcing the UK into a sharp meteorological battleground — where small longitude shifts flip mild southerlies into biting easterlies.',
    takeaway: 'Blocking patterns raise cold-snap odds across Northern Europe for weeks ahead.',
  },
];

