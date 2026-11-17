"""
SPARK 3D Printability Analyzer (Blender Python / bpy)
Analyzes 3D meshes for 3D printing compliance according to SPARK PBL standards:
- Manifoldness / watertight geometry
- Bounding box and bed fit (e.g. 220 x 220 mm bed)
- Minimum wall thickness (fragile < 2.0 mm, compliant 2.5 - 3.0 mm)
- Overhang angle analysis (> 45 deg requiring support)
- True volume and PLA filament weight (g)
- Color-coded vertex heatmap export to GLB for SPARK Three.js viewport

Usage (Headless Blender):
  blender -b -P scripts/blender/analyze_print.py -- \
    --input tests/fixtures/3d/car_shell.stl \
    --output-json out/report.json \
    --output-glb out/preview.glb \
    --bed-mm 220 \
    --min-wall 2.0 \
    --max-wall 3.0
"""

import sys
import os
import json
import math
import argparse

try:
    import bpy
    import bmesh
    from mathutils import Vector
    from mathutils.bvhtree import BVHTree
    BLENDER_AVAILABLE = True
except ImportError:
    BLENDER_AVAILABLE = False
    print("Warning: Running outside of Blender environment. BPY not available.")

PLA_DENSITY_G_CM3 = 1.24

def parse_args():
    # Extract arguments passed after '--'
    argv = sys.argv
    if "--" in argv:
        args_to_parse = argv[argv.index("--") + 1:]
    else:
        args_to_parse = argv[1:]

    parser = argparse.ArgumentParser(description="SPARK 3D Printability Analyzer")
    parser.add_argument("--input", required=True, help="Input mesh file (.stl, .obj, .glb)")
    parser.add_argument("--output-json", required=True, help="Output path for JSON report")
    parser.add_argument("--output-glb", default=None, help="Output path for preview GLB with heatmap")
    parser.add_argument("--bed-mm", type=float, default=220.0, help="Print bed size in mm (X and Y)")
    parser.add_argument("--min-wall", type=float, default=2.0, help="Minimum wall thickness in mm")
    parser.add_argument("--max-wall", type=float, default=3.0, help="Target maximum wall thickness in mm")
    parser.add_argument("--overhang-limit-deg", type=float, default=45.0, help="Overhang threshold angle in degrees")
    return parser.parse_args(args_to_parse)

def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def import_model(filepath):
    ext = os.path.splitext(filepath)[1].lower()
    if ext == ".stl":
        if hasattr(bpy.ops.wm, "stl_import"):
            bpy.ops.wm.stl_import(filepath=filepath)
        else:
            bpy.ops.import_mesh.stl(filepath=filepath)
    elif ext == ".obj":
        if hasattr(bpy.ops.wm, "obj_import"):
            bpy.ops.wm.obj_import(filepath=filepath)
        else:
            bpy.ops.import_scene.obj(filepath=filepath)
    elif ext in [".glb", ".gltf"]:
        bpy.ops.import_scene.gltf(filepath=filepath)
    else:
        raise ValueError(f"Unsupported file format: {ext}")

    mesh_objs = [obj for obj in bpy.context.scene.objects if obj.type == 'MESH']
    if not mesh_objs:
        raise RuntimeError("No mesh objects found after import.")
    
    # If multiple objects, join them into a single evaluation mesh
    bpy.context.view_layer.objects.active = mesh_objs[0]
    for obj in mesh_objs:
        obj.select_set(True)
    if len(mesh_objs) > 1:
        bpy.ops.object.join()
    
    return bpy.context.active_object

