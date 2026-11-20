import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { AtmosphereSnapshot } from '../types/weather';
import {
  ANCHOR_NAMES,
  DEFAULT_ANCHOR_POSITIONS,
  type AnchorName,
} from './cameraWaypoints';
import {
  createAtmosphereSliceMaterial,
  createBlockingDomeMaterial,
  createJetStreamTexture,
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

interface BlenderAtmosphereProps {
  scrollProgress: number;
  snapshot: AtmosphereSnapshot;
  onAnchorsResolved?: (anchors: Record<AnchorName, THREE.Vector3>) => void;
}

export function BlenderAtmosphere({
  scrollProgress,
  snapshot,
  onAnchorsResolved,
}: BlenderAtmosphereProps) {
  const gltf = useGLTF('/models/atmosphere.glb');

  const sceneClone = useMemo(() => gltf.scene.clone(true), [gltf.scene]);
  const jetTexture = useMemo(() => createJetStreamTexture(), []);
  const vortexTexture = useMemo(() => createVortexTexture(), []);
  const sliceMaterial = useMemo(() => createAtmosphereSliceMaterial(), []);
  const domeMaterial = useMemo(() => createBlockingDomeMaterial(), []);
  const visTarget = useMemo(() => liveVisualTargets(snapshot), [snapshot]);
  const vis = useRef<LiveVisuals | null>(null);

  const nodesMap = useMemo(() => {
    const meshes: Record<string, THREE.Mesh> = {};
    const anchors: Partial<Record<AnchorName, THREE.Vector3>> = {};

    sceneClone.updateMatrixWorld(true);
    sceneClone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        meshes[child.name] = child as THREE.Mesh;
      }
      if ((ANCHOR_NAMES as readonly string[]).includes(child.name)) {
        const wp = new THREE.Vector3();
        child.getWorldPosition(wp);
        anchors[child.name as AnchorName] = wp;
      }
    });

    const resolvedAnchors = { ...DEFAULT_ANCHOR_POSITIONS };
    for (const key of ANCHOR_NAMES) {
      if (anchors[key]) {
        resolvedAnchors[key] = anchors[key]!;
      }
    }
    return { meshes, resolvedAnchors };
  }, [sceneClone]);

  useEffect(() => {
    onAnchorsResolved?.(nodesMap.resolvedAnchors);
  }, [nodesMap, onAnchorsResolved]);

  useEffect(() => {
    const { meshes } = nodesMap;

    const jetMesh = meshes['JetStream_Ribbon'];
    if (jetMesh) {
      jetMesh.material = new THREE.MeshBasicMaterial({
        map: jetTexture,
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      });
    }

    const vortexMesh = meshes['PolarVortex_Mesh'];
    if (vortexMesh) {
      // Standard material preserves glTF morph targets cleanly while scrolling texture
      vortexMesh.material = new THREE.MeshStandardMaterial({
        map: vortexTexture,
        emissiveMap: vortexTexture,
        emissive: new THREE.Color('#6366f1'),
        emissiveIntensity: 0.85,
        color: new THREE.Color('#818cf8'),
        roughness: 0.45,
        transparent: true,
        opacity: 0.78,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
    }

    const sliceMesh = meshes['Atmosphere_Slice'];
    if (sliceMesh) {
      sliceMesh.material = sliceMaterial;
    }

    const domeMesh = meshes['BlockingHigh_Dome'];
    if (domeMesh) {
      domeMesh.material = domeMaterial;
    }
  }, [nodesMap, jetTexture, vortexTexture, sliceMaterial, domeMaterial]);

  useEffect(() => {
    return () => {
      jetTexture.dispose();
      vortexTexture.dispose();
      sliceMaterial.dispose();
      domeMaterial.dispose();
    };
  }, [jetTexture, vortexTexture, sliceMaterial, domeMaterial]);

  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    const p = THREE.MathUtils.clamp(scrollProgress, 0, 1);

    // 1. Jet Stream flowing speed driven by live 250 hPa jet velocity
    const jetSpeedNorm = THREE.MathUtils.clamp(snapshot.ukSurface.jetSpeed250HpaMs / 45, 0.35, 1.8);
    jetTexture.offset.x -= dt * 0.42 * jetSpeedNorm;

    const jetMesh = nodesMap.meshes['JetStream_Ribbon'];
    if (jetMesh && jetMesh.material instanceof THREE.MeshBasicMaterial) {
      // Emphasize jet stream in Beat 1 and Beat 5
      const beat1Vis = 1 - THREE.MathUtils.smoothstep(p, 0.16, 0.30);
      const beat5Vis = THREE.MathUtils.smoothstep(p, 0.78, 0.90);
      jetMesh.material.opacity = 0.24 + 0.72 * Math.max(beat1Vis, beat5Vis);
    }

    // 2. Polar vortex: resting shape, spin, colour and glow follow the selected data;
    //    the beat 3 squeeze-and-shove animation plays on top.
    if (!vis.current) vis.current = { ...visTarget };
    easeVisuals(vis.current, visTarget, dt);
    const vortexMesh = nodesMap.meshes['PolarVortex_Mesh'];
    if (vortexMesh && vortexMesh.morphTargetInfluences && vortexMesh.morphTargetDictionary) {
      const idxW2 = vortexMesh.morphTargetDictionary['Wave2_Pinch'];
      const idxW1 = vortexMesh.morphTargetDictionary['Wave1_Displaced'];
      const w = vortexMorphWeights(p, vis.current, snapshot.waves);
      if (idxW2 !== undefined) vortexMesh.morphTargetInfluences[idxW2] = w.wave2;
      if (idxW1 !== undefined) vortexMesh.morphTargetInfluences[idxW1] = w.wave1;

      vortexTexture.offset.x -= dt * 0.22 * vis.current.spin;
      if (vortexMesh.material instanceof THREE.MeshStandardMaterial) {
        applyVortexMaterial(vortexMesh.material, p, vis.current);
      }
    }

    // 3. Atmosphere_Slice dripping anomalies shader
    sliceMaterial.uniforms.uTime.value += dt;
    const sliceFadeIn = THREE.MathUtils.smoothstep(p, 0.54, 0.64);
    const sliceFadeOut = 1 - THREE.MathUtils.smoothstep(p, 0.78, 0.88);
    sliceMaterial.uniforms.uOpacity.value = Math.max(0.06, sliceFadeIn * sliceFadeOut);
    sliceMaterial.uniforms.uDrippingProgress.value = THREE.MathUtils.clamp((p - 0.56) / 0.22, 0.15, 1.0);
    sliceMaterial.uniforms.uReversedStrength.value = snapshot.stratosphere60N.isReversed ? 1.0 : 0.35;

    // 4. Blocking dome: grows and brightens with pressure over Scandinavia in beat 5
    domeMaterial.uniforms.uTime.value += dt;
    const dome = domeUniformValues(p, vis.current);
    domeMaterial.uniforms.uOpacity.value = dome.opacity;
    domeMaterial.uniforms.uHeight.value = dome.height;
  });

  return <primitive object={sceneClone} />;
}

useGLTF.preload('/models/atmosphere.glb');

