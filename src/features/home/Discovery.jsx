import { useEffect, useRef, useState } from 'react';
import { ArrowRight, ChevronDown, ExternalLink, Info, Target, Award, Sparkles, X, Plus, Check, Globe } from 'lucide-react';
import { useLocale } from '../../app/i18n/LocaleProvider.jsx';
import { hrefFor } from '../../app/routes.js';
import { SOURCE_TABS, TYPE_FILTERS } from './discoveryModel.js';

/**
 * Additive sections for the live search page. They reuse the page's existing
 * look (gh-* tokens, mc-chip filters, gh-btn actions) and add no new theme.
 */

/** 1. Learning focus: the learner's own goal, and confirmed competencies only when a service provides them. */
export function LearningFocus({ goals, loaded, focusId, onFocus, competency }) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const focus = goals.find((g) => g.id === focusId) || null;
  return (
    <section className="ds-focus" aria-labelledby="ds-focus-title">
      <div className="ds-focus-row">
        <span className="ds-focus-icon" aria-hidden="true"><Target size={16} /></span>
        <div className="ds-focus-main">
          <span id="ds-focus-title" className="ds-label">{t('discover.focus.label')}</span>
          {!loaded ? <span className="ds-muted">{t('discover.loading')}</span>
            : goals.length === 0 ? <span className="ds-muted">{t('discover.focus.none')} <a href={hrefFor.goals()}>{t('discover.focus.setGoal')}</a></span>
            : <div className="ds-focus-goals" role="group" aria-label={t('discover.focus.choose')}>
                {goals.map((g) => (
                  <button key={g.id} type="button" className="mc-chip ds-chip" aria-pressed={focusId === g.id} onClick={() => onFocus(focusId === g.id ? null : g.id)}>{g.explore}</button>
                ))}
              </div>}
        </div>
        <button type="button" className="ds-toggle" aria-expanded={open} aria-controls="ds-focus-more" onClick={() => setOpen(!open)}>
          <Award size={15} aria-hidden="true" />
          <span>{competency.status === 'ready' ? t('discover.comp.count', { n: competency.confirmed.length }) : t('discover.comp.label')}</span>
          <ChevronDown size={15} aria-hidden="true" className={open ? 'ds-rot' : ''} />
        </button>
      </div>
      {open && (
        <div id="ds-focus-more" className="ds-focus-more">
          {competency.sample && <span className="ds-sample">{t('discover.sample')}</span>}
          {competency.status !== 'ready' ? <p className="ds-muted">{t('discover.comp.notConnected')}</p>
            : competency.confirmed.length === 0 ? <p className="ds-muted">{t('discover.comp.none')}</p>
            : <ul className="ds-comp-list">{competency.confirmed.map((c) => <li key={c.competencyId}><Check size={14} aria-hidden="true" />{c.title}</li>)}</ul>}
          {focus && <p className="ds-muted">{t('discover.focus.using', { goal: focus.explore })}</p>}
          <a className="ds-link" href={hrefFor.goals()}>{t('discover.focus.manage')} <ArrowRight size={14} aria-hidden="true" /></a>
        </div>
      )}
    </section>
  );
}

function Reason({ reason }) {
  const { t } = useLocale();
  if (reason.type === 'search') return <li>{t('discover.reason.search', { q: reason.q })}</li>;
  if (reason.type === 'continue') return <li>{t('discover.reason.continue', { next: reason.next })}</li>;
  if (reason.type === 'goal') return <li>{t('discover.reason.goal', { goal: reason.goal, word: reason.word })}</li>;
  return <li>{t(`discover.reason.${reason.type}`)}</li>;
}

/** Course outcomes, never learner achievement. */
export function WorksToward({ list, max = 2 }) {
  const { t } = useLocale();
  if (!list?.length) return null;
  return (
    <span className="ds-works" title={t('discover.worksTowardHint')}>
      <span className="ds-works-label">{t('discover.worksToward')}</span>{' '}
      {list.slice(0, max).map((c) => c.title).join(' · ')}
      {list.length > max && <span className="ds-muted"> {t('discover.more', { n: list.length - max })}</span>}
    </span>
  );
}

