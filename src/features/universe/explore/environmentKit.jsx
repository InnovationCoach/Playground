import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { glowTexture } from './proceduralTextures.js';

/** Pieces every planet surface shares: a gradient sky with a sun, and inspectable location beacons. */

const SKY_VERT = 'varying vec3 vW; void main(){ vW = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }';
const SKY_FRAG = 'varying vec3 vW; uniform vec3 top; uniform vec3 horizon; uniform vec3 below; void main(){ float h = vW.y; vec3 c = h > 0.0 ? mix(horizon, top, pow(h, 0.55)) : mix(horizon, below, min(1.0, -h * 6.0)); gl_FragColor = vec4(c, 1.0); }';

export function Sky({ top, horizon, below, sun = 'rgba(255,250,232,1)', sunPosition = [160, 120, -260], sunScale = 90 }) {
  const mat = useMemo(() => new THREE.ShaderMaterial({ vertexShader: SKY_VERT, fragmentShader: SKY_FRAG, side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color(top) }, horizon: { value: new THREE.Color(horizon) }, below: { value: new THREE.Color(below) } } }), [top, horizon, below]);
  const sunTex = useMemo(() => glowTexture(sun, sun.replace(/[\d.]+\)$/, '0)')), [sun]);
  useEffect(() => () => { mat.dispose(); sunTex.dispose(); }, [mat, sunTex]);
  return <group>
    <mesh material={mat}><sphereGeometry args={[480, 32, 16]} /></mesh>
    <sprite position={sunPosition} scale={[sunScale, sunScale, 1]}><spriteMaterial map={sunTex} transparent depthWrite={false} fog={false} /></sprite>
  </group>;
}

/** Inspectable place: a slim beacon from the ground with a label; lime when selected. */
export function Beacon({ location, selected, onSelect, groundAt }) {
  const [x, , z] = location.position, ground = Math.max(groundAt(x, z), 0), top = Math.max(location.position[1], ground) + 2.2;
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

/** A portable wind sensor: tripod, cup anemometer and a small vane. The cups turn only with motion on. */
function WindSensor({ motion }) {
  const cups = useRef();
  useFrame((_, dt) => { if (motion && cups.current) cups.current.rotation.y += dt * 4; });
  return <group>
    <TripodLegs />
    <mesh position={[0, 1.6, 0]}><cylinderGeometry args={[0.05, 0.05, 1.8, 8]} /><meshStandardMaterial color="#d7dde3" metalness={0.5} roughness={0.35} /></mesh>
    <group ref={cups} position={[0, 2.55, 0]}>
      {[0, 1, 2].map((i) => <group key={i} rotation={[0, (i * Math.PI * 2) / 3, 0]}>
        <mesh position={[0.32, 0, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.02, 0.02, 0.6, 6]} /><meshStandardMaterial color="#d7dde3" /></mesh>
        <mesh position={[0.62, 0, 0]} rotation={[Math.PI / 2, 0, 0]}><sphereGeometry args={[0.13, 12, 8, 0, Math.PI]} /><meshStandardMaterial color="#e0589c" side={THREE.DoubleSide} /></mesh>
      </group>)}
    </group>
    <mesh position={[0, 2.25, -0.35]}><boxGeometry args={[0.04, 0.22, 0.7]} /><meshStandardMaterial color="#96d700" emissive="#3c5a00" /></mesh>
  </group>;
}

/** A solar meter: tripod, tilted sensor plate and a small logger box. */
function SolarMeter() {
  return <group>
    <TripodLegs />
    <mesh position={[0, 1.35, 0]}><cylinderGeometry args={[0.05, 0.05, 1.3, 8]} /><meshStandardMaterial color="#d7dde3" metalness={0.5} roughness={0.35} /></mesh>
    <mesh position={[0, 2.05, 0]} rotation={[-0.6, 0, 0]}><boxGeometry args={[0.9, 0.05, 0.7]} /><meshStandardMaterial color="#1e3350" metalness={0.6} roughness={0.25} /></mesh>
    <mesh position={[0, 2.09, 0.02]} rotation={[-0.6, 0, 0]}><cylinderGeometry args={[0.16, 0.16, 0.06, 16]} /><meshStandardMaterial color="#eef2f4" emissive="#f2b84b" emissiveIntensity={0.4} /></mesh>
    <mesh position={[0.22, 1.05, 0]}><boxGeometry args={[0.32, 0.4, 0.2]} /><meshStandardMaterial color="#96d700" emissive="#3c5a00" /></mesh>
  </group>;
}

function TripodLegs() {
  return [0, 1, 2].map((i) => { const a = (i * Math.PI * 2) / 3;
    return <mesh key={i} position={[Math.cos(a) * 0.32, 0.42, Math.sin(a) * 0.32]} rotation={[Math.sin(a) * 0.4, 0, -Math.cos(a) * 0.4]}>
      <cylinderGeometry args={[0.03, 0.04, 0.95, 6]} /><meshStandardMaterial color="#9aa3ad" metalness={0.5} roughness={0.4} /></mesh>; });
}

const INSTRUMENTS = { 'wind-sensor': WindSensor, 'solar-meter': SolarMeter };

/**
 * Planned equipment for this visit (O04): the placed instrument with a lime ground ring, and a faint
 * ring where the learner is considering moving it. A plan only: it measures nothing. `standAt` gives
 * the surface height the instrument rests on; `water` marks spots that need a small float.
 */
export function Equipment({ equipment, standAt, water = () => false, motion }) {
  if (!equipment) return null;
  const Instrument = INSTRUMENTS[equipment.kind];
  const at = (site) => [site.x, standAt(site.x, site.z), site.z];
  return <group>
    {equipment.placed && Instrument && <group position={at(equipment.placed)}>
      {water(equipment.placed.x, equipment.placed.z) && <mesh position={[0, 0.05, 0]}><cylinderGeometry args={[0.9, 0.9, 0.22, 16]} /><meshStandardMaterial color="#f2b84b" roughness={0.6} /></mesh>}
      <mesh position={[0, 0.3, 0]} rotation={[-Math.PI / 2, 0, 0]}><torusGeometry args={[1.2, 0.09, 8, 40]} /><meshBasicMaterial color="#96d700" /></mesh>
      <Instrument motion={motion} />
    </group>}
    {equipment.preview && <group position={at(equipment.preview)}>
      <mesh position={[0, 0.3, 0]} rotation={[-Math.PI / 2, 0, 0]}><torusGeometry args={[1.2, 0.07, 8, 40]} /><meshBasicMaterial color="#9bd2ff" transparent opacity={0.7} /></mesh>
      <mesh position={[0, 1.2, 0]}><cylinderGeometry args={[0.04, 0.04, 2.4, 6]} /><meshBasicMaterial color="#9bd2ff" transparent opacity={0.6} /></mesh>
    </group>}
  </group>;
}
