import * as THREE from 'three';
import baseline from '../data/historicalBaseline.json';
import type { AtmosphereSnapshot } from '../types/weather';

/**
 * How the selected data (live or case study) shapes the 3D scene.
 *
 * The scroll-driven teaching animation (the beat 3 squeeze and shove) stays as it is.
 * These values set the vortex's resting state and the dome, so switching between
 * Live data and Case study visibly changes the globe. Shared by the Blender and
 * procedural scenes so both behave the same way.
 */
export interface LiveVisuals {
  /** Resting Wave2_Pinch weight, 0–0.6: how squeezed the vortex is when not animating. */
  restWave2: number;
  /** Resting Wave1_Displaced weight, 0–0.6: how far off the pole it sits. */
  restWave1: number;
  /** Signed spin factor: positive = westerly, negative = reversed (easterly). */
  spin: number;
  /** 0–1: shift from cold indigo to warm rose as the pole warms or the winds reverse. */
  warmth: number;
  /** Emissive intensity: a strong vortex glows brighter than a weak one. */
  glow: number;
  /** 0–1: how much high pressure there is over Scandinavia. */
  domeStrength: number;
}

const CLIM = baseline.novemberClimatology;
const clamp01 = (v: number) => THREE.MathUtils.clamp(v, 0, 1);

export function liveVisualTargets(s: AtmosphereSnapshot): LiveVisuals {
  const s60 = s.stratosphere60N;
  // Waves at their typical November size leave the ring round; four times typical gives the full shape.
  const r2 = s.waves.wave2HeightAmpM / CLIM.wave2GeopotentialAmpM;
  const r1 = s.waves.wave1HeightAmpM / CLIM.wave1GeopotentialAmpM;
  const u10 = s60.zonalMeanWindMs;

  return {
    restWave2: clamp01((r2 - 1) / 3) * 0.6,
    restWave1: clamp01((r1 - 1) / 3) * 0.6,
    spin: s60.isReversed ? -Math.max(0.18, Math.abs(u10) / 18) : Math.max(0.25, u10 / 28),
    warmth: Math.max(clamp01(s60.polarCapTempAnomalyC / 30), s60.isReversed ? 0.6 : 0),
    glow: 0.45 + 0.5 * THREE.MathUtils.clamp(u10 / CLIM.zonalMeanWind10HpaMs, 0, 1.3),
    // 1005 hPa or less: no block. 1035 hPa or more: a strong one.
    domeStrength: clamp01((s.scandiHigh.pressureMslHpa - 1005) / 30),
  };
}

/** Ease the current values towards the targets so a data switch morphs instead of jumping. */
export function easeVisuals(current: LiveVisuals, target: LiveVisuals, dt: number): void {
  const k = 1 - Math.exp(-2.5 * dt);
  (Object.keys(target) as Array<keyof LiveVisuals>).forEach((key) => {
    current[key] += (target[key] - current[key]) * k;
  });
}

/** Morph weights: the beat 3 teaching animation on top of the data-driven resting shape. */
export function vortexMorphWeights(
  p: number,
  vis: LiveVisuals,
  waves: AtmosphereSnapshot['waves']
): { wave2: number; wave1: number } {
  const ss = THREE.MathUtils.smoothstep;
  const w2Scale = THREE.MathUtils.clamp(0.35 + 0.65 * waves.wave2Norm, 0.2, 1.0);
  const w1Scale = THREE.MathUtils.clamp(0.35 + 0.65 * waves.wave1Norm, 0.2, 1.0);
  const anim2 = ss(p, 0.36, 0.47) * (1 - 0.55 * ss(p, 0.52, 0.68)) * w2Scale;
  const anim1 = ss(p, 0.46, 0.58) * (1 - ss(p, 0.8, 0.94)) * w1Scale;
  return { wave2: Math.max(vis.restWave2, anim2), wave1: Math.max(vis.restWave1, anim1) };
}

const VORTEX_COLD = new THREE.Color('#6366f1');
const VORTEX_WARM = new THREE.Color('#f43f5e');

export function applyVortexMaterial(mat: THREE.MeshStandardMaterial, p: number, vis: LiveVisuals): void {
  mat.emissive.lerpColors(VORTEX_COLD, VORTEX_WARM, vis.warmth * 0.6);
  mat.emissiveIntensity = vis.glow;
  mat.opacity = 0.82 * (1 - 0.65 * THREE.MathUtils.smoothstep(p, 0.82, 0.96));
}

/** Dome: shows in beat 5. With no block it stays as a faint, flat outline of what one would look like. */
export function domeUniformValues(p: number, vis: LiveVisuals): { opacity: number; height: number } {
  const beat5 = THREE.MathUtils.smoothstep(p, 0.78, 0.9);
  return {
    opacity: beat5 * (0.3 + 0.7 * vis.domeStrength),
    height: 0.3 + 0.7 * vis.domeStrength,
  };
}
