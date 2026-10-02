import { useState, useEffect } from 'react';
import { useAuth } from '../../app/AuthProvider.jsx';
import { onConversationsChanged, otherParticipantName } from './messagesAPI.js';
import { MessageCircle, Plus } from 'lucide-react';
import '../admin/admin.css';

export function ConversationList({ onSelectConversation, onStartNew, userRole }) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const unsubscribe = onConversationsChanged(user.uid, (convs) => {
      setConversations(convs);
      setError(null);
      setLoading(false);
    }, (err) => {
      console.error('[Messages] Conversation list failed:', err);
      setError(err.message);
      setLoading(false);
    });
    return unsubscribe;
  }, [user]);

  if (error) {
    return <div className="gh-alert gh-alert-error" style={{ margin: '1rem' }}>Could not load conversations: {error}</div>;
  }

  if (loading) {
    return (
      <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--gh-text-2)' }}>
        Loading conversations…
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--gh-bg)' }}>
      <div style={{ padding: '1rem', borderBottom: '1px solid var(--gh-border)', background: 'var(--gh-surface)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Messages</h2>
          {(userRole === 'teacher' || userRole === 'coach') && (
            <button
              onClick={onStartNew}
              style={{
                background: 'var(--gh-purple)',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                padding: '0.5rem 0.75rem',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 600,
                display: 'flex',
                gap: '0.4rem',
                alignItems: 'center'
              }}
            >
              <Plus size={16} />
              New
            </button>
          )}
        </div>
      </div>

      {conversations.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gh-text-3)' }}>
          No conversations yet
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {conversations.map(conv => {
            const unreadCount = conv.unread?.[user.uid] || 0;
            const name = otherParticipantName(conv, user.uid);
            return (
              <button
                key={conv.id}
                onClick={() => onSelectConversation(conv.id, name)}
                style={{
                  width: '100%',
                  padding: '1rem',
                  borderBottom: '1px solid var(--gh-border)',
                  background: 'transparent',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                  display: 'flex',
                  gap: '0.75rem'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--gh-subtle)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <MessageCircle size={20} style={{ color: 'var(--gh-purple)', flexShrink: 0, marginTop: '0.1rem' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: 'var(--gh-text)' }}>{name}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--gh-text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {conv.lastMessagePreview || 'No messages yet'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gh-text-3)', marginTop: '0.25rem' }}>
                    {conv.lastMessageAt?.toDate?.().toLocaleDateString?.() || 'Never'}
                  </div>
                </div>
                {unreadCount > 0 && (
                  <div style={{ background: 'var(--gh-red)', color: '#fff', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>
                    {unreadCount}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
