/**
 * Lesson metadata & Training Wheels tool-gating definitions for 3D Tinker Studio,
 * plus pure local mesh diagnostic checks when running without the bpy worker.
 */
export const TINKER_LESSONS = {
  starter_keychain: {
    id: 'starter_keychain',
    title: 'Lesson 1: Keychain & Bevel Basics',
    maxTriangles: 4000,
    unlockedTools: ['bevel', 'extrude'],
    hint: 'Training Wheels active: only Bevel and Extrude are unlocked for this lesson.'
  },
  shell_enclosure: {
    id: 'shell_enclosure',
    title: 'Lesson 2: Precision Shell & Inset',
    maxTriangles: 8000,
    unlockedTools: ['extrude', 'bevel', 'inset'],
    hint: 'Extrude, Bevel, and Inset are unlocked to hollow and detail enclosures.'
  },
  full_cad: {
    id: 'full_cad',
    title: 'Free Studio: All bmesh Tools',
    maxTriangles: 15000,
    unlockedTools: ['extrude', 'bevel', 'loop_cut', 'inset'],
    hint: 'All procedural bmesh tools unlocked.'
  }
};

export const TOOL_DEFS = [
  { id: 'extrude', op: 'extrude_face', label: 'Extrude Face', paramKey: 'distanceMm', unit: 'mm', min: -20, max: 30, step: 1, defaultVal: 5 },
  { id: 'bevel', op: 'bevel_edges', label: 'Bevel Edges', paramKey: 'offsetMm', unit: 'mm', min: 0.5, max: 6, step: 0.5, defaultVal: 1.5 },
  { id: 'loop_cut', op: 'loop_cut', label: 'Loop Cut', paramKey: 'cuts', unit: 'cuts', min: 1, max: 6, step: 1, defaultVal: 1 },
  { id: 'inset', op: 'inset_faces', label: 'Inset Faces', paramKey: 'thicknessMm', unit: 'mm', min: 0.5, max: 8, step: 0.5, defaultVal: 2 }
];

export function getUnlockedTools(lessonId) {
  const lesson = TINKER_LESSONS[lessonId] || TINKER_LESSONS.full_cad;
  return TOOL_DEFS.filter((t) => lesson.unlockedTools.includes(t.id));
}

function estimateTriangles(shape) {
  switch (shape.type) {
    case 'box':
    case 'wedge':
    case 'roof':
      return 12;
    case 'cylinder':
    case 'cone':
      return 128;
    case 'sphere':
    case 'torus':
      return 1024;
    default:
      return 12;
  }
}

/**
 * Local fallback diagnostics mirroring the backend bmesh DiagnosticReport contract
 * when the headless Blender worker is not connected.
 */
export function runLocalMeshDiagnostics(shapes = [], maxTriangles = 10000) {
  const issues = [];
  let triangleCount = 0;

  for (const s of shapes) {
    triangleCount += estimateTriangles(s);

    // Check if object floats off the workplane or sinks below z=0
    const bottomY = (s.y || 0) - (s.h || 0) / 2;
    if (bottomY < -0.5) {
      issues.push({
        code: 'NON_MANIFOLD',
        severity: 'error',
        objectName: s.name || s.id,
        count: 1,
        coordinates: [[s.x || 0, Math.max(0, s.y || 0), s.z || 0]],
        explanation: `'${s.name || s.id}' dips ${Math.abs(bottomY).toFixed(1)} mm below the print bed, creating non-manifold base intersections.`,
        autoFixable: true
      });
    }

    // Check thin wall / degenerate dimensions (< 2mm)
    if ((s.w || 0) < 2 || (s.h || 0) < 2 || (s.d || 0) < 2) {
      issues.push({
        code: 'UNAPPLIED_SCALE',
        severity: 'warning',
        objectName: s.name || s.id,
        count: 1,
        coordinates: [[s.x || 0, s.y || 0, s.z || 0]],
        explanation: `'${s.name || s.id}' has a dimension under 2 mm, which may fail to slice or print reliably.`,
        autoFixable: true
      });
    }
  }

  if (triangleCount > maxTriangles) {
    issues.push({
      code: 'POLY_BUDGET_EXCEEDED',
      severity: 'warning',
      objectName: 'Scene',
      count: triangleCount - maxTriangles,
      coordinates: [],
      explanation: `Scene uses ~${triangleCount.toLocaleString()} triangles, exceeding the ${maxTriangles.toLocaleString()} triangle budget.`,
      autoFixable: false
    });
  }

  const errors = issues.filter((i) => i.severity === 'error').length;
  const warnings = issues.filter((i) => i.severity === 'warning').length;
  const score = Math.max(0, 100 - errors * 25 - warnings * 10);

  return {
    ok: true,
    passed: errors === 0,
    score,
    triangleCount,
    maxTriangles,
    issues
  };
}

export function autoFixLocalShapes(shapes = []) {
  return shapes.map((s) => {
    const w = Math.max(2, s.w || 2);
    const h = Math.max(2, s.h || 2);
    const d = Math.max(2, s.d || 2);
    const minY = Math.round(h / 2);
    return {
      ...s,
      w,
      h,
      d,
      y: Math.max(minY, s.y || minY)
    };
  });
}
