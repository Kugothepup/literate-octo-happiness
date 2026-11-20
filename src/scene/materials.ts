import * as THREE from 'three';

/**
 * Create a seamlessly tileable horizontal streak CanvasTexture for JetStream_Ribbon.
 */
export function createJetStreamTexture(): THREE.CanvasTexture {
  const width = 512;
  const height = 128;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, width, height);

  const gradY = ctx.createLinearGradient(0, 0, 0, height);
  gradY.addColorStop(0.0, 'rgba(56, 189, 248, 0.0)');
  gradY.addColorStop(0.25, 'rgba(56, 189, 248, 0.35)');
  gradY.addColorStop(0.5, 'rgba(186, 230, 253, 0.92)');
  gradY.addColorStop(0.75, 'rgba(56, 189, 248, 0.35)');
  gradY.addColorStop(1.0, 'rgba(56, 189, 248, 0.0)');
  ctx.fillStyle = gradY;
  ctx.fillRect(0, 0, width, height);

  const streaks = [
    { x: 20, y: 42, w: 120, h: 6, a: 0.75 },
    { x: 180, y: 60, w: 170, h: 8, a: 0.95 },
    { x: 370, y: 48, w: 130, h: 5, a: 0.7 },
    { x: 90, y: 78, w: 145, h: 6, a: 0.82 },
    { x: 280, y: 74, w: 155, h: 7, a: 0.85 },
  ];
  for (const s of streaks) {
    for (const offset of [0, width, -width]) {
      const g = ctx.createLinearGradient(s.x + offset, 0, s.x + offset + s.w, 0);
      g.addColorStop(0, 'rgba(255, 255, 255, 0)');
      g.addColorStop(0.65, `rgba(224, 242, 254, ${s.a})`);
      g.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(s.x + offset, s.y, s.w, s.h);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Create a seamlessly tileable swirling filament texture for PolarVortex_Mesh.
 * Using MeshStandardMaterial + CanvasTexture preserves native glTF morph targets.
 */
export function createVortexTexture(): THREE.CanvasTexture {
  const width = 512;
  const height = 256;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, width, height);

  const band = ctx.createLinearGradient(0, 0, 0, height);
  band.addColorStop(0.0, 'rgba(56, 189, 248, 0.0)');
  band.addColorStop(0.22, 'rgba(99, 102, 241, 0.45)');
  band.addColorStop(0.55, 'rgba(129, 140, 248, 0.88)');
  band.addColorStop(0.82, 'rgba(167, 139, 250, 0.65)');
  band.addColorStop(1.0, 'rgba(192, 132, 252, 0.0)');
  ctx.fillStyle = band;
  ctx.fillRect(0, 0, width, height);

  for (let i = 0; i < 18; i++) {
    const y0 = 26 + ((i * 19) % 190);
    const x0 = (i * 53) % width;
    const w = 110 + ((i * 29) % 120);
    for (const off of [0, width, -width]) {
      const g = ctx.createLinearGradient(x0 + off, y0, x0 + off + w, y0 + 18);
      g.addColorStop(0, 'rgba(196, 181, 253, 0)');
      g.addColorStop(0.5, 'rgba(224, 231, 255, 0.72)');
      g.addColorStop(1, 'rgba(196, 181, 253, 0)');
      ctx.strokeStyle = g;
      ctx.lineWidth = 3 + (i % 3);
      ctx.beginPath();
      ctx.moveTo(x0 + off, y0);
      ctx.lineTo(x0 + off + w, y0 + 16);
      ctx.stroke();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Outer Rayleigh atmospheric scattering limb halo (BackSide sphere R=2.095).
 * Peaks smoothly right at Earth's R=2.0 silhouette and fades cleanly into deep space.
 */
export function createAtmosphereHaloMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      varying vec3 vNormalView;
      varying vec3 vViewPos;
      void main() {
        vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
        vViewPos = -mvPos.xyz;
        vNormalView = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec3 vNormalView;
      varying vec3 vViewPos;
      void main() {
        float d = abs(dot(normalize(vNormalView), normalize(vViewPos)));
        float outerFade = smoothstep(0.0, 0.22, d);
        float limbPeak = exp(-pow((d - 0.30) / 0.14, 2.0));
        float intensity = outerFade * limbPeak;
        vec3 deepCobalt = vec3(0.11, 0.31, 0.85);
        vec3 brightCyan = vec3(0.22, 0.74, 0.97);
        vec3 col = mix(deepCobalt, brightCyan, smoothstep(0.14, 0.32, d));
        gl_FragColor = vec4(col, intensity * 0.58);
      }
    `,
  });
}

/**
 * Subtle inner FrontSide Fresnel atmospheric horizon scatter shell (R=2.012).
 */
export function createHorizonGlowMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.FrontSide,
    blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      varying vec3 vNormalView;
      varying vec3 vViewPos;
      void main() {
        vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
        vViewPos = -mvPos.xyz;
        vNormalView = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec3 vNormalView;
      varying vec3 vViewPos;
      void main() {
        float ndv = max(0.0, dot(normalize(vNormalView), normalize(vViewPos)));
        float fresnel = pow(1.0 - ndv, 4.2);
        vec3 col = vec3(0.22, 0.74, 0.97);
        gl_FragColor = vec4(col, fresnel * 0.34);
      }
    `,
  });
}

/**
 * GLSL shader material for Atmosphere_Slice:
 * Visualizes weakened westerly anomalies (cold blue plumes) dripping downward
 * from 10 hPa (vUv.y = 1) down to 1000 hPa (vUv.y = 0).
 */
export function createAtmosphereSliceMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: {
      uTime: { value: 0 },
      uOpacity: { value: 0.25 },
      uDrippingProgress: { value: 0.5 },
      uReversedStrength: { value: 1.0 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uOpacity;
      uniform float uDrippingProgress;
      uniform float uReversedStrength;
      varying vec2 vUv;

      void main() {
        float edgeX = smoothstep(0.0, 0.1, vUv.x) * smoothstep(1.0, 0.9, vUv.x);
        float edgeY = smoothstep(0.0, 0.04, vUv.y) * smoothstep(1.0, 0.96, vUv.y);

        float waveLat = sin(vUv.x * 16.0) * 0.08 + sin(vUv.x * 7.0 + 1.2) * 0.06;
        float dripFront = clamp(1.05 - uDrippingProgress * 1.15 + waveLat, 0.0, 1.05);
        float insideDrip = smoothstep(dripFront - 0.12, dripFront + 0.16, vUv.y);

        float streak1 = sin(vUv.x * 26.0 + vUv.y * 8.0 + uTime * 1.45);
        float streak2 = cos(vUv.x * 14.0 - vUv.y * 12.0 - uTime * 0.95);
        float plume = clamp(0.5 + 0.3 * streak1 + 0.2 * streak2, 0.0, 1.0);

        float hpaGrid = smoothstep(0.92, 0.98, abs(sin(vUv.y * 3.14159 * 4.0)));

        vec3 deepNavy = vec3(0.05, 0.16, 0.36);
        vec3 anomalyBlue = vec3(0.12, 0.65, 0.98);
        vec3 reversedViolet = mix(vec3(0.35, 0.50, 0.95), vec3(0.96, 0.45, 0.28), smoothstep(0.76, 1.0, vUv.y) * uReversedStrength);

        vec3 col = mix(deepNavy, anomalyBlue, insideDrip * (0.55 + 0.45 * plume));
        col = mix(col, reversedViolet, smoothstep(0.68, 0.98, vUv.y) * 0.72);
        col += vec3(0.55, 0.85, 1.0) * hpaGrid * 0.18;

        float alpha = edgeX * edgeY * (0.22 + 0.62 * insideDrip * (0.65 + 0.35 * plume)) * uOpacity;
        gl_FragColor = vec4(col, alpha);
      }
    `,
  });
}

/**
 * GLSL shader material for BlockingHigh_Dome:
 * Warm amber/gold anticyclone dome with Fresnel rim glow and concentric isobar rings.
 */
export function createBlockingDomeMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: {
      uTime: { value: 0 },
      uOpacity: { value: 0.0 },
      uHeight: { value: 1.0 },
    },
    vertexShader: /* glsl */ `
      uniform float uHeight;
      varying vec2 vUv;
      varying vec3 vNormalView;
      varying vec3 vViewPos;
      void main() {
        vUv = uv;
        // Dome vertices sit around the globe centre; base radius is Earth (2.0) + 0.015.
        float r = length(position);
        float baseR = 2.015;
        vec3 p = position / max(r, 1e-4) * (baseR + max(r - baseR, 0.0) * uHeight);
        vec4 mvPos = modelViewMatrix * vec4(p, 1.0);
        vViewPos = -mvPos.xyz;
        vNormalView = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uOpacity;
      varying vec2 vUv;
      varying vec3 vNormalView;
      varying vec3 vViewPos;

      void main() {
        vec3 V = normalize(vViewPos);
        vec3 N = normalize(vNormalView);
        float fresnel = pow(1.0 - abs(dot(N, V)), 2.1);

        float rings = smoothstep(0.84, 0.98, sin(vUv.y * 28.0 - uTime * 1.4) * 0.5 + 0.5);
        float rimFade = smoothstep(0.0, 0.16, vUv.y);

        vec3 baseAmber = vec3(0.96, 0.54, 0.14);
        vec3 coreGold = vec3(1.0, 0.82, 0.42);
        vec3 col = mix(baseAmber, coreGold, clamp(fresnel * 0.75 + rings * 0.45, 0.0, 1.0));

        float alpha = rimFade * (0.18 + 0.52 * fresnel + 0.25 * rings) * uOpacity;
        gl_FragColor = vec4(col, alpha);
      }
    `,
  });
}

/**
 * Lightweight CanvasTexture fallback while PBR PNGs load or if missing.
 */
export function createProceduralEarthTexture(): THREE.CanvasTexture {
  const w = 1024;
  const h = 512;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#0b172a';
  ctx.fillRect(0, 0, w, h);

  const toPx = (lon: number, lat: number): [number, number] => [
    ((lon + 180) / 360) * w,
    ((90 - lat) / 180) * h,
  ];

  const drawPoly = (pts: Array<[number, number]>) => {
    ctx.beginPath();
    pts.forEach(([lon, lat], idx) => {
      const [x, y] = toPx(lon, lat);
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  };

  ctx.fillStyle = '#203446';
  ctx.strokeStyle = '#4c7a9e';
  ctx.lineWidth = 1.4;

  drawPoly([[-5.6, 50.1], [1.6, 51.2], [-2.1, 57.5], [-4.9, 58.6], [-6.2, 56.7], [-5.2, 51.7]]);
  drawPoly([[-9.9, 51.5], [-6.0, 53.4], [-6.2, 55.2], [-9.8, 54.1]]);
  drawPoly([[5, 59], [12.8, 55.5], [18.5, 59.5], [24.5, 65.7], [32.5, 69.5], [28, 71.1], [14, 67.5], [5, 61.5]]);
  drawPoly([[-9.3, 37], [-4.7, 48.4], [10, 54.4], [27.8, 59.5], [30, 46.2], [16, 40], [5, 43.3], [-5.5, 36]]);
  drawPoly([[28, 59.5], [60, 69.5], [104, 77.4], [179.9, 66.5], [156.5, 51], [129, 35], [103.8, 1.3], [77.5, 8.1], [43.5, 12.7], [32.5, 31.3], [28, 41.2]]);
  drawPoly([[-44, 60], [-70, 76.5], [-34, 83.4], [-16, 81.2], [-24, 70]]);
  drawPoly([[-24.2, 65.5], [-13.6, 65.5], [-18.5, 63.4]]);
  drawPoly([[-168, 65.5], [-135, 69.5], [-82, 66.5], [-55.6, 52], [-75.5, 35.5], [-97.2, 26], [-124.5, 48.3], [-161, 55.5]]);
  drawPoly([[-5.8, 35.8], [32.5, 31.3], [51.2, 11.8], [28, -33], [18.4, -34.4], [-17.4, 14.7]]);
  drawPoly([[-78, 9], [-35, -6], [-67, -54.8], [-81.2, -4.5]]);
  drawPoly([[114, -22], [142.5, -10.8], [153.5, -27.5], [115.2, -34.2]]);

  const [, y60] = toPx(0, 60);
  ctx.save();
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.55)';
  ctx.setLineDash([7, 6]);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, y60);
  ctx.lineTo(w, y60);
  ctx.stroke();
  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}
