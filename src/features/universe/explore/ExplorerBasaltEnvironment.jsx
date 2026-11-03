import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { fbm, glowTexture, seeded } from './proceduralTextures.js';
import { Sky, Beacon, Equipment } from './environmentKit.jsx';

/**
 * Ignis basalt fissure field (sceneKind 'basalt-fissures'): a dark lava plain cut
 * by a glowing fissure, a terrace of columnar basalt, a gas vent and a sensor
 * station. Everything is procedural scenery. The glow and the plume are
 * illustrative: nothing here simulates lava, heat flow or gas chemistry.
 */

/** Fissure centre line: z for a given x. */
export const fissureZ = (x) => -4 + 10 * Math.sin(x * 0.04);
const smoothstep = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

/** Ground height in metres: gentle plain, a raised western terrace, and the sunken fissure channel. */
export function heightAt(x, z) {
  let h = (fbm(x * 0.05 + 4, 0.7, z * 0.05 + 4, 23, 4) - 0.5) * 1.6;
  h += 7 * smoothstep(-14, -24, x);
  const d = Math.abs(z - fissureZ(x));
  if (x > -16 && d < 2.6) h -= 1.8 * (1 - d / 2.6) ** 2;
  return h;
}

function Terrain({ low }) {
  const geo = useMemo(() => {
    const seg = low ? 110 : 170, g = new THREE.PlaneGeometry(220, 220, seg, seg);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position, colors = new Float32Array(pos.count * 3);
    const rock = new THREE.Color('#2a2523'), ash = new THREE.Color('#4a403a'), scorch = new THREE.Color('#5a2a17'), c = new THREE.Color();
    for (let i = 0; i < pos.count; i += 1) {
      const x = pos.getX(i), z = pos.getZ(i), h = heightAt(x, z);
      pos.setY(i, h);
      const d = Math.abs(z - fissureZ(x));
      c.copy(rock).lerp(ash, Math.max(0, fbm(x * 0.18, 2, z * 0.18, 61, 3) * 1.8 - 0.7));
      if (x > -16 && d < 6) c.lerp(scorch, (1 - d / 6) * 0.7);
      colors.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    g.computeVertexNormals();
    return g;
  }, [low]);
  useEffect(() => () => geo.dispose(), [geo]);
  return <mesh geometry={geo}><meshStandardMaterial vertexColors roughness={0.97} metalness={0} flatShading /></mesh>;
}

/** Six-sided basalt columns on the western terrace: one instanced draw call. */
function Columns({ low }) {
  const ref = useRef();
  const cells = useMemo(() => {
    const out = [], rnd = seeded(97), step = low ? 2.4 : 1.9;
    for (let x = -42; x <= -17; x += step) for (let r = 0, z = -34; z <= 34; r += 1, z += step * 0.866) {
      const cx = x + (r % 2 ? step / 2 : 0);
      if (rnd() < 0.12) continue; // a few gaps read as weathering
      const ground = heightAt(cx, z), top = ground + 0.4 + fbm(cx * 0.15, 5, z * 0.15, 13, 3) * 3.2;
      out.push([cx, z, ground - 2, top, 0.12 + rnd() * 0.08]);
    }
    return out;
  }, [low]);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), c = new THREE.Color();
    cells.forEach(([x, z, bottom, top, shade], i) => {
      m.compose(new THREE.Vector3(x, (bottom + top) / 2, z), q, new THREE.Vector3(1, top - bottom, 1));
      ref.current.setMatrixAt(i, m);
      ref.current.setColorAt(i, c.setRGB(shade * 1.1, shade, shade * 0.95));
    });
    ref.current.instanceMatrix.needsUpdate = true;
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
  }, [cells]);
  return <instancedMesh ref={ref} args={[null, null, cells.length]} key={cells.length}>
    <cylinderGeometry args={[0.93, 0.93, 1, 6]} />
    <meshStandardMaterial roughness={0.9} metalness={0.05} flatShading />
  </instancedMesh>;
}

