/**
 * Animated microscope view of the Au/TiO₂ filter, at four zoom levels:
 *
 *   MACRO        the duct, the filter cartridge and the sulfate output
 *   FILTER       a cross-section of the bed: TiO₂ grains dotted with Au, and
 *                the filter slices the model integrates
 *   NANOPARTICLE one TiO₂ surface with Au clusters and individual molecules
 *   ACTIVE SITE  a single Au/TiO₂ perimeter site stepping through the pathway
 *
 * The animation is a DEPICTION of the model, not a second model. How many
 * molecules sit on the surface in each state, slice by slice, and how many
 * sulfate particles have reached the output, are set by the model state at
 * the current clock, so the picture and the graphs tell the same story.
 * Individual paths are illustrative, and each dot stands for very many
 * molecules. The caption says so.
 *
 * Canvas rather than SVG: up to 3,200 moving particles at 60 fps.
 */
import { useEffect, useRef } from 'react';

const W = 960;
const H = 440;
const FX0 = 190;           // filter bed, in filter-view pixels
const FX1 = 770;
const FY0 = 40;
const FY1 = 400;
const SITES_PER_SLICE = 24;

export const VIEWS = [
  { id: 'macro', label: 'Macro view', scale: 'cm scale' },
  { id: 'filter', label: 'Filter view', scale: 'µm scale' },
  { id: 'nano', label: 'Nanoparticle view', scale: 'nm scale' },
  { id: 'site', label: 'Active-site view', scale: 'sub-nm scale' }
];

export const SPECIES_COLORS = {
  so2: '#facc15',      // SO₂ gas
  A: '#fb923c',        // SO₂* adsorbed
  B: '#f472b6',        // SO₃* intermediate
  C: '#a78bfa',        // SO₄* surface sulfate
  rel: '#c084fc',      // SO₄²⁻ released
  h2o: '#60a5fa',
  au: '#e8b923',
  tio2: '#5b6b84',
  site: '#34d399',
  electron: '#38bdf8'
};

const lerp = (a, b, f) => a + (b - a) * f;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function seeded(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

// ---------------------------------------------------------------------------
// Bed engine (macro + filter views)
// ---------------------------------------------------------------------------
function buildBed(slices, particleCount, tracked, auLoading) {
  const rnd = seeded(20260930 + slices);
  const sw = (FX1 - FX0) / slices;
  const rows = 4;
  const r = Math.min(sw * 0.33, 40);
  const grains = [];
  const sites = [];
  for (let s = 0; s < slices; s++) {
    for (let g = 0; g < rows; g++) {
      const cx = FX0 + sw * (s + 0.5) + (rnd() - 0.5) * sw * 0.25;
      const cy = FY0 + ((g + 0.5) / rows) * (FY1 - FY0) + (rnd() - 0.5) * 20;
      const nAu = Math.round(clamp(auLoading, 0, 5) * 0.8);
      const auAngles = Array.from({ length: nAu }, () => rnd() * Math.PI * 2);
      grains.push({ x: cx, y: cy, r, slice: s, au: auAngles });
      const per = SITES_PER_SLICE / rows;
      for (let k = 0; k < per; k++) {
        const a = (k / per) * Math.PI * 2 + rnd() * 0.3;
        const nearAu = auAngles.some((b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b))) < 0.5);
        sites.push({ x: cx + Math.cos(a) * (r + 4), y: cy + Math.sin(a) * (r + 4), slice: s, occupant: null, interface: nearAu });
      }
    }
  }
  // Interface sites first: that is where the model puts the activity.
  sites.sort((a, b) => (b.interface - a.interface));
  const particles = [];
  for (let i = 0; i < particleCount; i++) {
    particles.push({
      id: i,
      x: rnd() * W,
      y: lerp(FY0 + 6, FY1 - 6, rnd()),
      vy: (rnd() - 0.5) * 20,
      kind: 'gas',
      slice: -1,
      site: null,
      fade: 0,
      track: i < tracked ? { n: i + 1, trail: [] } : null
    });
  }
  const water = Array.from({ length: 80 }, () => ({ x: FX0 + rnd() * (FX1 - FX0), y: FY0 + rnd() * (FY1 - FY0), p: rnd() }));
  return { slices, sw, grains, sites, particles, water, trayCount: 0, releasedTotal: 0, rnd: Math.random };
}

function sliceOf(x, bed) {
  if (x < FX0 || x >= FX1) return -1;
  return Math.min(bed.slices - 1, Math.floor((x - FX0) / bed.sw));
}

const TRAY = { x0: 790, x1: 950, y0: 300, y1: 420 };
function traySlot(i) {
  const cols = 20;
  return { x: TRAY.x0 + 6 + (i % cols) * 7.8, y: TRAY.y1 - 6 - Math.floor(i / cols) * 7.8 };
}

function respawn(p, bed) {
  p.kind = 'gas';
  p.x = -Math.random() * 60;
  p.y = lerp(FY0 + 6, FY1 - 6, Math.random());
  p.slice = -1;
  p.site = null;
  p.fade = 0;
  if (p.track) p.track.trail = [];
  void bed;
}

