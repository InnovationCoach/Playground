from __future__ import annotations

import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Response, WebSocket, WebSocketDisconnect
from pydantic import ValidationError

from .ai_copilot import execute_sandboxed_bpy
from .bmesh_ops import HAS_BPY
from .diagnostics import auto_fix_scene, inspect_scene_diagnostics
from .geonodes import introspect_geonodes, update_geonode_params
from .models import (
    AutoFixResponse,
    DiagnosticReport,
    ExecuteScriptRequest,
    GeoNodeParamUpdate,
    GeoNodesSchemaResponse,
    RenderJobStatus,
    RenderRequest,
    SessionCreateRequest,
    SessionCreateResponse,
    SyncResult,
    TinkerOpRequest,
    WsCommand,
)
from .render_tasks import RenderManager, export_scene_format
from .session_manager import SessionManager

manager = SessionManager()
render_manager = RenderManager()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    reaper = asyncio.create_task(manager.reap_idle_sessions())
    try:
        yield
    finally:
        reaper.cancel()


app = FastAPI(title="SPARK Tinker bpy Worker", version="1.0.0", lifespan=lifespan)


@app.get("/health")
def health() -> dict[str, object]:
    return {"ok": True, "hasBpy": HAS_BPY}


@app.post("/sessions", response_model=SessionCreateResponse)
async def create_session(body: SessionCreateRequest) -> SessionCreateResponse:
    _, sync = await manager.create_session(body.userId, body.shapes)
    return SessionCreateResponse(
        sessionId=sync.sessionId,
        wsPath=f"/api/tinker/ws/{sync.sessionId}",
        glbUrl=sync.glbUrl,
        glbHash=sync.glbHash,
    )


@app.delete("/sessions/{session_id}")
def delete_session(session_id: str) -> dict[str, bool]:
    manager.delete_session(session_id)
    return {"ok": True}


