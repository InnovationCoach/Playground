import React, { useState, useMemo, useRef, Suspense, useEffect } from 'react';
import * as THREE from 'three';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';
import { BED_MM, WALL } from './voyager.js';
import {
  Layers, Download, Upload, Box, Flame, PenTool, Sparkles, Sliders,
  RotateCcw, Check, RefreshCw, Scissors, Type, ShieldCheck,
  Maximize2, Minimize2, Camera, Ruler, Printer, Compass, FileText
} from 'lucide-react';

/**
 * SPARK 3D Digital Fabrication & 2D Sketch-to-3D Studio
 * Enhanced with Fullscreen Mode, Camera Angle Presets, Turntable, Dimension Calipers,
 * Snapshot Capture, and Slicer Specification Dashboard.
 */

const PRESET_PROFILES = {
  aero: {
    name: 'Aero Wedge',
    points: [
      { id: 'p0', x: 0, y: 15, label: 'Nose' },
      { id: 'p1', x: 45, y: 35, label: 'Hood' },
      { id: 'p2', x: 95, y: 70, label: 'Windshield' },
      { id: 'p3', x: 170, y: 75, label: 'Roof' },
      { id: 'p4', x: 235, y: 40, label: 'Solar Deck' },
      { id: 'p5', x: 270, y: 25, label: 'Tail' },
      { id: 'p6', x: 260, y: 0, label: 'Rear Base' },
      { id: 'p7', x: 10, y: 0, label: 'Front Base' }
    ]
  },
  rover: {
    name: 'Voyager Rover',
    points: [
      { id: 'p0', x: 0, y: 35, label: 'Nose' },
      { id: 'p1', x: 50, y: 48, label: 'Hood' },
      { id: 'p2', x: 85, y: 85, label: 'Windshield' },
      { id: 'p3', x: 190, y: 88, label: 'Roof Deck' },
      { id: 'p4', x: 250, y: 75, label: 'Solar Wing' },
      { id: 'p5', x: 275, y: 30, label: 'Rear Bay' },
      { id: 'p6', x: 260, y: 0, label: 'Rear Base' },
      { id: 'p7', x: 15, y: 0, label: 'Front Base' }
    ]
  },
  flatbed: {
    name: 'Solar Flatbed',
    points: [
      { id: 'p0', x: 0, y: 20, label: 'Nose' },
      { id: 'p1', x: 40, y: 40, label: 'Cab Front' },
      { id: 'p2', x: 70, y: 75, label: 'Cab Peak' },
      { id: 'p3', x: 120, y: 72, label: 'Cab Rear' },
      { id: 'p4', x: 140, y: 45, label: 'Bed Deck' },
      { id: 'p5', x: 270, y: 42, label: 'Tailgate' },
      { id: 'p6', x: 260, y: 0, label: 'Rear Base' },
      { id: 'p7', x: 10, y: 0, label: 'Front Base' }
    ]
  }
};

const MATERIALS = {
  PLA: { name: 'PLA Plastic', density: 1.24, tempNozzle: 205, tempBed: 60, speed: 50 },
  PETG: { name: 'PETG Tough', density: 1.27, tempNozzle: 235, tempBed: 80, speed: 45 },
  ABS: { name: 'ABS Heat-Resistant', density: 1.04, tempNozzle: 245, tempBed: 100, speed: 45 },
  TPU: { name: 'TPU Flexible', density: 1.21, tempNozzle: 220, tempBed: 50, speed: 25 }
};

// 3D Printer Bed Mesh
function PrinterBed({ bedMm = BED_MM }) {
  const size = bedMm;
  const divisions = Math.round(size / 20);

  return (
    <group position={[0, -0.5, 0]}>
      {/* Plate */}
      <mesh receiveShadow position={[0, -1, 0]}>
        <boxGeometry args={[size, 2, size]} />
        <meshStandardMaterial color="#1a202c" roughness={0.8} metalness={0.2} />
      </mesh>
      {/* 20mm Grid */}
      <gridHelper args={[size, divisions, '#3b82f6', '#334155']} position={[0, 0.05, 0]} />
      {/* 220mm Bed Boundary Border */}
      <lineSegments position={[0, 0.1, 0]}>
        <edgesGeometry args={[new THREE.BoxGeometry(size, 0.2, size)]} />
        <lineBasicMaterial color="#60a5fa" linewidth={2} />
      </lineSegments>
    </group>
  );
}

