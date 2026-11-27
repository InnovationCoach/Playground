import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { fbm, seeded } from './proceduralTextures.js';
import { Sky, Beacon, Equipment, PlaygroundStructures } from './environmentKit.jsx';
import { getPlanetTheme } from './planetThemes.js';

/**
 * Ocean-station surface renderer (sceneKind 'ocean-station').
 * Adapts sky, lighting, terrain palette, ocean swell, celestial rings/twin suns,
 * and biome landmarks per planetId (Thalassa, Pelagos, Aurelia, Veridia, Koralis, Zephyria).
 */

const HEADLAND = [-16, -6];
/** Ground height in metres (display units). Above 0 is land, below is seabed. */
export function heightAt(x, z, seedOffset = 0) {
  const s = seedOffset * 0.17;
  const d = Math.hypot(x - HEADLAND[0], z - HEADLAND[1]) / 24;
  const rugged = 0.7 + 0.6 * fbm(x * 0.05 + 3 + s, 1.7, z * 0.05 + 3 + s, 41, 3);
  const island = d < 1 ? 13 * (1 - d * d) ** 2 * rugged : 0;
  const n = fbm(x * 0.11 + 10 + s, 0.3, z * 0.11 + 10 + s, 77, 5) - 0.5;
  const ridge = 1 - Math.abs(fbm(x * 0.06 + s, 2.1, z * 0.06 + s, 9, 3) * 2 - 1);
  return island - 5 + n * (island > 0 ? 4.5 : 1.4) + (island > 2 ? ridge * 2.5 : 0);
}

function Terrain({ low, theme }) {
  const geo = useMemo(() => {
    const seg = low ? 110 : 170, g = new THREE.PlaneGeometry(220, 220, seg, seg);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position, colors = new Float32Array(pos.count * 3);
    const basalt = new THREE.Color(theme.rockColor), moss = new THREE.Color(theme.mossColor);
    const sand = new THREE.Color(theme.sandColor), seabed = new THREE.Color(theme.seabedColor);
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i += 1) {
      const x = pos.getX(i), z = pos.getZ(i), h = heightAt(x, z, theme.seedOffset);
      pos.setY(i, h);
      if (h < -0.6) c.copy(seabed).lerp(sand, Math.max(0, (h + 5) / 5) * 0.6);
      else if (h < 0.8) c.copy(sand);
      else c.copy(basalt).lerp(moss, Math.max(0, Math.min(1, fbm(x * 0.2, 1, z * 0.2, 5, 3) * 1.6 - 0.55)));
      colors.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    g.computeVertexNormals();
    return g;
  }, [low, theme]);
  useEffect(() => () => geo.dispose(), [geo]);
  return <mesh geometry={geo}><meshStandardMaterial vertexColors roughness={0.95} metalness={0} flatShading /></mesh>;
}

/** A gently moving sea surface. With motion off it holds still. */
function Ocean({ motion, low, theme }) {
  const ref = useRef();
  const geo = useMemo(() => { const g = new THREE.PlaneGeometry(400, 400, low ? 64 : 112, low ? 64 : 112); g.rotateX(-Math.PI / 2); return g; }, [low]);
  const base = useMemo(() => Float32Array.from(geo.attributes.position.array), [geo]);
  useEffect(() => () => geo.dispose(), [geo]);
  useFrame(({ clock }) => {
    if (!motion || !ref.current) return;
    const t = clock.elapsedTime, pos = geo.attributes.position;
    const amp = theme.swellScale || 1.0;
    for (let i = 0; i < pos.count; i += 1) {
      const x = base[i * 3], z = base[i * 3 + 2];
      pos.setY(i, (Math.sin(x * 0.09 + t * 0.8 * amp) * 0.35 + Math.sin(z * 0.13 + x * 0.04 + t * 1.1) * 0.22) * amp);
    }
    pos.needsUpdate = true; geo.computeVertexNormals();
  });
  return <mesh ref={ref} geometry={geo}><meshStandardMaterial color={theme.waterColor} transparent opacity={theme.waterOpacity} roughness={0.18} metalness={0.15} /></mesh>;
}

