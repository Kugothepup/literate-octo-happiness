import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { AtmosphereSnapshot } from '../types/weather';
import { jetAt } from '../services/jetTrack';
import { EARTH_RADIUS, geoToThree } from './cameraWaypoints';
import { createJetStreamTexture } from './materials';

/**
 * The jet stream ribbon, drawn along a track.
 *
 * With live data it follows today's jet core (from the 250 hPa wind grid), wider where the jet
 * is faster. Without it (case study, offline) it follows the illustrative November path the
 * Blender model was built with: south of the UK, meandering across the Atlantic.
 * Switching data eases the ribbon from one track to the other.
 */

const LON_START = -72;
const LON_END = 44;
const N_ALONG = 96;
const N_ACROSS = 4;
export const JET_RADIUS = EARTH_RADIUS + 0.095; // ~250 hPa, about 10 km up (exaggerated)

/** The illustrative path used by the Blender model (blender/build_atmosphere.py). */
function illustrativeLat(lon: number): number {
  const t = (lon - LON_START) / (LON_END - LON_START);
  return 48.5 - 4.2 * Math.sin(2 * Math.PI * (t - 0.15)) - 2.6 * Math.cos(3 * Math.PI * (t - 0.35));
}

const DEFAULT_SPEED_MS = 45;

/** Latitude and speed at each of the ribbon's sample points for a given snapshot. */
function sampleTrack(snapshot: AtmosphereSnapshot): { lat: Float32Array; speed: Float32Array } {
  const lat = new Float32Array(N_ALONG + 1);
  const speed = new Float32Array(N_ALONG + 1);
  for (let i = 0; i <= N_ALONG; i++) {
    const lon = LON_START + ((LON_END - LON_START) * i) / N_ALONG;
    if (snapshot.jetTrack && snapshot.jetTrack.length > 1) {
      const p = jetAt(snapshot.jetTrack, lon);
      lat[i] = p.latDeg;
      speed[i] = p.speedMs;
    } else {
      lat[i] = illustrativeLat(lon);
      speed[i] = DEFAULT_SPEED_MS;
    }
  }
  return { lat, speed };
}

/** Width multiplier: faster jet, wider ribbon. 45 m/s is the illustrative width. */
function widthFor(speedMs: number): number {
  return THREE.MathUtils.clamp(0.4 + (speedMs / 45) * 0.6, 0.45, 1.35);
}

function writePositions(geo: THREE.BufferGeometry, lat: Float32Array, speed: Float32Array): void {
  const pos = geo.getAttribute('position') as THREE.BufferAttribute;
  const centre = (i: number) => {
    const k = THREE.MathUtils.clamp(i, 0, N_ALONG);
    const lon = LON_START + ((LON_END - LON_START) * k) / N_ALONG;
    return geoToThree(lat[k], lon, JET_RADIUS);
  };
  for (let i = 0; i <= N_ALONG; i++) {
    const t = i / N_ALONG;
    const pC = centre(i);
    const tangent = centre(i + 1).sub(centre(i - 1)).normalize();
    const up = pC.clone().normalize();
    const side = new THREE.Vector3().crossVectors(up, tangent).normalize();
    const taper = Math.pow(Math.sin(Math.PI * t), 0.35);
    const halfWidth = 0.075 * taper * widthFor(speed[i]);
    const arch = 0.018 * taper;
    for (let j = 0; j <= N_ACROSS; j++) {
      const sOff = (j / N_ACROSS - 0.5) * 2;
      const p = pC
        .clone()
        .addScaledVector(side, sOff * halfWidth)
        .addScaledVector(up, arch * (1 - sOff * sOff));
      pos.setXYZ(i * (N_ACROSS + 1) + j, p.x, p.y, p.z);
    }
  }
  pos.needsUpdate = true;
  geo.computeBoundingSphere();
}

function createRibbonGeometry(): THREE.BufferGeometry {
  const geo = new THREE.BufferGeometry();
  const count = (N_ALONG + 1) * (N_ACROSS + 1);
  const uvs: number[] = [];
  const indices: number[] = [];
  for (let i = 0; i <= N_ALONG; i++) {
    for (let j = 0; j <= N_ACROSS; j++) uvs.push((i / N_ALONG) * 3, j / N_ACROSS);
  }
  const stride = N_ACROSS + 1;
  for (let i = 0; i < N_ALONG; i++) {
    for (let j = 0; j < N_ACROSS; j++) {
      const a = i * stride + j;
      const b = (i + 1) * stride + j;
      const c = (i + 1) * stride + (j + 1);
      const d = i * stride + (j + 1);
      indices.push(a, b, c, a, c, d);
    }
  }
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  return geo;
}

/** Where the jet-stream tooltip should sit: on the ribbon at 18°W, out over the Atlantic. */
export function jetAnchorPosition(snapshot: AtmosphereSnapshot): THREE.Vector3 {
  const lat =
    snapshot.jetTrack && snapshot.jetTrack.length > 1 ? jetAt(snapshot.jetTrack, -18).latDeg : illustrativeLat(-18);
  return geoToThree(lat, -18, JET_RADIUS + 0.035);
}

interface LiveJetRibbonProps {
  snapshot: AtmosphereSnapshot;
  scrollProgress: number;
}

export function LiveJetRibbon({ snapshot, scrollProgress }: LiveJetRibbonProps) {
  const texture = useMemo(() => createJetStreamTexture(), []);
  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      }),
    [texture]
  );
  const geometry = useMemo(() => createRibbonGeometry(), []);
  const target = useMemo(() => sampleTrack(snapshot), [snapshot]);
  const current = useRef<{ lat: Float32Array; speed: Float32Array } | null>(null);
  const meanSpeed = useMemo(() => target.speed.reduce((a, b) => a + b, 0) / target.speed.length, [target]);

  if (!current.current) {
    current.current = { lat: target.lat.slice(), speed: target.speed.slice() };
    writePositions(geometry, current.current.lat, current.current.speed);
  }

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
      texture.dispose();
    },
    [geometry, material, texture]
  );

  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    const p = THREE.MathUtils.clamp(scrollProgress, 0, 1);

    // Ease towards the selected track; only rebuild while it's still moving.
    const cur = current.current!;
    const k = 1 - Math.exp(-2.5 * dt);
    let moving = false;
    for (let i = 0; i <= N_ALONG; i++) {
      const dLat = target.lat[i] - cur.lat[i];
      const dSpd = target.speed[i] - cur.speed[i];
      if (Math.abs(dLat) > 0.01 || Math.abs(dSpd) > 0.05) {
        cur.lat[i] += dLat * k;
        cur.speed[i] += dSpd * k;
        moving = true;
      }
    }
    if (moving) writePositions(geometry, cur.lat, cur.speed);

    // Flow speed follows the jet's average strength along the track.
    texture.offset.x -= dt * 0.42 * THREE.MathUtils.clamp(meanSpeed / 45, 0.35, 1.8);

    // Strongest in beat 1 and beat 5, faint in between.
    const beat1Vis = 1 - THREE.MathUtils.smoothstep(p, 0.16, 0.3);
    const beat5Vis = THREE.MathUtils.smoothstep(p, 0.78, 0.9);
    material.opacity = 0.24 + 0.72 * Math.max(beat1Vis, beat5Vis);
  });

  return <mesh name="JetStream_Live" geometry={geometry} material={material} />;
}
