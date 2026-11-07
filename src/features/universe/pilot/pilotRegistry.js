import bundle from './publishedBundle.json';

function deepFreeze(value) {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

/**
 * The pilot missions, with the status and review state the bundle itself records.
 * Review is never asserted here: the bundle says draft and educator-pending, so
 * learners see them as waiting for review until a reviewed bundle replaces this one.
 */
export const PILOT_BUNDLE = deepFreeze({ ...bundle });

export const PILOT_RELEASES = Object.freeze([PILOT_BUNDLE]);
