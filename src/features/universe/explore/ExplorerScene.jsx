import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { Html, OrbitControls } from '@react-three/drei';
import { glowTexture, nebulaTexture, planetTextures, ringTexture, seeded, disposeAll } from './proceduralTextures.js';
import { childrenOf } from './explorerModel.js';

/**
 * Space levels of the exploration spike. Each level is its own presentation
 * scale with a local origin (staged scales, UNIVERSE.md §6): nothing here uses
 * astronomical coordinates, and orbits are drawn "not to scale".
 */

// Textures are created once per mount and released on unmount (three.js does not free GPU memory on its own).
function useOwnedTextures(make, deps) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const textures = useMemo(make, deps);
  useEffect(() => () => disposeAll(textures), [textures]);
  return textures;
}

const pick = (handler) => (e) => { if (e.delta < 6) { e.stopPropagation(); handler(); } };
const hoverOn = () => { document.body.style.cursor = 'pointer'; };
const hoverOff = () => { document.body.style.cursor = ''; };

export function Starfield({ low }) {
  const tex = useOwnedTextures(() => ({ dot: glowTexture() }), []);
  const layers = useMemo(() => [[low ? 900 : 1600, 180, 1.1, '#cfe0ff'], [low ? 500 : 800, 150, 1.8, '#ffffff'], [low ? 120 : 220, 120, 2.8, '#ffe9c9']].map(([count, radius, size, color], li) => {
    const rnd = seeded(31 + li * 17), p = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      const u = rnd() * 2 - 1, t = rnd() * Math.PI * 2, s = Math.sqrt(1 - u * u), r = radius * (0.85 + rnd() * 0.15);
      p.set([r * s * Math.cos(t), r * u, r * s * Math.sin(t)], i * 3);
    }
    return { p, size, color, count };
  }), [low]);
  return <group>{layers.map((l, i) => <points key={i} frustumCulled={false}>
    <bufferGeometry><bufferAttribute attach="attributes-position" count={l.count} array={l.p} itemSize={3} /></bufferGeometry>
    <pointsMaterial map={tex.dot} color={l.color} size={l.size} sizeAttenuation={false} transparent depthWrite={false} opacity={0.9} fog={false} />
  </points>)}</group>;
}

export function Nebulae({ low }) {
  const tex = useOwnedTextures(() => ({ a: nebulaTexture('#8250a0', 5), b: nebulaTexture('#2a8fa8', 11), c: nebulaTexture('#ae266c', 19) }), []);
  const items = [[tex.a, [-60, 20, -110], 120, 0.55], [tex.b, [70, -10, -120], 100, 0.4], [tex.c, [10, 45, -140], 90, 0.35]];
  return <group>{items.slice(0, low ? 2 : 3).map(([map, pos, scale, opacity], i) => <sprite key={i} position={pos} scale={[scale, scale, 1]}>
    <spriteMaterial map={map} transparent opacity={opacity} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} />
  </sprite>)}</group>;
}

