import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { fbm, glowTexture, seeded } from './proceduralTextures.js';
import { Sky, Beacon, Equipment, PlaygroundStructures } from './environmentKit.jsx';
import { getPlanetTheme } from './planetThemes.js';

/**
 * Cryo-shelf & glacier canyon surface renderer (sceneKind 'ice-shelf') for
 * Boreas, Glaciera, and Nyxara. Features sculpted glacier ridges, translucent
 * sub-glacial brine sea, instanced crystalline ice spires, a heated polar
 * outpost, and pressurized cryo-geyser plumes.
 */

const RIDGE = [-16, -6];

export function heightAt(x, z, seedOffset = 0) {
  const s = seedOffset * 0.13;
  const d = Math.hypot(x - RIDGE[0], z - RIDGE[1]) / 26;
  const shelf = d < 1 ? 11.5 * (1 - d * d) ** 1.8 : 0;
  const crag = Math.abs(fbm(x * 0.08 + s, 1.4, z * 0.08 + s, 51, 4) * 2 - 1);
  const canyon = Math.exp(-((z - 4 - Math.sin(x * 0.07) * 5) ** 2) / 28) * 3.4;
  return shelf - 3.6 + crag * (shelf > 0.5 ? 5.2 : 1.6) - canyon;
}

function IceTerrain({ low, theme }) {
  const geo = useMemo(() => {
    const seg = low ? 100 : 160;
    const g = new THREE.PlaneGeometry(220, 220, seg, seg);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const snow = new THREE.Color(theme.snowColor);
    const glacier = new THREE.Color(theme.glacierColor);
    const ridge = new THREE.Color(theme.ridgeColor);
    const brine = new THREE.Color(theme.brineColor);
    const c = new THREE.Color();

    for (let i = 0; i < pos.count; i += 1) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const h = heightAt(x, z, theme.seedOffset);
      pos.setY(i, h);
      if (h < -0.5) c.copy(brine).lerp(glacier, Math.max(0, (h + 4) / 4) * 0.65);
      else if (h < 2.2) c.copy(glacier).lerp(snow, Math.min(1, (h + 0.5) / 2.7));
      else c.copy(snow).lerp(ridge, Math.min(0.65, (h - 2.2) / 9));
      colors.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    g.computeVertexNormals();
    return g;
  }, [low, theme]);

  useEffect(() => () => geo.dispose(), [geo]);
  return (
    <mesh geometry={geo}>
      <meshStandardMaterial vertexColors roughness={0.38} metalness={0.12} flatShading />
    </mesh>
  );
}

/** Translucent sub-glacial brine sea with gentle icy shimmer. */
function BrineSea({ motion, low, theme }) {
  const ref = useRef();
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(380, 380, low ? 52 : 92, low ? 52 : 92);
    g.rotateX(-Math.PI / 2);
    return g;
  }, [low]);
  const base = useMemo(() => Float32Array.from(geo.attributes.position.array), [geo]);
  useEffect(() => () => geo.dispose(), [geo]);

  useFrame(({ clock }) => {
    if (!motion || !ref.current) return;
    const t = clock.elapsedTime;
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i += 1) {
      const x = base[i * 3];
      const z = base[i * 3 + 2];
      pos.setY(i, Math.sin(x * 0.08 + t * 0.55) * 0.16 + Math.cos(z * 0.1 + t * 0.7) * 0.12);
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
  });

  return (
    <mesh ref={ref} geometry={geo}>
      <meshStandardMaterial color={theme.brineColor} transparent opacity={0.76} roughness={0.12} metalness={0.32} />
    </mesh>
  );
}

