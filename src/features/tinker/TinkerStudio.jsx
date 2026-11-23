import React, { useState, useMemo, useRef, Suspense, useEffect } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, TransformControls } from '@react-three/drei';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import {
  ArrowLeft, Copy, Trash2, Maximize2, Minimize2, Download, Save, Sparkles, Ruler,
  Move, RotateCw, Scaling, Check, PenTool, Car, Combine, Ungroup, ChevronDown,
  ArrowDownToLine, Crosshair, SlidersHorizontal, GraduationCap, Workflow, ScanSearch,
  WandSparkles, LayoutTemplate, ShieldCheck, Smartphone, Box
} from 'lucide-react';
import { TINKER_LESSONS, getUnlockedTools, runLocalMeshDiagnostics, autoFixLocalShapes } from './lessonToolsConfig.js';
import { GeoNodesPanel } from './GeoNodesPanel.jsx';
import { AiCopilotDrawer } from './AiCopilotDrawer.jsx';
import { SolarCarKitPanel } from './SolarCarKitPanel.jsx';
import { EngineeringDrawingModal } from './EngineeringDrawingModal.jsx';
import { combineShapes, ungroupShape } from './combineUtils.js';
import { SketchTo3DModal } from './SketchTo3DModal.jsx';
import './tinkerStudio.css';

/**
 * SPARK TinkerStudio - General 3D Creative CAD & Digital Fabrication Toolkit
 * Inspired by Tinkercad, built for K-12 and secondary learners.
 * Features:
 * - 200x200mm Workplane Grid with snap settings & millimeter markings
 * - Full-screen edge-to-edge CAD studio layout (zero menu overlap)
 * - Click any object to select, move, rotate, and resize from all directions
 * - Interactive 3D Transform Gizmos (Translate, Rotate, Scale) with hotkeys W, E, R
 * - Seamless camera control with OrbitControls disabled during gizmo manipulation
 * - Directional caliper nudges (+1/-1, +5/-5 mm) and uniform scale multipliers (0.5x, 1.25x, 1.5x, 2x)
 * - Primitive Shape Library (Box, Cylinder, Sphere, Roof, Cone, Torus, Wedge)
 * - Solid vs Hole (Negative Space / Cutters)
 * - Camera angle presets (Home Iso, Top, Front, Right)
 * - Starter Templates & Direct .STL 3D Print Exporter
 */

const PALETTE_COLORS = [
  '#ef4444', // Red
  '#3b82f6', // Blue
  '#10b981', // Green
  '#f59e0b', // Amber
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#f97316', // Orange
  '#64748b', // Slate
  '#ffffff'  // White
];

const TEMPLATES = {
  blank: {
    label: 'Blank',
    name: 'New Blank Workplane',
    shapes: []
  },
  keychain: {
    label: 'Keychain',
    name: 'Custom Keychain with Loop',
    shapes: [
      { id: 'base', type: 'box', name: 'Base Tag', x: 0, y: 3, z: 0, w: 70, h: 6, d: 28, rotX: 0, rotY: 0, rotZ: 0, color: '#3b82f6', isHole: false },
      { id: 'ring_base', type: 'cylinder', name: 'Loop Ring', x: -35, y: 3, z: 0, w: 16, h: 6, d: 16, rotX: 0, rotY: 0, rotZ: 0, color: '#3b82f6', isHole: false },
      { id: 'ring_hole', type: 'cylinder', name: 'Ring Hole', x: -35, y: 3, z: 0, w: 8, h: 10, d: 8, rotX: 0, rotY: 0, rotZ: 0, color: '#ffffff', isHole: true }
    ]
  },
  pencil_holder: {
    label: 'Pencil Cup',
    name: 'Desktop Pencil Cup',
    shapes: [
      { id: 'cup_body', type: 'cylinder', name: 'Outer Cup', x: 0, y: 45, z: 0, w: 60, h: 90, d: 60, rotX: 0, rotY: 0, rotZ: 0, color: '#10b981', isHole: false },
      { id: 'cup_cavity', type: 'cylinder', name: 'Cup Hole', x: 0, y: 48, z: 0, w: 52, h: 86, d: 52, rotX: 0, rotY: 0, rotZ: 0, color: '#ffffff', isHole: true }
    ]
  },
  rocket: {
    label: 'Rocket',
    name: 'Mini Space Rocket',
    shapes: [
      { id: 'body', type: 'cylinder', name: 'Fuselage', x: 0, y: 35, z: 0, w: 24, h: 70, d: 24, rotX: 0, rotY: 0, rotZ: 0, color: '#ffffff', isHole: false },
      { id: 'nose', type: 'cone', name: 'Nose Cone', x: 0, y: 85, z: 0, w: 25, h: 30, d: 25, rotX: 0, rotY: 0, rotZ: 0, color: '#ef4444', isHole: false },
      { id: 'fin1', type: 'roof', name: 'Fin 1', x: 16, y: 15, z: 0, w: 12, h: 30, d: 4, rotX: 0, rotY: 0, rotZ: 0, color: '#ef4444', isHole: false },
      { id: 'fin2', type: 'roof', name: 'Fin 2', x: -16, y: 15, z: 0, w: 12, h: 30, d: 4, rotX: 0, rotY: 0, rotZ: 0, color: '#ef4444', isHole: false }
    ]
  },
  nameplate: {
    label: 'Nameplate',
    name: 'Desk Nameplate & Stand',
    shapes: [
      { id: 'stand', type: 'box', name: 'Stand Base', x: 0, y: 4, z: 0, w: 100, h: 8, d: 35, rotX: 0, rotY: 0, rotZ: 0, color: '#1e293b', isHole: false },
      { id: 'face', type: 'box', name: 'Name Sign', x: 0, y: 22, z: 4, w: 90, h: 30, d: 5, rotX: -15, rotY: 0, rotZ: 0, color: '#f59e0b', isHole: false }
    ]
  }
};

// 3D Workplane Grid (Tinkercad style 200 x 200 mm)
function WorkplaneGrid({ snapMm = 1 }) {
  const size = 200;
  return (
    <group position={[0, 0, 0]}>
      {/* Build Plate Surface */}
      <mesh receiveShadow position={[0, -0.5, 0]}>
        <boxGeometry args={[size, 1, size]} />
        <meshStandardMaterial color="#111827" roughness={0.8} metalness={0.2} />
      </mesh>
      {/* Millimeter Grid */}
      <gridHelper args={[size, 20, '#3b82f6', '#374151']} position={[0, 0.05, 0]} />
      {/* Outer Border Frame */}
      <lineSegments position={[0, 0.1, 0]}>
        <edgesGeometry args={[new THREE.BoxGeometry(size, 0.2, size)]} />
        <lineBasicMaterial color="#60a5fa" linewidth={2} />
      </lineSegments>
    </group>
  );
}

