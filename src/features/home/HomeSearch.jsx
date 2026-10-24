import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, SearchX, X, BookOpen } from 'lucide-react';
import { useLocale } from '../../app/i18n/LocaleProvider.jsx';
import { ACTIVITY_NAV } from '../activities/activityHost.js';
import { parseActivityLabel } from '../shell/activityIcons.jsx';
import { PROGRAMS } from '../pbl/programs/catalog.js';
import { LIBRARY_PROGRAMS } from '../pbl/programs/libraryProgramsData.js';
import { hrefFor } from '../../app/routes.js';
import { HOME_HERO_URL } from '../../app/brand.js';
import { buildCatalog, searchCatalog } from '../courses/catalog.js';
import { useAddedCourses } from '../courses/useAddedCourses.js';
import { CatalogCard } from '../courses/CatalogCard.jsx';
import { getCustomPrograms } from '../coach/programs/customProgramsStore.js';
import '../admin/admin.css';
import '../pbl/programs/programs.css';
import '../courses/courses.css';
import './homeSearch.css';

/**
 * Home for secondary learners: one search box, Google style. Nothing is
 * listed until the learner types; results come from the same catalogue as My
 * Courses, and "Add to My Courses" puts a course in "Courses I added" there.
 */

export function HomeSearch({ uid, displayName, onOpenActivity, initialQuery = '' }) {
  const { t } = useLocale();
  // SPARK Home's search box opens this page at #/search/<query>.
  const [q, setQ] = useState(initialQuery);
  const [customPrograms, setCustomPrograms] = useState(() => Object.values(getCustomPrograms()));

  useEffect(() => {
    const onCustomChanged = () => {
      setCustomPrograms(Object.values(getCustomPrograms()));
    };
    window.addEventListener('pbl-custom-programs-changed', onCustomChanged);
    return () => window.removeEventListener('pbl-custom-programs-changed', onCustomChanged);
  }, []);

  const catalog = useMemo(() => {
    const map = new Map();
    for (const p of PROGRAMS) map.set(p.id, p);
    for (const p of LIBRARY_PROGRAMS) map.set(p.id, p);
    for (const p of customPrograms) map.set(p.id, p);
    const allPrograms = Array.from(map.values());
    return buildCatalog({
      activities: ACTIVITY_NAV,
      programs: allPrograms,
      parseLabel: parseActivityLabel,
      includePartners: true
    });
  }, [customPrograms]);

  const query = q.trim();
  const results = useMemo(() => (query ? searchCatalog(catalog, query) : []), [catalog, query]);
  const { keys, added, toggle } = useAddedCourses(uid, catalog);
  const firstName = String(displayName || '').split(' ')[0];
  const inputRef = useRef(null);
  // Ready to type, like a search engine, without scrolling the hero image away.
  useEffect(() => { inputRef.current?.focus({ preventScroll: true }); }, []);

  return (
    <div className="gh-app hs-wrap">
      <section className={query ? 'hs-hero hs-hero-compact' : 'hs-hero'} aria-labelledby="hs-title">
        {!query && (
          <figure className="hs-art">
            <img src={HOME_HERO_URL} width="1200" height="800" fetchpriority="high"
                 alt="Illustration of a passion project: a robot with moving eyes on a desk, a plan from idea to improve, and code on a tablet. Notes read Create, Code, Build, Inspire." />
          </figure>
        )}
        <div className="hs-main">
        <h1 id="hs-title" className="hs-title">
          {firstName ? t('home.searchGreeting', { name: firstName }) : t('home.searchTitle')}
        </h1>
        <form className="hs-box" role="search" onSubmit={(e) => e.preventDefault()}>
          <label htmlFor="hs-q" className="hs-sr">{t('home.searchTitle')}</label>
          <Search size={20} aria-hidden="true" className="hs-icon" />
          <input id="hs-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off"
                 placeholder={t('courses.searchPlaceholderAll')} ref={inputRef} />
          {q && (
            <button type="button" className="hs-clear" onClick={() => setQ('')} aria-label={t('home.clear')}>
              <X size={18} aria-hidden="true" />
            </button>
          )}
        </form>
        {!query && (
          <p className="hs-hint">
            {t('home.searchHint')}{' '}
            {added.length > 0 && <a href={hrefFor.courses()}>{t('home.addedLink', { n: added.length })}</a>}
          </p>
        )}
        </div>
      </section>

      {query && (
        <section className="gh-page hs-results" aria-live="polite" aria-labelledby="hs-count">
          <p id="hs-count" className="hs-count">{t(results.length === 1 ? 'home.resultCountOne' : 'home.resultCount', { n: results.length, q: query })}</p>
          {results.length ? (
            <ul className="gh-course-grid">
              {results.map((c) => (
                <CatalogCard key={c.key} item={c} variant="button" onOpenActivity={onOpenActivity}
                             addedKeys={keys} onToggleAdd={toggle} />
              ))}
            </ul>
          ) : (
            <div className="gh-placeholder">
              <span className="gh-empty-icon"><SearchX size={20} aria-hidden="true" /></span>
              {t('courses.noMatch', { q: query })}
            </div>
          )}
          {added.length > 0 && (
            <a className="gh-btn hs-goto" href={hrefFor.courses()}>
              <BookOpen size={16} aria-hidden="true" />{t('home.addedLink', { n: added.length })}
            </a>
          )}
        </section>
      )}
    </div>
  );
}
