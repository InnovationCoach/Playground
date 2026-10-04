/**
 * Server side of Teen Quest: the only writer of learnerQuest records.
 *
 * Firestore transactions require every read before any write, so awarding XP
 * is split in two: prepareXp() does the reads and computes the result, and
 * the returned apply() does the writes. Callers inside an existing route
 * transaction call prepareXp() after their own reads and apply() with their
 * writes, so the learning event and its XP commit together or not at all.
 */
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { applyEvent, hydrateQuest, localDate, addDays, isDate, XP_RULES } from '../../src/features/quest/questModel.js';

export const questRef = uid => getFirestore().collection('learnerQuest').doc(uid);
export const squadRef = classId => getFirestore().collection('classes').doc(classId).collection('questSquad').doc('current');
export const DEFAULT_SQUAD_GOAL = 120;

const HOLIDAY = /holiday|break|closure|closed|no school/i;

/**
 * School-local "today" and recent holidays, loaded outside any transaction.
 * Holidays come from the shared school calendar (admin-managed), so a school
 * closure never breaks a learner's streak.
 */
export async function questContext(schoolId, school = {}) {
  const timezone = school.timezone || 'Asia/Bangkok';
  const today = localDate(new Date(), timezone);
  const holidays = new Set();
  if (schoolId) {
    try {
      const from = addDays(today, -45);
      const snap = await getFirestore().collection('schools').doc(schoolId).collection('calendarEvents')
        .where('startDate', '>=', addDays(from, -30)).get();
      for (const doc of snap.docs) {
        const e = doc.data();
        if (e.status === 'cancelled' || !HOLIDAY.test(`${e.category || ''} ${e.title || ''}`)) continue;
        if (!isDate(e.startDate)) continue;
        const end = isDate(e.endDate) ? e.endDate : e.startDate;
        for (let d = e.startDate, i = 0; d <= end && i < 120; d = addDays(d, 1), i++) holidays.add(d);
      }
    } catch (error) {
      // A calendar read failure must not block learning or XP; weekends still apply.
      console.warn('[quest] Could not load school holidays:', error.message);
    }
  }
  return { timezone, today, holidays };
}

/**
 * Read phase of an XP award. `event` = { uid, type, sourceId, classId?,
 * schoolId?, note? }. Returns { result, apply } where result is null when the
 * event was already recorded (idempotent retry).
 */
export async function prepareXp(tx, ctx, event) {
  if (!XP_RULES[event.type]) throw new Error(`Unknown quest event type: ${event.type}`);
  const ref = questRef(event.uid);
  const eventRef = ref.collection('xpEvents').doc(`${event.type}__${event.sourceId}`.slice(0, 600));
  const [questSnap, eventSnap] = await tx.getAll(ref, eventRef);
  if (eventSnap.exists) return { result: null, apply: () => {} };
  const now = new Date().toISOString();
  const result = applyEvent(questSnap.data(), event, { today: ctx.today, holidays: ctx.holidays, now });
  return {
    result,
    apply() {
      const quest = { ...result.quest, revision: (hydrateQuest(questSnap.data()).revision || 0) + 1, updatedAt: now };
      tx.set(ref, quest);
      tx.set(eventRef, {
        type: event.type,
        xp: result.awarded,
        verified: XP_RULES[event.type].verified,
        sourceId: String(event.sourceId).slice(0, 300),
        classId: event.classId || null,
        schoolId: event.schoolId || null,
        localDate: ctx.today,
        ...(event.note ? { note: event.note } : {}),
        createdAt: now
      });
    }
  };
}

/** Award XP in its own transaction (for events with no surrounding transaction). */
export async function awardXp(ctx, event) {
  let result = null;
  await getFirestore().runTransaction(async tx => {
    const prepared = await prepareXp(tx, ctx, event);
    prepared.apply();
    result = prepared.result;
  });
  return result;
}

/** Count one new piece of class evidence toward the cooperative squad goal. */
export function countSquadEvidence(tx, classId) {
  if (!classId) return;
  tx.set(squadRef(classId), { count: FieldValue.increment(1), updatedAt: new Date().toISOString() }, { merge: true });
}
