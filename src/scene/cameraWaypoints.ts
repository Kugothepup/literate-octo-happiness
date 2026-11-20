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
    kicker: '1 of 5 · Ground level to 10 km',
    shortTitle: 'The jet stream',
    title: 'It starts with the jet stream',
    subtitle: 'The river of wind 10 km up that steers our weather',
    pressureLabel: '1000 → 250 hPa',
    altitudeLabel: '0 → 10 km',
    body:
      'In mid-November the jet stream ran south of the UK. That kept rain over southern Britain and let Arctic air settle over the north. Tulloch Bridge in the Highlands fell to -7.7°C, with nights of -8°C to -9°C forecast.',
    takeaway: 'Our weather is steered from 10 km up. This winter, the story starts higher still.',
  },
  {
    id: 2,
    range: [0.2, 0.4],
    kicker: '2 of 5 · 30 km above the Arctic',
    shortTitle: 'The polar vortex',
    title: 'Meet the polar vortex',
    subtitle: 'A ring of wind that keeps the Arctic’s cold locked in',
    pressureLabel: '10 hPa',
    altitudeLabel: '~30 km',
    body:
      'Every winter, a ring of strong westerly winds spins up around the North Pole, high in the stratosphere. While it spins fast, the coldest air stays bottled up over the Arctic. Forecasters watch its speed at 60°N, the latitude of Shetland.',
    takeaway:
      'If those winds stop and start blowing from the east, forecasters call it a major sudden stratospheric warming (SSW).',
  },
  {
    id: 3,
    range: [0.4, 0.6],
    kicker: '3 of 5 · The disruption',
    shortTitle: 'The disruption',
    title: 'Squeezed, then shoved off the pole',
    subtitle: 'Giant waves in the atmosphere hit the vortex from below',
    pressureLabel: '10 hPa',
    altitudeLabel: '~30 km',
    body:
      'From late October, huge waves of high and low pressure rose into the stratosphere. The first (wave 2) squeezed the vortex into a dumbbell. The second (wave 1) pushed it off the pole towards Russia. Keep scrolling to watch the ring change shape.',
    takeaway:
      'Met Office analysis of records back to the 1940s found the two waves together were stronger than any early-season event on record.',
  },
  {
    id: 4,
    range: [0.6, 0.8],
    kicker: '4 of 5 · From 30 km to the ground',
    shortTitle: 'The drip down',
    title: 'The shock drips downwards',
    subtitle: 'From 30 km to the ground takes weeks, not days',
    pressureLabel: '10 → 1000 hPa',
    altitudeLabel: '30 → 0 km',
    body:
      'A broken vortex doesn’t change your weather overnight. Week by week, the slower winds work their way down through the atmosphere until they reach the jet stream. That usually takes two to six weeks.',
    takeaway: 'That’s how a November shock high above the Arctic could shape December weather here.',
  },
  {
    id: 5,
    range: [0.8, 1.0],
    kicker: '5 of 5 · Back at ground level',
    shortTitle: 'The battleground',
    title: 'Where the high sets up decides it',
    subtitle: 'Frost or rain? A few hundred miles makes the difference',
    pressureLabel: '1000 hPa',
    altitudeLabel: 'Surface',
    body:
      'With the jet stream weaker, high pressure can build and stall near Scandinavia, blocking the usual Atlantic weather. The UK then sits on a battleground: a small shift east or west decides whether we get mild southerly winds or bitter easterlies.',
    takeaway: 'An SSW raises the odds of a cold spell. It doesn’t guarantee one.',
  },
];
