import { useEffect, useMemo, useRef } from 'react';
import { X } from 'lucide-react';
import { useLocale } from '../../app/i18n/LocaleProvider.jsx';
import { toolGroups } from './allTools.js';

/** Every other student feature, in plain words. Links only: the features themselves live on their own routes. */
export function AllToolsPanel({ theme, onClose }) {
  const { t } = useLocale();
  const dialog = useRef(null);
  const groups = useMemo(toolGroups, []);
  useEffect(() => { dialog.current.showModal(); }, []);
  return <dialog ref={dialog} className="sd-tools" data-theme={theme === 'inherit' ? undefined : theme} aria-labelledby="sd-tools-title"
    onCancel={(event) => { event.preventDefault(); onClose(); }}
    onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="sd-tools-content">
      <div className="sd-tools-head">
        <div><h2 id="sd-tools-title">All tools</h2><p>Everything else you can use in SPARK.</p></div>
        <button type="button" className="sd-button" aria-label="Close All tools" onClick={onClose}><X size={20} aria-hidden="true" /></button>
      </div>
      <div className="sd-tools-groups">
        {groups.map((group) => <section key={group.id} aria-labelledby={`sd-tools-${group.id}`}>
          <h3 id={`sd-tools-${group.id}`}>{group.label}</h3>
          <ul>{group.tools.map(({ key, icon: Icon, label, about, href }) => <li key={key}>
            <a className="sd-tools-link" href={href} onClick={onClose}>
              <Icon size={20} strokeWidth={1.8} aria-hidden="true" />
              <span><strong>{t(label)}</strong><small>{about}</small></span>
            </a>
          </li>)}</ul>
        </section>)}
      </div>
    </div>
  </dialog>;
}
