/**
 * My Dashboard Launchpad: typed and spoken commands (src/features/dashboard/launchpad.js).
 */
import { describe, it, expect } from 'vitest';
import { rankCommands, matchCommand, normalise, step, SECTION_LOOK, PAGES } from '../src/features/dashboard/launchpad.js';
import { WIDGETS } from '../src/features/dashboard/dashboardModel.js';

const ALL = WIDGETS.map((w) => w.id);
const hit = (text, sections = ALL) => {
  const m = matchCommand(text, sections);
  return m ? `${m.kind}:${m.id}` : null;
};

describe('section looks', () => {
  it('covers every dashboard widget', () => {
    for (const id of ALL) expect(SECTION_LOOK[id], id).toBeTruthy();
  });
  it('gives every page a real link', () => {
    for (const p of PAGES) expect(p.href()).toMatch(/^#\//);
  });
});

describe('commands', () => {
  it('finds sections however they are asked for', () => {
    expect(hit('open focus')).toBe('section:focus');
    expect(hit('Show me my badges please')).toBe('section:badges');
    expect(hit("what's on my to do list today")).toBe('section:today');
    expect(hit('how am I feeling')).toBe('section:checkin');
    expect(hit('notes')).toBe('section:notes');
  });

  it('tells "next" apart from "next step", and handles "go back"', () => {
    expect(hit('next')).toBe('action:next');
    expect(hit('next step')).toBe('section:nextStep');
    expect(hit('go back')).toBe('action:prev');
  });

  it('prefers actions for focus and music', () => {
    expect(hit('start focus')).toBe('action:focus-start');
    expect(hit('play some music')).toBe('action:sound-play');
    expect(hit('stop the music')).toBe('action:sound-stop');
    expect(hit('show all')).toBe('action:grid');
  });

  it('goes to other pages', () => {
    expect(hit('take me to PBL')).toBe('page:pbl');
    expect(hit('set a goal')).toBe('page:goal-setting');
    expect(hit('my goals')).toBe('section:goals');
    expect(hit('open settings')).toBe('page:settings');
  });

  it('forgives a one-letter typo but not nonsense', () => {
    expect(hit('badgs')).toBe('section:badges');
    expect(hit('focuss')).toBe('section:focus');
    expect(hit('banana')).toBeNull();
    expect(hit('')).toBeNull();
  });

  it('only offers sections the learner has on the dashboard', () => {
    expect(hit('notes', ['today', 'focus'])).toBeNull();
    expect(rankCommands('focus', ['focus']).every((r) => r.kind !== 'section' || r.id === 'focus')).toBe(true);
  });

  it('does not match a word inside another word', () => {
    expect(hit('notebook')).toBeNull();
  });

  it('normalises punctuation and case', () => {
    expect(normalise("  Open  FOCUS!! ")).toBe('open focus');
  });
});

describe('stepping', () => {
  it('wraps both ways', () => {
    expect(step(['a', 'b', 'c'], 'c', 1)).toBe('a');
    expect(step(['a', 'b', 'c'], 'a', -1)).toBe('c');
    expect(step(['a', 'b'], 'missing', 1)).toBe('b');
    expect(step([], 'a', 1)).toBeNull();
  });
});
