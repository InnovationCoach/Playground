import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Paperclip, Mic, Send, Square, Trash, X, Users, ShieldCheck, Loader } from 'lucide-react';
import { useAuth } from '../../app/AuthProvider.jsx';
import { sendChatMessage, onMessagesChanged, onConversationChanged, deleteMessage, markAsRead } from './messagesAPI.js';
import {
  ACCEPT, MAX_FILES, MAX_TEXT, MAX_VOICE_SECONDS, fileProblem, kindOf, formatBytes, formatDuration,
  groupThread, attachmentsOf, initials, canRecordVoice, conversationTitle
} from './messageModel.js';
import { useVoiceRecorder } from './useVoiceRecorder.js';
import { Attachment, VoicePlayer } from './Attachment.jsx';

export function ConversationView({ conversationId, onBack, role, isPrimary, displayName }) {
  const { user } = useAuth();
  const [conv, setConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadError, setLoadError] = useState(null);
  const scroller = useRef(null);
  const stickToBottom = useRef(true);

  useEffect(() => {
    setLoadError(null);
    setMessages([]);
    setConv(null);
    stickToBottom.current = true;
    const offConv = onConversationChanged(conversationId, setConv, (err) => setLoadError(err.message));
    const offMsgs = onMessagesChanged(conversationId, setMessages, (err) => {
      console.error('[Messages] Thread failed:', err);
      setLoadError(err.message);
    });
    return () => { offConv(); offMsgs(); };
  }, [conversationId]);

  // Opening or receiving clears this user's unread count.
  const myUnread = conv?.unread?.[user?.uid] || 0;
  useEffect(() => {
    if (user?.uid && myUnread > 0) markAsRead(conversationId, user.uid).catch(() => {});
  }, [conversationId, user?.uid, myUnread, messages.length]);

  useLayoutEffect(() => {
    const el = scroller.current;
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const days = useMemo(() => groupThread(messages), [messages]);
  const isGroup = conv?.type === 'class';
  const title = conversationTitle(conv, user?.uid);
  const memberCount = conv?.participantIds?.length || 0;
  const nameOf = (m) => m.senderName || conv?.memberNames?.[m.senderId]
    || (m.senderId === conv?.coachId ? conv?.coachName || 'Coach' : conv?.studentName || 'Student');

  return (
    <section className="ms-thread" aria-label={`Conversation: ${title}`}>
      <header className="ms-thread-head">
        {onBack && (
          <button type="button" className="ms-icon-btn ms-back" onClick={onBack} aria-label="Back to conversations">
            <ArrowLeft size={18} aria-hidden="true" />
          </button>
        )}
        <span className={isGroup ? 'ms-avatar ms-avatar-group' : 'ms-avatar'} aria-hidden="true">
          {isGroup ? <Users size={18} /> : initials(title)}
        </span>
        <div className="ms-grow">
          <h2>{conv ? title : '…'}</h2>
          <p>{isGroup ? `Class chat · ${memberCount} members` : conv ? (conv.coachId === user?.uid ? 'Student' : 'Your coach') : ''}</p>
        </div>
        <span className="ms-safe" title="Messages can be reviewed by WeLearn staff to keep everyone safe.">
          <ShieldCheck size={14} aria-hidden="true" />Monitored for safeguarding
        </span>
      </header>
      {loadError && <div className="gh-alert gh-alert-error ms-alert">Could not load this conversation: {loadError}</div>}

      <div className="ms-scroll" ref={scroller}
           onScroll={(e) => { const el = e.currentTarget; stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80; }}>
        {conv && messages.length === 0 && (
          <div className="ms-empty-thread">
            <span className="ms-avatar ms-avatar-lg" aria-hidden="true">{isGroup ? <Users size={24} /> : initials(title)}</span>
            <p>{isGroup ? `This is the start of the ${title} chat. Say hello to your class.` : `This is the start of your conversation with ${title}.`}</p>
          </div>
        )}
        {days.map((day) => (
          <div key={day.label} className="ms-day">
            <div className="ms-day-label"><span>{day.label}</span></div>
            {day.items.map((m) => (
              <Bubble key={m.id} m={m} mine={m.senderId === user?.uid} showName={isGroup && m.startsRun}
                      name={nameOf(m)} onDelete={() => deleteMessage(conversationId, m.id)} />
            ))}
          </div>
        ))}
      </div>

      {conv && (
        <Composer conv={conv} sender={{ uid: user?.uid, name: displayName || user?.email?.split('@')[0] || '' }}
                  voiceAllowed={canRecordVoice({ role, isPrimary })}
                  onSent={() => { stickToBottom.current = true; }} />
      )}
    </section>
  );
}

function Bubble({ m, mine, showName, name, onDelete }) {
  const [confirming, setConfirming] = useState(false);
  const atts = attachmentsOf(m);
  const time = new Date(m.at).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  const onlyMedia = !m.text && atts.length > 0 && atts.every((a) => a.kind === 'image' || a.kind === 'video');
  return (
    <div className={`ms-row${mine ? ' mine' : ''}${m.startsRun ? ' run-start' : ''}`}>
      {!mine && <span className="ms-avatar ms-avatar-sm" aria-hidden="true" style={{ visibility: m.startsRun ? 'visible' : 'hidden' }}>{initials(name)}</span>}
      <div className="ms-bubble-wrap">
        {showName && !mine && <span className="ms-sender">{name}</span>}
        {m.deletedBySender ? (
          <div className="ms-bubble ms-deleted">Message deleted</div>
        ) : (
          <div className={`ms-bubble${onlyMedia ? ' media-only' : ''}`}>
            {atts.length > 0 && (
              <div className={`ms-atts${atts.filter((a) => a.kind === 'image').length > 1 ? ' grid' : ''}`}>
                {atts.map((a, i) => <Attachment key={i} a={a} mine={mine} />)}
              </div>
            )}
            {m.text && <p className="ms-text">{m.text}</p>}
          </div>
        )}
        <span className="ms-meta">
          <time dateTime={new Date(m.at).toISOString()}>{time}</time>
          {mine && !m.deletedBySender && (confirming ? (
            <span className="ms-confirm">Delete for everyone?
              <button type="button" onClick={() => { setConfirming(false); onDelete(); }}>Delete</button>
              <button type="button" onClick={() => setConfirming(false)}>Keep</button>
            </span>
          ) : (
            <button type="button" className="ms-del" onClick={() => setConfirming(true)}>Delete</button>
          ))}
        </span>
      </div>
    </div>
  );
}

function Composer({ conv, sender, voiceAllowed, onSent }) {
  const [text, setText] = useState('');
  const [files, setFiles] = useState([]); // [{ file, url }]
  const [problem, setProblem] = useState(null);
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  const input = useRef(null);
  const area = useRef(null);
  const voice = useVoiceRecorder();

  useEffect(() => () => files.forEach((f) => f.url && URL.revokeObjectURL(f.url)), [files]);

  useLayoutEffect(() => {
    const el = area.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [text]);

  function addFiles(list) {
    const incoming = Array.from(list || []);
    if (!incoming.length) return;
    const problems = [];
    const ok = [];
    for (const f of incoming) {
      const p = fileProblem(f);
      if (p) problems.push(p); else ok.push({ file: f, url: kindOf(f.type) === 'image' ? URL.createObjectURL(f) : null });
    }
    setFiles((cur) => {
      const room = MAX_FILES - cur.length;
      if (ok.length > room) problems.push(`You can send up to ${MAX_FILES} files at a time.`);
      return [...cur, ...ok.slice(0, Math.max(0, room))];
    });
    setProblem(problems[0] || null);
  }

  async function send() {
    const body = text.trim();
    const clip = voice.state === 'ready' ? voice.clip : null;
    if ((!body && !files.length && !clip) || sending) return;
    setSending(true);
    setProblem(null);
    setProgress(0);
    try {
      await sendChatMessage(conv, sender, { text: body, files: files.map((f) => f.file), voice: clip }, setProgress);
      setText('');
      setFiles([]);
      if (clip) voice.reset();
      onSent?.();
      area.current?.focus();
    } catch (err) {
      console.error('[Messages] Send failed:', err);
      setProblem(/permission|unauthorized/i.test(err?.message || '')
        ? 'This could not be sent: you may no longer be a member of this chat, or the file type is not allowed.'
        : `This could not be sent. Check your connection and try again. (${err?.message || 'error'})`);
    } finally {
      setSending(false);
    }
  }

  const canSend = (text.trim() || files.length || voice.state === 'ready') && !sending;

  return (
    <div className={`ms-composer${dragging ? ' dragging' : ''}`}
         onDragOver={(e) => { if (e.dataTransfer?.types?.includes('Files')) { e.preventDefault(); setDragging(true); } }}
         onDragLeave={() => setDragging(false)}
         onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}>
      {dragging && <div className="ms-dropzone">Drop files to attach</div>}
      {problem && <div className="ms-problem" role="alert">{problem}<button type="button" onClick={() => setProblem(null)} aria-label="Dismiss"><X size={14} aria-hidden="true" /></button></div>}
      {voice.error && voice.state === 'error' && <div className="ms-problem" role="alert">{voice.error}<button type="button" onClick={voice.reset} aria-label="Dismiss"><X size={14} aria-hidden="true" /></button></div>}

      {files.length > 0 && (
        <ul className="ms-pending" aria-label="Files to send">
          {files.map((f, i) => (
            <li key={`${f.file.name}-${i}`}>
              {f.url ? <img src={f.url} alt="" /> : <span className="ms-pending-ext">{(f.file.name.split('.').pop() || '').toUpperCase().slice(0, 4)}</span>}
              <span className="ms-pending-name">{f.file.name}<small>{formatBytes(f.file.size)}</small></span>
              <button type="button" className="ms-icon-btn" aria-label={`Remove ${f.file.name}`} disabled={sending}
                      onClick={() => setFiles((cur) => cur.filter((_, j) => j !== i))}><X size={14} aria-hidden="true" /></button>
            </li>
          ))}
        </ul>
      )}

      {sending && (files.length > 0 || voice.state === 'ready') && (
        <div className="ms-progress" role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100} aria-label="Uploading">
          <i style={{ width: `${Math.max(4, progress * 100)}%` }} />
        </div>
      )}

      {voice.state === 'recording' ? (
        <div className="ms-recbar" aria-live="polite">
          <button type="button" className="ms-icon-btn" onClick={voice.cancel} aria-label="Cancel recording"><Trash size={18} aria-hidden="true" /></button>
          <span className="ms-rec-dot" aria-hidden="true" />
          <span className="ms-rec-time">{formatDuration(voice.seconds)}<small> / {formatDuration(MAX_VOICE_SECONDS)}</small></span>
          <span className="ms-grow ms-rec-hint">Recording… tap stop when you are done</span>
          <button type="button" className="ms-round ms-round-stop" onClick={voice.stop} aria-label="Stop recording"><Square size={16} aria-hidden="true" /></button>
        </div>
      ) : voice.state === 'ready' ? (
        <div className="ms-recbar">
          <button type="button" className="ms-icon-btn" onClick={voice.cancel} aria-label="Discard voice message" disabled={sending}><Trash size={18} aria-hidden="true" /></button>
          <div className="ms-grow"><VoicePlayer src={voice.clip.url} durationSec={voice.clip.durationSec} /></div>
          <button type="button" className="ms-round" onClick={send} disabled={sending} aria-label="Send voice message">
            {sending ? <Loader size={18} className="ms-spin" aria-hidden="true" /> : <Send size={18} aria-hidden="true" />}
          </button>
        </div>
      ) : (
        <form className="ms-inputbar" onSubmit={(e) => { e.preventDefault(); send(); }}>
          <button type="button" className="ms-icon-btn" onClick={() => input.current?.click()} aria-label="Attach files" disabled={sending}>
            <Paperclip size={19} aria-hidden="true" />
          </button>
          <input ref={input} type="file" multiple accept={ACCEPT} hidden onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
          <label htmlFor="ms-text" className="ms-sr">Message</label>
          <textarea id="ms-text" ref={area} rows={1} value={text} maxLength={MAX_TEXT} placeholder="Write a message…"
                    disabled={sending}
                    onChange={(e) => setText(e.target.value)}
                    onPaste={(e) => { const imgs = Array.from(e.clipboardData?.files || []); if (imgs.length) { e.preventDefault(); addFiles(imgs); } }}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(); } }} />
          {canSend || sending || !voiceAllowed || !voice.supported ? (
            <button type="submit" className="ms-round" disabled={!canSend} aria-label="Send message">
              {sending ? <Loader size={18} className="ms-spin" aria-hidden="true" /> : <Send size={18} aria-hidden="true" />}
            </button>
          ) : (
            <button type="button" className="ms-round ms-round-mic" onClick={voice.start} aria-label="Record a voice message">
              <Mic size={18} aria-hidden="true" />
            </button>
          )}
        </form>
      )}
      <p className="ms-hint">Enter to send · Shift + Enter for a new line · Photos, videos, PDF and Office files up to 20 MB</p>
    </div>
  );
}
