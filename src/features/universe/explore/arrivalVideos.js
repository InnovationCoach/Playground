/**
 * "How this mission works" clips shown when a learner arrives for a mission (O05). Presentation only:
 * a clip never changes the mission, its data or its assessment. Each clip is keyed by mission and route.
 * `src` and `poster` are Cloudinary links set once the clip is uploaded; until then no player is shown.
 * Captions and the transcript come from `cues` ([start s, end s, text]), which match the narration.
 */

/** Only https video links from Cloudinary's delivery host are played. */
export function isCloudinaryVideo(url) {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' && u.hostname === 'res.cloudinary.com' && /^\/[^/]+\/video\/upload\//.test(u.pathname);
  } catch { return false; }
}

/** A poster frame for a Cloudinary video: the same asset as a JPEG at the given second. */
export function cloudinaryPoster(url, second = 15) {
  return isCloudinaryVideo(url) ? url.replace('/video/upload/', `/video/upload/so_${second},w_1280/`).replace(/\.(mp4|webm|mov)(\?.*)?$/i, '.jpg') : null;
}

export const ARRIVAL_VIDEOS = Object.freeze({
  'thalassa-wind-survey|guided': Object.freeze({
    title: 'How this mission works',
    duration: '1:13',
    summary: 'Reading the wind table, the main steps, and sending your work.',
    src: 'https://res.cloudinary.com/dkplz6vbx/video/upload/v1793678509/tv2VtAzF6diYWhaPDP4s6Q_xytypx.mp4', // uploaded 3 Nov 2026
    cues: Object.freeze([
    [0.6, 1.8, "Welcome to Thalassa."],
    [1.8, 2.88, "Your mission asks:"],
    [2.88, 4.15, "is the wind worth it?"],
    [4.15, 6.67, "You are the station's energy investigator."],
    [6.67, 11.78, "In the end, you'll recommend a power plan, or explain what you need to measure first."],
    [12.68, 13.79, "First, look around."],
    [13.79, 17.58, "Notice the weather mast, the floating platform and the shoreline."],
    [17.58, 21.77, "When you're ready, place a portable wind sensor where you would measure."],
    [21.77, 22.77, "It's only a plan:"],
    [22.77, 24.8, "the mission uses its supplied data."],
    [25.7, 27.15, "Then choose Start mission."],
    [27.15, 31.06, "You work through one small step at a time, and you can always go back."],
    [31.96, 32.5, "Step one:"],
    [32.5, 33.42, "check the data."],
    [33.42, 35.38, "Every record has a source label."],
    [35.38, 40.69, "This week of wind is made up, so you are testing a method, not predicting real weather."],
    [41.59, 44.41, "To read the wind table, take one row at a time."],
    [44.41, 49.68, "Each wind band shows how many hours it blew, and how much of full power a turbine makes."],
    [49.68, 51.84, "Multiply them, then add up the rows."],
    [52.74, 56.1, "Next, divide the full-power hours by the total hours."],
    [56.1, 58.25, "That ratio is the capacity factor."],
    [58.25, 61.73, "If you get stuck, open the hints or the worked example."],
    [62.63, 68.06, "Finally, compare the plans, test what happens with less wind, and make your recommendation."],
    [68.06, 71.46, "Check the review list, then send your work to your coach."]
    ])
  })
});

/** The clip for a mission choice, only when it has a playable source. */
export function videoFor(choice, videos = ARRIVAL_VIDEOS, { trusted = false } = {}) {
  const v = choice && videos[`${choice.id}|${choice.routeId || ''}`];
  if (!v?.src || !(trusted || isCloudinaryVideo(v.src))) return null;
  return { ...v, poster: v.poster || cloudinaryPoster(v.src) };
}

const stamp = (t) => { const ms = Math.round(t * 1000);
  return `${String(Math.floor(ms / 3600000)).padStart(2, '0')}:${String(Math.floor(ms / 60000) % 60).padStart(2, '0')}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}.${String(ms % 1000).padStart(3, '0')}`; };
/** WebVTT text for the caption track. */
export const captionsVtt = (cues) => `WEBVTT\n\n${cues.map(([a, b, text], i) => `${i + 1}\n${stamp(a)} --> ${stamp(b)}\n${text}\n`).join('\n')}`;
