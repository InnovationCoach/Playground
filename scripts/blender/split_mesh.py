"""
SPARK 3D Bed-Fit Mesh Splitter with Interlocking Alignment Pins
Splits oversized 3D models to fit standard 3D printer beds (e.g., 220x220 mm)
and adds matching alignment pins and sockets for simple post-print assembly.

Usage:
  blender -b -P scripts/blender/split_mesh.py -- \
    --input tests/fixtures/3d/long_car_shell.stl \
    --output-dir out/split_parts/ \
    --bed-mm 220 \
    --pin-radius 3.0 \
    --clearance-mm 0.2
"""

import sys
import os
import math
import argparse

try:
    import bpy
    import bmesh
    from mathutils import Vector, Matrix
    BLENDER_AVAILABLE = True
except ImportError:
    BLENDER_AVAILABLE = False
    print("Warning: Running outside of Blender environment. BPY not available.")

def parse_args():
    argv = sys.argv
    if "--" in argv:
        args_to_parse = argv[argv.index("--") + 1:]
    else:
        args_to_parse = argv[1:]

    parser = argparse.ArgumentParser(description="SPARK 3D Bed-Fit Splitter")
    parser.add_argument("--input", required=True, help="Input STL/OBJ model")
    parser.add_argument("--output-dir", required=True, help="Directory to save split STL parts")
    parser.add_argument("--bed-mm", type=float, default=220.0, help="Maximum print bed size (mm)")
    parser.add_argument("--pin-radius", type=float, default=3.0, help="Radius of alignment dowel pins (mm)")
    parser.add_argument("--pin-height", type=float, default=8.0, help="Length of alignment dowel pins (mm)")
    parser.add_argument("--clearance-mm", type=float, default=0.2, help="Tolerance clearance gap for female socket (mm)")
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
    else:
        raise ValueError(f"Format not supported for splitting: {ext}")
    
    mesh_objs = [obj for obj in bpy.context.scene.objects if obj.type == 'MESH']
    bpy.context.view_layer.objects.active = mesh_objs[0]
    return mesh_objs[0]

def create_alignment_pin(location, direction, radius, height):
    """Creates a cylinder to act as a male pin or female cutter."""
    bpy.ops.mesh.primitive_cylinder_add(
        radius=radius,
        depth=height,
        location=location
    )
    cylinder = bpy.context.active_object
    # Orient cylinder along direction
    rot = Vector((0, 0, 1)).rotation_difference(direction).to_euler()
    cylinder.rotation_euler = rot
    return cylinder

def split_and_add_dowels(obj, bed_mm, pin_radius, pin_height, clearance_mm, out_dir):
    os.makedirs(out_dir, exist_ok=True)
    
    # Calculate bounding box along X axis (longest dimension)
    bbox = [Vector(corner) for corner in obj.bound_box]
    min_x = min(v.x for v in bbox)
    max_x = max(v.x for v in bbox)
    length = max_x - min_x
    
    num_parts = max(1, math.ceil(length / bed_mm))
    if num_parts == 1:
        # Fits bed without cutting
        out_file = os.path.join(out_dir, "part_1.stl")
        bpy.ops.wm.stl_export(filepath=out_file, check_existing=False) if hasattr(bpy.ops.wm, "stl_export") else bpy.ops.export_mesh.stl(filepath=out_file)
        print(f"Model fits on {bed_mm} mm bed without cutting. Exported to {out_file}")
        return [out_file]

    segment_length = length / num_parts
    print(f"Cutting model of length {length:.1f} mm into {num_parts} parts of {segment_length:.1f} mm...")

    exported_files = []

    # Cut loop
    for i in range(num_parts):
        part_min_x = min_x + i * segment_length
        part_max_x = min_x + (i + 1) * segment_length

        # Duplicate original object for this part
        bpy.ops.object.select_all(action='DESELECT')
        obj.select_set(True)
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.duplicate()
        part_obj = bpy.context.active_object

        # Bisect min cut (if not first part)
        if i > 0:
            bm = bmesh.new()
            bm.from_mesh(part_obj.data)
            plane_co = Vector((part_min_x, 0, 0))
            plane_no = Vector((1, 0, 0))
            bmesh.ops.bisect_plane(
                bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:],
                plane_co=plane_co, plane_no=plane_no,
                clear_inner=True, clear_outer=False
            )
            bmesh.ops.holes_fill(bm, edges=[e for e in bm.edges if e.is_boundary])
            bm.to_mesh(part_obj.data)
            bm.free()

        # Bisect max cut (if not last part)
        if i < num_parts - 1:
            bm = bmesh.new()
            bm.from_mesh(part_obj.data)
            plane_co = Vector((part_max_x, 0, 0))
            plane_no = Vector((-1, 0, 0))
            bmesh.ops.bisect_plane(
                bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:],
                plane_co=plane_co, plane_no=plane_no,
                clear_inner=True, clear_outer=False
            )
            bmesh.ops.holes_fill(bm, edges=[e for e in bm.edges if e.is_boundary])
            bm.to_mesh(part_obj.data)
            bm.free()

        # Add male pins on right face (if not last part)
        if i < num_parts - 1:
            pin_loc = Vector((part_max_x, 0, 0))
            pin = create_alignment_pin(pin_loc, Vector((1, 0, 0)), pin_radius, pin_height)
            # Union pin to part_obj
            mod = part_obj.modifiers.new(name="UnionPin", type='BOOLEAN')
            mod.operation = 'UNION'
            mod.object = pin
            bpy.context.view_layer.objects.active = part_obj
            bpy.ops.object.modifier_apply(modifier="UnionPin")
            bpy.data.objects.remove(pin, do_unlink=True)

        # Subtract socket on left face (if not first part) with clearance tolerance
        if i > 0:
            socket_loc = Vector((part_min_x, 0, 0))
            socket = create_alignment_pin(socket_loc, Vector((1, 0, 0)), pin_radius + clearance_mm, pin_height + 0.5)
            mod = part_obj.modifiers.new(name="DiffSocket", type='BOOLEAN')
            mod.operation = 'DIFFERENCE'
            mod.object = socket
            bpy.context.view_layer.objects.active = part_obj
            bpy.ops.object.modifier_apply(modifier="DiffSocket")
            bpy.data.objects.remove(socket, do_unlink=True)

        part_file = os.path.join(out_dir, f"part_{i + 1}.stl")
        bpy.ops.object.select_all(action='DESELECT')
        part_obj.select_set(True)
        bpy.context.view_layer.objects.active = part_obj
        if hasattr(bpy.ops.wm, "stl_export"):
            bpy.ops.wm.stl_export(filepath=part_file, check_existing=False)
        else:
            bpy.ops.export_mesh.stl(filepath=part_file)
        
        exported_files.append(part_file)
        bpy.data.objects.remove(part_obj, do_unlink=True)

    return exported_files

def main():
    if not BLENDER_AVAILABLE:
        sys.exit(1)

    args = parse_args()
    reset_scene()
    obj = import_model(args.input)
    parts = split_and_add_dowels(
        obj=obj,
        bed_mm=args.bed_mm,
        pin_radius=args.pin_radius,
        pin_height=args.pin_height,
        clearance_mm=args.clearance_mm,
        out_dir=args.output_dir
    )
    print("Mesh splitting complete. Exported parts:", parts)

if __name__ == "__main__":
    main()