@app.get("/sessions/{session_id}/glb/{glb_hash}")
def get_glb(session_id: str, glb_hash: str) -> Response:
    try:
        ctx = manager.get(session_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    blob = ctx.glb_cache.get(glb_hash)
    if blob is None:
        raise HTTPException(status_code=404, detail="GLB snapshot not found.")

    return Response(
        content=blob,
        media_type="model/gltf-binary",
        headers={"Cache-Control": "public, max-age=31536000, immutable"},
    )


@app.post("/sessions/{session_id}/op", response_model=SyncResult)
async def run_op(session_id: str, req: TinkerOpRequest) -> SyncResult:
    try:
        return await manager.execute_op(session_id, req)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/sessions/{session_id}/diagnostics", response_model=DiagnosticReport)
async def get_diagnostics(session_id: str, maxTriangles: int = 10000) -> DiagnosticReport:
    try:
        ctx = manager.get(session_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    async with ctx.lock:
        if ctx.undo_stack:
            manager._restore_blend(ctx.undo_stack[-1])
        return inspect_scene_diagnostics(max_triangles=maxTriangles)


@app.post("/sessions/{session_id}/auto-fix", response_model=AutoFixResponse)
async def run_auto_fix(session_id: str, maxTriangles: int = 10000) -> AutoFixResponse:
    try:
        ctx = manager.get(session_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    async with ctx.lock:
        if ctx.undo_stack:
            manager._restore_blend(ctx.undo_stack[-1])
        code, report = auto_fix_scene(max_triangles=maxTriangles)
        snap = manager._snapshot_blend(ctx, "autofix")
        ctx.undo_stack.append(snap)
        digest, _ = manager._export_and_cache(ctx)
        return AutoFixResponse(
            pythonCode=code,
            report=report,
            glbUrl=f"/api/tinker/sessions/{session_id}/glb/{digest}",
            glbHash=digest,
        )


@app.get("/sessions/{session_id}/geonodes/{object_name}", response_model=GeoNodesSchemaResponse)
async def get_geonodes_schema(session_id: str, object_name: str) -> GeoNodesSchemaResponse:
    try:
        ctx = manager.get(session_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    async with ctx.lock:
        if ctx.undo_stack:
            manager._restore_blend(ctx.undo_stack[-1])
        try:
            return introspect_geonodes(object_name)
        except ValueError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc


@app.post("/sessions/{session_id}/geonodes/{object_name}/params", response_model=SyncResult)
async def set_geonodes_params(session_id: str, object_name: str, body: GeoNodeParamUpdate) -> SyncResult:
    try:
        ctx = manager.get(session_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    async with ctx.lock:
        if ctx.undo_stack:
            manager._restore_blend(ctx.undo_stack[-1])
        try:
            code = update_geonode_params(object_name, body.values)
        except ValueError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc
        snap = manager._snapshot_blend(ctx, "geonodes")
        ctx.undo_stack.append(snap)
        digest, obj_count = manager._export_and_cache(ctx)
        return SyncResult(
            sessionId=session_id,
            glbUrl=f"/api/tinker/sessions/{session_id}/glb/{digest}",
            glbHash=digest,
            pythonCode=code,
            canUndo=len(ctx.undo_stack) > 1,
            canRedo=False,
            objectCount=obj_count,
        )


@app.post("/sessions/{session_id}/execute-script", response_model=SyncResult)
async def execute_script(session_id: str, body: ExecuteScriptRequest) -> SyncResult:
    try:
        ctx = manager.get(session_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    async with ctx.lock:
        if ctx.undo_stack:
            manager._restore_blend(ctx.undo_stack[-1])
        try:
            execute_sandboxed_bpy(body.code)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
        snap = manager._snapshot_blend(ctx, "ai_script")
        ctx.undo_stack.append(snap)
        digest, obj_count = manager._export_and_cache(ctx)
        return SyncResult(
            sessionId=session_id,
            glbUrl=f"/api/tinker/sessions/{session_id}/glb/{digest}",
            glbHash=digest,
            pythonCode=body.code,
            canUndo=len(ctx.undo_stack) > 1,
            canRedo=False,
            objectCount=obj_count,
        )


@app.post("/sessions/{session_id}/render", response_model=RenderJobStatus)
async def start_render(session_id: str, body: RenderRequest) -> RenderJobStatus:
    try:
        ctx = manager.get(session_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    job = await render_manager.start_render(session_id, ctx.work_dir, body.engine)
    return RenderJobStatus(
        jobId=job.job_id,
        engine=job.engine,
        status=job.status,
        progress=job.progress,
    )


@app.get("/sessions/{session_id}/render/{job_id}", response_model=RenderJobStatus)
async def get_render_status(session_id: str, job_id: str) -> RenderJobStatus:
    try:
        manager.get(session_id)
        job = render_manager.get(job_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return RenderJobStatus(
        jobId=job.job_id,
        engine=job.engine,
        status=job.status,
        progress=job.progress,
        imageB64=job.image_b64,
        error=job.error,
    )


@app.get("/sessions/{session_id}/export")
async def export_session_model(session_id: str, format: str = "glb") -> Response:
    if format not in ("glb", "usdz", "stl"):
        raise HTTPException(status_code=400, detail="format must be glb, usdz, or stl")
    try:
        ctx = manager.get(session_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    async with ctx.lock:
        if ctx.undo_stack:
            manager._restore_blend(ctx.undo_stack[-1])
        data, mime, filename = export_scene_format(ctx.work_dir, format)  # type: ignore[arg-type]
        return Response(
            content=data,
            media_type=mime,
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )


@app.websocket("/ws/{session_id}")
async def session_ws(websocket: WebSocket, session_id: str) -> None:
    try:
        ctx = manager.get(session_id)
    except KeyError:
        await websocket.close(code=4404, reason="Session not found")
        return

    await websocket.accept()
    try:
        while True:
            raw = await websocket.receive_json()
            try:
                cmd = WsCommand(**raw)
            except ValidationError as exc:
                await websocket.send_json({"ok": False, "error": str(exc)})
                continue

            try:
                if cmd.action == "op" and cmd.payload is not None:
                    res = await manager.execute_op(session_id, cmd.payload, cmd.requestId)
                elif cmd.action == "undo":
                    res = await manager.undo(session_id, cmd.requestId)
                elif cmd.action == "redo":
                    res = await manager.redo(session_id, cmd.requestId)
                else:
                    res = SyncResult(
                        sessionId=session_id,
                        glbUrl=f"/api/tinker/sessions/{session_id}/glb/{ctx.latest_hash}",
                        glbHash=ctx.latest_hash,
                        canUndo=len(ctx.undo_stack) > 1,
                        canRedo=len(ctx.redo_stack) > 0,
                        requestId=cmd.requestId,
                    )
                await websocket.send_json(res.model_dump())
            except Exception as exc:
                await websocket.send_json({
                    "ok": False,
                    "sessionId": session_id,
                    "requestId": cmd.requestId,
                    "error": str(exc),
                })
    except WebSocketDisconnect:
        return
