/**
 * Class join codes.
 *
 * A code is the only secret standing between a learner and a class roster, but
 * it is also something a 13-year-old reads off a whiteboard and types on a
 * phone. Those two pressures set every choice here.
 *
 * Shared deliberately: the browser normalises what a learner typed and the admin
 * scripts generate new codes, and both must agree on the alphabet and shape. If
 * generation and normalisation ever drift apart, valid codes stop resolving and
 * the failure looks like a wrong code rather than a bug.
 */

/**
 * Deliberately excludes 0/O, 1/I/L and the vowels.
 *
 * Excluding look-alikes removes the commonest transcription failure. Excluding
 * vowels means a random code cannot accidentally spell a real word, which
 * matters when the code is projected in front of a class.
 */
const ALPHABET = 'BCDFGHJKMNPQRSTVWXYZ23456789';

/** Two groups of four: long enough to resist guessing, short enough to dictate. */
const GROUP = 4;
const GROUPS = 2;

/**
 * 28^8 is about 3.8e11 codes. Paired with the Firestore rule that only allows
 * one document read at a time and denies listing outright, guessing is not a
 * practical attack - and a wrong guess reveals nothing.
 */
export function generateJoinCode(randomInt) {
  const pick = randomInt || ((n) => Math.floor(Math.random() * n));
  const groups = [];
  for (let g = 0; g < GROUPS; g += 1) {
    let part = '';
    for (let i = 0; i < GROUP; i += 1) part += ALPHABET[pick(ALPHABET.length)];
    groups.push(part);
  }
  return groups.join('-');
}

/**
 * Turn whatever the learner typed into the exact document id.
 *
 * Codes are looked up by document id, so "x3f49gqk", "X3F4 9GQK" and
 * "x3f4-9gqk" must all resolve to the same document, or the feature fails for
 * reasons the learner cannot see. Case is folded, and anything that is not a
 * letter or digit is dropped before the groups are re-inserted.
 *
 * No character substitution happens, deliberately. The look-alike pairs are all
 * excluded from the alphabet at BOTH ends - there is no 0 and no O, no 1 and no
 * I or L - so a code containing one cannot be a near-miss for a valid code. It
 * is simply wrong, and saying so beats silently resolving it to a class the
 * learner did not mean to join.
 */
export function normaliseJoinCode(input) {
  const cleaned = String(input ?? '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');

  if (cleaned.length !== GROUP * GROUPS) return null;
  if (!/^[BCDFGHJKMNPQRSTVWXYZ23456789]+$/.test(cleaned)) return null;

  const groups = [];
  for (let i = 0; i < cleaned.length; i += GROUP) groups.push(cleaned.slice(i, i + GROUP));
  return groups.join('-');
}

export const JOIN_CODE_LENGTH = GROUP * GROUPS;
export const JOIN_CODE_ALPHABET = ALPHABET;
