import bundle from './publishedBundle.json';

function deepFreeze(value) {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

/**
 * Published self-directed Universe release bundle evaluated automatically by Spark AI,
 * with summary reports delivered directly to the Coach Dashboard.
 */
export const PILOT_BUNDLE = deepFreeze({ ...bundle });

export const PILOT_RELEASES = Object.freeze([PILOT_BUNDLE]);
