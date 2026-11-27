#!/usr/bin/env python3
"""
Automated Blender Python (bpy + bmesh) Tile Kit Generator & Isometric Renderer
for Activity 1: Urban Heat City Designer.

Usage (inside headless Blender or services/tinker-bpy container):
  blender --background --python scripts/build_urban_heat_tiles.py -- \
    --export-glb --render-previews --engine EEVEE

Dry-run manifest check (standard python3, no Blender required):
  python3 scripts/build_urban_heat_tiles.py --dry-run
"""
from __future__ import annotations

import argparse
import json
import math
import sys
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parent.parent
TINKER_APP_DIR = REPO_ROOT / "services" / "tinker-bpy"
if str(TINKER_APP_DIR) not in sys.path:
    sys.path.insert(0, str(TINKER_APP_DIR))

try:
    import bpy  # type: ignore
    import bmesh  # type: ignore
    from mathutils import Euler, Vector  # type: ignore
    HAS_BPY = True
except ImportError:
    bpy = None  # type: ignore
    bmesh = None  # type: ignore
    HAS_BPY = False

try:
    from app.bmesh_ops import clear_scene as tinker_clear_scene  # type: ignore
    from app.bmesh_ops import purge_orphans as tinker_purge_orphans  # type: ignore
except Exception:
    tinker_clear_scene = None
    tinker_purge_orphans = None

TILE_SIZE = 1.0
TILE_GAP = 0.04
TILE_STEP = TILE_SIZE + TILE_GAP

# Cohesive low-poly palette matching urbanHeat3DConstants.js
PALETTE: dict[str, tuple[float, float, float, float]] = {
    "asphalt": (0.176, 0.192, 0.220, 1.0),
    "cool_road": (0.722, 0.769, 0.816, 1.0),
    "road_mark": (0.945, 0.961, 0.976, 1.0),
    "plaza": (0.620, 0.592, 0.557, 1.0),
    "sail_blue": (0.055, 0.647, 0.914, 1.0),
    "sail_post": (0.796, 0.835, 0.882, 1.0),
    "dry_grass": (0.725, 0.576, 0.353, 1.0),
    "park_grass": (0.204, 0.780, 0.349, 1.0),
    "forest_floor": (0.180, 0.490, 0.196, 1.0),
    "tree_canopy": (0.082, 0.502, 0.239, 1.0),
    "street_canopy": (0.302, 0.486, 0.059, 1.0),
    "trunk": (0.471, 0.286, 0.165, 1.0),
    "water": (0.008, 0.518, 0.780, 1.0),
    "wall": (0.906, 0.875, 0.835, 1.0),
    "dark_roof": (0.361, 0.137, 0.137, 1.0),
    "cool_roof": (0.945, 0.961, 0.976, 1.0),
    "green_roof": (0.396, 0.639, 0.051, 1.0),
    "tower_wall": (0.796, 0.835, 0.882, 1.0),
    "tower_roof": (0.200, 0.255, 0.333, 1.0),
    "focus_amber": (0.992, 0.878, 0.278, 1.0),
    "plinth": (0.118, 0.161, 0.231, 1.0),
}

TILE_CODES = ["R", "C", "E", "P", "S", "G", "K", "T", "W", "B", "L", "V", "H"]

SCENARIOS: dict[str, dict[str, Any]] = {
    "city-heart": {
        "rows": [
            "BBHBBHBB",
            "RRRRRRRR",
            "BPBBHBPB",
            "BBPBBBBG",
            "RRRRRRRR",
            "BBBPPBBH",
        ],
        "focus": list(range(8, 16)),
    },
    "riverside": {
        "rows": [
            "GGGGGGGG",
            "GGGGGGGG",
            "RRRRRRRR",
            "GGGGGGGG",
            "GGGGGGGG",
            "GGTTGGGG",
        ],
        "focus": list(range(16, 24)),
    },
    "school-zone": {
        "rows": [
            "RRRRRRRR",
            "BBPPPPBB",
            "BBPPPPGG",
            "PPPPGGGG",
            "PPPPGGGG",
            "RRRRRRRR",
        ],
        "focus": [10, 11, 12, 13, 18, 19, 20, 21],
    },
}


