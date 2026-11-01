import { ProgramIcon } from './ProgramIcon.jsx';

/**
 * A program's poster: its cover image when there is one (programMedia.coverFor),
 * otherwise a poster drawn from the program's own colours, icon and name, so
 * no program ever shows an empty box.
 */
export function ProgramPoster({ program: p, cover, size = 'card' }) {
  if (cover?.url) {
    return (
      <div className={`pg-poster pg-poster-${size} pg-poster-img`} data-tone={p.identity.tone}>
        <img src={cover.url} alt={`${p.title} poster`} loading={size === 'card' ? 'lazy' : 'eager'} referrerPolicy="no-referrer" />
      </div>
    );
  }
  return (
    <div className={`pg-poster pg-poster-${size} pg-poster-drawn`} data-tone={p.identity.tone} aria-hidden="true">
      <span className="pg-poster-art"><ProgramIcon name={p.identity.icon} size={size === 'hero' ? 150 : 110} /></span>
      <span className="pg-poster-weeks">{p.durationWeeks} weeks · PBL</span>
      <span className="pg-poster-name">{p.identity.short}</span>
    </div>
  );
}
