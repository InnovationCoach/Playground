import { useEffect, useMemo, useState } from 'react';
import { Plus, Search, Users, MessageCircle } from 'lucide-react';
import { useAuth } from '../../app/AuthProvider.jsx';
import { onConversationsChanged } from './messagesAPI.js';
import { conversationTitle, initials, listTime, toMillis } from './messageModel.js';

export function ConversationList({ selectedId, onSelectConversation, onStartNew, userRole }) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [q, setQ] = useState('');
  const isCoach = userRole === 'teacher' || userRole === 'coach';

  useEffect(() => {
    if (!user) return undefined;
    setLoading(true);
    return onConversationsChanged(user.uid, (convs) => {
      setConversations(convs);
      setError(null);
      setLoading(false);
    }, (err) => {
      console.error('[Messages] Conversation list failed:', err);
      setError(err.message);
      setLoading(false);
    });
  }, [user]);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return conversations;
    return conversations.filter((c) => `${conversationTitle(c, user?.uid)} ${c.lastMessagePreview || ''}`.toLowerCase().includes(needle));
  }, [conversations, q, user?.uid]);

  return (
    <nav className="ms-list" aria-label="Conversations">
      <div className="ms-list-head">
        <h1>Messages</h1>
        {isCoach && (
          <button type="button" className="gh-btn gh-btn-sm gh-btn-accent" onClick={onStartNew}>
            <Plus size={15} aria-hidden="true" />New chat
          </button>
        )}
      </div>
      <label className="ms-search">
        <Search size={16} aria-hidden="true" />
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search chats" aria-label="Search chats" />
      </label>

      {error ? (
        <div className="gh-alert gh-alert-error ms-alert">Could not load conversations: {error}</div>
      ) : loading ? (
        <p className="ms-list-empty">Loading conversations…</p>
      ) : conversations.length === 0 ? (
        <div className="ms-list-empty">
          <MessageCircle size={28} aria-hidden="true" />
          <p>{isCoach ? 'No chats yet. Start one with a student or open your class chat.' : 'No messages yet. Your coach will start a chat with you or your class.'}</p>
          {isCoach && <button type="button" className="gh-btn gh-btn-sm gh-btn-accent" onClick={onStartNew}><Plus size={15} aria-hidden="true" />New chat</button>}
        </div>
      ) : (
        <ul className="ms-items">
          {shown.map((c) => {
            const title = conversationTitle(c, user?.uid);
            const unread = c.unread?.[user?.uid] || 0;
            const group = c.type === 'class';
            const who = !c.lastMessagePreview ? '' : c.lastSenderId === user?.uid ? 'You: ' : group && c.lastSenderName ? `${c.lastSenderName.split(' ')[0]}: ` : '';
            return (
              <li key={c.id}>
                <button type="button" className={`ms-item${c.id === selectedId ? ' active' : ''}${unread ? ' unread' : ''}`}
                        aria-current={c.id === selectedId ? 'true' : undefined} onClick={() => onSelectConversation(c.id)}>
                  <span className={group ? 'ms-avatar ms-avatar-group' : 'ms-avatar'} aria-hidden="true">{group ? <Users size={18} /> : initials(title)}</span>
                  <span className="ms-item-body">
                    <span className="ms-item-top">
                      <strong>{title}</strong>
                      <time>{c.lastMessageAt ? listTime(toMillis(c.lastMessageAt)) : ''}</time>
                    </span>
                    <span className="ms-item-bottom">
                      <span className="ms-item-preview">{c.lastMessagePreview ? `${who}${c.lastMessagePreview}` : group ? `${c.participantIds?.length || 0} members` : 'No messages yet'}</span>
                      {unread > 0 && <span className="ms-badge" aria-label={`${unread} unread`}>{unread > 99 ? '99+' : unread}</span>}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
          {shown.length === 0 && <li className="ms-list-empty">No chats match “{q.trim()}”.</li>}
        </ul>
      )}
    </nav>
  );
}
