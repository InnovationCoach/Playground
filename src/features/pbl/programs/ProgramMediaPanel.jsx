import { createContext, useContext, useState } from 'react';
import { ImagePlus, Trash2, Clapperboard, Image as ImageIcon, Palette, School } from 'lucide-react';
import { MediaEmbed } from '../MediaEmbed.jsx';
import { Alert } from '../../admin/ui/bits.jsx';
import { saveClassMedia, saveClassCover, explainError } from '../../coach/classCodes.js';
import {
  OVERVIEW, TITLE_MAX, mediaPlaces, newMediaItem, addMedia, removeMedia, mediaFor, coverError
} from './programMedia.js';

/**
 * Coach media on a program page. The program page provides the classes that
 * run this program (useClassPrograms); the gallery reads from them, and a
 * coach of one of those classes gets the add form, the cover setting and a
 * remove button on each item. See programMedia.js for the rules.
 */
const MediaContext = createContext({ classes: [], isCoach: false, uid: null, reload: () => {} });
export const ProgramMediaProvider = MediaContext.Provider;

const TYPE_ICON = { video: Clapperboard, image: ImageIcon, design: Palette };

/** All media for one place in this program, from every class the viewer is in. */
function useMediaAt(programId, place) {
  const { classes } = useContext(MediaContext);
  return classes.flatMap((c) => mediaFor(c.programMedia, programId, place).map((m) => ({ ...m, cls: c })));
}

