import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
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