def analyze_mesh(obj, bed_mm, min_wall_mm, max_wall_mm, overhang_limit_deg):
    mesh = obj.data
    bm = bmesh.new()
    bm.from_mesh(mesh)
    bm.verts.ensure_lookup_table()
    bm.edges.ensure_lookup_table()
    bm.faces.ensure_lookup_table()

    # 1. Bounding box & dimensions (assuming units in mm)
    bbox = [Vector(corner) for corner in obj.bound_box]
    min_x = min(v.x for v in bbox)
    max_x = max(v.x for v in bbox)
    min_y = min(v.y for v in bbox)
    max_y = max(v.y for v in bbox)
    min_z = min(v.z for v in bbox)
    max_z = max(v.z for v in bbox)

    dim_x = round(max_x - min_x, 2)
    dim_y = round(max_y - min_y, 2)
    dim_z = round(max_z - min_z, 2)

    too_wide = dim_y > bed_mm
    too_long = dim_x > bed_mm
    fits_bed = (dim_x <= bed_mm) and (dim_y <= bed_mm)
    parts_needed = max(1, math.ceil(dim_x / bed_mm)) if not too_wide else None

    # 2. Watertight / Manifold checks
    non_manifold_edges = [e for e in bm.edges if not e.is_manifold]
    boundary_edges = [e for e in bm.edges if e.is_boundary]
    is_watertight = (len(non_manifold_edges) == 0) and (len(boundary_edges) == 0)

    # 3. Volume and weight estimation
    volume_mm3 = 0.0
    if is_watertight:
        try:
            volume_mm3 = bm.calc_volume()
        except Exception:
            volume_mm3 = 0.0
    
    volume_cm3 = volume_mm3 / 1000.0
    weight_g = round(volume_cm3 * PLA_DENSITY_G_CM3, 1)

    # 4. Overhang detection (faces whose normal points downward > overhang_limit_deg)
    up_vector = Vector((0.0, 0.0, 1.0))
    limit_rad = math.radians(overhang_limit_deg)
    
    overhang_faces_count = 0
    total_faces_count = len(bm.faces)

    for f in bm.faces:
        angle_from_down = f.normal.angle(Vector((0.0, 0.0, -1.0)))
        if angle_from_down < limit_rad:
            overhang_faces_count += 1

    overhang_pct = round((overhang_faces_count / max(1, total_faces_count)) * 100, 1)

    # 5. Wall thickness sampling (raycast along inward normals via BVH)
    bvh = BVHTree.FromBMesh(bm)
    thin_vertices_count = 0
    sampled_thicknesses = []

    # Create vertex color layer for heatmap visualization in GLB
    color_layer = bm.loops.layers.color.new("PrintHeatmap")

    for f in bm.faces:
        for loop in f.loops:
            v = loop.vert
            # Cast ray opposite to vertex normal
            ray_origin = v.co - (v.normal * 0.01)
            ray_dir = -v.normal
            hit_loc, hit_norm, hit_idx, hit_dist = bvh.ray_cast(ray_origin, ray_dir)
            
            thickness = hit_dist if hit_dist is not None else 10.0
            sampled_thicknesses.append(thickness)

            # Assign vertex color: Red (< min_wall), Yellow (< max_wall), Green (compliant)
            if thickness < min_wall_mm:
                loop[color_layer] = (1.0, 0.1, 0.1, 1.0) # Red
                thin_vertices_count += 1
            elif thickness < max_wall_mm:
                loop[color_layer] = (1.0, 0.8, 0.1, 1.0) # Yellow / Warning
            else:
                loop[color_layer] = (0.2, 0.85, 0.3, 1.0) # Green

    avg_thickness = round(sum(sampled_thicknesses) / max(1, len(sampled_thicknesses)), 2) if sampled_thicknesses else 0.0
    min_sampled_thickness = round(min(sampled_thicknesses), 2) if sampled_thicknesses else 0.0

    # Determine status according to SPARK Voyager guidelines
    if min_sampled_thickness < min_wall_mm:
        wall_state = "bad"
        wall_text = f"Fragile areas detected ({min_sampled_thickness} mm < {min_wall_mm} mm minimum)."
    elif min_sampled_thickness < max_wall_mm:
        wall_state = "warn"
        wall_text = f"Acceptable, but close to lower tolerance ({min_sampled_thickness} mm)."
    else:
        wall_state = "ok"
        wall_text = f"Compliant wall thickness ({avg_thickness} mm average)."

    bm.to_mesh(mesh)
    bm.free()

    report = {
        "dimensionsMm": {
            "length": dim_x,
            "width": dim_y,
            "height": dim_z
        },
        "bed": {
            "bedSizeMm": bed_mm,
            "fitsBed": fits_bed,
            "tooWide": too_wide,
            "tooLong": too_long,
            "partsNeeded": parts_needed
        },
        "watertight": {
            "isWatertight": is_watertight,
            "nonManifoldEdgeCount": len(non_manifold_edges),
            "boundaryEdgeCount": len(boundary_edges)
        },
        "wallThickness": {
            "minSampledMm": min_sampled_thickness,
            "avgSampledMm": avg_thickness,
            "state": wall_state,
            "text": wall_text,
            "compliant": wall_state in ["ok", "warn"]
        },
        "overhang": {
            "overhangLimitDeg": overhang_limit_deg,
            "overhangFacesCount": overhang_faces_count,
            "overhangPercentage": overhang_pct,
            "needsSupport": overhang_pct > 5.0
        },
        "material": {
            "type": "PLA",
            "densityGPerCm3": PLA_DENSITY_G_CM3,
            "volumeCm3": round(volume_cm3, 2),
            "estimatedWeightG": weight_g
        },
        "gateReady": (fits_bed and is_watertight and (wall_state in ["ok", "warn"]))
    }

    return report

def export_glb_preview(filepath):
    if not filepath:
        return
    os.makedirs(os.path.dirname(os.path.abspath(filepath)), exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=filepath,
        export_format='GLB',
        use_selection=False,
        export_colors=True
    )

def main():
    if not BLENDER_AVAILABLE:
        sys.exit(1)

    args = parse_args()
    reset_scene()
    obj = import_model(args.input)
    
    report = analyze_mesh(
        obj=obj,
        bed_mm=args.bed_mm,
        min_wall_mm=args.min_wall,
        max_wall_mm=args.max_wall,
        overhang_limit_deg=args.overhang_limit_deg
    )

    # Save JSON report
    os.makedirs(os.path.dirname(os.path.abspath(args.output_json)), exist_ok=True)
    with open(args.output_json, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)

    # Export preview GLB with heatmap vertex colors
    if args.output_glb:
        export_glb_preview(args.output_glb)

    print("Analysis complete:", json.dumps(report, indent=2))

if __name__ == "__main__":
    main()