def reset_scene() -> None:
    if not HAS_BPY:
        return
    if tinker_clear_scene is not None:
        tinker_clear_scene()
        return
    for obj in list(bpy.data.objects):
        bpy.data.objects.remove(obj, do_unlink=True)
    bpy.data.orphans_purge(do_local_ids=True, do_linked_ids=True, do_recursive=True)


def get_material(name: str, roughness: float = 0.75, metallic: float = 0.05) -> Any:
    mat_id = f"uh_mat_{name}"
    existing = bpy.data.materials.get(mat_id)
    if existing:
        return existing
    mat = bpy.data.materials.new(name=mat_id)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = PALETTE.get(name, (0.5, 0.5, 0.5, 1.0))
        bsdf.inputs["Roughness"].default_value = roughness
        bsdf.inputs["Metallic"].default_value = metallic
    return mat


def _add_box(name: str, size: tuple[float, float, float], loc: tuple[float, float, float], mat_key: str, parent: Any, bevel: float = 0.015) -> Any:
    mesh = bpy.data.meshes.new(name)
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=size, verts=bm.verts)
    if bevel > 0 and min(size) > bevel * 2.5:
        bmesh.ops.bevel(bm, geom=bm.edges[:], offset=bevel, segments=1, affect="EDGES")
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(mesh)
    bm.free()

    obj = bpy.data.objects.new(name, mesh)
    obj.location = loc
    obj.parent = parent
    obj.data.materials.append(get_material(mat_key))
    bpy.context.scene.collection.objects.link(obj)
    return obj


def _add_tree(name: str, loc: tuple[float, float, float], scale: float, canopy_key: str, parent: Any) -> None:
    # Tapered trunk
    mesh_t = bpy.data.meshes.new(f"{name}_trunk")
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=6, radius1=0.055 * scale, radius2=0.035 * scale, depth=0.30 * scale)
    bm.to_mesh(mesh_t)
    bm.free()
    trunk = bpy.data.objects.new(f"{name}_trunk", mesh_t)
    trunk.location = (loc[0], loc[1], loc[2] + 0.15 * scale)
    trunk.parent = parent
    trunk.data.materials.append(get_material("trunk", roughness=0.95))
    bpy.context.scene.collection.objects.link(trunk)

    # Low-poly icosphere canopy
    mesh_c = bpy.data.meshes.new(f"{name}_canopy")
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=1, radius=0.22 * scale)
    bm.to_mesh(mesh_c)
    bm.free()
    canopy = bpy.data.objects.new(f"{name}_canopy", mesh_c)
    canopy.location = (loc[0], loc[1], loc[2] + 0.38 * scale)
    canopy.parent = parent
    canopy.data.materials.append(get_material(canopy_key, roughness=0.88))
    bpy.context.scene.collection.objects.link(canopy)


