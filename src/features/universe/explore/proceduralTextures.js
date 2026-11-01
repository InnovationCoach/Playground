/**
 * Procedural textures drawn on small canvases: no downloaded or purchased art.
 * Callers own the returned textures and must dispose them on unmount.
 */
import * as THREE from 'three';

export function seeded(seed) {
  let s = seed % 2147483647 || 1;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

// 3D value noise sampled on the sphere, so planet maps wrap without a seam.
function hash(x, y, z, seed) {
  let h = (x * 374761393 + y * 668265263 + z * 2147483647 + seed * 144665) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}
const smooth = (t) => t * t * (3 - 2 * t);
function valueNoise(x, y, z, seed) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = smooth(x - xi), yf = smooth(y - yi), zf = smooth(z - zi);
  const lerp = (a, b, t) => a + (b - a) * t;
  const c = (dx, dy, dz) => hash(xi + dx, yi + dy, zi + dz, seed);
  return lerp(
    lerp(lerp(c(0, 0, 0), c(1, 0, 0), xf), lerp(c(0, 1, 0), c(1, 1, 0), xf), yf),
    lerp(lerp(c(0, 0, 1), c(1, 0, 1), xf), lerp(c(0, 1, 1), c(1, 1, 1), xf), yf), zf);
}
export function fbm(x, y, z, seed, octaves = 4) {
  let sum = 0, amp = 0.5, freq = 1, norm = 0;
  for (let i = 0; i < octaves; i += 1) { sum += amp * valueNoise(x * freq, y * freq, z * freq, seed + i); norm += amp; amp *= 0.5; freq *= 2; }
  return sum / norm;
}

const hex = (c) => new THREE.Color(c);
const mix = (a, b, t) => a.clone().lerp(b, Math.max(0, Math.min(1, t)));

function canvas(w, h) {
  const el = document.createElement('canvas'); el.width = w; el.height = h;
  return el;
}
function finish(el, srgb = true) {
  const tex = new THREE.CanvasTexture(el);
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 2;
  return tex;
}

/** Soft round glow used for stars, galaxy cores and nebulae. */
export function glowTexture(inner = 'rgba(255,255,255,1)', outer = 'rgba(255,255,255,0)', size = 128) {
  const el = canvas(size, size), g = el.getContext('2d');
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, inner); grad.addColorStop(0.25, inner.replace(/[\d.]+\)$/, '0.55)')); grad.addColorStop(1, outer);
  g.fillStyle = grad; g.fillRect(0, 0, size, size);
  return finish(el);
}

/** Cloudy nebula sprite: layered noise inside a radial falloff. */
export function nebulaTexture(color, seed, size = 256) {
  const el = canvas(size, size), g = el.getContext('2d'), img = g.createImageData(size, size), c = hex(color);
  for (let y = 0; y < size; y += 1) for (let x = 0; x < size; x += 1) {
    const dx = x / size - 0.5, dy = y / size - 0.5, d = Math.sqrt(dx * dx + dy * dy) * 2;
    const n = fbm(x / 48, y / 48, 0.5, seed, 5);
    const a = Math.max(0, 1 - d) ** 1.6 * Math.max(0, n - 0.32) * 2.2;
    const i = (y * size + x) * 4;
    img.data[i] = c.r * 255; img.data[i + 1] = c.g * 255; img.data[i + 2] = c.b * 255; img.data[i + 3] = Math.min(255, a * 255);
  }
  g.putImageData(img, 0, 0);
  return finish(el);
}

/**
 * Equirectangular surface map for a planet. Returns { map, emissive?, clouds? }.
 * Looks are authored per planet kind; none of this is measured planetary data.
 */
