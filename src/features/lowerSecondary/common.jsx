import { ArrowRight, Award, Check, FileText, Flame, Layers, PenLine, RefreshCw, Search, Target, Trophy } from 'lucide-react';

const BADGE_ICONS = { file: FileText, layers: Layers, refresh: RefreshCw, search: Search, pen: PenLine, check: Check, target: Target, trophy: Trophy, flame: Flame };

export function PageTitle({ title, subtitle }) {
  return <header className="ls-title"><svg className="ls-flourish" viewBox="0 0 34 34" aria-hidden="true" focusable="false"><path d="M18 3L21 13M6 9L14 16M2 23L12 23" stroke="currentColor" strokeWidth="4" strokeLinecap="round" /></svg>
    <h1 tabIndex={-1}>{title}</h1><p>{subtitle}</p></header>;
}

export const ArrowLink = ({ href, children, className = 'ls-link', onClick }) => <a className={className} href={href} onClick={onClick}>{children}<ArrowRight size={18} aria-hidden="true" /></a>;

export const Loading = ({ children }) => <p className="ls-note" role="status">{children}</p>;

export function Failure({ children, onRetry }) {
  return <div className="ls-note ls-note-warn" role="alert"><span>{children}</span>{onRetry && <button type="button" className="ls-retry" onClick={onRetry}><RefreshCw size={15} aria-hidden="true" />Try again</button>}</div>;
}

export function Badge({ badge }) {
  const Icon = BADGE_ICONS[badge.icon] || Award;
  return <li className="ls-badge"><span className="ls-badge-hex"><Icon size={24} aria-hidden="true" /></span><span>{badge.name}</span></li>;
}