def build_tile(code: str, origin: tuple[float, float, float] = (0.0, 0.0, 0.0), suffix: str = "") -> Any:
    """Build one modular 1.0m x 1.0m tile (Z-up in Blender, converted to Y-up on glTF export)."""
    root = bpy.data.objects.new(f"tile_{code}{suffix}", None)
    root.location = origin
    bpy.context.scene.collection.objects.link(root)

    base_mat_map = {
        "R": "asphalt", "C": "cool_road", "E": "asphalt",
        "P": "plaza", "S": "plaza", "G": "dry_grass",
        "K": "park_grass", "T": "forest_floor", "W": "water",
        "B": "plaza", "L": "plaza", "V": "plaza", "H": "plaza",
    }
    slab_h = 0.05 if code == "W" else 0.10
    _add_box(f"{code}_base{suffix}", (TILE_SIZE, TILE_SIZE, slab_h), (0, 0, slab_h / 2), base_mat_map[code], root, bevel=0.012)

    if code in ("R", "C", "E"):
        for dx in (-0.24, 0.24):
            _add_box(f"{code}_dash_{dx}{suffix}", (0.24, 0.06, 0.012), (dx, 0, slab_h + 0.006), "road_mark", root, bevel=0.0)

    if code == "E":
        _add_tree(f"{code}_t1{suffix}", (-0.28, -0.34, slab_h), 0.82, "street_canopy", root)
        _add_tree(f"{code}_t2{suffix}", (0.28, 0.34, slab_h), 0.85, "street_canopy", root)
    elif code == "T":
        for idx, (ox, oy, sc) in enumerate([(-0.24, -0.22, 1.05), (0.22, -0.18, 0.92), (-0.18, 0.24, 0.88), (0.24, 0.22, 1.12)]):
            _add_tree(f"{code}_t{idx}{suffix}", (ox, oy, slab_h), sc, "tree_canopy", root)
    elif code == "S":
        for idx, (cx, cy) in enumerate([(-0.36, -0.36), (0.36, -0.36), (-0.36, 0.36), (0.36, 0.36)]):
            _add_box(f"{code}_post{idx}{suffix}", (0.032, 0.032, 0.48), (cx, cy, slab_h + 0.24), "sail_post", root, bevel=0.0)
        sail = _add_box(f"{code}_sail{suffix}", (0.76, 0.76, 0.035), (0, 0, slab_h + 0.48), "sail_blue", root, bevel=0.005)
        sail.rotation_euler = Euler((0.06, -0.05, math.pi / 4), "XYZ")
    elif code in ("B", "L", "V"):
        bh = 0.52
        _add_box(f"{code}_wall{suffix}", (0.72, 0.68, bh), (0, 0, slab_h + bh / 2), "wall", root)
        roof_key = "dark_roof" if code == "B" else "cool_roof" if code == "L" else "green_roof"
        _add_box(f"{code}_roof{suffix}", (0.78, 0.74, 0.10), (0, 0, slab_h + bh + 0.05), roof_key, root)
        if code == "V":
            _add_tree(f"{code}_shrub1{suffix}", (-0.16, 0.0, slab_h + bh + 0.10), 0.42, "green_roof", root)
            _add_tree(f"{code}_shrub2{suffix}", (0.16, 0.05, slab_h + bh + 0.10), 0.38, "green_roof", root)
    elif code == "H":
        th = 1.38
        _add_box(f"{code}_tower{suffix}", (0.74, 0.74, th), (0, 0, slab_h + th / 2), "tower_wall", root)
        _add_box(f"{code}_cap{suffix}", (0.48, 0.48, 0.16), (0, 0, slab_h + th + 0.08), "tower_roof", root)

    return root


def export_tile_kit(out_dir: Path) -> list[str]:
    out_dir.mkdir(parents=True, exist_ok=True)
    exported: list[str] = []

    # Export individual modular tile GLBs (Draco-compressed)
    for code in TILE_CODES:
        reset_scene()
        build_tile(code)
        target = out_dir / f"tile_{code}.glb"
        bpy.ops.export_scene.gltf(
            filepath=str(target),
            export_format="GLB",
            export_draco_mesh_compression_enable=True,
            export_apply=True,
        )
        exported.append(str(target))

    # Export combined kit GLB with all 13 tiles laid out along X
    reset_scene()
    for idx, code in enumerate(TILE_CODES):
        build_tile(code, origin=(idx * 1.5, 0.0, 0.0))
    kit_path = out_dir / "urban_heat_kit.glb"
    bpy.ops.export_scene.gltf(
        filepath=str(kit_path),
        export_format="GLB",
        export_draco_mesh_compression_enable=True,
        export_apply=True,
    )
    exported.append(str(kit_path))
    return exported