/** Particle disc: two-armed spiral or a soft elliptical cloud. One draw call plus a core glow. */
function GalaxyDisc({ galaxy, radius = 6, low }) {
  const k = radius / 6; // close-up views are larger: more, finer stars and proportionally wider arms
  const tex = useOwnedTextures(() => ({ dot: glowTexture(), core: glowTexture('rgba(255,244,220,1)', 'rgba(255,200,150,0)') }), []);
  const { positions, colors, count } = useMemo(() => {
    const n = (low ? 2200 : 4200) * (galaxy.type === 'spiral' ? 1 : 0.8) * (k > 1.5 ? 1.8 : 1) | 0, rnd = seeded(galaxy.id.length * 131);
    const pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
    const core = new THREE.Color(galaxy.colors.core), arm = new THREE.Color(galaxy.colors.arm), dust = new THREE.Color(galaxy.colors.dust);
    const gauss = () => (rnd() + rnd() + rnd() - 1.5) / 1.5;
    for (let i = 0; i < n; i += 1) {
      let x, y, z, t;
      if (galaxy.type === 'spiral') {
        t = rnd() ** 0.7; const r = t * radius, a = (i % 2) * Math.PI + t * 5.2 + gauss() * 0.35;
        x = Math.cos(a) * r + gauss() * 0.35 * k; z = Math.sin(a) * r + gauss() * 0.35 * k; y = gauss() * 0.35 * k * (1 - t);
      } else {
        // Light falls off steeply from the core: many stars near the centre, a thin golden halo outside.
        const u = rnd() ** 2.2, th = rnd() * Math.PI * 2, ph = Math.acos(2 * rnd() - 1), r = u * radius * 0.85;
        t = u; x = r * Math.sin(ph) * Math.cos(th) * 1.25; z = r * Math.sin(ph) * Math.sin(th) * 0.85; y = r * Math.cos(ph) * 0.6;
      }
      const c = core.clone().lerp(rnd() < 0.08 ? dust : arm, Math.min(1, galaxy.type === 'spiral' ? t * 1.4 : 0.6 + t * 1.4));
      pos.set([x, y, z], i * 3); col.set([c.r, c.g, c.b], i * 3);
    }
    return { positions: pos, colors: col, count: n };
  }, [galaxy, radius, low]);
  return <group rotation={[galaxy.tilt, 0, 0.15]}>
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={count} array={colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial map={tex.dot} vertexColors size={radius * (galaxy.type === 'spiral' ? (k > 1.5 ? 0.026 : 0.05) : 0.03)} sizeAttenuation transparent
        opacity={galaxy.type === 'spiral' ? (k > 1.5 ? 0.8 : 1) : 0.55} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
    <sprite scale={[radius * 1.1, radius * 1.1, 1]}><spriteMaterial map={tex.core} color={galaxy.type === 'spiral' ? '#ffffff' : galaxy.colors.arm} opacity={galaxy.type === 'spiral' ? 1 : 0.7} transparent depthWrite={false} blending={THREE.AdditiveBlending} /></sprite>
  </group>;
}

function Label({ position, children, dim }) {
  return <Html position={position} center zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
    <span className={`mx-label${dim ? ' is-dim' : ''}`} aria-hidden="true">{children}</span>
  </Html>;
}

function Halo({ radius, color = '#96d700' }) {
  return <mesh rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[radius, radius * 1.06, 64]} /><meshBasicMaterial color={color} transparent opacity={0.85} side={THREE.DoubleSide} depthWrite={false} /></mesh>;
}

function HitSphere({ radius, onPick }) {
  return <mesh onClick={pick(onPick)} onPointerOver={hoverOn} onPointerOut={hoverOff}>
    <sphereGeometry args={[radius, 12, 12]} /><meshBasicMaterial transparent opacity={0} depthWrite={false} />
  </mesh>;
}

function UniverseLevel({ cosmos, selected, onSelect, low }) {
  const tex = useOwnedTextures(() => ({ far: glowTexture('rgba(190,205,235,1)', 'rgba(190,205,235,0)') }), []);
  return <group>{childrenOf({ level: 'universe' }, cosmos).map(({ item: g }) => <group key={g.id} position={g.position}>
    <GalaxyDisc galaxy={g} low={low} />
    <HitSphere radius={6.5} onPick={() => onSelect(g.id)} />
    {selected === g.id && <Halo radius={7.4} />}
    <Label position={[0, -4.6, 0]}>{g.name}</Label>
  </group>)}
  {/* Uncharted galaxies: background only, deliberately not interactive. */}
  {[[-38, 14, -60], [44, -12, -70], [4, 26, -90]].map((p, i) => <sprite key={i} position={p} scale={[7, 3.5, 1]}><spriteMaterial map={tex.far} transparent opacity={0.3} depthWrite={false} blending={THREE.AdditiveBlending} /></sprite>)}
  </group>;
}

