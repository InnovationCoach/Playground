/**
 * Which evidence links may show inside the portfolio, and how. Pure, so the
 * allowlist is unit-tested (tests/media-embed.test.js).
 *
 * Only three services are embedded: Canva (design share links), Cloudinary
 * (the school's media host) and YouTube (through youtube-nocookie.com). Any
 * other link stays a plain link: an embed loads the other site in the
 * browser of everyone who views the portfolio - coaches, parents, the
 * showcase audience - so it is limited to services the school already uses.
 *
 * Canva: the design must be shared "Anyone with the link can view". Its view
 * link becomes Canva's own embed address (…/view?embed). An edit link cannot
 * be embedded, and a short canva.link address cannot be resolved here, so
 * those come back with a `hint` instead of an embed.
 */

const CANVA_DESIGN = /^\/design\/([A-Za-z0-9_-]{6,40})\/([A-Za-z0-9_-]{6,40})\/(view|edit|watch)\/?$/;
const CLOUDINARY_MEDIA = /^\/[a-z0-9_-]+\/(image|video)\/upload\//i;
const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;

function parse(url) {
  try {
    const u = new URL(String(url || '').trim());
    return u.protocol === 'https:' ? u : null;
  } catch {
    return null;
  }
}

function youtubeId(u) {
  const host = u.hostname.replace(/^www\.|^m\./, '');
  let id = null;
  if (host === 'youtu.be') id = u.pathname.slice(1);
  else if (host === 'youtube.com') {
    if (u.pathname === '/watch') id = u.searchParams.get('v');
    else {
      const m = /^\/(?:shorts|embed|live)\/([^/]+)/.exec(u.pathname);
      if (m) id = m[1];
    }
  }
  return id && YOUTUBE_ID.test(id) ? id : null;
}

/**
 * @returns {{ type: 'canva'|'image'|'video'|'youtube', src: string, provider: string } | { hint: string, provider: string } | null}
 */
export function embedFor(url) {
  const u = parse(url);
  if (!u) return null;
  const host = u.hostname.toLowerCase();

  if (host === 'www.canva.com' || host === 'canva.com') {
    const m = CANVA_DESIGN.exec(u.pathname);
    if (!m) return { provider: 'Canva', hint: 'Use the design’s share link: Share → Anyone with the link → Can view, then Copy link.' };
    if (m[3] === 'edit') return { provider: 'Canva', hint: 'This is an edit link. In Canva choose Share → Anyone with the link → Can view, and paste that link instead.' };
    return { type: 'canva', provider: 'Canva', src: `https://www.canva.com/design/${m[1]}/${m[2]}/view?embed` };
  }
  if (host === 'canva.link') {
    return { provider: 'Canva', hint: 'Short canva.link addresses can’t be shown here. Open it, then copy the full canva.com/design/… view link.' };
  }

  if (host === 'res.cloudinary.com') {
    const m = CLOUDINARY_MEDIA.exec(u.pathname);
    if (m) return { type: m[1].toLowerCase() === 'video' ? 'video' : 'image', provider: 'Cloudinary', src: u.href };
    return null;
  }

  const yt = youtubeId(u);
  if (yt) return { type: 'youtube', provider: 'YouTube', src: `https://www.youtube-nocookie.com/embed/${yt}` };

  return null;
}

export const isEmbed = (e) => Boolean(e && e.src);
