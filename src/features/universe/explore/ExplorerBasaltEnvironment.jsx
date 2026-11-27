import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { fbm, glowTexture, seeded } from './proceduralTextures.js';
import { Sky, Beacon, Equipment, PlaygroundStructures } from './environmentKit.jsx';
import { getPlanetTheme } from './planetThemes.js';

/**
 * Basalt & geothermal fissure surface renderer (sceneKind 'basalt-fissures').
 * Adapts sky, lighting, terrain palette, basalt columns, fissure glow, gas plumes,
 * aurora, and geological landmarks per planetId (Ignis, Cinder, Pyros, Umbrion,
 * Obsidian Reach, Frostholm).
 */

/** Fissure centre line: z for a given x. */
export const fissureZ = (x) => -4 + 10 * Math.sin(x * 0.04);
const smoothstep = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

/** Ground height in metres: gentle plain, a raised western terrace, and the sunken fissure channel. */
export function heightAt(x, z, seedOffset = 0) {
  const s = seedOffset * 0.15;
  let h = (fbm(x * 0.05 + 4 + s, 0.7, z * 0.05 + 4 + s, 23, 4) - 0.5) * 1.6;
  h += 7 * smoothstep(-14, -24, x);
  const d = Math.abs(z - fissureZ(x));
  if (x > -16 && d < 2.6) h -= 1.8 * (1 - d / 2.6) ** 2;
  return h;
}

function Terrain({ low, theme }) {
  const geo = useMemo(() => {
    const seg = low ? 110 : 170, g = new THREE.PlaneGeometry(220, 220, seg, seg);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position, colors = new Float32Array(pos.count * 3);
    const rock = new THREE.Color(theme.rockColor), ash = new THREE.Color(theme.ashColor);
    const scorch = new THREE.Color(theme.scorchColor), c = new THREE.Color();
    for (let i = 0; i < pos.count; i += 1) {
      const x = pos.getX(i), z = pos.getZ(i), h = heightAt(x, z, theme.seedOffset);
      pos.setY(i, h);
      const d = Math.abs(z - fissureZ(x));
      c.copy(rock).lerp(ash, Math.max(0, fbm(x * 0.18, 2, z * 0.18, 61, 3) * 1.8 - 0.7));
      if (x > -16 && d < 6) c.lerp(scorch, (1 - d / 6) * 0.7);
      colors.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    g.computeVertexNormals();
    return g;
  }, [low, theme]);
  useEffect(() => () => geo.dispose(), [geo]);
  return <mesh geometry={geo}><meshStandardMaterial vertexColors roughness={0.97} metalness={0} flatShading /></mesh>;
}

/** Six-sided basalt columns on the western terrace: one instanced draw call. */
function Columns({ low, theme }) {
  const ref = useRef();
  const cells = useMemo(() => {
    const out = [], rnd = seeded(97 + theme.seedOffset), step = low ? 2.4 : 1.9;
    for (let x = -42; x <= -17; x += step) for (let r = 0, z = -34; z <= 34; r += 1, z += step * 0.866) {
      const cx = x + (r % 2 ? step / 2 : 0);
      if (rnd() < 0.12) continue;
      const ground = heightAt(cx, z, theme.seedOffset), top = ground + 0.4 + fbm(cx * 0.15, 5, z * 0.15, 13, 3) * 3.2;
      out.push([cx, z, ground - 2, top, 0.12 + rnd() * 0.08]);
    }
    return out;
  }, [low, theme]);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), c = new THREE.Color();
    const [tr, tg, tb] = theme.columnTint || [1.1, 1.0, 0.95];
    cells.forEach(([x, z, bottom, top, shade], i) => {
      m.compose(new THREE.Vector3(x, (bottom + top) / 2, z), q, new THREE.Vector3(1, top - bottom, 1));
      ref.current.setMatrixAt(i, m);
      ref.current.setColorAt(i, c.setRGB(shade * tr, shade * tg, shade * tb));
    });
    ref.current.instanceMatrix.needsUpdate = true;
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
  }, [cells, theme]);
  return <instancedMesh ref={ref} args={[null, null, cells.length]} key={cells.length}>
    <cylinderGeometry args={[0.93, 0.93, 1, 6]} />
    <meshStandardMaterial roughness={0.9} metalness={0.05} flatShading />
  </instancedMesh>;
}

