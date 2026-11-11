import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Compass, Lightbulb, MessageSquare, Pencil, Plus, Users, Lock, X } from 'lucide-react';
import { hrefFor } from '../../app/routes.js';
import { MediaImage, MediaVideo, mediaKind } from '../media/MediaViewer.jsx';
import { usePersonalization } from '../personalization/usePersonalization.js';
import { KINDS, safeProjectLink } from '../personalization/personalizationModel.js';
import { audienceLabel, reflectionItem, sectionHref } from './lowerSecondaryModel.js';
import { ArrowLink, Badge, Failure, Loading, PageTitle } from './common.jsx';
import { ReflectArt, WorkArt } from './illustrations.jsx';

function Modal({ title, onClose, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    ref.current.showModal();
    return () => previous?.focus?.();
  }, []);
  return <dialog ref={ref} className="ls-dialog" aria-labelledby="ls-dialog-title" onCancel={(e) => { e.preventDefault(); onClose(); }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
    <div className="ls-dialog-body"><div className="ls-card-head"><h2 id="ls-dialog-title">{title}</h2><button type="button" className="ls-icon-button" aria-label="Close" onClick={onClose}><X size={20} aria-hidden="true" /></button></div>{children}</div>
  </dialog>;
}

function Thumb({ item }) {
  const [broken, setBroken] = useState(false);
  if (item.kind === 'image' && item.media?.url && !broken) return <img className="ls-work-img" src={item.media.url} alt="" onError={() => setBroken(true)} />;
  return <WorkArt kind={item.kind} />;
}

function WorkCard({ item, onView }) {
  const shared = item.audiences?.length > 0;
  return <li className="ls-card ls-work"><Thumb item={item} />
    <div className="ls-work-copy"><h3>{item.title}</h3>
      <p className="ls-work-tags"><span className="ls-chip ls-chip-lilac">{KINDS[item.kind] || item.kind}</span><span className={`ls-chip ${shared ? 'ls-chip-mint' : 'ls-chip-quiet'}`}>{shared ? <Users size={14} aria-hidden="true" /> : <Lock size={14} aria-hidden="true" />}{audienceLabel(item.audiences)}</span></p>
      <button type="button" className="ls-secondary" onClick={() => onView(item)}>View work<span className="ls-sr"> {item.title}</span><ArrowRight size={18} aria-hidden="true" /></button>
    </div>
  </li>;
}

function WorkDetail({ item }) {
  let link = ''; try { link = safeProjectLink(item.link); } catch { /* unsafe drafts are never linked */ }
  return <>
    <p className="ls-work-tags"><span className="ls-chip ls-chip-lilac">{KINDS[item.kind] || item.kind}</span><span className="ls-chip ls-chip-quiet">{audienceLabel(item.audiences)}</span></p>
    {item.media?.url && <div className="ls-work-media">{item.kind === 'image' ? <MediaImage src={item.media.url} alt={item.title} /> : item.kind === 'recording' ? (mediaKind(item.media) === 'video' ? <MediaVideo src={item.media.url} title={item.title} /> : <audio controls preload="metadata" src={item.media.url} />) : <a href={item.media.url} download={item.media.name}>Download {item.media.name}</a>}</div>}
    {item.body && (item.kind === 'code' ? <pre className="ls-code"><code>{item.body}</code></pre> : <p className="ls-work-body">{item.body}</p>)}
    {link && <p><a href={link} target="_blank" rel="noopener noreferrer">Open project link ↗</a></p>}
    <ArrowLink href={hrefFor.portfolio()}>Edit or change who can see this</ArrowLink>
  </>;
}

function ReflectionForm({ space, onDone }) {
  const [text, setText] = useState('');
  return <form onSubmit={async (e) => { e.preventDefault(); if (text.trim() && await space.saveItem(reflectionItem(text))) onDone(); }}>
    <label className="ls-field" htmlFor="ls-reflection">What are you proud of? What did you learn?</label>
    <textarea id="ls-reflection" required rows={6} maxLength={12000} value={text} onChange={(e) => setText(e.target.value)} disabled={space.busy} />
    <p className="ls-muted"><Lock size={14} aria-hidden="true" /> This starts private. Only you can see it until you choose to share it.</p>
    {space.error && <p className="ls-note ls-note-warn" role="alert">{space.error}</p>}
    <button type="submit" className="ls-primary" disabled={space.busy || !text.trim()}>{space.busy ? 'Saving…' : 'Save my reflection'}</button>
  </form>;
}

