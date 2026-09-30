/**
 * The top-bar activity search: every word must match, a bare number finds that
 * activity, and label matches rank first.
 */
import { describe, it, expect } from 'vitest';
import { searchActivities, activityNumber } from '../src/features/shell/activitySearch.js';
import { ACTIVITY_NAV } from '../src/features/activities/activityHost.js';

const items = ACTIVITY_NAV.filter((a) => a.id !== 'home');
const ids = (q) => searchActivities(items, q).map((a) => a.id);

describe('activity search', () => {
  it('an empty query lists everything in teaching order', () => {
    expect(ids('')).toEqual(items.map((a) => a.id));
    expect(ids('   ')).toHaveLength(items.length);
  });
  it('finds by name, ignoring case', () => {
    expect(ids('SOLAR')[0]).toBe('solar');
    expect(ids('hex')).toEqual(['hexgrid']);
  });
  it('a number finds that activity', () => {
    expect(ids('6')).toEqual(['so2']);
    expect(ids('activity 3')).toEqual(['coding']);
    expect(activityNumber('🧪 Activity 6: SO₂ → Sulfate')).toBe(6);
  });
  it('finds by keyword and needs every word', () => {
    expect(ids('chemistry')).toContain('so2');
    expect(ids('microscope')).toEqual(['plants']);
    expect(ids('floating house')).toEqual(['junior']);
    expect(ids('solar zebra')).toEqual([]);
  });
  it('a label match ranks above a keyword-only match', () => {
    // "bangkok" is in Activity 4's label but only in Hex-Grid's keywords.
    expect(ids('bangkok')[0]).toBe('bangkok');
    expect(ids('bangkok')).toContain('hexgrid');
  });
  it('every activity has a description to show in the list', () => {
    for (const a of items) expect(a.description, a.id).toBeTruthy();
  });
});
