/**
 * Solar Car Engineering Kits, Individual Chassis / Tire / Solar Parts,
 * and Orthographic Engineering Drawing metrics for 3D Tinker Studio.
 */

export const SOLAR_CAR_KITS = {
  sprint_racer: {
    id: 'sprint_racer',
    name: 'Sprint Racer Kit',
    summary: 'Narrow 52 mm aero chassis, thin speed wheels, 15° solar deck',
    shapes: [
      { id: 'sc_chassis', type: 'box', name: 'Aero Sprint Chassis', x: 0, y: 16, z: 0, w: 150, h: 8, d: 52, rotX: 0, rotY: 0, rotZ: 0, color: '#3b82f6', isHole: false },
      { id: 'sc_panel', type: 'box', name: 'Solar Panel (15°)', x: -6, y: 27, z: 0, w: 105, h: 4, d: 48, rotX: 0, rotY: 0, rotZ: 12, color: '#1e293b', isHole: false },
      { id: 'sc_motor', type: 'cylinder', name: 'DC Drive Motor', x: 46, y: 24, z: 0, w: 20, h: 28, d: 20, rotX: 0, rotY: 0, rotZ: 90, color: '#64748b', isHole: false },
      { id: 'sc_w_fl', type: 'cylinder', name: 'Front-L Speed Wheel', x: -50, y: 16, z: 32, w: 32, h: 8, d: 32, rotX: 90, rotY: 0, rotZ: 0, color: '#10b981', isHole: false },
      { id: 'sc_w_fr', type: 'cylinder', name: 'Front-R Speed Wheel', x: -50, y: 16, z: -32, w: 32, h: 8, d: 32, rotX: 90, rotY: 0, rotZ: 0, color: '#10b981', isHole: false },
      { id: 'sc_w_rl', type: 'cylinder', name: 'Rear-L Speed Wheel', x: 50, y: 16, z: 32, w: 32, h: 8, d: 32, rotX: 90, rotY: 0, rotZ: 0, color: '#10b981', isHole: false },
      { id: 'sc_w_rr', type: 'cylinder', name: 'Rear-R Speed Wheel', x: 50, y: 16, z: -32, w: 32, h: 8, d: 32, rotX: 90, rotY: 0, rotZ: 0, color: '#10b981', isHole: false }
    ]
  },
  endurance_cruiser: {
    id: 'endurance_cruiser',
    name: 'Endurance Cruiser Kit',
    summary: 'Wide 76 mm stability chassis, grip tires, dual solar array',
    shapes: [
      { id: 'ec_chassis', type: 'box', name: 'Wide Cruiser Chassis', x: 0, y: 19, z: 0, w: 165, h: 10, d: 76, rotX: 0, rotY: 0, rotZ: 0, color: '#8b5cf6', isHole: false },
      { id: 'ec_panel', type: 'box', name: 'Dual Solar Array', x: 0, y: 29, z: 0, w: 130, h: 4, d: 72, rotX: 0, rotY: 0, rotZ: 0, color: '#0f172a', isHole: false },
      { id: 'ec_nose', type: 'wedge', name: 'Aero Nose Cone', x: -92, y: 19, z: 0, w: 22, h: 10, d: 76, rotX: 0, rotY: 0, rotZ: 0, color: '#f59e0b', isHole: false },
      { id: 'ec_w_fl', type: 'cylinder', name: 'Front-L Grip Tire', x: -55, y: 19, z: 46, w: 38, h: 14, d: 38, rotX: 90, rotY: 0, rotZ: 0, color: '#1e293b', isHole: false },
      { id: 'ec_w_fr', type: 'cylinder', name: 'Front-R Grip Tire', x: -55, y: 19, z: -46, w: 38, h: 14, d: 38, rotX: 90, rotY: 0, rotZ: 0, color: '#1e293b', isHole: false },
      { id: 'ec_w_rl', type: 'cylinder', name: 'Rear-L Grip Tire', x: 55, y: 19, z: 46, w: 38, h: 14, d: 38, rotX: 90, rotY: 0, rotZ: 0, color: '#1e293b', isHole: false },
      { id: 'ec_w_rr', type: 'cylinder', name: 'Rear-R Grip Tire', x: 55, y: 19, z: -46, w: 38, h: 14, d: 38, rotX: 90, rotY: 0, rotZ: 0, color: '#1e293b', isHole: false }
    ]
  },
  offroad_buggy: {
    id: 'offroad_buggy',
    name: 'Off-Road Solar Buggy',
    summary: 'High-clearance 70 mm frame, 46 mm lug tires, raised solar canopy',
    shapes: [
      { id: 'ob_chassis', type: 'box', name: 'Buggy Frame', x: 0, y: 24, z: 0, w: 160, h: 12, d: 68, rotX: 0, rotY: 0, rotZ: 0, color: '#f97316', isHole: false },
      { id: 'ob_canopy', type: 'box', name: 'Solar Canopy Roof', x: 4, y: 46, z: 0, w: 112, h: 4, d: 64, rotX: 0, rotY: 0, rotZ: 8, color: '#1e293b', isHole: false },
      { id: 'ob_rollbar', type: 'box', name: 'Canopy Support', x: 4, y: 36, z: 0, w: 28, h: 18, d: 54, rotX: 0, rotY: 0, rotZ: 0, color: '#64748b', isHole: false },
      { id: 'ob_w_fl', type: 'cylinder', name: 'Front-L Lug Tire', x: -54, y: 23, z: 44, w: 46, h: 18, d: 46, rotX: 90, rotY: 0, rotZ: 0, color: '#0f172a', isHole: false },
      { id: 'ob_w_fr', type: 'cylinder', name: 'Front-R Lug Tire', x: -54, y: 23, z: -44, w: 46, h: 18, d: 46, rotX: 90, rotY: 0, rotZ: 0, color: '#0f172a', isHole: false },
      { id: 'ob_w_rl', type: 'cylinder', name: 'Rear-L Lug Tire', x: 54, y: 23, z: 44, w: 46, h: 18, d: 46, rotX: 90, rotY: 0, rotZ: 0, color: '#0f172a', isHole: false },
      { id: 'ob_w_rr', type: 'cylinder', name: 'Rear-R Lug Tire', x: 54, y: 23, z: -44, w: 46, h: 18, d: 46, rotX: 90, rotY: 0, rotZ: 0, color: '#0f172a', isHole: false }
    ]
  }
};