function GalaxyLevel({ cosmos, galaxyId, selected, onSelect, low }) {
  const galaxy = cosmos.galaxyById(galaxyId);
  const markers = useMemo(() => {
    const rnd = seeded(galaxyId.length * 7), n = galaxy.uncharted;
    return Array.from({ length: n }, (_, i) => {
      // Spread across the outer halo on the open (left) side of the view, clear of the bright core and the panel.
      const a = THREE.MathUtils.degToRad(115 + (n > 1 ? (i * 130) / (n - 1) : 65)) + (rnd() - 0.5) * 0.15, d = 10 + rnd() * 2.5;
      return [Math.cos(a) * d * 1.15, (rnd() - 0.5) * 1.5, Math.sin(a) * d * 0.8];
    });
  }, [galaxyId, galaxy.uncharted]);
  const sys = childrenOf({ level: 'galaxy', id: galaxyId }, cosmos);
  return <group>
    <GalaxyDisc galaxy={galaxy} radius={14} low={low} />
    {sys.map(({ item: s }, i) => { const p = [5 + i * 3, 1.2, 3]; return <group key={s.id} position={p}>
      <mesh><sphereGeometry args={[0.35, 16, 16]} /><meshBasicMaterial color={s.starColor} /></mesh>
      <HitSphere radius={1.4} onPick={() => onSelect(s.id)} />
      {selected === s.id && <group rotation={[Math.PI / 2 - galaxy.tilt, 0, 0]}><Halo radius={1} /></group>}
      <Label position={[0, -1.1, 0]}>{s.name}</Label>
    </group>; })}
    {markers.map((p, i) => <group key={i} position={p}><mesh><sphereGeometry args={[0.18, 8, 8]} /><meshBasicMaterial color="#7f8fb0" /></mesh><Label position={[0, -0.8, 0]} dim>Not charted</Label></group>)}
  </group>;
}

const ATMOSPHERE_VERT = 'varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }';
const ATMOSPHERE_FRAG = 'uniform vec3 color; uniform float strength; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(1.0 - max(dot(vN, vV), 0.0), 3.0); gl_FragColor = vec4(color, f * strength); }';

/** A lit sphere with its own surface map, atmosphere rim, optional clouds and rings. */
export function PlanetBody({ planet, size = 1, detail = false, low }) {
  const tex = useOwnedTextures(() => ({ ...planetTextures(planet, detail && !low ? 1024 : 256), ...(planet.rings ? { ring: ringTexture(planet.colors.ring) } : {}) }), [planet, detail, low]);
  const atmosphere = useMemo(() => new THREE.ShaderMaterial({ vertexShader: ATMOSPHERE_VERT, fragmentShader: ATMOSPHERE_FRAG, uniforms: { color: { value: new THREE.Color(planet.colors.atmosphere) }, strength: { value: 0.9 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }), [planet]);
  useEffect(() => () => atmosphere.dispose(), [atmosphere]);
  const ringGeo = useMemo(() => {
    if (!planet.rings) return null;
    const g = new THREE.RingGeometry(size * 1.45, size * 2.3, 96, 1), pos = g.attributes.position, uv = g.attributes.uv, v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i += 1) { v.fromBufferAttribute(pos, i); uv.setXY(i, (v.length() - size * 1.45) / (size * 0.85), 0.5); }
    return g;
  }, [planet, size]);
  useEffect(() => () => ringGeo?.dispose(), [ringGeo]);
  const clouds = useRef();
  useFrame((_, dt) => { if (clouds.current) clouds.current.rotation.y += dt * 0.01; });
  const seg = detail && !low ? 96 : 40;
  return <group>
    <mesh rotation={[0, planet.angle, 0.12]}>
      <sphereGeometry args={[size, seg, seg / 2]} />
      <meshStandardMaterial map={tex.map} roughness={planet.kind === 'ocean' ? 0.55 : 0.95} metalness={0}
        emissiveMap={tex.emissive || null} emissive={tex.emissive ? '#ffffff' : '#000000'} emissiveIntensity={tex.emissive ? 1.2 : 0} />
    </mesh>
    {tex.clouds && <mesh ref={clouds} scale={1.015}><sphereGeometry args={[size, seg, seg / 2]} /><meshStandardMaterial map={tex.clouds} transparent depthWrite={false} roughness={1} /></mesh>}
    <mesh scale={1.06} material={atmosphere}><sphereGeometry args={[size, 48, 24]} /></mesh>
    {ringGeo && <mesh geometry={ringGeo} rotation={[Math.PI / 2 - 0.35, 0, 0.1]}><meshStandardMaterial map={tex.ring} transparent side={THREE.DoubleSide} depthWrite={false} roughness={1} /></mesh>}
  </group>;
}

function StarBody({ color, radius = 1.6 }) {
  const tex = useOwnedTextures(() => ({ corona: glowTexture('rgba(255,236,190,1)', 'rgba(255,190,120,0)') }), []);
  return <group>
    <mesh><sphereGeometry args={[radius, 32, 32]} /><meshBasicMaterial color={color} /></mesh>
    <sprite scale={[radius * 7, radius * 7, 1]}><spriteMaterial map={tex.corona} transparent depthWrite={false} blending={THREE.AdditiveBlending} /></sprite>
    <pointLight intensity={420} distance={0} decay={2} color="#fff3d6" />
  </group>;
}

const planetPosition = (p) => [Math.cos(p.angle) * p.orbit, 0, Math.sin(p.angle) * p.orbit];
export { planetPosition };

function SystemLevel({ cosmos, systemId, selected, onSelect, low }) {
  const system = cosmos.systemById(systemId);
  const planets = childrenOf({ level: 'system', id: systemId }, cosmos).map((c) => c.item);
  return <group>
    <StarBody color={system.starColor} />
    <ambientLight intensity={0.05} />
    {planets.map((p) => <group key={p.id}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[p.orbit - 0.02, p.orbit + 0.02, 128]} /><meshBasicMaterial color="#5c7aa8" transparent opacity={0.35} depthWrite={false} /></mesh>
      <group position={planetPosition(p)}>
        <PlanetBody planet={p} size={p.radius} low={low} />
        <HitSphere radius={p.radius * 1.8} onPick={() => onSelect(p.id)} />
        {selected === p.id && <Halo radius={p.radius * (p.rings ? 2.5 : 1.6)} />}
        <Label position={[0, -p.radius - 0.9, 0]}>{p.name}</Label>
      </group>
    </group>)}
  </group>;
}

