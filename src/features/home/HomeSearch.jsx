import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, SearchX, X, BookOpen, Sparkles } from 'lucide-react';
import { useLocale } from '../../app/i18n/LocaleProvider.jsx';
import { ACTIVITY_NAV } from '../activities/activityHost.js';
import { parseActivityLabel } from '../shell/activityIcons.jsx';
import { PROGRAMS, programById } from '../pbl/programs/catalog.js';
import { LIBRARY_PROGRAMS } from '../pbl/programs/libraryProgramsData.js';
import { hrefFor } from '../../app/routes.js';
import { HOME_HERO_URL } from '../../app/brand.js';
import { buildCatalog, searchCatalog } from '../courses/catalog.js';
import { useAddedCourses } from '../courses/useAddedCourses.js';
import { CatalogCard } from '../courses/CatalogCard.jsx';
import { getCustomPrograms, saveCustomProgram } from '../coach/programs/customProgramsStore.js';
import { db, collection, query as firestoreQuery, where, getDocs } from '../../firebase.js';
import { normaliseContractProgram } from '../../services/pblService.js';
import { subscribeToPblTransfers } from '../coach/studio/pblTransferService.js';
import { useGoalPlan } from '../goals/useGoalPlan.js';
import { splitGoals } from '../dashboard/slideModel.js';
import { loadDashboardCourses } from '../dashboard/dashboardCourses.js';
import { filterResults, tabCounts, typeCounts, courseCompetencies, availability, suggestions, normaliseCompetencyContext, NOT_CONNECTED } from './discoveryModel.js';
import { LearningFocus, Suggestions, ResultsToolbar, CourseDetails } from './Discovery.jsx';
import './discovery.css';
import '../admin/admin.css';
import '../pbl/programs/programs.css';
import '../courses/courses.css';
import './homeSearch.css';

/**
 * Home for secondary learners: one search box, Google style.
 * Finds all STEAM activities, PBL programs, and coach-published courses.
 * Results come from the unified catalog; "Add to My Courses" puts a course in
 * "Courses I added" on My Courses, and "Start Course" starts the journey immediately.
 */

const QUICK_TOPICS = [
  'Autonomous Rover',
  'Robotics',
  'Environmental',
  'MakerSpace',
  'Space Missions',
  'Microcontroller',
  'Telemetry'
];

const prefKey = (uid) => `hearisland.searchDiscovery.v1:${uid || 'signed-out'}`;
function readPrefs(uid) {
  try { return JSON.parse(sessionStorage.getItem(prefKey(uid)) || '{}') || {}; } catch { return {}; }
}

