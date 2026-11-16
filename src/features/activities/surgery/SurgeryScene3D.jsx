import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html, OrbitControls } from '@react-three/drei';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { ORGANS, ORGAN_BY_ID, STL_MODELS } from './surgeryModel.js';

const stlCache = new Map();
const stlInFlight = new Map();

function normalizeGeometry(geometry) {
  geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  const center = new THREE.Vector3();
  const size = new THREE.Vector3();
  box.getCenter(center);
  box.getSize(size);
  const maxDim = Math.max(size.x, size.y, size.z) || 1;
  geometry.translate(-center.x, -center.y, -center.z);
  geometry.scale(1 / maxDim, 1 / maxDim, 1 / maxDim);
  geometry.computeVertexNormals();
  return geometry;
}

function useStlGeometry(url) {
  const [geom, setGeom] = useState(() => (url ? stlCache.get(url) || null : null));

  useEffect(() => {
    if (!url) {
      setGeom(null);
      return undefined;
    }
    if (stlCache.has(url)) {
      setGeom(stlCache.get(url));
      return undefined;
    }
    let cancelled = false;
    let promise = stlInFlight.get(url);
    if (!promise) {
      const loader = new STLLoader();
      promise = new Promise((resolve, reject) => {
        loader.load(
          url,
          (raw) => {
            const normalized = normalizeGeometry(raw);
            stlCache.set(url, normalized);
            resolve(normalized);
          },
          undefined,
          (err) => reject(err)
        );
      });
      stlInFlight.set(url, promise);
    }

    promise
      .then((normalized) => {
        if (!cancelled) setGeom(normalized);
      })
      .catch(() => {
        // Procedural fallback remains active if offline or CORS/network fails.
      });

    return () => {
      cancelled = true;
    };
  }, [url]);

  return geom;
}

/**
 * Procedural anatomical meshes for organs without separate STLs
 * (and instant fallback while STLs stream from Cloudinary).
 */
