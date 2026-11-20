#!/usr/bin/env python3
"""
Blender 5.3 headless build script for the SSW & Polar Vortex scrollytelling scene.

Produces:
  - blender/atmosphere.blend
  - public/models/atmosphere.glb (glTF binary with morph targets + anchor empties)
  - blender/preview_blender.png  (verification render)

Strict Blender-to-Web Asset Contract:
  Meshes:
    - Earth_Globe
    - JetStream_Ribbon
    - PolarVortex_Mesh      (Shape Keys: Basis, Wave2_Pinch, Wave1_Displaced)
    - Atmosphere_Slice
    - BlockingHigh_Dome
  Empties:
    - Anchor_UK_Surface
    - Anchor_JetStream
    - Anchor_Shetland_60N
    - Anchor_Vortex_Core
    - Anchor_Vertical_Slice
    - Anchor_Scandi_High
"""

import math
from pathlib import Path
import bpy
import bmesh
from mathutils import Vector

PROJECT_ROOT = Path(__file__).resolve().parent.parent
TEX_PATH = PROJECT_ROOT / "blender" / "textures" / "earth_albedo.png"
BLEND_OUT = PROJECT_ROOT / "blender" / "atmosphere.blend"
GLB_OUT = PROJECT_ROOT / "public" / "models" / "atmosphere.glb"
PREVIEW_OUT = PROJECT_ROOT / "blender" / "preview_blender.png"

EARTH_RADIUS = 2.0


def geo_to_blender(lat_deg: float, lon_deg: float, radius: float) -> Vector:
    """
    Convert geographic coords to Blender Z-up Cartesian coords.
    With glTF export_yup=True:
      (X_b, Y_b, Z_b) -> (X_b, Z_b, -Y_b) in Three.js
    so Prime Meridian (lon=0) faces -Y in Blender (+Z toward viewer in Three.js)
    and +lon (East / Scandinavia / Russia) goes toward +X.
    """
    lat = math.radians(lat_deg)
    lon = math.radians(lon_deg)
    x = radius * math.cos(lat) * math.sin(lon)
    y = -radius * math.cos(lat) * math.cos(lon)
    z = radius * math.sin(lat)
    return Vector((x, y, z))


def clear_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.unit_settings.system = "METRIC"
    return scene


def make_collection(name: str, scene: bpy.types.Scene):
    col = bpy.data.collections.new(name)
    scene.collection.children.link(col)
    return col


def link_obj(obj: bpy.types.Object, col: bpy.types.Collection):
    for c in list(obj.users_collection):
        c.objects.unlink(obj)
    col.objects.link(obj)


def smooth_mesh_faces(mesh: bpy.types.Mesh):
    for poly in mesh.polygons:
        poly.use_smooth = True