export function HomeSearch({ uid, displayName, onOpenActivity, initialQuery = '', classIds = [], activeProgramId = null, competencyContext = NOT_CONNECTED }) {
  const { t } = useLocale();
  // SPARK Home's search box opens this page at #/search/<query>.
  const [q, setQ] = useState(initialQuery);
  const [customPrograms, setCustomPrograms] = useState(() => Object.values(getCustomPrograms()));
  const [remotePrograms, setRemotePrograms] = useState([]);

  // Sync with initialQuery when route updates
  useEffect(() => {
    if (initialQuery !== undefined) {
      setQ(initialQuery);
    }
  }, [initialQuery]);

  // Listen for local custom program updates
  useEffect(() => {
    const onCustomChanged = () => {
      setCustomPrograms(Object.values(getCustomPrograms()));
    };
    window.addEventListener('pbl-custom-programs-changed', onCustomChanged);
    return () => window.removeEventListener('pbl-custom-programs-changed', onCustomChanged);
  }, []);

  // Fetch published programs from Firestore
  useEffect(() => {
    let cancelled = false;

    async function loadPublishedPrograms() {
      try {
        const publishedSnap = await getDocs(
          firestoreQuery(collection(db, 'pbl_programs'), where('status', '==', 'published'))
        );
        const loaded = [];
        publishedSnap.forEach((d) => {
          const prog = normaliseContractProgram({ id: d.id, ...d.data() });
          if (prog) {
            saveCustomProgram(prog);
            loaded.push(prog);
          }
        });
        if (!cancelled && loaded.length > 0) {
          setRemotePrograms((prev) => {
            const map = new Map(prev.map((p) => [p.id, p]));
            for (const p of loaded) map.set(p.id, p);
            return Array.from(map.values());
          });
        }
      } catch (err) {
        console.warn('[HomeSearch] Remote programs load notice:', err?.message);
      }
    }

    loadPublishedPrograms();
    return () => { cancelled = true; };
  }, []);

  // Subscribe to real-time program publications across tabs/clients
  useEffect(() => {
    const unsub = subscribeToPblTransfers((data) => {
      if (data?.program) {
        saveCustomProgram(data.program);
        setRemotePrograms((prev) => {
          const map = new Map(prev.map((p) => [p.id, p]));
          map.set(data.program.id, data.program);
          return Array.from(map.values());
        });
      }
    });
    return unsub;
  }, []);

  const catalog = useMemo(() => {
    const map = new Map();
    for (const p of PROGRAMS) map.set(p.id, p);
    for (const p of LIBRARY_PROGRAMS) map.set(p.id, p);
    for (const p of customPrograms) map.set(p.id, p);
    for (const p of remotePrograms) map.set(p.id, p);
    const allPrograms = Array.from(map.values());
    return buildCatalog({
      activities: ACTIVITY_NAV,
      programs: allPrograms,
      parseLabel: parseActivityLabel,
      includePartners: true
    });
  }, [customPrograms, remotePrograms]);

  const query = q.trim();
  const results = useMemo(() => (query ? searchCatalog(catalog, query) : []), [catalog, query]);
  const publishedProgramsOnly = useMemo(() => catalog.filter((c) => c.source === 'program'), [catalog]);
  const { keys, added, toggle } = useAddedCourses(uid, catalog);

  /* ---------- Discovery: real learner records only ---------- */
  const { plan, loaded: goalsLoaded } = useGoalPlan(uid);
  const activeGoals = useMemo(() => splitGoals(plan).active, [plan]);
  const [prefs, setPrefs] = useState(() => readPrefs(uid));
  const savePrefs = (patch) => setPrefs((p) => {
    const next = { ...p, ...patch };
    try { sessionStorage.setItem(prefKey(uid), JSON.stringify(next)); } catch { /* private mode */ }
    return next;
  });
  useEffect(() => { setPrefs(readPrefs(uid)); }, [uid]);
  const tab = ['all', 'welearn', 'external'].includes(prefs.tab) ? prefs.tab : 'all';
  const type = ['any', 'program', 'activity'].includes(prefs.type) ? prefs.type : 'any';
  const focusId = prefs.focusId === null ? null : (activeGoals.some((g) => g.id === prefs.focusId) ? prefs.focusId : activeGoals[0]?.id ?? null);
  const focusGoal = activeGoals.find((g) => g.id === focusId) || null;

  // Enrolled/assigned courses for this learner (same read as My Dashboard). A
  // learner or class change discards any late answer for the previous one.
  const classKey = classIds.join('|');
  const [courses, setCourses] = useState([]);
  useEffect(() => {
    let cancelled = false;
    setCourses([]);
    if (!uid) return undefined;
    loadDashboardCourses(uid, classKey ? classKey.split('|') : [], activeProgramId)
      .then((r) => { if (!cancelled) setCourses(r.courses || []); })
      .catch(() => { if (!cancelled) setCourses([]); });
    return () => { cancelled = true; };
  }, [uid, classKey, activeProgramId]);

  // Course outcomes from the course outline that maps them explicitly.
  const outlineCache = useMemo(() => new Map(), []);
  const outlineFor = (item) => {
    if (item.source !== 'program') return [];
    if (!outlineCache.has(item.id)) outlineCache.set(item.id, courseCompetencies(PROGRAMS.find((p) => p.id === item.id) || programById(item.id)));
    return outlineCache.get(item.id);
  };
  const competency = useMemo(() => normaliseCompetencyContext(competencyContext), [competencyContext]);
  const suggested = useMemo(() => suggestions({ items: catalog, results, query, focusGoal, courses }), [catalog, results, query, focusGoal, courses]);
  const shownResults = useMemo(() => filterResults(results, { tab, type }), [results, tab, type]);
  const [detail, setDetail] = useState(null);

  // Keep the query in the address so Back from a course returns to the same search.
  useEffect(() => {
    const id = setTimeout(() => {
      const target = query ? `#/search/${encodeURIComponent(query)}` : '#/search';
      if (window.location.hash !== target && /^#\/search(\/|$)/.test(window.location.hash)) history.replaceState(null, '', target);
    }, 350);
    return () => clearTimeout(id);
  }, [query]);
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

        <LearningFocus goals={activeGoals} loaded={goalsLoaded} focusId={focusId} competency={competency}
                       onFocus={(id) => savePrefs({ focusId: id })} />

        {!query && (
          <>
            <div className="hs-suggestions" role="group" aria-label="Suggested search topics">
              <span className="hs-suggestions-label">Try searching:</span>
              {QUICK_TOPICS.map((topic) => (
                <button
                  key={topic}
                  type="button"
                  className="hs-chip"
                  onClick={() => setQ(topic)}
                >
                  {topic}
                </button>
              ))}
            </div>

            <p className="hs-hint">
              {t('home.searchHint')}{' '}
              {added.length > 0 && <a href={hrefFor.courses()}>{t('home.addedLink', { n: added.length })}</a>}
            </p>
          </>
        )}
        </div>
      </section>

      {query ? (
        <>
        {suggested.length > 0 && <Suggestions list={suggested} query={query} outlineFor={outlineFor} onDetails={setDetail} onOpenActivity={onOpenActivity} />}
        <section className="gh-page hs-results" aria-labelledby="hs-count">
          <h2 id="hs-count" className="hs-sr">{t(results.length === 1 ? 'home.resultCountOne' : 'home.resultCount', { n: results.length, q: query })}</h2>
          <ResultsToolbar tab={tab} type={type} counts={tabCounts(results)} types={typeCounts(results, tab)} shown={shownResults.length} query={query}
                          onTab={(id) => savePrefs({ tab: id })} onType={(id) => savePrefs({ type: id })} />
          {shownResults.length ? (
            <ul className="gh-course-grid">
              {shownResults.map((c) => (
                <CatalogCard key={c.key} item={c} variant="button" onOpenActivity={onOpenActivity}
                             addedKeys={keys} onToggleAdd={toggle} worksToward={outlineFor(c)} onDetails={setDetail} />
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
        </>
      ) : (
        <>
        <Suggestions list={suggested} query="" outlineFor={outlineFor} onDetails={setDetail} onOpenActivity={onOpenActivity} />
        {publishedProgramsOnly.length > 0 && (
          <section className="gh-page hs-featured" aria-labelledby="hs-featured-title">
            <div className="hs-featured-header">
              <h2 id="hs-featured-title" className="hs-featured-title">
                <Sparkles size={17} style={{ color: 'var(--gh-purple)' }} /> Published Courses & STEM Missions
              </h2>
              <span className="hs-featured-count">
                {publishedProgramsOnly.length} programs available
              </span>
            </div>
            <ul className="gh-course-grid">
              {publishedProgramsOnly.slice(0, 6).map((c) => (
                <CatalogCard key={c.key} item={c} variant="button" onOpenActivity={onOpenActivity}
                             addedKeys={keys} onToggleAdd={toggle} worksToward={outlineFor(c)} onDetails={setDetail} />
              ))}
            </ul>
          </section>
        )}
        </>
      )}
      {detail && (
        <CourseDetails item={detail} outline={outlineFor(detail)} availability={availability(detail, courses)}
                       isAdded={keys.includes(detail.key)} onToggleAdd={toggle} onOpenActivity={onOpenActivity} onClose={() => setDetail(null)} />
      )}
    </div>
  );
}