export const SOLAR_CAR_PARTS = [
  { category: 'Chassis', type: 'box', name: 'Aero Sprint Chassis', w: 150, h: 8, d: 52, y: 16, rotX: 0, color: '#3b82f6', isHole: false },
  { category: 'Chassis', type: 'box', name: 'Wide Cruiser Chassis', w: 165, h: 10, d: 76, y: 19, rotX: 0, color: '#8b5cf6', isHole: false },
  { category: 'Chassis', type: 'wedge', name: 'Aero Nose Fairing', w: 24, h: 10, d: 52, y: 16, rotX: 0, color: '#f59e0b', isHole: false },
  { category: 'Tires', type: 'cylinder', name: 'Thin Speed Wheel (Ø32)', w: 32, h: 8, d: 32, y: 16, rotX: 90, color: '#10b981', isHole: false },
  { category: 'Tires', type: 'cylinder', name: 'Standard Grip Tire (Ø38)', w: 38, h: 14, d: 38, y: 19, rotX: 90, color: '#1e293b', isHole: false },
  { category: 'Tires', type: 'cylinder', name: 'Off-Road Lug Tire (Ø46)', w: 46, h: 18, d: 46, y: 23, rotX: 90, color: '#0f172a', isHole: false },
  { category: 'Solar & Drive', type: 'box', name: 'Solar Panel (110×65)', w: 110, h: 4, d: 65, y: 28, rotX: 0, color: '#1e293b', isHole: false },
  { category: 'Solar & Drive', type: 'cylinder', name: 'DC Motor Mount', w: 20, h: 28, d: 20, y: 24, rotX: 0, color: '#64748b', isHole: false },
  { category: 'Solar & Drive', type: 'cylinder', name: 'Axle Bore Cutter (Ø6)', w: 6, h: 90, d: 6, y: 16, rotX: 90, color: '#ffffff', isHole: true }
];

/**
 * Computes bounding box & engineering drawing metrics (mm) for the active shapes.
 */
export function computeEngineeringSpecs(shapes = []) {
  const solids = shapes.filter((s) => !s.isHole);
  if (!solids.length) {
    return { lengthMm: 0, widthMm: 0, heightMm: 0, minX: 0, maxX: 0, minY: 0, maxY: 0, minZ: 0, maxZ: 0, partCount: 0, solarAreaCm2: 0 };
  }

  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;
  let solarAreaCm2 = 0;

  for (const s of solids) {
    let effW = s.w || 10;
    let effH = s.h || 10;
    let effD = s.d || 10;
    if (Math.abs((s.rotX || 0) % 180) === 90) {
      [effH, effD] = [effD, effH];
    }
    if (Math.abs((s.rotZ || 0) % 180) === 90) {
      [effW, effH] = [effH, effW];
    }
    const hw = effW / 2;
    const hh = effH / 2;
    const hd = effD / 2;
    minX = Math.min(minX, (s.x || 0) - hw);
    maxX = Math.max(maxX, (s.x || 0) + hw);
    minY = Math.min(minY, (s.y || 0) - hh);
    maxY = Math.max(maxY, (s.y || 0) + hh);
    minZ = Math.min(minZ, (s.z || 0) - hd);
    maxZ = Math.max(maxZ, (s.z || 0) + hd);

    if ((s.name || '').toLowerCase().includes('solar')) {
      solarAreaCm2 += ((s.w || 0) * (s.d || 0)) / 100;
    }
  }

  return {
    lengthMm: Math.round(maxX - minX),
    widthMm: Math.round(maxZ - minZ),
    heightMm: Math.round(maxY - minY),
    minX,
    maxX,
    minY,
    maxY,
    minZ,
    maxZ,
    partCount: solids.length,
    solarAreaCm2: Math.round(solarAreaCm2 * 10) / 10
  };
}
