/**
 * Living 3D Isometric Mini-Diorama for District Selector cards
 * (City Heart, Riverside Rise, Coral Coast School).
 *
 * Features scenario-specific architectural character (canyon towers,
 * winding creek ribbon, school playground court markings), animated
 * focus-zone beacon glow, and automatic 2.5D CSS fallback when WebGL
 * is unavailable.
 */
import { useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { COLS, ROWS, TILE_TYPES } from './urbanHeatModel.js';
import {
  TILE_SIZE,
  TILE_STEP,
  TILE_3D_SPECS,
  tileToWorld,
  detectWebGLSupport
} from './urbanHeat3DConstants.js';

const PREVIEW_URLS = {
  'city-heart': '/assets/previews/urbanHeat/city-heart.jpg',
  riverside: '/assets/previews/urbanHeat/riverside.jpg',
  'school-zone': '/assets/previews/urbanHeat/school-zone.jpg'
};

function DioramaWorld({ grid, focus, scenarioId }) {
  const groupRef = useRef();
  const beaconRef = useRef();
  const focusSet = useMemo(() => new Set(focus || []), [focus]);

  // Compute centroid of focus area for the floating warm beacon
  const focusCenter = useMemo(() => {
    if (!focus || !focus.length) return { x: 0, z: 0 };
    let sx = 0;
    let sz = 0;
    focus.forEach((idx) => {
      const { x, z } = tileToWorld(idx);
      sx += x;
      sz += z;
    });
    return { x: sx / focus.length, z: sz / focus.length };
  }, [focus]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (groupRef.current) {
      // Gentle isometric turntable sway
      groupRef.current.rotation.y = Math.sin(t * 0.35) * 0.32 + 0.18;
    }
    if (beaconRef.current) {
      beaconRef.current.position.y = 1.15 + Math.sin(t * 3.0) * 0.12;
      beaconRef.current.rotation.y = t * 1.4;
    }
  });

  const width = COLS * TILE_STEP + 0.45;
  const depth = ROWS * TILE_STEP + 0.45;

  return (
    <group ref={groupRef}>
      {/* Diorama plinth */}
      <mesh position={[0, -0.18, 0]} receiveShadow>
        <boxGeometry args={[width, 0.3, depth]} />
        <meshStandardMaterial color="#1e293b" roughness={0.85} />
      </mesh>

      {/* Scenario-specific Riverside creek ribbon along the south edge */}
      {scenarioId === 'riverside' && (
        <mesh position={[0, 0.06, (ROWS * TILE_STEP) / 2 + 0.02]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[width - 0.5, 0.55]} />
          <meshStandardMaterial color="#0ea5e9" roughness={0.2} metalness={0.15} />
        </mesh>
      )}

      {/* Tiles */}
      {grid.map((code, i) => {
        const spec = TILE_3D_SPECS[code] || TILE_3D_SPECS.G;
        const { x, z } = tileToWorld(i);
        const isFocus = focusSet.has(i);
        const isSchoolPlayground = scenarioId === 'school-zone' && isFocus && code === 'P';

        return (
          <group key={i} position={[x, 0, z]}>
            {/* Ground tile */}
            <mesh position={[0, spec.elevation / 2, 0]} receiveShadow>
              <boxGeometry args={[TILE_SIZE, spec.elevation, TILE_SIZE]} />
              <meshStandardMaterial
                color={spec.baseColor}
                roughness={spec.roughness || 0.85}
                emissive={isFocus ? '#f59e0b' : '#000000'}
                emissiveIntensity={isFocus ? 0.22 : 0}
              />
            </mesh>

            {/* Focus amber border */}
            {isFocus && (
              <mesh position={[0, spec.elevation + 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.42, 0.49, 4]} />
                <meshBasicMaterial color="#fde047" transparent opacity={0.85} />
              </mesh>
            )}

            {/* School playground court lines */}
            {isSchoolPlayground && (
              <mesh position={[0, spec.elevation + 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.24, 0.28, 16]} />
                <meshBasicMaterial color="#e2e8f0" transparent opacity={0.65} />
              </mesh>
            )}

            {/* Road lane dashes */}
            {(code === 'R' || code === 'C' || code === 'E') && (
              <mesh position={[0, spec.elevation + 0.01, 0]}>
                <boxGeometry args={[0.45, 0.01, 0.06]} />
                <meshBasicMaterial color="#e2e8f0" />
              </mesh>
            )}

            {/* Low-rise building / school pavilion */}
            {(code === 'B' || code === 'L' || code === 'V') && (
              <group position={[0, spec.elevation, 0]}>
                <mesh position={[0, spec.buildingHeight / 2, 0]} castShadow receiveShadow>
                  <boxGeometry args={[0.72, spec.buildingHeight, 0.68]} />
                  <meshStandardMaterial
                    color={scenarioId === 'school-zone' ? '#fef3c7' : spec.wallColor}
                    roughness={0.78}
                  />
                </mesh>
                <mesh position={[0, spec.buildingHeight + 0.045, 0]} castShadow>
                  <boxGeometry args={[0.78, 0.09, 0.74]} />
                  <meshStandardMaterial
                    color={scenarioId === 'school-zone' ? '#0369a1' : spec.roofColor}
                    roughness={0.55}
                  />
                </mesh>
              </group>
            )}

            {/* High-density apartment tower */}
            {code === 'H' && (
              <group position={[0, spec.elevation, 0]}>
                <mesh position={[0, spec.buildingHeight / 2, 0]} castShadow receiveShadow>
                  <boxGeometry args={[0.74, spec.buildingHeight, 0.74]} />
                  <meshStandardMaterial color={spec.wallColor} roughness={0.55} />
                </mesh>
                <mesh position={[0, spec.buildingHeight + 0.08, 0]} castShadow>
                  <boxGeometry args={[0.48, 0.16, 0.48]} />
                  <meshStandardMaterial color={spec.roofColor} roughness={0.5} />
                </mesh>
              </group>
            )}

            {/* Mature eucalyptus / pocket forest trees */}
            {(code === 'T' || code === 'E') && (
              <group position={[0, spec.elevation, 0]}>
                {(code === 'T'
                  ? [[-0.22, -0.2, 1.05], [0.22, -0.15, 0.95], [0, 0.22, 1.1]]
                  : [[-0.26, -0.32, 0.8], [0.26, 0.32, 0.8]]
                ).map(([ox, oz, s], k) => (
                  <group key={k} position={[ox, 0, oz]}>
                    <mesh position={[0, 0.15 * s, 0]} castShadow>
                      <cylinderGeometry args={[0.04 * s, 0.06 * s, 0.3 * s, 5]} />
                      <meshStandardMaterial color="#78492a" roughness={0.95} />
                    </mesh>
                    <mesh position={[0, 0.38 * s, 0]} castShadow>
                      <dodecahedronGeometry args={[0.22 * s, 0]} />
                      <meshStandardMaterial color="#15803d" roughness={0.85} flatShading />
                    </mesh>
                  </group>
                ))}
              </group>
            )}
          </group>
        );
      })}

      {/* Floating warm focus-zone beacon */}
      {focus && focus.length > 0 && (
        <group ref={beaconRef} position={[focusCenter.x, 1.15, focusCenter.z]}>
          <mesh>
            <octahedronGeometry args={[0.2, 0]} />
            <meshStandardMaterial
              color="#fde047"
              emissive="#f59e0b"
              emissiveIntensity={1.1}
              roughness={0.2}
            />
          </mesh>
        </group>
      )}
    </group>
  );
}

