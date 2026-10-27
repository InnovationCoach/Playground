import React from 'react';
import { ArrowRight, Bookmark, BookmarkCheck, ExternalLink, Globe, Plus, Check } from 'lucide-react';
import { useLocale } from '../../app/i18n/LocaleProvider.jsx';
import { ActivityIcon } from '../shell/activityIcons.jsx';
import { ProgramIcon } from '../pbl/programs/ProgramIcon.jsx';
import { hrefFor } from '../../app/routes.js';

/**
 * One catalogue entry (catalog.js). The card itself opens the course; the add
 * control sits beside it rather than inside, so neither control is nested in
 * the other. Partner cards open in a new tab and say which site they go to.
 *
 * variant "icon" (My Courses): a bookmark in the corner.
 * variant "button" (Home search): a labelled "Add to My Courses" button below.
 */
export function CatalogCard({ item, onOpenActivity, addedKeys, onToggleAdd, variant = 'icon' }) {
  const { t } = useLocale();
  const isAdded = addedKeys.includes(item.key);
  const label = t(isAdded ? 'courses.unsave' : 'courses.save');
  const body = (
    <>
      {item.source === 'activity' && <ActivityIcon id={item.id} />}
      {item.source === 'program' && <span className="gh-course-art mc-tone-icon" data-tone={item.tone}><ProgramIcon name={item.icon} size={22} /></span>}
      {item.source === 'partner' && <span className="gh-course-art mc-art-partner"><Globe size={22} aria-hidden="true" /></span>}
      <span className={`mc-src mc-src-${item.source}`}>{t(`courses.badge.${item.source}`)}</span>
      {item.kicker && <span className="gh-course-kicker">{item.kicker}</span>}
      <span className="gh-course-title">{item.title}</span>
      <span className="gh-course-desc">{item.description}</span>
      {item.facts.length > 0 && <span className="mc-facts">{item.facts.map((f) => <span key={f}>{f}</span>)}</span>}
      <span className="gh-course-cta">
        {item.source === 'partner'
          ? <>{t('courses.opensOn', { host: item.host })}<ExternalLink size={14} aria-hidden="true" /></>
          : <>{t('courses.open')}<ArrowRight size={15} aria-hidden="true" /></>}
      </span>
    </>
  );
  return (
    <li className={variant === 'button' ? 'mc-card mc-card-btn' : 'mc-card'}>
      {item.source === 'activity' && (
        <button type="button" className="gh-course" onClick={() => onOpenActivity(item.id)}>{body}</button>
      )}
      {item.source === 'program' && <a className="gh-course" href={hrefFor.program(item.id)}>{body}</a>}
      {item.source === 'partner' && (
        <a className="gh-course" href={item.url} target="_blank" rel="noopener noreferrer">
          {body}<span style={srOnly}>{t('courses.newTab')}</span>
        </a>
      )}
      {variant === 'button' ? (
        <div className="mc-card-actions">
          <button type="button" className={isAdded ? 'gh-btn mc-add is-added' : 'gh-btn gh-btn-accent mc-add'}
                  aria-pressed={isAdded} onClick={() => onToggleAdd(item.key)} aria-label={`${label}: ${item.title}`}>
            {isAdded ? <Check size={16} aria-hidden="true" /> : <Plus size={16} aria-hidden="true" />}
            {isAdded ? t('courses.added') : t('courses.add')}
          </button>
          {item.source === 'program' && (
            <a
              className="gh-btn gh-btn-primary mc-start-link"
              href={hrefFor.program(item.id)}
              onClick={() => {
                if (!isAdded) onToggleAdd(item.key);
              }}
            >
              <span>Start Course</span>
              <ArrowRight size={15} aria-hidden="true" />
            </a>
          )}
        </div>
      ) : (
        <button type="button" className="mc-save" aria-pressed={isAdded} onClick={() => onToggleAdd(item.key)}
                aria-label={`${label}: ${item.title}`} title={label}>
          {isAdded ? <BookmarkCheck size={17} aria-hidden="true" /> : <Bookmark size={17} aria-hidden="true" />}
        </button>
      )}
    </li>
  );
}

export const srOnly = { position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' };
