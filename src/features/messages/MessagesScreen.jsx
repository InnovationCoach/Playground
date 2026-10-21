import { useLayoutEffect, useRef, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { ConversationList } from './ConversationList.jsx';
import { ConversationView } from './ConversationView.jsx';
import { StartConversationModal } from './StartConversationModal.jsx';
import '../admin/admin.css';
import './messages.css';

/**
 * The messenger: chat list beside the open conversation on wide screens, one
 * at a time on narrow ones (the open conversation wins, with a back button).
 */
export function MessagesScreen({ conversationId, role, isPrimary, uid, displayName, onOpen, onBack }) {
  const [starting, setStarting] = useState(false);
  const isCoach = role === 'teacher' || role === 'coach';
  // Fill the screen below the header and menu, whose height changes with width.
  const root = useRef(null);
  useLayoutEffect(() => {
    const fit = () => {
      const el = root.current;
      if (el) el.style.setProperty('--ms-top', `${Math.max(0, el.getBoundingClientRect().top + window.scrollY)}px`);
    };
    fit();
    window.addEventListener('resize', fit);
    // The messenger scrolls inside itself; markup from the legacy page below
    // the app would otherwise let the whole page scroll under it.
    const html = document.documentElement;
    const prev = html.style.overflow;
    window.scrollTo(0, 0);
    html.style.overflow = 'hidden';
    return () => { window.removeEventListener('resize', fit); html.style.overflow = prev; };
  }, []);
  return (
    <div ref={root} className={`gh-app ms-app${conversationId ? ' has-thread' : ''}`}>
      <div className="ms-shell">
        <aside className="ms-side">
          <ConversationList selectedId={conversationId} onSelectConversation={onOpen}
                            onStartNew={() => setStarting(true)} userRole={role} />
        </aside>
        <main className="ms-main">
          {conversationId ? (
            <ConversationView key={conversationId} conversationId={conversationId} onBack={onBack}
                              role={role} isPrimary={isPrimary} displayName={displayName} />
          ) : (
            <div className="ms-placeholder">
              <span className="ms-placeholder-icon"><MessageCircle size={30} aria-hidden="true" /></span>
              <h2>Your messages</h2>
              <p>Pick a chat on the left. You can send messages, photos, videos, documents and voice notes.</p>
            </div>
          )}
        </main>
      </div>
      {isCoach && (
        <StartConversationModal isOpen={starting} onClose={() => setStarting(false)} coachId={uid} coachName={displayName} />
      )}
    </div>
  );
}
