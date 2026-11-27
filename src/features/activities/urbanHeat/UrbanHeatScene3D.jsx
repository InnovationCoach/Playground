/**
 * Interactive 3D Isometric City Scene for Activity 1 (Urban Heat City Designer).
 *
 * Uses InstancedMesh pooling (< 20 draw calls total) and custom GLSL shaders
 * for water caustics, heat-haze shimmer, night infrared underglow, and NE
 * sea-breeze ribbons so it runs smoothly at 60 FPS on school Chromebooks & iPads.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { COLS, ROWS, TILE_TYPES } from './urbanHeatModel.js';
import {
  TILE_SIZE,
  TILE_STEP,
  TILE_3D_SPECS,
  tileToWorld,
  getTileVisualState,
  computeWindField
} from './urbanHeat3DConstants.js';

const TOTAL_TILES = COLS * ROWS;
const DUMMY = new THREE.Object3D();
const TMP_COLOR = new THREE.Color();

// ---------------------------------------------------------------------------
// Custom GLSL Shaders
// ---------------------------------------------------------------------------

const WATER_VERTEX = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;
  varying float vWave;
  void main() {
    vUv = uv;
    vec3 pos = position;
    float w = sin(pos.x * 10.0 + uTime * 2.6) * 0.012 + cos(pos.y * 12.0 - uTime * 2.1) * 0.01;
    pos.z += w;
    vWave = w;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const WATER_FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform float uNight;
  varying vec2 vUv;
  varying float vWave;
  void main() {
    float c1 = sin((vUv.x * 14.0 + uTime * 1.4) + cos(vUv.y * 12.0 - uTime * 1.1));
    float c2 = cos((vUv.y * 16.0 - uTime * 1.6) + sin(vUv.x * 10.0 + uTime * 0.9));
    float caustic = smoothstep(0.55, 1.0, (c1 * c2) * 0.5 + 0.5);
    float edge = smoothstep(0.0, 0.12, min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y)));

    vec3 deepCol = mix(vec3(0.02, 0.45, 0.72), vec3(0.04, 0.18, 0.36), uNight);
    vec3 shallowCol = mix(vec3(0.18, 0.76, 0.94), vec3(0.08, 0.36, 0.56), uNight);
    vec3 col = mix(shallowCol, deepCol, edge);
    col += vec3(0.45, 0.88, 1.0) * caustic * mix(0.32, 0.14, uNight);
    col += vec3(0.12) * smoothstep(0.008, 0.02, vWave);
    gl_FragColor = vec4(col, 0.88);
  }
`;

const HAZE_VERTEX = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec3 pos = position;
    pos.x += sin(pos.y * 8.0 + uTime * 4.5 + position.z * 3.0) * 0.035;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const HAZE_FRAGMENT = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;
  void main() {
    float wave = sin(vUv.y * 18.0 - uTime * 5.2 + sin(vUv.x * 9.0 + uTime * 2.0));
    float band = smoothstep(0.1, 0.9, wave * 0.5 + 0.5);
    float fadeY = smoothstep(0.0, 0.25, vUv.y) * smoothstep(1.0, 0.15, vUv.y);
    float fadeX = smoothstep(0.0, 0.25, vUv.x) * smoothstep(1.0, 0.75, vUv.x);
    vec3 col = mix(vec3(1.0, 0.55, 0.15), vec3(1.0, 0.24, 0.12), vUv.y);
    float alpha = band * fadeY * fadeX * 0.34;
    gl_FragColor = vec4(col, alpha);
  }
`;

// ---------------------------------------------------------------------------
// Instanced City Layers
// ---------------------------------------------------------------------------

function CityPlinth({ isNight }) {
  const width = COLS * TILE_STEP + 0.6;
  const depth = ROWS * TILE_STEP + 0.6;
  return (
    <group position={[0, -0.2, 0]}>
      <mesh receiveShadow>
        <boxGeometry args={[width, 0.34, depth]} />
        <meshStandardMaterial
          color={isNight ? '#0b1325' : '#1e293b'}
          roughness={0.85}
          metalness={0.12}
        />
      </mesh>
      <mesh position={[0, 0.175, 0]}>
        <boxGeometry args={[width + 0.08, 0.03, depth + 0.08]} />
        <meshStandardMaterial
          color={isNight ? '#1e3a5f' : '#334155'}
          roughness={0.6}
          metalness={0.2}
        />
      </mesh>
    </group>
  );
}

/** Animated water tiles with sine-wave ripples and caustics. */
function WaterLayer({ grid, isNight }) {
  const matRef = useRef();
  const waterIndices = useMemo(
    () => grid.reduce((acc, c, i) => (c === 'W' ? [...acc, i] : acc), []),
    [grid]
  );

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uNight: { value: isNight ? 1 : 0 }
    }),
    []
  );

  useFrame((_, delta) => {
    if (!matRef.current) return;
    matRef.current.uniforms.uTime.value += Math.min(delta, 0.05);
    matRef.current.uniforms.uNight.value = THREE.MathUtils.lerp(
      matRef.current.uniforms.uNight.value,
      isNight ? 1 : 0,
      0.08
    );
  });

  if (!waterIndices.length) return null;

  return (
    <group>
      {waterIndices.map((idx) => {
        const { x, z } = tileToWorld(idx);
        return (
          <mesh
            key={idx}
            position={[x, 0.065, z]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <planeGeometry args={[TILE_SIZE * 0.94, TILE_SIZE * 0.94, 12, 12]} />
            <shaderMaterial
              ref={idx === waterIndices[0] ? matRef : undefined}
              vertexShader={WATER_VERTEX}
              fragmentShader={WATER_FRAGMENT}
              uniforms={uniforms}
              transparent
            />
          </mesh>
        );
      })}
    </group>
  );
}