def build_earth_globe(col: bpy.types.Collection) -> bpy.types.Object:
    """
    Build Earth_Globe directly as an explicit lon/lat grid with duplicate
    anti-meridian seam vertices so equirectangular UVs never tear at lon=+-180.
    """
    n_lon = 96
    n_lat = 48

    mesh = bpy.data.meshes.new("Earth_Globe_Mesh")
    bm = bmesh.new()
    uv_layer = bm.loops.layers.uv.new("UVMap")

    grid = []
    for j in range(n_lat + 1):
        v_norm = j / n_lat
        lat_deg = -90.0 + 180.0 * v_norm
        row = []
        for i in range(n_lon + 1):
            u_norm = i / n_lon
            lon_deg = -180.0 + 360.0 * u_norm
            pos = geo_to_blender(lat_deg, lon_deg, EARTH_RADIUS)
            vert = bm.verts.new(pos)
            row.append((vert, u_norm, v_norm))
        grid.append(row)

    bm.verts.ensure_lookup_table()

    for j in range(n_lat):
        for i in range(n_lon):
            v00, u00, w00 = grid[j][i]
            v10, u10, w10 = grid[j][i + 1]
            v11, u11, w11 = grid[j + 1][i + 1]
            v01, u01, w01 = grid[j + 1][i]

            if j == 0:
                # South pole fan
                face = bm.faces.new((v00, v11, v01))
                face.loops[0][uv_layer].uv = (0.5 * (u00 + u10), w00)
                face.loops[1][uv_layer].uv = (u11, w11)
                face.loops[2][uv_layer].uv = (u01, w01)
            elif j == n_lat - 1:
                # North pole fan
                face = bm.faces.new((v00, v10, v01))
                face.loops[0][uv_layer].uv = (u00, w00)
                face.loops[1][uv_layer].uv = (u10, w10)
                face.loops[2][uv_layer].uv = (0.5 * (u00 + u10), w01)
            else:
                face = bm.faces.new((v00, v10, v11, v01))
                face.loops[0][uv_layer].uv = (u00, w00)
                face.loops[1][uv_layer].uv = (u10, w10)
                face.loops[2][uv_layer].uv = (u11, w11)
                face.loops[3][uv_layer].uv = (u01, w01)

    bm.normal_update()
    bm.to_mesh(mesh)
    bm.free()

    smooth_mesh_faces(mesh)

    mat = bpy.data.materials.new("Mat_Earth_Globe")
    if not mat.use_nodes:
        mat.use_nodes = True
    nt = mat.node_tree
    bsdf = nt.nodes.get("Principled BSDF")
    bsdf.inputs["Specular IOR Level"].default_value = 0.45

    tex_dir = PROJECT_ROOT / "blender" / "textures"
    albedo_path = tex_dir / "earth_albedo.png"
    rough_path = tex_dir / "earth_roughness.png"
    normal_path = tex_dir / "earth_normal.png"
    emissive_path = tex_dir / "earth_emissive.png"

    if albedo_path.exists():
        img = bpy.data.images.load(str(albedo_path), check_existing=True)
        img.colorspace_settings.name = "sRGB"
        tex_node = nt.nodes.new("ShaderNodeTexImage")
        tex_node.image = img
        tex_node.extension = "REPEAT"
        nt.links.new(tex_node.outputs["Color"], bsdf.inputs["Base Color"])
    else:
        bsdf.inputs["Base Color"].default_value = (0.04, 0.08, 0.14, 1.0)

    if rough_path.exists():
        r_img = bpy.data.images.load(str(rough_path), check_existing=True)
        r_img.colorspace_settings.name = "Non-Color"
        r_node = nt.nodes.new("ShaderNodeTexImage")
        r_node.image = r_img
        r_node.extension = "REPEAT"
        nt.links.new(r_node.outputs["Color"], bsdf.inputs["Roughness"])
    else:
        bsdf.inputs["Roughness"].default_value = 0.78

    if normal_path.exists():
        n_img = bpy.data.images.load(str(normal_path), check_existing=True)
        n_img.colorspace_settings.name = "Non-Color"
        n_tex = nt.nodes.new("ShaderNodeTexImage")
        n_tex.image = n_img
        n_tex.extension = "REPEAT"
        n_map = nt.nodes.new("ShaderNodeNormalMap")
        n_map.inputs["Strength"].default_value = 0.7
        nt.links.new(n_tex.outputs["Color"], n_map.inputs["Color"])
        nt.links.new(n_map.outputs["Normal"], bsdf.inputs["Normal"])

    if emissive_path.exists():
        e_img = bpy.data.images.load(str(emissive_path), check_existing=True)
        e_img.colorspace_settings.name = "sRGB"
        e_tex = nt.nodes.new("ShaderNodeTexImage")
        e_tex.image = e_img
        e_tex.extension = "REPEAT"
        nt.links.new(e_tex.outputs["Color"], bsdf.inputs["Emission Color"])
        bsdf.inputs["Emission Strength"].default_value = 0.65

    mesh.materials.append(mat)
    obj = bpy.data.objects.new("Earth_Globe", mesh)
    link_obj(obj, col)
    return obj


