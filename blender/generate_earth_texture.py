#!/usr/bin/env python3
"""
Generate a 5-map Dark Broadcast Satellite PBR texture suite for the SSW & Polar Vortex
Blender + Three.js globe, combining real planetary topography, relief normal map,
specular ocean mask, land-masked city lights, crisp coastal highlights, and 60°N beacon ring.

Outputs (written to BOTH blender/textures/ and public/textures/):
  - earth_albedo.png    (2048x1024 RGB)
  - earth_roughness.png (2048x1024 L)
  - earth_normal.png    (2048x1024 RGB)
  - earth_emissive.png  (2048x1024 RGB)
  - earth_clouds.png    (1024x512  RGBA)
"""

from pathlib import Path
from PIL import Image, ImageChops, ImageDraw, ImageFilter

WIDTH = 2048
HEIGHT = 1024

HERE = Path(__file__).resolve().parent
PROJECT_ROOT = HERE.parent
RAW_DIR = HERE / "textures" / "raw"
BLENDER_TEX_DIR = HERE / "textures"
PUBLIC_TEX_DIR = PROJECT_ROOT / "public" / "textures"


def lonlat_to_px(lon_deg: float, lat_deg: float, w: int = WIDTH, h: int = HEIGHT) -> tuple[float, float]:
    """Convert geographic (lon [-180..180], lat [-90..90]) to PIL pixel coords."""
    x = ((lon_deg + 180.0) / 360.0) * w
    y = ((90.0 - lat_deg) / 180.0) * h
    return (x, y)


FALLBACK_LAND: list[list[tuple[float, float]]] = [
    [(-5.6, 50.1), (1.7, 52.6), (-2.1, 57.5), (-4.9, 58.6), (-6.2, 56.7), (-5.2, 51.7)],
    [(-9.9, 51.5), (-6.0, 53.4), (-6.2, 55.2), (-9.8, 54.1)],
    [(5.0, 59.0), (12.8, 55.5), (18.5, 59.5), (32.5, 69.5), (28.0, 71.1), (11.0, 64.5)],
    [(-9.3, 37.0), (-4.7, 48.4), (10.0, 54.4), (27.8, 59.5), (179.9, 66.5), (129.0, 35.1), (77.5, 8.1), (32.5, 31.3), (-5.5, 36.0)],
    [(-44.0, 60.0), (-70.0, 76.5), (-34.0, 83.4), (-16.0, 81.2), (-24.0, 70.0)],
    [(-168.0, 65.5), (-135.0, 69.5), (-82.0, 66.5), (-55.6, 52.0), (-75.5, 35.5), (-97.2, 26.0), (-124.5, 48.3), (-161.0, 55.5)],
    [(-5.8, 35.8), (32.5, 31.3), (51.2, 11.8), (28.0, -33.0), (18.4, -34.4), (-17.4, 14.7)],
    [(-78.0, 9.0), (-35.0, -6.0), (-67.0, -54.8), (-81.2, -4.5)],
    [(114.0, -22.0), (142.5, -10.8), (153.5, -27.5), (115.2, -34.2)],
]

FALLBACK_CITIES: list[tuple[float, float, float]] = [
    (-0.1, 51.5, 1.0), (-1.9, 52.5, 0.7), (-2.2, 53.5, 0.75), (-3.2, 55.9, 0.7), (-4.2, 55.8, 0.7),
    (-6.2, 53.3, 0.65), (-5.9, 54.6, 0.5), (2.3, 48.8, 1.0), (4.9, 52.3, 0.85), (4.3, 50.8, 0.8),
    (7.0, 51.4, 0.85), (13.4, 52.5, 0.8), (12.5, 55.7, 0.7), (10.7, 59.9, 0.65), (18.0, 59.3, 0.7),
    (24.9, 60.1, 0.65), (21.0, 52.2, 0.75), (37.6, 55.7, 1.0), (30.3, 59.9, 0.8), (-21.9, 64.1, 0.45),
    (-3.7, 40.4, 0.85), (12.5, 41.9, 0.85), (29.0, 41.0, 0.85), (-74.0, 40.7, 1.0), (-79.4, 43.6, 0.85),
    (-87.6, 41.9, 0.9), (-118.2, 34.0, 0.9), (139.7, 35.7, 1.0), (121.5, 31.2, 0.95), (116.4, 39.9, 0.95),
]


