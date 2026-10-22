import { useMemo, useState } from 'react';
import {
  ArrowRight, Award, BookOpen, ChartLine, ClipboardCheck, Clock, Compass, FileText, FolderOpen, Heart,
  Layers, LayoutDashboard, Lightbulb, MessageCircle, Rocket, Search, Settings, Sparkles, Target, UserPlus,
  Users, WandSparkles
} from 'lucide-react';
import { useLocale } from '../../app/i18n/LocaleProvider.jsx';
import { hrefFor } from '../../app/routes.js';
import { getChildProgress, getParentChildren, listUsers } from '../../services/api/endpoints.js';
import { useAsync } from '../admin/ui/useAsync.js';
import { useRelativeTime } from '../shell/useRelativeTime.js';
import { loadSignals, nextStep } from '../dashboard/dashboardModel.js';
import { SPARK_ROLES, sparkRoleFor, cardHref, pushRecent, recentKey } from './sparkConfig.js';
import { studentContext, parentContext, consoleContext, nextStepHref } from './sparkContext.js';
import { SparkGlyph } from './SparkMark.jsx';
import './spark.css';

const ICONS = {
  Award, BookOpen, ChartLine, ClipboardCheck, Compass, FileText, FolderOpen, Heart, Layers,
  LayoutDashboard, MessageCircle, Rocket, Settings, Sparkles, Target, Users, WandSparkles
};

function storage() {
  try { return window.localStorage; } catch { return null; }
}
function readJson(key, fallback) {
  try { const raw = storage()?.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; }
}
function writeJson(key, value) {
  try { storage()?.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ }
}

/**
 * SPARK Home: every role's landing page after sign-in. A greeting, a grid of
 * doors into the features this role can open (sparkConfig.js), and a short
 * "continue" strip built only from real saved activity.
 */
export function SparkHome({ role, uid, displayName, navigate, onOpenActivity }) {
  const { t } = useLocale();
  const key = sparkRoleFor(role);
  const config = SPARK_ROLES[key];
  const firstName = (displayName || '').trim().split(/\s+/)[0] || '';
  const hour = new Date().getHours();
  const greet = t(hour < 12 ? 'spark.greet.morning' : hour < 18 ? 'spark.greet.afternoon' : 'spark.greet.evening', { name: firstName });

  const [recent, setRecent] = useState(() => readJson(recentKey(uid), []));
  const remember = (cardId, href) => {
    const next = pushRecent(recent, { id: cardId, href });
    setRecent(next);
    writeJson(recentKey(uid), next);
  };

  if (!config) return null;
  return (
    <div className={`sk sk-role-${key}`}>
      <div className="sk-hero">
        <div className="sk-hero-inner">
          <span className="sk-greet"><SparkGlyph size={16} />{greet}</span>
          <span className="sk-role">{t(`role.${role === 'coach' ? 'teacher' : role}`)}</span>
          <h1>{t(`spark.welcome.${key}`)}</h1>
          <p>{t(`spark.intro.${key}`)}</p>
          {config.search && <SearchBox navigate={navigate} />}
        </div>
      </div>
      {key === 'parent'
        ? <ParentBody uid={uid} config={config} navigate={navigate} recent={recent} remember={remember} />
        : <RoleBody roleKey={key} uid={uid} config={config} recent={recent} remember={remember} onOpenActivity={onOpenActivity} />}
      <footer className="sk-foot">
        <span>{t('spark.footer')}</span>
        <span className="sk-tagline">{t('spark.tagline')}</span>
      </footer>
    </div>
  );
}

function SearchBox({ navigate }) {
  const { t } = useLocale();
  const [q, setQ] = useState('');
  return (
    <form className="sk-search" role="search" onSubmit={(e) => { e.preventDefault(); navigate(hrefFor.homeSearch(q.trim())); }}>
      <Search size={18} aria-hidden="true" />
      <label className="sk-sr" htmlFor="sk-search-input">{t('spark.searchLabel')}</label>
      <input id="sk-search-input" type="search" value={q} onChange={(e) => setQ(e.target.value)}
             placeholder={t('spark.searchPlaceholder')} autoComplete="off" />
      <button type="submit" className="sk-search-btn">{t('spark.searchGo')}</button>
    </form>
  );
}

function RoleBody({ roleKey, uid, config, recent, remember, onOpenActivity }) {
  const { t } = useLocale();
  const isConsole = roleKey === 'admin' || roleKey === 'supervisor';
  const signals = useMemo(() => (roleKey === 'student' && uid ? loadSignals(uid, storage() || { getItem: () => null }) : null), [roleKey, uid]);
  const pending = useAsync(() => (isConsole ? listUsers({ status: 'pending', pageSize: 1 }) : Promise.resolve(null)), [isConsole]);

  const ctx = roleKey === 'student'
    ? studentContext(signals, t)
    : isConsole ? consoleContext(pending.data ? { pending: pending.data.total } : null, t) : {};

  let next = null;
  if (signals) {
    const step = nextStep({ started: signals.started, goals: signals.goals, project: signals.project });
    const dest = nextStepHref(step.target, hrefFor);
    if (dest) next = { ...step, ...dest };
  }

  return (
    <div className="sk-body">
      <h2 className="sk-h">{t('spark.whereTo')}</h2>
      <CardGrid cards={config.cards} ctx={ctx} remember={remember} />
      <Continue recent={recent} next={next} onOpenActivity={onOpenActivity} />
    </div>
  );
}