def build_jet_stream_ribbon(col: bpy.types.Collection) -> bpy.types.Object:
    """
    Build a smooth undulating jet-stream ribbon running from US East Coast
    across the North Atlantic, south of UK/Ireland, into Central Europe.
    UV.x runs along flow direction [0..1]; UV.y spans ribbon width [0..1].
    """
    n_along = 96
    n_across = 4
    jet_radius = EARTH_RADIUS + 0.095  # ~250 hPa tropospheric top

    def centerline_lonlat(t: float) -> tuple[float, float]:
        lon = -72.0 + 116.0 * t  # -72°W -> +44°E
        # Rossby meander: south trough over Atlantic/UK (~46°N), crest over Europe (~54°N)
        lat = (
            48.5
            - 4.2 * math.sin(2.0 * math.pi * (t - 0.15))
            - 2.6 * math.cos(3.0 * math.pi * (t - 0.35))
        )
        return lon, lat

    mesh = bpy.data.meshes.new("JetStream_Ribbon_Mesh")
    bm = bmesh.new()
    uv_layer = bm.loops.layers.uv.new("UVMap")

    rows = []
    for i in range(n_along + 1):
        t = i / n_along
        lon, lat = centerline_lonlat(t)
        p_center = geo_to_blender(lat, lon, jet_radius)
        t_next = min(1.0, t + 0.01)
        lon2, lat2 = centerline_lonlat(t_next)
        p_next = geo_to_blender(lat2, lon2, jet_radius)
        tangent = p_next - p_center
        if tangent.length < 1e-6:
            lon0, lat0 = centerline_lonlat(max(0.0, t - 0.01))
            tangent = p_center - geo_to_blender(lat0, lon0, jet_radius)
        tangent.normalize()
        up = p_center.normalized()
        side = up.cross(tangent).normalized()

        # Taper ends cleanly
        taper = math.sin(math.pi * t) ** 0.35
        half_width = 0.075 * taper
        arch = 0.018 * taper

        row = []
        for j in range(n_across + 1):
            v = j / n_across
            s_off = (v - 0.5) * 2.0  # [-1..1]
            crown = arch * (1.0 - s_off * s_off)
            pos = p_center + side * (s_off * half_width) + up * crown
            vert = bm.verts.new(pos)
            row.append((vert, t * 3.0, v))
        rows.append(row)

    for i in range(n_along):
        for j in range(n_across):
            v00, u00, w00 = rows[i][j]
            v10, u10, w10 = rows[i + 1][j]
            v11, u11, w11 = rows[i + 1][j + 1]
            v01, u01, w01 = rows[i][j + 1]
            face = bm.faces.new((v00, v10, v11, v01))
            face.loops[0][uv_layer].uv = (u00, w00)
            face.loops[1][uv_layer].uv = (u10, w10)
            face.loops[2][uv_layer].uv = (u11, w11)
            face.loops[3][uv_layer].uv = (u01, w01)

    bm.normal_update()
    bm.to_mesh(mesh)
    bm.free()
    smooth_mesh_faces(mesh)

    mat = bpy.data.materials.new("Mat_JetStream")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (0.22, 0.78, 0.98, 1.0)
    bsdf.inputs["Emission Color"].default_value = (0.18, 0.72, 0.96, 1.0)
    bsdf.inputs["Emission Strength"].default_value = 2.0
    bsdf.inputs["Alpha"].default_value = 0.85
    mesh.materials.append(mat)

    obj = bpy.data.objects.new("JetStream_Ribbon", mesh)
    link_obj(obj, col)
    return obj