def draw_meteorological_overlays(base_rgb: Image.Image) -> Image.Image:
    """Add subtle 30-degree graticule, highlighted 60°N Shetland ring, and UK beacon."""
    grid_layer = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    draw = ImageDraw.Draw(grid_layer)

    for lon in range(-180, 181, 30):
        x, _ = lonlat_to_px(lon, 0)
        color = (96, 165, 220, 42) if lon == 0 else (72, 120, 162, 22)
        draw.line([(x, 0), (x, HEIGHT)], fill=color, width=1)

    for lat in range(-60, 90, 30):
        _, y = lonlat_to_px(0, lat)
        if lat == 60:
            for x0 in range(0, WIDTH, 18):
                draw.line([(x0, y), (min(WIDTH, x0 + 10), y)], fill=(56, 189, 248, 165), width=2)
        elif lat == 0:
            draw.line([(0, y), (WIDTH, y)], fill=(96, 165, 220, 38), width=1)
        else:
            draw.line([(0, y), (WIDTH, y)], fill=(72, 120, 162, 22), width=1)

    # Shetland 60°N beacon + Scottish Highlands surface beacon
    sx, sy = lonlat_to_px(-1.2, 60.2)
    draw.ellipse([sx - 6, sy - 6, sx + 6, sy + 6], outline=(56, 189, 248, 225), width=2)
    ux, uy = lonlat_to_px(-4.7, 56.8)
    draw.ellipse([ux - 5, uy - 5, ux + 5, uy + 5], outline=(245, 158, 11, 220), width=2)

    return Image.alpha_composite(base_rgb.convert("RGBA"), grid_layer).convert("RGB")


def save_both(img: Image.Image, filename: str, **save_kwargs) -> None:
    BLENDER_TEX_DIR.mkdir(parents=True, exist_ok=True)
    PUBLIC_TEX_DIR.mkdir(parents=True, exist_ok=True)
    img.save(BLENDER_TEX_DIR / filename, format="PNG", **save_kwargs)
    img.save(PUBLIC_TEX_DIR / filename, format="PNG", **save_kwargs)