// Render Individual Shape Mesh with Click Selection, Direct Workplane Drag, Corner/Height Resize Handles & Gizmos
function ShapeObject({ shape, isSelected, onSelect, transformMode, snapGrid, onTransformChange, onDraggingChanged }) {
  const meshRef = useRef();
  const transformRef = useRef();
  const [hovered, setHovered] = useState(false);
  const [activeDrag, setActiveDrag] = useState(null); // { kind: 'move' | 'corner' | 'height', ... }

  // Create geometry based on shape type
  const geom = useMemo(() => {
    switch (shape.type) {
      case 'box':
        return new THREE.BoxGeometry(shape.w, shape.h, shape.d);
      case 'cylinder':
        return new THREE.CylinderGeometry(shape.w / 2, shape.w / 2, shape.h, 32);
      case 'sphere':
        return new THREE.SphereGeometry(shape.w / 2, 32, 32);
      case 'roof': {
        const s = new THREE.Shape();
        s.moveTo(-shape.w / 2, -shape.h / 2);
        s.lineTo(0, shape.h / 2);
        s.lineTo(shape.w / 2, -shape.h / 2);
        s.closePath();
        const g = new THREE.ExtrudeGeometry(s, { depth: shape.d, bevelEnabled: false });
        g.center();
        return g;
      }
      case 'cone':
        return new THREE.ConeGeometry(shape.w / 2, shape.h, 32);
      case 'torus':
        return new THREE.TorusGeometry(shape.w / 2, Math.max(1, shape.d / 4), 16, 32);
      case 'wedge': {
        const s = new THREE.Shape();
        s.moveTo(-shape.w / 2, -shape.h / 2);
        s.lineTo(-shape.w / 2, shape.h / 2);
        s.lineTo(shape.w / 2, -shape.h / 2);
        s.closePath();
        const g = new THREE.ExtrudeGeometry(s, { depth: shape.d, bevelEnabled: false });
        g.center();
        return g;
      }
      case 'sketch': {
        const pts = Array.isArray(shape.points) && shape.points.length >= 3
          ? shape.points
          : [[-0.5, -0.5], [0.5, -0.5], [0, 0.5]];
        const s = new THREE.Shape();
        s.moveTo(pts[0][0] * shape.w, -pts[0][1] * shape.d);
        for (let i = 1; i < pts.length; i += 1) {
          s.lineTo(pts[i][0] * shape.w, -pts[i][1] * shape.d);
        }
        s.closePath();
        const g = new THREE.ExtrudeGeometry(s, {
          depth: shape.h,
          bevelEnabled: true,
          bevelThickness: 0.5,
          bevelSize: 0.4,
          bevelSegments: 2
        });
        g.rotateX(-Math.PI / 2);
        g.center();
        return g;
      }
      default:
        return new THREE.BoxGeometry(shape.w, shape.h, shape.d);
    }
  }, [shape.type, shape.w, shape.h, shape.d, shape.points]);

  useEffect(() => () => geom.dispose(), [geom]);

  // Material: Solid vibrant color vs Hole translucent cutter vs Composite hit-box
  const material = useMemo(() => {
    if (shape.type === 'composite') {
      return new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0,
        depthWrite: false
      });
    }
    if (shape.isHole) {
      return new THREE.MeshStandardMaterial({
        color: '#94a3b8',
        transparent: true,
        opacity: hovered ? 0.52 : 0.38,
        roughness: 0.4
      });
    }
    return new THREE.MeshStandardMaterial({
      color: shape.color || '#3b82f6',
      roughness: 0.35,
      metalness: 0.15,
      emissive: hovered ? '#ffffff' : '#000000',
      emissiveIntensity: hovered ? 0.12 : 0
    });
  }, [shape.type, shape.color, shape.isHole, hovered]);

  useEffect(() => () => material.dispose(), [material]);

  useEffect(() => {
    document.body.style.cursor = activeDrag ? 'grabbing' : hovered ? 'pointer' : 'auto';
    return () => { document.body.style.cursor = 'auto'; };
  }, [hovered, activeDrag]);

  // Listen for TransformControls dragging to disable camera OrbitControls (re-binds whenever selection changes)
  useEffect(() => {
    const tc = transformRef.current;
    if (!tc) return;
    const onDragChange = (e) => {
      if (onDraggingChanged) onDraggingChanged(e.value);
      if (!e.value && meshRef.current && transformMode === 'scale') {
        meshRef.current.scale.set(1, 1, 1);
      }
    };
    tc.addEventListener('dragging-changed', onDragChange);
    return () => tc.removeEventListener('dragging-changed', onDragChange);
  }, [isSelected, transformMode, onDraggingChanged]);

  // Direct pointer drag on workplane (move) or bounding-box handles (corner / height resize)
  useEffect(() => {
    if (!activeDrag) return;
    const { kind, camera, domElement, plane, startPoint, startShape, sx, sz } = activeDrag;
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const hit = new THREE.Vector3();
    const snap = (val) => Math.round(val / snapGrid) * snapGrid;

    const onMove = (ev) => {
      const rect = domElement.getBoundingClientRect();
      ndc.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(ndc, camera);
      if (!raycaster.ray.intersectPlane(plane, hit)) return;

      if (kind === 'move') {
        const dx = hit.x - startPoint.x;
        const dz = hit.z - startPoint.z;
        onTransformChange({
          x: snap(startShape.x + dx),
          z: snap(startShape.z + dz)
        });
      } else if (kind === 'corner') {
        const dx = (hit.x - startPoint.x) * sx;
        const dz = (hit.z - startPoint.z) * sz;
        const newW = Math.max(4, snap(startShape.w + dx));
        const newD = Math.max(4, snap(startShape.d + dz));
        const actualDw = newW - startShape.w;
        const actualDd = newD - startShape.d;
        onTransformChange({
          w: newW,
          d: newD,
          x: Math.round(startShape.x + (actualDw / 2) * sx),
          z: Math.round(startShape.z + (actualDd / 2) * sz)
        });
      } else if (kind === 'height') {
        const dy = hit.y - startPoint.y;
        const newH = Math.max(2, snap(startShape.h + dy));
        const deltaH = newH - startShape.h;
        onTransformChange({
          h: newH,
          y: Math.max(Math.round(newH / 2), Math.round(startShape.y + deltaH / 2))
        });
      }
    };

    const onUp = () => {
      setActiveDrag(null);
      if (onDraggingChanged) onDraggingChanged(false);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [activeDrag, snapGrid, onTransformChange, onDraggingChanged]);

  const startWorkplaneMove = (e) => {
    e.stopPropagation();
    onSelect(shape.id, Boolean(e.nativeEvent?.shiftKey));
    if (transformMode !== 'translate') return;
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -e.point.y);
    if (onDraggingChanged) onDraggingChanged(true);
    setActiveDrag({
      kind: 'move',
      camera: e.camera,
      domElement: e.nativeEvent.target,
      plane,
      startPoint: e.point.clone(),
      startShape: { ...shape }
    });
  };

  const startCornerResize = (sx, sz) => (e) => {
    e.stopPropagation();
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -e.point.y);
    if (onDraggingChanged) onDraggingChanged(true);
    setActiveDrag({
      kind: 'corner',
      sx,
      sz,
      camera: e.camera,
      domElement: e.nativeEvent.target,
      plane,
      startPoint: e.point.clone(),
      startShape: { ...shape }
    });
  };

  const startHeightResize = (e) => {
    e.stopPropagation();
    const camDir = new THREE.Vector3();
    e.camera.getWorldDirection(camDir);
    camDir.y = 0;
    if (camDir.lengthSq() < 0.001) camDir.set(0, 0, 1);
    camDir.normalize();
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(camDir, e.point);
    if (onDraggingChanged) onDraggingChanged(true);
    setActiveDrag({
      kind: 'height',
      camera: e.camera,
      domElement: e.nativeEvent.target,
      plane,
      startPoint: e.point.clone(),
      startShape: { ...shape }
    });
  };

  const handleTransformChange = () => {
    if (!meshRef.current) return;

    if (transformMode === 'scale') {
      const s = meshRef.current.scale;
      if (Math.abs(s.x - 1) > 0.005 || Math.abs(s.y - 1) > 0.005 || Math.abs(s.z - 1) > 0.005) {
        const newW = Math.max(2, Math.round(shape.w * Math.abs(s.x)));
        const newH = Math.max(2, Math.round(shape.h * Math.abs(s.y)));
        const newD = Math.max(2, Math.round(shape.d * Math.abs(s.z)));

        meshRef.current.scale.set(1, 1, 1);

        const deltaH = newH - shape.h;
        const newY = Math.max(Math.round(newH / 2), Math.round(shape.y + deltaH / 2));

        onTransformChange({ w: newW, h: newH, d: newD, y: newY });
      }
    } else if (transformMode === 'translate') {
      const pos = meshRef.current.position;
      onTransformChange({
        x: Math.round(pos.x),
        y: Math.max(0, Math.round(pos.y)),
        z: Math.round(pos.z)
      });
    } else if (transformMode === 'rotate') {
      const rot = meshRef.current.rotation;
      onTransformChange({
        rotX: Math.round(THREE.MathUtils.radToDeg(rot.x)),
        rotY: Math.round(THREE.MathUtils.radToDeg(rot.y)),
        rotZ: Math.round(THREE.MathUtils.radToDeg(rot.z))
      });
    }
  };

  const halfW = shape.w / 2;
  const halfH = shape.h / 2;
  const halfD = shape.d / 2;

  return (
    <>
      <mesh
        ref={meshRef}
        position={[shape.x, shape.y, shape.z]}
        rotation={[
          THREE.MathUtils.degToRad(shape.rotX || 0),
          THREE.MathUtils.degToRad(shape.rotY || 0),
          THREE.MathUtils.degToRad(shape.rotZ || 0)
        ]}
        geometry={geom}
        material={material}
        castShadow
        receiveShadow
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
        onPointerOut={(e) => { e.stopPropagation(); setHovered(false); }}
        onPointerDown={startWorkplaneMove}
      >
        {/* Selection Bounding Highlight */}
        {isSelected && (
          <lineSegments>
            <edgesGeometry args={[geom]} />
            <lineBasicMaterial color="#f59e0b" linewidth={3} />
          </lineSegments>
        )}

        {/* Composite Children Meshes */}
        {shape.type === 'composite' && Array.isArray(shape.children) && (
          <group
            scale={[
              (shape.w || 1) / (shape.baseW || shape.w || 1),
              (shape.h || 1) / (shape.baseH || shape.h || 1),
              (shape.d || 1) / (shape.baseD || shape.d || 1)
            ]}
          >
            {shape.children.map((child, idx) => (
              <mesh
                key={child.id || idx}
                position={[child.x || 0, child.y || 0, child.z || 0]}
                rotation={[
                  THREE.MathUtils.degToRad(child.rotX || 0),
                  THREE.MathUtils.degToRad(child.rotY || 0),
                  THREE.MathUtils.degToRad(child.rotZ || 0)
                ]}
                castShadow
                receiveShadow
              >
                {child.type === 'cylinder' ? (
                  <cylinderGeometry args={[(child.w || 10) / 2, (child.w || 10) / 2, child.h || 10, 32]} />
                ) : child.type === 'sphere' ? (
                  <sphereGeometry args={[(child.w || 10) / 2, 24, 24]} />
                ) : child.type === 'cone' ? (
                  <coneGeometry args={[(child.w || 10) / 2, child.h || 10, 24]} />
                ) : (
                  <boxGeometry args={[child.w || 10, child.h || 10, child.d || 10]} />
                )}
                <meshStandardMaterial
                  color={child.isHole ? '#94a3b8' : (child.color || '#3b82f6')}
                  transparent={Boolean(child.isHole)}
                  opacity={child.isHole ? 0.35 : 1}
                  roughness={0.35}
                />
              </mesh>
            ))}
          </group>
        )}

        {/* Tinkercad-style Direct Resize Handles (4 Base Corners for W/D + Top Handle for H) */}
        {isSelected && (
          <group>
            {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz]) => (
              <mesh
                key={`${sx}_${sz}`}
                position={[sx * halfW, -halfH + 1.5, sz * halfD]}
                onPointerDown={startCornerResize(sx, sz)}
              >
                <boxGeometry args={[3.6, 3.6, 3.6]} />
                <meshBasicMaterial color="#ffffff" />
              </mesh>
            ))}
            <mesh
              position={[0, halfH + 2.5, 0]}
              onPointerDown={startHeightResize}
            >
              <boxGeometry args={[3.8, 3.8, 3.8]} />
              <meshBasicMaterial color="#f59e0b" />
            </mesh>
          </group>
        )}
      </mesh>

      {/* Interactive Transform Gizmo (Move / Rotate / Scale from all directions) */}
      {isSelected && meshRef.current && (
        <TransformControls
          ref={transformRef}
          object={meshRef.current}
          mode={transformMode}
          size={0.8}
          translationSnap={snapGrid}
          rotationSnap={THREE.MathUtils.degToRad(15)}
          onObjectChange={handleTransformChange}
        />
      )}
    </>
  );
}

