import { describe, it, expect } from 'vitest';
import {
  COHORTS,
  DEFAULT_COHORT,
  resolveCohort,
  resolveAgeBand,
  buildSystemInstruction,
  SAFETY_SETTINGS
} from '../server/safety.js';
import { HarmBlockThreshold } from '@google/generative-ai';

describe('Cohort Boundaries & Safety Thresholds (6–18)', () => {
  describe('Boundary: Age 11 (Primary boundary end)', () => {
    it('resolves age 11 to primary cohort', () => {
      expect(resolveCohort(11)).toBe('primary');
      expect(resolveAgeBand(11)).toBe('primary');
    });

    it('applies primary safety guidance and limits sentences to 3-4', () => {
      const instruction = buildSystemInstruction(11);
      expect(instruction).toContain('The reader is 6 to 11 years old.');
      expect(instruction).toContain('Simple, clear language with short words and short sentences.');
      expect(instruction).toContain('Reply with at most 3 to 4 sentences.');
    });
  });

  describe('Boundary: Age 12 (Lower Secondary boundary start)', () => {
    it('resolves age 12 to lower-secondary cohort', () => {
      expect(resolveCohort(12)).toBe('lower-secondary');
      expect(resolveAgeBand(12)).toBe('lower-secondary');
    });

    it('applies lower-secondary safety guidance and limits sentences to 5', () => {
      const instruction = buildSystemInstruction(12);
      expect(instruction).toContain('The reader is 12 to 14 years old.');
      expect(instruction).toContain('Plain language. Introduce one technical term at a time');
      expect(instruction).toContain('Reply with at most 5 sentences.');
    });
  });

  describe('Boundary: Age 14 (Lower Secondary boundary end)', () => {
    it('resolves age 14 to lower-secondary cohort', () => {
      expect(resolveCohort(14)).toBe('lower-secondary');
      expect(resolveAgeBand(14)).toBe('lower-secondary');
    });

    it('applies lower-secondary guidance for age 14', () => {
      const instruction = buildSystemInstruction(14);
      expect(instruction).toContain('The reader is 12 to 14 years old.');
      expect(instruction).toContain('Reply with at most 5 sentences.');
    });
  });

  describe('Boundary: Age 15 (Higher Secondary boundary start)', () => {
    it('resolves age 15 to higher-secondary cohort', () => {
      expect(resolveCohort(15)).toBe('higher-secondary');
      expect(resolveAgeBand(15)).toBe('higher-secondary');
    });

    it('applies higher-secondary safety guidance and allows quantitative trade-offs', () => {
      const instruction = buildSystemInstruction(15);
      expect(instruction).toContain('The reader is 15 to 18 years old.');
      expect(instruction).toContain('Proper scientific and engineering vocabulary is expected.');
      expect(instruction).toContain('Reply with at most 6 sentences.');
    });
  });

  describe('Boundary: Age 18 (Higher Secondary boundary end)', () => {
    it('resolves age 18 to higher-secondary cohort', () => {
      expect(resolveCohort(18)).toBe('higher-secondary');
      expect(resolveAgeBand(18)).toBe('higher-secondary');
    });

    it('applies higher-secondary guidance for age 18', () => {
      const instruction = buildSystemInstruction(18);
      expect(instruction).toContain('The reader is 15 to 18 years old.');
      expect(instruction).toContain('Reply with at most 6 sentences.');
    });
  });

  describe('Additional edge cases and backward compatibility', () => {
    it('resolves age > 18 to higher-secondary', () => {
      expect(resolveCohort(19)).toBe('higher-secondary');
    });

    it('resolves age < 6 to primary', () => {
      expect(resolveCohort(5)).toBe('primary');
    });

    it('resolves legacy string values', () => {
      expect(resolveCohort('13-15')).toBe('lower-secondary');
      expect(resolveCohort('16-18')).toBe('higher-secondary');
      expect(resolveCohort('primary')).toBe('primary');
      expect(resolveCohort('lower-secondary')).toBe('lower-secondary');
      expect(resolveCohort('higher-secondary')).toBe('higher-secondary');
    });

    it('falls back to default cohort for undefined/invalid input', () => {
      expect(resolveCohort(null)).toBe(DEFAULT_COHORT);
      expect(resolveCohort('unknown')).toBe(DEFAULT_COHORT);
    });

    it('enforces lowest block threshold across all safety categories', () => {
      for (const s of SAFETY_SETTINGS) {
        expect(s.threshold).toBe(HarmBlockThreshold.BLOCK_LOW_AND_ABOVE);
      }
    });
  });
});
