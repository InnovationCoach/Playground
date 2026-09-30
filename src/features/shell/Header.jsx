import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Settings, LogOut } from 'lucide-react';
import { useLocale } from '../../app/i18n/LocaleProvider.jsx';
import { hrefFor } from '../../app/routes.js';
import { LOGO_URL } from '../../app/brand.js';
import { Avatar } from './Avatar.jsx';

/**
 * Top bar for every signed-in screen: logo on the left, the account menu on
 * the right (name, role, Settings, Sign out). Signed out, it shows the logo only.
 */
export function Header({ email, displayName, role, uid, onSignOut, onHome }) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  const wrapRef = useRef(null);
  const name = displayName || email?.split('@')[0] || '';

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (!wrapRef.current?.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  return (
    <header className="gh-topbar">
      <button type="button" className="gh-brand" onClick={onHome} aria-label={`WeLearn ${t('nav.home')}`}>
        {!logoFailed && <img src={LOGO_URL} alt="WeLearn" onError={() => setLogoFailed(true)} />}
        {!logoFailed && <span className="gh-brand-divider" aria-hidden="true" />}
        <span className="gh-brand-name">{logoFailed ? 'WeLearn Growth Hub' : 'Growth Hub'}</span>
      </button>

      {email && (
        <div className="gh-topbar-right" ref={wrapRef}>
          <button type="button" className="gh-user-btn" aria-haspopup="menu" aria-expanded={open}
                  onClick={() => setOpen((o) => !o)}>
            <Avatar name={name} seed={uid || email} size={30} />
            <span className="gh-user-name">{name}</span>
            <ChevronDown size={16} aria-hidden="true" />
          </button>
          {open && (
            <div className="gh-menu" role="menu">
              <div className="gh-menu-head">
                <Avatar name={name} seed={uid || email} size={36} />
                <div style={{ minWidth: 0 }}>
                  <strong>{name}</strong>
                  <span>{email}</span>
                  {role && <span>{t(`role.${role}`)}</span>}
                </div>
              </div>
              <a role="menuitem" className="gh-menu-item" href={hrefFor.settings()} onClick={() => setOpen(false)}>
                <Settings size={17} aria-hidden="true" />{t('common.settings')}
              </a>
              <button type="button" role="menuitem" className="gh-menu-item gh-danger" onClick={() => { setOpen(false); onSignOut(); }}>
                <LogOut size={17} aria-hidden="true" />{t('common.signOut')}
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