function stepBed(bed, dt, model, speed) {
  const { state, params } = model;
  const vx = (120 + 30 * params.flowLpm) * speed;
  const removal = clamp(state.removal ?? 0, 0, 0.999);
  const N = bed.particles.length;

  // Gas motion and capture.
  for (const p of bed.particles) {
    if (p.kind === 'fade') {
      p.fade -= dt;
      if (p.fade <= 0) respawn(p, bed);
      continue;
    }
    if (p.kind === 'rel') {
      p.x = lerp(p.x, p.tx, clamp(dt * 3, 0, 1));
      p.y = lerp(p.y, p.ty, clamp(dt * 3, 0, 1));
      continue;
    }
    if (p.kind !== 'gas') continue;
    const inBed = p.x >= FX0 && p.x < FX1;
    const dx = vx * dt * (inBed ? 0.55 : 1);
    p.x += dx;
    p.y += (p.vy + (Math.random() - 0.5) * (inBed ? 160 : 40)) * dt;
    if (p.y < FY0 + 4) { p.y = FY0 + 4; p.vy = Math.abs(p.vy); }
    if (p.y > FY1 - 4) { p.y = FY1 - 4; p.vy = -Math.abs(p.vy); }
    if (inBed && removal > 0 && Math.random() < 1 - Math.pow(1 - removal, dx / (FX1 - FX0))) {
      // Adsorbed somewhere in the bed that is not drawn as an individual site.
      p.kind = 'fade';
      p.fade = 0.35;
      p.slice = sliceOf(p.x, bed);
      continue;
    }
    if (p.x > W + 10) respawn(p, bed);
    if (p.track) {
      p.track.trail.push(p.x, p.y);
      if (p.track.trail.length > 120) p.track.trail.splice(0, 2);
    }
  }

  // Reconcile surface populations with the model, slice by slice.
  const slicesState = state.slices || [];
  const buckets = Array.from({ length: bed.slices }, () => ({ A: [], B: [], C: [], gas: [], fade: [] }));
  for (const p of bed.particles) {
    if (p.kind === 'A' || p.kind === 'B' || p.kind === 'C') buckets[p.slice][p.kind].push(p);
    else if ((p.kind === 'gas' || p.kind === 'fade') && p.x >= FX0 && p.x < FX1) {
      const s = sliceOf(p.x, bed);
      if (s >= 0) buckets[s][p.kind === 'gas' ? 'gas' : 'fade'].push(p);
    }
  }
  const OPS = 2;
  for (let s = 0; s < bed.slices; s++) {
    const st = slicesState[s];
    if (!st) continue;
    const want = {
      A: Math.round(st.thetaSO2 * SITES_PER_SLICE),
      B: Math.round(st.thetaSO3 * SITES_PER_SLICE),
      C: Math.round(st.thetaSO4 * SITES_PER_SLICE)
    };
    const b = buckets[s];
    let ops = 0;
    while (ops < OPS && b.C.length > want.C) { releaseToTray(b.C.pop(), bed); ops++; }
    while (ops < OPS && b.B.length > want.B && b.C.length < want.C) { const p = b.B.pop(); p.kind = 'C'; p.flash = 0.6; b.C.push(p); ops++; }
    while (ops < OPS && b.A.length > want.A && b.B.length < want.B) { const p = b.A.pop(); p.kind = 'B'; p.flash = 0.6; b.B.push(p); ops++; }
    while (ops < OPS && b.A.length < want.A) {
      const p = b.fade.pop() || b.gas.pop();
      const site = p && bed.sites.find((x) => x.slice === s && !x.occupant);
      if (!p || !site) break;
      site.occupant = p.id;
      p.kind = 'A'; p.site = site; p.slice = s; p.x = site.x; p.y = site.y; p.flash = 0.5;
      b.A.push(p);
      ops++;
    }
    while (ops < OPS && b.A.length > want.A) {
      const p = b.A.pop();
      p.site.occupant = null; p.site = null; p.kind = 'gas'; p.slice = -1;
      ops++;
    }
  }

  // Sulfate output tray follows the model's released fraction.
  const trayCap = Math.min(240, Math.round(N * 0.3));
  const fed = state.fedMol || 0;
  const wantTray = fed > 0 ? Math.round((state.releasedMol / fed) * trayCap) : 0;
  const tray = bed.particles.filter((p) => p.kind === 'rel');
  if (tray.length > wantTray) {
    for (const p of tray.slice(wantTray)) respawn(p, bed);
  }
  bed.trayCount = Math.min(tray.length, wantTray);
  for (const p of bed.particles) if (p.flash > 0) p.flash -= dt;
}

function releaseToTray(p, bed) {
  if (p.site) p.site.occupant = null;
  p.site = null;
  p.kind = 'rel';
  const i = bed.particles.filter((q) => q.kind === 'rel').length;
  const slot = traySlot(i);
  p.tx = slot.x; p.ty = slot.y;
  bed.releasedTotal++;
}

// Filter-view pixels → macro-view pixels.
function toMacro(x, y) {
  let mx;
  if (x < FX0) mx = lerp(40, 400, clamp(x / FX0, 0, 1));
  else if (x < FX1) mx = lerp(400, 560, (x - FX0) / (FX1 - FX0));
  else mx = lerp(560, 780, clamp((x - FX1) / (W - FX1), 0, 1));
  return { x: mx, y: lerp(170, 330, (y - FY0) / (FY1 - FY0)) };
}

// ---------------------------------------------------------------------------
// Drawing helpers
// ---------------------------------------------------------------------------
function atom(ctx, x, y, r, color) {
  const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.25, color);
  g.addColorStop(1, shade(color));
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
}
function shade(hex) {
  const n = parseInt(hex.slice(1), 16);
  const f = (v) => Math.round(v * 0.45);
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
}
const EL = { S: '#eab308', O: '#ef4444', H: '#e2e8f0', Au: '#d4a017', Ti: '#94a3b8' };

function molecule(ctx, kind, x, y, s = 1) {
  const o = 7 * s, sr = 9 * s;
  if (kind === 'H2O') {
    atom(ctx, x - 7 * s, y + 5 * s, 4 * s, EL.H); atom(ctx, x + 7 * s, y + 5 * s, 4 * s, EL.H); atom(ctx, x, y, 6.5 * s, EL.O);
    return;
  }
  const oxy = { SO2: 2, SO3: 3, SO4: 4 }[kind] || 2;
  const pos = [[-12, 5], [12, 5], [0, -13], [6, 9]].slice(0, oxy);
  for (const [dx, dy] of pos) atom(ctx, x + dx * s, y + dy * s, o * 0.85, EL.O);
  atom(ctx, x, y, sr, EL.S);
}

