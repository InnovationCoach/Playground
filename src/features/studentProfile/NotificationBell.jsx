import { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { listNotifications, markNotificationRead, markAllRead } from './studentProfileService.js';
import './studentProfile.css';

/**
 * Bell with an unread count and a short list. Notifications contain no grades or
 * feedback text: a title, an optional short line, and a link.
 */
export function NotificationBell({ uid }) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState({ items: [], unreadCount: 0 });
  const wrapRef = useRef(null);

  const refresh = () => listNotifications(uid).then(setData).catch(() => setData({ items: [], unreadCount: 0 }));

  useEffect(() => { refresh(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [uid]);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) refresh();
  };

  const readAll = async () => { await markAllRead(uid); refresh(); };
  const openItem = async (n) => {
    await markNotificationRead(uid, n.id);
    setOpen(false);
    window.location.hash = n.link.replace(/^#/, '');
    refresh();
  };

  const label = data.unreadCount ? `Notifications, ${data.unreadCount} unread` : 'Notifications';

  return (
    <div className="sp-bell" ref={wrapRef}>
      <button type="button" className="sp-bell-btn" aria-label={label} aria-expanded={open} onClick={toggle}>
        <Bell size={18} aria-hidden="true" />
        {data.unreadCount > 0 && <span className="sp-bell-count" aria-hidden="true">{data.unreadCount > 9 ? '9+' : data.unreadCount}</span>}
      </button>
      {open && (
        <div className="sp-bell-panel" role="region" aria-label="Notifications">
          <div className="sp-bell-head">
            <strong>Notifications</strong>
            {data.unreadCount > 0 && <button type="button" className="sp-link" onClick={readAll}>Mark all as read</button>}
          </div>
          {data.items.length === 0 && <p className="sp-muted">Nothing new.</p>}
          <ul className="sp-bell-list">
            {data.items.map((n) => (
              <li key={n.id}>
                <button type="button" className={`sp-bell-item${n.readAt ? '' : ' is-unread'}`} onClick={() => openItem(n)}>
                  <span>{n.title}</span>
                  {n.body && <span className="sp-muted">{n.body}</span>}
                  <span className="sp-muted">{new Date(n.createdAt).toLocaleDateString()}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