/** Instanced crystalline ice spires along the glacier flanks (1 draw call). */
function IceSpires({ low, theme }) {
  const ref = useRef();
  const spires = useMemo(() => {
    const rnd = seeded(131 + theme.seedOffset);
    const out = [];
    const count = low ? 48 : 88;
    for (let i = 0; i < count; i += 1) {
      const angle = rnd() * Math.PI * 2;
      const dist = 10 + rnd() * 44;
      const x = RIDGE[0] + Math.cos(angle) * dist;
      const z = RIDGE[1] + Math.sin(angle) * dist;
      const y = heightAt(x, z, theme.seedOffset);
      if (y < -0.2) continue;
      const h = 2.2 + rnd() * 6.5;
      const r = 0.55 + rnd() * 1.1;
      const tiltX = (rnd() - 0.5) * 0.28;
      const tiltZ = (rnd() - 0.5) * 0.28;
      out.push([x, y, z, r, h, tiltX, tiltZ]);
    }
    return out;
  }, [low, theme]);

  useLayoutEffect(() => {
    if (!ref.current) return;
    const dummy = new THREE.Object3D();
    spires.forEach(([x, y, z, r, h, tx, tz], i) => {
      dummy.position.set(x, y + h * 0.42, z);
      dummy.rotation.set(tx, i * 0.7, tz);
      dummy.scale.set(r, h, r);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  }, [spires]);

  if (!spires.length) return null;

  return (
    <instancedMesh ref={ref} args={[null, null, spires.length]} key={spires.length}>
      <coneGeometry args={[1, 1, 5]} />
      <meshStandardMaterial
        color={theme.spireColor}
        emissive={theme.glacierColor}
        emissiveIntensity={0.22}
        roughness={0.22}
        metalness={0.18}
        transparent
        opacity={0.88}
        flatShading
      />
    </instancedMesh>
  );
}

/** Heated polar ice-core research outpost on insulated stilts. */
function PolarOutpost({ position, theme }) {
  const y = Math.max(heightAt(position[0], position[2], theme.seedOffset), 0.15);
  return (
    <group position={[position[0], y, position[2]]}>
      {[[-3, -2.2], [3, -2.2], [-3, 2.2], [3, 2.2]].map(([lx, lz]) => (
        <mesh key={`${lx}${lz}`} position={[lx, 0.8, lz]}>
          <cylinderGeometry args={[0.16, 0.22, 2.2, 6]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.5} roughness={0.4} />
        </mesh>
      ))}
      <mesh position={[0, 1.8, 0]}>
        <boxGeometry args={[7.2, 0.55, 5.4]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.45} metalness={0.25} />
      </mesh>
      <mesh position={[0, 2.1, 0]}>
        <boxGeometry args={[7.3, 0.08, 5.5]} />
        <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={0.9} />
      </mesh>
      <mesh position={[-1.4, 3.0, 0]}>
        <sphereGeometry args={[1.65, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#e0f2fe" transparent opacity={0.82} roughness={0.12} />
      </mesh>
      <mesh position={[1.9, 2.9, 0]}>
        <cylinderGeometry args={[0.9, 0.9, 1.8, 8]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.5} />
      </mesh>
      <pointLight position={[0, 3.2, 0]} color="#fde68a" intensity={24} distance={18} />
    </group>
  );
}

function BrineProbe({ x, z }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.9, 1.0, 0.4, 8]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.4} roughness={0.4} />
      </mesh>
      <mesh position={[0, 1.6, 0]}>
        <cylinderGeometry args={[0.14, 0.14, 3.6, 8]} />
        <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={0.7} />
      </mesh>
    </group>
  );
}

function AuroraMast({ x, z, theme }) {
  const y = heightAt(x, z, theme.seedOffset);
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 3.2, 0]}>
        <cylinderGeometry args={[0.08, 0.14, 6.4, 8]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.4} roughness={0.35} />
      </mesh>
      <mesh position={[0, 6.5, 0]}>
        <octahedronGeometry args={[0.35, 0]} />
        <meshStandardMaterial color="#67e8f9" emissive="#22d3ee" emissiveIntensity={1.6} />
      </mesh>
    </group>
  );
}