function label(ctx, text, x, y, { color = '#e2e8f0', size = 12, align = 'left', weight = 600, bg = null } = {}) {
  ctx.font = `${weight} ${size}px Inter, system-ui, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  if (bg) {
    const w = ctx.measureText(text).width + 10;
    const bx = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x - 5;
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.roundRect(bx, y - size * 0.8, w, size * 1.6, 4); ctx.fill();
  }
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

function panel(ctx, lines, x, y) {
  ctx.font = '600 11.5px Inter, system-ui, sans-serif';
  const w = Math.max(...lines.map((l) => ctx.measureText(l).width)) + 20;
  const h = lines.length * 16 + 12;
  ctx.fillStyle = 'rgba(2, 6, 23, 0.78)';
  ctx.strokeStyle = 'rgba(125, 211, 252, 0.35)';
  ctx.beginPath(); ctx.roundRect(x, y, w, h, 6); ctx.fill(); ctx.stroke();
  lines.forEach((l, i) => label(ctx, l, x + 10, y + 14 + i * 16, { color: i === 0 ? '#7dd3fc' : '#cbd5e1', size: 11.5, weight: i === 0 ? 700 : 500 }));
}

function background(ctx) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#07142a');
  g.addColorStop(1, '#030a18');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.05)';
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
}

function drawParticleDot(ctx, p, x, y, r) {
  const c = p.kind === 'gas' ? SPECIES_COLORS.so2 : p.kind === 'fade' ? SPECIES_COLORS.so2 : SPECIES_COLORS[p.kind];
  ctx.globalAlpha = p.kind === 'fade' ? clamp(p.fade / 0.35, 0, 1) : 1;
  ctx.fillStyle = c;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;
}

// ---------------------------------------------------------------------------
// Views
// ---------------------------------------------------------------------------
function drawMacro(ctx, bed, model, hits) {
  background(ctx);
  const { params, state } = model;
  // duct
  ctx.fillStyle = '#0d1b33';
  ctx.strokeStyle = '#2c4468';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(30, 160, 760, 180, 14); ctx.fill(); ctx.stroke();
  // filter cartridge
  const g = ctx.createLinearGradient(400, 0, 560, 0);
  g.addColorStop(0, '#3b4a60'); g.addColorStop(0.5, '#56657d'); g.addColorStop(1, '#3b4a60');
  ctx.fillStyle = g;
  ctx.fillRect(400, 150, 160, 200);
  ctx.fillStyle = 'rgba(232, 185, 35, 0.18)';
  for (let i = 0; i < 90; i++) {
    const x = 404 + ((i * 37) % 152), y = 156 + ((i * 53) % 188);
    ctx.beginPath(); ctx.arc(x, y, 1.6, 0, Math.PI * 2); ctx.fill();
  }
  ctx.strokeStyle = '#e8b923'; ctx.lineWidth = 1.5; ctx.setLineDash([5, 4]);
  ctx.strokeRect(400, 150, 160, 200); ctx.setLineDash([]);
  hits.push({ x: 480, y: 250, r: 80, term: 'surface' });

  for (const p of bed.particles) {
    if (p.kind === 'rel') continue;
    const m = toMacro(p.x, p.y);
    drawParticleDot(ctx, p, m.x, m.y, p.kind === 'gas' ? 2.2 : 1.8);
  }
  // sulfate output tray
  ctx.fillStyle = '#1a1033'; ctx.strokeStyle = '#7c3aed';
  ctx.beginPath(); ctx.roundRect(800, 300, 140, 110, 10); ctx.fill(); ctx.stroke();
  const n = bed.trayCount;
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = SPECIES_COLORS.rel;
    ctx.beginPath(); ctx.arc(812 + (i % 16) * 7.6, 398 - Math.floor(i / 16) * 7.6, 2.6, 0, Math.PI * 2); ctx.fill();
  }
  hits.push({ x: 870, y: 355, r: 60, term: 'so4' });
  // flow arrows + labels
  ctx.strokeStyle = '#475569'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(790, 250); ctx.lineTo(930, 250); ctx.lineTo(920, 243); ctx.moveTo(930, 250); ctx.lineTo(920, 257); ctx.stroke();
  label(ctx, 'SO₂-containing gas in', 40, 140, { color: '#fde68a', size: 13, weight: 700 });
  label(ctx, `${params.so2Ppm} ppm · ${params.flowLpm} L/min · ${params.temperatureK} K`, 40, 122, { color: '#94a3b8', size: 11 });
  label(ctx, 'Au/TiO₂ filter cartridge', 480, 132, { align: 'center', color: '#fde68a', size: 13, weight: 700 });
  label(ctx, `${params.thicknessMm} mm thick`, 480, 366, { align: 'center', color: '#94a3b8', size: 11 });
  label(ctx, 'Treated gas out', 800, 232, { color: '#e2e8f0', size: 12, weight: 700 });
  label(ctx, `SO₂ out ≈ ${fmtNum(state.so2Out)} ppm (model)`, 800, 272, { color: '#fde68a', size: 11 });
  label(ctx, 'Sulfate output', 870, 290, { align: 'center', color: '#d8b4fe', size: 12, weight: 700 });
  hits.push({ x: 120, y: 250, r: 70, term: 'so2' });
  panel(ctx, ['MACRO VIEW', 'The whole filter in its gas duct.', 'Yellow dots: SO₂ (each dot = very many molecules).', 'Purple: sulfate collected at the output.', 'Zoom in to see inside the filter.'], 20, 14);
}

function drawFilter(ctx, bed, model, hits) {
  background(ctx);
  const { state, params } = model;
  // slice bands
  for (let s = 0; s < bed.slices; s++) {
    ctx.fillStyle = s % 2 ? 'rgba(148, 163, 184, 0.04)' : 'rgba(148, 163, 184, 0.08)';
    ctx.fillRect(FX0 + s * bed.sw, FY0, bed.sw, FY1 - FY0);
    label(ctx, `slice ${s + 1}`, FX0 + (s + 0.5) * bed.sw, FY1 + 14, { align: 'center', color: '#64748b', size: 10 });
  }
  ctx.strokeStyle = 'rgba(232, 185, 35, 0.5)'; ctx.setLineDash([6, 5]);
  ctx.strokeRect(FX0, FY0, FX1 - FX0, FY1 - FY0); ctx.setLineDash([]);
  // water film
  const nWater = Math.round(params.water * bed.water.length);
  for (let i = 0; i < nWater; i++) {
    const w = bed.water[i];
    ctx.fillStyle = 'rgba(96, 165, 250, 0.35)';
    ctx.beginPath(); ctx.arc(w.x, w.y, 2.2, 0, Math.PI * 2); ctx.fill();
  }
  // grains
  for (const g of bed.grains) {
    const grad = ctx.createRadialGradient(g.x - g.r * 0.3, g.y - g.r * 0.3, g.r * 0.1, g.x, g.y, g.r);
    grad.addColorStop(0, '#8391a8'); grad.addColorStop(1, '#3b4a60');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(g.x, g.y, g.r, 0, Math.PI * 2); ctx.fill();
    for (const a of g.au) atom(ctx, g.x + Math.cos(a) * g.r * 0.92, g.y + Math.sin(a) * g.r * 0.92, Math.max(3, g.r * 0.16), EL.Au);
  }
  hits.push(...bed.grains.map((g) => ({ x: g.x, y: g.y, r: g.r * 0.7, term: 'tio2' })));
  hits.push(...bed.grains.flatMap((g) => g.au.map((a) => ({ x: g.x + Math.cos(a) * g.r * 0.92, y: g.y + Math.sin(a) * g.r * 0.92, r: 6, term: 'au' }))));
  // available sites
  ctx.lineWidth = 1.2;
  for (const s of bed.sites) {
    if (s.occupant != null) continue;
    ctx.strokeStyle = s.interface ? 'rgba(52, 211, 153, 0.9)' : 'rgba(52, 211, 153, 0.35)';
    ctx.beginPath(); ctx.arc(s.x, s.y, 3, 0, Math.PI * 2); ctx.stroke();
  }
  // particles
  for (const p of bed.particles) {
    const r = p.kind === 'gas' ? 2.6 : p.kind === 'fade' ? 2.6 : p.kind === 'rel' ? 2.8 : 4;
    drawParticleDot(ctx, p, p.x, p.y, r);
    if (p.flash > 0 && (p.kind === 'B' || p.kind === 'C' || p.kind === 'A')) {
      ctx.strokeStyle = p.kind === 'C' ? SPECIES_COLORS.h2o : '#ffffff';
      ctx.globalAlpha = clamp(p.flash, 0, 1);
      ctx.beginPath(); ctx.arc(p.x, p.y, 9, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 1;
    }
    if (p.kind === 'A' || p.kind === 'B' || p.kind === 'C') {
      hits.push({ x: p.x, y: p.y, r: 5, term: p.kind === 'A' ? 'adsorption' : p.kind === 'B' ? 'so3' : 'so4' });
    }
  }
  // unconverted SO₂ leaving
  for (const p of bed.particles) {
    if (p.kind === 'gas' && p.x > FX1) {
      ctx.strokeStyle = 'rgba(248, 113, 113, 0.7)';
      ctx.beginPath(); ctx.arc(p.x, p.y, 4.2, 0, Math.PI * 2); ctx.stroke();
    }
  }
  hits.push({ x: 870, y: 150, r: 60, term: 'unconverted' });
  hits.push({ x: 90, y: 200, r: 70, term: 'so2' });
  // tray
  ctx.strokeStyle = '#7c3aed'; ctx.strokeRect(TRAY.x0, TRAY.y0, TRAY.x1 - TRAY.x0, TRAY.y1 - TRAY.y0);
  label(ctx, 'sulfate output', (TRAY.x0 + TRAY.x1) / 2, TRAY.y0 - 10, { align: 'center', color: '#d8b4fe', size: 11, weight: 700 });
  hits.push({ x: 870, y: 360, r: 55, term: 'so4' });
  label(ctx, 'SO₂ in →', 20, FY0 - 20, { color: '#fde68a', size: 12, weight: 700 });
  label(ctx, 'unconverted SO₂ out →', W - 14, FY0 - 20, { align: 'right', color: '#fca5a5', size: 11, weight: 700 });
  drawTrails(ctx, bed, (x, y) => ({ x, y }));
  panel(ctx, [
    'FILTER VIEW',
    'Cross-section of the bed. Grey: TiO₂ grains. Gold: Au nanoparticles.',
    'Green rings: free catalytic sites (bright = at the Au/TiO₂ perimeter).',
    'Orange SO₂* → pink SO₃* → purple SO₄*, as the model says per slice.',
    `Site utilization ${(100 * (state.siteUtilization || 0)).toFixed(0)}% · removal ${(100 * (state.removal || 0)).toFixed(0)}% (model)`
  ], 14, FY1 - 88);
}

function drawTrails(ctx, bed, project) {
  for (const p of bed.particles) {
    if (!p.track) continue;
    const t = p.track.trail;
    if (t.length > 3) {
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.8)'; ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < t.length; i += 2) {
        const q = project(t[i], t[i + 1]);
        if (i === 0) ctx.moveTo(q.x, q.y); else ctx.lineTo(q.x, q.y);
      }
      ctx.stroke();
    }
    const q = project(p.x, p.y);
    ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(q.x, q.y, 7, 0, Math.PI * 2); ctx.stroke();
    label(ctx, `#${p.track.n} ${stateName(p.kind)}`, q.x + 10, q.y - 10, { color: '#7dd3fc', size: 10.5, weight: 700, bg: 'rgba(2,6,23,0.75)' });
  }
}

