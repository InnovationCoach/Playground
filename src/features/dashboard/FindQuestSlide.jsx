import { useMemo, useState } from 'react';
import { Search, ArrowRight } from 'lucide-react';
import { hrefFor } from '../../app/routes.js';
import { ACTIVITY_NAV } from '../activities/activityHost.js';
import { parseActivityLabel } from '../shell/activityIcons.jsx';
import { PROGRAMS, programById } from '../pbl/programs/catalog.js';
import { LIBRARY_PROGRAMS } from '../pbl/programs/libraryProgramsData.js';
import { buildCatalog } from '../courses/catalog.js';
import { useAddedCourses } from '../courses/useAddedCourses.js';
import { newQuests, questReason, plainTitle, courseCompetencies, availability } from '../home/discoveryModel.js';
import { CourseDetails } from '../home/Discovery.jsx';
import { ProgramIcon } from '../pbl/programs/ProgramIcon.jsx';
import { matchActivities } from './dashboardModel.js';
import { splitGoals } from './slideModel.js';
import '../courses/courses.css';
import '../home/homeSearch.css';
import '../home/discovery.css';

const TOPICS = ['Robots', 'The environment', 'Space', 'Coding', 'Making things'];
const TOPIC_SEARCH = { Robots: 'Robotics', 'The environment': 'Environmental', Space: 'Space Missions', Coding: 'Microcontroller', 'Making things': 'MakerSpace' };

const TONES = ['purple', 'sky', 'green', 'amber', 'magenta', 'navy'];
const toneOf = (key) => TONES[[...key].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % TONES.length];

/** A quest's cover: its program colours and icon, or the emoji its activity already uses. Decorative. */
function QuestCover({ item }) {
  const emoji = item.source === 'activity' ? ACTIVITY_NAV.find((a) => a.id === item.id)?.label.match(/\p{Extended_Pictographic}/u)?.[0] : null;
  return <div className="fq-art" data-tone={item.tone || toneOf(item.key)} aria-hidden="true">
    {emoji ? <span className="fq-art-emoji">{emoji}</span> : <ProgramIcon name={item.icon} size={46} />}
  </div>;
}

/**
 * "Find a Quest" on My Dashboard: only quests the learner hasn't begun, each with
 * a plain title and one simple reason it fits. Current work stays in My Quests.
 * Searching opens the full page (#/search), which also lists current courses.
 */
export function FindQuestSlide({ uid, data, plan, interests = [], started = [], onOpenActivity }) {
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
  const list = useMemo(() => newQuests({
    items: catalog, focusGoal, courses: data.courses, interestMatches: matchActivities(interests), started, added: keys
  }), [catalog, focusGoal, data.courses, interests, started, keys]);
  const outlineFor = (item) => (item.source === 'program' ? courseCompetencies(PROGRAMS.find((p) => p.id === item.id) || programById(item.id)) : []);
  const go = (text) => { window.location.hash = hrefFor.homeSearch(text.trim()); };
  return <>
    <p className="sd-intro">Looking for something new? Here are some quests you haven’t started.</p>
    {list.length > 0 && <ul className="fq-list">
      {list.map(({ item, reason }) => <li key={item.key} className="fq-card">
        <QuestCover item={item} />
        <div className="fq-card-body">
          <h3>{plainTitle(item)}</h3>
          <p className="fq-why"><strong>Why it fits:</strong> {questReason(reason)}</p>
          <button type="button" className="sd-primary" onClick={() => setDetail(item)}>Take a look <ArrowRight size={16} aria-hidden="true" /></button>
        </div>
      </li>)}
    </ul>}
    <form className="hs-box fq-box" role="search" onSubmit={(e) => { e.preventDefault(); if (q.trim()) go(q); }}>
      <label htmlFor="fq-q" className="hs-sr">Search for a quest</label>
      <Search size={20} aria-hidden="true" className="hs-icon" />
      <input id="fq-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" placeholder="Or search for a topic…" />
      <button type="submit" className="sd-button fq-go" disabled={!q.trim()}>Search</button>
    </form>
    <div className="hs-suggestions fq-topics" role="group" aria-label="Topics to search">
      {TOPICS.map((topic) => <button key={topic} type="button" className="hs-chip" onClick={() => go(TOPIC_SEARCH[topic])}>{topic}</button>)}
    </div>
    <a className="sd-link fq-all" href={hrefFor.homeSearch()}>See every quest <ArrowRight size={16} aria-hidden="true" /></a>
    {detail && <CourseDetails item={detail} outline={outlineFor(detail)} availability={availability(detail, data.courses)}
                              isAdded={keys.includes(detail.key)} onToggleAdd={toggle} onOpenActivity={onOpenActivity} onClose={() => setDetail(null)} />}
  </>;
}
