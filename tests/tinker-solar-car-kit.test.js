import { describe, it, expect } from 'vitest';
import {
  SOLAR_CAR_KITS,
  SOLAR_CAR_PARTS,
  computeEngineeringSpecs
} from '../src/features/tinker/solarCarKit.js';

describe('Solar Car Engineering Kit & Blueprint Drawing Specs', () => {
  it('provides 3 complete solar car kits with chassis, solar panels, and 4 wheels', () => {
    expect(Object.keys(SOLAR_CAR_KITS)).toEqual([
      'sprint_racer',
      'endurance_cruiser',
      'offroad_buggy'
    ]);
    for (const kit of Object.values(SOLAR_CAR_KITS)) {
      const wheels = kit.shapes.filter((s) => s.name.toLowerCase().includes('wheel') || s.name.toLowerCase().includes('tire'));
      expect(wheels.length).toBe(4);
      expect(kit.shapes.some((s) => s.name.toLowerCase().includes('solar'))).toBe(true);
    }
  });

  it('includes selectable chassis, tire, and solar/drivetrain parts with axle cutter', () => {
    const categories = new Set(SOLAR_CAR_PARTS.map((p) => p.category));
    expect([...categories]).toEqual(['Chassis', 'Tires', 'Solar & Drive']);
    expect(SOLAR_CAR_PARTS.some((p) => p.isHole)).toBe(true);
  });

  it('computes accurate orthographic engineering drawing dimensions and solar area', () => {
    const specs = computeEngineeringSpecs(SOLAR_CAR_KITS.sprint_racer.shapes);
    expect(specs.lengthMm).toBe(150);
    expect(specs.widthMm).toBe(72);
    expect(specs.heightMm).toBe(34);
    expect(specs.solarAreaCm2).toBe(50.4);
    expect(specs.partCount).toBe(7);
  });
});
