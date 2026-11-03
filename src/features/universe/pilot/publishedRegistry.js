import bundle from './publishedBundle.json';

function deepFreeze(value) {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

export const PUBLISHED_PILOT_BUNDLE = deepFreeze({
  ...bundle,
  status: 'published',
  reviewState: {
    technical: 'accepted',
    science: 'educator-approved',
    curriculum: 'educator-approved',
    publication: 'authorized'
  }
});

export const PUBLISHED_PILOT_RELEASES = Object.freeze([PUBLISHED_PILOT_BUNDLE]);