// Line-art primitive icons for the left rail (24×24, stroke = currentColor).
const PRIMITIVES = [
  { type: 'box', label: 'Box', title: 'Add 3D solid box' },
  { type: 'cylinder', label: 'Cylinder', title: 'Add 3D cylinder' },
  { type: 'sphere', label: 'Sphere', title: 'Add 3D sphere' },
  { type: 'roof', label: 'Roof', title: 'Add triangular roof' },
  { type: 'cone', label: 'Cone', title: 'Add cone' },
  { type: 'torus', label: 'Torus', title: 'Add torus ring' },
  { type: 'wedge', label: 'Wedge', title: 'Add wedge ramp' }
];

function PrimitiveIcon({ type, size = 22 }) {
  const p = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' };
  let body;
  switch (type) {
    case 'box':
      body = (<><path d="M12 3 20 7.5v9L12 21l-8-4.5v-9L12 3Z" {...p} /><path d="M4 7.5 12 12l8-4.5M12 12v9" {...p} /></>);
      break;
    case 'cylinder':
      body = (<><ellipse cx="12" cy="6" rx="7" ry="2.8" {...p} /><path d="M5 6v12c0 1.55 3.13 2.8 7 2.8s7-1.25 7-2.8V6" {...p} /></>);
      break;
    case 'sphere':
      body = (<><circle cx="12" cy="12" r="8.5" {...p} /><ellipse cx="12" cy="12" rx="8.5" ry="3.2" {...p} /><path d="M12 3.5c-2.6 2.4-2.6 14.6 0 17" {...p} opacity="0.55" /></>);
      break;
    case 'roof':
      body = (<><path d="M3 18 9 7l12 0-6 11H3Z" {...p} /><path d="M9 7 15 18" {...p} /></>);
      break;
    case 'cone':
      body = (<><path d="M12 3 5 18M12 3l7 15" {...p} /><ellipse cx="12" cy="18" rx="7" ry="2.6" {...p} /></>);
      break;
    case 'torus':
      body = (<><ellipse cx="12" cy="12" rx="9" ry="5.5" {...p} /><ellipse cx="12" cy="11.4" rx="3.6" ry="1.7" {...p} /></>);
      break;
    case 'wedge':
      body = (<><path d="M3 18h13l5-4H8L3 18Z" {...p} /><path d="M3 18V8l5 6M3 8l5-1 13 7" {...p} /></>);
      break;
    default:
      body = <rect x="4" y="4" width="16" height="16" rx="2" {...p} />;
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">{body}</svg>;
}

const DIMENSIONS = [
  { key: 'w', label: 'Width', axis: 'X' },
  { key: 'd', label: 'Depth', axis: 'Z' },
  { key: 'h', label: 'Height', axis: 'Y' }
];

const RIGHT_TABS = [
  { id: 'inspector', label: 'Inspector', Icon: SlidersHorizontal },
  { id: 'training', label: 'Training', Icon: GraduationCap },
  { id: 'geonodes', label: 'GeoNodes', Icon: Workflow },
  { id: 'solar', label: 'Solar Kit', Icon: Car }
];

export function TinkerStudio({ onBack }) {
  const [shapes, setShapes] = useState(() => {
    const saved = localStorage.getItem('spark_tinker_project');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return TEMPLATES.pencil_holder.shapes;
  });

  const [projectName, setProjectName] = useState('My 3D Creation');
  const [selectedId, setSelectedId] = useState('cup_body');
  const [transformMode, setTransformMode] = useState('translate'); // 'translate' | 'rotate' | 'scale'
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [snapGrid, setSnapGrid] = useState(1);
  const [isDraggingGizmo, setIsDraggingGizmo] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [activeLessonId, setActiveLessonId] = useState('full_cad');
  const [toolValues, setToolValues] = useState({ extrude: 5, bevel: 1.5, loop_cut: 1, inset: 2 });
  const [diagnostics, setDiagnostics] = useState(null);
  const [rightTab, setRightTab] = useState('inspector'); // 'inspector' | 'training' | 'geonodes' | 'solar'
  const [exportMenu, setExportMenu] = useState(null); // { top, right } while the Export dropdown is open
  const exportBtnRef = useRef(null);
  const exportMenuRef = useRef(null);
  const [showBlueprint, setShowBlueprint] = useState(false);
  const [showSketchModal, setShowSketchModal] = useState(false);
  const [multiSelectedIds, setMultiSelectedIds] = useState(['cup_body']);
  const [liveCode, setLiveCode] = useState('');

  const handleSelectShape = (id, isShift = false) => {
    setSelectedId(id);
    if (isShift) {
      setMultiSelectedIds((prev) =>
        prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
      );
    } else {
      setMultiSelectedIds([id]);
    }
  };

  const handleCombineSelected = () => {
    const res = combineShapes(shapes, multiSelectedIds);
    if (!res) return;
    setShapes(res.shapes);
    setSelectedId(res.combined.id);
    setMultiSelectedIds([res.combined.id]);
    setStatusMessage(`✓ Combined ${res.combined.children.length} objects into "${res.combined.name}"`);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleUngroupSelected = () => {
    const res = ungroupShape(shapes, selectedId);
    if (!res) return;
    setShapes(res.shapes);
    setSelectedId(res.restoredIds[0] || null);
    setMultiSelectedIds(res.restoredIds);
    setStatusMessage(`✓ Ungrouped into ${res.restoredIds.length} objects`);
    setTimeout(() => setStatusMessage(null), 2500);
  };

  const handleExportAr = (fmt = 'glb') => {
    if (fmt === 'usdz') {
      setStatusMessage('✓ .USDZ export ready when connected to Blender bpy worker');
      setTimeout(() => setStatusMessage(null), 3000);
      return;
    }
    const exportGroup = new THREE.Group();
    shapes.filter((s) => !s.isHole).forEach((s) => {
      const geom = new THREE.BoxGeometry(s.w, s.h, s.d);
      const mat = new THREE.MeshStandardMaterial({ color: s.color || '#3b82f6' });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.set(s.x, s.y, s.z);
      exportGroup.add(mesh);
    });
    const exporter = new GLTFExporter();
    exporter.parse(
      exportGroup,
      (result) => {
        const blob = new Blob([result], { type: 'model/gltf-binary' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${projectName.replace(/\s+/g, '_').toLowerCase()}.glb`;
        a.click();
        URL.revokeObjectURL(url);
        setStatusMessage('✓ Exported .GLB for AR / WebXR!');
        setTimeout(() => setStatusMessage(null), 3000);
      },
      () => {},
      { binary: true }
    );
  };

  const controlsRef = useRef();
  const activeLesson = TINKER_LESSONS[activeLessonId] || TINKER_LESSONS.full_cad;
  const unlockedTools = useMemo(() => getUnlockedTools(activeLessonId), [activeLessonId]);

  const handleCheckMesh = () => {
    const report = runLocalMeshDiagnostics(shapes, activeLesson.maxTriangles);
    setDiagnostics(report);
    setStatusMessage(report.passed ? `✓ Mesh passed (${report.score}/100)` : `⚠ ${report.issues.length} mesh issue(s) found`);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleAutoFix = () => {
    const fixed = autoFixLocalShapes(shapes);
    setShapes(fixed);
    const report = runLocalMeshDiagnostics(fixed, activeLesson.maxTriangles);
    setDiagnostics(report);
    setStatusMessage(`✓ Auto-Fix applied! Score: ${report.score}/100`);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleApplyUnlockedTool = (tool) => {
    if (!selectedShape) return;
    const val = toolValues[tool.id] ?? tool.defaultVal;
    if (tool.id === 'extrude') {
      const nextH = Math.max(2, Math.round(selectedShape.h + val));
      const delta = nextH - selectedShape.h;
      updateSelected({ h: nextH, y: Math.max(Math.round(nextH / 2), Math.round(selectedShape.y + delta / 2)) });
    } else if (tool.id === 'inset') {
      updateSelected({ w: Math.max(4, Math.round(selectedShape.w - val * 2)), d: Math.max(4, Math.round(selectedShape.d - val * 2)) });
    }
    setStatusMessage(`✓ Applied ${tool.label} (${val} ${tool.unit})`);
    setTimeout(() => setStatusMessage(null), 2500);
  };

  // Keyboard Shortcuts (W: Translate, E: Rotate, R: Scale, Del: Delete)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'w' || e.key === 'W') setTransformMode('translate');
      else if (e.key === 'e' || e.key === 'E') setTransformMode('rotate');
      else if (e.key === 'r' || e.key === 'R') setTransformMode('scale');
      else if (e.key === 'Delete' || e.key === 'Backspace') handleDelete();
      else if (e.key === 'd' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleDuplicate();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // Save project to LocalStorage
  const handleSaveProject = () => {
    localStorage.setItem('spark_tinker_project', JSON.stringify(shapes));
    setStatusMessage('✓ Project saved to your Creative Space!');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const selectedShape = shapes.find((s) => s.id === selectedId);

  // Add new primitive to workplane (automatically selects it!)
  const handleAddPrimitive = (type) => {
    const newId = `${type}_${Date.now().toString(36)}`;
    const newShape = {
      id: newId,
      type,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${shapes.length + 1}`,
      x: 0,
      y: type === 'sphere' || type === 'cylinder' || type === 'cone' ? 15 : 10,
      z: 0,
      w: 25,
      h: 20,
      d: 25,
      rotX: 0,
      rotY: 0,
      rotZ: 0,
      color: PALETTE_COLORS[shapes.length % PALETTE_COLORS.length],
      isHole: false
    };

    setShapes((prev) => [...prev, newShape]);
    setSelectedId(newId);
    setMultiSelectedIds([newId]);
  };

  // Duplicate Selected Shape
  const handleDuplicate = () => {
    if (!selectedShape) return;
    const newId = `${selectedShape.type}_${Date.now().toString(36)}`;
    const duplicate = {
      ...selectedShape,
      id: newId,
      name: `${selectedShape.name} (Copy)`,
      x: selectedShape.x + 12,
      z: selectedShape.z + 12
    };
    setShapes((prev) => [...prev, duplicate]);
    setSelectedId(newId);
    setMultiSelectedIds([newId]);
  };

  // Delete Selected Shape
  const handleDelete = () => {
    if (!selectedId) return;
    setShapes((prev) => prev.filter((s) => s.id !== selectedId));
    setMultiSelectedIds((prev) => prev.filter((id) => id !== selectedId));
    setSelectedId(null);
  };

  // Scene Objects checklist: tick 2+ parts on a tablet without Shift+Click
  const toggleObjectChecked = (id) => {
    if (multiSelectedIds.includes(id)) {
      const remaining = multiSelectedIds.filter((item) => item !== id);
      setMultiSelectedIds(remaining);
      if (selectedId === id) setSelectedId(remaining[remaining.length - 1] || null);
    } else {
      setMultiSelectedIds([...multiSelectedIds.filter((item) => shapes.some((s) => s.id === item)), id]);
      setSelectedId(id);
    }
  };

  const flashStatus = (msg, ms = 2500) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), ms);
  };

  // Export dropdown: anchored to the button with fixed positioning so the header's overflow can't clip it
  const toggleExportMenu = () => {
    if (exportMenu) { setExportMenu(null); return; }
    const r = exportBtnRef.current?.getBoundingClientRect();
    if (!r) return;
    setExportMenu({ top: r.bottom + 6, right: Math.max(8, window.innerWidth - r.right) });
  };

  useEffect(() => {
    if (!exportMenu) return undefined;
    const onDown = (e) => {
      if (exportMenuRef.current?.contains(e.target) || exportBtnRef.current?.contains(e.target)) return;
      setExportMenu(null);
    };
    const onKey = (e) => { if (e.key === 'Escape') setExportMenu(null); };
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', onDown);
    return () => {
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onDown);
    };
  }, [exportMenu]);

  // Update properties on selected shape
  const updateSelected = (patch) => {
    if (!selectedId) return;
    setShapes((prev) =>
      prev.map((s) => (s.id === selectedId ? { ...s, ...patch } : s))
    );
  };

  // Directional Nudge Resize (All Directions)
  const nudgeDimension = (dim, amount) => {
    if (!selectedShape) return;
    const current = selectedShape[dim] || 20;
    const updated = Math.max(2, current + amount);
    const patch = { [dim]: updated };
    if (dim === 'h') {
      const deltaH = updated - selectedShape.h;
      patch.y = Math.max(Math.round(updated / 2), Math.round(selectedShape.y + deltaH / 2));
    }
    updateSelected(patch);
  };

  // Uniform Scale Multiplier (0.5x, 1.25x, 1.5x, 2x)
  const scaleUniform = (factor) => {
    if (!selectedShape) return;
    const newW = Math.max(2, Math.round(selectedShape.w * factor));
    const newH = Math.max(2, Math.round(selectedShape.h * factor));
    const newD = Math.max(2, Math.round(selectedShape.d * factor));
    const deltaH = newH - selectedShape.h;
    updateSelected({
      w: newW,
      h: newH,
      d: newD,
      y: Math.max(Math.round(newH / 2), Math.round(selectedShape.y + deltaH / 2))
    });
  };

  // Camera presets
  const setCameraView = (view) => {
    if (!controlsRef.current) return;
    const controls = controlsRef.current;
    if (view === 'iso') {
      controls.object.position.set(0, 140, 180);
    } else if (view === 'top') {
      controls.object.position.set(0, 220, 0.001);
    } else if (view === 'front') {
      controls.object.position.set(0, 30, 220);
    } else if (view === 'right') {
      controls.object.position.set(220, 30, 0);
    }
    controls.target.set(0, 15, 0);
    controls.update();
  };

  // Export 3D Mesh to physical STL file
  const handleExportSTL = () => {
    const exportScene = new THREE.Scene();
    shapes.forEach((s) => {
      let geom;
      if (s.type === 'box') geom = new THREE.BoxGeometry(s.w, s.h, s.d);
      else if (s.type === 'cylinder') geom = new THREE.CylinderGeometry(s.w / 2, s.w / 2, s.h, 32);
      else if (s.type === 'sphere') geom = new THREE.SphereGeometry(s.w / 2, 32, 32);
      else if (s.type === 'cone') geom = new THREE.ConeGeometry(s.w / 2, s.h, 32);
      else if (s.type === 'torus') geom = new THREE.TorusGeometry(s.w / 2, Math.max(1, s.d / 4), 16, 32);
      else if (s.type === 'roof') {
        const sh = new THREE.Shape();
        sh.moveTo(-s.w / 2, -s.h / 2);
        sh.lineTo(0, s.h / 2);
        sh.lineTo(s.w / 2, -s.h / 2);
        sh.closePath();
        geom = new THREE.ExtrudeGeometry(sh, { depth: s.d, bevelEnabled: false });
        geom.center();
      } else {
        geom = new THREE.BoxGeometry(s.w, s.h, s.d);
      }

      const mat = new THREE.MeshStandardMaterial({ color: s.color });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.set(s.x, s.y, s.z);
      mesh.rotation.set(
        THREE.MathUtils.degToRad(s.rotX || 0),
        THREE.MathUtils.degToRad(s.rotY || 0),
        THREE.MathUtils.degToRad(s.rotZ || 0)
      );
      exportScene.add(mesh);
    });

    const exporter = new STLExporter();
    const stlData = exporter.parse(exportScene, { binary: true });
    const blob = new Blob([stlData], { type: 'application/octet-stream' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${projectName.replace(/\s+/g, '_')}.stl`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  // Load Template
  const handleLoadTemplate = (tplKey) => {
    const tpl = TEMPLATES[tplKey];
    if (!tpl) return;
    setShapes(tpl.shapes);
    setSelectedId(tpl.shapes[0]?.id || null);
    setMultiSelectedIds(tpl.shapes[0] ? [tpl.shapes[0].id] : []);
    setProjectName(tpl.name);
  };

  const canCombine = multiSelectedIds.length >= 2;

  const loadKitShapes = (kit) => {
    setShapes(kit.shapes);
    setProjectName(kit.name);
    setSelectedId(kit.shapes[0]?.id || null);
    setMultiSelectedIds(kit.shapes[0] ? [kit.shapes[0].id] : []);
    flashStatus(`✓ Loaded ${kit.name}`);
  };

  const addKitPart = (part) => {
    const newId = `part_${Date.now().toString(36)}`;
    const newShape = {
      id: newId,
      type: part.type,
      name: part.name,
      x: 0,
      y: part.y ?? Math.round(part.h / 2),
      z: 0,
      w: part.w,
      h: part.h,
      d: part.d,
      rotX: part.rotX || 0,
      rotY: 0,
      rotZ: 0,
      color: part.color,
      isHole: Boolean(part.isHole)
    };
    setShapes((prev) => [...prev, newShape]);
    setSelectedId(newId);
    setMultiSelectedIds([newId]);
    flashStatus(`✓ Added ${part.name}`);
  };

  const setDimension = (key, value) => {
    if (key === 'h') {
      const deltaH = value - selectedShape.h;
      updateSelected({ h: value, y: Math.max(Math.round(value / 2), Math.round(selectedShape.y + deltaH / 2)) });
    } else {
      updateSelected({ [key]: value });
    }
  };

  const renderInspectorTab = () => (
    <>
      {selectedShape ? (
        <>
          <div className="tks-section">
            <div className="tks-eyebrow"><span>Selected object</span><span>{selectedShape.type}</span></div>
            <input
              type="text"
              className="tks-field"
              aria-label="Selected object name"
              value={selectedShape.name}
              onChange={(e) => updateSelected({ name: e.target.value })}
            />
            <div className="tks-seg2" role="group" aria-label="Shape mode">
              <button
                type="button"
                className="tks-btn"
                aria-pressed={!selectedShape.isHole}
                onClick={() => updateSelected({ isHole: false })}
              >
                Solid
              </button>
              <button
                type="button"
                className="tks-btn is-hole"
                aria-pressed={Boolean(selectedShape.isHole)}
                onClick={() => updateSelected({ isHole: true })}
              >
                Hole (Cutter)
              </button>
            </div>
            {!selectedShape.isHole && (
              <div className="tks-swatches" role="group" aria-label="PLA colour">
                {PALETTE_COLORS.map((col) => (
                  <button
                    key={col}
                    type="button"
                    className="tks-swatch"
                    aria-pressed={selectedShape.color === col}
                    aria-label={`Colour ${col}`}
                    title={col}
                    onClick={() => updateSelected({ color: col })}
                    style={{ background: col }}
                  >
                    {selectedShape.color === col && <Check size={11} color={col === '#ffffff' ? '#0f172a' : '#fff'} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="tks-section">
            <div className="tks-eyebrow"><span>Dimensions</span><span>mm</span></div>
            {DIMENSIONS.map(({ key, label, axis }) => (
              <div key={key} className="tks-dim">
                <div className="tks-dim-row">
                  <span className="tks-dim-label">{label} <b>{axis}</b></span>
                  <div className="tks-stepper">
                    <button type="button" className="tks-step" onClick={() => nudgeDimension(key, -5)} title={`${label} −5 mm`}>-5</button>
                    <button type="button" className="tks-step" onClick={() => nudgeDimension(key, -1)} title={`${label} −1 mm`}>-1</button>
                    <input
                      type="number"
                      className="tks-num-input"
                      aria-label={`${label} in millimetres`}
                      min="2"
                      max="180"
                      value={selectedShape[key]}
                      onChange={(e) => setDimension(key, Number(e.target.value))}
                    />
                    <button type="button" className="tks-step" onClick={() => nudgeDimension(key, 1)} title={`${label} +1 mm`}>+1</button>
                    <button type="button" className="tks-step" onClick={() => nudgeDimension(key, 5)} title={`${label} +5 mm`}>+5</button>
                  </div>
                </div>
                <input
                  type="range"
                  aria-label={`${label} slider`}
                  min="2"
                  max="160"
                  value={selectedShape[key]}
                  onChange={(e) => setDimension(key, Number(e.target.value))}
                />
              </div>
            ))}

            <div className="tks-dim">
              <div className="tks-dim-row">
                <span className="tks-dim-label">Elevation</span>
                <input
                  type="number"
                  className="tks-num-input"
                  aria-label="Elevation in millimetres"
                  min="0"
                  max="180"
                  value={selectedShape.y}
                  onChange={(e) => updateSelected({ y: Number(e.target.value) })}
                />
              </div>
              <input
                type="range"
                aria-label="Elevation slider"
                min="0"
                max="140"
                value={selectedShape.y}
                onChange={(e) => updateSelected({ y: Number(e.target.value) })}
              />
            </div>

            <div className="tks-inline">
              <span className="tks-hint" style={{ whiteSpace: 'nowrap' }}>Scale all</span>
              <div className="tks-inline-wrap">
                {[0.5, 0.8, 1.25, 1.5, 2].map((f) => (
                  <button key={f} type="button" className="tks-step" style={{ width: 'auto', padding: '0 6px' }} onClick={() => scaleUniform(f)} title={`Scale ${Math.round(f * 100)}%`}>
                    {f}×
                  </button>
                ))}
              </div>
            </div>

            <div className="tks-grid2">
              <button
                type="button"
                className="tks-btn tks-btn--outline"
                onClick={() => updateSelected({ y: Math.round(selectedShape.h / 2) })}
                title="Drop shape flat on the workplane"
              >
                <ArrowDownToLine size={14} /> Drop to Bed
              </button>
              <button
                type="button"
                className="tks-btn tks-btn--outline"
                onClick={() => updateSelected({ x: 0, z: 0 })}
                title="Center shape at origin (0, 0)"
              >
                <Crosshair size={14} /> Center
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="tks-empty">
          <Sparkles size={26} />
          <p className="tks-hint">
            Click a shape in the viewport or add one from the left rail. Drag the gizmo handles to move, rotate or resize; W / E / R switch tools.
          </p>
        </div>
      )}

      <div className="tks-section">
        <div className="tks-eyebrow">
          <span>Scene objects</span>
          <span className="tks-num">{multiSelectedIds.length} checked</span>
        </div>
        {shapes.length ? (
          <div className="tks-objects">
            {shapes.map((s) => (
              <label key={s.id} className={`tks-object${s.id === selectedId ? ' is-active' : ''}`}>
                <input
                  type="checkbox"
                  checked={multiSelectedIds.includes(s.id)}
                  onChange={() => toggleObjectChecked(s.id)}
                />
                <span className={`tks-object-dot${s.isHole ? ' is-hole' : ''}`} style={{ background: s.color }} />
                <span className="tks-object-name">{s.name}</span>
                <span className="tks-object-dims">{s.w}×{s.d}×{s.h}</span>
              </label>
            ))}
          </div>
        ) : (
          <p className="tks-hint">The bed is empty.</p>
        )}
        <button
          type="button"
          className={`tks-btn tks-btn--block ${canCombine ? 'tks-btn--primary' : 'tks-btn--outline'}`}
          disabled={!canCombine}
          onClick={handleCombineSelected}
        >
          <Combine size={14} /> Combine {multiSelectedIds.length} checked
        </button>
      </div>
    </>
  );

  const renderTrainingTab = () => (
    <>
      <div className="tks-section">
        <div className="tks-eyebrow"><span>Training wheels</span></div>
        <select
          className="tks-select"
          aria-label="Active Tinker Lesson"
          value={activeLessonId}
          onChange={(e) => setActiveLessonId(e.target.value)}
        >
          {Object.values(TINKER_LESSONS).map((l) => (
            <option key={l.id} value={l.id}>{l.title}</option>
          ))}
        </select>
        <p className="tks-hint">{activeLesson.hint}</p>
      </div>

      <div className="tks-section">
        <div className="tks-eyebrow"><span>Unlocked bmesh tools</span></div>
        {unlockedTools.map((tool) => {
          const val = toolValues[tool.id] ?? tool.defaultVal;
          return (
            <div key={tool.id} className="tks-tool-row">
              <span>{tool.label}</span>
              <input
                type="range"
                aria-label={`${tool.label} amount`}
                min={tool.min}
                max={tool.max}
                step={tool.step}
                value={val}
                onChange={(e) => setToolValues((prev) => ({ ...prev, [tool.id]: Number(e.target.value) }))}
              />
              <button
                type="button"
                className="tks-btn tks-btn--outline tks-btn--sm tks-num"
                disabled={!selectedShape}
                onClick={() => handleApplyUnlockedTool(tool)}
                title={selectedShape ? `Apply ${tool.label} to ${selectedShape.name}` : 'Select an object first'}
              >
                {val}{tool.unit === 'cuts' ? '×' : ` ${tool.unit}`}
              </button>
            </div>
          );
        })}
        {!selectedShape && <p className="tks-hint">Select an object to apply a tool.</p>}
      </div>

      <div className="tks-section">
        <div className="tks-eyebrow"><span>Mesh check</span></div>
        <div className="tks-grid2">
          <button type="button" className="tks-btn tks-btn--outline tks-btn--cyan" onClick={handleCheckMesh}>
            <ScanSearch size={14} /> Check Mesh
          </button>
          <button
            type="button"
            className="tks-btn tks-btn--emerald"
            onClick={handleAutoFix}
            disabled={!diagnostics || diagnostics.passed}
            title="One-click fix for the issues found"
          >
            <WandSparkles size={14} /> Auto-Fix
          </button>
        </div>
        {diagnostics && (
          <>
            <div className={`tks-score${diagnostics.passed ? ' is-pass' : ''}`}>
              <span>{diagnostics.passed ? 'Print & WebGL ready' : 'Issues detected'}</span>
              <span className="tks-score-badge">{diagnostics.score}/100</span>
            </div>
            <span className="tks-hint tks-num">{diagnostics.triangleCount} triangles</span>
            {diagnostics.issues.length > 0 && (
              <ul className="tks-issues">
                {diagnostics.issues.map((iss, i) => (
                  <li key={i} className={iss.severity === 'error' ? 'is-error' : ''}>
                    <code>{iss.code}</code> {iss.explanation}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </>
  );

  return (
    <div className={`tks sp-tinker-studio ${isFullscreen ? 'is-fullscreen' : ''}`}>
      {/* ───── Single-row header ───── */}
      <header className="tks-header">
        <div className="tks-header-left">
          {onBack && (
            <button
              type="button"
              className="tks-btn tks-btn--icon"
              onClick={onBack}
              title="Back to My Space"
              aria-label="Back to My Space"
            >
              <ArrowLeft size={17} />
            </button>
          )}
          <input
            type="text"
            className="tks-title"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            aria-label="Project name"
            title="Click to rename design"
          />
          <span className="tks-status-pill tks-hide-md" title="bpy scripts are AST-sandboxed; build plate is 200 × 200 mm">
            <ShieldCheck size={12} /> AST Sandboxed <span className="tks-sep">·</span> <span className="tks-num">200×200 mm</span>
          </span>
        </div>

        <div className="tks-header-center">
          <div className="tks-segmented" role="group" aria-label="Transform tool">
            <button
              type="button"
              className="tks-btn"
              aria-pressed={transformMode === 'translate'}
              onClick={() => setTransformMode('translate')}
              title="Move on the workplane (W)"
            >
              <Move size={14} /> <span className="tks-hide-md">Move</span> <kbd className="tks-hide-lg">W</kbd>
            </button>
            <button
              type="button"
              className="tks-btn"
              aria-pressed={transformMode === 'rotate'}
              onClick={() => setTransformMode('rotate')}
              title="Rotate around X, Y, Z (E)"
            >
              <RotateCw size={14} /> <span className="tks-hide-md">Rotate</span> <kbd className="tks-hide-lg">E</kbd>
            </button>
            <button
              type="button"
              className="tks-btn"
              aria-pressed={transformMode === 'scale'}
              onClick={() => setTransformMode('scale')}
              title="Resize from all directions (R)"
            >
              <Scaling size={14} /> <span className="tks-hide-md">Resize</span> <kbd className="tks-hide-lg">R</kbd>
            </button>
          </div>

          <span className="tks-divider" />

          <button
            type="button"
            className="tks-btn"
            onClick={() => setShowSketchModal(true)}
            title="Draw a 2D sketch and extrude it to 3D"
          >
            <PenTool size={14} /> <span className="tks-hide-lg">Sketch 3D</span>
          </button>
          <button
            type="button"
            className={`tks-btn ${canCombine ? 'tks-btn--primary' : ''}`}
            disabled={!canCombine}
            onClick={handleCombineSelected}
            title="Combine 2+ checked objects (Shift+Click or tick them in Scene objects)"
          >
            <Combine size={14} /> <span className="tks-hide-lg">Combine</span> <span className="tks-count">{multiSelectedIds.length}</span>
          </button>
          {selectedShape?.type === 'composite' && (
            <button
              type="button"
              className="tks-btn"
              onClick={handleUngroupSelected}
              title="Ungroup the combined object back into parts"
            >
              <Ungroup size={14} /> <span className="tks-hide-lg">Ungroup</span>
            </button>
          )}
          <button
            type="button"
            className="tks-btn tks-btn--icon"
            onClick={handleDuplicate}
            disabled={!selectedShape}
            title="Duplicate (Ctrl+D)"
            aria-label="Duplicate selected object"
          >
            <Copy size={15} />
          </button>
          <button
            type="button"
            className="tks-btn tks-btn--icon tks-btn--danger"
            onClick={handleDelete}
            disabled={!selectedShape}
            title="Delete (Del)"
            aria-label="Delete selected object"
          >
            <Trash2 size={15} />
          </button>
        </div>

        <div className="tks-header-right">
          <button
            type="button"
            className="tks-btn tks-btn--cyan"
            aria-pressed={showBlueprint}
            onClick={() => setShowBlueprint(true)}
            title="Open the orthographic engineering drawing"
          >
            <Ruler size={15} /> <span className="tks-hide-lg">Blueprint</span>
          </button>
          <button type="button" className="tks-btn" onClick={handleSaveProject} title="Save to your Creative Space">
            <Save size={15} /> <span className="tks-hide-lg">Save</span>
          </button>
          <div className="tks-menu-wrap">
            <button
              ref={exportBtnRef}
              type="button"
              className="tks-btn tks-btn--primary"
              aria-haspopup="menu"
              aria-expanded={Boolean(exportMenu)}
              onClick={toggleExportMenu}
            >
              <Download size={15} /> Export <ChevronDown size={14} />
            </button>
          </div>
          <button
            type="button"
            className="tks-btn tks-btn--icon"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Exit full screen' : 'Full screen workspace'}
            aria-label={isFullscreen ? 'Exit full screen' : 'Full screen workspace'}
            aria-pressed={isFullscreen}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </header>

      {exportMenu && (
        <div
          ref={exportMenuRef}
          className="tks-menu"
          role="menu"
          style={{ top: exportMenu.top, right: exportMenu.right }}
        >
          <button type="button" role="menuitem" className="tks-menu-item" onClick={() => { setExportMenu(null); handleExportSTL(); }}>
            <Download size={15} />
            <span>.STL<small>Binary mesh for 3D printing</small></span>
          </button>
          <button type="button" role="menuitem" className="tks-menu-item" onClick={() => { setExportMenu(null); handleExportAr('glb'); }}>
            <Smartphone size={15} />
            <span>.GLB (AR)<small>For AR viewers and WebXR</small></span>
          </button>
          <button type="button" role="menuitem" className="tks-menu-item" onClick={() => { setExportMenu(null); handleExportAr('usdz'); }}>
            <Box size={15} />
            <span>.USDZ<small>Apple AR Quick Look (needs bpy worker)</small></span>
          </button>
        </div>
      )}

      {/* ───── Rail | Viewport | Inspector ───── */}
      <div className="tks-body">
        <nav className="tks-panel tks-rail" aria-label="Add shapes">
          <span className="tks-rail-label">Shapes</span>
          {PRIMITIVES.map((prim) => (
            <button
              key={prim.type}
              type="button"
              className="tks-rail-btn"
              onClick={() => handleAddPrimitive(prim.type)}
              title={prim.title}
              aria-label={prim.title}
            >
              <PrimitiveIcon type={prim.type} />
              <span>{prim.label}</span>
            </button>
          ))}
          <span className="tks-rail-spacer" />
          <span className="tks-rail-sep" />
          <button
            type="button"
            className="tks-rail-btn"
            onClick={() => setShowSketchModal(true)}
            title="Draw a 2D sketch and extrude it to 3D"
          >
            <PenTool size={20} />
            <span>Sketch</span>
          </button>
          <button
            type="button"
            className="tks-rail-btn"
            aria-pressed={rightTab === 'solar'}
            onClick={() => setRightTab('solar')}
            title="Solar Car engineering kits, chassis and tires"
          >
            <Car size={20} />
            <span>Solar Kit</span>
          </button>
        </nav>

        <div
          className="tks-viewport"
          onPointerDown={(e) => {
            if (e.target === e.currentTarget) setSelectedId(null);
          }}
        >
          <Suspense fallback={<div className="tks-viewport-loading">Loading 3D Workplane…</div>}>
            <Canvas
              shadows
              camera={{ position: [0, 140, 180], fov: 48 }}
              style={{ width: '100%', height: '100%' }}
              onPointerMissed={() => { setSelectedId(null); setMultiSelectedIds([]); }}
            >
              <ambientLight intensity={0.75} />
              <directionalLight position={[100, 180, 100]} intensity={1.35} castShadow />
              <pointLight position={[-100, 80, -100]} intensity={0.5} />

              <WorkplaneGrid snapMm={snapGrid} />

              <group>
                {shapes.map((s) => (
                  <ShapeObject
                    key={s.id}
                    shape={s}
                    isSelected={s.id === selectedId || multiSelectedIds.includes(s.id)}
                    onSelect={handleSelectShape}
                    transformMode={transformMode}
                    snapGrid={snapGrid}
                    onTransformChange={(patch) => updateSelected(patch)}
                    onDraggingChanged={(isDragging) => setIsDraggingGizmo(isDragging)}
                  />
                ))}
              </group>

              {/* 3D Diagnostic Error Highlight Markers */}
              {diagnostics?.issues?.flatMap((issue, idx) =>
                (issue.coordinates || []).map((coord, cIdx) => (
                  <mesh key={`diag_${idx}_${cIdx}`} position={coord}>
                    <sphereGeometry args={[2.5, 16, 16]} />
                    <meshBasicMaterial color={issue.severity === 'error' ? '#ef4444' : '#f59e0b'} />
                  </mesh>
                ))
              )}

              <OrbitControls
                ref={controlsRef}
                makeDefault
                enabled={!isDraggingGizmo}
                minDistance={30}
                maxDistance={500}
                maxPolarAngle={Math.PI / 2 - 0.02}
              />
            </Canvas>
          </Suspense>

          {/* Top-left HUD */}
          <div className="tks-hud tks-glass" aria-live="polite">
            <span className="tks-hud-item tks-hud-item--cyan tks-num">200 × 200 mm</span>
            <span className="tks-hud-sep" />
            <span className="tks-hud-item tks-num">{shapes.length} {shapes.length === 1 ? 'object' : 'objects'}</span>
            {selectedShape && (
              <>
                <span className="tks-hud-sep" />
                <span className="tks-hud-item tks-hud-item--amber tks-num">
                  {selectedShape.name}: {selectedShape.w} × {selectedShape.d} × {selectedShape.h} mm
                </span>
              </>
            )}
          </div>

          {/* Top-right view cube */}
          <div className="tks-viewcube tks-glass" role="group" aria-label="Camera view">
            <button type="button" className="tks-btn" onClick={() => setCameraView('iso')} title="Isometric 3D view">Home</button>
            <button type="button" className="tks-btn" onClick={() => setCameraView('top')} title="Top view">Top</button>
            <button type="button" className="tks-btn" onClick={() => setCameraView('front')} title="Front view">Front</button>
            <button type="button" className="tks-btn" onClick={() => setCameraView('right')} title="Right side view">Right</button>
          </div>

          {statusMessage && <div className="tks-toast" role="status">{statusMessage}</div>}

          {/* Bottom-centre AI Co-Pilot command bar */}
          <AiCopilotDrawer
            liveCode={liveCode}
            onRunPrompt={(promptText, res) => {
              setLiveCode(res.code);
              if (res.shapes) {
                setShapes(res.shapes);
                setSelectedId(res.shapes[0]?.id || null);
                setMultiSelectedIds(res.shapes[0] ? [res.shapes[0].id] : []);
              }
              flashStatus(`✓ AI Co-Pilot executed: "${promptText}"`, 3000);
            }}
            onCloudRender={(engine) => flashStatus(`${engine} cloud render queued`)}
          />
        </div>

        <aside className="tks-panel tks-inspector" aria-label="Engineering inspector">
          <div className="tks-tabs" role="tablist" aria-label="Inspector panels">
            {RIGHT_TABS.map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                role="tab"
                id={`tks-tab-${id}`}
                aria-selected={rightTab === id}
                aria-controls={`tks-panel-${id}`}
                className="tks-tab"
                onClick={() => setRightTab(id)}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>
          <div
            className="tks-tabpanel"
            role="tabpanel"
            id={`tks-panel-${rightTab}`}
            aria-labelledby={`tks-tab-${rightTab}`}
          >
            {rightTab === 'inspector' && renderInspectorTab()}
            {rightTab === 'training' && renderTrainingTab()}
            {rightTab === 'geonodes' && (
              <GeoNodesPanel
                onApplyToWorkplane={(generated) => {
                  setShapes(generated);
                  setSelectedId(generated[0]?.id || null);
                  setMultiSelectedIds(generated[0] ? [generated[0].id] : []);
                  flashStatus(`✓ Applied ${generated.length} parametric GeoNode objects`);
                }}
              />
            )}
            {rightTab === 'solar' && (
              <SolarCarKitPanel onLoadKit={loadKitShapes} onAddPart={addKitPart} />
            )}
          </div>
        </aside>
      </div>

      {/* ───── Starter templates strip ───── */}
      <div className="tks-templates">
        <span className="tks-templates-label"><LayoutTemplate size={13} /> Templates:</span>
        {Object.entries(TEMPLATES).map(([k, tpl]) => (
          <button
            key={k}
            type="button"
            className="tks-chip"
            onClick={() => handleLoadTemplate(k)}
            title={tpl.name}
          >
            {tpl.label}
          </button>
        ))}
      </div>

      {showBlueprint && (
        <EngineeringDrawingModal
          projectName={projectName}
          shapes={shapes}
          onClose={() => setShowBlueprint(false)}
        />
      )}

      {showSketchModal && (
        <SketchTo3DModal
          onExtrude={(newShape) => {
            setShapes((prev) => [...prev, newShape]);
            setSelectedId(newShape.id);
            setMultiSelectedIds([newShape.id]);
            flashStatus(`✓ Extruded "${newShape.name}" (${newShape.w}×${newShape.d}×${newShape.h} mm)`, 3000);
          }}
          onClose={() => setShowSketchModal(false)}
        />
      )}
    </div>
  );
}

export default TinkerStudio;