function stateName(kind) {
  return { gas: 'SO₂(g)', fade: 'adsorbing', A: 'SO₂*', B: 'SO₃*', C: 'SO₄*', rel: 'SO₄²⁻' }[kind] || kind;
}

// ---------------------------------------------------------------------------
// Nanoparticle view engine
// ---------------------------------------------------------------------------
const SURFACE_Y = 330;

function buildNano(nanoparticles, sizeNm, auLoading) {
  const clusters = auLoading > 0 ? clamp(Math.round(2 + nanoparticles / 250), 2, 6) : 0;
  const radius = clamp(14 + sizeNm * 3, 18, 70);
  const cl = [];
  for (let i = 0; i < clusters; i++) cl.push({ x: lerp(150, 810, clusters === 1 ? 0.5 : i / (clusters - 1)), r: radius });
  const sites = [];
  for (const c of cl) {
    sites.push({ x: c.x - c.r - 10, kind: 'interface', occupant: null }, { x: c.x + c.r + 10, kind: 'interface', occupant: null });
  }
  for (let x = 60; x < 920; x += 46) {
    if (cl.some((c) => Math.abs(x - c.x) < c.r + 34)) continue;
    sites.push({ x, kind: 'support', occupant: null });
  }
  sites.sort((a, b) => (a.kind === 'interface' ? -1 : 1) - (b.kind === 'interface' ? -1 : 1));
  const mols = Array.from({ length: 18 }, (_, i) => ({ id: i, kind: 'gas', x: Math.random() * W, y: 60 + Math.random() * 180, vx: 30 + Math.random() * 30, vy: (Math.random() - 0.5) * 20, site: null }));
  const water = Array.from({ length: 12 }, () => ({ x: Math.random() * W, y: 230 + Math.random() * 80, vx: (Math.random() - 0.5) * 20 }));
  return { clusters: cl, sites, mols, water, effects: [] };
}

