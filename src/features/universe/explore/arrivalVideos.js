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

/** One frame as artwork: cropped to the bottom right of the screen, which leaves out the app's bars and panels. */
export function cloudinarySceneFrame(url, second, width = 720) {
  return isCloudinaryVideo(url) ? url.replace('/video/upload/', `/video/upload/so_${second},c_crop,g_south_east,w_0.68,h_0.8/w_${width}/`).replace(/\.(mp4|webm|mov)(\?.*)?$/, '.jpg') : '';
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
  }),
  'spacecraft-journey|guided': Object.freeze({
    title: 'How this mission works',
    duration: '1:06',
    summary: 'Reading the concept table, turning seconds into days, and sending your work.',
    src: 'https://res.cloudinary.com/dkplz6vbx/video/upload/v1793681586/Jurney_gt5hhl.mp4', // uploaded 3 Nov 2026
    cues: Object.freeze([
      [0.6, 3.09, "Welcome to Thalassa's departure station."],
      [3.09, 3.89, "Your mission:"],
      [3.89, 5.39, "plan a journey to Ignis."],
      [5.39, 7.31, "You are the expedition planner."],
      [7.31, 12.04, "In the end, you'll recommend a spacecraft concept, or ask for more evidence."],
      [12.94, 14.79, "First, look around the station."],
      [14.79, 18.56, "When you're ready, place a portable wind sensor, or skip setup."],
      [18.56, 22.27, "It's only a plan, and it doesn't change the mission's numbers."],
      [23.17, 24.74, "Then choose Start mission."],
      [24.74, 28.29, "Each step shows one small task, and you can always go back."],
      [29.19, 30.42, "Start with the limits."],
      [30.42, 35.71, "The crew must arrive within eighty days, and carry no more than four hundred kilograms of food."],
      [36.61, 39.68, "Next, open the evidence and read the concept table."],
      [39.68, 42.44, "Each row gives one spacecraft's average speed."],
      [42.44, 45.39, "Travel time is the distance divided by the speed."],
      [46.29, 47.98, "Your time comes out in seconds."],
      [47.98, 52.16, "Divide by the seconds in one day to get days, then compare it with the limit."],
      [52.16, 53.96, "Hints are there if you need them."],
      [54.86, 61.03, "Finally, check all three concepts, show the journey from the station to Ignis, and recommend a concept."],
      [61.03, 64.45, "Check the review list, then send your work to your coach."]
    ])
  }),
  'spacecraft-journey|advanced': Object.freeze({
    title: 'How this mission works',
    duration: '1:10',
    summary: 'The limits, the rocket equation, the mass ledger, and sending your work.',
    src: 'https://res.cloudinary.com/dkplz6vbx/video/upload/v1793681362/IHUXnNr7VKBL6nReVK2peA_un6ujs.mp4', // uploaded 3 Nov 2026
    cues: Object.freeze([
      [0.6, 1.56, "Welcome to Ignis."],
      [1.56, 4.95, "Your mission weighs mass, time and power for the expedition."],
      [4.95, 6.81, "You are the systems investigator."],
      [6.81, 11.61, "You'll make a conditional recommendation, and name the evidence that could change it."],
      [12.51, 14.57, "Look around the fissure field first."],
      [14.57, 19.54, "When you're ready, place a solar meter where you would compare sunlight, or skip setup."],
      [19.54, 20.51, "It's a plan only:"],
      [20.51, 22.51, "the mission uses its supplied data."],
      [23.41, 24.92, "Then choose Start mission."],
      [24.92, 28.18, "You work one step at a time, and you can always go back."],
      [29.08, 30.39, "Begin with the limits:"],
      [30.39, 37.98, "one hundred and fifty days, twenty-one thousand kilograms of added mass, and two hundred and sixty square metres of ion panels."],
      [38.88, 42.47, "Next, model the propellant with the supplied rocket equation."],
      [42.47, 47.48, "Use the chemical engine's value first, then repeat the same steps for the ion engine."],
      [48.38, 49.56, "Then build a ledger."],
      [49.56, 53.21, "For each design, add the modelled propellant and the supplies."],
      [53.21, 58.17, "The ion case uses its own one hundred and forty day assumption, not the timing case."],
      [59.07, 64.96, "Finally, read the real engineering references, label your scenario, and defend a conditional choice."],
      [64.96, 68.31, "Review your checklist, then send your work to your coach."]
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