/** The glowing floor of the fissure, plus warm lights along it. */
function Fissure({ motion, theme }) {
  const mat = useRef();
  const geo = useMemo(() => {
    const pts = [];
    for (let x = -15; x <= 70; x += 1) pts.push(x);
    const pos = new Float32Array(pts.length * 2 * 3), idx = [];
    pts.forEach((x, i) => {
      const z = fissureZ(x), w = 0.35 + 0.25 * Math.abs(Math.sin(x * 0.3)), y = heightAt(x, z, theme.seedOffset) + 0.06;
      pos.set([x, y, z - w, x, y, z + w], i * 6);
      if (i) { const a = (i - 1) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(idx);
    return g;
  }, [theme]);
  useEffect(() => () => geo.dispose(), [geo]);
  useFrame(({ clock }) => { if (motion && mat.current) mat.current.opacity = 0.82 + 0.18 * Math.sin(clock.elapsedTime * 1.3); });
  return <group>
    <mesh geometry={geo}><meshBasicMaterial ref={mat} color={theme.fissureColor} transparent opacity={0.95} toneMapped={false} side={THREE.DoubleSide} /></mesh>
    {[-8, 10, 28, 48].map((x) => <pointLight key={x} position={[x, heightAt(x, fissureZ(x), theme.seedOffset) + 1.2, fissureZ(x)]} color={theme.fissureColor} intensity={45} distance={16} />)}
  </group>;
}

/** Planet-specific geological landmarks (violet spires, plasma arcs, drifting ash embers). */
function BasaltLandmarks({ theme, motion }) {
  const groupRef = useRef();
  const items = useMemo(() => {
    if (!theme.landmark) return [];
    const rnd = seeded(307 + theme.seedOffset);
    return Array.from({ length: 14 }, () => {
      const x = -10 + rnd() * 55;
      const z = (rnd() - 0.5) * 44;
      return { x, z, y: heightAt(x, z, theme.seedOffset), s: 0.7 + rnd() * 1.2, phase: rnd() * Math.PI * 2 };
    });
  }, [theme]);

  useFrame(({ clock }) => {
    if (!motion || !groupRef.current) return;
    if (theme.landmark === 'ash-embers') {
      const t = clock.elapsedTime;
      groupRef.current.children.forEach((child, i) => {
        child.position.y = items[i].y + 1.5 + ((t * 1.4 + items[i].phase) % 9);
      });
    }
  });

  if (!items.length) return null;

  return (
    <group ref={groupRef}>
      {items.map((it, i) => {
        if (theme.landmark === 'violet-spires') {
          return (
            <mesh key={i} position={[it.x, it.y + 1.8 * it.s, it.z]} rotation={[0.12, it.phase, -0.08]}>
              <coneGeometry args={[0.75 * it.s, 4.2 * it.s, 5]} />
              <meshStandardMaterial color="#a855f7" emissive="#6b21a8" emissiveIntensity={0.8} roughness={0.3} flatShading />
            </mesh>
          );
        }
        if (theme.landmark === 'plasma-arcs') {
          return (
            <mesh key={i} position={[it.x, it.y + 2.1 * it.s, it.z]} rotation={[0, it.phase, 0.18]}>
              <octahedronGeometry args={[0.85 * it.s, 0]} />
              <meshStandardMaterial color="#10b981" emissive="#059669" emissiveIntensity={1.25} roughness={0.2} />
            </mesh>
          );
        }
        // ash-embers (Cinder)
        return (
          <mesh key={i} position={[it.x, it.y + 2.5, it.z]}>
            <octahedronGeometry args={[0.22 * it.s, 0]} />
            <meshBasicMaterial color="#f97316" />
          </mesh>
        );
      })}
    </group>
  );
}

/** Gas plume from the vent: soft sprites rising and fading. */
function GasVent({ x, z, motion, theme }) {
  const y = heightAt(x, z, theme.seedOffset);
  const plumeRgba = theme.plumeRgba || 'rgba(232,224,170,1)';
  const tex = useMemo(() => glowTexture(plumeRgba, plumeRgba.replace(/[\d.]+\)$/, '0)')), [plumeRgba]);
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
    <mesh><coneGeometry args={[2.2, 1.8, 9]} /><meshStandardMaterial color={theme.rockColor} roughness={1} flatShading /></mesh>
    <mesh position={[0, 0.7, 0]}><cylinderGeometry args={[0.5, 0.7, 0.3, 9]} /><meshStandardMaterial color={theme.fissureColor} emissive={theme.fissureColor} emissiveIntensity={0.6} roughness={0.8} /></mesh>
    {seeds.map((s, i) => <sprite key={i} ref={(el) => { puffs.current[i] = el; }} position={[s.drift * s.phase * 4, 1 + s.phase * 12, s.phase * 3]} scale={1.5 + s.phase * 6}>
      <spriteMaterial map={tex} transparent opacity={0.32 * (1 - s.phase)} depthWrite={false} />
    </sprite>)}
  </group>;
}

/** Automated sensor station: a small lander-style module. */
function Station({ x, z, seedOffset }) {
  const y = heightAt(x, z, seedOffset);
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

export default function ExplorerBasaltEnvironment({ environment, selected, onSelect, motion, low, equipment = null, playgroundFeatures = [], unlockedFacilities = [], activeHazard = null }) {
  const theme = useMemo(() => getPlanetTheme(environment.planetId, 'basalt'), [environment.planetId]);
  const byId = Object.fromEntries(environment.locations.map((l) => [l.id, l]));
  const groundAt = (x, z) => heightAt(x, z, theme.seedOffset);
  const st = byId['sensor-station'].position;
  return <group>
    <fog attach="fog" args={[theme.fogColor, 70, 280]} />
    <hemisphereLight args={[theme.hemiSky, theme.hemiGround, 0.75]} />
    <directionalLight position={[-90, 70, 60]} intensity={theme.dirIntensity} color={theme.dirColor} />
    <Sky
      top={theme.skyTop}
      horizon={theme.skyHorizon}
      below={theme.skyBelow}
      sun={theme.sunColor}
      sunPosition={theme.sunPosition}
      sunScale={theme.sunScale}
      aurora={theme.aurora}
      motion={motion}
    />
    <Terrain low={low} theme={theme} />
    <Columns low={low} theme={theme} />
    <Fissure motion={motion} theme={theme} />
    <BasaltLandmarks theme={theme} motion={motion} />
    <GasVent x={byId['gas-vent'].position[0]} z={byId['gas-vent'].position[2]} motion={motion} theme={theme} />
    <Station x={st[0]} z={st[2]} seedOffset={theme.seedOffset} />
    {environment.locations.map((l) => <Beacon key={l.id} location={l} selected={selected === l.id} onSelect={onSelect} groundAt={groundAt} />)}
    <Equipment equipment={equipment} standAt={groundAt} motion={motion} />
    <PlaygroundStructures features={playgroundFeatures} unlockedFacilities={unlockedFacilities} anchor={[st[0], groundAt(st[0], st[2]), st[2]]} activeHazard={activeHazard} />
  </group>;
}
