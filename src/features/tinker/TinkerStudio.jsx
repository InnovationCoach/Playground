import React, { useState, useMemo, useRef, Suspense, useEffect } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, TransformControls } from '@react-three/drei';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';
import {
  Box, Circle, Triangle, Type, Copy, Trash2, Maximize2, Minimize2,
  Download, Save, Sparkles, Grid, Ruler,
  ArrowLeft, Layers, Check, Flame, Move, RotateCw, Scaling,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowDown
} from 'lucide-react';

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
    name: 'New Blank Workplane',
    shapes: []
  },
  keychain: {
    name: 'Custom Keychain with Loop',
    shapes: [
      { id: 'base', type: 'box', name: 'Base Tag', x: 0, y: 3, z: 0, w: 70, h: 6, d: 28, rotX: 0, rotY: 0, rotZ: 0, color: '#3b82f6', isHole: false },
      { id: 'ring_base', type: 'cylinder', name: 'Loop Ring', x: -35, y: 3, z: 0, w: 16, h: 6, d: 16, rotX: 0, rotY: 0, rotZ: 0, color: '#3b82f6', isHole: false },
      { id: 'ring_hole', type: 'cylinder', name: 'Ring Hole', x: -35, y: 3, z: 0, w: 8, h: 10, d: 8, rotX: 0, rotY: 0, rotZ: 0, color: '#ffffff', isHole: true }
    ]
  },
  pencil_holder: {
    name: 'Desktop Pencil Cup',
    shapes: [
      { id: 'cup_body', type: 'cylinder', name: 'Outer Cup', x: 0, y: 45, z: 0, w: 60, h: 90, d: 60, rotX: 0, rotY: 0, rotZ: 0, color: '#10b981', isHole: false },
      { id: 'cup_cavity', type: 'cylinder', name: 'Cup Hole', x: 0, y: 48, z: 0, w: 52, h: 86, d: 52, rotX: 0, rotY: 0, rotZ: 0, color: '#ffffff', isHole: true }
    ]
  },
  rocket: {
    name: 'Mini Space Rocket',
    shapes: [
      { id: 'body', type: 'cylinder', name: 'Fuselage', x: 0, y: 35, z: 0, w: 24, h: 70, d: 24, rotX: 0, rotY: 0, rotZ: 0, color: '#ffffff', isHole: false },
      { id: 'nose', type: 'cone', name: 'Nose Cone', x: 0, y: 85, z: 0, w: 25, h: 30, d: 25, rotX: 0, rotY: 0, rotZ: 0, color: '#ef4444', isHole: false },
      { id: 'fin1', type: 'roof', name: 'Fin 1', x: 16, y: 15, z: 0, w: 12, h: 30, d: 4, rotX: 0, rotY: 0, rotZ: 0, color: '#ef4444', isHole: false },
      { id: 'fin2', type: 'roof', name: 'Fin 2', x: -16, y: 15, z: 0, w: 12, h: 30, d: 4, rotX: 0, rotY: 0, rotZ: 0, color: '#ef4444', isHole: false }
    ]
  },
  nameplate: {
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

// Render Individual Shape Mesh with Selection & Gizmos
function ShapeObject({ shape, isSelected, onSelect, transformMode, snapGrid, onTransformChange, onDraggingChanged }) {
  const meshRef = useRef();
  const transformRef = useRef();

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
      default:
        return new THREE.BoxGeometry(shape.w, shape.h, shape.d);
    }
  }, [shape.type, shape.w, shape.h, shape.d]);

  // Material: Solid vibrant color vs Hole translucent cutter
  const material = useMemo(() => {
    if (shape.isHole) {
      return new THREE.MeshStandardMaterial({
        color: '#94a3b8',
        transparent: true,
        opacity: 0.38,
        roughness: 0.4
      });
    }
    return new THREE.MeshStandardMaterial({
      color: shape.color || '#3b82f6',
      roughness: 0.35,
      metalness: 0.15
    });
  }, [shape.color, shape.isHole]);

  // Listen for TransformControls dragging to disable camera OrbitControls
  useEffect(() => {
    const tc = transformRef.current;
    if (!tc) return;
    const onDragChange = (e) => {
      if (onDraggingChanged) onDraggingChanged(e.value);
      if (!e.value) {
        // Drag finished: ensure scale reset
        if (meshRef.current && transformMode === 'scale') {
          meshRef.current.scale.set(1, 1, 1);
        }
      }
    };
    tc.addEventListener('dragging-changed', onDragChange);
    return () => tc.removeEventListener('dragging-changed', onDragChange);
  }, [transformMode, onDraggingChanged]);

  const handleTransformChange = () => {
    if (!meshRef.current) return;

    if (transformMode === 'scale') {
      const s = meshRef.current.scale;
      // If scaled via gizmo handle, update dimensions (W, H, D in mm)
      if (Math.abs(s.x - 1) > 0.005 || Math.abs(s.y - 1) > 0.005 || Math.abs(s.z - 1) > 0.005) {
        const newW = Math.max(2, Math.round(shape.w * Math.abs(s.x)));
        const newH = Math.max(2, Math.round(shape.h * Math.abs(s.y)));
        const newD = Math.max(2, Math.round(shape.d * Math.abs(s.z)));

        // Reset mesh scale so geometry size remains true millimeter scale
        meshRef.current.scale.set(1, 1, 1);

        // Auto adjust elevation so bottom remains on workplane
        const deltaH = newH - shape.h;
        const newY = Math.max(Math.round(newH / 2), Math.round(shape.y + deltaH / 2));

        onTransformChange({
          w: newW,
          h: newH,
          d: newD,
          y: newY
        });
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
        onPointerDown={(e) => {
          e.stopPropagation();
          onSelect(shape.id);
        }}
      >
        {/* Selection Bounding Highlight */}
        {isSelected && (
          <lineSegments>
            <edgesGeometry args={[geom]} />
            <lineBasicMaterial color="#f59e0b" linewidth={3} />
          </lineSegments>
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

  const controlsRef = useRef();

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
  };

  // Delete Selected Shape
  const handleDelete = () => {
    if (!selectedId) return;
    setShapes((prev) => prev.filter((s) => s.id !== selectedId));
    setSelectedId(null);
  };

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
    setProjectName(tpl.name);
  };

  return (
    <div
      className={`sp-tinker-studio ${isFullscreen ? 'is-fullscreen' : ''}`}
      style={
        isFullscreen
          ? {
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              zIndex: 100000,
              background: '#090d16',
              display: 'flex',
              flexDirection: 'column',
              boxSizing: 'border-box',
              padding: '0.6rem 0.8rem',
              gap: '0.45rem'
            }
          : {
              display: 'flex',
              flexDirection: 'column',
              gap: '0.45rem',
              height: '100%',
              width: '100%',
              background: 'var(--gh-surface)',
              borderRadius: '12px',
              border: '1px solid var(--gh-border)',
              padding: '0.6rem 0.8rem',
              boxSizing: 'border-box',
              overflow: 'hidden'
            }
      }
    >
      {/* Top Header & Actions Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '0.5rem',
          paddingBottom: '0.45rem',
          borderBottom: '1px solid var(--gh-border)',
          flexShrink: 0
        }}
      >
        {/* Left: Back & Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                background: 'var(--gh-subtle)',
                border: '1px solid var(--gh-border)',
                padding: '0.3rem 0.65rem',
                borderRadius: '8px',
                color: 'var(--gh-text)',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.82rem'
              }}
              title="Return to Personal Creative Space"
            >
              <ArrowLeft size={15} /> Back to My Space
            </button>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Box size={20} color="#7c3aed" />
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              style={{
                font: '700 0.95rem var(--gh-font)',
                color: 'var(--gh-heading)',
                background: 'transparent',
                border: 'none',
                borderBottom: '1px dashed var(--gh-border-strong)',
                padding: '0 4px',
                outline: 'none',
                maxWidth: '220px'
              }}
              title="Click to rename design"
            />
          </div>
        </div>

        {/* Center: Transform Gizmo Mode (Move W, Rotate E, Scale R) & Alignment */}
        <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
          <button
            type="button"
            className="pt-chip"
            aria-pressed={transformMode === 'translate'}
            onClick={() => setTransformMode('translate')}
            title="Move / Translate on Workplane (W key)"
            style={{ fontSize: '0.78rem', padding: '0.3rem 0.6rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
          >
            <Move size={13} /> Move <kbd style={{ fontSize: '0.65rem', opacity: 0.7 }}>W</kbd>
          </button>
          <button
            type="button"
            className="pt-chip"
            aria-pressed={transformMode === 'rotate'}
            onClick={() => setTransformMode('rotate')}
            title="Rotate along X, Y, Z axes (E key)"
            style={{ fontSize: '0.78rem', padding: '0.3rem 0.6rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
          >
            <RotateCw size={13} /> Rotate <kbd style={{ fontSize: '0.65rem', opacity: 0.7 }}>E</kbd>
          </button>
          <button
            type="button"
            className="pt-chip"
            aria-pressed={transformMode === 'scale'}
            onClick={() => setTransformMode('scale')}
            title="Resize / Scale from all directions (R key)"
            style={{ fontSize: '0.78rem', padding: '0.3rem 0.6rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
          >
            <Scaling size={13} /> Resize / Scale <kbd style={{ fontSize: '0.65rem', opacity: 0.7 }}>R</kbd>
          </button>

          <span style={{ width: '1px', height: '18px', background: 'var(--gh-border)', margin: '0 4px' }} />

          <button
            type="button"
            className="pt-chip"
            onClick={handleDuplicate}
            disabled={!selectedShape}
            title="Duplicate Selected Shape (Ctrl+D)"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.3rem 0.55rem' }}
          >
            <Copy size={13} /> Duplicate
          </button>

          <button
            type="button"
            className="pt-chip"
            onClick={handleDelete}
            disabled={!selectedShape}
            title="Delete Selected Shape (Del key)"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.3rem 0.55rem', color: '#ef4444' }}
          >
            <Trash2 size={13} />
          </button>
        </div>

        {/* Right: Save, Export STL, Fullscreen */}
        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          <button
            type="button"
            onClick={handleSaveProject}
            className="pt-chip"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem' }}
          >
            <Save size={13} /> Save Space
          </button>

          <button
            type="button"
            onClick={handleExportSTL}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.35rem 0.75rem',
              borderRadius: '8px',
              border: 'none',
              background: 'var(--gh-purple, #7c3aed)',
              color: '#fff',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
            title="Download binary .STL for 3D printing"
          >
            <Download size={13} /> Export .STL
          </button>

          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Exit Full Screen' : 'Toggle Full Screen Workspace'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              padding: '0.35rem 0.6rem',
              borderRadius: '8px',
              border: '1px solid var(--gh-border)',
              background: isFullscreen ? '#7c3aed' : 'var(--gh-subtle)',
              color: isFullscreen ? '#fff' : 'var(--gh-text)',
              cursor: 'pointer',
              fontSize: '0.78rem',
              fontWeight: 600
            }}
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            <span>{isFullscreen ? 'Exit' : 'Full Screen'}</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div style={{ background: 'var(--gh-green-50)', color: 'var(--gh-green-text)', padding: '0.35rem 0.75rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, flexShrink: 0 }}>
          {statusMessage}
        </div>
      )}

      {/* Main Studio Work Area (Left Shelf | 3D Canvas | Right Inspector) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '84px minmax(0, 1fr) 290px',
          gap: '0.55rem',
          flex: 1,
          minHeight: 0,
          overflow: 'hidden'
        }}
      >
        {/* Left: Primitives Shape Shelf (Like Tinkercad Left Shelf) */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.4rem',
            background: 'var(--gh-subtle)',
            padding: '0.5rem 0.35rem',
            borderRadius: '12px',
            border: '1px solid var(--gh-border)',
            alignItems: 'center',
            overflowY: 'auto'
          }}
        >
          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--gh-text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Shapes
          </span>

          <button
            type="button"
            onClick={() => handleAddPrimitive('box')}
            className="pt-chip"
            title="Add 3D Solid Box"
            style={{ width: '64px', height: '56px', padding: '4px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px' }}
          >
            <Box size={22} color="#ef4444" />
            <span style={{ fontSize: '0.64rem', fontWeight: 600 }}>Box</span>
          </button>

          <button
            type="button"
            onClick={() => handleAddPrimitive('cylinder')}
            className="pt-chip"
            title="Add 3D Cylinder"
            style={{ width: '64px', height: '56px', padding: '4px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px' }}
          >
            <Circle size={22} color="#3b82f6" />
            <span style={{ fontSize: '0.64rem', fontWeight: 600 }}>Cylinder</span>
          </button>

          <button
            type="button"
            onClick={() => handleAddPrimitive('sphere')}
            className="pt-chip"
            title="Add 3D Sphere"
            style={{ width: '64px', height: '56px', padding: '4px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px' }}
          >
            <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#10b981' }} />
            <span style={{ fontSize: '0.64rem', fontWeight: 600 }}>Sphere</span>
          </button>

          <button
            type="button"
            onClick={() => handleAddPrimitive('roof')}
            className="pt-chip"
            title="Add Triangular Roof"
            style={{ width: '64px', height: '56px', padding: '4px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px' }}
          >
            <Triangle size={20} color="#f59e0b" />
            <span style={{ fontSize: '0.64rem', fontWeight: 600 }}>Roof</span>
          </button>

          <button
            type="button"
            onClick={() => handleAddPrimitive('cone')}
            className="pt-chip"
            title="Add Cone / Pyramid"
            style={{ width: '64px', height: '56px', padding: '4px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px' }}
          >
            <Flame size={20} color="#ec4899" />
            <span style={{ fontSize: '0.64rem', fontWeight: 600 }}>Cone</span>
          </button>

          <button
            type="button"
            onClick={() => handleAddPrimitive('torus')}
            className="pt-chip"
            title="Add Torus Ring"
            style={{ width: '64px', height: '56px', padding: '4px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px' }}
          >
            <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '4px solid #8b5cf6' }} />
            <span style={{ fontSize: '0.64rem', fontWeight: 600 }}>Torus</span>
          </button>

          <button
            type="button"
            onClick={() => handleAddPrimitive('wedge')}
            className="pt-chip"
            title="Add Wedge Ramp"
            style={{ width: '64px', height: '56px', padding: '4px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px' }}
          >
            <Layers size={20} color="#06b6d4" />
            <span style={{ fontSize: '0.64rem', fontWeight: 600 }}>Wedge</span>
          </button>
        </div>

        {/* Center: 3D Workplane Canvas */}
        <div
          style={{
            position: 'relative',
            background: '#0a0f1d',
            borderRadius: '12px',
            overflow: 'hidden',
            border: '1px solid var(--gh-border-strong)',
            minHeight: 0
          }}
          onPointerDown={(e) => {
            if (e.target === e.currentTarget) setSelectedId(null);
          }}
        >
          <Suspense fallback={<div style={{ display: 'grid', placeItems: 'center', height: '100%', color: '#94a3b8' }}>Loading 3D Workplane...</div>}>
            <Canvas
              shadows
              camera={{ position: [0, 140, 180], fov: 48 }}
              style={{ width: '100%', height: '100%' }}
            >
              <ambientLight intensity={0.75} />
              <directionalLight position={[100, 180, 100]} intensity={1.35} castShadow />
              <pointLight position={[-100, 80, -100]} intensity={0.5} />

              <WorkplaneGrid snapMm={snapGrid} />

              {/* Render Shape Primitives */}
              <group>
                {shapes.map((s) => (
                  <ShapeObject
                    key={s.id}
                    shape={s}
                    isSelected={s.id === selectedId}
                    onSelect={(id) => setSelectedId(id)}
                    transformMode={transformMode}
                    snapGrid={snapGrid}
                    onTransformChange={(patch) => updateSelected(patch)}
                    onDraggingChanged={(isDragging) => setIsDraggingGizmo(isDragging)}
                  />
                ))}
              </group>

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

          {/* Top-Left: Workplane Info Badges */}
          <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', gap: '6px', pointerEvents: 'none' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '3px 8px', borderRadius: '5px', background: 'rgba(59, 130, 246, 0.9)', color: '#fff' }}>
              Workplane: 200 × 200 mm
            </span>
            <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '3px 8px', borderRadius: '5px', background: 'rgba(15, 23, 42, 0.85)', color: '#cbd5e1' }}>
              {shapes.length} Objects on Bed
            </span>
          </div>

          {/* Top-Right: Camera Presets (View Cube / Angle buttons) */}
          <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '3px', background: 'rgba(15, 23, 42, 0.85)', padding: '3px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <button
              type="button"
              onClick={() => setCameraView('iso')}
              style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.68rem', fontWeight: 600, padding: '2px 6px', cursor: 'pointer' }}
              title="Isometric 3D View"
            >
              Home
            </button>
            <button
              type="button"
              onClick={() => setCameraView('top')}
              style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.68rem', fontWeight: 600, padding: '2px 6px', cursor: 'pointer' }}
              title="Top View"
            >
              Top
            </button>
            <button
              type="button"
              onClick={() => setCameraView('front')}
              style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.68rem', fontWeight: 600, padding: '2px 6px', cursor: 'pointer' }}
              title="Front View"
            >
              Front
            </button>
            <button
              type="button"
              onClick={() => setCameraView('right')}
              style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.68rem', fontWeight: 600, padding: '2px 6px', cursor: 'pointer' }}
              title="Right Side View"
            >
              Right
            </button>
          </div>

          {/* Floating On-Canvas Quick Mode Switcher for Selected Object */}
          {selectedShape && (
            <div
              style={{
                position: 'absolute',
                top: '50px',
                left: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: 'rgba(15, 23, 42, 0.92)',
                backdropFilter: 'blur(8px)',
                padding: '4px 8px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                boxShadow: '0 4px 14px rgba(0,0,0,0.4)'
              }}
            >
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#f59e0b', marginRight: '4px' }}>
                {selectedShape.name}:
              </span>
              <button
                type="button"
                onClick={() => setTransformMode('translate')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '2px',
                  background: transformMode === 'translate' ? '#3b82f6' : 'rgba(255,255,255,0.08)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '5px',
                  padding: '3px 7px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
                title="Move along X, Y, Z (W key)"
              >
                <Move size={12} /> Move
              </button>
              <button
                type="button"
                onClick={() => setTransformMode('rotate')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '2px',
                  background: transformMode === 'rotate' ? '#8b5cf6' : 'rgba(255,255,255,0.08)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '5px',
                  padding: '3px 7px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
                title="Rotate around axes (E key)"
              >
                <RotateCw size={12} /> Rotate
              </button>
              <button
                type="button"
                onClick={() => setTransformMode('scale')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '2px',
                  background: transformMode === 'scale' ? '#10b981' : 'rgba(255,255,255,0.08)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '5px',
                  padding: '3px 7px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
                title="Resize dimensions from all directions (R key)"
              >
                <Scaling size={12} /> Resize
              </button>
            </div>
          )}

          {/* Bottom Help Hint */}
          <div style={{ position: 'absolute', bottom: '8px', left: '10px', fontSize: '0.68rem', color: '#94a3b8', pointerEvents: 'none', background: 'rgba(15, 23, 42, 0.75)', padding: '2px 8px', borderRadius: '4px' }}>
            🖱️ Click any shape to select • Drag gizmo handles to move/rotate/resize • W/E/R hotkeys
          </div>
        </div>

        {/* Right: Shape Property Inspector & Solid/Hole Toggle */}
        <div
          style={{
            background: 'var(--gh-surface)',
            padding: '0.75rem',
            borderRadius: '12px',
            border: '1px solid var(--gh-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.65rem',
            overflowY: 'auto'
          }}
        >
          {selectedShape ? (
            <>
              {/* Shape Title */}
              <div>
                <span style={{ fontSize: '0.68rem', color: 'var(--gh-text-3)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Selected Object
                </span>
                <input
                  type="text"
                  value={selectedShape.name}
                  onChange={(e) => updateSelected({ name: e.target.value })}
                  style={{
                    display: 'block',
                    width: '100%',
                    font: '700 0.92rem var(--gh-font)',
                    color: 'var(--gh-heading)',
                    background: 'var(--gh-subtle)',
                    border: '1px solid var(--gh-border)',
                    borderRadius: '6px',
                    padding: '0.3rem 0.5rem',
                    marginTop: '2px'
                  }}
                />
              </div>

              {/* Solid vs Hole Cutter Mode (Tinkercad Feature) */}
              <div style={{ background: 'var(--gh-subtle)', padding: '0.45rem', borderRadius: '8px', border: '1px solid var(--gh-border)' }}>
                <span style={{ fontSize: '0.73rem', fontWeight: 700, color: 'var(--gh-heading)', display: 'block', marginBottom: '0.35rem' }}>
                  Shape Mode
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem' }}>
                  <button
                    type="button"
                    className="pt-chip"
                    aria-pressed={!selectedShape.isHole}
                    onClick={() => updateSelected({ isHole: false })}
                    style={{ justifyContent: 'center', fontSize: '0.76rem', fontWeight: 600 }}
                  >
                    🎨 Solid
                  </button>
                  <button
                    type="button"
                    className="pt-chip"
                    aria-pressed={selectedShape.isHole}
                    onClick={() => updateSelected({ isHole: true })}
                    style={{ justifyContent: 'center', fontSize: '0.76rem', fontWeight: 600 }}
                  >
                    🕳️ Hole (Cutter)
                  </button>
                </div>
              </div>

              {/* Color Swatches if Solid */}
              {!selectedShape.isHole && (
                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--gh-text-3)', fontWeight: 600 }}>Solid PLA Color</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.25rem' }}>
                    {PALETTE_COLORS.map((col) => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => updateSelected({ color: col })}
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: col,
                          border: selectedShape.color === col ? '2px solid #fff' : '1px solid var(--gh-border)',
                          boxShadow: selectedShape.color === col ? '0 0 0 2px #7c3aed' : 'none',
                          cursor: 'pointer',
                          display: 'grid',
                          placeItems: 'center'
                        }}
                      >
                        {selectedShape.color === col && <Check size={12} color={col === '#ffffff' ? '#000' : '#fff'} />}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Directional Resize Calipers (X, Y, Z mm) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.68rem', color: 'var(--gh-text-3)', fontWeight: 700, textTransform: 'uppercase' }}>
                    Dimensions & Resize (mm)
                  </span>
                  <span style={{ fontSize: '0.68rem', color: 'var(--gh-text-3)' }}>
                    All Directions
                  </span>
                </div>

                {/* Width X with Directional Nudges */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.74rem', color: 'var(--gh-text-2)' }}>Width (X)</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <button type="button" onClick={() => nudgeDimension('w', -5)} className="pt-chip" style={{ padding: '1px 4px', fontSize: '0.65rem' }} title="Shrink Width by 5mm">-5</button>
                      <button type="button" onClick={() => nudgeDimension('w', -1)} className="pt-chip" style={{ padding: '1px 4px', fontSize: '0.65rem' }} title="Shrink Width by 1mm">-1</button>
                      <input
                        type="number"
                        min="2"
                        max="180"
                        value={selectedShape.w}
                        onChange={(e) => updateSelected({ w: Number(e.target.value) })}
                        style={{ width: '48px', fontSize: '0.75rem', padding: '2px 3px', textAlign: 'center', borderRadius: '4px', border: '1px solid var(--gh-border)' }}
                      />
                      <button type="button" onClick={() => nudgeDimension('w', 1)} className="pt-chip" style={{ padding: '1px 4px', fontSize: '0.65rem' }} title="Expand Width by 1mm">+1</button>
                      <button type="button" onClick={() => nudgeDimension('w', 5)} className="pt-chip" style={{ padding: '1px 4px', fontSize: '0.65rem' }} title="Expand Width by 5mm">+5</button>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="160"
                    value={selectedShape.w}
                    onChange={(e) => updateSelected({ w: Number(e.target.value) })}
                  />
                </div>

                {/* Height Y with Directional Nudges */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.74rem', color: 'var(--gh-text-2)' }}>Height (Y)</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <button type="button" onClick={() => nudgeDimension('h', -5)} className="pt-chip" style={{ padding: '1px 4px', fontSize: '0.65rem' }} title="Shrink Height by 5mm">-5</button>
                      <button type="button" onClick={() => nudgeDimension('h', -1)} className="pt-chip" style={{ padding: '1px 4px', fontSize: '0.65rem' }} title="Shrink Height by 1mm">-1</button>
                      <input
                        type="number"
                        min="2"
                        max="180"
                        value={selectedShape.h}
                        onChange={(e) => updateSelected({ h: Number(e.target.value) })}
                        style={{ width: '48px', fontSize: '0.75rem', padding: '2px 3px', textAlign: 'center', borderRadius: '4px', border: '1px solid var(--gh-border)' }}
                      />
                      <button type="button" onClick={() => nudgeDimension('h', 1)} className="pt-chip" style={{ padding: '1px 4px', fontSize: '0.65rem' }} title="Expand Height by 1mm">+1</button>
                      <button type="button" onClick={() => nudgeDimension('h', 5)} className="pt-chip" style={{ padding: '1px 4px', fontSize: '0.65rem' }} title="Expand Height by 5mm">+5</button>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="160"
                    value={selectedShape.h}
                    onChange={(e) => {
                      const newH = Number(e.target.value);
                      const deltaH = newH - selectedShape.h;
                      updateSelected({ h: newH, y: Math.max(Math.round(newH / 2), Math.round(selectedShape.y + deltaH / 2)) });
                    }}
                  />
                </div>

                {/* Length Z with Directional Nudges */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.74rem', color: 'var(--gh-text-2)' }}>Length (Z)</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <button type="button" onClick={() => nudgeDimension('d', -5)} className="pt-chip" style={{ padding: '1px 4px', fontSize: '0.65rem' }} title="Shrink Length by 5mm">-5</button>
                      <button type="button" onClick={() => nudgeDimension('d', -1)} className="pt-chip" style={{ padding: '1px 4px', fontSize: '0.65rem' }} title="Shrink Length by 1mm">-1</button>
                      <input
                        type="number"
                        min="2"
                        max="180"
                        value={selectedShape.d}
                        onChange={(e) => updateSelected({ d: Number(e.target.value) })}
                        style={{ width: '48px', fontSize: '0.75rem', padding: '2px 3px', textAlign: 'center', borderRadius: '4px', border: '1px solid var(--gh-border)' }}
                      />
                      <button type="button" onClick={() => nudgeDimension('d', 1)} className="pt-chip" style={{ padding: '1px 4px', fontSize: '0.65rem' }} title="Expand Length by 1mm">+1</button>
                      <button type="button" onClick={() => nudgeDimension('d', 5)} className="pt-chip" style={{ padding: '1px 4px', fontSize: '0.65rem' }} title="Expand Length by 5mm">+5</button>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="160"
                    value={selectedShape.d}
                    onChange={(e) => updateSelected({ d: Number(e.target.value) })}
                  />
                </div>

                {/* Quick Uniform Scale Multipliers */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '0.2rem' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--gh-text-3)', fontWeight: 600 }}>Scale All:</span>
                  <button type="button" onClick={() => scaleUniform(0.5)} className="pt-chip" style={{ fontSize: '0.68rem', padding: '1px 5px' }} title="Scale 50%">0.5×</button>
                  <button type="button" onClick={() => scaleUniform(0.8)} className="pt-chip" style={{ fontSize: '0.68rem', padding: '1px 5px' }} title="Scale 80%">0.8×</button>
                  <button type="button" onClick={() => scaleUniform(1.25)} className="pt-chip" style={{ fontSize: '0.68rem', padding: '1px 5px' }} title="Scale 125%">1.25×</button>
                  <button type="button" onClick={() => scaleUniform(1.5)} className="pt-chip" style={{ fontSize: '0.68rem', padding: '1px 5px' }} title="Scale 150%">1.5×</button>
                  <button type="button" onClick={() => scaleUniform(2.0)} className="pt-chip" style={{ fontSize: '0.68rem', padding: '1px 5px' }} title="Double Size (200%)">2×</button>
                </div>

                {/* Elevation Above Workplane */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem', marginTop: '0.3rem' }}>
                  <span style={{ fontSize: '0.74rem', color: 'var(--gh-text-2)', width: '60px' }}>Elevation</span>
                  <input
                    type="range"
                    min="0"
                    max="140"
                    value={selectedShape.y}
                    onChange={(e) => updateSelected({ y: Number(e.target.value) })}
                    style={{ flex: 1 }}
                  />
                  <input
                    type="number"
                    min="0"
                    max="180"
                    value={selectedShape.y}
                    onChange={(e) => updateSelected({ y: Number(e.target.value) })}
                    style={{ width: '48px', fontSize: '0.75rem', padding: '2px 3px', textAlign: 'center', borderRadius: '4px', border: '1px solid var(--gh-border)' }}
                  />
                </div>

                {/* Quick Bed Alignment Actions */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.3rem', marginTop: '0.35rem' }}>
                  <button
                    type="button"
                    className="pt-chip"
                    onClick={() => updateSelected({ y: Math.round(selectedShape.h / 2) })}
                    style={{ fontSize: '0.7rem', padding: '0.25rem 0.4rem', justifyContent: 'center' }}
                    title="Drop shape flat on the workplane"
                  >
                    Drop to Bed (0 mm)
                  </button>
                  <button
                    type="button"
                    className="pt-chip"
                    onClick={() => updateSelected({ x: 0, z: 0 })}
                    style={{ fontSize: '0.7rem', padding: '0.25rem 0.4rem', justifyContent: 'center' }}
                    title="Center shape at origin (0, 0)"
                  >
                    Center on Grid
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* No Selection Empty State */
            <div style={{ display: 'grid', placeItems: 'center', height: '100%', textAlign: 'center', color: 'var(--gh-text-3)', padding: '1rem 0.5rem' }}>
              <Sparkles size={32} color="#7c3aed" style={{ opacity: 0.8 }} />
              <p style={{ fontSize: '0.82rem', margin: '0.5rem 0' }}>Click any 3D shape or add one from the left shelf to inspect & sculpt.</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Starter Templates Tray with Safe Right-Margin for Chat Bubble */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          paddingTop: '0.35rem',
          borderTop: '1px solid var(--gh-border)',
          overflowX: 'auto',
          flexShrink: 0,
          marginRight: '80px' /* Safe margin away from floating Ask Spark widget */
        }}
      >
        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--gh-text-3)', whiteSpace: 'nowrap' }}>
          Starter Templates:
        </span>
        {Object.entries(TEMPLATES).map(([k, tpl]) => (
          <button
            key={k}
            type="button"
            className="pt-chip"
            onClick={() => handleLoadTemplate(k)}
            style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem', whiteSpace: 'nowrap' }}
          >
            {tpl.name}
          </button>
        ))}
      </div>
    </div>
  );
}

export default TinkerStudio;