/** Localized GLSL heat-haze shimmer planes above scorching tiles. */
function HeatHazeLayer({ grid, heat, view, nightRef }) {
  const matRef = useRef();
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);

  const hotIndices = useMemo(() => {
    if (!heat || (view !== 'surface' && view !== 'day')) return [];
    const out = [];
    grid.forEach((code, i) => {
      const vis = getTileVisualState(code, heat.tiles[i], view, nightRef);
      if (vis.hasHeatHaze) out.push(i);
    });
    return out;
  }, [grid, heat, view, nightRef]);

  useFrame((_, delta) => {
    uniforms.uTime.value += Math.min(delta, 0.05);
  });

  if (!hotIndices.length) return null;

  return (
    <group>
      {hotIndices.map((idx) => {
        const { x, z } = tileToWorld(idx);
        const spec = TILE_3D_SPECS[grid[idx]] || TILE_3D_SPECS.G;
        const baseY = (spec.buildingHeight || 0) + spec.elevation + 0.36;
        return (
          <group key={idx} position={[x, baseY, z]}>
            <mesh rotation={[0, Math.PI / 4, 0]}>
              <planeGeometry args={[0.72, 0.65, 6, 8]} />
              <shaderMaterial
                ref={matRef}
                vertexShader={HAZE_VERTEX}
                fragmentShader={HAZE_FRAGMENT}
                uniforms={uniforms}
                transparent
                depthWrite={false}
                side={THREE.DoubleSide}
                blending={THREE.AdditiveBlending}
              />
            </mesh>
            <mesh rotation={[0, -Math.PI / 4, 0]}>
              <planeGeometry args={[0.72, 0.65, 6, 8]} />
              <shaderMaterial
                vertexShader={HAZE_VERTEX}
                fragmentShader={HAZE_FRAGMENT}
                uniforms={uniforms}
                transparent
                depthWrite={false}
                side={THREE.DoubleSide}
                blending={THREE.AdditiveBlending}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

/** Animated NE sea-breeze ribbons reacting to building corridors & tower wakes. */
function SeaBreezeLayer({ grid, weatherId, visible }) {
  const count = 54;
  const meshRef = useRef();
  const field = useMemo(() => computeWindField(grid, weatherId), [grid, weatherId]);

  const particles = useMemo(() => {
    const arr = [];
    for (let i = 0; i < count; i += 1) {
      arr.push({
        x: (Math.random() - 0.5) * (COLS * TILE_STEP + 1.2),
        z: (Math.random() - 0.5) * (ROWS * TILE_STEP + 1.2),
        y: 0.45 + Math.random() * 0.95,
        phase: Math.random() * Math.PI * 2,
        len: 0.45 + Math.random() * 0.4
      });
    }
    return arr;
  }, []);

  useFrame((state, delta) => {
    if (!meshRef.current || !visible) return;
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;
    const halfW = (COLS * TILE_STEP) / 2 + 0.7;
    const halfD = (ROWS * TILE_STEP) / 2 + 0.7;

    for (let i = 0; i < count; i += 1) {
      const p = particles[i];
      const col = Math.max(0, Math.min(COLS - 1, Math.floor((p.x + (COLS * TILE_STEP) / 2) / TILE_STEP)));
      const row = Math.max(0, Math.min(ROWS - 1, Math.floor((p.z + (ROWS * TILE_STEP) / 2) / TILE_STEP)));
      const cell = field[row * COLS + col] || { vx: -0.7, vz: 0.7, turbulence: 0, speed: 1, coolCarry: 0 };

      const swirl = cell.turbulence > 0.42
        ? Math.sin(t * 6.5 + p.phase) * cell.turbulence * 0.95
        : Math.sin(t * 2.2 + p.phase) * 0.08;

      p.x += (cell.vx * 2.1 + swirl * 0.45) * dt;
      p.z += (cell.vz * 2.1 - swirl * 0.45) * dt;

      if (p.x < -halfW || p.z > halfD) {
        if (Math.random() > 0.45) {
          p.x = halfW;
          p.z = (Math.random() - 0.5) * (ROWS * TILE_STEP);
        } else {
          p.x = (Math.random() - 0.5) * (COLS * TILE_STEP);
          p.z = -halfD;
        }
      }

      const yaw = Math.atan2(cell.vx, cell.vz) + (cell.turbulence > 0.45 ? Math.sin(t * 7 + p.phase) * 0.65 : 0);
      const bob = Math.sin(t * 3 + p.phase) * (0.04 + cell.turbulence * 0.14);
      const stretch = p.len * (0.55 + cell.speed * 0.75) * (1 - cell.turbulence * 0.42);

      DUMMY.position.set(p.x, p.y + bob, p.z);
      DUMMY.rotation.set(0, yaw, 0);
      DUMMY.scale.set(0.035 + cell.turbulence * 0.025, 0.02, Math.max(0.14, stretch));
      DUMMY.updateMatrix();
      meshRef.current.setMatrixAt(i, DUMMY.matrix);

      if (cell.turbulence > 0.48) {
        TMP_COLOR.set('#fbbf24'); // warm amber eddy behind tall tower
      } else if (cell.coolCarry) {
        TMP_COLOR.set('#6ee7b7'); // cool mint-emerald breeze leaving park/trees
      } else {
        TMP_COLOR.set('#bae6fd'); // fresh ocean breeze cyan
      }
      meshRef.current.setColorAt(i, TMP_COLOR);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  if (!visible) return null;

  return (
    <instancedMesh ref={meshRef} args={[null, null, count]} raycast={() => null}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial
        transparent
        opacity={weatherId === 'heatwave' ? 0.25 : 0.68}
        depthWrite={false}
      />
    </instancedMesh>
  );
}

/** Floating 3D warning buoys above buildings cut off from street access. */
function WarningBuoys({ unreachable, grid }) {
  const groupRef = useRef();

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    groupRef.current.children.forEach((child, idx) => {
      child.position.y = child.userData.baseY + Math.sin(t * 4.2 + idx) * 0.1;
      child.rotation.y = t * 2.1 + idx;
    });
  });

  if (!unreachable || !unreachable.length) return null;

  return (
    <group ref={groupRef}>
      {unreachable.map((tileIdx) => {
        const { x, z } = tileToWorld(tileIdx);
        const spec = TILE_3D_SPECS[grid[tileIdx]] || TILE_3D_SPECS.B;
        const baseY = (spec.buildingHeight || 0.5) + 0.62;
        return (
          <group key={tileIdx} position={[x, baseY, z]} userData={{ baseY }}>
            <mesh>
              <octahedronGeometry args={[0.17, 0]} />
              <meshStandardMaterial color="#ef4444" emissive="#dc2626" emissiveIntensity={0.9} roughness={0.25} />
            </mesh>
            <mesh position={[0, 0.24, 0]}>
              <cylinderGeometry args={[0.035, 0.025, 0.16, 8]} />
              <meshStandardMaterial color="#fef08a" emissive="#facc15" emissiveIntensity={0.85} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

/** Floating golden markers for learner prediction tiles. */
function PredictionMarkers({ marks, grid }) {
  const groupRef = useRef();
  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    groupRef.current.children.forEach((child, i) => {
      child.position.y = child.userData.baseY + Math.sin(t * 3.4 + i) * 0.08;
      child.rotation.y = t * 1.8;
    });
  });
  if (!marks || !marks.length) return null;
  return (
    <group ref={groupRef}>
      {marks.map((idx) => {
        const { x, z } = tileToWorld(idx);
        const spec = TILE_3D_SPECS[grid[idx]] || TILE_3D_SPECS.G;
        const baseY = (spec.buildingHeight || 0.15) + 0.55;
        return (
          <mesh key={idx} position={[x, baseY, z]} userData={{ baseY }}>
            <octahedronGeometry args={[0.16, 0]} />
            <meshStandardMaterial color="#fde047" emissive="#f59e0b" emissiveIntensity={0.8} metalness={0.3} roughness={0.2} />
          </mesh>
        );
      })}
    </group>
  );
}

/** Focus-zone animated amber border pulse on the ground. */
function FocusPulseLayer({ focus }) {
  const matRef = useRef();
  useFrame((state) => {
    if (!matRef.current) return;
    matRef.current.opacity = 0.42 + Math.sin(state.clock.elapsedTime * 3.2) * 0.24;
  });

  if (!focus || !focus.length) return null;

  return (
    <group>
      {focus.map((idx) => {
        const { x, z } = tileToWorld(idx);
        return (
          <mesh key={idx} position={[x, 0.125, z]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
            <ringGeometry args={[TILE_SIZE * 0.41, TILE_SIZE * 0.49, 4]} />
            <meshBasicMaterial
              ref={idx === focus[0] ? matRef : undefined}
              color="#fde047"
              transparent
              opacity={0.55}
              depthWrite={false}
            />
          </mesh>
        );
      })}
    </group>
  );
}

/** Dust puff particle burst pool triggered whenever a tile is painted. */
function DustPuffPool({ burstSignal }) {
  const maxParticles = 48;
  const meshRef = useRef();
  const pool = useRef(
    Array.from({ length: maxParticles }, () => ({
      active: false,
      age: 0,
      x: 0, y: 0, z: 0,
      vx: 0, vy: 0, vz: 0
    }))
  );
  const cursor = useRef(0);

  useEffect(() => {
    if (!burstSignal || burstSignal.tileIndex == null) return;
    const { x, z } = tileToWorld(burstSignal.tileIndex);
    for (let k = 0; k < 6; k += 1) {
      const p = pool.current[cursor.current % maxParticles];
      cursor.current += 1;
      const angle = (k / 6) * Math.PI * 2 + Math.random() * 0.5;
      p.active = true;
      p.age = 0;
      p.x = x + Math.cos(angle) * 0.18;
      p.y = 0.22;
      p.z = z + Math.sin(angle) * 0.18;
      p.vx = Math.cos(angle) * 0.85;
      p.vy = 0.9 + Math.random() * 0.5;
      p.vz = Math.sin(angle) * 0.85;
    }
  }, [burstSignal]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const dt = Math.min(delta, 0.05);
    for (let i = 0; i < maxParticles; i += 1) {
      const p = pool.current[i];
      if (!p.active) {
        DUMMY.scale.set(0, 0, 0);
        DUMMY.updateMatrix();
        meshRef.current.setMatrixAt(i, DUMMY.matrix);
        continue;
      }
      p.age += dt;
      if (p.age > 0.48) {
        p.active = false;
        DUMMY.scale.set(0, 0, 0);
      } else {
        const life = p.age / 0.48;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.z += p.vz * dt;
        p.vy -= 1.6 * dt;
        const s = Math.sin(life * Math.PI) * 0.14;
        DUMMY.position.set(p.x, Math.max(0.08, p.y), p.z);
        DUMMY.scale.set(s, s, s);
      }
      DUMMY.updateMatrix();
      meshRef.current.setMatrixAt(i, DUMMY.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, maxParticles]} raycast={() => null}>
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color="#e2e8f0" roughness={0.95} transparent opacity={0.78} />
    </instancedMesh>
  );
}

/**
 * Core instanced 8×6 city blocks:
 * ground slabs, road markings, low-rise & tower buildings, roofs, trees,
 * shade sails, streetlights, and night thermal infrared underglow.
 */
function InstancedCity({
  grid,
  heat,
  view,
  nightRef,
  hovered,
  inspected,
  interactionMode,
  onHover,
  onTileDown,
  onTileEnter,
  onTileUp,
  onBurst
}) {
  const baseRef = useRef();
  const roadDashRef = useRef();
  const wallRef = useRef();
  const roofRef = useRef();
  const towerRef = useRef();
  const windowRef = useRef();
  const trunkRef = useRef();
  const canopyRef = useRef();
  const sailPostRef = useRef();
  const sailRef = useRef();
  const lampRef = useRef();
  const nightGlowRef = useRef();

  const prevGridRef = useRef(grid);
  const bounceRef = useRef(new Float32Array(TOTAL_TILES));
  const hoverLiftRef = useRef(new Float32Array(TOTAL_TILES));
  const paintingRef = useRef(false);

  // Detect changed tiles to trigger snap-and-bounce animation + dust puff
  useEffect(() => {
    const prev = prevGridRef.current;
    if (prev && prev.length === grid.length) {
      let lastChanged = null;
      for (let i = 0; i < TOTAL_TILES; i += 1) {
        if (prev[i] !== grid[i]) {
          bounceRef.current[i] = 1.0;
          lastChanged = i;
        }
      }
      if (lastChanged !== null) {
        onBurst?.({ tileIndex: lastChanged, ts: performance.now() });
      }
    }
    prevGridRef.current = grid;
  }, [grid, onBurst]);

  const isNight = view === 'night';

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;

    let dashCount = 0;
    let wallCount = 0;
    let roofCount = 0;
    let towerCount = 0;
    let winCount = 0;
    let trunkCount = 0;
    let canopyCount = 0;
    let postCount = 0;
    let sailCount = 0;
    let lampCount = 0;
    let glowCount = 0;

    for (let i = 0; i < TOTAL_TILES; i += 1) {
      const code = grid[i] || 'G';
      const spec = TILE_3D_SPECS[code] || TILE_3D_SPECS.G;
      const tileHeat = heat?.tiles?.[i];
      const vis = getTileVisualState(code, tileHeat, view, nightRef);
      const { x, z } = tileToWorld(i);

      // Update bounce timer & hover elevation smoothly
      if (bounceRef.current[i] > 0) {
        bounceRef.current[i] = Math.max(0, bounceRef.current[i] - dt * 2.4);
      }
      const targetHover = hovered === i ? 0.075 : 0;
      hoverLiftRef.current[i] = THREE.MathUtils.lerp(hoverLiftRef.current[i], targetHover, 0.22);

      const b = bounceRef.current[i];
      // Playful damped bounce curve
      const dropY = b > 0 ? Math.sin(b * Math.PI) * 0.28 : 0;
      const scalePop = b > 0 ? 1 + Math.sin(b * Math.PI * 2) * 0.1 : 1;
      const lift = hoverLiftRef.current[i] + dropY;

      // 1. Base ground slab
      if (baseRef.current) {
        const slabH = spec.elevation;
        DUMMY.position.set(x, slabH / 2 + lift * 0.45, z);
        DUMMY.rotation.set(0, 0, 0);
        DUMMY.scale.set(TILE_SIZE * scalePop, slabH, TILE_SIZE * scalePop);
        DUMMY.updateMatrix();
        baseRef.current.setMatrixAt(i, DUMMY.matrix);
        TMP_COLOR.set(vis.baseColor);
        if (hovered === i) TMP_COLOR.offsetHSL(0, 0, 0.08);
        baseRef.current.setColorAt(i, TMP_COLOR);
      }

      // 2. Road dashes (R, C, E)
      if ((code === 'R' || code === 'C' || code === 'E') && roadDashRef.current) {
        for (const dx of [-0.24, 0.24]) {
          DUMMY.position.set(x + dx, spec.elevation + 0.008 + lift * 0.45, z);
          DUMMY.rotation.set(0, 0, 0);
          DUMMY.scale.set(0.24, 0.012, 0.06);
          DUMMY.updateMatrix();
          roadDashRef.current.setMatrixAt(dashCount, DUMMY.matrix);
          TMP_COLOR.set(code === 'C' ? '#ffffff' : '#e2e8f0');
          roadDashRef.current.setColorAt(dashCount, TMP_COLOR);
          dashCount += 1;
        }
        // Streetlights on roads in night mode
        if (isNight && lampRef.current && lampCount < 64) {
          DUMMY.position.set(x + 0.36, spec.elevation + 0.34, z - 0.34);
          DUMMY.rotation.set(0, 0, 0);
          DUMMY.scale.set(0.075, 0.075, 0.075);
          DUMMY.updateMatrix();
          lampRef.current.setMatrixAt(lampCount, DUMMY.matrix);
          lampCount += 1;
        }
      }

      // 3. Low-rise buildings (B, L, V)
      if ((code === 'B' || code === 'L' || code === 'V') && wallRef.current && roofRef.current) {
        const bh = spec.buildingHeight;
        const bw = 0.72 * scalePop;
        const bd = 0.68 * scalePop;
        DUMMY.position.set(x, spec.elevation + bh / 2 + lift, z);
        DUMMY.rotation.set(0, 0, 0);
        DUMMY.scale.set(bw, bh * scalePop, bd);
        DUMMY.updateMatrix();
        wallRef.current.setMatrixAt(wallCount, DUMMY.matrix);
        TMP_COLOR.set(vis.wallColor);
        wallRef.current.setColorAt(wallCount, TMP_COLOR);
        wallCount += 1;

        // Roof slab (distinct dark, white cool, or green turf rooftop)
        const roofH = code === 'V' ? 0.11 : 0.09;
        DUMMY.position.set(x, spec.elevation + bh + roofH / 2 + lift, z);
        DUMMY.rotation.set(0, 0, 0);
        DUMMY.scale.set(bw + 0.06, roofH, bd + 0.06);
        DUMMY.updateMatrix();
        roofRef.current.setMatrixAt(roofCount, DUMMY.matrix);
        TMP_COLOR.set(vis.roofColor);
        roofRef.current.setColorAt(roofCount, TMP_COLOR);
        roofCount += 1;

        // Warm lit windows on buildings
        if (windowRef.current && winCount < 140) {
          DUMMY.position.set(x, spec.elevation + bh * 0.52 + lift, z + bd / 2 + 0.008);
          DUMMY.rotation.set(0, 0, 0);
          DUMMY.scale.set(bw * 0.72, 0.11, 0.02);
          DUMMY.updateMatrix();
          windowRef.current.setMatrixAt(winCount, DUMMY.matrix);
          TMP_COLOR.set(isNight ? '#fde047' : '#334155');
          windowRef.current.setColorAt(winCount, TMP_COLOR);
          winCount += 1;
        }
      }

      // 4. Tall apartment towers (H)
      if (code === 'H' && towerRef.current && roofRef.current) {
        const th = spec.buildingHeight;
        const tw = 0.74 * scalePop;
        DUMMY.position.set(x, spec.elevation + th / 2 + lift, z);
        DUMMY.rotation.set(0, 0, 0);
        DUMMY.scale.set(tw, th * scalePop, tw);
        DUMMY.updateMatrix();
        towerRef.current.setMatrixAt(towerCount, DUMMY.matrix);
        TMP_COLOR.set(vis.wallColor);
        towerRef.current.setColorAt(towerCount, TMP_COLOR);
        towerCount += 1;

        // Tower penthouse cap
        DUMMY.position.set(x, spec.elevation + th + 0.08 + lift, z);
        DUMMY.rotation.set(0, 0, 0);
        DUMMY.scale.set(tw * 0.65, 0.16, tw * 0.65);
        DUMMY.updateMatrix();
        roofRef.current.setMatrixAt(roofCount, DUMMY.matrix);
        TMP_COLOR.set(vis.roofColor);
        roofRef.current.setColorAt(roofCount, TMP_COLOR);
        roofCount += 1;

        // Multi-floor lit window bands
        if (windowRef.current) {
          for (let fl = 0; fl < 3; fl += 1) {
            if (winCount >= 140) break;
            DUMMY.position.set(x, spec.elevation + 0.3 + fl * 0.36 + lift, z + tw / 2 + 0.01);
            DUMMY.rotation.set(0, 0, 0);
            DUMMY.scale.set(tw * 0.78, 0.1, 0.02);
            DUMMY.updateMatrix();
            windowRef.current.setMatrixAt(winCount, DUMMY.matrix);
            TMP_COLOR.set(isNight ? '#fbbf24' : '#475569');
            windowRef.current.setColorAt(winCount, TMP_COLOR);
            winCount += 1;
          }
        }
      }

      // 5. Stylized Low-Poly Trees (T pocket forest, E street trees, V rooftop shrubs)
      if ((code === 'T' || code === 'E' || code === 'V') && trunkRef.current && canopyRef.current) {
        const offsets = code === 'T'
          ? [[-0.24, -0.22, 1.05], [0.22, -0.18, 0.92], [-0.18, 0.24, 0.88], [0.24, 0.22, 1.12]]
          : code === 'E'
            ? [[-0.28, -0.34, 0.82], [0.28, 0.34, 0.85]]
            : [[-0.18, 0, 0.42], [0.18, 0.05, 0.38]];

        const baseTreeY = code === 'V' ? spec.elevation + spec.buildingHeight + 0.11 : spec.elevation;

        for (const [ox, oz, s] of offsets) {
          if (trunkCount >= 192 || canopyCount >= 192) break;
          const sway = Math.sin(t * 2.1 + i + ox * 5) * 0.025;
          if (code !== 'V') {
            DUMMY.position.set(x + ox, baseTreeY + 0.16 * s + lift, z + oz);
            DUMMY.rotation.set(0, 0, sway);
            DUMMY.scale.set(0.065 * s, 0.32 * s * scalePop, 0.065 * s);
            DUMMY.updateMatrix();
            trunkRef.current.setMatrixAt(trunkCount, DUMMY.matrix);
            trunkCount += 1;
          }

          DUMMY.position.set(
            x + ox + sway * 0.5,
            baseTreeY + (code === 'V' ? 0.12 : 0.4 * s) + lift,
            z + oz
          );
          DUMMY.rotation.set(sway, (i * 1.1) % 3, 0);
          DUMMY.scale.set(0.24 * s * scalePop, 0.26 * s * scalePop, 0.24 * s * scalePop);
          DUMMY.updateMatrix();
          canopyRef.current.setMatrixAt(canopyCount, DUMMY.matrix);
          if (view === 'map') {
            TMP_COLOR.set(code === 'T' ? '#15803d' : code === 'E' ? '#4d7c0f' : '#65a30d');
          } else {
            TMP_COLOR.set(vis.baseColor).lerp(new THREE.Color('#22c55e'), 0.35);
          }
          canopyRef.current.setColorAt(canopyCount, TMP_COLOR);
          canopyCount += 1;
        }
      }

      // 6. Shade Sails (S)
      if (code === 'S' && sailPostRef.current && sailRef.current) {
        const corners = [[-0.36, -0.36], [0.36, -0.36], [-0.36, 0.36], [0.36, 0.36]];
        for (const [cx, cz] of corners) {
          if (postCount >= 192) break;
          DUMMY.position.set(x + cx, spec.elevation + 0.24 + lift, z + cz);
          DUMMY.rotation.set(0, 0, 0);
          DUMMY.scale.set(0.032, 0.48, 0.032);
          DUMMY.updateMatrix();
          sailPostRef.current.setMatrixAt(postCount, DUMMY.matrix);
          postCount += 1;
        }
        if (sailCount < 48) {
          DUMMY.position.set(x, spec.elevation + 0.48 + lift, z);
          DUMMY.rotation.set(0.08, Math.PI / 4, -0.06);
          DUMMY.scale.set(0.76 * scalePop, 0.035, 0.76 * scalePop);
          DUMMY.updateMatrix();
          sailRef.current.setMatrixAt(sailCount, DUMMY.matrix);
          TMP_COLOR.set(view === 'map' ? '#0ea5e9' : vis.baseColor);
          sailRef.current.setColorAt(sailCount, TMP_COLOR);
          sailCount += 1;
        }
      }

      // 7. Night Thermal Infrared Underglow (3 am view)
      if (isNight && nightGlowRef.current && vis.emissiveIntensity > 0.08) {
        const pulse = 0.88 + Math.sin(t * 2.4 + i * 0.5) * 0.12;
        DUMMY.position.set(x, spec.elevation + 0.02 + lift * 0.45, z);
        DUMMY.rotation.set(-Math.PI / 2, 0, 0);
        DUMMY.scale.set(TILE_SIZE * 0.92 * pulse, TILE_SIZE * 0.92 * pulse, 1);
        DUMMY.updateMatrix();
        nightGlowRef.current.setMatrixAt(glowCount, DUMMY.matrix);
        TMP_COLOR.set(vis.emissiveIntensity > 0.5 ? '#ef4444' : '#f97316');
        nightGlowRef.current.setColorAt(glowCount, TMP_COLOR);
        glowCount += 1;
      }
    }

    // Zero-out unused instance slots cleanly
    const hideRest = (ref, used, max) => {
      if (!ref.current) return;
      DUMMY.scale.set(0, 0, 0);
      DUMMY.updateMatrix();
      for (let k = used; k < max; k += 1) ref.current.setMatrixAt(k, DUMMY.matrix);
      ref.current.instanceMatrix.needsUpdate = true;
      if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
    };

    if (baseRef.current) {
      baseRef.current.instanceMatrix.needsUpdate = true;
      if (baseRef.current.instanceColor) baseRef.current.instanceColor.needsUpdate = true;
    }
    hideRest(roadDashRef, dashCount, 96);
    hideRest(wallRef, wallCount, 48);
    hideRest(roofRef, roofCount, 48);
    hideRest(towerRef, towerCount, 48);
    hideRest(windowRef, winCount, 140);
    hideRest(trunkRef, trunkCount, 192);
    hideRest(canopyRef, canopyCount, 192);
    hideRest(sailPostRef, postCount, 192);
    hideRest(sailRef, sailCount, 48);
    hideRest(lampRef, lampCount, 64);
    hideRest(nightGlowRef, glowCount, 48);
  });

  // Pointer handlers on the base tiles (instanceId = 0..47)
  const handlePointerMove = (e) => {
    e.stopPropagation();
    if (typeof e.instanceId !== 'number') return;
    onHover?.(e.instanceId);
    if (paintingRef.current && interactionMode === 'paint') {
      onTileEnter?.(e.instanceId);
    }
  };

  const handlePointerDown = (e) => {
    if (interactionMode !== 'paint' || e.button !== 0) return;
    e.stopPropagation();
    if (typeof e.instanceId !== 'number') return;
    paintingRef.current = true;
    onTileDown?.(e.instanceId);
  };

  const handlePointerUp = () => {
    paintingRef.current = false;
    onTileUp?.();
  };

  return (
    <group onPointerUp={handlePointerUp}>
      {/* Ground Base Tiles (Interactive Hit Targets) */}
      <instancedMesh
        ref={baseRef}
        args={[null, null, TOTAL_TILES]}
        receiveShadow
        castShadow
        onPointerMove={handlePointerMove}
        onPointerOut={() => onHover?.(null)}
        onPointerDown={handlePointerDown}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={0.82} metalness={0.05} />
      </instancedMesh>

      {/* Road Markings */}
      <instancedMesh ref={roadDashRef} args={[null, null, 96]} raycast={() => null}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial />
      </instancedMesh>

      {/* Low-Rise Building Walls */}
      <instancedMesh ref={wallRef} args={[null, null, 48]} castShadow receiveShadow raycast={() => null}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={0.75} metalness={0.05} />
      </instancedMesh>

      {/* Roofs (Dark / Cool White / Green Turf / Tower Penthouse) */}
      <instancedMesh ref={roofRef} args={[null, null, 48]} castShadow receiveShadow raycast={() => null}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={0.55} metalness={0.08} />
      </instancedMesh>

      {/* Tall Apartment Towers */}
      <instancedMesh ref={towerRef} args={[null, null, 48]} castShadow receiveShadow raycast={() => null}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={0.52} metalness={0.18} />
      </instancedMesh>

      {/* Building Windows */}
      <instancedMesh ref={windowRef} args={[null, null, 140]} raycast={() => null}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial />
      </instancedMesh>

      {/* Tree Trunks */}
      <instancedMesh ref={trunkRef} args={[null, null, 192]} castShadow raycast={() => null}>
        <cylinderGeometry args={[0.7, 1, 1, 6]} />
        <meshStandardMaterial color="#78492a" roughness={0.95} />
      </instancedMesh>

      {/* Tree Canopies */}
      <instancedMesh ref={canopyRef} args={[null, null, 192]} castShadow receiveShadow raycast={() => null}>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial roughness={0.85} flatShading />
      </instancedMesh>

      {/* Shade Sail Posts */}
      <instancedMesh ref={sailPostRef} args={[null, null, 192]} castShadow raycast={() => null}>
        <cylinderGeometry args={[1, 1, 1, 6]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.6} roughness={0.3} />
      </instancedMesh>

      {/* Shade Sails */}
      <instancedMesh ref={sailRef} args={[null, null, 48]} castShadow receiveShadow raycast={() => null}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={0.5} side={THREE.DoubleSide} />
      </instancedMesh>

      {/* Night Streetlights */}
      <instancedMesh ref={lampRef} args={[null, null, 64]} raycast={() => null}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial color="#fde68a" />
      </instancedMesh>

      {/* Night Thermal Infrared Underglow */}
      <instancedMesh ref={nightGlowRef} args={[null, null, 48]} raycast={() => null}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          transparent
          opacity={0.48}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </instancedMesh>

      {/* Hover & Inspected Reticles */}
      {hovered !== null && (
        <mesh
          position={[tileToWorld(hovered).x, 0.145, tileToWorld(hovered).z]}
          rotation={[-Math.PI / 2, 0, 0]}
          raycast={() => null}
        >
          <ringGeometry args={[TILE_SIZE * 0.44, TILE_SIZE * 0.52, 4]} />
          <meshBasicMaterial color="#34d399" transparent opacity={0.9} depthWrite={false} />
        </mesh>
      )}
      {inspected !== null && inspected !== hovered && (
        <mesh
          position={[tileToWorld(inspected).x, 0.14, tileToWorld(inspected).z]}
          rotation={[-Math.PI / 2, 0, 0]}
          raycast={() => null}
        >
          <ringGeometry args={[TILE_SIZE * 0.43, TILE_SIZE * 0.5, 4]} />
          <meshBasicMaterial color="#f8fafc" transparent opacity={0.85} depthWrite={false} />
        </mesh>
      )}
    </group>
  );
}

// ---------------------------------------------------------------------------
// Main Exported 3D Scene Component
// ---------------------------------------------------------------------------

export function UrbanHeatScene3D({
  grid,
  heat,
  view = 'map',
  weatherId = 'breeze',
  focus = [],
  marks = [],
  unreachable = [],
  inspected = null,
  nightRef = 25,
  interactionMode = 'paint',
  showBreeze = true,
  resetSignal = 0,
  onHoverTile,
  onPaint,
  onStrokeStart,
  onInspect
}) {
  const [hovered, setHovered] = useState(null);
  const [burstSignal, setBurstSignal] = useState(null);
  const controlsRef = useRef();
  const isNight = view === 'night';

  useEffect(() => {
    if (!controlsRef.current) return;
    controlsRef.current.reset();
  }, [resetSignal]);

  const handleHover = (idx) => {
    setHovered(idx);
    onHoverTile?.(idx);
  };

  const handleTileDown = (idx) => {
    onStrokeStart?.();
    onPaint?.(idx);
    onInspect?.(idx);
  };

  const handleTileEnter = (idx) => {
    onPaint?.(idx);
  };

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [9.2, 10.4, 9.2], fov: 28, near: 0.1, far: 80 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      aria-label="Interactive 3D isometric district map, 8 by 6 blocks"
      data-testid="urban-heat-3d-canvas"
      style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }}
    >
      <color attach="background" args={[isNight ? '#060c1d' : '#0f172a']} />
      <fog attach="fog" args={[isNight ? '#060c1d' : '#0f172a', 20, 42]} />

      {/* Lighting */}
      <hemisphereLight
        args={[
          isNight ? '#1e3a8a' : '#e0f2fe',
          isNight ? '#090d16' : '#334155',
          isNight ? 0.55 : 0.85
        ]}
      />
      <directionalLight
        position={isNight ? [-6, 10, -5] : [8, 13, 6]}
        intensity={isNight ? 0.42 : 1.55}
        color={isNight ? '#93c5fd' : '#fff7ed'}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-7}
        shadow-camera-right={7}
        shadow-camera-top={7}
        shadow-camera-bottom={-7}
        shadow-bias={-0.0004}
      />
      {!isNight && (
        <directionalLight position={[-7, 5, -6]} intensity={0.35} color="#7dd3fc" />
      )}

      {/* Scene Content */}
      <CityPlinth isNight={isNight} />
      <InstancedCity
        grid={grid}
        heat={heat}
        view={view}
        nightRef={nightRef}
        hovered={hovered}
        inspected={inspected}
        interactionMode={interactionMode}
        onHover={handleHover}
        onTileDown={handleTileDown}
        onTileEnter={handleTileEnter}
        onBurst={setBurstSignal}
      />
      <WaterLayer grid={grid} isNight={isNight} />
      <HeatHazeLayer grid={grid} heat={heat} view={view} nightRef={nightRef} />
      <SeaBreezeLayer grid={grid} weatherId={weatherId} visible={showBreeze} />
      <FocusPulseLayer focus={focus} />
      <WarningBuoys unreachable={unreachable} grid={grid} />
      <PredictionMarkers marks={marks} grid={grid} />
      <DustPuffPool burstSignal={burstSignal} />

      <OrbitControls
        ref={controlsRef}
        enableRotate
        enablePan
        enableZoom
        minDistance={7}
        maxDistance={24}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.35}
        mouseButtons={{
          LEFT: interactionMode === 'orbit' ? THREE.MOUSE.ROTATE : -1,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: THREE.MOUSE.ROTATE
        }}
        touches={{
          ONE: interactionMode === 'orbit' ? THREE.TOUCH.ROTATE : -1,
          TWO: THREE.TOUCH.DOLLY_PAN
        }}
      />
    </Canvas>
  );
}

export default UrbanHeatScene3D;