function ParentBody({ uid, config, navigate, recent, remember }) {
  const { t } = useLocale();
  const ago = useRelativeTime();
  const children = useAsync(() => getParentChildren(), []);
  const items = children.data?.items || [];
  const [picked, setPicked] = useState(() => readJson(`hearisland.spark.child.v1:${uid}`, null));
  const child = items.find((c) => c.uid === picked) || items[0] || null;
  const progress = useAsync(() => (child ? getChildProgress(child.uid) : Promise.resolve(null)), [child?.uid]);
  const ctx = parentContext(progress.data, t, ago);
  const name = child ? (child.givenNames || child.displayName) : '';

  const choose = (c) => { setPicked(c.uid); writeJson(`hearisland.spark.child.v1:${uid}`, c.uid); };

  if (children.loading && !children.data) {
    return <div className="sk-body"><div className="gh-skel" style={{ width: '40%' }} /></div>;
  }
  if (!items.length) {
    return (
      <div className="sk-body">
        <div className="sk-empty">
          <span className="sk-empty-icon"><UserPlus size={22} aria-hidden="true" /></span>
          <div>
            <h2>{t('spark.parent.noChildTitle')}</h2>
            <p>{t('spark.parent.noChildBody')}</p>
          </div>
          <a className="sk-btn" href={hrefFor.parent()}>{t('spark.parent.linkChild')} <ArrowRight size={16} aria-hidden="true" /></a>
        </div>
      </div>
    );
  }
  return (
    <div className="sk-body">
      {items.length > 1 && (
        <div className="sk-children" role="group" aria-label={t('spark.parent.choose')}>
          {items.map((c) => (
            <button key={c.uid} type="button" className="sk-child" aria-pressed={c.uid === child?.uid} onClick={() => choose(c)}>
              {c.givenNames || c.displayName}
            </button>
          ))}
        </div>
      )}
      <h2 className="sk-h">{t('spark.parent.learning', { name })}</h2>
      <CardGrid cards={config.cards} ctx={ctx} childUid={child?.uid} name={name} remember={remember} />
      <div className="sk-second">
        {progress.data?.recent?.length > 0 && (
          <div className="sk-mini">
            <h2 className="sk-h">{t('spark.parent.recent')}</h2>
            <ul>
              {progress.data.recent.slice(0, 3).map((r) => (
                <li key={`${r.type}-${r.at}`}><span className="sk-dot" /><span><b>{r.text}</b>{r.detail} · {ago(r.at)}</span></li>
              ))}
            </ul>
          </div>
        )}
        {progress.data?.starters?.length > 0 && (
          <div className="sk-mini">
            <h2 className="sk-h">{t('spark.parent.talk')}</h2>
            <ul>
              {progress.data.starters.slice(0, 2).map((s) => (
                <li key={s}><Lightbulb size={16} aria-hidden="true" className="sk-li-icon" /><span>{s}</span></li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <RecentOnly recent={recent} navigate={navigate} />
    </div>
  );
}

function CardGrid({ cards, ctx, childUid = null, name = '', remember }) {
  const { t } = useLocale();
  return (
    <ul className="sk-grid">
      {cards.map((c) => {
        const Icon = ICONS[c.icon] || Sparkles;
        const href = cardHref(c, childUid);
        const title = t(`spark.card.${c.id}.t`, { name });
        const body = t(`spark.card.${c.id}.d`, { name });
        const line = c.ctx ? ctx[c.ctx] : null;
        if (!href) {
          return (
            <li key={c.id} className={`sk-card sk-soon sk-tone-${c.tone}`} aria-disabled="true">
              <span className="sk-ico"><Icon size={20} aria-hidden="true" /></span>
              <h3>{title}</h3>
              <p>{body}</p>
              <span className="sk-soon-pill">{t('spark.comingSoon')}</span>
            </li>
          );
        }
        return (
          <li key={c.id} className={`sk-card sk-live sk-tone-${c.tone}`}>
            <span className="sk-ico"><Icon size={20} aria-hidden="true" /></span>
            <h3><a className="sk-card-link" href={href} onClick={() => remember(c.id, href)}>{title}</a></h3>
            <p>{body}</p>
            {line && <span className="sk-ctx">{line}</span>}
            <span className="sk-act" aria-hidden="true">{t(`spark.card.${c.id}.cta`)} <ArrowRight size={15} /></span>
          </li>
        );
      })}
    </ul>
  );
}

function Continue({ recent, next, onOpenActivity }) {
  const { t } = useLocale();
  const ago = useRelativeTime();
  if (!next && !recent.length) return null;
  return (
    <div className="sk-second">
      {next && (
        <div className="sk-mini sk-next">
          <h2 className="sk-h">{t('spark.next')}</h2>
          <p className="sk-next-title">{next.title}</p>
          <p className="sk-next-body">{next.body}</p>
          {next.href
            ? <a className="sk-btn" href={next.href}>{next.cta} <ArrowRight size={16} aria-hidden="true" /></a>
            : <button type="button" className="sk-btn" onClick={() => onOpenActivity(next.activity)}>{next.cta} <ArrowRight size={16} aria-hidden="true" /></button>}
        </div>
      )}
      {recent.length > 0 && (
        <div className="sk-mini">
          <h2 className="sk-h">{t('spark.recent')}</h2>
          <ul>
            {recent.map((r) => (
              <li key={`${r.id}-${r.href}`}><Clock size={15} aria-hidden="true" className="sk-li-icon" />
                <span><a href={r.href}>{t(`spark.card.${r.id}.t`, { name: '' })}</a>{ago(r.at)}</span></li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function RecentOnly({ recent }) {
  return recent.length ? <Continue recent={recent} next={null} /> : null;
}
