import { Suspense, useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import type { AtmosphereSnapshot } from '../types/weather';
import {
  DEFAULT_ANCHOR_POSITIONS,
  EARTH_RADIUS,
  geoToThree,
  type AnchorName,
} from './cameraWaypoints';
import {
  createAtmosphereSliceMaterial,
  createBlockingDomeMaterial,
  createProceduralEarthTexture,
  createVortexTexture,
} from './materials';
import {
  applyVortexMaterial,
  domeUniformValues,
  easeVisuals,
  liveVisualTargets,
  vortexMorphWeights,
  type LiveVisuals,
} from './liveVisuals';
import { LiveJetRibbon } from './LiveJetRibbon';

interface ProceduralAtmosphereProps {
  scrollProgress: number;
  snapshot: AtmosphereSnapshot;
  onAnchorsResolved?: (anchors: Record<AnchorName, THREE.Vector3>) => void;
}

function ProceduralEarthPBR() {
  const [albedoMap, normalMap, roughnessMap, emissiveMap] = useTexture([
    `${import.meta.env.BASE_URL}textures/earth_albedo.png`,
    `${import.meta.env.BASE_URL}textures/earth_normal.png`,
    `${import.meta.env.BASE_URL}textures/earth_roughness.png`,
    `${import.meta.env.BASE_URL}textures/earth_emissive.png`,
  ]);

  useEffect(() => {
    albedoMap.colorSpace = THREE.SRGBColorSpace;
    emissiveMap.colorSpace = THREE.SRGBColorSpace;
    normalMap.colorSpace = THREE.NoColorSpace;
    roughnessMap.colorSpace = THREE.NoColorSpace;
  }, [albedoMap, normalMap, roughnessMap, emissiveMap]);

  return (
    <mesh name="Earth_Globe" rotation={[0, -Math.PI / 2, 0]}>
      <sphereGeometry args={[EARTH_RADIUS, 64, 48]} />
      <meshStandardMaterial
        map={albedoMap}
        normalMap={normalMap}
        normalScale={new THREE.Vector2(0.7, 0.7)}
        roughnessMap={roughnessMap}
        roughness={1.0}
        metalness={0.05}
        emissiveMap={emissiveMap}
        emissive="#ffffff"
        emissiveIntensity={0.65}
      />
    </mesh>
  );
}

function ProceduralEarthFallback({ texture }: { texture: THREE.CanvasTexture }) {
  return (
    <mesh name="Earth_Globe" rotation={[0, -Math.PI / 2, 0]}>
      <sphereGeometry args={[EARTH_RADIUS, 64, 48]} />
      <meshStandardMaterial map={texture} roughness={0.78} metalness={0.05} />
    </mesh>
  );
}


function buildPolarVortexGeometry(): THREE.BufferGeometry {
  const nAzim = 72;
  const nProf = 18;
  const basisPos: number[] = [];
  const w2Pos: number[] = [];
  const w1Pos: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const phase2 = THREE.MathUtils.degToRad(20);
  const russiaLonRad = THREE.MathUtils.degToRad(82);
  const tangentRussia = new THREE.Vector3(Math.sin(russiaLonRad), 0, Math.cos(russiaLonRad)).normalize();
  const pushDir = geoToThree(45, 82, 1).normalize();

  for (let j = 0; j <= nProf; j++) {
    const vNorm = j / nProf;
    const latDeg = 56 + 27 * vNorm;
    const bell = Math.sin(Math.PI * vNorm);
    const rLayer = 2.48 + 0.1 * bell;

    for (let i = 0; i <= nAzim; i++) {
      const uNorm = i / nAzim;
      const lonDeg = -180 + 360 * uNorm;
      const lonRad = THREE.MathUtils.degToRad(lonDeg);
      const ripple = 0.012 * bell * Math.sin(6 * lonRad + 4 * vNorm);
      const baseR = rLayer + ripple;

      const p0 = geoToThree(latDeg, lonDeg, baseR);
      basisPos.push(p0.x, p0.y, p0.z);
      uvs.push(uNorm, vNorm);

      const w2 = Math.cos(2 * (lonRad - phase2));
      const colat = 90 - latDeg;
      const scaleColat = w2 > 0 ? 1 + 0.42 * w2 : 1 + 0.62 * w2;
      const newLat = THREE.MathUtils.clamp(90 - colat * Math.max(0.28, scaleColat), 38, 88.5);
      const rDelta = 0.03 * -w2 * bell;
      const pW2 = geoToThree(newLat, lonDeg, baseR + rDelta);
      w2Pos.push(pW2.x, pW2.y, pW2.z);

      const shifted = p0.clone().addScaledVector(tangentRussia, 1.02).addScaledVector(pushDir, 0.08);
      shifted.normalize().multiplyScalar(baseR + 0.04 * bell);
      w1Pos.push(shifted.x, shifted.y, shifted.z);
    }
  }

  const stride = nAzim + 1;
  for (let j = 0; j < nProf; j++) {
    for (let i = 0; i < nAzim; i++) {
      const a = j * stride + i;
      const b = j * stride + (i + 1);
      const c = (j + 1) * stride + (i + 1);
      const d = (j + 1) * stride + i;
      indices.push(a, b, c, a, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(basisPos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();

  geo.morphAttributes.position = [
    new THREE.Float32BufferAttribute(w2Pos, 3),
    new THREE.Float32BufferAttribute(w1Pos, 3),
  ];
  return geo;
}

function buildAtmosphereSliceGeometry(): THREE.BufferGeometry {
  const nLat = 48;
  const nAlt = 24;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let j = 0; j <= nAlt; j++) {
    const vNorm = j / nAlt;
    const radius = 2.02 + 0.56 * vNorm;
    for (let i = 0; i <= nLat; i++) {
      const uNorm = i / nLat;
      const latDeg = 36 + 52 * uNorm;
      const p = geoToThree(latDeg, -2.0, radius);
      positions.push(p.x, p.y, p.z);
      uvs.push(uNorm, vNorm);
    }
  }

  const stride = nLat + 1;
  for (let j = 0; j < nAlt; j++) {
    for (let i = 0; i < nLat; i++) {
      const a = j * stride + i;
      const b = j * stride + (i + 1);
      const c = (j + 1) * stride + (i + 1);
      const d = (j + 1) * stride + i;
      indices.push(a, b, c, a, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

function buildBlockingDomeGeometry(): THREE.BufferGeometry {
  const nAzim = 48;
  const nRing = 14;
  const centerDir = geoToThree(61.0, 13.0, 1).normalize();
  const ref = new THREE.Vector3(0, 1, 0);
  const t1 = new THREE.Vector3().crossVectors(ref, centerDir).normalize();
  const t2 = new THREE.Vector3().crossVectors(centerDir, t1).normalize();

  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let j = 0; j <= nRing; j++) {
    const vNorm = j / nRing;
    const radialFrac = 1 - vNorm;
    const ang = THREE.MathUtils.degToRad(16.0 * radialFrac);
    const domeHeight = 0.22 * Math.pow(Math.cos(0.5 * Math.PI * radialFrac), 1.4);
    const r = EARTH_RADIUS + 0.015 + domeHeight;

    for (let i = 0; i <= nAzim; i++) {
      const uNorm = i / nAzim;
      const phi = 2 * Math.PI * uNorm;
      const radialDir = t1.clone().multiplyScalar(Math.cos(phi)).addScaledVector(t2, Math.sin(phi));
      const p = centerDir
        .clone()
        .multiplyScalar(Math.cos(ang))
        .addScaledVector(radialDir, Math.sin(ang))
        .normalize()
        .multiplyScalar(r);
      positions.push(p.x, p.y, p.z);
      uvs.push(uNorm, vNorm);
    }
  }

  const stride = nAzim + 1;
  for (let j = 0; j < nRing; j++) {
    for (let i = 0; i < nAzim; i++) {
      const a = j * stride + i;
      const b = j * stride + (i + 1);
      const c = (j + 1) * stride + (i + 1);
      const d = (j + 1) * stride + i;
      indices.push(a, b, c, a, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

export function ProceduralAtmosphere({
  scrollProgress,
  snapshot,
  onAnchorsResolved,
}: ProceduralAtmosphereProps) {
  const vortexMeshRef = useRef<THREE.Mesh>(null);

  const fallbackTex = useMemo(() => createProceduralEarthTexture(), []);
  const vortexTex = useMemo(() => createVortexTexture(), []);
  const visTarget = useMemo(() => liveVisualTargets(snapshot), [snapshot]);
  const vis = useRef<LiveVisuals | null>(null);

  const vortexGeo = useMemo(() => buildPolarVortexGeometry(), []);
  const sliceGeo = useMemo(() => buildAtmosphereSliceGeometry(), []);
  const domeGeo = useMemo(() => buildBlockingDomeGeometry(), []);

  const sliceMat = useMemo(() => createAtmosphereSliceMaterial(), []);
  const domeMat = useMemo(() => createBlockingDomeMaterial(), []);

  useEffect(() => {
    onAnchorsResolved?.(DEFAULT_ANCHOR_POSITIONS);
  }, [onAnchorsResolved]);

  useEffect(() => {
    return () => {
      fallbackTex.dispose();
      vortexTex.dispose();
      vortexGeo.dispose();
      sliceGeo.dispose();
      domeGeo.dispose();
      sliceMat.dispose();
      domeMat.dispose();
    };
  }, [fallbackTex, vortexTex, vortexGeo, sliceGeo, domeGeo, sliceMat, domeMat]);

  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    const p = THREE.MathUtils.clamp(scrollProgress, 0, 1);

    if (!vis.current) vis.current = { ...visTarget };
    easeVisuals(vis.current, visTarget, dt);
    if (vortexMeshRef.current) {
      if (!vortexMeshRef.current.morphTargetInfluences) {
        vortexMeshRef.current.morphTargetInfluences = [0, 0];
      }
      const w = vortexMorphWeights(p, vis.current, snapshot.waves);
      vortexMeshRef.current.morphTargetInfluences[0] = w.wave2;
      vortexMeshRef.current.morphTargetInfluences[1] = w.wave1;
      vortexTex.offset.x -= dt * 0.22 * vis.current.spin;
      applyVortexMaterial(vortexMeshRef.current.material as THREE.MeshStandardMaterial, p, vis.current);
    }

    sliceMat.uniforms.uTime.value += dt;
    const sliceFadeIn = THREE.MathUtils.smoothstep(p, 0.54, 0.64);
    const sliceFadeOut = 1 - THREE.MathUtils.smoothstep(p, 0.78, 0.88);
    sliceMat.uniforms.uOpacity.value = Math.max(0.06, sliceFadeIn * sliceFadeOut);
    sliceMat.uniforms.uDrippingProgress.value = THREE.MathUtils.clamp((p - 0.56) / 0.22, 0.15, 1.0);
    sliceMat.uniforms.uReversedStrength.value = snapshot.stratosphere60N.isReversed ? 1.0 : 0.35;

    domeMat.uniforms.uTime.value += dt;
    const dome = domeUniformValues(p, vis.current);
    domeMat.uniforms.uOpacity.value = dome.opacity;
    domeMat.uniforms.uHeight.value = dome.height;
  });

  return (
    <group>
      <Suspense fallback={<ProceduralEarthFallback texture={fallbackTex} />}>
        <ProceduralEarthPBR />
      </Suspense>

      <LiveJetRibbon snapshot={snapshot} scrollProgress={scrollProgress} />

      <mesh ref={vortexMeshRef} name="PolarVortex_Mesh" geometry={vortexGeo}>
        <meshStandardMaterial
          map={vortexTex}
          emissiveMap={vortexTex}
          emissive="#6366f1"
          emissiveIntensity={0.85}
          color="#818cf8"
          roughness={0.45}
          transparent
          opacity={0.8}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      <mesh name="Atmosphere_Slice" geometry={sliceGeo} material={sliceMat} />
      <mesh name="BlockingHigh_Dome" geometry={domeGeo} material={domeMat} />
    </group>
  );
}