export function planetTextures(planet, width = 512) {
  const w = width, h = width / 2, k = planet.colors, seed = planet.id.length * 97 + planet.orbit * 13;
  const base = hex(k.base), deep = hex(k.deep), light = hex(k.light);
  const surf = canvas(w, h), sImg = surf.getContext('2d').createImageData(w, h);
  const glow = planet.kind === 'basalt' ? canvas(w, h) : null, gImg = glow?.getContext('2d').createImageData(w, h);
  const cloud = planet.kind === 'ocean' ? canvas(w, h) : null, cImg = cloud?.getContext('2d').createImageData(w, h);
  const land = hex('#3b3631'), sand = hex('#9c8a6a'), glowC = k.glow ? hex(k.glow) : null, cloudC = k.cloud ? hex(k.cloud) : null;
  for (let y = 0; y < h; y += 1) {
    const lat = (y / h - 0.5) * Math.PI;
    for (let x = 0; x < w; x += 1) {
      const lon = (x / w) * Math.PI * 2;
      const px = Math.cos(lat) * Math.cos(lon), py = Math.sin(lat), pz = Math.cos(lat) * Math.sin(lon);
      const n = fbm(px * 2.2 + 3, py * 2.2 + 3, pz * 2.2 + 3, seed, 5);
      let col;
      if (planet.kind === 'ocean') {
        col = mix(deep, base, n * 1.4);
        if (n > 0.66) col = mix(sand, land, (n - 0.66) * 12);
        else if (n > 0.6) col = mix(col, light, (n - 0.6) * 8);
        const cn = fbm(px * 3 + 9, py * 6 + 9, pz * 3 + 9, seed + 40, 4);
        const ca = Math.max(0, cn - 0.48) * 3.2 * (0.6 + 0.4 * Math.abs(Math.sin(lat * 3)));
        const ci = (y * w + x) * 4;
        cImg.data[ci] = cloudC.r * 255; cImg.data[ci + 1] = cloudC.g * 255; cImg.data[ci + 2] = cloudC.b * 255; cImg.data[ci + 3] = Math.min(230, ca * 255);
      } else if (planet.kind === 'basalt') {
        col = mix(deep, base, n * 1.3);
        col = mix(col, light, Math.max(0, n - 0.62) * 4);
        const crack = Math.abs(fbm(px * 4, py * 4, pz * 4, seed + 7, 4) - 0.5);
        const gi = (y * w + x) * 4, lit = crack < 0.018 ? 1 - crack / 0.018 : 0;
        gImg.data[gi] = glowC.r * 255 * lit; gImg.data[gi + 1] = glowC.g * 255 * lit; gImg.data[gi + 2] = glowC.b * 255 * lit; gImg.data[gi + 3] = 255;
        if (lit) col = mix(col, glowC, lit * 0.8);
      } else {
        const band = 0.5 + 0.5 * Math.sin(lat * 9 + n * 4);
        col = mix(deep, base, band * 0.8 + n * 0.3);
        col = mix(col, light, Math.max(0, Math.abs(py) - 0.75) * 4);
      }
      const i = (y * w + x) * 4;
      sImg.data[i] = col.r * 255; sImg.data[i + 1] = col.g * 255; sImg.data[i + 2] = col.b * 255; sImg.data[i + 3] = 255;
    }
  }
  surf.getContext('2d').putImageData(sImg, 0, 0);
  const out = { map: finish(surf) };
  if (glow) { glow.getContext('2d').putImageData(gImg, 0, 0); out.emissive = finish(glow); }
  if (cloud) { cloud.getContext('2d').putImageData(cImg, 0, 0); out.clouds = finish(cloud); }
  return out;
}

/** Radial ring stripes; used with a ring geometry whose u runs inner→outer. */
export function ringTexture(color, seed = 3, size = 256) {
  const el = canvas(size, 4), g = el.getContext('2d'), c = hex(color), rnd = seeded(seed);
  for (let x = 0; x < size; x += 1) {
    const a = (0.25 + 0.6 * rnd()) * Math.sin((x / size) * Math.PI) ** 0.6;
    g.fillStyle = `rgba(${c.r * 255 | 0},${c.g * 255 | 0},${c.b * 255 | 0},${a.toFixed(3)})`;
    g.fillRect(x, 0, 1, 4);
  }
  return finish(el);
}

export const disposeAll = (textures) => Object.values(textures || {}).forEach((t) => t?.dispose?.());