def build_polar_vortex(col: bpy.types.Collection) -> bpy.types.Object:
    """
    Build PolarVortex_Mesh at ~10 hPa stratospheric altitude (~30 km -> R=2.52).
    Includes explicit Shape Keys (NO modifiers attached so export_apply=False preserves
    exact morph targets in GLB):
      - Basis
      - Wave2_Pinch
      - Wave1_Displaced
    """
    n_azim = 72
    n_prof = 18

    # Base annulus spanning collar lat 55°N..84°N at 10 hPa radius + vertical skirt ridge
    mesh = bpy.data.meshes.new("PolarVortex_Mesh_Data")
    bm = bmesh.new()
    uv_layer = bm.loops.layers.uv.new("UVMap")

    # Store per-vertex parametric coords (lon_rad, lat_deg, radial_t, base_r) for exact shape keys
    vert_params: list[tuple[float, float, float, float]] = []
    grid = []

    for j in range(n_prof + 1):
        v_norm = j / n_prof  # 0 outer skirt (56°N) -> 1 inner core (83°N)
        lat_deg = 56.0 + 27.0 * v_norm
        # Raised donut crown peaking mid-ring around 66°N (core westerly jet max)
        bell = math.sin(math.pi * v_norm)
        r_layer = 2.48 + 0.10 * bell
        row = []
        for i in range(n_azim + 1):
            u_norm = i / n_azim
            lon_deg = -180.0 + 360.0 * u_norm
            lon_rad = math.radians(lon_deg)
            # Subtle helical swirl ripple on basis so circulation feels alive
            ripple = 0.012 * bell * math.sin(6.0 * lon_rad + 4.0 * v_norm)
            pos = geo_to_blender(lat_deg, lon_deg, r_layer + ripple)
            vert = bm.verts.new(pos)
            vert_params.append((lon_rad, lat_deg, v_norm, r_layer + ripple))
            row.append((vert, u_norm, v_norm))
        grid.append(row)

    for j in range(n_prof):
        for i in range(n_azim):
            v00, u00, w00 = grid[j][i]
            v10, u10, w10 = grid[j][i + 1]
            v11, u11, w11 = grid[j + 1][i + 1]
            v01, u01, w01 = grid[j + 1][i]
            face = bm.faces.new((v00, v10, v11, v01))
            face.loops[0][uv_layer].uv = (u00, w00)
            face.loops[1][uv_layer].uv = (u10, w10)
            face.loops[2][uv_layer].uv = (u11, w11)
            face.loops[3][uv_layer].uv = (u01, w01)

    bm.normal_update()
    bm.to_mesh(mesh)
    bm.free()
    smooth_mesh_faces(mesh)

    mat = bpy.data.materials.new("Mat_PolarVortex")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (0.38, 0.34, 0.92, 1.0)
    bsdf.inputs["Emission Color"].default_value = (0.30, 0.50, 0.98, 1.0)
    bsdf.inputs["Emission Strength"].default_value = 1.6
    bsdf.inputs["Alpha"].default_value = 0.72
    mesh.materials.append(mat)

    obj = bpy.data.objects.new("PolarVortex_Mesh", mesh)
    link_obj(obj, col)

    # Create Basis Shape Key
    sk_basis = obj.shape_key_add(name="Basis", from_mix=False)
    sk_basis.interpolation = "KEY_LINEAR"

    # Shape Key 1: Wave2_Pinch — two opposing planetary waves pinch into dumbbell
    sk_wave2 = obj.shape_key_add(name="Wave2_Pinch", from_mix=False)
    sk_wave2.interpolation = "KEY_LINEAR"
    sk_wave2.value = 0.0
    phase2 = math.radians(20.0)
    for idx, (lon_rad, lat_deg, v_norm, base_r) in enumerate(vert_params):
        # cos(2*(lon-phase2)) > 0 stretches equatorward (lower lat); < 0 pinches toward pole
        w2 = math.cos(2.0 * (lon_rad - phase2))
        colat = 90.0 - lat_deg
        # Squeeze waist to narrow neck, flare two lobes outward
        scale_colat = 1.0 + 0.42 * w2 if w2 > 0 else 1.0 + 0.62 * w2
        new_lat = max(38.0, min(88.5, 90.0 - colat * max(0.28, scale_colat)))
        # Slight vertical warming bulge at pinched waist
        r_delta = 0.03 * (-w2) * math.sin(math.pi * v_norm)
        sk_wave2.data[idx].co = geo_to_blender(new_lat, math.degrees(lon_rad), base_r + r_delta)

    # Shape Key 2: Wave1_Displaced — strong Wave 1 pushes vortex off North Pole toward Russia (+82°E)
    sk_wave1 = obj.shape_key_add(name="Wave1_Displaced", from_mix=False)
    sk_wave1.interpolation = "KEY_LINEAR"
    sk_wave1.value = 0.0
    push_dir = geo_to_blender(45.0, 82.0, 1.0).normalized()
    # Shift direction on polar tangent plane toward Russia/Siberia (lon ~ 82°E)
    tangent_russia = Vector((math.sin(math.radians(82.0)), -math.cos(math.radians(82.0)), 0.0)).normalized()
    for idx, (lon_rad, lat_deg, v_norm, base_r) in enumerate(vert_params):
        basis_pos = geo_to_blender(lat_deg, math.degrees(lon_rad), base_r)
        # Shift off-pole by ~1.05 units toward Russia while wrapping cleanly onto stratospheric shell
        shifted = basis_pos + tangent_russia * 1.02 + push_dir * 0.08
        # Slight asymmetric compression on Pacific side
        r_target = base_r + 0.04 * math.sin(math.pi * v_norm)
        sk_wave1.data[idx].co = shifted.normalized() * r_target

    return obj