/** Pressurized cryo-geyser erupting luminous frosted vapor sprites. */
function CryoGeyser({ x, z, motion, theme }) {
  const y = heightAt(x, z, theme.seedOffset);
  const tex = useMemo(() => glowTexture(theme.geyserColor, theme.geyserColor.replace(/[\d.]+\)$/, '0)')), [theme.geyserColor]);
  useEffect(() => () => tex.dispose(), [tex]);
  const puffs = useRef([]);
  const seeds = useMemo(() => Array.from({ length: 14 }, (_, i) => ({ phase: i / 14, drift: (seeded(i + 19)() - 0.5) * 1.4 })), []);

  useFrame(({ clock }) => {
    if (!motion) return;
    seeds.forEach((s, i) => {
      const p = puffs.current[i];
      if (!p) return;
      const t = (clock.elapsedTime * 0.2 + s.phase) % 1;
      p.position.set(s.drift * t * 3, 0.8 + t * 14, t * 2);
      p.scale.setScalar(1.2 + t * 5.2);
      p.material.opacity = 0.42 * (1 - t);
    });
  });

  return (
    <group position={[x, y, z]}>
      <mesh>
        <coneGeometry args={[1.6, 1.5, 8]} />
        <meshStandardMaterial color={theme.spireColor} roughness={0.3} flatShading />
      </mesh>
      <mesh position={[0, 0.85, 0]}>
        <sphereGeometry args={[0.42, 10, 8]} />
        <meshStandardMaterial color="#e0f2fe" emissive="#38bdf8" emissiveIntensity={1.8} />
      </mesh>
      {seeds.map((s, i) => (
        <sprite
          key={i}
          ref={(el) => { puffs.current[i] = el; }}
          position={[s.drift * s.phase * 3, 0.8 + s.phase * 14, s.phase * 2]}
          scale={1.2 + s.phase * 5.2}
        >
          <spriteMaterial map={tex} transparent opacity={0.42 * (1 - s.phase)} depthWrite={false} />
        </sprite>
      ))}
    </group>
  );
}

export default function ExplorerIceEnvironment({
  environment,
  selected,
  onSelect,
  motion,
  low,
  equipment = null,
  playgroundFeatures = [],
  unlockedFacilities = [],
  activeHazard = null
}) {
  const theme = useMemo(() => getPlanetTheme(environment.planetId, 'ice'), [environment.planetId]);
  const byId = Object.fromEntries(environment.locations.map((l) => [l.id, l]));
  const groundAt = (x, z) => heightAt(x, z, theme.seedOffset);
  const deck = byId.platform.position;
  const standAt = (x, z) => Math.max(groundAt(x, z), 0.15);

  return (
    <group>
      <fog attach="fog" args={[theme.fogColor, 80, 310]} />
      <hemisphereLight args={[theme.hemiSky, theme.hemiGround, 0.95]} />
      <directionalLight position={[70, 95, -55]} intensity={theme.dirIntensity} color={theme.dirColor} />
      <Sky
        top={theme.skyTop}
        horizon={theme.skyHorizon}
        below={theme.skyBelow}
        sun={theme.sunColor}
        sunPosition={theme.sunPosition}
        sunScale={theme.sunScale}
        ringArc={theme.ringArc}
        aurora={theme.aurora}
        motion={motion}
      />
      <IceTerrain low={low} theme={theme} />
      <BrineSea motion={motion} low={low} theme={theme} />
      <IceSpires low={low} theme={theme} />
      <PolarOutpost position={deck} theme={theme} />
      <AuroraMast x={byId['weather-mast'].position[0]} z={byId['weather-mast'].position[2]} theme={theme} />
      <BrineProbe x={byId['tide-gauge'].position[0]} z={byId['tide-gauge'].position[2]} />
      <CryoGeyser x={byId.vent.position[0]} z={byId.vent.position[2]} motion={motion} theme={theme} />
      {environment.locations.map((l) => (
        <Beacon key={l.id} location={l} selected={selected === l.id} onSelect={onSelect} groundAt={groundAt} />
      ))}
      <Equipment equipment={equipment} standAt={standAt} water={(x, z) => groundAt(x, z) < 0.1} motion={motion} />
      <PlaygroundStructures
        features={playgroundFeatures}
        unlockedFacilities={unlockedFacilities}
        anchor={[deck[0], Math.max(groundAt(deck[0], deck[2]), 0.15) + 2.1, deck[2]]}
        activeHazard={activeHazard}
      />
    </group>
  );
}