def build_pbr_suite() -> None:
    atmos_raw = RAW_DIR / "earth_atmos_2048.jpg"
    spec_raw = RAW_DIR / "earth_specular_2048.jpg"
    norm_raw = RAW_DIR / "earth_normal_2048.jpg"
    lights_raw = RAW_DIR / "earth_lights_2048.png"
    clouds_raw = RAW_DIR / "earth_clouds_1024.png"

    has_satellite = atmos_raw.exists() and spec_raw.exists()

    if has_satellite:
        atmos_img = Image.open(atmos_raw).convert("RGB").resize((WIDTH, HEIGHT), Image.Resampling.BILINEAR)
        spec_gray = Image.open(spec_raw).convert("L").resize((WIDTH, HEIGHT), Image.Resampling.BILINEAR)
        # ocean = 255, land = 0
        ocean_bin = spec_gray.point(lambda p: 255 if p > 128 else 0)
        land_bin = ImageChops.invert(ocean_bin)
        land_mask = land_bin.filter(ImageFilter.GaussianBlur(radius=0.8))

        # Grade oceans into deep midnight broadcast navy while retaining shelf bathymetry
        ar, ag, ab = atmos_img.split()
        dark_ocean = Image.merge(
            "RGB",
            (
                ar.point(lambda p: int(6 + 0.14 * p)),
                ag.point(lambda p: int(16 + 0.27 * p)),
                ab.point(lambda p: int(34 + 0.45 * p)),
            ),
        )

        # Grade land into cool charcoal-slate relief retaining topographic character
        sat_lum = atmos_img.convert("L").convert("RGB")
        land_desat = Image.blend(atmos_img, sat_lum, 0.48)
        lr, lg, lb = land_desat.split()
        dark_land = Image.merge(
            "RGB",
            (
                lr.point(lambda p: int(18 + 0.40 * p)),
                lg.point(lambda p: int(26 + 0.46 * p)),
                lb.point(lambda p: int(36 + 0.50 * p)),
            ),
        )

        base_rgb = Image.composite(dark_land, dark_ocean, land_mask)

        # Crisp pixel-accurate coastal contour highlight along land/ocean boundary
        coast_edges = ImageChops.subtract(land_bin.filter(ImageFilter.MaxFilter(3)), land_bin)
        coast_rgba = Image.new("RGBA", (WIDTH, HEIGHT), (92, 168, 214, 255))
        coast_rgba.putalpha(coast_edges.point(lambda p: int(p * 0.58)))
        albedo_with_coast = Image.alpha_composite(base_rgb.convert("RGBA"), coast_rgba).convert("RGB")
    else:
        # Offline fallback if raw satellite files are absent
        land_bin = Image.new("L", (WIDTH, HEIGHT), 0)
        d = ImageDraw.Draw(land_bin)
        for poly in FALLBACK_LAND:
            d.polygon([lonlat_to_px(lon, lat) for lon, lat in poly], fill=255)
        spec_gray = ImageChops.invert(land_bin)
        dark_ocean = Image.new("RGB", (WIDTH, HEIGHT), (10, 21, 38))
        dark_land = Image.new("RGB", (WIDTH, HEIGHT), (32, 52, 70))
        albedo_with_coast = Image.composite(dark_land, dark_ocean, land_bin)

    albedo_final = draw_meteorological_overlays(albedo_with_coast)
    save_both(albedo_final, "earth_albedo.png", optimize=True)

    # 2. Roughness map: ocean ~80 (0.31 glossy water), land ~224 (0.88 matte terrain)
    rough_l = spec_gray.point(lambda p: int(224 - (p / 255.0) * 144))
    save_both(rough_l, "earth_roughness.png", optimize=True)

    # 3. Normal map
    if norm_raw.exists():
        norm_img = Image.open(norm_raw).convert("RGB").resize((WIDTH, HEIGHT), Image.Resampling.BILINEAR)
    else:
        norm_img = Image.new("RGB", (WIDTH, HEIGHT), (128, 128, 255))
    save_both(norm_img, "earth_normal.png", optimize=True)

    # 4. Night city lights emissive map (strictly masked to land, warm amber #ffc670)
    if lights_raw.exists() and has_satellite:
        lights_src = Image.open(lights_raw).convert("L").resize((WIDTH, HEIGHT), Image.Resampling.BILINEAR)
        # Suppress ambient floor (~50-65) so only genuine urban clusters glow
        lights_clean = lights_src.point(
            lambda p: 0 if p < 78 else min(255, int(((p - 78) / 177.0) ** 1.15 * 255))
        )
        lights_masked = ImageChops.multiply(lights_clean, land_bin)
    else:
        lights_masked = Image.new("L", (WIDTH, HEIGHT), 0)
        dc = ImageDraw.Draw(lights_masked)
        for lon, lat, weight in FALLBACK_CITIES:
            cx, cy = lonlat_to_px(lon, lat)
            r = 4 + weight * 6
            dc.ellipse([cx - r, cy - r, cx + r, cy + r], fill=int(210 * weight))
        lights_masked = ImageChops.multiply(
            lights_masked.filter(ImageFilter.GaussianBlur(radius=3)),
            land_bin,
        )

    em_img = Image.merge(
        "RGB",
        (
            lights_masked,
            lights_masked.point(lambda p: int(p * 0.78)),
            lights_masked.point(lambda p: int(p * 0.42)),
        ),
    )
    save_both(em_img, "earth_emissive.png", optimize=True)

    # 5. Translucent drifting cloud map (1024x512 RGBA)
    if clouds_raw.exists():
        c_src = Image.open(clouds_raw)
        if c_src.mode in ("RGBA", "LA") or "transparency" in c_src.info:
            c_rgba = c_src.convert("RGBA").resize((1024, 512), Image.Resampling.BILINEAR)
            cloud_alpha = c_rgba.getchannel("A")
        else:
            cloud_alpha = c_src.convert("L").resize((1024, 512), Image.Resampling.BILINEAR)
        clouds_img = Image.new("RGBA", (1024, 512), (235, 246, 255, 255))
        clouds_img.putalpha(cloud_alpha)
    else:
        clouds_img = Image.new("RGBA", (1024, 512), (235, 246, 255, 0))
    save_both(clouds_img, "earth_clouds.png", optimize=True)

    print(f"Generated 5-map Earth PBR suite -> {BLENDER_TEX_DIR} & {PUBLIC_TEX_DIR}")


if __name__ == "__main__":
    build_pbr_suite()