export function MediaGallery({ program, place = OVERVIEW, compact = false }) {
  const { isCoach, classes, reload } = useContext(MediaContext);
  const items = useMediaAt(program.id, place);
  const [error, setError] = useState(null);
  if (!items.length) return null;
  const multi = new Set(items.map((m) => m.cls.id)).size > 1;

  async function remove(m) {
    setError(null);
    try {
      await saveClassMedia(m.cls, removeMedia(m.cls.programMedia, m.id));
      await reload();
    } catch (err) {
      setError(explainError(err));
    }
  }

  return (
    <section className={`pg-media${compact ? ' pg-media-compact' : ''}`} aria-label="From your coach">
      {!compact && <h3 className="pb-h3"><Clapperboard size={17} aria-hidden="true" />{isCoach ? 'Media for your learners' : 'From your coach'}</h3>}
      {compact && <h4 className="pg-h4">{isCoach ? 'Media for this session' : 'From your coach'}</h4>}
      {error && <Alert type="error">{error}</Alert>}
      <ul className="pg-media-grid">
        {items.map((m) => {
          const Icon = TYPE_ICON[m.type] || ImageIcon;
          return (
            <li key={`${m.cls.id}-${m.id}`} className="pg-media-item">
              <MediaEmbed url={m.url} title={m.title} />
              <div className="pg-media-meta">
                <Icon size={15} aria-hidden="true" />
                <strong>{m.title}</strong>
                {isCoach && multi && <span className="pg-media-class"><School size={12} aria-hidden="true" />{m.cls.name}</span>}
                {isCoach && classes.some((c) => c.id === m.cls.id) && (
                  <button type="button" className="gh-btn gh-btn-ghost gh-btn-sm" aria-label={`Remove ${m.title}`}
                          onClick={() => { if (window.confirm(`Remove "${m.title}" for ${m.cls.name}?`)) remove(m); }}>
                    <Trash2 size={15} aria-hidden="true" />
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function SessionMedia({ program, sessionNumber }) {
  return <MediaGallery program={program} place={`session-${sessionNumber}`} compact />;
}

/** The coach's tools: add media, and set this program's cover for a class. */
export function MediaManager({ program }) {
  const { isCoach, classes, uid, reload } = useContext(MediaContext);
  const places = mediaPlaces(program);
  const [classId, setClassId] = useState('');
  const [d, setD] = useState({ title: '', url: '', place: OVERVIEW });
  const [cover, setCover] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  if (!isCoach) return null;

  if (!classes.length) {
    return (
      <section className="gh-card pg-manager">
        <h3 className="pb-h3"><ImagePlus size={17} aria-hidden="true" />Add videos, images and posters</h3>
        <p className="pb-sub">Choose this program for one of your classes in <strong>My classes</strong> (Programs tab). Then you can add media your learners will see here.</p>
      </section>
    );
  }
  const cls = classes.find((c) => c.id === classId) || classes[0];

  async function add(e) {
    e.preventDefault();
    setMsg(null);
    const res = newMediaItem({ program, place: d.place, title: d.title, url: d.url, uid });
    if (res.error) { setMsg({ type: 'error', text: res.error }); return; }
    const next = addMedia(cls.programMedia, res.item);
    if (next.error) { setMsg({ type: 'error', text: next.error }); return; }
    setBusy(true);
    try {
      await saveClassMedia(cls, next.list);
      await reload();
      setD({ title: '', url: '', place: d.place });
      setMsg({ type: 'success', text: `Added for ${cls.name}.` });
    } catch (err) {
      setMsg({ type: 'error', text: explainError(err) });
    } finally {
      setBusy(false);
    }
  }

  async function saveCover(e, clear = false) {
    e.preventDefault();
    setMsg(null);
    const url = clear ? null : cover.trim();
    const err = url ? coverError(url) : null;
    if (err) { setMsg({ type: 'error', text: err }); return; }
    setBusy(true);
    try {
      await saveClassCover(cls, program.id, url);
      await reload();
      setCover('');
      setMsg({ type: 'success', text: url ? `Cover set for ${cls.name}.` : `${cls.name} uses the school cover again.` });
    } catch (er) {
      setMsg({ type: 'error', text: explainError(er) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="gh-card pg-manager" aria-labelledby="pg-manager-title">
      <h3 className="pb-h3" id="pg-manager-title"><ImagePlus size={17} aria-hidden="true" />Add videos, images and posters</h3>
      <p className="pb-sub">Learners in {classes.length > 1 ? 'the chosen class' : cls.name} see them on this page. Paste a Canva design share link (Share → Anyone with the link → Can view), a YouTube video, or a Cloudinary image or video link.</p>
      {msg && <Alert type={msg.type}>{msg.text}</Alert>}

      {classes.length > 1 && (
        <div className="pb-field">
          <label className="gh-label" htmlFor="pgm-class">Class</label>
          <select id="pgm-class" className="gh-select" value={cls.id} onChange={(e) => setClassId(e.target.value)}>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      )}

      <form className="pg-manager-form" onSubmit={add}>
        <div className="pg-manager-row">
          <div className="pb-field">
            <label className="gh-label" htmlFor="pgm-title">Title</label>
            <input id="pgm-title" className="gh-input" maxLength={TITLE_MAX} placeholder="Welcome video" value={d.title}
                   onChange={(e) => setD({ ...d, title: e.target.value })} />
          </div>
          <div className="pb-field">
            <label className="gh-label" htmlFor="pgm-place">Show it on</label>
            <select id="pgm-place" className="gh-select" value={d.place} onChange={(e) => setD({ ...d, place: e.target.value })}>
              {places.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </div>
        </div>
        <div className="pb-field">
          <label className="gh-label" htmlFor="pgm-url">Link</label>
          <input id="pgm-url" className="gh-input" type="url" inputMode="url" placeholder="https://www.canva.com/design/…/view"
                 value={d.url} onChange={(e) => setD({ ...d, url: e.target.value })} />
          <MediaEmbed url={d.url} title={d.title} preview />
        </div>
        <button type="submit" className="gh-btn gh-btn-primary" disabled={busy}><ImagePlus size={16} aria-hidden="true" />Add media</button>
      </form>

      <form className="pg-cover-form" onSubmit={(e) => saveCover(e)}>
        <h4 className="pg-h4">Cover poster for {cls.name}</h4>
        <p className="pb-sub">Design it in Canva, download as PNG, upload to Cloudinary and paste the image link. Leave it empty to use the school’s cover.</p>
        <div className="pg-manager-row">
          <input className="gh-input" type="url" inputMode="url" aria-label="Cover image link" placeholder="https://res.cloudinary.com/…/image/upload/…"
                 value={cover} onChange={(e) => setCover(e.target.value)} />
          <button type="submit" className="gh-btn" disabled={busy || !cover.trim()}>Set cover</button>
          {cls.programCovers?.[program.id] && (
            <button type="button" className="gh-btn gh-btn-ghost" disabled={busy} onClick={(e) => saveCover(e, true)}>Use school cover</button>
          )}
        </div>
      </form>
    </section>
  );
}