function ProceduralOrgan({ organId, color, isTarget, warningActive }) {
  const emissive = warningActive && isTarget ? '#ef4444' : isTarget ? '#38bdf8' : '#000000';
  const emissiveIntensity = warningActive && isTarget ? 0.55 : isTarget ? 0.28 : 0;

  const matProps = {
    color,
    roughness: 0.38,
    metalness: 0.08,
    emissive,
    emissiveIntensity
  };

  switch (organId) {
    case 'brain':
      return (
        <group scale={[0.42, 0.36, 0.44]}>
          <mesh position={[-0.22, 0, 0]} scale={[0.9, 1, 1.15]}>
            <sphereGeometry args={[0.5, 24, 24]} />
            <meshStandardMaterial {...matProps} />
          </mesh>
          <mesh position={[0.22, 0, 0]} scale={[0.9, 1, 1.15]}>
            <sphereGeometry args={[0.5, 24, 24]} />
            <meshStandardMaterial {...matProps} />
          </mesh>
        </group>
      );
    case 'heart':
      return (
        <group scale={[0.26, 0.3, 0.26]} rotation={[0, 0, -0.25]}>
          <mesh position={[0, 0.1, 0]} scale={[1, 1.25, 0.9]}>
            <sphereGeometry args={[0.62, 24, 24]} />
            <meshStandardMaterial {...matProps} />
          </mesh>
          <mesh position={[-0.18, 0.62, 0]} rotation={[0, 0, 0.3]}>
            <cylinderGeometry args={[0.14, 0.16, 0.45, 14]} />
            <meshStandardMaterial {...matProps} color="#be123c" />
          </mesh>
        </group>
      );
    case 'lungs':
      return (
        <group>
          <mesh position={[0, 0.32, 0]}>
            <cylinderGeometry args={[0.055, 0.065, 0.36, 14]} />
            <meshStandardMaterial {...matProps} color="#fda4af" />
          </mesh>
          <mesh position={[-0.26, -0.02, 0]} scale={[0.85, 1.45, 0.72]} rotation={[0, 0, 0.15]}>
            <sphereGeometry args={[0.24, 22, 22]} />
            <meshStandardMaterial {...matProps} />
          </mesh>
          <mesh position={[0.26, -0.02, 0]} scale={[0.85, 1.45, 0.72]} rotation={[0, 0, -0.15]}>
            <sphereGeometry args={[0.24, 22, 22]} />
            <meshStandardMaterial {...matProps} />
          </mesh>
        </group>
      );
    case 'liver':
      return (
        <group rotation={[0, 0, 0.2]}>
          <mesh position={[-0.06, 0, 0]} scale={[1.45, 0.85, 0.75]}>
            <sphereGeometry args={[0.2, 20, 20]} />
            <meshStandardMaterial {...matProps} />
          </mesh>
          <mesh position={[0.16, -0.03, 0.03]} scale={[0.9, 0.65, 0.65]}>
            <sphereGeometry args={[0.14, 18, 18]} />
            <meshStandardMaterial {...matProps} />
          </mesh>
        </group>
      );
    case 'stomach':
      return (
        <group rotation={[0, 0, -0.4]}>
          <mesh scale={[0.95, 1.35, 0.8]}>
            <sphereGeometry args={[0.17, 20, 20]} />
            <meshStandardMaterial {...matProps} />
          </mesh>
          <mesh position={[0.11, -0.14, 0]} rotation={[0, 0, 1.1]}>
            <torusGeometry args={[0.1, 0.06, 12, 20, Math.PI]} />
            <meshStandardMaterial {...matProps} />
          </mesh>
        </group>
      );
    case 'small_intestine':
      return (
        <group>
          {[-0.1, 0, 0.1].map((y, idx) => (
            <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, idx * 0.5]}>
              <torusGeometry args={[0.15 - idx * 0.015, 0.045, 12, 24]} />
              <meshStandardMaterial {...matProps} />
            </mesh>
          ))}
        </group>
      );
    case 'large_intestine':
      return (
        <group>
          <mesh position={[-0.27, -0.02, 0]}>
            <capsuleGeometry args={[0.065, 0.36, 8, 14]} />
            <meshStandardMaterial {...matProps} />
          </mesh>
          <mesh position={[0, 0.2, 0]} rotation={[0, 0, Math.PI / 2]}>
            <capsuleGeometry args={[0.065, 0.52, 8, 14]} />
            <meshStandardMaterial {...matProps} />
          </mesh>
          <mesh position={[0.27, -0.02, 0]}>
            <capsuleGeometry args={[0.065, 0.36, 8, 14]} />
            <meshStandardMaterial {...matProps} />
          </mesh>
        </group>
      );
    default:
      return (
        <mesh>
          <sphereGeometry args={[0.2, 20, 20]} />
          <meshStandardMaterial {...matProps} />
        </mesh>
      );
  }
}

