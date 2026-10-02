import { useState, useEffect } from 'react';
import { getAllConversationsForAudit, getAllMessagesForAudit } from './messagesAPI.js';
import '../admin/admin.css';

export function AdminAuditView() {
  const [conversations, setConversations] = useState([]);
  const [selectedConvId, setSelectedConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messageLoading, setMessageLoading] = useState(false);

  useEffect(() => {
    getAllConversationsForAudit().then((convs) => {
      setConversations(convs);
      setLoading(false);
    }).catch(err => {
      console.error('Failed to load conversations:', err);
      setLoading(false);
    });
  }, []);

  const handleSelectConversation = async (convId) => {
    setSelectedConvId(convId);
    setMessageLoading(true);
    try {
      const msgs = await getAllMessagesForAudit(convId);
      setMessages(msgs);
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setMessageLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 64px)', background: 'var(--gh-bg)' }}>
      {/* Conversation list */}
      <div style={{ width: 300, borderRight: '1px solid var(--gh-border)', background: 'var(--gh-surface)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--gh-border)', fontWeight: 700 }}>
          📋 All Conversations
        </div>
        {loading ? (
          <div style={{ padding: '1rem', color: 'var(--gh-text-3)' }}>Loading…</div>
        ) : conversations.length === 0 ? (
          <div style={{ padding: '1rem', color: 'var(--gh-text-3)' }}>No conversations</div>
        ) : (
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {conversations.map(conv => (
              <button
                key={conv.id}
                onClick={() => handleSelectConversation(conv.id)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  background: selectedConvId === conv.id ? 'var(--gh-subtle)' : 'transparent',
                  border: 'none',
                  borderBottom: '1px solid var(--gh-border)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'background 0.15s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--gh-subtle)'}
                onMouseLeave={(e) => e.currentTarget.style.background = selectedConvId === conv.id ? 'var(--gh-subtle)' : 'transparent'}
              >
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--gh-text)' }}>{conv.coachName || 'Coach'} ↔ {conv.studentName || 'Student'}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--gh-text-3)', marginTop: '0.2rem' }}>{conv.messageCount || 0} messages</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Message list */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--gh-bg)' }}>
        {selectedConvId ? (
          <>
            <div style={{ padding: '1rem', borderBottom: '1px solid var(--gh-border)', background: 'var(--gh-surface)', fontWeight: 700 }}>
              📧 Message History (Read-Only Audit View)
            </div>
            {messageLoading ? (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--gh-text-3)' }}>Loading messages…</div>
            ) : messages.length === 0 ? (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--gh-text-3)' }}>No messages</div>
            ) : (
              <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
                {messages.map(msg => (
                  <div
                    key={msg.id}
                    style={{
                      marginBottom: '1rem',
                      padding: '0.75rem 1rem',
                      background: msg.deletedBySender ? 'var(--gh-subtle)' : 'var(--gh-surface)',
                      borderRadius: '8px',
                      borderLeft: `3px solid ${msg.deletedBySender ? 'var(--gh-border)' : 'var(--gh-purple)'}`,
                      opacity: msg.deletedBySender ? 0.6 : 1
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--gh-text)' }}>
                        {msg.senderName || msg.senderId}
                        {msg.deletedBySender && <span style={{ color: 'var(--gh-text-3)', fontWeight: 400, marginLeft: '0.5rem' }}>[deleted]</span>}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--gh-text-3)' }}>
                        {msg.createdAt?.toDate?.().toLocaleString?.() || 'Unknown time'}
                      </div>
                    </div>
                    <div style={{ color: msg.deletedBySender ? 'var(--gh-text-3)' : 'var(--gh-text)', lineHeight: 1.5 }}>
                      {msg.deletedBySender ? <em>(message deleted by sender)</em> : msg.text}
                    </div>
                    {msg.media?.length > 0 && (
                      <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--gh-text-3)' }}>
                        📎 {msg.media.length} attachment{msg.media.length > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gh-text-3)' }}>
            Select a conversation to view messages
          </div>
        )}
      </div>
    </div>
  );
}
