import { Component, Suspense, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import type { AtmosphereSnapshot, BeatId, ModelSource } from '../types/weather';
import {
  DEFAULT_ANCHOR_POSITIONS,
  EARTH_RADIUS,
  sampleCameraState,
  type AnchorName,
} from './cameraWaypoints';
import { BlenderAtmosphere } from './BlenderAtmosphere';
import { ProceduralAtmosphere } from './ProceduralAtmosphere';
import { createAtmosphereHaloMaterial, createHorizonGlowMaterial } from './materials';
import { TooltipOverlay3D } from '../components/TooltipCards';
import { jetAnchorPosition } from './LiveJetRibbon';

interface SceneErrorBoundaryProps {
  fallback: ReactNode;
  children: ReactNode;
}

interface SceneErrorBoundaryState {
  hasError: boolean;
}

class SceneErrorBoundary extends Component<SceneErrorBoundaryProps, SceneErrorBoundaryState> {
  state: SceneErrorBoundaryState = { hasError: false };
  static getDerivedStateFromError(): SceneErrorBoundaryState {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

interface CameraRigProps {
  scrollProgress: number;
}

function CameraRig({ scrollProgress }: CameraRigProps) {
  const { camera } = useThree();
  const smoothPos = useRef(new THREE.Vector3(-1.15, 2.25, 3.05));
  const smoothTarget = useRef(new THREE.Vector3(-0.32, 1.5, 1.05));

  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    const desired = sampleCameraState(scrollProgress);
    const k = 1 - Math.exp(-6.5 * dt);

    smoothPos.current.lerp(desired.position, k);
    smoothTarget.current.lerp(desired.target, k);

    camera.position.copy(smoothPos.current);
    camera.lookAt(smoothTarget.current);
  });

  return null;
}

function EarthClouds({ scrollProgress }: { scrollProgress: number }) {
  const cloudsRef = useRef<THREE.Mesh>(null);
  const cloudTex = useTexture(`${import.meta.env.BASE_URL}textures/earth_clouds.png`);

  useEffect(() => {
    cloudTex.colorSpace = THREE.SRGBColorSpace;
  }, [cloudTex]);

  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += dt * 0.006;
      const mat = cloudsRef.current.material as THREE.MeshStandardMaterial;
      // Dim gently during Beat 4 meridional cross-section slice so vertical plumes stay crisp
      const beat4Dim = 1 - 0.58 * THREE.MathUtils.smoothstep(scrollProgress, 0.56, 0.78);
      mat.opacity = 0.24 * beat4Dim;
    }
  });

  return (
    <mesh ref={cloudsRef} rotation={[0, -Math.PI / 2, 0]}>
      <sphereGeometry args={[EARTH_RADIUS + 0.018, 64, 48]} />
      <meshStandardMaterial
        map={cloudTex}
        color="#d8eeff"
        transparent
        opacity={0.24}
        depthWrite={false}
        roughness={0.92}
      />
    </mesh>
  );
}

interface AtmosphereSceneProps {
  scrollProgress: number;
  activeBeat: BeatId;
  modelSource: ModelSource;
  snapshot: AtmosphereSnapshot;
  showTooltips?: boolean;
}

export function AtmosphereScene({
  scrollProgress,
  activeBeat,
  modelSource,
  snapshot,
  showTooltips = true,
}: AtmosphereSceneProps) {
  const [anchors, setAnchors] = useState<Record<AnchorName, THREE.Vector3>>(
    DEFAULT_ANCHOR_POSITIONS
  );

  const outerHaloMat = useMemo(() => createAtmosphereHaloMaterial(), []);
  const horizonGlowMat = useMemo(() => createHorizonGlowMaterial(), []);

  useEffect(() => {
    return () => {
      outerHaloMat.dispose();
      horizonGlowMat.dispose();
    };
  }, [outerHaloMat, horizonGlowMat]);

  // The jet ribbon follows the data, so its tooltip anchor does too.
  const tooltipAnchors = useMemo(
    () => ({ ...anchors, Anchor_JetStream: jetAnchorPosition(snapshot) }),
    [anchors, snapshot]
  );

  const handleAnchorsResolved = useCallback((resolved: Record<AnchorName, THREE.Vector3>) => {
    setAnchors(resolved);
  }, []);

  const proceduralEl = (
    <ProceduralAtmosphere
      scrollProgress={scrollProgress}
      snapshot={snapshot}
      onAnchorsResolved={handleAnchorsResolved}
    />
  );

  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [-1.15, 2.25, 3.05], fov: 40, near: 0.1, far: 100 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      >
        <color attach="background" args={['#040914']} />
        <fog attach="fog" args={['#040914', 9.5, 24]} />

        <ambientLight intensity={0.78} color="#c7ddf7" />
        <directionalLight position={[-4.2, 5.4, 5.8]} intensity={2.3} color="#f8fafc" />
        <directionalLight position={[5.2, 3.2, -3.4]} intensity={1.25} color="#38bdf8" />
        <pointLight position={[0, 4.2, 0]} intensity={1.4} color="#818cf8" distance={8} />

        <Stars radius={28} depth={18} count={1800} factor={2.6} saturation={0.2} fade speed={0.4} />

        <CameraRig scrollProgress={scrollProgress} />

        {/* Two-layer GLSL Rayleigh atmospheric limb halo */}
        <mesh material={outerHaloMat}>
          <sphereGeometry args={[EARTH_RADIUS + 0.095, 64, 48]} />
        </mesh>
        <mesh material={horizonGlowMat}>
          <sphereGeometry args={[EARTH_RADIUS + 0.012, 64, 48]} />
        </mesh>

        {/* Slowly drifting translucent cloud layer */}
        <SceneErrorBoundary fallback={null}>
          <Suspense fallback={null}>
            <EarthClouds scrollProgress={scrollProgress} />
          </Suspense>
        </SceneErrorBoundary>

        {modelSource === 'glb' ? (
          <SceneErrorBoundary fallback={proceduralEl}>
            <Suspense fallback={proceduralEl}>
              <BlenderAtmosphere
                scrollProgress={scrollProgress}
                snapshot={snapshot}
                onAnchorsResolved={handleAnchorsResolved}
              />
            </Suspense>
          </SceneErrorBoundary>
        ) : (
          proceduralEl
        )}

        {showTooltips && (
          <TooltipOverlay3D
            activeBeat={activeBeat}
            scrollProgress={scrollProgress}
            anchors={tooltipAnchors}
            snapshot={snapshot}
          />
        )}
      </Canvas>
    </div>
  );
}
