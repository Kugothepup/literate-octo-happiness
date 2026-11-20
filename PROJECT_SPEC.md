# PROJECT_SPEC.md — Stratosphere Downwards: SSW & Polar Vortex 3D Scrollytelling

## 1. Project Overview
Build an interactive, data-driven 3D scrollytelling web application that explains how a Sudden Stratospheric Warming (SSW) event and polar vortex disruption evolve and influence UK winter weather. The app combines a scroll-choreographed 3D scene (paired between a Blender `.glb` hero asset pipeline and procedural fallback meshes) with live meteorological data and floating contextual tooltips.

## 2. Tech Stack
- **Framework**: Vite + React (TypeScript)
- **3D Engine**: Three.js with `@react-three/fiber` and `@react-three/drei`
- **Scroll & Animation**: Scroll progress choreography (`0.00 -> 1.00`) synced to camera waypoints, shader uniforms, and glTF morph target weights
- **Styling & UI**: Tailwind CSS (HUD, 3D-anchored floating tooltips, vertical altitude/pressure gauge)
- **Charts**: Lightweight custom SVG sparklines & vertical profile charts inside floating tooltips

## 3. Live Data Architecture (Evolving Over Time)
Data service (`src/services/weatherData.ts`) fetches live atmospheric data with a local mock JSON fallback (`src/data/fallbackData.json`) so development and offline viewing work seamlessly.

- **Live API (Open-Meteo — no API key required)**:
  Queries `https://api.open-meteo.com/v1/forecast` with `&wind_speed_unit=ms` for:
  - **Surface & Jet Stream (UK / Scotland, `56.8°N, -4.7°W`)**: `temperature_2m`, `pressure_msl`, `wind_speed_250hPa`, `wind_direction_250hPa`.
  - **Scandinavian Blocking High (`61.0°N, 13.0°E`) & Atlantic Low (`54.0°N, -28.0°W`)**: `pressure_msl`, `temperature_2m` for the surface "battleground" comparison.
  - **Stratospheric Polar Vortex Ring (`60°N` — Shetland latitude)**: Samples 8 evenly spaced longitudes (`-135, -90, -45, 0, 45, 90, 135, 180`) at `latitude=60` for `wind_speed_10hPa`, `wind_direction_10hPa`, `geopotential_height_10hPa`, and `temperature_10hPa`, computing the 10 hPa zonal mean wind ($u$-component) to determine westerly (`+`) vs. easterly/reversed (`-`) state, plus harmonic Wave 1 and Wave 2 amplitudes.
  - **Vertical Coupling Profile (`60°N`)**: Fetches wind speeds & directions across `10hPa`, `20hPa`, `50hPa`, `100hPa`, `250hPa`, `500hPa`, `850hPa`, and `1000hPa` to visualize anomalies feeding downward.
- **Historical Baseline (`src/data/historicalBaseline.json`)**:
  ERA5 (1940s–present) seasonal climatology and Nov 2026 early-season Wave 1 + Wave 2 case study metrics.
- **Caching**: 1-hour `localStorage` cache + instant toggle between **Live Atmosphere** and **Nov 2026 Case Study**.

## 4. Blender-to-Web Asset Contract
Exact naming contract shared between `blender/build_atmosphere.py` (`public/models/atmosphere.glb`), `src/scene/BlenderAtmosphere.tsx`, and `src/scene/ProceduralAtmosphere.tsx`:

- **Meshes**:
  - `Earth_Globe` (Radius `2.0`, equirectangular texture `earth_albedo.png`)
  - `JetStream_Ribbon` (Meandering ~250 hPa ribbon running south of the UK across North Atlantic)
  - `PolarVortex_Mesh` (10 hPa stratospheric collar over North Pole; **must export morph targets**)
  - `Atmosphere_Slice` (Curved vertical cross-section curtain from `1000 hPa` to `10 hPa` near UK/Shetland meridian)
  - `BlockingHigh_Dome` (Surface blocking high-pressure dome centered over Scandinavia)
- **Morph Targets / Shape Keys on `PolarVortex_Mesh`**:
  - `Wave2_Pinch` — Wavenumber-2 squeeze deforming the circular ring into an elongated dumbbell shape
  - `Wave1_Displaced` — Wavenumber-1 push shifting the vortex off the North Pole toward Russia/Siberia
- **Tooltip Anchor Empties**:
  - `Anchor_UK_Surface` (`56.8°N, -4.7°W`)
  - `Anchor_JetStream` (`48.5°N, -18.0°W`)
  - `Anchor_Shetland_60N` (`60.2°N, -1.2°W`, `10 hPa`)
  - `Anchor_Vortex_Core` (`78.0°N, 45.0°E`, `10 hPa`)
  - `Anchor_Vertical_Slice` (`62.0°N, -2.0°W`, mid-atmosphere)
  - `Anchor_Scandi_High` (`61.0°N, 13.0°E`, dome apex)

## 5. 5-Beat Scrollytelling Choreography (`0.00 -> 1.00`)
1. **Beat 1 (`0.00–0.20`) — Surface Setup & Jet Stream**: Low oblique view over the UK & North Atlantic (`1000–250 hPa`). Floating tooltip displays UK surface temp (with context on `-7.7°C` to `-9°C` Scottish cold snaps), MSLP, and 250 hPa jet stream velocity ribbon.
2. **Beat 2 (`0.20–0.40`) — Ascending to 30 km (Polar Vortex)**: Camera pulls vertically up to `10 hPa` over the North Pole (`60°N`). Tooltip explains major SSW threshold (`0 m/s` westerly-to-easterly reversal) with 10 hPa zonal mean wind sparkline.
3. **Beat 3 (`0.40–0.60`) — Planetary Waves 1 & 2**: Tilted orbital perspective. Scroll progress smoothly drives `Wave2_Pinch` dumbbell compression followed by `Wave1_Displaced` displacement toward Russia, paired with ERA5 1940s+ historical wave comparison chart.
4. **Beat 4 (`0.60–0.80`) — Stratosphere-Troposphere "Dripping Down"**: Camera frames `Atmosphere_Slice` side-on (`10 hPa` down to `1000 hPa`). Custom GLSL shader animates weakened westerly anomalies descending over the 2–6 week coupling lag alongside the 8-level vertical wind bar chart.
5. **Beat 5 (`0.80–1.00`) — Surface Payoff (Blocking & Battleground)**: Camera sweeps back down over UK/Scandinavia. `BlockingHigh_Dome` fades in over Scandinavia, diverting the jet stream, paired with the UK / Scandi / Atlantic pressure battleground breakdown.

