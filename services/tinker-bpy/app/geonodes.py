from __future__ import annotations

from typing import Any

from .bmesh_ops import HAS_BPY
from .models import (
    GeoNodeGraph,
    GeoNodeGraphLink,
    GeoNodeGraphNode,
    GeoNodesSchemaResponse,
    GeoNodeSocketSchema,
)

try:
    import bpy  # type: ignore
except ImportError:  # pragma: no cover
    bpy = None  # type: ignore


_SOCKET_TYPE_MAP = {
    "NodeSocketFloat": "FLOAT",
    "NodeSocketFloatDistance": "FLOAT",
    "NodeSocketFloatAngle": "FLOAT",
    "NodeSocketInt": "INT",
    "NodeSocketBool": "BOOLEAN",
    "NodeSocketVector": "VECTOR",
    "NodeSocketMenu": "ENUM",
}

_NODE_ANNOTATIONS = {
    "NodeGroupInput": "Exposes parametric sliders & toggles from the SPARK UI into the node tree.",
    "GeometryNodeCurvePrimitiveCircle": "Generates a mathematical circle curve with N control points.",
    "GeometryNodeInstanceOnPoints": "Copies the base mesh onto every point along the curve.",
    "GeometryNodeRealizeInstances": "Converts lightweight instances into real 3D mesh geometry for export.",
    "GeometryNodeSetPosition": "Applies procedural twist or wave offsets to vertex positions.",
    "NodeGroupOutput": "Outputs the final evaluated mesh to Three.js (.glb) and 3D printing.",
}


def ensure_geonodes_modifier(obj_name: str) -> Any:
    """Attach a default parametric Geometry Nodes modifier if the object has none."""
    if not HAS_BPY or bpy is None:
        return None
    obj = bpy.data.objects.get(obj_name)
    if obj is None:
        raise ValueError(f"Object '{obj_name}' not found.")

    for mod in obj.modifiers:
        if mod.type == "NODES" and mod.node_group is not None:
            return mod

    ng = bpy.data.node_groups.new(name=f"SPARK_GeoNodes_{obj_name}", type="GeometryNodeTree")
    ng.interface.new_socket(name="Geometry", in_out="INPUT", socket_type="NodeSocketGeometry")
    ng.interface.new_socket(name="Geometry", in_out="OUTPUT", socket_type="NodeSocketGeometry")

    s_count = ng.interface.new_socket(name="Ring Count", in_out="INPUT", socket_type="NodeSocketInt")
    s_count.default_value = 8
    s_count.min_value = 3
    s_count.max_value = 24

    s_radius = ng.interface.new_socket(name="Ring Radius (mm)", in_out="INPUT", socket_type="NodeSocketFloat")
    s_radius.default_value = 30.0
    s_radius.min_value = 10.0
    s_radius.max_value = 80.0

    s_cap = ng.interface.new_socket(name="Show Center Hub", in_out="INPUT", socket_type="NodeSocketBool")
    s_cap.default_value = True

    n_in = ng.nodes.new("NodeGroupInput")
    n_in.location = (-320, 0)
    n_circle = ng.nodes.new("GeometryNodeCurvePrimitiveCircle")
    n_circle.location = (-120, -120)
    n_inst = ng.nodes.new("GeometryNodeInstanceOnPoints")
    n_inst.location = (90, 0)
    n_real = ng.nodes.new("GeometryNodeRealizeInstances")
    n_real.location = (280, 0)
    n_out = ng.nodes.new("NodeGroupOutput")
    n_out.location = (470, 0)

    ng.links.new(n_in.outputs["Ring Count"], n_circle.inputs["Resolution"])
    ng.links.new(n_circle.outputs["Curve"], n_inst.inputs["Points"])
    ng.links.new(n_in.outputs["Geometry"], n_inst.inputs["Instance"])
    ng.links.new(n_inst.outputs["Instances"], n_real.inputs["Geometry"])
    ng.links.new(n_real.outputs["Geometry"], n_out.inputs["Geometry"])

    mod = obj.modifiers.new(name="SPARK_Parametric", type="NODES")
    mod.node_group = ng
    return mod


def introspect_geonodes(obj_name: str) -> GeoNodesSchemaResponse:
    """Serialize Geometry Nodes Group Input sockets and node-tree DAG into JSON."""
    if not HAS_BPY or bpy is None:
        return GeoNodesSchemaResponse(
            objectName=obj_name,
            modifierName="SPARK_Parametric",
            sockets=[],
            nodeGraph=GeoNodeGraph(),
        )

    mod = ensure_geonodes_modifier(obj_name)
    ng = mod.node_group

    sockets: list[GeoNodeSocketSchema] = []
    for item in ng.interface.items_tree:
        if getattr(item, "item_type", None) != "SOCKET" or item.in_out != "INPUT":
            continue
        mapped_type = _SOCKET_TYPE_MAP.get(item.socket_type)
        if not mapped_type:
            continue
        raw_val = mod.get(item.identifier, item.default_value)
        if mapped_type == "VECTOR":
            val = [float(v) for v in raw_val]
            default_val = [float(v) for v in item.default_value]
        elif mapped_type == "INT":
            val = int(raw_val)
            default_val = int(item.default_value)
        elif mapped_type == "BOOLEAN":
            val = bool(raw_val)
            default_val = bool(item.default_value)
        elif mapped_type == "ENUM":
            val = str(raw_val)
            default_val = str(item.default_value)
        else:
            val = float(raw_val)
            default_val = float(item.default_value)

        sockets.append(GeoNodeSocketSchema(
            identifier=item.identifier,
            name=item.name,
            socketType=mapped_type,
            value=val,
            defaultValue=default_val,
            min=float(getattr(item, "min_value", 0.0)) if hasattr(item, "min_value") else None,
            max=float(getattr(item, "max_value", 100.0)) if hasattr(item, "max_value") else None,
        ))

    graph_nodes = []
    for node in ng.nodes:
        role = "input" if node.bl_idname == "NodeGroupInput" else "output" if node.bl_idname == "NodeGroupOutput" else "process"
        graph_nodes.append(GeoNodeGraphNode(
            id=node.name,
            label=node.label or node.name,
            blIdname=node.bl_idname,
            role=role,
            annotation=_NODE_ANNOTATIONS.get(node.bl_idname, f"Processes geometry via {node.bl_idname}."),
            x=float(node.location.x),
            y=float(node.location.y),
        ))

    graph_links = [
        GeoNodeGraphLink(
            fromNode=link.from_node.name,
            fromSocket=link.from_socket.name,
            toNode=link.to_node.name,
            toSocket=link.to_socket.name,
        )
        for link in ng.links
    ]

    return GeoNodesSchemaResponse(
        objectName=obj_name,
        modifierName=mod.name,
        sockets=sockets,
        nodeGraph=GeoNodeGraph(nodes=graph_nodes, links=graph_links),
    )


def update_geonode_params(obj_name: str, values: dict[str, Any]) -> str:
    """Update Geometry Nodes Group Input modifier properties and re-evaluate mesh."""
    if not HAS_BPY or bpy is None:
        return "# simulated geonode update"

    mod = ensure_geonodes_modifier(obj_name)
    obj = bpy.data.objects[obj_name]
    lines = [f"mod = bpy.data.objects['{obj_name}'].modifiers['{mod.name}']"]
    for ident, val in values.items():
        mod[ident] = val
        lines.append(f"mod['{ident}'] = {val!r}")
    obj.data.update()
    bpy.context.view_layer.update()
    lines.append(f"bpy.data.objects['{obj_name}'].data.update()")
    return "\n".join(lines)
