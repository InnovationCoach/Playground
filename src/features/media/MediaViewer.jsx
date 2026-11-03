import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './mediaViewer.css';

// Metadata on older records can be absent or application/octet-stream.
// Inspect only the supplied asset metadata/URL; never fetch unrelated files.
export function mediaKind(asset = {}) {
  const type = (asset.contentType || asset.mimeType || asset.type || '').toLowerCase();
  if (type === 'image' || type.startsWith('image/')) return 'image';
  if (type === 'video' || type.startsWith('video/')) return 'video';
  if (type && type !== 'application/octet-stream') return 'file';
  const candidates = [asset.name, asset.url];
  for (const value of candidates) {
    let name = String(value || '').split('?')[0].split('#')[0];
    try { name = decodeURIComponent(name); } catch { /* Keep malformed URLs readable. */ }
    if (/\.(png|jpe?g|webp|gif|avif)$/i.test(name)) return 'image';
    if (/\.(mp4|webm|mov|m4v|ogv)$/i.test(name)) return 'video';
  }
  return 'file';
}

export function MediaImage({ src, alt = 'Image', className = '', style, ...props }) {
  const [open, setOpen] = useState(false);
  const trigger = useRef(null);
  if (!src) return null;
  return <>
    <img {...props} ref={trigger} src={src} alt={alt} className={`mv-image-trigger ${className}`} style={style}
      role="button" tabIndex={0} aria-label={`View image: ${alt}`} aria-haspopup="dialog"
      onClick={() => setOpen(true)} onKeyDown={event => {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setOpen(true); }
      }} />
    {open && createPortal(<ImageDialog key={src} src={src} alt={alt} onClose={() => {
      setOpen(false); trigger.current?.focus();
    }} />, document.body)}
  </>;
}

function ImageDialog({ src, alt, onClose }) {
  const dialog = useRef(null);
  const titleId = useId();
  const [original, setOriginal] = useState(false);
  const [dimensions, setDimensions] = useState(null);
  const [failed, setFailed] = useState(false);
  const close = () => { dialog.current?.close(); onClose(); };
  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    return () => { if (element.open) element.close(); };
  }, []);
  return <dialog ref={dialog} className="mv-dialog" aria-labelledby={titleId}
    onCancel={event => { event.preventDefault(); close(); }}>
    <header className="mv-dialog-header">
      <h2 id={titleId}>{alt}</h2>
      <button type="button" onClick={() => setOriginal(value => !value)} disabled={failed}
        aria-pressed={original}>{original ? 'Fit to screen' : 'Original size'}</button>
      <button type="button" autoFocus onClick={close} aria-label="Close image viewer">Close</button>
    </header>
    <div className={`mv-image-stage ${original ? 'mv-original' : ''}`} tabIndex={0} aria-label="Image viewing area">
      {failed ? <p role="alert">This image could not be loaded. Close the viewer and try again.</p> :
        <img src={src} alt={alt} style={original && dimensions ? {width: dimensions.width, height: dimensions.height} : undefined}
          onLoad={event => setDimensions({width:event.currentTarget.naturalWidth, height:event.currentTarget.naturalHeight})}
          onError={() => setFailed(true)} />}
    </div>
    <footer className="mv-dialog-footer">{dimensions && `${dimensions.width} × ${dimensions.height} pixels · `}
      {original ? 'Scroll to explore the image at its original pixel size.' : 'Fit to screen. Select Original size to inspect details.'}</footer>
  </dialog>;
}

export function MediaVideo({ src, title = 'Video', poster, tracks = [], className = '', style }) {
  const video = useRef(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [speed, setSpeed] = useState(1);
  useEffect(() => { setFailed(false); setAttempt(0); setSpeed(1); }, [src]);
  useEffect(() => {
    const element = video.current;
    return () => { element?.pause(); };
  }, [src, attempt]);
  if (!src) return null;
  return <div className="mv-video">
    <video key={`${src}-${attempt}`} ref={video} src={src} poster={poster} controls playsInline preload="metadata"
      className={className} style={style} aria-label={title} onError={() => setFailed(true)} onLoadedMetadata={() => { if (video.current) video.current.playbackRate = speed; }}>
      {tracks.map(track => <track key={track.src} kind={track.kind || 'captions'} src={track.src}
        srcLang={track.srcLang} label={track.label} default={track.default} />)}
      Your browser does not support video playback.
    </video>
    <label className="mv-video-speed">Playback speed <select value={speed} onChange={event => {
      setSpeed(Number(event.target.value));
      if (video.current) video.current.playbackRate = Number(event.target.value);
    }}>{[0.5, 0.75, 1, 1.25, 1.5, 2].map(rate => <option key={rate} value={rate}>{rate}×</option>)}</select></label>
    {failed && <div className="mv-video-error" role="alert">
      <p>This video could not be played. It may be unavailable or use an unsupported format. Ask your coach for an MP4 (H.264/AAC) or WebM version.</p>
      <button type="button" onClick={() => { setFailed(false); setAttempt(value => value + 1); }}>Retry video</button>
    </div>}
  </div>;
}
