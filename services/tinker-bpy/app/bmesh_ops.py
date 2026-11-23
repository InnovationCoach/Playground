from __future__ import annotations

import hashlib
import math
from pathlib import Path
from typing import Any

from .models import ShapeSpec, TinkerOpRequest

try:
    import bpy  # type: ignore
    import bmesh  # type: ignore
    from mathutils import Euler, Matrix, Vector  # type: ignore
    HAS_BPY = True
except ImportError:  # pragma: no cover - local unit-test environment without Blender
    bpy = None  # type: ignore
    bmesh = None  # type: ignore
    HAS_BPY = False


def purge_orphans() -> None:
    """Release unreferenced meshes, materials, and images from bpy.data."""
    if not HAS_BPY:
        return
    bpy.data.orphans_purge(do_local_ids=True, do_linked_ids=True, do_recursive=True)


def clear_scene() -> None:
    """Reset the active Blender scene to an empty state without leaks."""
    if not HAS_BPY:
        return
    for obj in list(bpy.data.objects):
        bpy.data.objects.remove(obj, do_unlink=True)
    purge_orphans()


def _hex_to_rgba(hex_color: str) -> tuple[float, float, float, float]:
    clean = hex_color.lstrip("#")
    if len(clean) != 6:
        return (0.23, 0.51, 0.96, 1.0)
    r = int(clean[0:2], 16) / 255.0
    g = int(clean[2:4], 16) / 255.0
    b = int(clean[4:6], 16) / 255.0
    return (r, g, b, 1.0)


def _assign_material(obj: Any, color: str, is_hole: bool) -> None:
    mat_name = f"mat_{obj.name}"
    mat = bpy.data.materials.get(mat_name) or bpy.data.materials.new(name=mat_name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        if is_hole:
            bsdf.inputs["Base Color"].default_value = (0.58, 0.64, 0.72, 1.0)
            bsdf.inputs["Alpha"].default_value = 0.38
            mat.blend_method = "BLEND"
        else:
            bsdf.inputs["Base Color"].default_value = _hex_to_rgba(color)
            bsdf.inputs["Roughness"].default_value = 0.35
            bsdf.inputs["Metallic"].default_value = 0.15
    if obj.data.materials:
        obj.data.materials[0] = mat
    else:
        obj.data.materials.append(mat)


def create_shape_bmesh(spec: ShapeSpec) -> tuple[Any, str]:
    """Create a Blender mesh object from ShapeSpec using bmesh (millimeter scale -> meters)."""
    if not HAS_BPY:
        raise RuntimeError("Blender bpy runtime is not available in this process.")

    scale = 0.001  # 1 mm -> 0.001 m for standard glTF/AR scale
    w, h, d = spec.w * scale, spec.h * scale, spec.d * scale

    mesh = bpy.data.meshes.new(spec.id)
    bm = bmesh.new()

    if spec.type == "cylinder":
        bmesh.ops.create_cone(
            bm, cap_ends=True, cap_tris=False, segments=32,
            radius1=w / 2.0, radius2=w / 2.0, depth=h
        )
    elif spec.type == "cone":
        bmesh.ops.create_cone(
            bm, cap_ends=True, cap_tris=False, segments=32,
            radius1=w / 2.0, radius2=0.0, depth=h
        )
    elif spec.type == "sphere":
        bmesh.ops.create_uvsphere(bm, u_segments=32, v_segments=16, radius=w / 2.0)
    elif spec.type == "torus":
        # Approximate torus ring via spin of a circle profile
        major_r = w / 2.0
        minor_r = max(0.001, d / 4.0)
        bmesh.ops.create_circle(bm, cap_ends=True, radius=minor_r, segments=16)
        bmesh.ops.translate(bm, verts=bm.verts[:], vec=(major_r, 0.0, 0.0))
        bmesh.ops.spin(
            bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:],
            cent=(0.0, 0.0, 0.0), axis=(0.0, 1.0, 0.0),
            angle=math.tau, steps=32, use_merge=True
        )
    else:
        # Box (and fallback for roof/wedge before custom profile)
        bmesh.ops.create_cube(bm, size=1.0)
        bmesh.ops.scale(bm, vec=(w, h, d), verts=bm.verts)

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(mesh)
    bm.free()

    obj = bpy.data.objects.new(spec.id, mesh)
    obj.location = (spec.x * scale, spec.y * scale, spec.z * scale)
    obj.rotation_euler = Euler((
        math.radians(spec.rotX),
        math.radians(spec.rotY),
        math.radians(spec.rotZ),
    ), "XYZ")
    bpy.context.scene.collection.objects.link(obj)
    _assign_material(obj, spec.color, spec.isHole)

    code = (
        f"# bmesh: create {spec.type} '{spec.id}' ({spec.w}x{spec.d}x{spec.h} mm)\n"
        f"bm = bmesh.new()\n"
        f"# ... populate {spec.type} geometry at ({spec.x}, {spec.y}, {spec.z}) mm\n"
    )
    return obj, code


