from __future__ import annotations

from typing import Any, Literal
from pydantic import BaseModel, Field


ShapePrimitive = Literal["box", "cylinder", "sphere", "cone", "torus", "wedge", "roof"]
OpType = Literal[
    "add_primitive",
    "transform",
    "delete",
    "extrude_face",
    "bevel_edges",
    "loop_cut",
    "inset_faces",
    "boolean_hole",
    "reset",
]


class ShapeSpec(BaseModel):
    id: str = Field(..., min_length=1, max_length=64)
    type: ShapePrimitive = "box"
    name: str = "Object"
    x: float = 0.0
    y: float = 10.0
    z: float = 0.0
    w: float = Field(20.0, gt=0.1, le=500.0)
    h: float = Field(20.0, gt=0.1, le=500.0)
    d: float = Field(20.0, gt=0.1, le=500.0)
    rotX: float = 0.0
    rotY: float = 0.0
    rotZ: float = 0.0
    color: str = "#3b82f6"
    isHole: bool = False


class TinkerOpRequest(BaseModel):
    op: OpType
    targetId: str | None = None
    params: dict[str, Any] = Field(default_factory=dict)


class WsCommand(BaseModel):
    action: Literal["op", "undo", "redo", "sync"]
    requestId: str | None = None
    payload: TinkerOpRequest | None = None


class SessionCreateRequest(BaseModel):
    userId: str = Field(..., min_length=1, max_length=128)
    shapes: list[ShapeSpec] = Field(default_factory=list)


class SyncResult(BaseModel):
    ok: bool = True
    sessionId: str
    glbUrl: str
    glbHash: str
    pythonCode: str = ""
    canUndo: bool = False
    canRedo: bool = False
    objectCount: int = 0
    requestId: str | None = None
    error: str | None = None


class SessionCreateResponse(BaseModel):
    ok: bool = True
    sessionId: str
    wsPath: str
    glbUrl: str
    glbHash: str


class DiagnosticIssue(BaseModel):
    code: Literal[
        "NON_MANIFOLD",
        "FLIPPED_NORMALS",
        "NGON_FACES",
        "UNAPPLIED_SCALE",
        "POLY_BUDGET_EXCEEDED",
    ]
    severity: Literal["error", "warning"]
    objectName: str
    count: int
    coordinates: list[list[float]] = Field(default_factory=list)
    explanation: str
    autoFixable: bool = True


class DiagnosticReport(BaseModel):
    ok: bool = True
    passed: bool
    score: int = Field(..., ge=0, le=100)
    triangleCount: int = 0
    maxTriangles: int = 10000
    issues: list[DiagnosticIssue] = Field(default_factory=list)


class AutoFixResponse(BaseModel):
    ok: bool = True
    pythonCode: str
    report: DiagnosticReport
    glbUrl: str
    glbHash: str


class GeoNodeSocketSchema(BaseModel):
    identifier: str
    name: str
    socketType: Literal["FLOAT", "INT", "BOOLEAN", "VECTOR", "ENUM"]
    value: Any
    defaultValue: Any
    min: float | None = None
    max: float | None = None
    options: list[str] = Field(default_factory=list)


class GeoNodeGraphNode(BaseModel):
    id: str
    label: str
    blIdname: str
    role: Literal["input", "process", "output"]
    annotation: str = ""
    x: float = 0.0
    y: float = 0.0


class GeoNodeGraphLink(BaseModel):
    fromNode: str
    fromSocket: str
    toNode: str
    toSocket: str


class GeoNodeGraph(BaseModel):
    nodes: list[GeoNodeGraphNode] = Field(default_factory=list)
    links: list[GeoNodeGraphLink] = Field(default_factory=list)


class GeoNodesSchemaResponse(BaseModel):
    ok: bool = True
    objectName: str
    modifierName: str
    sockets: list[GeoNodeSocketSchema] = Field(default_factory=list)
    nodeGraph: GeoNodeGraph


class GeoNodeParamUpdate(BaseModel):
    values: dict[str, Any] = Field(default_factory=dict)


class ExecuteScriptRequest(BaseModel):
    code: str = Field(..., min_length=1, max_length=16000)


class RenderRequest(BaseModel):
    engine: Literal["EEVEE", "CYCLES"] = "EEVEE"


class RenderJobStatus(BaseModel):
    ok: bool = True
    jobId: str
    engine: Literal["EEVEE", "CYCLES"]
    status: Literal["queued", "rendering", "done", "error"]
    progress: int = 0
    imageB64: str | None = None
    error: str | None = None
