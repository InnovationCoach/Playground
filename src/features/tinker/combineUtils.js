/**
 * Pure utilities for combining multiple 3D shapes into a unified composite object,
 * ungrouping composites back to world coordinates, and creating 3D shapes from 2D sketches.
 */

export function combineShapes(shapes = [], selectedIds = []) {
  const idSet = new Set(selectedIds);
  const targets = shapes.filter((s) => idSet.has(s.id));
  if (targets.length < 2) return null;

  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;

  for (const s of targets) {
    const hw = (s.w || 10) / 2;
    const hh = (s.h || 10) / 2;
    const hd = (s.d || 10) / 2;
    minX = Math.min(minX, (s.x || 0) - hw);
    maxX = Math.max(maxX, (s.x || 0) + hw);
    minY = Math.min(minY, (s.y || 0) - hh);
    maxY = Math.max(maxY, (s.y || 0) + hh);
    minZ = Math.min(minZ, (s.z || 0) - hd);
    maxZ = Math.max(maxZ, (s.z || 0) + hd);
  }

  const cx = Math.round((minX + maxX) / 2);
  const cy = Math.round((minY + maxY) / 2);
  const cz = Math.round((minZ + maxZ) / 2);
  const w = Math.max(4, Math.round(maxX - minX));
  const h = Math.max(2, Math.round(maxY - minY));
  const d = Math.max(4, Math.round(maxZ - minZ));

  const children = targets.map((s) => ({
    ...s,
    x: (s.x || 0) - cx,
    y: (s.y || 0) - cy,
    z: (s.z || 0) - cz
  }));

  const combined = {
    id: `combo_${Date.now().toString(36)}`,
    type: 'composite',
    name: `Combined (${targets.length} parts)`,
    x: cx,
    y: cy,
    z: cz,
    w,
    h,
    d,
    baseW: w,
    baseH: h,
    baseD: d,
    rotX: 0,
    rotY: 0,
    rotZ: 0,
    color: targets.find((t) => !t.isHole)?.color || '#3b82f6',
    isHole: false,
    children
  };

  const remaining = shapes.filter((s) => !idSet.has(s.id));
  return {
    combined,
    shapes: [...remaining, combined]
  };
}

export function ungroupShape(shapes = [], targetId) {
  const target = shapes.find((s) => s.id === targetId);
  if (!target || target.type !== 'composite' || !Array.isArray(target.children)) {
    return null;
  }

  const sx = (target.w || 1) / (target.baseW || target.w || 1);
  const sy = (target.h || 1) / (target.baseH || target.h || 1);
  const sz = (target.d || 1) / (target.baseD || target.d || 1);

  const restored = target.children.map((c, idx) => ({
    ...c,
    id: `${c.type || 'part'}_${Date.now().toString(36)}_${idx}`,
    x: Math.round((target.x || 0) + (c.x || 0) * sx),
    y: Math.round((target.y || 0) + (c.y || 0) * sy),
    z: Math.round((target.z || 0) + (c.z || 0) * sz),
    w: Math.max(2, Math.round((c.w || 10) * sx)),
    h: Math.max(2, Math.round((c.h || 10) * sy)),
    d: Math.max(2, Math.round((c.d || 10) * sz))
  }));

  const remaining = shapes.filter((s) => s.id !== targetId);
  return {
    restoredIds: restored.map((r) => r.id),
    shapes: [...remaining, ...restored]
  };
}

/**
 * Converts 2D sketch polygon points (in mm centered around 0,0) into a 3D Tinker shape.
 */
export function buildSketchShape(points = [], { name = '2D Sketch Part', heightMm = 12, color = '#7c3aed', isHole = false } = {}) {
  if (!Array.isArray(points) || points.length < 3) return null;

  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  for (const [px, py] of points) {
    minX = Math.min(minX, px);
    maxX = Math.max(maxX, px);
    minY = Math.min(minY, py);
    maxY = Math.max(maxY, py);
  }

  const w = Math.max(6, Math.round(maxX - minX));
  const d = Math.max(6, Math.round(maxY - minY));
  const h = Math.max(2, Math.round(heightMm));
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;

  // Normalize points to [-0.5, 0.5] so resizing w/d scales the sketch cleanly
  const normalizedPoints = points.map(([px, py]) => [
    (px - cx) / Math.max(1, maxX - minX),
    (py - cy) / Math.max(1, maxY - minY)
  ]);

  return {
    id: `sketch_${Date.now().toString(36)}`,
    type: 'sketch',
    name,
    x: 0,
    y: Math.round(h / 2),
    z: 0,
    w,
    h,
    d,
    rotX: 0,
    rotY: 0,
    rotZ: 0,
    color,
    isHole,
    points: normalizedPoints
  };
}