function stepNano(nano, dt, model, speed) {
  const { state, params } = model;
  const M = nano.sites.length;
  const want = {
    A: Math.round((state.thetaSO2 || 0) * M),
    B: Math.round((state.thetaSO3 || 0) * M),
    C: Math.round((state.thetaSO4 || 0) * M)
  };
  const by = (k) => nano.mols.filter((m) => m.kind === k);
  const gasTarget = clamp(Math.round(4 + (params.so2Ppm / 1000) * 14), 4, 18);
  for (const m of nano.mols) {
    if (m.kind === 'gas') {
      m.x += m.vx * dt * speed; m.y += (m.vy + (Math.random() - 0.5) * 30) * dt * speed;
      if (m.y < 50) m.vy = Math.abs(m.vy);
      if (m.y > 250) m.vy = -Math.abs(m.vy);
      if (m.x > W + 20) { m.x = -20; m.y = 60 + Math.random() * 160; }
    } else if (m.kind === 'landing') {
      m.x = lerp(m.x, m.site.x, clamp(dt * 4 * speed, 0, 1));
      m.y = lerp(m.y, SURFACE_Y - 16, clamp(dt * 4 * speed, 0, 1));
      if (Math.abs(m.y - (SURFACE_Y - 16)) < 2) m.kind = 'A';
    } else if (m.kind === 'leaving') {
      m.x += 60 * dt * speed; m.y -= 70 * dt * speed;
      if (m.y < -20) { m.kind = 'gas'; m.x = -20; m.y = 60 + Math.random() * 160; }
    }
  }
  if (Math.random() < dt * 3 * speed) {
    const A = by('A').length + by('landing').length;
    const B = by('B'), C = by('C');
    if (C.length > want.C) {
      const m = C[0]; m.site.occupant = null; m.site = null; m.kind = 'leaving';
      nano.effects.push({ kind: 'release', x: m.x, y: m.y, t: 1.6 });
    } else if (B.length > want.B && C.length < want.C) {
      const m = B[0]; m.kind = 'C';
      nano.effects.push({ kind: 'water', x: m.x, y: m.y, t: 1.2 });
    } else if (A > want.A && B.length < want.B) {
      const m = by('A')[0];
      if (m) { m.kind = 'B'; nano.effects.push({ kind: 'oxidation', x: m.x, y: m.y, t: 1.2 }); }
    } else if (A < want.A) {
      const site = nano.sites.find((s) => !s.occupant);
      const m = by('gas').sort((a, b) => Math.abs(a.x - (site?.x ?? 0)) - Math.abs(b.x - (site?.x ?? 0)))[0];
      if (site && m) { site.occupant = m.id; m.site = site; m.kind = 'landing'; }
    } else if (A > want.A) {
      const m = by('A')[0];
      if (m) { m.site.occupant = null; m.site = null; m.kind = 'gas'; m.y = SURFACE_Y - 60; m.vy = -30; }
    }
  }
  // Keep enough gas-phase molecules in view for the concentration.
  const gas = by('gas');
  if (gas.length > gasTarget) gas.slice(gasTarget).forEach((m) => { m.hidden = true; });
  gas.slice(0, gasTarget).forEach((m) => { m.hidden = false; });
  for (const w of nano.water) { w.x += w.vx * dt * speed; if (w.x < 0) w.x = W; if (w.x > W) w.x = 0; }
  nano.effects = nano.effects.filter((e) => (e.t -= dt) > 0);
}