function OrganMesh({ organ, isTarget, isHovered, warningActive, extractionProgress, extractionOffset, onSelect }) {
  const stlGeom = useStlGeometry(organ.stlUrl);
  const groupRef = useRef();

  const stlScale = useMemo(() => {
    if (organ.id === 'brain') return 0.68;
    if (organ.id === 'heart') return 0.42;
    return 0.5;
  }, [organ.id]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const [bx, by, bz] = organ.cavityPos;
    if (isTarget && extractionProgress > 0) {
      const liftZ = bz + extractionProgress * 0.85;
      const liftY = by + extractionProgress * 0.22 + (extractionOffset?.y || 0) * 0.22;
      const liftX = bx + (extractionOffset?.x || 0) * 0.22;
      groupRef.current.position.lerp(new THREE.Vector3(liftX, liftY, liftZ), Math.min(1, delta * 12));
    } else {
      groupRef.current.position.lerp(new THREE.Vector3(bx, by, bz), Math.min(1, delta * 8));
    }
  });

  const rimColor = warningActive && isTarget
    ? '#ef4444'
    : isTarget
      ? '#38bdf8'
      : isHovered
        ? '#f59e0b'
        : '#d97706';

  return (
    <group>
      {/* Conductive Edge Ring around the cavity */}
      <mesh position={[organ.cavityPos[0], organ.cavityPos[1], organ.cavityPos[2] + 0.04]}>
        <torusGeometry args={[organ.cavityRadius * 0.82, 0.018, 12, 36]} />
        <meshStandardMaterial
          color={rimColor}
          emissive={rimColor}
          emissiveIntensity={warningActive && isTarget ? 1.4 : isTarget ? 0.8 : 0.35}
          metalness={0.85}
          roughness={0.2}
        />
      </mesh>

      {/* Organ 3D Geometry (STL if loaded, else Procedural) */}
      <group
        ref={groupRef}
        position={organ.cavityPos}
        onClick={(e) => {
          e.stopPropagation();
          onSelect?.(organ.id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto';
        }}
      >
        {stlGeom ? (
          <mesh
            geometry={stlGeom}
            scale={[stlScale, stlScale, stlScale]}
            rotation={organ.id === 'brain' ? [-Math.PI / 2, 0, 0] : [0, 0, 0]}
          >
            <meshStandardMaterial
              color={organ.color}
              roughness={0.35}
              metalness={0.1}
              emissive={warningActive && isTarget ? '#ef4444' : isTarget ? '#38bdf8' : '#000000'}
              emissiveIntensity={warningActive && isTarget ? 0.55 : isTarget ? 0.25 : 0}
            />
          </mesh>
        ) : (
          <ProceduralOrgan
            organId={organ.id}
            color={organ.color}
            isTarget={isTarget}
            warningActive={warningActive}
          />
        )}

        {/* Plastic Tweezers visual gripping the organ during extraction */}
        {isTarget && extractionProgress > 0 && (
          <group position={[0, 0.06, 0.28]} rotation={[0.45, 0, 0]}>
            <mesh position={[-0.04, 0.16, 0]} rotation={[0, 0, -0.1]}>
              <boxGeometry args={[0.025, 0.42, 0.025]} />
              <meshStandardMaterial color="#e2e8f0" roughness={0.25} />
            </mesh>
            <mesh position={[0.04, 0.16, 0]} rotation={[0, 0, 0.1]}>
              <boxGeometry args={[0.025, 0.42, 0.025]} />
              <meshStandardMaterial color="#e2e8f0" roughness={0.25} />
            </mesh>
            <mesh position={[0, 0.36, 0]}>
              <boxGeometry args={[0.07, 0.05, 0.03]} />
              <meshStandardMaterial color="#0284c7" roughness={0.3} />
            </mesh>
          </group>
        )}

        {isTarget && (
          <Html position={[0, organ.cavityRadius * 0.72, 0.2]} center distanceFactor={6}>
            <div className={`surg-3d-tag ${warningActive ? 'is-danger' : ''}`}>
              {organ.name} · {organ.points} pts
            </div>
          </Html>
        )}
      </group>
    </group>
  );
}

function HumanBodyBoard({ warningActive }) {
  return (
    <group>
      {/* Surgical Operating Table Base */}
      <mesh position={[0, 0.52, -0.22]}>
        <boxGeometry args={[1.95, 3.5, 0.14]} />
        <meshStandardMaterial color="#0f172a" roughness={0.5} metalness={0.25} />
      </mesh>
      {/* Translucent Anatomical Torso & Head Shell */}
      <mesh position={[0, 1.85, -0.06]}>
        <sphereGeometry args={[0.48, 28, 28]} />
        <meshStandardMaterial color="#38bdf8" transparent opacity={0.14} roughness={0.2} />
      </mesh>
      <mesh position={[0, 1.32, -0.06]}>
        <cylinderGeometry args={[0.16, 0.2, 0.28, 18]} />
        <meshStandardMaterial color="#38bdf8" transparent opacity={0.14} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.36, -0.06]} scale={[1.18, 1.65, 0.48]}>
        <sphereGeometry args={[0.68, 28, 28]} />
        <meshStandardMaterial color="#38bdf8" transparent opacity={0.13} roughness={0.2} />
      </mesh>

      {/* Electronic Warning Circuit LED mounted on top-right of board */}
      <group position={[0.78, 2.02, -0.1]}>
        <mesh>
          <cylinderGeometry args={[0.09, 0.09, 0.12, 20]} />
          <meshStandardMaterial
            color={warningActive ? '#ef4444' : '#22c55e'}
            emissive={warningActive ? '#ef4444' : '#22c55e'}
            emissiveIntensity={warningActive ? 2.0 : 0.4}
          />
        </mesh>
      </group>
    </group>
  );
}