def build_atmosphere_slice(col: bpy.types.Collection) -> bpy.types.Object:
    """
    Build Atmosphere_Slice: a curved vertical cross-section curtain rising from
    1000 hPa (R = 2.02) to 10 hPa (R = 2.58) along the UK/Shetland meridian (lon = -2°W),
    spanning latitude 36°N to 88°N.
    UV.x = latitude progress [0..1], UV.y = altitude progress [0 = 1000 hPa .. 1 = 10 hPa].
    """
    n_lat = 48
    n_alt = 24
    slice_lon = -2.0

    mesh = bpy.data.meshes.new("Atmosphere_Slice_Mesh")
    bm = bmesh.new()
    uv_layer = bm.loops.layers.uv.new("UVMap")

    grid = []
    for j in range(n_alt + 1):
        v_norm = j / n_alt  # 0 = 1000 hPa surface, 1 = 10 hPa (~30 km)
        radius = 2.02 + 0.56 * v_norm
        row = []
        for i in range(n_lat + 1):
            u_norm = i / n_lat
            lat_deg = 36.0 + 52.0 * u_norm
            pos = geo_to_blender(lat_deg, slice_lon, radius)
            vert = bm.verts.new(pos)
            row.append((vert, u_norm, v_norm))
        grid.append(row)

    for j in range(n_alt):
        for i in range(n_lat):
            v00, u00, w00 = grid[j][i]
            v10, u10, w10 = grid[j][i + 1]
            v11, u11, w11 = grid[j + 1][i + 1]
            v01, u01, w01 = grid[j + 1][i]
            face = bm.faces.new((v00, v10, v11, v01))
            face.loops[0][uv_layer].uv = (u00, w00)
            face.loops[1][uv_layer].uv = (u10, w10)
            face.loops[2][uv_layer].uv = (u11, w11)
            face.loops[3][uv_layer].uv = (u01, w01)

    bm.normal_update()
    bm.to_mesh(mesh)
    bm.free()
    smooth_mesh_faces(mesh)

    mat = bpy.data.materials.new("Mat_Atmosphere_Slice")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (0.14, 0.55, 0.92, 1.0)
    bsdf.inputs["Emission Color"].default_value = (0.12, 0.45, 0.90, 1.0)
    bsdf.inputs["Emission Strength"].default_value = 0.8
    bsdf.inputs["Alpha"].default_value = 0.55
    mesh.materials.append(mat)

    obj = bpy.data.objects.new("Atmosphere_Slice", mesh)
    link_obj(obj, col)
    return obj