function drawNano(ctx, nano, model, hits) {
  background(ctx);
  const { params, state } = model;
  // TiO₂ lattice
  const g = ctx.createLinearGradient(0, SURFACE_Y, 0, H);
  g.addColorStop(0, '#56657d'); g.addColorStop(1, '#27324a');
  ctx.fillStyle = g; ctx.fillRect(0, SURFACE_Y, W, H - SURFACE_Y);
  for (let row = 0; row < 3; row++) {
    for (let x = 12 + (row % 2) * 14; x < W; x += 28) {
      atom(ctx, x, SURFACE_Y + 12 + row * 26, (x / 28 + row) % 2 < 1 ? 7 : 5, (x / 28 + row) % 2 < 1 ? EL.Ti : EL.O);
    }
  }
  hits.push({ x: 480, y: 390, r: 60, term: 'tio2' }, { x: 120, y: 390, r: 60, term: 'tio2' }, { x: 840, y: 390, r: 60, term: 'tio2' });
  label(ctx, 'TiO₂ support (Ti grey, O red)', 16, H - 14, { color: '#e2e8f0', size: 11.5, weight: 700, bg: 'rgba(2,6,23,0.6)' });
  // water
  const nW = Math.round(params.water * nano.water.length);
  for (let i = 0; i < nW; i++) {
    molecule(ctx, 'H2O', nano.water[i].x, nano.water[i].y, 0.8);
    if (i < 3) hits.push({ x: nano.water[i].x, y: nano.water[i].y, r: 10, term: 'h2o' });
  }
  // Au clusters as stacked atoms
  for (const c of nano.clusters) {
    const ar = clamp(c.r / 4, 5, 10);
    const rows = Math.max(2, Math.round(c.r / (ar * 1.7)));
    for (let r = 0; r < rows; r++) {
      const half = Math.sqrt(Math.max(0, 1 - (r / rows) ** 2)) * c.r;
      for (let x = c.x - half + ar; x <= c.x + half - ar + 0.1; x += ar * 1.9) atom(ctx, x, SURFACE_Y - ar - r * ar * 1.65, ar, EL.Au);
    }
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.7)'; ctx.setLineDash([4, 3]);
    ctx.beginPath(); ctx.ellipse(c.x, SURFACE_Y, c.r + 16, 7, 0, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
    hits.push({ x: c.x, y: SURFACE_Y - c.r / 2, r: c.r * 0.8, term: 'au' });
  }
  if (!nano.clusters.length) label(ctx, 'No Au loaded: bare TiO₂ control surface', W / 2, SURFACE_Y - 40, { align: 'center', color: '#fde68a', size: 13, weight: 700 });
  // sites
  for (const s of nano.sites) {
    if (!s.occupant) {
      ctx.strokeStyle = s.kind === 'interface' ? '#34d399' : 'rgba(52, 211, 153, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(s.x, SURFACE_Y - 4, 5, 0, Math.PI * 2); ctx.stroke();
      hits.push({ x: s.x, y: SURFACE_Y - 4, r: 7, term: 'site' });
    }
  }
  // molecules
  for (const m of nano.mols) {
    if (m.hidden && m.kind === 'gas') continue;
    const kind = m.kind === 'gas' || m.kind === 'landing' || m.kind === 'A' ? 'SO2' : m.kind === 'B' ? 'SO3' : 'SO4';
    molecule(ctx, kind, m.x, m.y, 0.85);
    if (m.kind === 'A') { ringAround(ctx, m.x, m.y, SPECIES_COLORS.A); hits.push({ x: m.x, y: m.y, r: 14, term: 'adsorption' }); }
    else if (m.kind === 'B') { ringAround(ctx, m.x, m.y, SPECIES_COLORS.B); hits.push({ x: m.x, y: m.y, r: 14, term: 'so3' }); }
    else if (m.kind === 'C') { ringAround(ctx, m.x, m.y, SPECIES_COLORS.C); hits.push({ x: m.x, y: m.y, r: 14, term: 'so4' }); }
    else if (m.kind === 'leaving') { label(ctx, '2−', m.x + 14, m.y - 12, { size: 10, weight: 800 }); hits.push({ x: m.x, y: m.y, r: 14, term: 'so4' }); }
    else hits.push({ x: m.x, y: m.y, r: 12, term: 'so2' });
  }
  for (const e of nano.effects) {
    ctx.globalAlpha = clamp(e.t, 0, 1);
    if (e.kind === 'oxidation') label(ctx, '−2e⁻  oxidation', e.x, e.y - 30 - (1.2 - e.t) * 20, { align: 'center', color: '#7dd3fc', size: 11, weight: 800 });
    if (e.kind === 'water') label(ctx, '+H₂O', e.x, e.y - 30 - (1.2 - e.t) * 20, { align: 'center', color: '#93c5fd', size: 11, weight: 800 });
    if (e.kind === 'release') label(ctx, 'SO₄²⁻ + 4H⁺ released', e.x, e.y - 34 - (1.6 - e.t) * 20, { align: 'center', color: '#d8b4fe', size: 11, weight: 800 });
    ctx.globalAlpha = 1;
  }
  label(ctx, `Auₙ clusters ~${params.particleSizeNm} nm (model, not to scale)`, W - 16, SURFACE_Y + 94, { align: 'right', color: '#fde68a', size: 11, weight: 700, bg: 'rgba(2,6,23,0.6)' });
  panel(ctx, [
    'NANOPARTICLE VIEW',
    'Au clusters on TiO₂. Dashed gold ring: the Au/TiO₂ perimeter, the model\'s active region.',
    'Green rings: free sites. SO₂ lands, is oxidised (−2e⁻), gains O from H₂O, leaves as SO₄²⁻.',
    `Surface now: SO₂* ${(100 * (state.thetaSO2 || 0)).toFixed(0)}% · SO₃* ${(100 * (state.thetaSO3 || 0)).toFixed(0)}% · SO₄* ${(100 * (state.thetaSO4 || 0)).toFixed(0)}% of sites (model)`
  ], 14, 12);
}