export function SurgeryScene3D({
  activeOrganId,
  phase,
  warningActive,
  extractionProgress = 0,
  extractionOffset = { x: 0, y: 0 },
  onSelectOrgan
}) {
  const [hoveredId, setHoveredId] = useState(null);

  return (
    <div className="surg-canvas-wrap" aria-label="Interactive 3D Human Body Model">
      <Canvas camera={{ position: [0, 0.72, 3.8], fov: 42 }} dpr={[1, 2]}>
        <color attach="background" args={['#09111f']} />
        <ambientLight intensity={0.75} />
        <directionalLight position={[3, 4, 5]} intensity={1.15} />
        <directionalLight position={[-3, -2, 3]} intensity={0.45} color="#7dd3fc" />

        <HumanBodyBoard warningActive={warningActive} />

        {ORGANS.map((organ) => (
          <OrganMesh
            key={organ.id}
            organ={organ}
            isTarget={organ.id === activeOrganId}
            isHovered={organ.id === hoveredId}
            warningActive={warningActive}
            extractionProgress={organ.id === activeOrganId ? extractionProgress : 0}
            extractionOffset={organ.id === activeOrganId ? extractionOffset : null}
            onSelect={(id) => {
              setHoveredId(id);
              if (phase === 'identify') {
                onSelectOrgan?.(id);
              }
            }}
          />
        ))}

        <OrbitControls
          enablePan={false}
          minDistance={2.2}
          maxDistance={5.4}
          target={[0, 0.65, 0]}
          enabled={phase !== 'extract'}
        />
      </Canvas>
    </div>
  );
}

/**
 * Dedicated 3D Inspector for the Anatomy Learning Guide (showcases Ana Isa Palazuelos's STL models).
 */
export function OrganInspector3D({ organId, showDigestiveStl = false }) {
  const organ = ORGAN_BY_ID[organId] || ORGANS[0];
  const stlUrl = showDigestiveStl ? STL_MODELS.digestive : organ.stlUrl;
  const stlGeom = useStlGeometry(stlUrl);

  return (
    <div className="surg-inspector-canvas">
      <Canvas camera={{ position: [0, 0, 1.9], fov: 40 }} dpr={[1, 2]}>
        <color attach="background" args={['#0b1426']} />
        <ambientLight intensity={0.85} />
        <directionalLight position={[2, 3, 4]} intensity={1.15} />
        <directionalLight position={[-2, -2, 2]} intensity={0.4} color="#93c5fd" />

        <RotatingSpecimen>
          {stlGeom ? (
            <mesh
              geometry={stlGeom}
              scale={[1.05, 1.05, 1.05]}
              rotation={organ.id === 'brain' && !showDigestiveStl ? [-Math.PI / 2, 0, 0] : [0, 0, 0]}
            >
              <meshStandardMaterial color={organ.color} roughness={0.35} metalness={0.1} />
            </mesh>
          ) : (
            <group scale={[1.8, 1.8, 1.8]}>
              <ProceduralOrgan organId={organ.id} color={organ.color} isTarget={false} warningActive={false} />
            </group>
          )}
        </RotatingSpecimen>

        <OrbitControls enablePan={false} minDistance={1.1} maxDistance={3.2} />
      </Canvas>
    </div>
  );
}

function RotatingSpecimen({ children }) {
  const ref = useRef();
  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.35;
    }
  });
  return <group ref={ref}>{children}</group>;
}