def build_blocking_high_dome(col: bpy.types.Collection) -> bpy.types.Object:
    """
    Build BlockingHigh_Dome centered over Scandinavia (61.0°N, 13.0°E).
    UV.y = 0 at rim -> 1 at dome apex.
    """
    center_lat = 61.0
    center_lon = 13.0
    n_azim = 48
    n_ring = 14
    max_angular_deg = 16.0  # spans Scandinavia + North Sea fringe

    center_dir = geo_to_blender(center_lat, center_lon, 1.0).normalized()
    ref = Vector((0.0, 0.0, 1.0)) if abs(center_dir.z) < 0.95 else Vector((1.0, 0.0, 0.0))
    t1 = ref.cross(center_dir).normalized()
    t2 = center_dir.cross(t1).normalized()

    mesh = bpy.data.meshes.new("BlockingHigh_Dome_Mesh")
    bm = bmesh.new()
    uv_layer = bm.loops.layers.uv.new("UVMap")

    rings = []
    for j in range(n_ring + 1):
        v_norm = j / n_ring  # 0 = rim at Earth surface, 1 = apex
        radial_frac = 1.0 - v_norm
        ang = math.radians(max_angular_deg * radial_frac)
        # Smooth cosine dome lift above Earth surface
        dome_height = 0.22 * (math.cos(0.5 * math.pi * radial_frac) ** 1.4)
        r = EARTH_RADIUS + 0.015 + dome_height
        row = []
        for i in range(n_azim + 1):
            u_norm = i / n_azim
            phi = 2.0 * math.pi * u_norm
            radial_dir = t1 * math.cos(phi) + t2 * math.sin(phi)
            surf_dir = (center_dir * math.cos(ang) + radial_dir * math.sin(ang)).normalized()
            vert = bm.verts.new(surf_dir * r)
            row.append((vert, u_norm, v_norm))
        rings.append(row)

    for j in range(n_ring):
        for i in range(n_azim):
            v00, u00, w00 = rings[j][i]
            v10, u10, w10 = rings[j][i + 1]
            v11, u11, w11 = rings[j + 1][i + 1]
            v01, u01, w01 = rings[j + 1][i]
            face = bm.faces.new((v00, v10, v11, v01))
            face.loops[0][uv_layer].uv = (u00, w00)
            face.loops[1][uv_layer].uv = (u10, w10)
            face.loops[2][uv_layer].uv = (u11, w11)
            face.loops[3][uv_layer].uv = (u01, w01)

    bm.normal_update()
    bm.to_mesh(mesh)
    bm.free()
    smooth_mesh_faces(mesh)

    mat = bpy.data.materials.new("Mat_BlockingHigh")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (0.98, 0.62, 0.16, 1.0)
    bsdf.inputs["Emission Color"].default_value = (0.96, 0.56, 0.12, 1.0)
    bsdf.inputs["Emission Strength"].default_value = 1.2
    bsdf.inputs["Alpha"].default_value = 0.5
    mesh.materials.append(mat)

    obj = bpy.data.objects.new("BlockingHigh_Dome", mesh)
    link_obj(obj, col)
    return obj


def build_anchors(col: bpy.types.Collection) -> list[bpy.types.Object]:
    specs = [
        ("Anchor_UK_Surface", 56.8, -4.7, 2.05),
        ("Anchor_JetStream", 48.5, -18.0, 2.13),
        ("Anchor_Shetland_60N", 60.2, -1.2, 2.53),
        ("Anchor_Vortex_Core", 78.0, 45.0, 2.56),
        ("Anchor_Vertical_Slice", 62.0, -2.0, 2.29),
        ("Anchor_Scandi_High", 61.0, 13.0, 2.24),
    ]
    created = []
    for name, lat, lon, r in specs:
        emp = bpy.data.objects.new(name, None)
        emp.empty_display_type = "PLAIN_AXES"
        emp.empty_display_size = 0.12
        emp.location = geo_to_blender(lat, lon, r)
        link_obj(emp, col)
        created.append(emp)
    return created