def apply_operation(req: TinkerOpRequest) -> str:
    """Execute a deterministic bmesh/bpy operation on the active scene; return generated Python."""
    if not HAS_BPY:
        raise RuntimeError("Blender bpy runtime is not available in this process.")

    if req.op == "reset":
        clear_scene()
        shapes = [ShapeSpec(**s) for s in req.params.get("shapes", [])]
        lines = ["clear_scene()"]
        for spec in shapes:
            _, snippet = create_shape_bmesh(spec)
            lines.append(snippet.strip())
        return "\n".join(lines)

    if req.op == "add_primitive":
        spec = ShapeSpec(**req.params)
        _, snippet = create_shape_bmesh(spec)
        return snippet

    obj = bpy.data.objects.get(req.targetId or "")
    if not obj:
        raise ValueError(f"Target object '{req.targetId}' not found in session scene.")

    if req.op == "delete":
        bpy.data.objects.remove(obj, do_unlink=True)
        purge_orphans()
        return f"bpy.data.objects.remove(bpy.data.objects['{req.targetId}'], do_unlink=True)"

    if req.op == "transform":
        scale = 0.001
        if "x" in req.params:
            obj.location.x = float(req.params["x"]) * scale
        if "y" in req.params:
            obj.location.y = float(req.params["y"]) * scale
        if "z" in req.params:
            obj.location.z = float(req.params["z"]) * scale
        if any(k in req.params for k in ("rotX", "rotY", "rotZ")):
            obj.rotation_euler = Euler((
                math.radians(float(req.params.get("rotX", math.degrees(obj.rotation_euler.x)))),
                math.radians(float(req.params.get("rotY", math.degrees(obj.rotation_euler.y)))),
                math.radians(float(req.params.get("rotZ", math.degrees(obj.rotation_euler.z)))),
            ), "XYZ")
        return f"obj = bpy.data.objects['{obj.name}']\nobj.location = {tuple(round(v, 4) for v in obj.location)}"

    if req.op == "bevel_edges":
        offset = float(req.params.get("offsetMm", 1.5)) * 0.001
        segments = int(req.params.get("segments", 3))
        bm = bmesh.new()
        bm.from_mesh(obj.data)
        bmesh.ops.bevel(
            bm,
            geom=list(bm.edges),
            offset=offset,
            segments=max(1, min(segments, 12)),
            affect="EDGES",
            clamp_overlap=True,
        )
        bm.to_mesh(obj.data)
        bm.free()
        obj.data.update()
        return (
            f"bm = bmesh.new()\n"
            f"bm.from_mesh(bpy.data.objects['{obj.name}'].data)\n"
            f"bmesh.ops.bevel(bm, geom=list(bm.edges), offset={offset:.4f}, segments={segments}, affect='EDGES')\n"
            f"bm.to_mesh(bpy.data.objects['{obj.name}'].data); bm.free()"
        )

    if req.op == "extrude_face":
        distance = float(req.params.get("distanceMm", 5.0)) * 0.001
        face_index = int(req.params.get("faceIndex", 0))
        bm = bmesh.new()
        bm.from_mesh(obj.data)
        bm.faces.ensure_lookup_table()
        if not bm.faces:
            bm.free()
            raise ValueError("Mesh has no faces to extrude.")
        target_face = bm.faces[face_index % len(bm.faces)]
        normal = target_face.normal.copy()
        res = bmesh.ops.extrude_face_region(bm, geom=[target_face])
        extruded_verts = [ele for ele in res["geom"] if isinstance(ele, bmesh.types.BMVert)]
        bmesh.ops.translate(bm, verts=extruded_verts, vec=normal * distance)
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        bm.to_mesh(obj.data)
        bm.free()
        obj.data.update()
        return (
            f"bm = bmesh.new()\n"
            f"bm.from_mesh(bpy.data.objects['{obj.name}'].data)\n"
            f"# extrude face {face_index} by {distance * 1000:.1f} mm along normal\n"
        )

    if req.op == "loop_cut":
        cuts = max(1, min(int(req.params.get("cuts", 1)), 8))
        bm = bmesh.new()
        bm.from_mesh(obj.data)
        bmesh.ops.subdivide_edges(bm, edges=list(bm.edges), cuts=cuts, use_grid_fill=True)
        bm.to_mesh(obj.data)
        bm.free()
        obj.data.update()
        return (
            f"bm = bmesh.new()\n"
            f"bm.from_mesh(bpy.data.objects['{obj.name}'].data)\n"
            f"bmesh.ops.subdivide_edges(bm, edges=list(bm.edges), cuts={cuts}, use_grid_fill=True)\n"
            f"bm.to_mesh(bpy.data.objects['{obj.name}'].data); bm.free()"
        )

    if req.op == "inset_faces":
        thickness = float(req.params.get("thicknessMm", 2.0)) * 0.001
        depth = float(req.params.get("depthMm", 0.0)) * 0.001
        bm = bmesh.new()
        bm.from_mesh(obj.data)
        bmesh.ops.inset_individual(bm, faces=list(bm.faces), thickness=thickness, depth=depth)
        bm.to_mesh(obj.data)
        bm.free()
        obj.data.update()
        return f"bmesh.ops.inset_individual(bm, faces=list(bm.faces), thickness={thickness:.4f}, depth={depth:.4f})"

    raise ValueError(f"Unsupported operation: {req.op}")


def export_glb_bytes(temp_path: Path) -> tuple[bytes, str]:
    """Export the current Blender scene to Draco-compressed .glb and return (bytes, sha256)."""
    if not HAS_BPY:
        raise RuntimeError("Blender bpy runtime is not available in this process.")
    bpy.ops.export_scene.gltf(
        filepath=str(temp_path),
        export_format="GLB",
        use_selection=False,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_apply=True,
    )
    data = temp_path.read_bytes()
    digest = hashlib.sha256(data).hexdigest()[:16]
    return data, digest