def render_scenario_previews(out_dir: Path, engine: str = "EEVEE") -> list[str]:
    out_dir.mkdir(parents=True, exist_ok=True)
    rendered: list[str] = []

    for scenario_id, spec in SCENARIOS.items():
        reset_scene()
        rows = spec["rows"]
        focus_set = set(spec["focus"])

        # Plinth
        plinth_root = bpy.data.objects.new("plinth_root", None)
        bpy.context.scene.collection.objects.link(plinth_root)
        _add_box("plinth", (8 * TILE_STEP + 0.5, 6 * TILE_STEP + 0.5, 0.30), (0, 0, -0.15), "plinth", plinth_root)

        # Build 8x6 district
        for r, row_str in enumerate(rows):
            for c, code in enumerate(row_str):
                idx = r * 8 + c
                x = (c - 3.5) * TILE_STEP
                y = -(r - 2.5) * TILE_STEP
                build_tile(code, origin=(x, y, 0.0), suffix=f"_{idx}")
                if idx in focus_set:
                    _add_box(f"focus_{idx}", (TILE_SIZE * 0.96, TILE_SIZE * 0.96, 0.025), (x, y, 0.115), "focus_amber", plinth_root, bevel=0.0)

        # Isometric orthographic camera
        cam_data = bpy.data.cameras.new("IsoCam")
        cam_data.type = "ORTHO"
        cam_data.ortho_scale = 11.5
        cam = bpy.data.objects.new("IsoCam", cam_data)
        cam.location = (9.5, -9.5, 9.2)
        direction = Vector((0, 0, 0.2)) - cam.location
        cam.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
        bpy.context.scene.collection.objects.link(cam)
        bpy.context.scene.camera = cam

        # Warm Townsville sunlight
        sun_data = bpy.data.lights.new("Sun", type="SUN")
        sun_data.energy = 3.2
        sun_data.color = (1.0, 0.96, 0.90)
        sun = bpy.data.objects.new("Sun", sun_data)
        sun.location = (8, -6, 12)
        sun.rotation_euler = Euler((math.radians(38), math.radians(15), math.radians(35)), "XYZ")
        bpy.context.scene.collection.objects.link(sun)

        scene = bpy.context.scene
        scene.render.resolution_x = 960
        scene.render.resolution_y = 600
        scene.render.image_settings.file_format = "WEBP"
        scene.render.image_settings.quality = 88
        if engine.upper() == "CYCLES":
            scene.render.engine = "CYCLES"
            scene.cycles.samples = 48
            scene.cycles.use_denoising = True
        else:
            scene.render.engine = "BLENDER_EEVEE_NEXT"

        out_path = out_dir / f"{scenario_id}.webp"
        scene.render.filepath = str(out_path)
        bpy.ops.render.render(write_still=True)
        rendered.append(str(out_path))

    if tinker_purge_orphans is not None:
        tinker_purge_orphans()
    return rendered


def parse_args(argv: list[str]) -> argparse.Namespace:
    if "--" in argv:
        argv = argv[argv.index("--") + 1 :]
    parser = argparse.ArgumentParser(description="Build Urban Heat 3D tile kit & isometric scenario renders via Blender bpy.")
    parser.add_argument("--export-glb", action="store_true", help="Export Draco-compressed GLB tile kit.")
    parser.add_argument("--render-previews", action="store_true", help="Batch-render isometric scenario WebP previews.")
    parser.add_argument("--engine", choices=["EEVEE", "CYCLES"], default="EEVEE", help="Blender render engine.")
    parser.add_argument("--models-dir", type=Path, default=REPO_ROOT / "public" / "assets" / "models" / "urbanHeat")
    parser.add_argument("--previews-dir", type=Path, default=REPO_ROOT / "public" / "assets" / "previews" / "urbanHeat")
    parser.add_argument("--dry-run", action="store_true", help="Print build manifest without invoking Blender bpy.")
    return parser.parse_args(argv)


def main() -> int:
    args = parse_args(sys.argv[1:])
    manifest = {
        "has_bpy": HAS_BPY,
        "tile_codes": TILE_CODES,
        "scenarios": list(SCENARIOS.keys()),
        "models_dir": str(args.models_dir),
        "previews_dir": str(args.previews_dir),
        "engine": args.engine,
    }

    if args.dry_run:
        print(json.dumps(manifest, indent=2))
        return 0

    if not HAS_BPY:
        print("Error: Blender bpy module not found. Run via `blender --background --python scripts/build_urban_heat_tiles.py -- --export-glb`.", file=sys.stderr)
        return 1

    result: dict[str, Any] = {"exported_glbs": [], "rendered_previews": []}
    if args.export_glb or not args.render_previews:
        result["exported_glbs"] = export_tile_kit(args.models_dir)
    if args.render_previews:
        result["rendered_previews"] = render_scenario_previews(args.previews_dir, engine=args.engine)

    print(json.dumps(result, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