/** The glowing floor of the fissure, plus a few warm lights along it. Pulses gently only when motion is allowed. */
function Fissure({ motion }) {
  const mat = useRef();
  const geo = useMemo(() => {
    const pts = [];
    for (let x = -15; x <= 70; x += 1) pts.push(x);
    const pos = new Float32Array(pts.length * 2 * 3), idx = [];
    pts.forEach((x, i) => {
      const z = fissureZ(x), w = 0.35 + 0.25 * Math.abs(Math.sin(x * 0.3)), y = heightAt(x, z) + 0.06;
      pos.set([x, y, z - w, x, y, z + w], i * 6);
      if (i) { const a = (i - 1) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(idx);
    return g;
  }, []);
  useEffect(() => () => geo.dispose(), [geo]);
  useFrame(({ clock }) => { if (motion && mat.current) mat.current.opacity = 0.82 + 0.18 * Math.sin(clock.elapsedTime * 1.3); });
  return <group>
    <mesh geometry={geo}><meshBasicMaterial ref={mat} color="#ff7a2e" transparent opacity={0.95} toneMapped={false} side={THREE.DoubleSide} /></mesh>
    {[-8, 10, 28, 48].map((x) => <pointLight key={x} position={[x, heightAt(x, fissureZ(x)) + 1.2, fissureZ(x)]} color="#ff7a2e" intensity={45} distance={16} />)}
  </group>;
}

/** Sulfur-rich plume from the vent: soft sprites rising and fading. Holds still when motion is off. */
function GasVent({ x, z, motion }) {
  const y = heightAt(x, z);
  const tex = useMemo(() => glowTexture('rgba(232,224,170,1)', 'rgba(232,224,170,0)'), []);
  useEffect(() => () => tex.dispose(), [tex]);
  const puffs = useRef([]);
  const seeds = useMemo(() => Array.from({ length: 14 }, (_, i) => ({ phase: i / 14, drift: (seeded(i + 3)() - 0.5) * 1.2 })), []);
  useFrame(({ clock }) => {
    if (!motion) return;
    seeds.forEach((s, i) => {
      const p = puffs.current[i]; if (!p) return;
      const t = (clock.elapsedTime * 0.12 + s.phase) % 1;
      p.position.set(s.drift * t * 4, 1 + t * 12, t * 3);
      p.scale.setScalar(1.5 + t * 6); p.material.opacity = 0.32 * (1 - t);
    });
  });
  return <group position={[x, y, z]}>
    <mesh><coneGeometry args={[2.2, 1.8, 9]} /><meshStandardMaterial color="#3a302b" roughness={1} flatShading /></mesh>
    <mesh position={[0, 0.7, 0]}><cylinderGeometry args={[0.5, 0.7, 0.3, 9]} /><meshStandardMaterial color="#c9b74a" emissive="#5a4a10" roughness={0.8} /></mesh>
    {seeds.map((s, i) => <sprite key={i} ref={(el) => { puffs.current[i] = el; }} position={[s.drift * s.phase * 4, 1 + s.phase * 12, s.phase * 3]} scale={1.5 + s.phase * 6}>
      <spriteMaterial map={tex} transparent opacity={0.32 * (1 - s.phase)} depthWrite={false} />
    </sprite>)}
  </group>;
}

/** Automated sensor station: a small lander-style module. */
function Station({ x, z }) {
  const y = heightAt(x, z);
  return <group position={[x, y, z]} rotation={[0, -0.5, 0]}>
    {[[-1, -0.6], [1, -0.6], [-1, 0.6], [1, 0.6]].map(([lx, lz]) => <mesh key={`${lx}${lz}`} position={[lx, 0.5, lz]}><cylinderGeometry args={[0.07, 0.1, 1, 6]} /><meshStandardMaterial color="#9aa3ad" metalness={0.5} roughness={0.4} /></mesh>)}
    <mesh position={[0, 1.3, 0]}><boxGeometry args={[2.6, 0.9, 1.6]} /><meshStandardMaterial color="#d9dfe6" metalness={0.3} roughness={0.5} /></mesh>
    <mesh position={[0, 1.78, 0]}><boxGeometry args={[2.62, 0.06, 1.62]} /><meshStandardMaterial color="#96d700" emissive="#3c5a00" /></mesh>
    <mesh position={[2.2, 1.6, 0]} rotation={[0, 0, -0.5]}><boxGeometry args={[1.8, 0.05, 1.3]} /><meshStandardMaterial color="#1e3350" metalness={0.5} roughness={0.3} /></mesh>
    <mesh position={[-0.8, 3, 0]}><cylinderGeometry args={[0.05, 0.05, 2.4, 6]} /><meshStandardMaterial color="#d7dde3" /></mesh>
    <mesh position={[-0.8, 4.25, 0]}><sphereGeometry args={[0.16, 10, 8]} /><meshStandardMaterial color="#96d700" emissive="#96d700" emissiveIntensity={1.5} /></mesh>
    <mesh position={[0.6, 2.2, 0]} rotation={[0.6, 0, 0]}><sphereGeometry args={[0.5, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2.5]} /><meshStandardMaterial color="#eef2f4" side={THREE.DoubleSide} /></mesh>
  </group>;
}

export default function ExplorerBasaltEnvironment({ environment, selected, onSelect, motion, low, equipment = null }) {
  const byId = Object.fromEntries(environment.locations.map((l) => [l.id, l]));
  return <group>
    <fog attach="fog" args={['#8a5a3f', 70, 280]} />
    <hemisphereLight args={['#f2c9a0', '#2a1d18', 0.75]} />
    <directionalLight position={[-90, 70, 60]} intensity={1.7} color="#ffd2a8" />
    <Sky top="#2e2230" horizon="#c4855a" below="#2a1d18" sun="rgba(255,196,150,1)" sunPosition={[-180, 70, 240]} sunScale={70} />
    <Terrain low={low} />
    <Columns low={low} />
    <Fissure motion={motion} />
    <GasVent x={byId['gas-vent'].position[0]} z={byId['gas-vent'].position[2]} motion={motion} />
    <Station x={byId['sensor-station'].position[0]} z={byId['sensor-station'].position[2]} />
    {environment.locations.map((l) => <Beacon key={l.id} location={l} selected={selected === l.id} onSelect={onSelect} groundAt={heightAt} />)}
    <Equipment equipment={equipment} standAt={heightAt} motion={motion} />
  </group>;
}
