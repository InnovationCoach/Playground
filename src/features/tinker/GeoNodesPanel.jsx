import React, { useEffect, useRef, useState } from 'react';

export const DEFAULT_GEONODE_SCHEMA = {
  objectName: 'Parametric_Ring',
  modifierName: 'SPARK_Parametric',
  sockets: [
    { identifier: 'Socket_2', name: 'Ring Count', socketType: 'INT', value: 8, defaultValue: 8, min: 3, max: 20 },
    { identifier: 'Socket_3', name: 'Ring Radius (mm)', socketType: 'FLOAT', value: 36, defaultValue: 36, min: 15, max: 75 },
    { identifier: 'Socket_4', name: 'Element Height (mm)', socketType: 'FLOAT', value: 24, defaultValue: 24, min: 6, max: 60 },
    { identifier: 'Socket_5', name: 'Show Center Hub', socketType: 'BOOLEAN', value: true, defaultValue: true },
    { identifier: 'Socket_6', name: 'Profile Shape', socketType: 'ENUM', value: 'cylinder', defaultValue: 'cylinder', options: ['cylinder', 'box', 'cone'] }
  ],
  nodeGraph: {
    nodes: [
      { id: 'Group Input', label: 'Group Input', blIdname: 'NodeGroupInput', role: 'input', annotation: 'Exposes parametric sliders & toggles from the SPARK UI into the node tree.' },
      { id: 'Curve Circle', label: 'Curve Circle', blIdname: 'GeometryNodeCurvePrimitiveCircle', role: 'process', annotation: 'Generates a mathematical circle curve with N control points.' },
      { id: 'Instance on Points', label: 'Instance on Points', blIdname: 'GeometryNodeInstanceOnPoints', role: 'process', annotation: 'Copies the base mesh onto every point along the circle.' },
      { id: 'Realize Instances', label: 'Realize Instances', blIdname: 'GeometryNodeRealizeInstances', role: 'process', annotation: 'Converts lightweight instances into real 3D mesh geometry for export.' },
      { id: 'Group Output', label: 'Group Output', blIdname: 'NodeGroupOutput', role: 'output', annotation: 'Outputs the final evaluated mesh to Three.js (.glb) and 3D printing.' }
    ],
    links: [
      { fromNode: 'Group Input', fromSocket: 'Ring Count', toNode: 'Curve Circle', toSocket: 'Resolution' },
      { fromNode: 'Curve Circle', fromSocket: 'Curve', toNode: 'Instance on Points', toSocket: 'Points' },
      { fromNode: 'Group Input', fromSocket: 'Geometry', toNode: 'Instance on Points', toSocket: 'Instance' },
      { fromNode: 'Instance on Points', fromSocket: 'Instances', toNode: 'Realize Instances', toSocket: 'Geometry' },
      { fromNode: 'Realize Instances', fromSocket: 'Geometry', toNode: 'Group Output', toSocket: 'Geometry' }
    ]
  }
};

/**
 * Generates parametric ShapeSpec array from Geometry Nodes socket values
 * so local Three.js mode updates smoothly alongside the bpy worker.
 */
export function evaluateLocalGeoNodes(values) {
  const count = Math.max(3, Math.min(20, Math.round(Number(values.Socket_2 ?? 8))));
  const radius = Math.max(15, Math.min(75, Number(values.Socket_3 ?? 36)));
  const height = Math.max(6, Math.min(60, Number(values.Socket_4 ?? 24)));
  const showHub = Boolean(values.Socket_5 ?? true);
  const type = values.Socket_6 || 'cylinder';

  const generated = [];
  for (let i = 0; i < count; i += 1) {
    const angle = (i / count) * Math.PI * 2;
    generated.push({
      id: `geo_elem_${i}`,
      type,
      name: `Ring ${i + 1}`,
      x: Math.round(Math.cos(angle) * radius),
      y: Math.round(height / 2),
      z: Math.round(Math.sin(angle) * radius),
      w: 10,
      h: height,
      d: 10,
      rotX: 0,
      rotY: Math.round((-angle * 180) / Math.PI),
      rotZ: 0,
      color: '#8b5cf6',
      isHole: false
    });
  }

  if (showHub) {
    generated.push({
      id: 'geo_hub',
      type: 'cylinder',
      name: 'Center Hub',
      x: 0,
      y: Math.round(height / 4),
      z: 0,
      w: Math.round(radius * 0.65),
      h: Math.round(height / 2),
      d: Math.round(radius * 0.65),
      rotX: 0,
      rotY: 0,
      rotZ: 0,
      color: '#3b82f6',
      isHole: false
    });
  }

  return generated;
}