/** 2. Suggested for you: up to three, each with its real reasons. */
export function Suggestions({ list, query, outlineFor, onDetails, onOpenActivity }) {
  const { t } = useLocale();
  return (
    <section className="gh-page ds-suggest" aria-labelledby="ds-suggest-title" aria-live="polite">
      <h2 id="ds-suggest-title" className="hs-featured-title"><Sparkles size={17} style={{ color: 'var(--gh-purple)' }} aria-hidden="true" />
        {query ? t('discover.suggest.titleSearch', { q: query }) : t('discover.suggest.title')}</h2>
      {list.length === 0 ? <p className="ds-muted ds-empty">{t('discover.suggest.empty')}</p> : (
        <ul className="ds-suggest-list">
          {list.map(({ item, reasons }) => (
            <li key={item.key} className="ds-suggest-card">
              <span className={`mc-src mc-src-${item.source}`}>{t(`courses.badge.${item.source}`)}</span>
              <strong className="ds-suggest-title">{item.title}</strong>
              <ul className="ds-reasons" aria-label={t('discover.why')}>{reasons.map((r, i) => <Reason key={i} reason={r} />)}</ul>
              <WorksToward list={outlineFor(item)} />
              <div className="ds-suggest-actions">
                <button type="button" className="gh-btn" onClick={() => onDetails(item)}>{t('discover.details')}</button>
                {item.source === 'program' && <a className="gh-btn gh-btn-accent" href={hrefFor.program(item.id)}>{t('courses.open')} <ArrowRight size={15} aria-hidden="true" /></a>}
                {item.source === 'activity' && <button type="button" className="gh-btn gh-btn-accent" onClick={() => onOpenActivity(item.id)}>{t('courses.open')} <ArrowRight size={15} aria-hidden="true" /></button>}
                {item.source === 'partner' && <a className="gh-btn gh-btn-accent" href={item.url} target="_blank" rel="noopener noreferrer">{t('courses.opensOn', { host: item.host })} <ExternalLink size={14} aria-hidden="true" /></a>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** 3. Source tabs, type chips and an accurate count. */
export function ResultsToolbar({ tab, type, counts, types, onTab, onType, shown, query }) {
  const { t } = useLocale();
  return (
    <div className="ds-toolbar">
      <div className="mc-chips ds-tabs" role="group" aria-label={t('discover.filters')}>
        {SOURCE_TABS.map((id) => (
          <button key={id} type="button" className="mc-chip" aria-pressed={tab === id} onClick={() => onTab(id)}>
            {id === 'external' && <Globe size={14} aria-hidden="true" />}{t(`discover.tab.${id}`)} <span className="mc-chip-n">{counts[id]}</span>
          </button>
        ))}
      </div>
      {tab !== 'external' && (
        <div className="mc-chips ds-types" role="group" aria-label={t('discover.typeLabel')}>
          {TYPE_FILTERS.map((id) => (
            <button key={id} type="button" className="mc-chip ds-chip-sm" aria-pressed={type === id} onClick={() => onType(id)}>
              {t(`discover.type.${id}`)} <span className="mc-chip-n">{types[id]}</span>
            </button>
          ))}
        </div>
      )}
      <p className="hs-count" role="status">{query ? t('discover.shownFor', { n: shown, q: query }) : t('discover.shown', { n: shown })}</p>
      {tab === 'external' && <p className="ds-note"><Info size={14} aria-hidden="true" /> {t('discover.external.note')}</p>}
    </div>
  );
}

const DATE = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

/** 6. Course details in a dialog, using the page's existing card and button styles. */
export function CourseDetails({ item, outline, availability, isAdded, onToggleAdd, onOpenActivity, onClose }) {
  const { t } = useLocale();
  const ref = useRef(null);
  const [allComps, setAllComps] = useState(false);
  useEffect(() => {
    const previous = document.activeElement;
    ref.current?.showModal();
    return () => previous?.focus?.();
  }, []);
  const comps = outline || [];
  return (
    <dialog ref={ref} className="ds-dialog" aria-labelledby="ds-detail-title"
            onCancel={(e) => { e.preventDefault(); onClose(); }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="ds-dialog-body">
        <div className="ds-dialog-head">
          <span className={`mc-src mc-src-${item.source}`}>{t(`courses.badge.${item.source}`)}</span>
          <button type="button" className="hs-clear ds-close" onClick={onClose} aria-label={t('discover.detail.close')}><X size={18} aria-hidden="true" /></button>
        </div>
        {item.kicker && <span className="gh-course-kicker">{item.kicker}</span>}
        <h2 id="ds-detail-title" className="ds-detail-title">{item.title}</h2>
        {item.description && <p className="ds-detail-desc">{item.description}</p>}
        <dl className="ds-facts">
          <div><dt>{t('discover.detail.availability')}</dt><dd>{t(`discover.avail.${availability}`)}</dd></div>
          {item.facts.length > 0 && <div><dt>{t('discover.detail.effort')}</dt><dd>{item.facts.join(' · ')}</dd></div>}
          {item.source === 'partner' && <div><dt>{t('discover.detail.provider')}</dt><dd>{item.kicker} · {item.host}</dd></div>}
          {item.source !== 'partner' && <div><dt>{t('discover.detail.readiness')}</dt><dd>{t('discover.detail.readinessUnknown')}</dd></div>}
        </dl>
        {item.stages?.length > 0 && (
          <section className="ds-detail-section"><h3>{t('discover.detail.stages')}</h3>
            <ol className="ds-stages">{item.stages.map((s) => <li key={s}>{s}</li>)}</ol></section>
        )}
        {item.source === 'program' && (
          <section className="ds-detail-section"><h3>{t('discover.worksToward')}</h3>
            <p className="ds-muted">{t('discover.worksTowardHint')}</p>
            {comps.length === 0 ? <p className="ds-muted">{t('discover.detail.noComps')}</p> : <>
              <ul className="ds-comp-detail">{(allComps ? comps : comps.slice(0, 6)).map((c) => (
                <li key={c.id}><strong>{c.title}</strong> <span className="ds-muted">{c.domain} · {c.code}</span><span className="ds-statement">{c.statement}</span></li>
              ))}</ul>
              {comps.length > 6 && <button type="button" className="ds-link" aria-expanded={allComps} onClick={() => setAllComps(!allComps)}>
                {allComps ? t('discover.detail.fewer') : t('discover.detail.all', { n: comps.length })}</button>}
            </>}
          </section>
        )}
        {item.source === 'partner' && <p className="ds-note"><Info size={14} aria-hidden="true" /> {t('discover.detail.verify', { date: DATE.format(new Date('2026-10-21')) })}</p>}
        {item.source === 'program' && <p className="ds-note"><Info size={14} aria-hidden="true" /> {t('discover.detail.quest')}</p>}
        <div className="mc-card-actions ds-detail-actions">
          {item.source === 'partner' ? (
            <a className="gh-btn gh-btn-primary" href={item.url} target="_blank" rel="noopener noreferrer">{t('courses.opensOn', { host: item.host })} <ExternalLink size={14} aria-hidden="true" /></a>
          ) : <>
            <button type="button" className={isAdded ? 'gh-btn mc-add is-added' : 'gh-btn gh-btn-accent mc-add'} aria-pressed={isAdded} onClick={() => onToggleAdd(item.key)}>
              {isAdded ? <Check size={16} aria-hidden="true" /> : <Plus size={16} aria-hidden="true" />}{isAdded ? t('courses.added') : t('courses.add')}
            </button>
            {item.source === 'program'
              ? <a className="gh-btn gh-btn-primary mc-start-link" href={hrefFor.program(item.id)} onClick={() => { if (!isAdded) onToggleAdd(item.key); }}>Start Course <ArrowRight size={15} aria-hidden="true" /></a>
              : <button type="button" className="gh-btn gh-btn-primary mc-start-link" onClick={() => { onClose(); onOpenActivity(item.id); }}>{t('courses.open')} <ArrowRight size={15} aria-hidden="true" /></button>}
          </>}
        </div>
      </div>
    </dialog>
  );
}
