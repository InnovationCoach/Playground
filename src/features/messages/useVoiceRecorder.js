import { useCallback, useEffect, useRef, useState } from 'react';
import { MAX_VOICE_SECONDS, pickRecorderMime } from './messageModel.js';

/**
 * Record a voice note with MediaRecorder.
 *
 * state: 'idle' | 'recording' | 'ready' | 'error'. The microphone is released
 * as soon as recording stops (or the component unmounts), so the browser's
 * "recording" indicator never lingers. Recording stops itself at the limit.
 */
export function useVoiceRecorder() {
  const [state, setState] = useState('idle');
  const [seconds, setSeconds] = useState(0);
  const [clip, setClip] = useState(null); // { blob, url, mimeType, durationSec }
  const [error, setError] = useState(null);
  const rec = useRef(null);
  const stream = useRef(null);
  const chunks = useRef([]);
  const started = useRef(0);
  const timer = useRef(null);
  const discard = useRef(false);

  const supported = typeof window !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && typeof window.MediaRecorder !== 'undefined';

  const releaseMic = () => {
    clearInterval(timer.current);
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
  };

  const stop = useCallback(() => {
    if (rec.current && rec.current.state !== 'inactive') rec.current.stop();
  }, []);

  const start = useCallback(async () => {
    setError(null);
    if (!supported) { setError('Voice notes are not supported in this browser.'); setState('error'); return; }
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      setError(err?.name === 'NotAllowedError'
        ? 'Microphone access is blocked. Allow the microphone for this site in your browser settings, then try again.'
        : 'No microphone was found.');
      setState('error');
      return;
    }
    const mimeType = pickRecorderMime((t) => window.MediaRecorder.isTypeSupported(t));
    const r = new window.MediaRecorder(stream.current, mimeType ? { mimeType } : undefined);
    chunks.current = [];
    discard.current = false;
    r.ondataavailable = (e) => { if (e.data?.size) chunks.current.push(e.data); };
    r.onstop = () => {
      releaseMic();
      const durationSec = (Date.now() - started.current) / 1000;
      if (discard.current || !chunks.current.length || durationSec < 0.7) { setState('idle'); setSeconds(0); return; }
      const type = (r.mimeType || mimeType || 'audio/webm').split(';')[0];
      const blob = new Blob(chunks.current, { type });
      setClip({ blob, url: URL.createObjectURL(blob), mimeType: type, durationSec });
      setState('ready');
    };
    rec.current = r;
    started.current = Date.now();
    setSeconds(0);
    r.start(250);
    setState('recording');
    timer.current = setInterval(() => {
      const s = (Date.now() - started.current) / 1000;
      setSeconds(s);
      if (s >= MAX_VOICE_SECONDS) r.stop();
    }, 200);
  }, [supported]);

  const cancel = useCallback(() => {
    discard.current = true;
    if (rec.current && rec.current.state !== 'inactive') rec.current.stop();
    if (clip?.url) URL.revokeObjectURL(clip.url);
    setClip(null);
    setSeconds(0);
    setState('idle');
  }, [clip]);

  const reset = useCallback(() => {
    if (clip?.url) URL.revokeObjectURL(clip.url);
    setClip(null);
    setSeconds(0);
    setState('idle');
  }, [clip]);

  useEffect(() => () => {
    discard.current = true;
    if (rec.current && rec.current.state !== 'inactive') rec.current.stop();
    releaseMic();
  }, []);

  return { supported, state, seconds, clip, error, start, stop, cancel, reset };
}