function PlanetLevel({ cosmos, planetId, low }) {
  const planet = cosmos.planetById(planetId);
  return <group>
    <directionalLight position={[-8, 3, 6]} intensity={2.4} color="#fff3d6" />
    <ambientLight intensity={0.04} />
    <PlanetBody planet={planet} size={3} detail low={low} />
  </group>;
}

export function SpaceLevel({ cosmos, entry, selected, onSelect, low }) {
  if (entry.level === 'universe') return <UniverseLevel cosmos={cosmos} selected={selected} onSelect={onSelect} low={low} />;
  if (entry.level === 'galaxy') return <GalaxyLevel cosmos={cosmos} galaxyId={entry.id} selected={selected} onSelect={onSelect} low={low} />;
  if (entry.level === 'system') return <SystemLevel cosmos={cosmos} systemId={entry.id} selected={selected} onSelect={onSelect} low={low} />;
  if (entry.level === 'planet') return <PlanetLevel cosmos={cosmos} planetId={entry.id} low={low} />;
  return null;
}

/* ---------------------------------------------------------------- camera */

/** Framing for each view: where the camera sits, what it looks at and how far it may zoom. */
export function shotFor(entry, selected, environment, cosmos) {
  if (entry.level === 'universe') return { position: [0, 16, 46], target: [0, 0, -3], min: 18, max: 80 };
  if (entry.level === 'galaxy') return { position: [0, 17, 27], target: [0, 0, 0], min: 9, max: 48 };
  if (entry.level === 'system') {
    const p = selected && cosmos.planetById(selected);
    return { position: [0, 15, 27], target: p ? planetPosition(p).map((v) => v * 0.35) : [0, 0, 0], min: 8, max: 48 };
  }
  if (entry.level === 'planet') return { position: [0, 1.6, 10.5], target: [0, 0, 0], min: 5, max: 18 };
  if (entry.level === 'environment') {
    const loc = environment?.locations.find((l) => l.id === selected);
    if (loc) return { position: loc.view, target: loc.position, min: 4, max: 60, maxPolar: 1.45 };
    return { position: [30, 17, 36], target: [-4, 0, 0], min: 10, max: 90, maxPolar: 1.42 };
  }
  return { position: [0, 10, 30], target: [0, 0, 0], min: 5, max: 80 };
}

const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/**
 * Moves the camera to each new shot. Travel is interruptible: any pointer or key
 * input completes it at once. With reduced motion or Calm the cut is instant.
 * `api` exposes keyboard orbit/zoom/reset for the HTML controls.
 */
