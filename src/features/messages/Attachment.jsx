import { useEffect, useRef, useState } from 'react';
import { Play, Pause, FileText, FileSpreadsheet, Presentation, File, Download } from 'lucide-react';
import { formatBytes, formatDuration } from './messageModel.js';

/** One attachment inside a message bubble. */
export function Attachment({ a, mine }) {
  if (a.kind === 'image') {
    return (
      <a className="ms-photo" href={a.url} target="_blank" rel="noopener noreferrer" aria-label={`Open photo${a.name ? `: ${a.name}` : ''} in a new tab`}>
        <img src={a.url} alt={a.name ? `Photo: ${a.name}` : 'Photo'} loading="lazy" />
      </a>
    );
  }
  if (a.kind === 'video') return <video className="ms-video" src={a.url} controls preload="metadata" />;
  if (a.kind === 'audio') return <VoicePlayer src={a.url} durationSec={a.durationSec} mine={mine} />;
  return <FileCard a={a} />;
}

function iconFor(a) {
  const n = `${a.mimeType} ${a.name}`.toLowerCase();
  if (/sheet|excel|\.xls|csv/.test(n)) return FileSpreadsheet;
  if (/presentation|powerpoint|\.ppt/.test(n)) return Presentation;
  if (/pdf|word|\.doc|text/.test(n)) return FileText;
  return File;
}

function FileCard({ a }) {
  const Icon = iconFor(a);
  const ext = (a.name.split('.').pop() || '').toUpperCase().slice(0, 4);
  return (
    <a className="ms-file" href={a.url} target="_blank" rel="noopener noreferrer" download={a.name || undefined}>
      <span className="ms-file-icon"><Icon size={20} aria-hidden="true" /></span>
      <span className="ms-file-body">
        <span className="ms-file-name">{a.name || 'File'}</span>
        <span className="ms-file-meta">{[ext, formatBytes(a.sizeBytes)].filter(Boolean).join(' · ')}</span>
      </span>
      <Download size={16} aria-hidden="true" className="ms-file-dl" />
    </a>
  );
}

/** A compact voice-note player: play/pause, progress, time. */
export function VoicePlayer({ src, durationSec, mine }) {
  const audio = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [pos, setPos] = useState(0);
  const [dur, setDur] = useState(durationSec || 0);

  useEffect(() => {
    const el = audio.current;
    if (!el) return undefined;
    const onTime = () => setPos(el.currentTime);
    const onMeta = () => { if (Number.isFinite(el.duration) && el.duration > 0) setDur(el.duration); };
    const onEnd = () => { setPlaying(false); setPos(0); };
    el.addEventListener('timeupdate', onTime);
    el.addEventListener('loadedmetadata', onMeta);
    el.addEventListener('ended', onEnd);
    el.addEventListener('pause', () => setPlaying(false));
    el.addEventListener('play', () => setPlaying(true));
    return () => {
      el.removeEventListener('timeupdate', onTime);
      el.removeEventListener('loadedmetadata', onMeta);
      el.removeEventListener('ended', onEnd);
    };
  }, [src]);

  const toggle = () => {
    const el = audio.current;
    if (!el) return;
    if (el.paused) el.play().catch(() => setPlaying(false)); else el.pause();
  };
  const seek = (e) => {
    const el = audio.current;
    if (!el || !dur) return;
    const r = e.currentTarget.getBoundingClientRect();
    el.currentTime = Math.min(dur, Math.max(0, ((e.clientX - r.left) / r.width) * dur));
  };
  const pct = dur ? Math.min(100, (pos / dur) * 100) : 0;

  return (
    <div className={mine ? 'ms-voice mine' : 'ms-voice'}>
      <button type="button" className="ms-voice-btn" onClick={toggle} aria-label={playing ? 'Pause voice message' : 'Play voice message'}>
        {playing ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
      </button>
      <span className="ms-voice-track" onClick={seek} role="presentation"><i style={{ width: `${pct}%` }} /></span>
      <span className="ms-voice-time">{formatDuration(playing || pos ? pos : dur)}</span>
      <audio ref={audio} src={src} preload="metadata" />
    </div>
  );
}
