import { useState, useEffect } from 'react';
import { useAuth } from '../../app/AuthProvider.jsx';
import { sendMessage, onMessagesChanged, deleteMessage, getConversation, otherParticipantName } from './messagesAPI.js';
import { ImagePlus, ArrowLeft } from 'lucide-react';
import '../admin/admin.css';

export function ConversationView({ conversationId, onBack }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [otherUserName, setOtherUserName] = useState('');
  const [loadError, setLoadError] = useState(null);
  const [text, setText] = useState('');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoadError(null);
    getConversation(conversationId)
      .then((conv) => setOtherUserName(otherParticipantName(conv, user?.uid)))
      .catch((err) => setLoadError(err.message));
    const unsubscribe = onMessagesChanged(conversationId, setMessages, (err) => {
      console.error('[Messages] Thread failed:', err);
      setLoadError(err.message);
    });
    return unsubscribe;
  }, [conversationId, user?.uid]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() && files.length === 0) return;

    setLoading(true);
    try {
      await sendMessage(conversationId, user.uid, text, files);
      setText('');
      setFiles([]);
    } catch (err) {
      alert('Failed to send: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const selected = Array.from(e.target.files || []);
    setFiles(f => [...f, ...selected]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)', background: 'var(--gh-bg)' }}>
      {/* Header */}
      <div style={{ padding: '1rem', borderBottom: '1px solid var(--gh-border)', background: 'var(--gh-surface)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {onBack && (
            <button type="button" onClick={onBack} aria-label="Back to conversations"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gh-text-2)', padding: 4, display: 'flex' }}>
              <ArrowLeft size={18} />
            </button>
          )}
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>{otherUserName || '…'}</h2>
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--gh-text-3)', marginTop: '0.25rem' }}>
          📌 Messages are monitored by WeLearn for safeguarding.
        </div>
        {loadError && <div className="gh-alert gh-alert-error" style={{ marginTop: '0.5rem' }}>Could not load this conversation: {loadError}</div>}
      </div>

      {/* Message list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {messages.map(msg => (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              justifyContent: msg.senderId === user.uid ? 'flex-end' : 'flex-start'
            }}
          >
            <div
              style={{
                maxWidth: '70%',
                padding: '0.75rem 1rem',
                borderRadius: '12px',
                background: msg.senderId === user.uid ? 'var(--gh-purple)' : 'var(--gh-subtle)',
                color: msg.senderId === user.uid ? '#fff' : 'var(--gh-text)',
                fontSize: '0.9rem',
                lineHeight: 1.5
              }}
            >
              {msg.deletedBySender ? (
                <em style={{ color: msg.senderId === user.uid ? 'rgba(255,255,255,0.7)' : 'var(--gh-text-3)' }}>[message deleted]</em>
              ) : (
                <>
                  {msg.text}
                  {msg.media?.map((m, i) => (
                    <div key={i} style={{ marginTop: '0.5rem' }}>
                      {m.type === 'image' ? (
                        <img src={m.url} alt="Attachment" style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px' }} />
                      ) : (
                        <video src={m.url} controls style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px' }} />
                      )}
                    </div>
                  ))}
                </>
              )}
              {msg.senderId === user.uid && !msg.deletedBySender && (
                <button
                  onClick={() => deleteMessage(conversationId, msg.id)}
                  style={{ marginLeft: '0.5rem', background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: '0.8rem' }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Message input */}
      <form onSubmit={handleSend} style={{ padding: '1rem', borderTop: '1px solid var(--gh-border)', background: 'var(--gh-surface)' }}>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
          {files.map((f, i) => (
            <div key={i} style={{ background: 'var(--gh-subtle)', padding: '0.4rem 0.6rem', borderRadius: '6px', fontSize: '0.8rem', display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
              {f.name}
              <button type="button" onClick={() => setFiles(ff => ff.filter((_, idx) => idx !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gh-red)' }}>✕</button>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <textarea
            className="gh-input"
            placeholder="Type a message…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            style={{ flex: 1, minHeight: 44, marginBottom: 0, resize: 'none' }}
          />
          <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0.5rem', color: 'var(--gh-text-2)' }}>
            <ImagePlus size={20} />
            <input type="file" multiple accept="image/*,video/*" onChange={handleFileSelect} style={{ display: 'none' }} />
          </label>
          <button type="submit" className="gh-btn gh-btn-primary" disabled={loading || (!text.trim() && files.length === 0)} style={{ minHeight: 44 }}>
            {loading ? '…' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  );
}