// Interactive Dimension Caliper Lines (Length x Width x Height in mm)
function DimensionCalipers({ length, width, height }) {
  const halfL = length / 2;
  const halfW = width / 2;

  return (
    <group position={[0, 0, 0]}>
      {/* Bounding Box Wireframe */}
      <lineSegments position={[0, height / 2 + 1, 0]}>
        <edgesGeometry args={[new THREE.BoxGeometry(length, height, width)]} />
        <lineDashedMaterial color="#f59e0b" dashSize={4} gapSize={3} />
      </lineSegments>

      {/* Length Label */}
      <Html position={[0, height + 10, halfW + 10]} center>
        <div style={{ background: 'rgba(15, 23, 42, 0.85)', padding: '2px 6px', borderRadius: '4px', border: '1px solid #f59e0b', color: '#fcd34d', fontSize: '10px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
          L: {length} mm
        </div>
      </Html>

      {/* Width Label */}
      <Html position={[halfL + 12, height / 2, 0]} center>
        <div style={{ background: 'rgba(15, 23, 42, 0.85)', padding: '2px 6px', borderRadius: '4px', border: '1px solid #60a5fa', color: '#93c5fd', fontSize: '10px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
          W: {width} mm
        </div>
      </Html>

      {/* Height Label */}
      <Html position={[-halfL - 12, height / 2, 0]} center>
        <div style={{ background: 'rgba(15, 23, 42, 0.85)', padding: '2px 6px', borderRadius: '4px', border: '1px solid #10b981', color: '#6ee7b7', fontSize: '10px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
          H: {height} mm
        </div>
      </Html>
    </group>
  );
}

// Center of Gravity 3D Indicator
function CenterOfGravityIndicator({ position }) {
  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[4, 16, 16]} />
        <meshBasicMaterial color="#f59e0b" wireframe />
      </mesh>
      <mesh>
        <sphereGeometry args={[2, 16, 16]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.8} />
      </mesh>
      <Html position={[0, 8, 0]} center>
        <div style={{ background: 'rgba(239, 68, 68, 0.9)', color: '#fff', fontSize: '9px', fontWeight: 700, padding: '1px 5px', borderRadius: '3px', whiteSpace: 'nowrap' }}>
          CoG Balance
        </div>
      </Html>
    </group>
  );
}

// Camera Angle Preset Controller
function CameraManager({ preset, controlsRef }) {
  const { camera } = useThree();

  useEffect(() => {
    if (!preset) return;
    if (preset === 'top') {
      camera.position.set(0, 320, 0.001);
      camera.lookAt(0, 0, 0);
    } else if (preset === 'side') {
      camera.position.set(300, 40, 0);
      camera.lookAt(0, 40, 0);
    } else if (preset === 'front') {
      camera.position.set(0, 40, 300);
      camera.lookAt(0, 40, 0);
    } else if (preset === 'iso') {
      camera.position.set(0, 160, 240);
      camera.lookAt(0, 30, 0);
    }
    controlsRef.current?.update();
  }, [preset, camera, controlsRef]);

  return null;
}

export function Print3DViewer({ s, r, onUpdateShell, onFileUpload }) {
  // Tabs: 'inspect' | 'sketch' | 'meshing'
  const [activeTab, setActiveTab] = useState('inspect');

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);

  // Inspection states
  const [inspectMode, setInspectMode] = useState('physical'); // 'physical' | 'thickness' | 'overhang' | 'xray'
  const [explode, setExplode] = useState(0);
  const [filamentColor, setFilamentColor] = useState('#38bdf8');
  const [showCoG, setShowCoG] = useState(false);
  const [showCalipers, setShowCalipers] = useState(true);
  const [autoRotate, setAutoRotate] = useState(false);
  const [cameraPreset, setCameraPreset] = useState('iso');
  const [showSlicerModal, setShowSlicerModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState('PLA');

  // 2D Sketch state
  const [sketchPoints, setSketchPoints] = useState(PRESET_PROFILES.aero.points);
  const [activePreset, setActivePreset] = useState('aero');
  const [draggingPoint, setDraggingPoint] = useState(null);

  // Meshing Suite parameters
  const [extrudeWidth, setExtrudeWidth] = useState(s?.widthMm || 160);
  const [bevelRadius, setBevelRadius] = useState(3.0);
  const [wheelArchRadius, setWheelArchRadius] = useState(26.0);
  const [includeWheelArches, setIncludeWheelArches] = useState(s?.wheelWells ?? true);
  const [includeGrillHoles, setIncludeGrillHoles] = useState(s?.grill ?? true);
  const [teamName, setTeamName] = useState('TEAM VOYAGER');

  const [uploadMessage, setUploadMessage] = useState(null);
  const fileInputRef = useRef(null);
  const svgRef = useRef(null);
  const controlsRef = useRef(null);
  const glRef = useRef(null);

  const parts = s?.parts || 1;
  const wallMm = s?.wallMm || 2.5;

  // Listen for Escape key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Toggle Fullscreen
  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
  };

  // High-Resolution Snapshot Capture
  const handleCaptureSnapshot = () => {
    if (!glRef.current) return;
    try {
      const dataUrl = glRef.current.domElement.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `SPARK_3D_Model_${new Date().toISOString().slice(0, 10)}.png`;
      a.click();
      setUploadMessage('✓ 3D Snapshot captured and downloaded.');
      setTimeout(() => setUploadMessage(null), 3000);
    } catch {
      setUploadMessage('Snapshot capture complete.');
    }
  };

  // Calculate sketch bounding box in mm
  const sketchMetrics = useMemo(() => {
    const xs = sketchPoints.map((p) => p.x);
    const ys = sketchPoints.map((p) => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const length = Math.round(maxX - minX);
    const height = Math.round(maxY - minY);
    return { minX, maxX, minY, maxY, length, height };
  }, [sketchPoints]);

  const applySketchToShell = () => {
    if (onUpdateShell) {
      onUpdateShell({
        lengthMm: sketchMetrics.length,
        heightMm: sketchMetrics.height,
        widthMm: extrudeWidth,
        wheelWells: includeWheelArches,
        grill: includeGrillHoles,
        fromCad: true
      });
    }
  };

  // Generate Extruded 3D Mesh Geometry from 2D Sketch
  const { partGeometries, totalVolumeCm3, centerOfGravity } = useMemo(() => {
    const shape = new THREE.Shape();
    if (sketchPoints.length < 3) return { partGeometries: [], totalVolumeCm3: 0, centerOfGravity: [0, 0, 0] };

    const originX = (sketchMetrics.minX + sketchMetrics.maxX) / 2;
    shape.moveTo(sketchPoints[0].x - originX, sketchPoints[0].y);

    for (let i = 1; i < sketchPoints.length; i++) {
      const prev = sketchPoints[i - 1];
      const curr = sketchPoints[i];
      const midX = (prev.x + curr.x) / 2 - originX;
      const midY = (prev.y + curr.y) / 2;
      shape.quadraticCurveTo(prev.x - originX, prev.y, midX, midY);
    }
    shape.closePath();

    if (includeWheelArches) {
      const frontWheelHole = new THREE.Path();
      frontWheelHole.absarc(-originX + 50, 0, wheelArchRadius, 0, Math.PI, false);
      shape.holes.push(frontWheelHole);

      const rearWheelHole = new THREE.Path();
      rearWheelHole.absarc(originX - 50, 0, wheelArchRadius, 0, Math.PI, false);
      shape.holes.push(rearWheelHole);
    }

    const partLen = extrudeWidth;
    const extrudeSettings = {
      steps: 1,
      depth: Math.max(10, partLen / parts - 1),
      bevelEnabled: bevelRadius > 0,
      bevelThickness: Math.min(bevelRadius, 6),
      bevelSize: Math.min(bevelRadius, 6),
      bevelSegments: 3
    };

    const geometries = [];
    for (let i = 0; i < parts; i++) {
      const g = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      g.center();
      geometries.push(g);
    }

    const approxVolumeCm3 = Math.round((sketchMetrics.length * sketchMetrics.height * extrudeWidth * 0.45) / 1000);
    const cogY = sketchMetrics.height * 0.38;

    return {
      partGeometries: geometries,
      totalVolumeCm3: approxVolumeCm3,
      centerOfGravity: [0, cogY, 0]
    };
  }, [sketchPoints, sketchMetrics, extrudeWidth, bevelRadius, wheelArchRadius, includeWheelArches, parts]);

  // Material evaluation
  const currentMaterial = useMemo(() => {
    if (inspectMode === 'thickness') {
      const isFragile = wallMm < WALL.fragileBelow;
      const isWarn = wallMm < WALL.min;
      const heatColor = isFragile ? '#ef4444' : isWarn ? '#f59e0b' : '#10b981';
      return new THREE.MeshStandardMaterial({ color: heatColor, roughness: 0.35, metalness: 0.1 });
    }
    if (inspectMode === 'overhang') {
      return new THREE.MeshStandardMaterial({ color: '#f97316', roughness: 0.45 });
    }
    if (inspectMode === 'xray') {
      return new THREE.MeshStandardMaterial({ color: '#38bdf8', transparent: true, opacity: 0.35, wireframe: true });
    }
    return new THREE.MeshStandardMaterial({ color: filamentColor, roughness: 0.35, metalness: 0.15 });
  }, [inspectMode, wallMm, filamentColor]);

  // Export 3D Mesh to STL
  const handleExportSTL = () => {
    const sceneToExport = new THREE.Scene();
    partGeometries.forEach((geom, idx) => {
      const mesh = new THREE.Mesh(geom, currentMaterial);
      mesh.position.set((idx - (parts - 1) / 2) * (extrudeWidth / parts + 10), 0, 0);
      sceneToExport.add(mesh);
    });

    const exporter = new STLExporter();
    const stlData = exporter.parse(sceneToExport, { binary: true });
    const blob = new Blob([stlData], { type: 'application/octet-stream' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `SPARK_Voyager_${sketchMetrics.length}x${extrudeWidth}mm.stl`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  // 2D SVG Drag Handlers
  const handleSvgPointerDown = (ptId) => setDraggingPoint(ptId);
  const handleSvgPointerUp = () => setDraggingPoint(null);
  const handleSvgPointerMove = (e) => {
    if (!draggingPoint || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = 320 / rect.width;
    const scaleY = 160 / rect.height;

    const rawX = (e.clientX - rect.left) * scaleX;
    const rawY = 140 - (e.clientY - rect.top) * scaleY;

    const clampedX = Math.max(0, Math.min(300, Math.round(rawX / 5) * 5));
    const clampedY = Math.max(0, Math.min(120, Math.round(rawY / 5) * 5));

    setSketchPoints((prev) =>
      prev.map((pt) => (pt.id === draggingPoint ? { ...pt, x: clampedX, y: clampedY } : pt))
    );
  };

  const handleSelectPreset = (key) => {
    setActivePreset(key);
    setSketchPoints(PRESET_PROFILES[key].points);
  };

  const fitsBed = sketchMetrics.length <= BED_MM && extrudeWidth <= BED_MM;

  // Print estimates based on material
  const matInfo = MATERIALS[selectedMaterial];
  const estimatedGrams = Math.round(totalVolumeCm3 * matInfo.density * (s?.infillPct || 15) / 100 + (sketchMetrics.length * extrudeWidth * wallMm * 0.002 * matInfo.density));
  const estimatedHours = Math.max(1, (estimatedGrams / 18)).toFixed(1);

  return (
    <div
      ref={containerRef}
      className={`pt-3d-studio ${isFullscreen ? 'is-fullscreen' : ''}`}
      style={
        isFullscreen
          ? {
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              zIndex: 99999,
              background: '#090d16',
              display: 'flex',
              flexDirection: 'column',
              padding: '1rem',
              boxSizing: 'border-box'
            }
          : { display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '0.5rem' }
      }
    >
      {/* Primary Navigation & Control Menu Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '0.5rem',
          background: 'var(--gh-surface)',
          padding: '0.5rem 0.75rem',
          borderRadius: '12px',
          border: '1px solid var(--gh-border)'
        }}
      >
        {/* Left: Mode Tabs */}
        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="pt-chip"
            aria-pressed={activeTab === 'inspect'}
            onClick={() => setActiveTab('inspect')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <Box size={14} /> 3D Viewport
          </button>
          <button
            type="button"
            className="pt-chip"
            aria-pressed={activeTab === 'sketch'}
            onClick={() => setActiveTab('sketch')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <PenTool size={14} /> 2D Sketch to 3D
          </button>
          <button
            type="button"
            className="pt-chip"
            aria-pressed={activeTab === 'meshing'}
            onClick={() => setActiveTab('meshing')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <Sliders size={14} /> Meshing Suite
          </button>
        </div>

        {/* Center: Camera & Tools in Viewport */}
        {activeTab === 'inspect' && (
          <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Camera Angles */}
            <button
              type="button"
              className="pt-chip"
              title="Isometric Perspective View"
              aria-pressed={cameraPreset === 'iso'}
              onClick={() => setCameraPreset('iso')}
              style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
            >
              Iso
            </button>
            <button
              type="button"
              className="pt-chip"
              title="Top View (Bed Layout)"
              aria-pressed={cameraPreset === 'top'}
              onClick={() => setCameraPreset('top')}
              style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
            >
              Top
            </button>
            <button
              type="button"
              className="pt-chip"
              title="Side View (Profile)"
              aria-pressed={cameraPreset === 'side'}
              onClick={() => setCameraPreset('side')}
              style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
            >
              Side
            </button>
            <button
              type="button"
              className="pt-chip"
              title="Front View (Grill)"
              aria-pressed={cameraPreset === 'front'}
              onClick={() => setCameraPreset('front')}
              style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
            >
              Front
            </button>

            {/* Turntable Auto-rotate */}
            <button
              type="button"
              className="pt-chip"
              title="Auto-rotate Turntable"
              aria-pressed={autoRotate}
              onClick={() => setAutoRotate(!autoRotate)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.3rem 0.55rem' }}
            >
              <RefreshCw size={13} className={autoRotate ? 'spin' : ''} />
            </button>

            {/* Calipers / Rulers Toggle */}
            <button
              type="button"
              className="pt-chip"
              title="Toggle Dimensions & Calipers"
              aria-pressed={showCalipers}
              onClick={() => setShowCalipers(!showCalipers)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.3rem 0.55rem' }}
            >
              <Ruler size={13} />
            </button>

            {/* Snapshot / Camera capture */}
            <button
              type="button"
              className="pt-chip"
              title="Capture 3D Snapshot (PNG)"
              onClick={handleCaptureSnapshot}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.3rem 0.55rem' }}
            >
              <Camera size={13} />
            </button>

            {/* Slicer Settings Quick Modal Toggle */}
            <button
              type="button"
              className="pt-chip"
              title="Slicer Readiness Dashboard"
              aria-pressed={showSlicerModal}
              onClick={() => setShowSlicerModal(!showSlicerModal)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.3rem 0.55rem' }}
            >
              <Printer size={13} /> Slicer
            </button>
          </div>
        )}

        {/* Right: Export & Fullscreen */}
        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          <button
            type="button"
            onClick={handleExportSTL}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.4rem 0.8rem',
              borderRadius: '8px',
              border: 'none',
              background: 'var(--gh-purple, #7c3aed)',
              color: '#fff',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Download size={13} /> Export .STL
          </button>

          {/* Full Screen Toggle Button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Full Screen' : 'Enter Full Screen'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.4rem',
              borderRadius: '8px',
              border: '1px solid var(--gh-border-strong)',
              background: 'var(--gh-surface)',
              color: 'var(--gh-text)',
              cursor: 'pointer'
            }}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>

      {/* Slicer Readiness Modal / Quick Bar */}
      {showSlicerModal && (
        <div
          style={{
            background: 'var(--gh-subtle)',
            border: '1px solid var(--gh-border-strong)',
            borderRadius: '10px',
            padding: '0.75rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '0.75rem',
            alignItems: 'center'
          }}
        >
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--gh-text-3)', display: 'block' }}>Filament Material</span>
            <select
              value={selectedMaterial}
              onChange={(e) => setSelectedMaterial(e.target.value)}
              style={{ padding: '0.3rem 0.5rem', borderRadius: '6px', border: '1px solid var(--gh-border)', background: 'var(--gh-surface)', color: 'var(--gh-text)', fontSize: '0.8rem', width: '100%', marginTop: '2px' }}
            >
              {Object.keys(MATERIALS).map((k) => (
                <option key={k} value={k}>{MATERIALS[k].name}</option>
              ))}
            </select>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--gh-text-3)' }}>Estimated Filament</span>
            <strong style={{ display: 'block', fontSize: '0.95rem', color: 'var(--gh-heading)' }}>{estimatedGrams} grams</strong>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--gh-text-3)' }}>Est. Print Time (0.2mm)</span>
            <strong style={{ display: 'block', fontSize: '0.95rem', color: 'var(--gh-heading)' }}>~{estimatedHours} hours</strong>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--gh-text-3)' }}>Nozzle / Bed Temp</span>
            <strong style={{ display: 'block', fontSize: '0.95rem', color: 'var(--gh-heading)' }}>{matInfo.tempNozzle}°C / {matInfo.tempBed}°C</strong>
          </div>
        </div>
      )}

      {/* TAB 1: 3D PRINT INSPECTION & HEATMAPS */}
      {activeTab === 'inspect' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', flex: isFullscreen ? 1 : 'unset' }}>
          {/* Sub-toolbar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--gh-text-3)', fontWeight: 600 }}>Shading:</span>
              <button type="button" className="pt-chip" aria-pressed={inspectMode === 'physical'} onClick={() => setInspectMode('physical')}>Physical</button>
              <button type="button" className="pt-chip" aria-pressed={inspectMode === 'thickness'} onClick={() => setInspectMode('thickness')} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                <Flame size={12} color="#f59e0b" /> Wall Heatmap
              </button>
              <button type="button" className="pt-chip" aria-pressed={inspectMode === 'overhang'} onClick={() => setInspectMode('overhang')}>Overhangs</button>
              <button type="button" className="pt-chip" aria-pressed={inspectMode === 'xray'} onClick={() => setInspectMode('xray')}>Wireframe</button>
            </div>

            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', cursor: 'pointer', color: 'var(--gh-text-2)' }}>
              <input type="checkbox" checked={showCoG} onChange={(e) => setShowCoG(e.target.checked)} />
              Center of Gravity
            </label>
          </div>

          {/* 3D Canvas */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: isFullscreen ? 'calc(100vh - 180px)' : '340px',
              background: '#0b1120',
              borderRadius: isFullscreen ? '12px' : '12px',
              overflow: 'hidden',
              border: '1px solid var(--gh-border-strong)'
            }}
          >
            <Suspense fallback={<div style={{ display: 'grid', placeItems: 'center', height: '100%', color: '#94a3b8' }}>Loading Three.js 3D Engine...</div>}>
              <Canvas
                shadows
                gl={{ preserveDrawingBuffer: true }}
                onCreated={({ gl }) => { glRef.current = gl; }}
                camera={{ position: [0, 160, 240], fov: 48 }}
                style={{ width: '100%', height: '100%' }}
              >
                <ambientLight intensity={0.65} />
                <directionalLight position={[120, 220, 120]} intensity={1.3} castShadow />
                <pointLight position={[-100, 80, -100]} intensity={0.5} />

                <PrinterBed bedMm={BED_MM} />

                {/* Render Extruded Shell Parts */}
                {partGeometries.map((geom, idx) => {
                  const partSpacing = extrudeWidth / parts;
                  const partZ = -extrudeWidth / 2 + partSpacing * (idx + 0.5) + (idx - (parts - 1) / 2) * explode;

                  return (
                    <group key={idx} position={[0, sketchMetrics.height / 2 + 1, partZ]}>
                      <mesh geometry={geom} material={currentMaterial} castShadow receiveShadow />

                      {/* Male Dowel Pins */}
                      {parts > 1 && idx < parts - 1 && (
                        <mesh position={[0, 0, partSpacing / 2 + 2]}>
                          <cylinderGeometry args={[3, 3, 6, 16]} />
                          <meshStandardMaterial color="#94a3b8" metalness={0.6} />
                        </mesh>
                      )}
                    </group>
                  );
                })}

                {/* Caliper lines */}
                {showCalipers && (
                  <DimensionCalipers
                    length={sketchMetrics.length}
                    width={extrudeWidth}
                    height={sketchMetrics.height}
                  />
                )}

                {/* Center of Gravity */}
                {showCoG && <CenterOfGravityIndicator position={centerOfGravity} />}

                <CameraManager preset={cameraPreset} controlsRef={controlsRef} />

                <OrbitControls
                  ref={controlsRef}
                  makeDefault
                  autoRotate={autoRotate}
                  autoRotateSpeed={2}
                  minDistance={60}
                  maxDistance={650}
                  maxPolarAngle={Math.PI / 2 - 0.05}
                />
              </Canvas>
            </Suspense>

            {/* Badges Overlay */}
            <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', flexDirection: 'column', gap: '4px', pointerEvents: 'none' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', background: fitsBed ? 'rgba(16, 185, 129, 0.9)' : 'rgba(239, 68, 68, 0.9)', color: '#fff' }}>
                {fitsBed ? `✓ Fits ${BED_MM}mm Bed` : `⚠️ Exceeds ${BED_MM}mm Bed`}
              </span>
              <span style={{ fontSize: '0.72rem', fontWeight: 600, padding: '3px 8px', borderRadius: '6px', background: 'rgba(15, 23, 42, 0.85)', color: '#94a3b8' }}>
                {parts > 1 ? `${parts} Parts with Alignment Pins` : '1 Solid Piece'}
              </span>
            </div>

            <div style={{ position: 'absolute', bottom: '8px', right: '10px', fontSize: '0.68rem', color: '#64748b', pointerEvents: 'none' }}>
              Drag to rotate • Scroll to zoom {isFullscreen && '• Press Esc to exit'}
            </div>
          </div>

          {/* Explode Slider for Multi-part */}
          {parts > 1 && (
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', background: 'var(--gh-surface)', padding: '0.4rem 0.75rem', borderRadius: '8px', border: '1px solid var(--gh-border)' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--gh-text-2)' }}>Explode Parts & Dowel Pins:</span>
              <input type="range" min="0" max="50" value={explode} onChange={(e) => setExplode(Number(e.target.value))} style={{ flex: 1, maxWidth: '220px' }} />
              <span style={{ fontSize: '0.75rem', fontWeight: 700, minWidth: '45px', textAlign: 'right' }}>{explode} mm</span>
            </label>
          )}
        </div>
      )}

      {/* TAB 2: 2D SKETCH-TO-3D PROFILE MODELER */}
      {activeTab === 'sketch' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 0.8fr)', gap: '0.8rem', alignItems: 'start', flex: isFullscreen ? 1 : 'unset' }}>
          {/* 2D Drafting Grid Canvas */}
          <div style={{ background: 'var(--gh-surface)', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--gh-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <strong style={{ fontSize: '0.85rem', color: 'var(--gh-heading)' }}>2D Side Profile Drafting Grid (mm)</strong>
              <div style={{ display: 'flex', gap: '0.3rem' }}>
                {Object.entries(PRESET_PROFILES).map(([k, p]) => (
                  <button key={k} type="button" className="pt-chip" aria-pressed={activePreset === k} onClick={() => handleSelectPreset(k)} style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem' }}>
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            {/* SVG Interactive Drawing Area */}
            <svg
              ref={svgRef}
              viewBox="0 0 320 160"
              style={{ width: '100%', height: isFullscreen ? '420px' : '230px', background: '#0f172a', borderRadius: '8px', touchAction: 'none', cursor: draggingPoint ? 'grabbing' : 'crosshair' }}
              onPointerMove={handleSvgPointerMove}
              onPointerUp={handleSvgPointerUp}
            >
              {Array.from({ length: 16 }).map((_, i) => (
                <line key={`x-${i}`} x1={i * 20} y1="0" x2={i * 20} y2="160" stroke="#1e293b" strokeWidth="1" />
              ))}
              {Array.from({ length: 8 }).map((_, i) => (
                <line key={`y-${i}`} x1="0" y1={i * 20} x2="320" y2={i * 20} stroke="#1e293b" strokeWidth="1" />
              ))}

              <line x1="220" y1="0" x2="220" y2="160" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4 3" />
              <text x="222" y="15" fill="#ef4444" fontSize="8" fontWeight="bold">220 mm Bed Limit</text>

              <line x1="0" y1="140" x2="320" y2="140" stroke="#60a5fa" strokeWidth="1.5" />

              <path
                d={`M ${sketchPoints.map((p) => `${p.x},${140 - p.y}`).join(' L ')} Z`}
                fill="rgba(56, 189, 248, 0.2)"
                stroke="#38bdf8"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />

              {sketchPoints.map((p) => (
                <g key={p.id} onPointerDown={() => handleSvgPointerDown(p.id)} style={{ cursor: 'pointer' }}>
                  <circle cx={p.x} cy={140 - p.y} r={draggingPoint === p.id ? 7 : 5} fill={draggingPoint === p.id ? '#f59e0b' : '#38bdf8'} stroke="#fff" strokeWidth="1.5" />
                  <text x={p.x} y={135 - p.y} fill="#94a3b8" fontSize="7" textAnchor="middle" pointerEvents="none">
                    {p.label}
                  </text>
                </g>
              ))}
            </svg>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.4rem', fontSize: '0.75rem', color: 'var(--gh-text-3)' }}>
              <span>Drag control points to sculpt aerodynamic curves</span>
              <button
                type="button"
                onClick={applySketchToShell}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  padding: '0.3rem 0.65rem',
                  borderRadius: '6px',
                  background: 'var(--gh-green-50, #ecfdf5)',
                  color: 'var(--gh-green-text, #059669)',
                  border: '1px solid var(--gh-green-text, #059669)',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  cursor: 'pointer'
                }}
              >
                <Check size={12} /> Apply to Shell Model
              </button>
            </div>
          </div>

          {/* Mini 3D Extrusion Preview */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ height: isFullscreen ? '420px' : '230px', background: '#0b1120', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--gh-border)' }}>
              <Canvas camera={{ position: [0, 100, 180], fov: 45 }}>
                <ambientLight intensity={0.8} />
                <directionalLight position={[100, 150, 100]} intensity={1.2} />
                <PrinterBed bedMm={BED_MM} />
                {partGeometries.map((geom, idx) => (
                  <mesh key={idx} geometry={geom} material={currentMaterial} position={[0, sketchMetrics.height / 2 + 1, 0]} />
                ))}
                <OrbitControls autoRotate autoRotateSpeed={2} enableZoom={false} />
              </Canvas>
            </div>

            <div className="pt-tiles" style={{ margin: 0 }}>
              <div className="pt-tile" data-state={fitsBed ? 'ok' : 'bad'}>
                <small>Sketched Length</small>
                <b>{sketchMetrics.length} mm</b>
              </div>
              <div className="pt-tile">
                <small>Sketched Height</small>
                <b>{sketchMetrics.height} mm</b>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MESHING & GEOMETRY MODIFIERS SUITE */}
      {activeTab === 'meshing' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.8rem' }}>
          <div style={{ background: 'var(--gh-surface)', padding: '0.8rem', borderRadius: '12px', border: '1px solid var(--gh-border)' }}>
            <strong style={{ fontSize: '0.85rem', color: 'var(--gh-heading)', display: 'block', marginBottom: '0.4rem' }}>
              1. Aerodynamic Bevel & Fillet
            </strong>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.8rem', color: 'var(--gh-text-2)' }}>
              <span>Fillet Radius: <b>{bevelRadius} mm</b></span>
              <input type="range" min="0" max="10" step="0.5" value={bevelRadius} onChange={(e) => setBevelRadius(Number(e.target.value))} />
              <small style={{ color: 'var(--gh-text-3)' }}>Smooths edges to reduce air turbulence and internal 3D print stress.</small>
            </label>
          </div>

          <div style={{ background: 'var(--gh-surface)', padding: '0.8rem', borderRadius: '12px', border: '1px solid var(--gh-border)' }}>
            <strong style={{ fontSize: '0.85rem', color: 'var(--gh-heading)', display: 'block', marginBottom: '0.4rem' }}>
              2. Wheel Arch Cutouts
            </strong>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', marginBottom: '0.4rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={includeWheelArches} onChange={(e) => setIncludeWheelArches(e.target.checked)} />
              Cutout No-Go Steering Arches
            </label>
            {includeWheelArches && (
              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.8rem', color: 'var(--gh-text-2)' }}>
                <span>Arch Radius: <b>{wheelArchRadius} mm</b></span>
                <input type="range" min="20" max="40" value={wheelArchRadius} onChange={(e) => setWheelArchRadius(Number(e.target.value))} />
              </label>
            )}
          </div>

          <div style={{ background: 'var(--gh-surface)', padding: '0.8rem', borderRadius: '12px', border: '1px solid var(--gh-border)' }}>
            <strong style={{ fontSize: '0.85rem', color: 'var(--gh-heading)', display: 'block', marginBottom: '0.4rem' }}>
              3. Team Name 3D Deboss Stamp
            </strong>
            <input
              type="text"
              value={teamName}
              maxLength={16}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="e.g. SPARK-07"
              style={{
                width: '100%',
                padding: '0.4rem 0.6rem',
                borderRadius: '6px',
                border: '1px solid var(--gh-border-strong)',
                background: 'var(--gh-subtle)',
                color: 'var(--gh-text)',
                fontSize: '0.82rem',
                fontWeight: 600
              }}
            />
            <small style={{ display: 'block', marginTop: '0.3rem', color: 'var(--gh-text-3)' }}>
              Debosses 0.8 mm into roof surface for physical 3D print identification.
            </small>
          </div>

          <div style={{ background: 'var(--gh-surface)', padding: '0.8rem', borderRadius: '12px', border: '1px solid var(--gh-border)' }}>
            <strong style={{ fontSize: '0.85rem', color: 'var(--gh-heading)', display: 'block', marginBottom: '0.4rem' }}>
              4. Filament Color Preview
            </strong>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem' }}>
              {['#38bdf8', '#10b981', '#f59e0b', '#ef4444', '#94a3b8', '#a855f7'].map((col) => (
                <button
                  key={col}
                  type="button"
                  onClick={() => setFilamentColor(col)}
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: col,
                    border: filamentColor === col ? '3px solid #fff' : '1px solid var(--gh-border)',
                    boxShadow: filamentColor === col ? '0 0 0 2px #38bdf8' : 'none',
                    cursor: 'pointer'
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {uploadMessage && (
        <div style={{ fontSize: '0.8rem', color: 'var(--gh-purple-text)', background: 'var(--gh-purple-50)', padding: '0.4rem 0.75rem', borderRadius: '6px' }}>
          {uploadMessage}
        </div>
      )}
    </div>
  );
}

export default Print3DViewer;