function ringAround(ctx, x, y, color) {
  ctx.strokeStyle = color; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(x, y, 17, 0, Math.PI * 2); ctx.stroke();
}

// ---------------------------------------------------------------------------
// Active-site view: one perimeter site cycling through the pathway
// ---------------------------------------------------------------------------
export const PATHWAY = [
  { id: 'gas', label: 'SO₂(g)', note: 'SO₂ approaches the Au/TiO₂ perimeter' },
  { id: 'ads', label: 'SO₂ adsorption', note: 'SO₂ binds to a free site: SO₂ + * → SO₂*' },
  { id: 'ox', label: 'Surface oxidation', note: 'S goes from +4 to +6; 2 e⁻ leave the site' },
  { id: 'so3', label: 'SO₃-like intermediate', note: 'SO₃* waits for oxygen from water' },
  { id: 'so4', label: 'SO₄²⁻ formation', note: 'SO₃* + H₂O → SO₄*, releasing H⁺' },
  { id: 'out', label: 'Sulfate-containing output', note: 'SO₄²⁻ leaves in the water film; the site is free again' }
];

function sitePhaseDurations(model) {
  const { rates, state, params } = model;
  const free = Math.max(0.02, 1 - (state.siteUtilization || 0));
  const toWall = (perMin) => (perMin > 1e-6 ? clamp(6 / perMin / 4, 0.8, 7) : Infinity);
  return [
    1.4,
    toWall(rates.kAds * params.so2Ppm * free),
    toWall(rates.k1),
    0.9,
    toWall(rates.k2),
    toWall(rates.kRel)
  ];
}

function stepSite(site, dt, model, speed) {
  const d = sitePhaseDurations(model);
  site.t += dt * speed;
  if (site.t >= d[site.phase]) {
    site.t = 0;
    site.phase = (site.phase + 1) % PATHWAY.length;
  }
  site.stalled = !Number.isFinite(d[site.phase]);
}

function drawSite(ctx, site, model, hits) {
  background(ctx);
  const cx = 470, sy = 320;
  // support
  const g = ctx.createLinearGradient(0, sy, 0, H);
  g.addColorStop(0, '#56657d'); g.addColorStop(1, '#27324a');
  ctx.fillStyle = g; ctx.fillRect(0, sy, W, H - sy);
  for (let row = 0; row < 3; row++) for (let x = 20 + (row % 2) * 22; x < W; x += 44) atom(ctx, x, sy + 16 + row * 38, ((x / 44 + row) | 0) % 2 ? 9 : 13, ((x / 44 + row) | 0) % 2 ? EL.O : EL.Ti);
  hits.push({ x: 200, y: 390, r: 90, term: 'tio2' }, { x: 780, y: 390, r: 90, term: 'tio2' });
  // Au cluster, left of the site
  const auX = cx - 150;
  for (let r = 0; r < 4; r++) for (let i = 0; i < 5 - r; i++) atom(ctx, auX - (4 - r) * 20 + i * 40 + r * 0, sy - 20 - r * 34, 20, EL.Au);
  hits.push({ x: auX, y: sy - 70, r: 90, term: 'au' });
  ctx.strokeStyle = '#34d399'; ctx.lineWidth = 2; ctx.setLineDash([5, 4]);
  ctx.beginPath(); ctx.arc(cx, sy - 4, 34, Math.PI, 0); ctx.stroke(); ctx.setLineDash([]);
  label(ctx, 'active site at the Au/TiO₂ perimeter', cx + 40, sy + 30, { color: '#6ee7b7', size: 12, weight: 700, bg: 'rgba(2,6,23,0.6)' });
  hits.push({ x: cx, y: sy - 4, r: 34, term: 'surface' });

  const d = sitePhaseDurations(model);
  const f = Number.isFinite(d[site.phase]) ? clamp(site.t / d[site.phase], 0, 1) : 0;
  const S = 1.8;
  const bound = { x: cx, y: sy - 30 };
  const ph = PATHWAY[site.phase].id;
  if (ph === 'gas') {
    // Enters from the right, below the pathway ladder so it never covers the text.
    const x = lerp(W - 30, cx + 60, f), y = lerp(215, sy - 90, f);
    molecule(ctx, 'SO2', x, y, S); hits.push({ x, y, r: 30, term: 'so2' });
  } else if (ph === 'ads') {
    const x = lerp(cx + 60, bound.x, Math.min(1, f * 2)), y = lerp(sy - 90, bound.y, Math.min(1, f * 2));
    molecule(ctx, 'SO2', x, y, S); hits.push({ x, y, r: 30, term: 'adsorption' });
  } else if (ph === 'ox') {
    molecule(ctx, f < 0.5 ? 'SO2' : 'SO3', bound.x, bound.y, S);
    hits.push({ x: bound.x, y: bound.y, r: 30, term: 'oxidation' });
    for (let i = 0; i < 2; i++) {
      const ex = lerp(bound.x, auX + 20, f), ey = lerp(bound.y, sy - 110 - i * 30, f);
      ctx.fillStyle = SPECIES_COLORS.electron; ctx.beginPath(); ctx.arc(ex + i * 14, ey, 8, 0, Math.PI * 2); ctx.fill();
      label(ctx, 'e⁻', ex + i * 14, ey, { align: 'center', color: '#082f49', size: 9, weight: 800 });
    }
  } else if (ph === 'so3') {
    molecule(ctx, 'SO3', bound.x, bound.y, S); hits.push({ x: bound.x, y: bound.y, r: 30, term: 'so3' });
  } else if (ph === 'so4') {
    const wx = lerp(cx + 220, bound.x + 34, f), wy = lerp(sy - 150, bound.y - 10, f);
    if (f < 0.85) { molecule(ctx, 'H2O', wx, wy, S * 0.9); hits.push({ x: wx, y: wy, r: 22, term: 'h2o' }); }
    molecule(ctx, f < 0.85 ? 'SO3' : 'SO4', bound.x, bound.y, S);
    hits.push({ x: bound.x, y: bound.y, r: 30, term: f < 0.85 ? 'so3' : 'so4' });
    if (f > 0.85) for (let i = 0; i < 2; i++) label(ctx, 'H⁺', bound.x + 60 + i * 26, bound.y - 40 - i * 12, { color: '#e2e8f0', size: 13, weight: 800 });
  } else {
    const x = lerp(bound.x, W - 40, f), y = lerp(bound.y, 205, f);
    molecule(ctx, 'SO4', x, y, S); label(ctx, '2−', x + 26, y - 26, { size: 13, weight: 800 });
    for (let i = 0; i < 4; i++) label(ctx, 'H⁺', x - 60 + i * 24, y + 40 + (i % 2) * 12, { color: '#e2e8f0', size: 12, weight: 800 });
    hits.push({ x, y, r: 30, term: 'so4' });
  }

  // pathway ladder
  const lx = 690, ly = 40;
  PATHWAY.forEach((p, i) => {
    const on = i === site.phase;
    label(ctx, `${i + 1}. ${p.label}`, lx, ly + i * 24, { color: on ? '#0f172a' : '#94a3b8', size: 12, weight: on ? 800 : 600, bg: on ? '#7dd3fc' : null });
    if (i < PATHWAY.length - 1) label(ctx, '↓', lx + 4, ly + i * 24 + 12, { color: '#475569', size: 10 });
  });
  const note = site.stalled
    ? stallReason(site.phase, model)
    : PATHWAY[site.phase].note;
  panel(ctx, ['ACTIVE-SITE VIEW', note, 'Simplified oxidation representation, not a full mechanism.', 'SO₂ + 2H₂O → SO₄²⁻ + 4H⁺ + 2e⁻'], 14, 12);
}