const SKILLS = [
  { tone: 'lilac', Icon: Pencil, title: 'Create', text: 'Turn ideas into real projects.', href: hrefFor.portfolio() },
  { tone: 'mint', Icon: Compass, title: 'Explore', text: 'Ask questions and try new ideas.', href: sectionHref('universe') },
  { tone: 'peach', Icon: Lightbulb, title: 'Reflect', text: 'Think about what you learned and what’s next.', href: hrefFor.journey() }
];

export function PortfolioPage({ uid, name, profile, avatar, progress, retryProgress, Avatar, primary = false }) {
  const space = usePersonalization(uid);
  const [viewing, setViewing] = useState(null), [reflecting, setReflecting] = useState(false);
  const items = space.saved?.items || [];
  const close = () => { setReflecting(false); space.setError(''); };
  return <div className="ls-page ls-portfolio">
    <div className="ls-portfolio-top">
      <PageTitle title="My Portfolio" subtitle="Look what you’ve created." />
      <section className="ls-card ls-journey" aria-labelledby="ls-journey-title">
        <Avatar url={avatar} name={profile?.displayName} size={88} />
        <div className="ls-journey-copy"><h2 id="ls-journey-title">{name ? `${name}’s learning journey` : 'My learning journey'}</h2><p>{space.saved?.portfolio?.introduction || 'A collection of my projects, ideas and reflections.'}</p></div>
        {progress.state === 'ready' && progress.earned.length > 0 && <ul className="ls-badges" aria-label="Earned badges">{progress.earned.slice(-3).reverse().map((badge) => <Badge key={badge.id} badge={badge} />)}</ul>}
        {progress.state === 'unknown' && <Failure onRetry={retryProgress}>Badges couldn’t be loaded.</Failure>}
      </section>
    </div>
    <div className="ls-section-head"><div><h2>My projects</h2><p className="ls-muted">The ideas I’ve explored, created and learned from.</p></div>
      <a className="ls-primary" href={hrefFor.portfolio()}><Plus size={20} aria-hidden="true" />Add my work</a></div>
    {space.loading && <Loading>Loading your portfolio…</Loading>}
    {!space.loading && !space.saved && <Failure onRetry={space.reload}>{space.error || 'Your portfolio couldn’t be loaded.'}</Failure>}
    {space.saved && !items.length && <section className="ls-card ls-empty-card"><WorkArt kind="image" /><div><h3>Nothing here yet</h3><p className="ls-muted">Add a photo, some code, a 3D model or a recording of something you’ve made. New work starts private.</p><ArrowLink className="ls-secondary" href={hrefFor.portfolio()}>Add your first piece of work</ArrowLink></div></section>}
    {items.length > 0 && <ul className="ls-work-grid">{items.map((item) => <WorkCard key={item.id} item={item} onView={setViewing} />)}</ul>}
    {space.status && !reflecting && <p className="ls-note" role="status">{space.status}</p>}
    <div className="ls-portfolio-row">
      <section className="ls-card ls-reflect" aria-labelledby="ls-reflect-title"><ReflectArt /><div><h2 id="ls-reflect-title">What are you proud of?</h2><p>Take a moment to reflect on your learning.</p>
        <button type="button" className="ls-primary" disabled={!space.saved} onClick={() => setReflecting(true)}><MessageSquare size={18} aria-hidden="true" />Write a reflection<ArrowRight size={18} aria-hidden="true" /></button></div></section>
      <section className="ls-card ls-skills" aria-labelledby="ls-skills-title"><h2 id="ls-skills-title">My growing skills</h2><p className="ls-muted">Ways I’m learning and getting better.</p>
        <ul>{SKILLS.filter((s) => !primary || s.title === 'Create').map(({ tone, Icon, title, text, href }) => <li key={title}><a className={`ls-skill ls-tone-${tone}`} href={href}><Icon size={24} aria-hidden="true" /><span><strong>{title}</strong><span>{text}</span></span></a></li>)}</ul>
        {!primary && <ArrowLink href={hrefFor.pbl('portfolio')}>My project evidence</ArrowLink>}</section>
    </div>
    {viewing && <Modal title={viewing.title} onClose={() => setViewing(null)}><WorkDetail item={viewing} /></Modal>}
    {reflecting && <Modal title="Write a reflection" onClose={close}><ReflectionForm space={space} onDone={close} /></Modal>}
  </div>;
}
