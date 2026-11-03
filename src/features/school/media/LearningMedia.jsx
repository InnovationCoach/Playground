import { MediaImage, MediaVideo, mediaKind } from '../../media/MediaViewer.jsx';

export function LearningMedia({attachments = []}) {
  return <div className="sw-lesson-media">{attachments.map((a, index) => {
    const kind = mediaKind(a);
    const label = kind === 'image' ? 'Poster / image' : kind === 'video' ? 'Video' : a.contentType === 'application/pdf' ? 'PDF / slides' : 'Presentation slides';
    return <figure key={a.path || a.url || index}>
      {a.url && (kind === 'video' ? <MediaVideo src={a.url} title={a.name || 'Lesson video'} poster={a.posterUrl} tracks={a.tracks}/>
        : kind === 'image' ? <MediaImage loading="lazy" src={a.url} alt={a.name || 'Learning resource'}/>
        : <a className="sw-resource-file" href={a.url} target="_blank" rel="noopener noreferrer"><span aria-hidden="true">▤</span><strong>{a.name}</strong><small>{a.contentType === 'application/pdf' ? 'Open PDF / slides' : 'Download presentation'} ↗</small></a>)}
      <figcaption><span className="sw-resource-label">{label}</span> {a.name}{!a.url && <small> · Saved resource</small>}</figcaption>
    </figure>;
  })}</div>;
}