export function CameraRig({ shot: baseShot, travel, motion, onTravel, api }) {
  const { camera, invalidate, size } = useThree();
  // Portrait screens see less sideways, so the same framing needs a longer lens distance.
  const portrait = size.width / size.height < 1.2 ? Math.min(2.1, 1.25 / (size.width / size.height)) : 1;
  const shot = useMemo(() => {
    if (portrait === 1) return baseShot;
    const t = new THREE.Vector3(...baseShot.target), p = new THREE.Vector3(...baseShot.position).sub(t).multiplyScalar(portrait).add(t);
    return { ...baseShot, position: p.toArray(), max: baseShot.max * portrait };
  }, [baseShot, portrait]);

  // On wide screens the side panel covers the right edge: centre the view in the free area instead.
  useEffect(() => {
    const panel = size.width > 820 ? Math.min(392, size.width * 0.4) : 0;
    if (panel) camera.setViewOffset(size.width + panel, size.height, panel, 0, size.width, size.height);
    else camera.clearViewOffset();
    camera.updateProjectionMatrix(); invalidate();
  }, [camera, size.width, size.height, invalidate]);
  const controls = useRef();
  const tween = useRef(null);
  const toVec = (a) => new THREE.Vector3(...a);

  useEffect(() => {
    const target = toVec(shot.target), end = toVec(shot.position);
    if (!motion || !travel) {
      camera.position.copy(end); controls.current?.target.copy(target); controls.current?.update();
      tween.current = null; onTravel(false); invalidate(); return undefined;
    }
    const from = travel.from === 'approach' ? end.clone().sub(target).multiplyScalar(2.6).add(target)
      : travel.from === 'retreat' ? end.clone().sub(target).multiplyScalar(0.45).add(target) : camera.position.clone();
    tween.current = { from, end, t0: null, dur: travel.duration, targetFrom: controls.current ? controls.current.target.clone() : target.clone(), target };
    if (travel.from !== 'current') controls.current?.target.copy(target);
    camera.position.copy(from);
    onTravel(true); invalidate();
    const skip = () => { if (tween.current) tween.current.t0 = -1e9; };
    // Capture phase: the explorer stops key propagation so the dashboard deck never sees it.
    const events = ['pointerdown', 'keydown', 'wheel'];
    events.forEach((n) => window.addEventListener(n, skip, true));
    return () => events.forEach((n) => window.removeEventListener(n, skip, true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shot, travel, motion]);

  useFrame((state) => {
    const tw = tween.current;
    if (!tw) return;
    if (tw.t0 === null) tw.t0 = state.clock.elapsedTime;
    const k = Math.min(1, (state.clock.elapsedTime - tw.t0) / tw.dur), e = ease(k);
    camera.position.lerpVectors(tw.from, tw.end, e);
    if (controls.current) { controls.current.target.lerpVectors(tw.targetFrom, tw.target, e); controls.current.update(); }
    if (k >= 1) { tween.current = null; onTravel(false); }
  });

  useEffect(() => {
    api.current = {
      orbit(deg) {
        const c = controls.current; if (!c) return;
        const off = camera.position.clone().sub(c.target).applyAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(deg));
        camera.position.copy(c.target).add(off); c.update(); invalidate();
      },
      zoom(factor) {
        const c = controls.current; if (!c) return;
        const off = camera.position.clone().sub(c.target), len = THREE.MathUtils.clamp(off.length() * factor, c.minDistance, c.maxDistance);
        camera.position.copy(c.target).add(off.setLength(len)); c.update(); invalidate();
      },
      reset() { camera.position.copy(toVec(shot.position)); controls.current?.target.copy(toVec(shot.target)); controls.current?.update(); invalidate(); }
    };
  });

  return <OrbitControls ref={controls} makeDefault enablePan={false} enableDamping={false}
    minDistance={shot.min} maxDistance={shot.max} minPolarAngle={0.15} maxPolarAngle={shot.maxPolar ?? 2.6} />;
}

/** Frame-rate and renderer counters for the device spike (preview only). */
export function SpikeMetrics({ onSample }) {
  const { gl } = useThree();
  const acc = useRef({ frames: 0, t: performance.now(), last: 0, fps: 0, at: 0 });
  // Counts are reported on every rendered frame (so an on-demand render is never stale); fps once a second.
  // A pause between frames restarts the window, so dragging after idling reports its own rate.
  useFrame(() => {
    const a = acc.current, now = performance.now();
    if (now - a.last > 250) { a.frames = 0; a.t = now; }
    a.last = now; a.frames += 1;
    if (now - a.t >= 1000) { a.fps = Math.round((a.frames * 1000) / (now - a.t)); a.at = now; a.frames = 0; a.t = now; }
    onSample({ fps: a.fps, at: a.at, calls: gl.info.render.calls, triangles: gl.info.render.triangles, geometries: gl.info.memory.geometries, textures: gl.info.memory.textures });
  });
  return null;
}
