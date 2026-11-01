import { ExternalLink, Info } from 'lucide-react';
import { embedFor } from './engine/mediaEmbed.js';

/**
 * Shows an evidence link inside the page when it is a Canva design, a
 * Cloudinary image or video, or a YouTube video (engine/mediaEmbed.js); any
 * other link is shown as a link. `preview` is the form's live check, which
 * also explains why a Canva link can't be shown.
 */
export function MediaEmbed({ url, title, preview = false }) {
  const e = embedFor(url);
  if (!e) return null;
  if (!e.src) {
    return preview ? <p className="pb-embed-hint" role="status"><Info size={15} aria-hidden="true" />{e.hint}</p> : null;
  }
  const label = title || `${e.provider} media`;
  return (
    <figure className={`pb-embed pb-embed-${e.type}`}>
      {e.type === 'image' && <img src={e.src} alt={label} loading="lazy" referrerPolicy="no-referrer" />}
      {e.type === 'video' && <video src={e.src} controls preload="metadata" aria-label={label} />}
      {(e.type === 'canva' || e.type === 'youtube') && (
        <div className="pb-embed-frame">
          <iframe src={e.src} title={label} loading="lazy" allowFullScreen
                  allow="fullscreen; picture-in-picture" referrerPolicy="strict-origin-when-cross-origin"
                  sandbox="allow-scripts allow-same-origin allow-popups allow-presentation" />
        </div>
      )}
      <figcaption>
        <span>{preview ? `Preview · ${e.provider}` : e.provider}</span>
        <a href={url} target="_blank" rel="noopener noreferrer"><ExternalLink size={13} aria-hidden="true" />Open</a>
      </figcaption>
    </figure>
  );
}
