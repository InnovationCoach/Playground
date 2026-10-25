import { describe, it, expect } from 'vitest';
import { ARCHETYPES, computeArchetypeProfile } from '../src/features/goals/archetypes.js';

describe('teen archetype profile', () => {
  it('returns valid default profile for empty or invalid plan', () => {
    for (const bad of [null, undefined, {}, { goals: [] }]) {
      const profile = computeArchetypeProfile(bad);
      expect(profile).toHaveProperty('scores');
      expect(profile).toHaveProperty('primary');
      expect(profile.level).toBe(1);
      expect(profile.totalXp).toBe(0);
      expect(ARCHETYPES.some((a) => a.id === profile.primary.id)).toBe(true);
    }
  });

  it('identifies The Builder when builder strengths and code goals are set', () => {
    const plan = {
      strengths: ['tech', 'building'],
      goals: [
        {
          id: 'g1',
          explore: 'Building a robot car',
          showHow: 'model',
          steps: [{ id: 's1', text: 'assemble chassis', done: true }]
        }
      ]
    };
    const profile = computeArchetypeProfile(plan);
    expect(profile.primary.id).toBe('builder');
    expect(profile.scores.builder).toBeGreaterThan(profile.scores.visionary);
    expect(profile.totalXp).toBeGreaterThan(0);
  });

  it('identifies The Visionary when art and creative strengths are picked', () => {
    const plan = {
      strengths: ['creative', 'art', 'humour'],
      goals: [{ id: 'g1', explore: 'Animated mini-movie', showHow: 'video', steps: [] }]
    };
    const profile = computeArchetypeProfile(plan);
    expect(profile.primary.id).toBe('visionary');
    expect(profile.scores.visionary).toBeGreaterThan(profile.scores.diplomat);
  });

  it('identifies The Diplomat when communication and empathy are picked', () => {
    const plan = {
      strengths: ['talking', 'empathy'],
      focus: { skill: 'asking' }
    };
    const profile = computeArchetypeProfile(plan);
    expect(profile.primary.id).toBe('diplomat');
    expect(profile.scores.diplomat).toBeGreaterThan(profile.scores.builder);
  });

  it('identifies The Strategist when systems thinking and planning are picked', () => {
    const plan = {
      strengths: ['big-picture', 'deep-questions', 'patterns'],
      focus: { skill: 'planning' }
    };
    const profile = computeArchetypeProfile(plan);
    expect(profile.primary.id).toBe('strategist');
    expect(profile.scores.strategist).toBeGreaterThan(profile.scores.visionary);
  });

  it('levels up and awards higher XP as goals and steps are completed', () => {
    const highXpPlan = {
      strengths: ['tech', 'building', 'creative'],
      goals: [
        {
          id: 'g1',
          explore: 'AI Model',
          showHow: 'code',
          done: true,
          steps: [
            { id: 's1', text: 'data', done: true },
            { id: 's2', text: 'train', done: true },
            { id: 's3', text: 'eval', done: true }
          ]
        }
      ]
    };
    const profile = computeArchetypeProfile(highXpPlan);
    expect(profile.totalXp).toBeGreaterThan(300);
    expect(profile.level).toBeGreaterThanOrEqual(3);
  });
});
