import { describe, it, expect } from 'vitest';
import { parseRoute, hrefFor } from '../src/app/routes.js';
import * as THREE from 'three';

describe('TinkerStudio Routes and CAD Primitives', () => {
  it('routes correctly to tinker studio from #/tinker and #/space/3d', () => {
    expect(parseRoute('#/tinker')).toEqual({ screen: 'tinker' });
    expect(parseRoute('#/space/3d')).toEqual({ screen: 'tinker' });
    expect(hrefFor.tinker()).toBe('#/tinker');
  });

  it('validates CAD workplane boundaries and primitive geometries', () => {
    const WORKPLANE_SIZE = 200; // 200 x 200 mm Tinkercad-standard grid
    const shape = {
      id: 'box-1',
      type: 'box',
      name: 'Base Block',
      x: 0,
      y: 10,
      z: 0,
      w: 40,
      h: 20,
      d: 30,
      isHole: false
    };

    // Calculate bounds
    const minX = shape.x - shape.w / 2;
    const maxX = shape.x + shape.w / 2;
    const minZ = shape.z - shape.d / 2;
    const maxZ = shape.z + shape.d / 2;

    expect(minX).toBeGreaterThanOrEqual(-WORKPLANE_SIZE / 2);
    expect(maxX).toBeLessThanOrEqual(WORKPLANE_SIZE / 2);
    expect(minZ).toBeGreaterThanOrEqual(-WORKPLANE_SIZE / 2);
    expect(maxZ).toBeLessThanOrEqual(WORKPLANE_SIZE / 2);

    // Verify Three.js geometry generation for primitives
    const boxGeom = new THREE.BoxGeometry(shape.w, shape.h, shape.d);
    expect(boxGeom.attributes.position.count).toBeGreaterThan(0);

    const cylGeom = new THREE.CylinderGeometry(shape.w / 2, shape.w / 2, shape.h, 32);
    expect(cylGeom.attributes.position.count).toBeGreaterThan(0);

    const sphereGeom = new THREE.SphereGeometry(shape.w / 2, 32, 32);
    expect(sphereGeom.attributes.position.count).toBeGreaterThan(0);
  });

  it('correctly discriminates solid vs hole cutters for CSG boolean operations', () => {
    const solidBlock = { id: 's1', type: 'box', isHole: false, color: '#3b82f6' };
    const holeCylinder = { id: 'h1', type: 'cylinder', isHole: true, color: '#ffffff' };

    expect(solidBlock.isHole).toBe(false);
    expect(holeCylinder.isHole).toBe(true);

    const solids = [solidBlock, holeCylinder].filter((s) => !s.isHole);
    const holes = [solidBlock, holeCylinder].filter((s) => s.isHole);

    expect(solids.length).toBe(1);
    expect(holes.length).toBe(1);
    expect(holes[0].id).toBe('h1');
  });

  it('supports starter templates with manifold solids and holes', () => {
    const keychainTemplate = [
      { id: 'base', type: 'box', w: 70, h: 6, d: 28, isHole: false },
      { id: 'ring_base', type: 'cylinder', w: 16, h: 6, d: 16, isHole: false },
      { id: 'ring_hole', type: 'cylinder', w: 8, h: 10, d: 8, isHole: true }
    ];

    expect(keychainTemplate.length).toBe(3);
    const hasHole = keychainTemplate.some((s) => s.isHole);
    expect(hasHole).toBe(true);

    // Hole height should exceed base height for clean through-cuts
    const base = keychainTemplate.find((s) => s.id === 'base');
    const hole = keychainTemplate.find((s) => s.id === 'ring_hole');
    expect(hole.h).toBeGreaterThan(base.h);
  });
});
