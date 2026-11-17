import { useState } from 'react';
import {
  ExternalLink, FileDown, CheckSquare, Square, Clock, Wrench, Target,
  Info, Lightbulb, AlertTriangle, Bot, PlayCircle
} from 'lucide-react';
import {
  sanitizeRichHtml,
  parseVideoSource,
  isSafeHttpUrl,
  formatFileSize
} from '../../coach/studio/richContentModel.js';

const CALLOUT_META = {
  info: { icon: Info, label: 'Note' },
  tip: { icon: Lightbulb, label: 'Tip' },
  warning: { icon: AlertTriangle, label: 'Safety & Check' },
  coach: { icon: Bot, label: 'Coach Guidance' }
};

export function RichContentRenderer({
  blocks = [],
  checkedMap = {},
  onToggleCheck = null,
  readOnly = false
}) {
  const [localChecked, setLocalChecked] = useState({});
  const list = Array.isArray(blocks) ? blocks : [];
  if (list.length === 0) return null;

  const isChecked = (itemKey) => {
    if (onToggleCheck) return Boolean(checkedMap?.[itemKey]);
    return Boolean(localChecked[itemKey]);
  };

  const handleToggle = (itemKey) => {
    if (readOnly) return;
    if (onToggleCheck) {
      onToggleCheck(itemKey);
    } else {
      setLocalChecked((prev) => ({ ...prev, [itemKey]: !prev[itemKey] }));
    }
  };

  return (
    <div className="rc-blocks">
      {list.map((block, idx) => {
        if (!block || !block.type) return null;
        const key = block.id || `blk-${idx}`;

        switch (block.type) {
          case 'heading': {
            const level = [1, 2, 3].includes(Number(block.level)) ? Number(block.level) : 2;
            const Tag = level === 1 ? 'h2' : level === 2 ? 'h3' : 'h4';
            if (!block.text?.trim()) return null;
            return <Tag key={key} className={`rc-heading rc-heading-${level}`}>{block.text}</Tag>;
          }

          case 'richtext': {
            const safe = sanitizeRichHtml(block.html || '');
            if (!safe.trim()) return null;
            return (
              <div
                key={key}
                className="rc-richtext"
                dangerouslySetInnerHTML={{ __html: safe }}
              />
            );
          }

          case 'image': {
            if (!isSafeHttpUrl(block.url)) return null;
            return (
              <figure key={key} className="rc-figure">
                <img
                  src={block.url}
                  alt={block.alt || block.caption || 'Program visual'}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
                {block.caption && <figcaption>{block.caption}</figcaption>}
              </figure>
            );
          }

          case 'gallery': {
            const items = (Array.isArray(block.items) ? block.items : []).filter((it) => isSafeHttpUrl(it?.url));
            if (items.length === 0) return null;
            return (
              <section key={key} className="rc-gallery-wrap" aria-label={block.title || 'Image gallery'}>
                {block.title && <h4 className="rc-block-subtitle">{block.title}</h4>}
                <div className="rc-gallery-grid">
                  {items.map((it, i) => (
                    <figure key={it.id || i} className="rc-gallery-item">
                      <img
                        src={it.url}
                        alt={it.alt || it.caption || `Gallery image ${i + 1}`}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                      {it.caption && <figcaption>{it.caption}</figcaption>}
                    </figure>
                  ))}
                </div>
              </section>
            );
          }

          case 'video': {
            const parsed = parseVideoSource(block.url);
            if (!parsed) return null;
            return (
              <figure key={key} className="rc-video-wrap">
                {block.title && (
                  <div className="rc-video-head">
                    <PlayCircle size={16} aria-hidden="true" />
                    <strong>{block.title}</strong>
                    <span className="rc-provider-pill">{parsed.provider}</span>
                  </div>
                )}
                {parsed.kind === 'iframe' ? (
                  <div className="rc-video-frame">
                    <iframe
                      src={parsed.embedUrl}
                      title={block.title || 'Embedded video'}
                      loading="lazy"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                      allowFullScreen
                      referrerPolicy="strict-origin-when-cross-origin"
                    />
                  </div>
                ) : (
                  <video
                    src={parsed.embedUrl}
                    controls
                    preload="metadata"
                    className="rc-video-player"
                    aria-label={block.title || 'Program video'}
                  />
                )}
                {block.caption && <figcaption>{block.caption}</figcaption>}
              </figure>
            );
          }

          case 'link': {
            if (!isSafeHttpUrl(block.url)) return null;
            return (
              <a
                key={key}
                href={block.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rc-link-card"
              >
                <span className="rc-link-icon"><ExternalLink size={18} aria-hidden="true" /></span>
                <span className="rc-link-body">
                  <strong>{block.title || block.url}</strong>
                  {block.description && <small>{block.description}</small>}
                  <span className="rc-link-url">{block.url}</span>
                </span>
              </a>
            );
          }

          case 'attachment': {
            if (!isSafeHttpUrl(block.url)) return null;
            const sizeLabel = formatFileSize(block.fileSize);
            return (
              <div key={key} className="rc-attachment-card">
                <div className="rc-attachment-info">
                  <FileDown size={20} aria-hidden="true" />
                  <div>
                    <strong>{block.fileName || 'Downloadable Resource'}</strong>
                    {(block.description || sizeLabel) && (
                      <small>
                        {[block.description, sizeLabel].filter(Boolean).join(' · ')}
                      </small>
                    )}
                  </div>
                </div>
                <a
                  href={block.url}
                  download={block.fileName || 'resource'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="gh-btn gh-btn-sm gh-btn-secondary"
                >
                  <FileDown size={14} aria-hidden="true" /> Download
                </a>
              </div>
            );
          }

          case 'list': {
            const items = (Array.isArray(block.items) ? block.items : []).filter((x) => String(x || '').trim());
            if (items.length === 0) return null;
            const Tag = block.style === 'numbered' ? 'ol' : 'ul';
            return (
              <Tag key={key} className={`rc-list rc-list-${block.style === 'numbered' ? 'numbered' : 'bullet'}`}>
                {items.map((item, i) => <li key={i}>{item}</li>)}
              </Tag>
            );
          }

          case 'checklist': {
            const items = (Array.isArray(block.items) ? block.items : []).filter((it) => it?.label?.trim());
            if (items.length === 0) return null;
            const doneCount = items.filter((it) => isChecked(`${key}:${it.id}`)).length;
            return (
              <section key={key} className="rc-checklist-card" aria-label={block.title || 'Interactive checklist'}>
                <div className="rc-checklist-head">
                  <h4>{block.title || 'Phase Checklist'}</h4>
                  <span className="rc-checklist-count">{doneCount}/{items.length} done</span>
                </div>
                <ul className="rc-checklist-items">
                  {items.map((it) => {
                    const itemKey = `${key}:${it.id}`;
                    const checked = isChecked(itemKey);
                    return (
                      <li key={it.id} className={checked ? 'is-checked' : ''}>
                        <button
                          type="button"
                          className="rc-check-btn"
                          aria-pressed={checked}
                          onClick={() => handleToggle(itemKey)}
                        >
                          {checked
                            ? <CheckSquare size={18} aria-hidden="true" />
                            : <Square size={18} aria-hidden="true" />}
                          <span>{it.label}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          }

          case 'table': {
            const headers = Array.isArray(block.headers) ? block.headers : [];
            const rows = Array.isArray(block.rows) ? block.rows : [];
            if (headers.length === 0 && rows.length === 0) return null;
            return (
              <div key={key} className="rc-table-scroll">
                <table className="rc-table">
                  {headers.length > 0 && (
                    <thead>
                      <tr>
                        {headers.map((h, i) => <th key={i}>{h}</th>)}
                      </tr>
                    </thead>
                  )}
                  <tbody>
                    {rows.map((row, rIdx) => (
                      <tr key={rIdx}>
                        {(Array.isArray(row) ? row : []).map((cell, cIdx) => (
                          <td key={cIdx}>{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          }

          case 'activity': {
            return (
              <section key={key} className="rc-activity-card">
                <div className="rc-activity-head">
                  <span className="rc-activity-kicker"><Wrench size={14} aria-hidden="true" /> Learning Activity</span>
                  {Number(block.durationMin) > 0 && (
                    <span className="rc-activity-time"><Clock size={13} aria-hidden="true" /> {block.durationMin} min</span>
                  )}
                </div>
                {block.title && <h4 className="rc-activity-title">{block.title}</h4>}
                {block.instructions && <p className="rc-activity-body">{block.instructions}</p>}
                {Array.isArray(block.materials) && block.materials.filter(Boolean).length > 0 && (
                  <div className="rc-activity-materials">
                    <strong>Materials:</strong>
                    <div className="rc-chip-row">
                      {block.materials.filter(Boolean).map((m, i) => (
                        <span key={i} className="rc-chip">{m}</span>
                      ))}
                    </div>
                  </div>
                )}
                {block.deliverable && (
                  <div className="rc-activity-deliverable">
                    <Target size={14} aria-hidden="true" />
                    <span><strong>Deliverable:</strong> {block.deliverable}</span>
                  </div>
                )}
              </section>
            );
          }

          case 'callout': {
            const tone = CALLOUT_META[block.tone] ? block.tone : 'info';
            const meta = CALLOUT_META[tone];
            const Icon = meta.icon;
            return (
              <aside key={key} className={`rc-callout rc-callout-${tone}`}>
                <div className="rc-callout-head">
                  <Icon size={16} aria-hidden="true" />
                  <strong>{block.title || meta.label}</strong>
                </div>
                {block.text && <p>{block.text}</p>}
              </aside>
            );
          }

          case 'divider':
            return <hr key={key} className="rc-divider" />;

          default:
            return null;
        }
      })}
    </div>
  );
}
