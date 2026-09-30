/**
 * Design review for a photo of the learner's actual car.
 *
 * The old version of this activity had a `runSolarAiAnalysis()` that unhid a div
 * containing hardcoded text - "8.5 / 10", "0.28 Cd", "82% coverage" - regardless
 * of what the student uploaded, or whether they uploaded anything at all. That is
 * worse than no feature: it teaches children to trust a number that was never
 * measured.
 *
 * So this module does two honest things and labels which one happened:
 *
 *   'ai'    - the photo and the team's own measurements went to Gemini through
 *             the project's server, which holds the key and applies the age-band
 *             and safety rules. Real vision, real response.
 *   'local' - the server was unreachable. The review is then generated from the
 *             numbers the team typed, on this device, and the UI says so. No
 *             claim is made about the photo, because nothing looked at it.
 */
import { auth } from '../../../firebase.js';
import { getAgeBand } from '../../../services/geminiApi.js';
import { buildSummaryForReview } from './solarCarModel.js';

import { API_BASE as API_BASE_URL } from '../../../services/apiBase.js';

/** Photos come off phones at several MB; Gemini does not need that. */
const MAX_EDGE_PX = 1024;
const JPEG_QUALITY = 0.82;

export async function fileToAnalysisJpeg(file) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE_PX / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.getContext('2d').drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();

  const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
  return {
    dataUrl,
    base64: dataUrl.split(',')[1],
    mimeType: 'image/jpeg',
    width: w,
    height: h
  };
}

/**
 * Ask for a review of the build.
 *
 * `image` is optional - a team can get a review of their numbers before the car
 * is finished enough to photograph.
 */
export async function requestDesignReview({ report, testReport, image }) {
  const measurements = buildSummaryForReview(report, testReport);

  try {
    const headers = { 'Content-Type': 'application/json' };
    const token = await auth.currentUser?.getIdToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`${API_BASE_URL}/api/design-review`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        measurements,
        ageBand: getAgeBand(),
        image: image ? { base64: image.base64, mimeType: image.mimeType } : null
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `Review server returned ${response.status}`);
    }

    const data = await response.json();
    return { source: 'ai', text: data.review, sawPhoto: Boolean(image), timestamp: data.timestamp };
  } catch (err) {
    return {
      source: 'local',
      text: localReview(report, testReport),
      sawPhoto: false,
      error: err.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * The offline review.
 *
 * Written from the report the learner's own numbers produced. It is genuinely
 * useful - every sentence is derived from something they measured - and it never
 * pretends to have seen the car.
 */
function localReview(report, testReport) {
  const out = [];
  // Match the UI: speeds to 2 dp, so "4 m/s" does not sit next to "4.712 m/s".
  const ms = (v) => `${Number(v || 0).toFixed(2)} m/s`;

  out.push(`**Where your design stands**`);
  out.push(
    `You have built a ${report.mass.totalGrams} g car around a ${report.panel.ratedW} W panel: ` +
    `${report.power.specificPowerWPerKg} watts for every kilogram you are carrying. ` +
    `On ${report.track.label.toLowerCase()} that works out at a predicted ${ms(report.speed.predicted)}, ` +
    `which is ${report.speed.predictedTimeS ?? '—'} seconds over your ${report.track.distanceM} m course.`
  );

  out.push(`\n**The limit you are up against**`);
  if (report.speed.limitedBy === 'gearing') {
    out.push(
      `Your gearing, not your panel, is what is holding the car back. The drivetrain runs out at ` +
      `${ms(report.speed.geometric)} while there is enough power for ${ms(report.speed.powerLimited)}. ` +
      `Taking the ratio from ${report.gearing.actual}:1 down towards ${report.gearing.ideal}:1 hands that speed back.`
    );
  } else if (report.speed.limitedBy === 'power') {
    out.push(
      `Your panel, not your gearing, sets the ceiling. The drivetrain could reach ${ms(report.speed.geometric)} ` +
      `but the ${report.panel.effectiveW} W reaching the motor only sustains ${ms(report.speed.powerLimited)}. ` +
      `From here, every gram you remove is worth more than any gear change.`
    );
  } else {
    out.push(`Some measurements are still missing, so there is no prediction to stand behind yet.`);
  }

  out.push(`\n**The three numbers to argue about in your team**`);
  out.push(`- Mass budget: ${report.massBudget.allowedG} g allowed at ${report.track.targetSpeed} m/s, ${report.massBudget.actualG} g built (${report.massBudget.marginG >= 0 ? '+' : ''}${report.massBudget.marginG} g)`);
  out.push(`- Panel: ${report.panelBudget.actualAreaCm2} cm² fitted against ${report.panelBudget.requiredAreaCm2} cm² needed`);
  out.push(`- Gear ratio: ${report.gearing.actual}:1 against a ${report.gearing.min}:1 to ${report.gearing.max}:1 window`);

  if (report.coaching.length) {
    out.push(`\n**What to change next**`);
    report.coaching.filter((c) => c.level === 'act').forEach((c) => out.push(`- ${c.title}. ${c.body}`));
    report.coaching.filter((c) => c.level !== 'act').slice(0, 2).forEach((c) => out.push(`- ${c.title}. ${c.body}`));
  }

  if (testReport?.hasData) {
    out.push(`\n**Your test data**`);
    out.push(
      `Across ${testReport.runs.length} runs you averaged ${ms(testReport.meanSpeed)} against a predicted ` +
      `${ms(testReport.predictedSpeed)} - an error of ${testReport.errorPct}%.`
    );
    testReport.diagnose.forEach((d) => out.push(`- ${d}`));
  } else {
    out.push(`\n**Next step**`);
    out.push(`Run the car three times over ${report.track.distanceM} m and enter the times. The gap between this prediction and your stopwatch is the most interesting number in the whole project.`);
  }

  return out.join('\n');
}
