/**
 * Unit tests for WeLearn SPARK data access layer, schemas, and services.
 */
import { describe, it, expect } from 'vitest';
import {
  PblProgramContractSchema,
  normaliseContractProgram,
  validateProgramContract
} from '../src/services/pblService.js';
import { WELEARN_DT_FRAMEWORK, LIBRARY_PROGRAMS, generateSearchTokens } from '../src/features/pbl/programs/libraryProgramsData.js';

describe('WeLearn DT Framework and Library Programs', () => {
  it('framework has exactly 8 design thinking phases', () => {
    expect(WELEARN_DT_FRAMEWORK.version).toBe(1);
    expect(WELEARN_DT_FRAMEWORK.phases).toHaveLength(8);
    const phaseIds = WELEARN_DT_FRAMEWORK.phases.map(p => p.id);
    expect(phaseIds).toEqual(['explore', 'empathise', 'define', 'ideate', 'prototype', 'test', 'showcase', 'reflect']);
  });

  it('all 6 library programs satisfy the data contract schema', () => {
    expect(LIBRARY_PROGRAMS).toHaveLength(6);
    for (const prog of LIBRARY_PROGRAMS) {
      const valid = validateProgramContract(prog);
      expect(valid.success).toBe(true);
      expect(prog.status).toBe('published');
      expect(prog.visibility).toBe('centre');
      expect(prog.source).toBe('library');
      expect(prog.frameworkId).toBe('welearn-dt');
      expect(Array.isArray(prog.phases)).toBe(true);
      expect(Array.isArray(prog.tags)).toBe(true);
      expect(Array.isArray(prog.searchTokens)).toBe(true);
      expect(prog.searchTokens.length).toBeGreaterThan(0);
    }
  });

  it('generates lower-case search tokens without punctuation', () => {
    const tokens = generateSearchTokens('Eco-Cool: Climate Design!', 'Urban heat cooling', ['Bangkok', 'STEM']);
    expect(tokens).toContain('eco');
    expect(tokens).toContain('cool');
    expect(tokens).toContain('climate');
    expect(tokens).toContain('design');
    expect(tokens).toContain('bangkok');
    expect(tokens).toContain('urban');
    expect(tokens).toContain('heat');
  });

  it('normaliseContractProgram guarantees all array fields and defaults', () => {
    const raw = {
      title: 'Minimal Draft',
      theme: 'Testing',
      status: 'draft',
      visibility: 'centre'
    };
    const norm = normaliseContractProgram(raw);
    expect(norm.title).toBe('Minimal Draft');
    expect(norm.frameworkId).toBe('welearn-dt');
    expect(norm.frameworkVersion).toBe(1);
    expect(Array.isArray(norm.phases)).toBe(true);
    expect(Array.isArray(norm.tags)).toBe(true);
    expect(Array.isArray(norm.searchTokens)).toBe(true);
    expect(norm.status).toBe('draft');
    expect(norm.visibility).toBe('centre');
    expect(norm.source).toBe('studio');
  });

  it('rejects program with invalid shape or missing required fields', () => {
    const invalid = {
      title: '', // Empty title fails min(1)
      slug: 'bad-program',
      drivingQuestion: 'How to fail?',
      theme: 'Testing',
      durationWeeks: 'twelve' // Non-number fails
    };
    const res = validateProgramContract(invalid);
    expect(res.success).toBe(false);
    expect(res.error.issues.length).toBeGreaterThan(0);
  });

  it('P0-2: guards against undefined arrays and missing program docs', () => {
    // Normalizing an empty or partially formed document should never throw
    const partialDoc = {
      id: 'pbl-2e-liam-chen-2026',
      title: 'Liam Chen 2E Project',
      drivingQuestion: 'How can we build a solar car?'
    };
    const safeProg = normaliseContractProgram(partialDoc);
    expect(safeProg).not.toBeNull();
    expect(Array.isArray(safeProg.phases)).toBe(true);
    expect(Array.isArray(safeProg.sessions)).toBe(true);
    expect(Array.isArray(safeProg.tags)).toBe(true);
    expect(Array.isArray(safeProg.searchTokens)).toBe(true);
    expect(Array.isArray(safeProg.issues)).toBe(true);
    expect(Array.isArray(safeProg.assumptions)).toBe(true);
    expect(Array.isArray(safeProg.measurableImpactCriteria)).toBe(true);
    expect(typeof safeProg.realProblem).toBe('object');
    expect(typeof safeProg.teacherGuidance).toBe('object');
    expect(typeof safeProg.materialsAndKit).toBe('object');
  });
});

