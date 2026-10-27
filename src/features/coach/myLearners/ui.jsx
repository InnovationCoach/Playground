import { AlertOctagon, MessageSquareText, CalendarClock, CheckCircle2, HardDrive } from 'lucide-react';
import { useLocale } from '../../../app/i18n/LocaleProvider.jsx';

/** Small pieces shared by the My Learners screens. Status always has an icon and words, never colour alone. */
const STATUS_ICON = { overdue: AlertOctagon, feedback: MessageSquareText, checkin: CalendarClock, ontrack: CheckCircle2 };

export function StatusBadge({ status }) {
  const { t } = useLocale();
  const Icon = STATUS_ICON[status.id];
  return (
    <span className={`ml-status ml-status-${status.id}`}>
      <Icon size={14} aria-hidden="true" />{t(`ml.status.${status.id}`)}
    </span>
  );
}

/** "12 Oct" for a YYYY-MM-DD day key, in the interface language. */
export function useDay() {
  const { formatDate } = useLocale();
  return (day) => (day ? formatDate(new Date(`${day}T00:00:00`), { day: 'numeric', month: 'short' }) : '');
}

export function useWhen() {
  const { formatDate } = useLocale();
  return (ms) => (ms ? formatDate(new Date(ms), { day: 'numeric', month: 'short', year: 'numeric' }) : '');
}

/** One reason, as a sentence. */
export function ReasonText({ reason }) {
  const { t } = useLocale();
  const day = useDay();
  switch (reason.code) {
    case 'milestoneOverdue':
      return t('ml.reason.milestoneOverdue', { title: reason.title, date: day(reason.dueOn), days: reason.days });
    case 'evidenceWaiting':
      return t(reason.count === 1 ? 'ml.reason.evidenceWaitingOne' : 'ml.reason.evidenceWaitingMany', { count: reason.count, days: reason.days });
    case 'noCheckIn':
      return t('ml.reason.noCheckIn');
    case 'followUpDue':
      return reason.days > 0
        ? t('ml.reason.followUpLate', { date: day(reason.dueOn), days: reason.days })
        : t('ml.reason.followUpToday');
    default:
      return null;
  }
}

/** Where a reason's fix lives in the profile. */
export const REASON_TAB = { milestoneOverdue: 'projects', evidenceWaiting: 'evidence', noCheckIn: 'notes', followUpDue: 'notes' };

export function NotAvailable({ children }) {
  const { t } = useLocale();
  return <span className="ml-na">{children || t('ml.notAvailable')}</span>;
}

export function Empty({ icon: Icon, title, body, action }) {
  return (
    <div className="ml-empty">
      {Icon && <Icon size={22} aria-hidden="true" />}
      <p className="ml-empty-title">{title}</p>
      {body && <p className="ml-empty-body">{body}</p>}
      {action}
    </div>
  );
}

/** Says, once per screen, where the coach's own records are kept today. */
export function DeviceStoreNote() {
  const { t } = useLocale();
  return (
    <p className="ml-device-note">
      <HardDrive size={14} aria-hidden="true" />{t('ml.deviceNote')}
    </p>
  );
}

/** The next milestone or deadline, with its date or the fact that none is agreed. */
export function NextCell({ next, day }) {
  const { t } = useLocale();
  if (!next) return <NotAvailable>{t('ml.next.none')}</NotAvailable>;
  return (
    <>
      <span className="ml-clamp">{next.type === 'session' ? t('ml.next.session', { n: next.session, title: next.title })
        : next.type === 'phase' ? t('ml.next.phase', { title: next.title }) : next.title}</span>
      <div className={`ml-cell-sub${next.state === 'overdue' ? ' ml-late' : ''}`}>
        {next.type === 'phase' ? `${next.courseTitle ? `${next.courseTitle} · ` : ''}${t(`ml.phase.${next.phaseState}`)} · ${t('ml.next.noDate')}`
          : next.type === 'session' ? t('ml.next.noDate')
          : next.state === 'overdue' ? t('ml.next.wasDue', { date: day(next.dueOn) })
          : t(next.type === 'assignment' ? 'ml.next.assignmentDue' : 'ml.next.due', { date: day(next.dueOn) })}
      </div>
    </>
  );
}

/** "3 of 7 missions done", or not available when the program's content makes the count unreliable. */
export function Missions({ p }) {
  const { t } = useLocale();
  if (!p.countReliable) return <NotAvailable>{t('ml.pbl.missionsUnreliable')}</NotAvailable>;
  return t('ml.pbl.missions', { done: p.done, total: p.total });
}
