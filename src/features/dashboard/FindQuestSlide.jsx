import { useMemo, useState } from 'react';
import { Search, ArrowRight } from 'lucide-react';
import { hrefFor } from '../../app/routes.js';
import { ACTIVITY_NAV } from '../activities/activityHost.js';
import { parseActivityLabel } from '../shell/activityIcons.jsx';
import { PROGRAMS, programById } from '../pbl/programs/catalog.js';
import { LIBRARY_PROGRAMS } from '../pbl/programs/libraryProgramsData.js';
import { buildCatalog } from '../courses/catalog.js';
import { useAddedCourses } from '../courses/useAddedCourses.js';
import { suggestions, courseCompetencies, availability } from '../home/discoveryModel.js';
import { Suggestions, CourseDetails } from '../home/Discovery.jsx';
import { splitGoals } from './slideModel.js';
import '../courses/courses.css';
import '../home/homeSearch.css';
import '../home/discovery.css';

const TOPICS = ['Robotics', 'Environmental', 'Space Missions', 'Microcontroller', 'MakerSpace'];

/**
 * "Find a Quest" on My Dashboard: a compact door into the search page (#/search).
 * Searching opens the full page; suggestions here use the same rules and real
 * records (goals, enrolled/assigned courses), never scores or AI.
 */
export function FindQuestSlide({ uid, data, plan, onOpenActivity }) {
  const [q, setQ] = useState('');
  const [detail, setDetail] = useState(null);
  const catalog = useMemo(() => {
    const programs = new Map();
    for (const p of PROGRAMS) programs.set(p.id, p);
    for (const p of LIBRARY_PROGRAMS) programs.set(p.id, p);
    return buildCatalog({ activities: ACTIVITY_NAV, programs: [...programs.values()], parseLabel: parseActivityLabel, includePartners: true });
  }, []);
  const { keys, toggle } = useAddedCourses(uid, catalog);
  const focusGoal = splitGoals(plan).active[0] || null;
  const list = useMemo(() => suggestions({ items: catalog, focusGoal, courses: data.courses }), [catalog, focusGoal, data.courses]);
  const outlines = useMemo(() => new Map(), []);
  const outlineFor = (item) => {
    if (item.source !== 'program') return [];
    if (!outlines.has(item.id)) outlines.set(item.id, courseCompetencies(PROGRAMS.find((p) => p.id === item.id) || programById(item.id)));
    return outlines.get(item.id);
  };
  const go = (text) => { window.location.hash = hrefFor.homeSearch(text.trim()); };
  return <>
    <p className="sd-intro">Search a topic, skill or project. Your goals and current courses shape the suggestions.</p>
    <form className="hs-box fq-box" role="search" onSubmit={(e) => { e.preventDefault(); if (q.trim()) go(q); }}>
      <label htmlFor="fq-q" className="hs-sr">Find a Quest</label>
      <Search size={20} aria-hidden="true" className="hs-icon" />
      <input id="fq-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" placeholder="Search a topic, skill, course or project…" />
      <button type="submit" className="sd-primary fq-go" disabled={!q.trim()}>Search <ArrowRight size={16} aria-hidden="true" /></button>
    </form>
    <div className="hs-suggestions fq-topics" role="group" aria-label="Suggested search topics">
      <span className="hs-suggestions-label">Try:</span>
      {TOPICS.map((topic) => <button key={topic} type="button" className="hs-chip" onClick={() => go(topic)}>{topic}</button>)}
    </div>
    <Suggestions list={list} query="" outlineFor={outlineFor} onDetails={setDetail} onOpenActivity={onOpenActivity} />
    <a className="sd-link fq-all" href={hrefFor.homeSearch()}>Browse every quest <ArrowRight size={16} aria-hidden="true" /></a>
    {detail && <CourseDetails item={detail} outline={outlineFor(detail)} availability={availability(detail, data.courses)}
                              isAdded={keys.includes(detail.key)} onToggleAdd={toggle} onOpenActivity={onOpenActivity} onClose={() => setDetail(null)} />}
  </>;
}
