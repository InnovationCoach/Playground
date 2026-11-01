import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { fbm, glowTexture } from './proceduralTextures.js';

/**
 * Thalassa Research Station: the spike's one enterable environment, loaded as
 * its own chunk only when a learner inspects Thalassa. Terrain, water and
 * structures are procedural. The swell is scenery: it is not a wave model, and
 * nothing here simulates buoyancy, weather or the Hex-Grid city.
 */

const HEADLAND = [-16, -6];
/** Ground height in metres (display units). Above 0 is land, below is seabed. */
export function heightAt(x, z) {
  const d = Math.hypot(x - HEADLAND[0], z - HEADLAND[1]) / 24;
  const rugged = 0.7 + 0.6 * fbm(x * 0.05 + 3, 1.7, z * 0.05 + 3, 41, 3); // uneven basalt shoulders, not a smooth mound
  const island = d < 1 ? 13 * (1 - d * d) ** 2 * rugged : 0;
  const n = fbm(x * 0.11 + 10, 0.3, z * 0.11 + 10, 77, 5) - 0.5;
  const ridge = 1 - Math.abs(fbm(x * 0.06, 2.1, z * 0.06, 9, 3) * 2 - 1);
  return island - 5 + n * (island > 0 ? 4.5 : 1.4) + (island > 2 ? ridge * 2.5 : 0);
}

function Terrain({ low }) {
  const geo = useMemo(() => {
    const seg = low ? 110 : 170, g = new THREE.PlaneGeometry(220, 220, seg, seg);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position, colors = new Float32Array(pos.count * 3);
    const basalt = new THREE.Color('#2b2a2c'), moss = new THREE.Color('#41513a'), sand = new THREE.Color('#8f8064'), seabed = new THREE.Color('#2c4a55');
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i += 1) {
      const x = pos.getX(i), z = pos.getZ(i), h = heightAt(x, z);
      pos.setY(i, h);
      if (h < -0.6) c.copy(seabed).lerp(sand, Math.max(0, (h + 5) / 5) * 0.6);
      else if (h < 0.8) c.copy(sand);
      else c.copy(basalt).lerp(moss, Math.max(0, Math.min(1, fbm(x * 0.2, 1, z * 0.2, 5, 3) * 1.6 - 0.55)));
      colors.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    g.computeVertexNormals();
    return g;
  }, [low]);
  useEffect(() => () => geo.dispose(), [geo]);
  return <mesh geometry={geo}><meshStandardMaterial vertexColors roughness={0.95} metalness={0} flatShading /></mesh>;
}

/** A gently moving sea surface. With motion off it holds still. */
function Ocean({ motion, low }) {
  const ref = useRef();
  const geo = useMemo(() => { const g = new THREE.PlaneGeometry(400, 400, low ? 64 : 112, low ? 64 : 112); g.rotateX(-Math.PI / 2); return g; }, [low]);
  const base = useMemo(() => Float32Array.from(geo.attributes.position.array), [geo]);
  useEffect(() => () => geo.dispose(), [geo]);
  useFrame(({ clock }) => {
    if (!motion || !ref.current) return;
    const t = clock.elapsedTime, pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i += 1) {
      const x = base[i * 3], z = base[i * 3 + 2];
      pos.setY(i, Math.sin(x * 0.09 + t * 0.8) * 0.35 + Math.sin(z * 0.13 + x * 0.04 + t * 1.1) * 0.22);
    }
    pos.needsUpdate = true; geo.computeVertexNormals();
  });
  return <mesh ref={ref} geometry={geo}><meshStandardMaterial color="#1c6d93" transparent opacity={0.78} roughness={0.18} metalness={0.15} /></mesh>;
}

const SKY_VERT = 'varying vec3 vW; void main(){ vW = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }';
const SKY_FRAG = 'varying vec3 vW; uniform vec3 top; uniform vec3 horizon; uniform vec3 sea; void main(){ float h = vW.y; vec3 c = h > 0.0 ? mix(horizon, top, pow(h, 0.55)) : mix(horizon, sea, min(1.0, -h * 6.0)); gl_FragColor = vec4(c, 1.0); }';

function Sky() {
  const mat = useMemo(() => new THREE.ShaderMaterial({ vertexShader: SKY_VERT, fragmentShader: SKY_FRAG, side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color('#2e6fae') }, horizon: { value: new THREE.Color('#c9e4ef') }, sea: { value: new THREE.Color('#2a6380') } } }), []);
  const sun = useMemo(() => glowTexture('rgba(255,250,232,1)', 'rgba(255,230,180,0)'), []);
  useEffect(() => () => { mat.dispose(); sun.dispose(); }, [mat, sun]);
  return <group>
    <mesh material={mat}><sphereGeometry args={[480, 32, 16]} /></mesh>
    <sprite position={[160, 120, -260]} scale={[90, 90, 1]}><spriteMaterial map={sun} transparent depthWrite={false} fog={false} /></sprite>
  </group>;
}