/** 2.5D Isometric CSS Fallback for jsdom / non-WebGL environments. */
function FallbackMiniMap({ grid, focus = [] }) {
  const f = new Set(focus);
  return (
    <div className="uh-diorama-fallback" aria-hidden="true">
      <div className="uh-mini uh-mini-iso" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}>
        {grid.map((code, i) => (
          <span
            key={i}
            className={f.has(i) ? 'is-focus' : ''}
            style={{ background: TILE_TYPES[code].color }}
          />
        ))}
      </div>
    </div>
  );
}

export function DistrictDiorama3D({ grid, focus = [], scenarioId, label }) {
  const hasWebGL = useMemo(() => detectWebGLSupport(), []);
  const previewUrl = PREVIEW_URLS[scenarioId] || null;
  const [live3D, setLive3D] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  const showLiveCanvas = hasWebGL && (live3D || !previewUrl || imgFailed);

  return (
    <div
      className="uh-diorama-box"
      data-testid={`district-diorama-${scenarioId || 'custom'}`}
      aria-label={label ? `3D isometric preview of ${label}` : '3D isometric district preview'}
    >
      {showLiveCanvas ? (
        <Canvas
          shadows
          dpr={[1, 1.5]}
          camera={{ position: [8.4, 8.8, 8.4], fov: 27, near: 0.1, far: 50 }}
          gl={{ antialias: true, powerPreference: 'default' }}
        >
          <color attach="background" args={['#0b1325']} />
          <hemisphereLight args={['#e0f2fe', '#1e293b', 0.9]} />
          <directionalLight
            position={[7, 11, 5]}
            intensity={1.5}
            color="#fff7ed"
            castShadow
            shadow-mapSize-width={512}
            shadow-mapSize-height={512}
          />
          <DioramaWorld grid={grid} focus={focus} scenarioId={scenarioId} />
        </Canvas>
      ) : previewUrl && !imgFailed ? (
        <img
          src={previewUrl}
          alt={label ? `Isometric 3D render of ${label}` : 'Isometric 3D district render'}
          className="uh-diorama-img"
          loading="lazy"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <FallbackMiniMap grid={grid} focus={focus} />
      )}

      {hasWebGL && previewUrl && !imgFailed ? (
        <button
          type="button"
          className={`uh-diorama-toggle ${live3D ? 'is-on' : ''}`}
          onClick={() => setLive3D((v) => !v)}
          aria-pressed={live3D}
          title={live3D ? 'Switch back to pre-rendered studio snapshot' : 'Interact with live 3D procedural diorama'}
        >
          {live3D ? 'Live 3D' : '3D View'}
        </button>
      ) : (
        <span className="uh-diorama-badge" aria-hidden="true">3D</span>
      )}
    </div>
  );
}

export default DistrictDiorama3D;