export function GeoNodesPanel({ schema = DEFAULT_GEONODE_SCHEMA, onParamsChange, onApplyToWorkplane }) {
  const [values, setValues] = useState(() =>
    Object.fromEntries(schema.sockets.map((s) => [s.identifier, s.value]))
  );
  const [selectedNodeId, setSelectedNodeId] = useState(schema.nodeGraph?.nodes?.[0]?.id || null);
  const debounceRef = useRef(null);

  useEffect(() => () => clearTimeout(debounceRef.current), []);

  const handleChange = (identifier, nextVal) => {
    const updated = { ...values, [identifier]: nextVal };
    setValues(updated);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (onParamsChange) onParamsChange(updated);
    }, 150);
  };

  const activeNode = schema.nodeGraph?.nodes?.find((n) => n.id === selectedNodeId);
  const roleColor = (role) => (role === 'input' ? '#10b981' : role === 'output' ? '#f59e0b' : '#a78bfa');

  return (
    <>
      <div className="tks-section">
        <div className="tks-inline" style={{ justifyContent: 'space-between' }}>
          <div>
            <h3 className="tks-heading">{schema.modifierName}</h3>
            <span className="tks-hint">Geometry Nodes modifier on {schema.objectName}</span>
          </div>
          <button
            type="button"
            className="tks-btn tks-btn--primary tks-btn--sm"
            onClick={() => onApplyToWorkplane && onApplyToWorkplane(evaluateLocalGeoNodes(values))}
          >
            Apply to Bed
          </button>
        </div>

        {/* Dynamic Socket Controls */}
        <div className="tks-sockets">
          {schema.sockets.map((sock) => {
            const val = values[sock.identifier] ?? sock.defaultValue;
            if (sock.socketType === 'BOOLEAN') {
              return (
                <label key={sock.identifier} className="tks-socket">
                  <span>{sock.name}</span>
                  <input
                    type="checkbox"
                    checked={Boolean(val)}
                    onChange={(e) => handleChange(sock.identifier, e.target.checked)}
                  />
                </label>
              );
            }
            if (sock.socketType === 'ENUM') {
              return (
                <label key={sock.identifier} className="tks-socket">
                  <span>{sock.name}</span>
                  <select
                    className="tks-select"
                    value={String(val)}
                    onChange={(e) => handleChange(sock.identifier, e.target.value)}
                  >
                    {(sock.options || []).map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </label>
              );
            }
            return (
              <label key={sock.identifier} className="tks-socket">
                <span>{sock.name}</span>
                <span className="tks-socket-val">{val}</span>
                <input
                  type="range"
                  min={sock.min ?? 0}
                  max={sock.max ?? 100}
                  step={sock.socketType === 'INT' ? 1 : 0.5}
                  value={Number(val)}
                  onChange={(e) => handleChange(sock.identifier, Number(e.target.value))}
                />
              </label>
            );
          })}
        </div>
      </div>

      {/* Interactive Annotated Node Tree DAG Visualizer */}
      <div className="tks-section">
        <div className="tks-eyebrow"><span>Node tree</span><span>Click a node to inspect</span></div>
        <div className="tks-dag">
          {(schema.nodeGraph?.nodes || []).map((node, idx, arr) => (
            <React.Fragment key={node.id}>
              <button
                type="button"
                className="tks-dag-node"
                aria-pressed={node.id === selectedNodeId}
                style={{ '--node-color': roleColor(node.role) }}
                onClick={() => setSelectedNodeId(node.id)}
              >
                <span className="tks-dag-socket" aria-hidden="true" />
                {node.label}
                <span className="tks-dag-role">{node.role}</span>
              </button>
              {idx < arr.length - 1 && <span className="tks-dag-link" aria-hidden="true" />}
            </React.Fragment>
          ))}
        </div>
        {activeNode && (
          <p className="tks-note">
            <strong>{activeNode.label}</strong> <code>{activeNode.blIdname}</code>: {activeNode.annotation}
          </p>
        )}
      </div>
    </>
  );
}
