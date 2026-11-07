import { useEffect, useMemo, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { hrefFor } from '../../../app/routes.js';
import { notificationText, visibleNotifications } from './programLibraryModel.js';
import { markNotificationsRead, subscribeCoachNotifications, subscribeNotificationReads } from './programLibraryService.js';
import '../../studentProfile/studentProfile.css';
import './programLibrary.css';

const TOAST_MS = 6000;

/**
 * Persistent review notifications. They live in Firestore, so a coach who was
 * offline finds them unread at next sign-in; one who is online also gets a toast.
 */
export function CoachNotificationBell({ uid, orgId }) {
  const [notifications, setNotifications] = useState(null); // null until the first snapshot
  const [readIds, setReadIds] = useState(() => new Set());
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const wrapRef = useRef(null);
  const seen = useRef(null);
  const toastTimer = useRef(null);

  useEffect(() => {
    seen.current = null;
    setNotifications(null);
    const stopNotifications = subscribeCoachNotifications(orgId, setNotifications, (err) => {
      console.warn('[Programs] Notifications unavailable:', err?.message);
    });
    const stopReads = subscribeNotificationReads(uid, setReadIds, (err) => {
      console.warn('[Programs] Notification read state unavailable:', err?.message);
    });
    return () => { stopNotifications(); stopReads(); };
  }, [uid, orgId]);

  const items = useMemo(() => visibleNotifications(notifications, readIds, uid), [notifications, readIds, uid]);
  const unread = items.filter((n) => n.unread);

  // Only what arrives after the first load is news; the rest waits in the bell.
  useEffect(() => {
    if (notifications === null) return;
    const ids = new Set(notifications.map((n) => n.id));
    if (seen.current == null) { seen.current = ids; return; }
    const fresh = items.find((n) => !seen.current.has(n.id));
    seen.current = ids;
    if (!fresh) return;
    setToast(fresh);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), TOAST_MS);
  }, [notifications, items]);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const markRead = (ids) => markNotificationsRead(uid, ids).catch((err) => {
    console.warn('[Programs] Could not mark notifications read:', err?.message);
  });

  const openItem = (n) => {
    if (n.unread) markRead([n.id]);
    setOpen(false);
    setToast(null);
    window.location.hash = hrefFor.programPreview(n.programId, 'draft');
  };

  const label = unread.length ? `Notifications, ${unread.length} unread` : 'Notifications';

  return (
    <div className="sp-bell" ref={wrapRef}>
      <button type="button" className="sp-bell-btn" aria-label={label} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <Bell size={18} aria-hidden="true" />
        {unread.length > 0 && <span className="sp-bell-count" aria-hidden="true">{unread.length > 9 ? '9+' : unread.length}</span>}
      </button>
      {open && (
        <div className="sp-bell-panel" role="region" aria-label="Notifications">
          <div className="sp-bell-head">
            <strong>Notifications</strong>
            {unread.length > 0 && (
              <button type="button" className="sp-link" onClick={() => markRead(unread.map((n) => n.id))}>Mark all as read</button>
            )}
          </div>
          {items.length === 0 && <p className="sp-muted">Nothing new.</p>}
          <ul className="sp-bell-list">
            {items.map((n) => (
              <li key={n.id}>
                <button type="button" className={`sp-bell-item${n.unread ? ' is-unread' : ''}`} onClick={() => openItem(n)}>
                  <span>{notificationText(n)}</span>
                  <span className="sp-muted">{new Date(n.createdAt).toLocaleDateString()}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="pl-toast-host" aria-live="polite">
        {toast && (
          <button type="button" className="pl-toast" onClick={() => openItem(toast)}>
            <Bell size={15} aria-hidden="true" />{notificationText(toast)}
          </button>
        )}
      </div>
    </div>
  );
}