function stallReason(phase, model) {
  const id = PATHWAY[phase].id;
  if (id === 'so4' || id === 'out') return `Stalled here: water availability is ${model.params.water}. The model needs H₂O for this step.`;
  if (id === 'ox') return 'Stalled here: this surface has almost no oxidation activity (no Au/TiO₂ interface).';
  if (id === 'ads') return 'Stalled here: no SO₂ or no free sites to adsorb onto.';
  return PATHWAY[phase].note;
}

function fmtNum(v) {
  if (!Number.isFinite(v)) return '—';
  return v >= 100 ? v.toFixed(0) : v >= 1 ? v.toFixed(1) : v.toFixed(2);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
/**
 * @param {object} props
 * @param {'macro'|'filter'|'nano'|'site'} props.view
 * @param {object} props.state        model sample at the clock
 * @param {object} props.rates        run.rates
 * @param {object} props.params       run parameters
 * @param {{particleCount:number, nanoparticles:number, tracked:number, slices:number}} props.compute
 * @param {boolean} props.playing
 * @param {number} props.speed        playback multiplier
 * @param {number} props.runKey       changes when a new run starts or is reset
 * @param {(term: string) => void} props.onPick
 */
export function FilterScene({ view, state, rates, params, compute, playing, speed, runKey, onPick }) {
  const canvasRef = useRef(null);
  const model = useRef({});
  model.current = { state, rates, params, playing, speed, view };
  const engines = useRef(null);
  const hits = useRef([]);

  const { particleCount, nanoparticles, tracked, slices } = compute;
  useEffect(() => {
    engines.current = {
      bed: buildBed(slices, particleCount, tracked, params.auLoading),
      nano: buildNano(nanoparticles, params.particleSizeNm, params.auLoading),
      site: { phase: 0, t: 0, stalled: false }
    };
  }, [slices, particleCount, tracked, nanoparticles, params.auLoading, params.particleSizeNm, runKey]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    let raf;
    let last = performance.now();
    const reduced = (() => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } })();
    const frame = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const m = model.current;
      const e = engines.current;
      if (e && m.state) {
        const moving = m.playing && !reduced;
        const sp = m.speed;
        if (m.view === 'macro' || m.view === 'filter') stepBed(e.bed, moving ? dt : 0, m, sp);
        else if (m.view === 'nano') stepNano(e.nano, moving ? dt : 0, m, sp);
        else if (moving) stepSite(e.site, dt, m, sp);
        else e.site.stalled = !Number.isFinite(sitePhaseDurations(m)[e.site.phase]);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const h = [];
        if (m.view === 'macro') { drawMacro(ctx, e.bed, m, h); drawTrails(ctx, e.bed, toMacro); }
        else if (m.view === 'filter') drawFilter(ctx, e.bed, m, h);
        else if (m.view === 'nano') drawNano(ctx, e.nano, m, h);
        else drawSite(ctx, e.site, m, h);
        hits.current = h;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  function onClick(e) {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const y = ((e.clientY - rect.top) / rect.height) * H;
    let best = null, bestD = Infinity;
    // Later hits are drawn on top, so they win ties.
    for (const h of hits.current) {
      const d = Math.hypot(h.x - x, h.y - y) - h.r;
      if (d <= 6 && d <= bestD) { best = h; bestD = d; }
    }
    if (best) onPick(best.term);
  }

  return (
    <canvas
      ref={canvasRef}
      className="gf-canvas"
      onClick={onClick}
      role="img"
      aria-label={`${VIEWS.find((v) => v.id === view)?.label}: animated depiction of SO₂ passing through an Au/TiO₂ filter. Click a particle or surface to learn what it is.`}
    />
  );
}