/** Seven hexagonal modules on pontoons: the foundation site for a future floating-settlement project. */
function Platform({ position }) {
  const cells = useMemo(() => [[0, 0], ...Array.from({ length: 6 }, (_, i) => [Math.cos(i * Math.PI / 3 + Math.PI / 6) * 4.1, Math.sin(i * Math.PI / 3 + Math.PI / 6) * 4.1])], []);
  return <group position={position}>
    {cells.map(([x, z], i) => <group key={i} position={[x, 0, z]}>
      <mesh position={[0, 0.5, 0]}><cylinderGeometry args={[2.3, 2.3, 0.5, 6]} /><meshStandardMaterial color={i === 0 ? '#d9dfe6' : '#b9c3cf'} roughness={0.6} metalness={0.2} /></mesh>
      <mesh position={[0, 0.72, 0]}><cylinderGeometry args={[2.32, 2.32, 0.08, 6, 1, true]} /><meshStandardMaterial color="#96d700" emissive="#3c5a00" roughness={0.5} /></mesh>
      <mesh position={[0, -0.2, 0]}><cylinderGeometry args={[1.6, 1.4, 1.2, 6]} /><meshStandardMaterial color="#59646f" roughness={0.8} /></mesh>
      {i % 2 === 1 && <mesh position={[0, 1.15, 0]} rotation={[-0.35, 0, 0]}><boxGeometry args={[2.4, 0.08, 1.5]} /><meshStandardMaterial color="#1e3350" metalness={0.5} roughness={0.3} /></mesh>}
    </group>)}
    <mesh position={[0, 1.6, 0]}><sphereGeometry args={[1.5, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#e8f2f7" transparent opacity={0.85} roughness={0.15} /></mesh>
  </group>;
}

function Mast({ x, z }) {
  const y = heightAt(x, z);
  return <group position={[x, y, z]}>
    <mesh position={[0, 3, 0]}><cylinderGeometry args={[0.08, 0.14, 6, 8]} /><meshStandardMaterial color="#d7dde3" metalness={0.4} roughness={0.4} /></mesh>
    <mesh position={[0, 6.1, 0]}><boxGeometry args={[1.4, 0.06, 0.06]} /><meshStandardMaterial color="#d7dde3" /></mesh>
    <mesh position={[0.7, 6.25, 0]}><sphereGeometry args={[0.16, 10, 8]} /><meshStandardMaterial color="#ae266c" /></mesh>
  </group>;
}

function TideGauge({ x, z }) {
  return <group position={[x, 0, z]}>
    <mesh position={[0, -1, 0]}><cylinderGeometry args={[0.18, 0.18, 6, 10]} /><meshStandardMaterial color="#eef2f4" /></mesh>
    {[-0.5, 0.5, 1.5].map((y) => <mesh key={y} position={[0, y, 0]}><cylinderGeometry args={[0.2, 0.2, 0.18, 10]} /><meshStandardMaterial color="#e0589c" /></mesh>)}
  </group>;
}

function Vent({ x, z }) {
  const y = heightAt(x, z);
  return <group position={[x, y, z]}>
    <mesh><coneGeometry args={[1.4, 1.6, 9]} /><meshStandardMaterial color="#26201f" roughness={1} /></mesh>
    <mesh position={[0, 0.9, 0]}><sphereGeometry args={[0.45, 12, 10]} /><meshStandardMaterial color="#ffb070" emissive="#ff7a2e" emissiveIntensity={2} /></mesh>
    <pointLight position={[0, 1.4, 0]} color="#ff9a50" intensity={30} distance={14} />
  </group>;
}

/** Inspectable places: a slim beacon from the ground with a label; lime when selected. */
function Beacon({ location, selected, onSelect }) {
  const [x, , z] = location.position, ground = Math.max(heightAt(x, z), 0), top = Math.max(location.position[1], ground) + 2.2;
  const pickIt = (e) => { if (e.delta < 6) { e.stopPropagation(); onSelect(location.id); } };
  const color = selected ? '#96d700' : '#9bd2ff';
  return <group position={[x, 0, z]}>
    <mesh position={[0, (ground + top) / 2, 0]}><cylinderGeometry args={[0.05, 0.05, top - ground, 6]} /><meshBasicMaterial color={color} transparent opacity={0.7} /></mesh>
    <mesh position={[0, top, 0]} onClick={pickIt} onPointerOver={() => { document.body.style.cursor = 'pointer'; }} onPointerOut={() => { document.body.style.cursor = ''; }}>
      <octahedronGeometry args={[0.55, 0]} /><meshBasicMaterial color={color} />
    </mesh>
    <Html position={[0, top + 1.1, 0]} center zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
      <span className={`mx-label${selected ? ' is-on' : ''}`} aria-hidden="true">{location.name}</span>
    </Html>
  </group>;
}

export default function ExplorerEnvironment({ environment, selected, onSelect, motion, low }) {
  const byId = Object.fromEntries(environment.locations.map((l) => [l.id, l]));
  return <group>
    <fog attach="fog" args={['#c9e4ef', 90, 330]} />
    <hemisphereLight args={['#dff1ff', '#2a4a55', 0.9]} />
    <directionalLight position={[80, 90, -60]} intensity={2.2} color="#fff4e0" />
    <Sky />
    <Terrain low={low} />
    <Ocean motion={motion} low={low} />
    <Platform position={[byId.platform.position[0], 0, byId.platform.position[2]]} />
    <Mast x={byId['weather-mast'].position[0]} z={byId['weather-mast'].position[2]} />
    <TideGauge x={byId['tide-gauge'].position[0]} z={byId['tide-gauge'].position[2]} />
    <Vent x={byId.vent.position[0]} z={byId.vent.position[2]} />
    {environment.locations.map((l) => <Beacon key={l.id} location={l} selected={selected === l.id} onSelect={onSelect} />)}
  </group>;
}
