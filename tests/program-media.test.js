import { describe, it, expect } from 'vitest';
import { PROGRAMS } from '../src/features/pbl/programs/catalog.js';
import {
  newMediaItem, addMedia, removeMedia, mediaFor, hydrateMedia, mediaPlaces, coverFor, coverError, MAX_MEDIA, OVERVIEW, sessionPlace
} from '../src/features/pbl/programs/programMedia.js';

const program = PROGRAMS[0];
const CANVA = 'https://www.canva.com/design/DAGabc12345/Xy_z-9876abc/view';
const YT = 'https://youtu.be/dQw4w9WgXcQ';
const IMG = 'https://res.cloudinary.com/welearn/image/upload/v1/covers/poster.png';
const make = (over = {}) => newMediaItem({ program, place: OVERVIEW, title: 'Welcome', url: YT, uid: 'coach_a', now: 1000, rand: () => 0.5, ...over });

describe('program media', () => {
  it('offers the overview and every session as places', () => {
    const places = mediaPlaces(program);
    expect(places[0].id).toBe(OVERVIEW);
    expect(places).toHaveLength(program.sessions.length + 1);
    expect(places[1].id).toBe(sessionPlace(program.sessions[0].sessionNumber));
  });

  it('builds an item from a Canva, YouTube or Cloudinary link and types it', () => {
    expect(make().item).toMatchObject({ programId: program.id, place: OVERVIEW, title: 'Welcome', type: 'video', createdBy: 'coach_a' });
    expect(make({ url: CANVA }).item.type).toBe('design');
    expect(make({ url: IMG }).item.type).toBe('image');
  });

  it('refuses what learners could not see, with a reason', () => {
    expect(make({ title: '  ' }).error).toMatch(/title/);
    expect(make({ place: 'session-999' }).error).toMatch(/where/);
    expect(make({ url: 'https://example.com/video.mp4' }).error).toMatch(/Canva/);
    expect(make({ url: 'https://www.canva.com/design/DAGabc12345/Xy_z-9876abc/edit' }).error).toMatch(/edit link/);
  });

  it('adds, removes, filters by place and caps the list', () => {
    const a = make().item;
    const b = make({ place: sessionPlace(program.sessions[0].sessionNumber), url: CANVA, now: 2000 }).item;
    const list = addMedia(addMedia([], a).list, b).list;
    expect(mediaFor(list, program.id, OVERVIEW).map((m) => m.id)).toEqual([a.id]);
    expect(mediaFor(list, 'other-program', OVERVIEW)).toEqual([]);
    expect(removeMedia(list, a.id).map((m) => m.id)).toEqual([b.id]);
    const full = Array.from({ length: MAX_MEDIA }, (_, i) => ({ ...a, id: `m${i}` }));
    expect(addMedia(full, b).error).toMatch(/already has/);
  });

  it('drops malformed or non-embeddable stored items', () => {
    const good = make().item;
    expect(hydrateMedia([good, null, { ...good, id: 'x', url: 'javascript:alert(1)' }, { ...good, id: 'y', title: '' }, 'junk'])).toEqual([good]);
    expect(hydrateMedia('nope')).toEqual([]);
  });
});

describe('program covers', () => {
  it('accepts Cloudinary images only', () => {
    expect(coverError(IMG)).toBeNull();
    expect(coverError(CANVA)).toMatch(/Cloudinary image/);
    expect(coverError('https://example.com/a.png')).toMatch(/Cloudinary image/);
  });

  it('prefers the class cover, then the school cover, then none (drawn poster)', () => {
    const withSchool = { ...program, identity: { ...program.identity, cover: 'https://res.cloudinary.com/x/image/upload/school.png' } };
    expect(coverFor(withSchool, [{ [program.id]: IMG }])).toEqual({ url: IMG, source: 'class' });
    expect(coverFor(withSchool, [{}])).toMatchObject({ source: 'school' });
    expect(coverFor(program, [{ [program.id]: 'https://example.com/bad.png' }])).toBeNull();
    expect(coverFor(program, [])).toBeNull();
  });
});
