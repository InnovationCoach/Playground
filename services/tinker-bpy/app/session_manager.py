from __future__ import annotations

import asyncio
import os
import shutil
import time
import uuid
from dataclasses import dataclass, field
from pathlib import Path

from .bmesh_ops import HAS_BPY, apply_operation, clear_scene, create_shape_bmesh, export_glb_bytes, purge_orphans
from .models import ShapeSpec, SyncResult, TinkerOpRequest

try:
    import bpy  # type: ignore
except ImportError:  # pragma: no cover
    bpy = None  # type: ignore


SESSION_ROOT = Path(os.environ.get("TINKER_SESSION_ROOT", "/tmp/tinker_sessions"))
SESSION_TTL_SECONDS = int(os.environ.get("TINKER_SESSION_TTL_SECONDS", "1800"))
MAX_HISTORY = 30


@dataclass
class SessionContext:
    session_id: str
    user_id: str
    work_dir: Path
    created_at: float = field(default_factory=time.time)
    last_active: float = field(default_factory=time.time)
    undo_stack: list[Path] = field(default_factory=list)
    redo_stack: list[Path] = field(default_factory=list)
    glb_cache: dict[str, bytes] = field(default_factory=dict)
    latest_hash: str = ""
    lock: asyncio.Lock = field(default_factory=asyncio.Lock)


class SessionManager:
    """Manages isolated per-learner .blend snapshots, undo/redo stacks, and .glb cache."""

    def __init__(self) -> None:
        SESSION_ROOT.mkdir(parents=True, exist_ok=True)
        self._sessions: dict[str, SessionContext] = {}

    def get(self, session_id: str) -> SessionContext:
        ctx = self._sessions.get(session_id)
        if not ctx:
            raise KeyError(f"Session '{session_id}' not found or expired.")
        ctx.last_active = time.time()
        return ctx

    def _snapshot_blend(self, ctx: SessionContext, tag: str) -> Path:
        snap_path = ctx.work_dir / f"snap_{tag}_{int(time.time() * 1000)}.blend"
        if HAS_BPY and bpy is not None:
            bpy.ops.wm.save_as_mainfile(filepath=str(snap_path))
        else:
            snap_path.write_bytes(b"")
        return snap_path

    def _restore_blend(self, snap_path: Path) -> None:
        if HAS_BPY and bpy is not None and snap_path.exists():
            bpy.ops.wm.open_mainfile(filepath=str(snap_path))
            purge_orphans()

    def _export_and_cache(self, ctx: SessionContext) -> tuple[str, int]:
        tmp_glb = ctx.work_dir / "latest.glb"
        if HAS_BPY:
            data, digest = export_glb_bytes(tmp_glb)
            obj_count = len(bpy.data.objects) if bpy is not None else 0
        else:
            # Minimal valid glTF/GLB header stub for non-Blender test environments
            data = b"glTF\x02\x00\x00\x00\x0c\x00\x00\x00"
            digest = "stub000000000000"
            obj_count = 0
        ctx.glb_cache[digest] = data
        ctx.latest_hash = digest
        # Keep only the most recent 12 GLB blobs per session to bound memory
        if len(ctx.glb_cache) > 12:
            oldest = next(iter(ctx.glb_cache))
            if oldest != digest:
                ctx.glb_cache.pop(oldest, None)
        return digest, obj_count

    async def create_session(self, user_id: str, shapes: list[ShapeSpec]) -> tuple[SessionContext, SyncResult]:
        session_id = f"tk_{uuid.uuid4().hex[:12]}"
        work_dir = SESSION_ROOT / session_id
        work_dir.mkdir(parents=True, exist_ok=True)
        ctx = SessionContext(session_id=session_id, user_id=user_id, work_dir=work_dir)

        async with ctx.lock:
            clear_scene()
            for spec in shapes:
                if HAS_BPY:
                    create_shape_bmesh(spec)
            snap = self._snapshot_blend(ctx, "init")
            ctx.undo_stack.append(snap)
            digest, obj_count = self._export_and_cache(ctx)

        self._sessions[session_id] = ctx
        result = SyncResult(
            sessionId=session_id,
            glbUrl=f"/api/tinker/sessions/{session_id}/glb/{digest}",
            glbHash=digest,
            pythonCode="# Initialized isolated Blender bpy session",
            canUndo=False,
            canRedo=False,
            objectCount=obj_count,
        )
        return ctx, result

    async def execute_op(self, session_id: str, req: TinkerOpRequest, request_id: str | None = None) -> SyncResult:
        ctx = self.get(session_id)
        async with ctx.lock:
            # Restore latest snapshot before mutating (isolates shared bpy.data global state)
            if ctx.undo_stack:
                self._restore_blend(ctx.undo_stack[-1])

            code = apply_operation(req) if HAS_BPY else f"# simulated {req.op}"
            snap = self._snapshot_blend(ctx, req.op)
            ctx.undo_stack.append(snap)
            if len(ctx.undo_stack) > MAX_HISTORY:
                evicted = ctx.undo_stack.pop(0)
                evicted.unlink(missing_ok=True)
            for redo_snap in ctx.redo_stack:
                redo_snap.unlink(missing_ok=True)
            ctx.redo_stack.clear()

            digest, obj_count = self._export_and_cache(ctx)
            return SyncResult(
                sessionId=session_id,
                glbUrl=f"/api/tinker/sessions/{session_id}/glb/{digest}",
                glbHash=digest,
                pythonCode=code,
                canUndo=len(ctx.undo_stack) > 1,
                canRedo=False,
                objectCount=obj_count,
                requestId=request_id,
            )

    async def undo(self, session_id: str, request_id: str | None = None) -> SyncResult:
        ctx = self.get(session_id)
        async with ctx.lock:
            if len(ctx.undo_stack) > 1:
                current = ctx.undo_stack.pop()
                ctx.redo_stack.append(current)
                self._restore_blend(ctx.undo_stack[-1])
            digest, obj_count = self._export_and_cache(ctx)
            return SyncResult(
                sessionId=session_id,
                glbUrl=f"/api/tinker/sessions/{session_id}/glb/{digest}",
                glbHash=digest,
                pythonCode="# Undo last operation",
                canUndo=len(ctx.undo_stack) > 1,
                canRedo=len(ctx.redo_stack) > 0,
                objectCount=obj_count,
                requestId=request_id,
            )

    async def redo(self, session_id: str, request_id: str | None = None) -> SyncResult:
        ctx = self.get(session_id)
        async with ctx.lock:
            if ctx.redo_stack:
                nxt = ctx.redo_stack.pop()
                ctx.undo_stack.append(nxt)
                self._restore_blend(nxt)
            digest, obj_count = self._export_and_cache(ctx)
            return SyncResult(
                sessionId=session_id,
                glbUrl=f"/api/tinker/sessions/{session_id}/glb/{digest}",
                glbHash=digest,
                pythonCode="# Redo operation",
                canUndo=len(ctx.undo_stack) > 1,
                canRedo=len(ctx.redo_stack) > 0,
                objectCount=obj_count,
                requestId=request_id,
            )

    def delete_session(self, session_id: str) -> None:
        ctx = self._sessions.pop(session_id, None)
        if ctx and ctx.work_dir.exists():
            shutil.rmtree(ctx.work_dir, ignore_errors=True)

    async def reap_idle_sessions(self) -> None:
        while True:
            await asyncio.sleep(60)
            now = time.time()
            expired = [
                sid for sid, ctx in self._sessions.items()
                if now - ctx.last_active > SESSION_TTL_SECONDS
            ]
            for sid in expired:
                self.delete_session(sid)
