import { describe, it, expect } from 'vitest';
import {
  combineShapes,
  ungroupShape,
  buildSketchShape
} from '../src/features/tinker/combineUtils.js';

describe('Combine Objects & Sketch-to-3D Extrude', () => {
  it('combines 2+ selected objects into a single composite object and ungroups cleanly', () => {
    const shapes = [
      { id: 'a', type: 'box', name: 'Base', x: -10, y: 5, z: 0, w: 20, h: 10, d: 20, color: '#3b82f6', isHole: false },
      { id: 'b', type: 'cylinder', name: 'Post', x: 10, y: 10, z: 0, w: 10, h: 20, d: 10, color: '#10b981', isHole: false },
      { id: 'c', type: 'box', name: 'Other', x: 50, y: 5, z: 50, w: 10, h: 10, d: 10, color: '#ef4444', isHole: false }
    ];

    const res = combineShapes(shapes, ['a', 'b']);
    expect(res).not.toBeNull();
    expect(res.shapes.length).toBe(2); // 'c' + combined
    expect(res.combined.type).toBe('composite');
    expect(res.combined.children.length).toBe(2);
    expect(res.combined.w).toBe(35); // [-20 .. +15]
    expect(res.combined.h).toBe(20); // [0 .. 20]

    const ungrouped = ungroupShape(res.shapes, res.combined.id);
    expect(ungrouped).not.toBeNull();
    expect(ungrouped.shapes.length).toBe(3);
    expect(ungrouped.restoredIds.length).toBe(2);
  });

  it('returns null when combining fewer than 2 objects', () => {
    const shapes = [{ id: 'a', type: 'box', x: 0, y: 5, z: 0, w: 10, h: 10, d: 10 }];
    expect(combineShapes(shapes, ['a'])).toBeNull();
  });

  it('converts a 2D polygon sketch into a normalized 3D extruded shape', () => {
    const sketch = buildSketchShape(
      [[-40, -20], [40, -20], [40, 20], [-40, 20]],
      { name: 'Aero Wing', heightMm: 14, color: '#f59e0b', isHole: false }
    );
    expect(sketch).not.toBeNull();
    expect(sketch.type).toBe('sketch');
    expect(sketch.w).toBe(80);
    expect(sketch.d).toBe(40);
    expect(sketch.h).toBe(14);
    expect(sketch.y).toBe(7);
    expect(sketch.points.length).toBe(4);
    expect(buildSketchShape([[0, 0], [10, 10]])).toBeNull();
  });
});
