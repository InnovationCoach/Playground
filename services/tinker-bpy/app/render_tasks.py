from __future__ import annotations

import asyncio
import base64
import time
import uuid
from dataclasses import dataclass, field
from pathlib import Path
from typing import Literal

from .bmesh_ops import HAS_BPY

try:
    import bpy  # type: ignore
except ImportError:  # pragma: no cover
    bpy = None  # type: ignore


RenderEngine = Literal["EEVEE", "CYCLES"]


@dataclass
class RenderJob:
    job_id: str
    session_id: str
    engine: RenderEngine
    status: Literal["queued", "rendering", "done", "error"] = "queued"
    progress: int = 0
    image_b64: str | None = None
    error: str | None = None
    created_at: float = field(default_factory=time.time)


class RenderManager:
    """Manages async EEVEE and Cycles (with OpenImageDenoise) cloud render jobs."""

    def __init__(self) -> None:
        self._jobs: dict[str, RenderJob] = {}

    def get(self, job_id: str) -> RenderJob:
        job = self._jobs.get(job_id)
        if not job:
            raise KeyError(f"Render job '{job_id}' not found.")
        return job

    async def start_render(self, session_id: str, work_dir: Path, engine: RenderEngine = "EEVEE") -> RenderJob:
        job_id = f"rnd_{uuid.uuid4().hex[:10]}"
        job = RenderJob(job_id=job_id, session_id=session_id, engine=engine)
        self._jobs[job_id] = job
        asyncio.create_task(self._run_render(job, work_dir))
        return job

    async def _run_render(self, job: RenderJob, work_dir: Path) -> None:
        job.status = "rendering"
        job.progress = 20
        out_path = work_dir / f"{job.job_id}.png"
        try:
            if HAS_BPY and bpy is not None:
                scene = bpy.context.scene
                scene.render.image_settings.file_format = "PNG"
                scene.render.filepath = str(out_path)
                scene.render.resolution_x = 960
                scene.render.resolution_y = 540
                if job.engine == "CYCLES":
                    scene.render.engine = "CYCLES"
                    scene.cycles.samples = 32
                    scene.cycles.use_denoising = True
                    scene.cycles.denoiser = "OPENIMAGEDENOISE"
                else:
                    scene.render.engine = "BLENDER_EEVEE_NEXT"
                job.progress = 60
                await asyncio.to_thread(bpy.ops.render.render, write_still=True)
                if out_path.exists():
                    job.image_b64 = base64.b64encode(out_path.read_bytes()).decode("ascii")
            else:
                await asyncio.sleep(0.05)
            job.progress = 100
            job.status = "done"
        except Exception as exc:
            job.status = "error"
            job.error = str(exc)


def export_scene_format(work_dir: Path, fmt: Literal["glb", "usdz", "stl"]) -> tuple[bytes, str, str]:
    """Export the active Blender scene as .glb, .usdz (AR Quick Look), or .stl."""
    if not HAS_BPY or bpy is None:
        return b"stub-export", "application/octet-stream", f"tinker_export.{fmt}"

    out_path = work_dir / f"export.{fmt}"
    if fmt == "glb":
        bpy.ops.export_scene.gltf(
            filepath=str(out_path),
            export_format="GLB",
            export_draco_mesh_compression_enable=True,
            export_apply=True,
        )
        return out_path.read_bytes(), "model/gltf-binary", "spark_tinker.glb"
    if fmt == "usdz":
        bpy.ops.wm.usd_export(filepath=str(out_path))
        return out_path.read_bytes(), "model/vnd.usdz+zip", "spark_tinker.usdz"
    if fmt == "stl":
        bpy.ops.wm.stl_export(filepath=str(out_path))
        return out_path.read_bytes(), "model/stl", "spark_tinker.stl"
    raise ValueError(f"Unsupported export format: {fmt}")
