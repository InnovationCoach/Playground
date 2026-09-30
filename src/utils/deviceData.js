/**
 * Per-user data that must not outlive a sign-in on a shared device.
 *
 * Several features cached a learner's data in localStorage under keys with no
 * user in them ('userGoals', the Solar Car build). On a classroom computer the
 * next person to sign in was shown the previous person's goals, and the Solar
 * Car sync - which prefers the newer of local and cloud - uploaded the previous
 * team's build into the new learner's Firestore record.
 *
 * Those keys are no longer written. This removes any that remain, and is called
 * at start-up and on every sign-out.
 */
const UNSCOPED_KEYS = [
  'userGoals',
  'firstTimeUser',
  'reminderSnoozedUntil',
  'hearisland.solarCar.build.v1',
  'ageBand'
];

// Per-user keys, removed on sign-out so nothing personal stays on the device.
const USER_SCOPED_PREFIXES = ['userGoals_', 'firstTimeUser_', 'reminderSnoozedUntil_'];

export function purgeUnscopedUserData() {
  try {
    UNSCOPED_KEYS.forEach((k) => localStorage.removeItem(k));
  } catch { /* storage unavailable - nothing to purge */ }
}

export function purgeUserDataFor(uid) {
  purgeUnscopedUserData();
  if (!uid) return;
  try {
    for (const k of Object.keys(localStorage)) {
      if (USER_SCOPED_PREFIXES.some((p) => k === `${p}${uid}`)) localStorage.removeItem(k);
    }
  } catch { /* storage unavailable */ }
}