def setup_preview_lighting_and_camera(scene: bpy.types.Scene, col: bpy.types.Collection):
    world = bpy.data.worlds.new("SSW_World")
    scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    bg.inputs["Color"].default_value = (0.015, 0.024, 0.045, 1.0)
    bg.inputs["Strength"].default_value = 1.0

    key_data = bpy.data.lights.new("Key_Sun", type="SUN")
    key_data.energy = 3.2
    key_data.color = (0.94, 0.97, 1.0)
    key_obj = bpy.data.objects.new("Key_Sun", key_data)
    key_obj.rotation_euler = (math.radians(48), math.radians(-18), math.radians(-30))
    link_obj(key_obj, col)

    rim_data = bpy.data.lights.new("Rim_Light", type="AREA")
    rim_data.energy = 420.0
    rim_data.size = 6.0
    rim_data.color = (0.35, 0.72, 1.0)
    rim_obj = bpy.data.objects.new("Rim_Light", rim_data)
    rim_obj.location = (3.5, 4.0, 3.8)
    direction = Vector((0, 0, 1.4)) - rim_obj.location
    rim_obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    link_obj(rim_obj, col)

    cam_data = bpy.data.cameras.new("Preview_Cam")
    cam_data.lens = 42.0
    cam_obj = bpy.data.objects.new("Preview_Cam", cam_data)
    cam_obj.location = (-2.2, -3.4, 3.4)
    look = Vector((0.1, 0.0, 1.75)) - cam_obj.location
    cam_obj.rotation_euler = look.to_track_quat("-Z", "Y").to_euler()
    link_obj(cam_obj, col)
    scene.camera = cam_obj


def main():
    scene = clear_scene()
    col_geo = make_collection("SSW_Atmosphere", scene)
    col_anc = make_collection("SSW_Anchors", scene)
    col_cam = make_collection("SSW_Lighting", scene)

    earth = build_earth_globe(col_geo)
    jet = build_jet_stream_ribbon(col_geo)
    vortex = build_polar_vortex(col_geo)
    slice_obj = build_atmosphere_slice(col_geo)
    dome = build_blocking_high_dome(col_geo)
    anchors = build_anchors(col_anc)
    setup_preview_lighting_and_camera(scene, col_cam)

    # Pose Wave2 slightly in preview render? Actually leave Basis=0 in BLEND/GLB export,
    # render preview with Wave2=0.55 then reset to 0 before exporting GLB/BLEND!
    vortex.data.shape_keys.key_blocks["Wave2_Pinch"].value = 0.55

    scene.render.engine = "BLENDER_EEVEE"

    scene.render.resolution_x = 1280
    scene.render.resolution_y = 720
    scene.render.filepath = str(PREVIEW_OUT)
    bpy.ops.render.render(write_still=True)

    # Reset shape keys to 0.0 before saving & exporting
    for kb in vortex.data.shape_keys.key_blocks:
        kb.value = 0.0

    # Pack Earth texture so .blend is self-contained
    bpy.ops.file.pack_all()
    BLEND_OUT.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_OUT))

    # Select only SSW_Atmosphere + SSW_Anchors for clean GLB export
    bpy.ops.object.select_all(action="DESELECT")
    for o in [earth, jet, vortex, slice_obj, dome, *anchors]:
        o.select_set(True)
    bpy.context.view_layer.objects.active = earth

    GLB_OUT.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=str(GLB_OUT),
        export_format="GLB",
        use_selection=True,
        export_yup=True,
        export_apply=False,
        export_morph=True,
        export_morph_normal=True,
        export_materials="EXPORT",
        export_extras=True,
    )
    print(f"Saved blend: {BLEND_OUT}")
    print(f"Exported GLB: {GLB_OUT}")


if __name__ == "__main__":
    main()