/** Planet-specific ocean biome landmarks (reef arches, glowing kelp, coral pillars, spore clouds). */
function OceanLandmarks({ theme, motion }) {
  const groupRef = useRef();
  const items = useMemo(() => {
    if (!theme.landmark) return [];
    const rnd = seeded(211 + theme.seedOffset);
    return Array.from({ length: 16 }, () => {
      const angle = rnd() * Math.PI * 2;
      const dist = 16 + rnd() * 34;
      return {
        x: Math.cos(angle) * dist,
        z: Math.sin(angle) * dist,
        s: 0.7 + rnd() * 1.1,
        rot: rnd() * Math.PI * 2,
        phase: rnd() * Math.PI * 2
      };
    });
  }, [theme]);

  useFrame(({ clock }) => {
    if (!motion || !groupRef.current) return;
    const t = clock.elapsedTime;
    if (theme.landmark === 'spore-motes' || theme.landmark === 'wind-streaks') {
      groupRef.current.children.forEach((child, i) => {
        child.position.y = 3.5 + Math.sin(t * 0.9 + items[i].phase) * 1.6;
      });
    }
  });

  if (!items.length) return null;

  return (
    <group ref={groupRef}>
      {items.map((it, i) => {
        if (theme.landmark === 'reef-arches') {
          return (
            <mesh key={i} position={[it.x, 0.2, it.z]} rotation={[0, it.rot, 0]} scale={it.s}>
              <torusGeometry args={[2.8, 0.55, 7, 16, Math.PI]} />
              <meshStandardMaterial color="#e7e5d0" roughness={0.85} flatShading />
            </mesh>
          );
        }
        if (theme.landmark === 'kelp-fronds') {
          return (
            <mesh key={i} position={[it.x, 1.4 * it.s, it.z]} rotation={[0.1, it.rot, 0.15]} scale={it.s}>
              <coneGeometry args={[0.45, 3.6, 5]} />
              <meshStandardMaterial color="#facc15" emissive="#ca8a04" emissiveIntensity={0.75} roughness={0.4} />
            </mesh>
          );
        }
        if (theme.landmark === 'coral-pillars') {
          return (
            <mesh key={i} position={[it.x, 0.9 * it.s, it.z]} rotation={[0, it.rot, 0]} scale={it.s}>
              <cylinderGeometry args={[0.9, 1.35, 2.6, 7]} />
              <meshStandardMaterial color={i % 2 === 0 ? '#fda4af' : '#f5ebe0'} roughness={0.8} flatShading />
            </mesh>
          );
        }
        if (theme.landmark === 'spore-motes') {
          return (
            <mesh key={i} position={[it.x, 3.5, it.z]}>
              <octahedronGeometry args={[0.38 * it.s, 0]} />
              <meshBasicMaterial color="#a3e635" transparent opacity={0.78} />
            </mesh>
          );
        }
        // wind-streaks (Zephyria)
        return (
          <mesh key={i} position={[it.x, 4 + (i % 4), it.z]} rotation={[0, 0.4, 0]}>
            <boxGeometry args={[6.5 * it.s, 0.08, 0.22]} />
            <meshBasicMaterial color="#e0f2fe" transparent opacity={0.42} />
          </mesh>
        );
      })}
    </group>
  );
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

function Mast({ x, z, seedOffset }) {
  const y = heightAt(x, z, seedOffset);
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

function Vent({ x, z, theme }) {
  const y = heightAt(x, z, theme.seedOffset);
  return <group position={[x, y, z]}>
    <mesh><coneGeometry args={[1.4, 1.6, 9]} /><meshStandardMaterial color={theme.rockColor} roughness={1} /></mesh>
    <mesh position={[0, 0.9, 0]}><sphereGeometry args={[0.45, 12, 10]} /><meshStandardMaterial color={theme.ventColor} emissive={theme.ventEmissive} emissiveIntensity={2} /></mesh>
    <pointLight position={[0, 1.4, 0]} color={theme.ventEmissive} intensity={30} distance={14} />
  </group>;
}

export default function ExplorerEnvironment({ environment, selected, onSelect, motion, low, equipment = null, playgroundFeatures = [], unlockedFacilities = [], activeHazard = null }) {
  const theme = useMemo(() => getPlanetTheme(environment.planetId, 'ocean'), [environment.planetId]);
  const byId = Object.fromEntries(environment.locations.map((l) => [l.id, l]));
  const groundAt = (x, z) => heightAt(x, z, theme.seedOffset);
  const deck = byId.platform.position, onDeck = (x, z) => Math.hypot(x - deck[0], z - deck[2]) < 6.5;
  const standAt = (x, z) => (onDeck(x, z) ? 0.76 : Math.max(groundAt(x, z), 0.1));
  const water = (x, z) => !onDeck(x, z) && groundAt(x, z) < 0.1;
  return <group>
    <fog attach="fog" args={[theme.fogColor, 90, 330]} />
    <hemisphereLight args={[theme.hemiSky, theme.hemiGround, 0.9]} />
    <directionalLight position={[80, 90, -60]} intensity={theme.dirIntensity} color={theme.dirColor} />
    <Sky
      top={theme.skyTop}
      horizon={theme.skyHorizon}
      below={theme.skyBelow}
      sun={theme.sunColor}
      sunPosition={theme.sunPosition}
      sunScale={theme.sunScale}
      secondSun={theme.secondSun}
      ringArc={theme.ringArc}
      aurora={theme.aurora}
      motion={motion}
    />
    <Terrain low={low} theme={theme} />
    <Ocean motion={motion} low={low} theme={theme} />
    <OceanLandmarks theme={theme} motion={motion} />
    <Platform position={[byId.platform.position[0], 0, byId.platform.position[2]]} />
    <Mast x={byId['weather-mast'].position[0]} z={byId['weather-mast'].position[2]} seedOffset={theme.seedOffset} />
    <TideGauge x={byId['tide-gauge'].position[0]} z={byId['tide-gauge'].position[2]} />
    <Vent x={byId.vent.position[0]} z={byId.vent.position[2]} theme={theme} />
    {environment.locations.map((l) => <Beacon key={l.id} location={l} selected={selected === l.id} onSelect={onSelect} groundAt={groundAt} />)}
    <Equipment equipment={equipment} standAt={standAt} water={water} motion={motion} />
    <PlaygroundStructures features={playgroundFeatures} unlockedFacilities={unlockedFacilities} anchor={[deck[0], 0.8, deck[2]]} activeHazard={activeHazard} />
  </group>;
}
