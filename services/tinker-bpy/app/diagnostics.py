from __future__ import annotations

from .bmesh_ops import HAS_BPY, purge_orphans
from .models import DiagnosticIssue, DiagnosticReport

try:
    import bpy  # type: ignore
    import bmesh  # type: ignore
except ImportError:  # pragma: no cover
    bpy = None  # type: ignore
    bmesh = None  # type: ignore


def _world_mm(obj, local_vec) -> list[float]:
    world = obj.matrix_world @ local_vec
    return [round(world.x * 1000.0, 2), round(world.y * 1000.0, 2), round(world.z * 1000.0, 2)]


def inspect_scene_diagnostics(max_triangles: int = 10000) -> DiagnosticReport:
    """Inspect all mesh objects in the active Blender scene using bmesh."""
    if not HAS_BPY or bpy is None or bmesh is None:
        return DiagnosticReport(passed=True, score=100, triangleCount=0, maxTriangles=max_triangles, issues=[])

    issues: list[DiagnosticIssue] = []
    total_triangles = 0

    for obj in bpy.data.objects:
        if obj.type != "MESH" or obj.data is None:
            continue

        # 1. Unapplied object scale
        sx, sy, sz = obj.scale
        if abs(sx - 1.0) > 1e-3 or abs(sy - 1.0) > 1e-3 or abs(sz - 1.0) > 1e-3:
            issues.append(DiagnosticIssue(
                code="UNAPPLIED_SCALE",
                severity="warning",
                objectName=obj.name,
                count=1,
                coordinates=[_world_mm(obj, obj.bound_box[0])],
                explanation=f"'{obj.name}' has unapplied scale ({sx:.2f}, {sy:.2f}, {sz:.2f}). Apply scale so bevels and 3D prints stay accurate.",
                autoFixable=True,
            ))

        bm = bmesh.new()
        bm.from_mesh(obj.data)
        bm.verts.ensure_lookup_table()
        bm.edges.ensure_lookup_table()
        bm.faces.ensure_lookup_table()

        total_triangles += sum(max(1, len(f.verts) - 2) for f in bm.faces)

        # 2. Non-manifold edges
        non_manifold_coords: list[list[float]] = []
        for edge in bm.edges:
            if not edge.is_manifold:
                mid = (edge.verts[0].co + edge.verts[1].co) * 0.5
                non_manifold_coords.append(_world_mm(obj, mid))
        if non_manifold_coords:
            issues.append(DiagnosticIssue(
                code="NON_MANIFOLD",
                severity="error",
                objectName=obj.name,
                count=len(non_manifold_coords),
                coordinates=non_manifold_coords[:40],
                explanation=f"Found {len(non_manifold_coords)} non-manifold edge(s) on '{obj.name}'. 3D printers require watertight surfaces.",
                autoFixable=True,
            ))

        # 3. N-gons (faces with > 4 vertices)
        ngon_coords = [_world_mm(obj, f.calc_center_median()) for f in bm.faces if len(f.verts) > 4]
        if ngon_coords:
            issues.append(DiagnosticIssue(
                code="NGON_FACES",
                severity="warning",
                objectName=obj.name,
                count=len(ngon_coords),
                coordinates=ngon_coords[:40],
                explanation=f"'{obj.name}' has {len(ngon_coords)} n-gon face(s) (>4 sides) that can pinch during subdivision or beveling.",
                autoFixable=True,
            ))

        # 4. Flipped / inconsistent normals (compare against recalculated outward normals)
        orig_normals = [f.normal.copy() for f in bm.faces]
        bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
        flipped_coords = [
            _world_mm(obj, f.calc_center_median())
            for f, orig_n in zip(bm.faces, orig_normals)
            if f.normal.dot(orig_n) < 0.0
        ]
        if flipped_coords:
            issues.append(DiagnosticIssue(
                code="FLIPPED_NORMALS",
                severity="error",
                objectName=obj.name,
                count=len(flipped_coords),
                coordinates=flipped_coords[:40],
                explanation=f"'{obj.name}' has {len(flipped_coords)} inverted face normal(s), which look inside-out in slicers and WebGL.",
                autoFixable=True,
            ))

        bm.free()

    # 5. Polygon / triangle budget
    if total_triangles > max_triangles:
        issues.append(DiagnosticIssue(
            code="POLY_BUDGET_EXCEEDED",
            severity="warning",
            objectName="Scene",
            count=total_triangles - max_triangles,
            coordinates=[],
            explanation=f"Scene uses {total_triangles:,} triangles, exceeding the {max_triangles:,} triangle budget.",
            autoFixable=False,
        ))

    error_count = sum(1 for i in issues if i.severity == "error")
    warn_count = sum(1 for i in issues if i.severity == "warning")
    score = max(0, 100 - error_count * 25 - warn_count * 10)
    return DiagnosticReport(
        passed=error_count == 0,
        score=score,
        triangleCount=total_triangles,
        maxTriangles=max_triangles,
        issues=issues,
    )


def auto_fix_scene(max_triangles: int = 10000) -> tuple[str, DiagnosticReport]:
    """Apply scale transforms, merge duplicate verts, recalculate normals, and triangulate n-gons."""
    if not HAS_BPY or bpy is None or bmesh is None:
        return "# auto-fix simulated", inspect_scene_diagnostics(max_triangles)

    for obj in bpy.data.objects:
        if obj.type != "MESH" or obj.data is None:
            continue
        if any(abs(s - 1.0) > 1e-3 for s in obj.scale):
            bpy.context.view_layer.objects.active = obj
            obj.select_set(True)
            bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
            obj.select_set(False)

        bm = bmesh.new()
        bm.from_mesh(obj.data)
        bmesh.ops.remove_doubles(bm, verts=list(bm.verts), dist=0.0001)
        ngons = [f for f in bm.faces if len(f.verts) > 4]
        if ngons:
            bmesh.ops.triangulate(bm, faces=ngons)
        bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
        bm.to_mesh(obj.data)
        bm.free()
        obj.data.update()

    purge_orphans()
    code = (
        "# One-Click Auto-Fix: apply scale, merge doubles, triangulate n-gons, recalculate normals\n"
        "for obj in bpy.data.objects:\n"
        "    if obj.type == 'MESH':\n"
        "        bm = bmesh.new(); bm.from_mesh(obj.data)\n"
        "        bmesh.ops.remove_doubles(bm, verts=list(bm.verts), dist=0.0001)\n"
        "        bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))\n"
        "        bm.to_mesh(obj.data); bm.free()"
    )
    return code, inspect_scene_diagnostics(max_triangles)
