/**
 * Coach media on a PBL program: videos, images and Canva posters a coach
 * adds for their class, shown on the program overview or on one session.
 * Pure functions over plain data, unit-tested in tests/program-media.test.js.
 *
 * Stored on the class document the coach teaches (classes/{classId}):
 *   programMedia:  [{ id, programId, place, title, url, type, createdBy, createdAt }]
 *   programCovers: { [programId]: cloudinaryImageUrl }
 * Existing rules already let a class's teachers update its document and its
 * members read it, so this needs no rule change. Only links that
 * engine/mediaEmbed.js can show inside the page are accepted.
 *
 * A program's cover is, in order: the class's cover (set by its coach), the
 * school-wide cover in the catalog, or a poster drawn from the program's own
 * colours and icon (ProgramPoster.jsx).
 */
import { embedFor } from '../engine/mediaEmbed.js';

export const MAX_MEDIA = 40;
export const TITLE_MAX = 100;
export const OVERVIEW = 'overview';
const TYPE = { canva: 'design', image: 'image', video: 'video', youtube: 'video' };

export const sessionPlace = (n) => `session-${n}`;

/** Where a coach can put media: the overview, or one session. */
export function mediaPlaces(program) {
  return [
    { id: OVERVIEW, label: 'Program overview' },
    ...program.sessions.map((s) => ({ id: sessionPlace(s.sessionNumber), label: `Session ${s.sessionNumber}: ${s.title}` }))
  ];
}

const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/** Build one item from the coach's form, or say what is wrong (shown to the coach). */
export function newMediaItem({ program, place, title, url, uid, now = Date.now(), rand = Math.random }) {
  const t = str(title, TITLE_MAX);
  if (!t) return { error: 'Give it a short title, like "Welcome video" or "Week 3 poster".' };
  const places = mediaPlaces(program).map((p) => p.id);
  if (!places.includes(place)) return { error: 'Choose where learners should see it.' };
  const e = embedFor(url);
  if (!e) return { error: 'Paste a Canva design share link, a YouTube video, or a Cloudinary image or video link.' };
  if (!e.src) return { error: e.hint };
  return {
    item: {
      id: `m-${now.toString(36)}-${Math.floor(rand() * 1e6).toString(36)}`,
      programId: program.id,
      place,
      title: t,
      url: String(url).trim(),
      type: TYPE[e.type],
      createdBy: uid || null,
      createdAt: now
    }
  };
}

/** Whatever came back from Firestore: well-formed, embeddable items only. */
export function hydrateMedia(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.filter((m) => m && typeof m === 'object' && typeof m.id === 'string' && typeof m.programId === 'string'
    && typeof m.place === 'string' && str(m.title, TITLE_MAX) && embedFor(m.url)?.src)
    .map((m) => ({ ...m, title: str(m.title, TITLE_MAX), createdAt: Number.isFinite(m.createdAt) ? m.createdAt : 0 }))
    .slice(0, MAX_MEDIA);
}

export function addMedia(list, item) {
  const clean = hydrateMedia(list);
  if (clean.length >= MAX_MEDIA) return { error: `This class already has ${MAX_MEDIA} media items. Remove one first.` };
  return { list: [...clean, item] };
}

export const removeMedia = (list, id) => hydrateMedia(list).filter((m) => m.id !== id);

/** Media for one place in one program, oldest first so the coach controls the order by adding. */
export function mediaFor(list, programId, place) {
  return hydrateMedia(list).filter((m) => m.programId === programId && m.place === place).sort((a, b) => a.createdAt - b.createdAt);
}

/** A cover must be a picture: a Cloudinary image link. */
export function coverError(url) {
  if (!url) return null;
  const e = embedFor(url);
  return e?.type === 'image' ? null : 'Use a Cloudinary image link (res.cloudinary.com/…/image/upload/…). Tip: download your Canva poster as PNG and upload it to Cloudinary.';
}

/** The class cover if a coach set one, then the school's cover, then none (the drawn poster). */
export function coverFor(program, classCovers = []) {
  for (const covers of classCovers) {
    const url = covers?.[program.id];
    if (url && !coverError(url)) return { url, source: 'class' };
  }
  if (program.identity?.cover && !coverError(program.identity.cover)) return { url: program.identity.cover, source: 'school' };
  return null;
}
