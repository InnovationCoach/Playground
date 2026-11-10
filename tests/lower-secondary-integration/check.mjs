import puppeteer from 'puppeteer-core';
import { createServer } from 'vite';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PASSWORD, seed, token } from './seed.mjs';
import { PORTS } from './ports.mjs';
import { requireFreePorts, stopChild, withCleanup } from './lifecycle.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const out = process.env.SHOTS || path.resolve(root, 'output/lower-secondary-integration');
mkdirSync(out, { recursive: true });
const { api: API_PORT, appOn: ON_PORT, appOff: OFF_PORT } = PORTS;
const base = `http://127.0.0.1:${ON_PORT}`, apiBase = `http://127.0.0.1:${API_PORT}`;
process.env.VITE_API_MODE = 'live';

await withCleanup(async (defer) => {
await requireFreePorts([API_PORT, ON_PORT, OFF_PORT]);
const STORAGE_BUCKET = 'demo-hearisland-local.appspot.com';
const server = spawn('node', ['server/emulator-index.js'], { cwd: root, env: { ...process.env, PORT: String(API_PORT), NODE_ENV: 'test', FIREBASE_STORAGE_BUCKET: STORAGE_BUCKET, ALLOW_DRAFT_MISSIONS: 'true', GEMINI_API_KEY: '' }, stdio: ['ignore', 'pipe', 'pipe'] });
defer(() => stopChild(server));
const serverLog = [];
let serverError = null;
server.on('error', (error) => { serverError = error; });
server.stdout.on('data', (d) => serverLog.push(String(d)));
server.stderr.on('data', (d) => serverLog.push(String(d)));
for (let i = 0; ; i++) {
  if (serverError || server.exitCode !== null || server.signalCode !== null) throw new Error(`Our API process failed to start: ${serverError || server.exitCode}\n${serverLog.join('')}`);
  if (serverLog.join('').includes(`Emulator Server running on http://localhost:${API_PORT}`)) break;
  if (i > 60) throw new Error(`API did not start:\n${serverLog.join('')}`);
  await new Promise((r) => setTimeout(r, 500));
}
process.env.FIREBASE_STORAGE_BUCKET = STORAGE_BUCKET;
const vite = (port) => createServer({ configFile: path.join(here, 'vite.config.js'), server: { port }, logLevel: 'error' });
process.env.LS_CONTRACT = 'on';
const onServer = await vite(ON_PORT); defer(() => onServer.close()); await onServer.listen();
process.env.LS_CONTRACT = 'off';
const offServer = await vite(OFF_PORT); defer(() => offServer.close()); await offServer.listen();

// The catalog is TypeScript-flavoured, so it loads through Vite rather than plain Node.
const { PROGRAMS } = await onServer.ssrLoadModule('/src/features/pbl/programs/catalog.js');
const { hydrateProgress, programProgress } = await onServer.ssrLoadModule('/src/features/pbl/programs/progress.js');
const program = PROGRAMS.find((p) => !p.sharesPhasesWith && p.sessions?.length >= 4);
const progressFor = (p) => ({ version: 1, programId: p.id, sessionKeys: 'course', startedAt: Date.now() - 1000, updatedAt: Date.now() - 1000, tools: {}, badges: [],
  sessions: Object.fromEntries(p.sessions.slice(0, 2).map((s) => [s.sessionNumber, { done: true, choice: null, reflection: '', steps: (s.activities || []).map((_, i) => i), confidence: null }])) });
const expected = programProgress(hydrateProgress(progressFor(program), program), program);
const { accounts, adminToken, call, overrides, db } = await seed(apiBase, program, progressFor);
const A = accounts;
const countLabel = `${expected.done} of ${expected.total} sessions marked complete`;

const browser = await puppeteer.launch({ executablePath: process.env.LS_CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
defer(() => browser.close());
const production = [], pageErrors = [], apiCalls = [], meResponses = [], consoleLog = [];
const LIVE_HOSTS = ['https://*.googleapis.com/*', 'https://*.firebaseio.com/*', 'https://*.firebaseapp.com/*', 'https://*.cloudfunctions.net/*', 'https://*.web.app/*'];
let context, page, cdp, extraBlocks = [];
const blockLive = (extra = extraBlocks) => { extraBlocks = extra; return cdp.send('Network.setBlockedURLs', { urls: [...LIVE_HOSTS, ...extra] }); };
// Each sign-in gets a clean browser: no saved session, connections or local copies from the last account,
// so saved progress can only come from the account. The account-switching check stays on one page on purpose.
async function freshPage() {
  await context?.close().catch(() => {});
  context = await browser.createBrowserContext();
  page = await context.newPage();
  await page.setViewport({ width: 1440, height: 1024 });
  page.on('pageerror', (e) => pageErrors.push(e.message));
  page.on('console', (m) => { const t = m.text(); if (/firestore|offline|permission|\[PBL\]|courses|backend/i.test(t) && ['warn', 'warning', 'error'].includes(m.type())) consoleLog.push(`${new Date().toISOString().slice(14, 23)} ${t.slice(0, 220)}`); });
  // Chrome's own blocking, not request interception, which stalls Firestore's long-lived connections.
  cdp = await page.createCDPSession();
  await cdp.send('Network.enable');
  await blockLive();
  page.on('request', (req) => {
    const url = req.url();
    if (/^http:\/\/(127\.0\.0\.1|localhost)[:/]/.test(url)) {
      const { pathname } = new URL(url);
      if (pathname.startsWith('/api/')) apiCalls.push(`${req.method()} ${pathname}`);
      return;
    }
    // Blocked above, and still recorded here: any of these would have been a production Firebase call.
    if (/dnd-master|firestore\.googleapis|identitytoolkit|securetoken|firebasestorage|firebaseinstallations|cloudfunctions/.test(url)) production.push(url);
  });
  page.on('response', async (res) => { if (res.url().endsWith('/api/me') && res.request().method() === 'GET') { try { meResponses.push(await res.json()); } catch { /* preflight */ } } });
}
await freshPage();
// Let each server finish optimizing its dependencies before any check signs in.
for (const origin of [base, `http://127.0.0.1:${OFF_PORT}`]) {
  await page.goto(`${origin}/?emulators=1`, { waitUntil: 'networkidle0', timeout: 120000 });
  await page.waitForSelector('#li-password', { timeout: 60000 });
}
const results = [];
const only = process.env.LS_ONLY ? new RegExp(process.env.LS_ONLY) : null;
// One retry: the emulator's Firestore connection sometimes stalls for tens of seconds. Anything
// that needed it is reported by name, never counted as a clean pass.
const retried = [], retryAttempts = [];
defer(() => writeFileSync(path.join(out, 'api-server.log'), serverLog.join('')));
const check = async (name, fn) => {
  if (only && !only.test(name)) return;
  for (let attempt = 1; ; attempt++) {
    const started = Date.now();
    const logged = consoleLog.length;
    try {
      if (serverError || server.exitCode !== null || server.signalCode !== null) throw new Error(`Test API exited: ${serverError || server.exitCode}\n${serverLog.join('').slice(-2000)}`);
      await fn();
      results.push(['ok', name]);
      if (attempt > 1) retried.push(name);
      console.log(`ok - ${name} (${Math.round((Date.now() - started) / 1000)}s${attempt > 1 ? ', on retry' : ''})`);
      return;
    } catch (e) {
      await page.screenshot({ path: path.join(out, `fail-${results.length + 1}-try${attempt}.png`) }).catch(() => {});
      const stalled = consoleLog.slice(logged).some((line) => /client is offline|Could not reach Cloud Firestore/.test(line));
      console.log(`${attempt < 2 ? 'retrying' : 'FAIL'} - ${name}${stalled ? ' [Firestore stall logged]' : ''}\n  ${String(e.message).slice(0, 400)}`);
      if (attempt < 2) retryAttempts.push(name);
      if (attempt >= 2) { results.push(['FAIL', name, e.message]); return; }
    }
  }
};
const LAYOUT = () => page.evaluate(() => (document.querySelector('.ls-shell') ? 'shell' : document.querySelector('.md-root') ? 'existing' : document.querySelector('.jx') ? 'junior' : null));
const waitLayout = async () => { await page.waitForFunction(() => document.querySelector('.ls-shell, .md-root, .jx'), { timeout: 30000 }); return LAYOUT(); };
const hasText = (selector, text) => page.$eval(selector, (el, t) => el.textContent.includes(t), text);
const waitText = (selector, text, timeout = 15000) => page.waitForFunction((s, t) => document.querySelector(s)?.textContent.includes(t), { timeout }, selector, text);
const signedOutForm = () => page.waitForSelector('#li-password', { timeout: 30000 });
const open = async (hash = '', origin = base) => { await page.goto('about:blank'); await page.goto(`${origin}/?emulators=1${hash}`, { waitUntil: 'domcontentloaded' }); };
const skipTour = (uid) => page.evaluate((u) => { localStorage.setItem(`spark_tour_completed_${u}`, 'true'); }, uid);
const fill = async (account) => {
  await signedOutForm();
  await skipTour(account.uid);
  await page.$eval('input[type=email]', (el) => el.focus());
  await page.click('input[type=email]', { clickCount: 3 }); await page.keyboard.type(account.email);
  await page.click('#li-password', { clickCount: 3 }); await page.keyboard.type(PASSWORD);
  await page.click('button[type=submit]');
};
const signOut = async () => { await page.evaluate(() => window.firebase.auth().signOut()); await signedOutForm(); };
const signIn = async (account, hash = '', origin = base) => {
  await freshPage();
  await open(hash, origin);
  meResponses.length = 0; apiCalls.length = 0;
  await fill(account);
  return waitLayout();
};
const lastMe = () => meResponses.at(-1);

  await check('the three override writes behave as agreed through the real admin API', async () => {
    assert.equal(overrides.on.status, 200, JSON.stringify(overrides.on.body));
    assert.equal(overrides.off.status, 200, JSON.stringify(overrides.off.body));
    assert.equal(overrides.under.status, 400, `under-11 override must be refused, got ${overrides.under.status}`);
  });

  const MATRIX = [
    ['Age11', 'shell', 'lower-secondary', 'eligible'], ['Age14', 'shell', 'lower-secondary', 'eligible'], ['ClassOnly', 'shell', 'lower-secondary', 'eligible'],
    ['Age11Primary', 'shell', 'lower-secondary', 'eligible'], ['OverrideOn', 'shell', 'lower-secondary', 'staff-override'],
    ['Age15', 'existing', 'existing', 'older'], ['Age17', 'existing', 'existing', 'older'], ['NoAge', 'existing', 'existing', 'missing'], ['BadDob', 'existing', 'existing', 'invalid'],
    ['Legacy', 'existing', 'existing', 'ambiguous'], ['SelfEnrolled', 'existing', 'existing', null], ['OverrideOff', 'existing', 'existing', 'staff-override'],
    ['Age10', 'junior', 'existing', 'outside-rollout'], ['OverrideUnder', 'junior', 'existing', 'outside-rollout']
  ];
  for (const [key, layout, serverLayout, reason] of MATRIX) {
    await check(`real sign-in: ${key} → ${layout}${reason ? ` (${reason})` : ''}`, async () => {
      const got = await signIn(A[key]);
      assert.equal(got, layout);
      await page.waitForFunction(() => true);
      const me = lastMe();
      assert(me, 'GET /api/me was called');
      assert.equal(me.uid, A[key].uid);
      assert.equal(me.layoutSelection.layout, serverLayout);
      if (reason) assert.equal(me.layoutSelection.reason, reason);
    });
  }

  await check('as shipped (flag off): an eligible learner keeps the existing layout and /api/me is never requested', async () => {
    const got = await signIn(A.Age14, '', `http://127.0.0.1:${OFF_PORT}`);
    assert.equal(got, 'existing');
    assert.equal(apiCalls.includes('GET /api/me'), false);
    await signOut();
  });

  await check('refresh and direct links stay on the section; deep link survives sign-in', async () => {
    assert.equal(await signIn(A.Age14, '#/dashboard/portfolio'), 'shell');
    await page.waitForSelector('.ls-portfolio');
    assert(await hasText('h1', 'My Portfolio'));
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.ls-portfolio', { timeout: 30000 });
    await page.goto(`${base}/?emulators=1#/dashboard/universe`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.ls-worlds', { timeout: 30000 });
  });

  await check('a 15+ learner on a shell address gets the existing dashboard', async () => {
    assert.equal(await signIn(A.Age15, '#/dashboard/learning'), 'existing');
  });

  await check('account switching without reload: no layout or data carries over', async () => {
    assert.equal(await signIn(A.Age14), 'shell');
    await waitText('.ls-hero', program.title);
    await page.click('[role=switch]');
    await page.waitForSelector('.ls-calm');
    await page.click('.ls-account button');
    await page.click('#ls-account button');
    await signedOutForm();
    assert.equal(await page.$('.ls-shell'), null, 'shell gone after sign-out');
    await fill(A.Age15);
    assert.equal(await waitLayout(), 'existing');
    assert.equal((await page.content()).includes(program.title), false, 'no course of the previous learner');
    await signOut();
    await fill(A.Age11);
    assert.equal(await waitLayout(), 'shell');
    await page.waitForFunction(() => document.querySelector('.ls-hero[aria-busy=false]'));
    assert.equal(await hasText('.ls-hero', program.title), false);
    assert.equal(await page.$('.ls-calm'), null, 'Calm mode is per account');
    assert.equal(await page.$eval('.ls-top', (el) => el.textContent.includes('A')), true);
    await signOut();
    await fill(A.Age14);
    assert.equal(await waitLayout(), 'shell');
    await page.waitForSelector('.ls-calm');
    await page.click('[role=switch]');
    await new Promise((r) => setTimeout(r, 3200)); // let the debounced account save finish
  });

  await check('dashboard shows the active quest and server XP; Continue opens the exact next session', async () => {
    assert.equal(await signIn(A.Age14), 'shell');
    await waitText('.ls-hero', program.title);
    assert(await hasText('.ls-hero', 'Continue your quest'));
    assert(await hasText('.ls-hero', expected.next.title), `hero names the next session: ${expected.next.title}`);
    assert(await hasText('.ls-hero', countLabel));
    await waitText('.ls-progress', 'Level 3 Investigator');
    assert(await hasText('.ls-progress', '262 / 380 XP'));
    assert(await hasText('.ls-progress', 'First Evidence'));
    assert.equal(await page.$eval('.ls-hero a', (el) => el.getAttribute('href')), `#/pbl/programs/${program.id}/plan`);
    await page.screenshot({ path: path.join(out, 'continue-before.png') });
    await page.click('.ls-hero a');
    await page.waitForSelector(`#pg-session-${expected.next.sessionNumber}`, { timeout: 30000 });
    await page.waitForFunction((n) => document.querySelector(`#pg-session-${n} .pg-session-toggle`)?.getAttribute('aria-expanded') === 'true', { timeout: 15000 }, expected.next.sessionNumber);
    assert(await hasText(`#pg-session-${expected.next.sessionNumber}`, expected.next.title));
    await page.screenshot({ path: path.join(out, 'continue-after-next-session.png') });
  });

  await check('with no course, the dashboard shows the server quest and Continue opens its phase', async () => {
    const tok = await token(A.Age11.email);
    const view = await call('GET', '/api/quest/me', tok);
    assert.equal(view.status, 200);
    const step = view.body.todaysQuest;
    assert(step?.task, 'server returned a quest');
    assert.equal(await signIn(A.Age11), 'shell');
    await waitText('.ls-hero', 'Today’s quest');
    assert(await hasText('.ls-hero', step.task));
    await page.click('.ls-hero a');
    await page.waitForFunction(() => location.hash === '#/pbl/project');
    await page.waitForFunction(() => !document.querySelector('.ls-shell'), { timeout: 15000 });
    await page.waitForFunction((t) => document.body.textContent.includes(t), { timeout: 20000 }, step.task);
    assert(await page.evaluate((t) => document.body.textContent.includes(t), step.phaseTitle), `phase ${step.phaseTitle} shown`);
  });

  await check('progress parity: same record in both sections and in the existing layout after a staff override', async () => {
    assert.equal(await signIn(A.Age14), 'shell');
    await waitText('.ls-hero', countLabel);
    await page.click('.ls-nav a[href="#/dashboard/learning"]');
    await waitText('.ls-courses', countLabel);
    const patched = await call('PATCH', `/api/admin/users/${A.Age14.uid}`, adminToken, { layoutOverride: 'existing' });
    assert.equal(patched.status, 200, JSON.stringify(patched.body));
    await page.goto(`${base}/?emulators=1#/dashboard`, { waitUntil: 'domcontentloaded' });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.md-root', { timeout: 30000 });
    await page.waitForFunction((label) => document.documentElement.outerHTML.includes(label), { timeout: 20000 }, countLabel);
    const restored = await call('PATCH', `/api/admin/users/${A.Age14.uid}`, adminToken, { layoutOverride: null });
    assert.equal(restored.status, 200, JSON.stringify(restored.body));
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.ls-shell', { timeout: 30000 });
  });

  await check('8-stage checklist: a stage tick saves to the learner\'s real term project and survives a reload', async () => {
    assert.equal(await signIn(A.Age11, '#/dashboard/learning'), 'shell');
    await page.waitForSelector('.ls-eight-stages .ls-stage-checks button[role=checkbox]');
    await page.waitForFunction(() => document.querySelector('.ls-eight-stages .ls-stage-tile-btn[aria-current=step]'));
    const first = '.ls-eight-stages .ls-stage-checks button[role=checkbox]';
    // Safe to retry: a previous attempt may already have ticked it.
    if (await page.$eval(first, (el) => el.getAttribute('aria-checked')) === 'false') await page.click(first);
    await page.waitForFunction((s) => document.querySelector(s).getAttribute('aria-checked') === 'true', {}, first);
    const term = await onServer.ssrLoadModule('/src/features/pbl/content/pblModel.js');
    const ref = db.collection('users').doc(A.Age11.uid).collection('activityProgress').doc(`pbl-${term.TERM.id}`);
    let saved = null;
    for (let i = 0; i < 20 && !saved; i++) { const snap = await ref.get(); saved = snap.data()?.tasksDone?.[term.PHASES[0].id]?.includes(0) ? snap.data() : null; if (!saved) await new Promise((r) => setTimeout(r, 500)); }
    assert(saved, 'the tick reached the term project record');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector(first, { timeout: 30000 });
    await page.waitForFunction((s) => document.querySelector(s).getAttribute('aria-checked') === 'true', { timeout: 15000 }, first);
  });

  await check('8-stage checklist: completing a mission updates the card, the dashboard and the course record', async () => {
    const courseRecord = db.collection('users').doc(A.Age14.uid).collection('activityProgress').doc(`pbl-program-${program.id}`);
    await courseRecord.set(progressFor(program)); // safe to retry
    assert.equal(await signIn(A.Age14, '#/dashboard/learning'), 'shell');
    await waitText('.ls-course', countLabel);
    const after = `${expected.done + 1} of ${expected.total} sessions marked complete`;
    await page.waitForSelector('.ls-mission-done-btn:not(.is-done)');
    await page.click('.ls-mission-done-btn:not(.is-done)');
    await waitText('.ls-course', after);
    await page.click('.ls-nav a[href="#/dashboard"]');
    await waitText('.ls-hero', after);
    const ref = db.collection('users').doc(A.Age14.uid).collection('activityProgress').doc(`pbl-program-${program.id}`);
    let stored = null;
    for (let i = 0; i < 20 && !stored; i++) { const data = (await ref.get()).data(); stored = data?.sessions?.[expected.next.sessionNumber]?.done ? data : null; if (!stored) await new Promise((r) => setTimeout(r, 500)); }
    assert(stored, 'the mission reached the course record');
    // Put the record back for the checks that follow. The page goes first so its pending save can't overwrite it.
    await page.goto('about:blank');
    await new Promise((r) => setTimeout(r, 500));
    await ref.set(progressFor(program));
  });

  await check('catalog: adding a course creates the real enrolment and it appears in My courses', async () => {
    assert.equal(await signIn(A.CatalogUser, '#/dashboard/learning'), 'shell');
    await page.waitForSelector('.ls-catalog-drawer summary');
    await page.click('.ls-catalog-drawer summary');
    const title = await page.$eval('.ls-catalog-card h3', (el) => el.textContent);
    // A retry finds the course already added: enrolling is idempotent, so there's nothing more to click.
    if (await page.$('.ls-catalog-card:first-child button')) await page.click('.ls-catalog-card:first-child button');
    await waitText('.ls-courses', title, 25000);
    const rows = await db.collection('enrolments').where('learnerId', '==', A.CatalogUser.uid).get();
    assert.equal(rows.size, 1, 'one enrolment for this learner');
  });

  await check('every More item opens a real screen, and the app can return to the shell', async () => {
    assert.equal(await signIn(A.Age14), 'shell');
    await page.click('.ls-more button');
    const links = await page.$$eval('#ls-more a', (els) => els.map((el) => [el.getAttribute('href'), el.textContent]));
    assert(links.length >= 10, `only ${links.length}`);
    for (const [, label] of links) {
      if (!(await page.$('.ls-shell'))) { await page.evaluate(() => { location.hash = '#/dashboard'; }); await page.waitForSelector('.ls-shell', { timeout: 20000 }); }
      if (!(await page.$('#ls-more'))) await page.click('.ls-more button');
      await page.evaluate((text) => [...document.querySelectorAll('#ls-more a')].find((a) => a.textContent === text).click(), label);
      await new Promise((r) => setTimeout(r, 500));
      assert.equal(await page.evaluate(() => document.body.innerText.trim().length > 30), true, `${label} is blank`);
      await page.waitForFunction(() => location.hash && location.hash !== '#/dashboard', { timeout: 5000 });
    }
    await page.evaluate(() => { location.hash = '#/dashboard'; });
    await page.waitForSelector('.ls-shell', { timeout: 20000 });
  });

  await check('a primary account in the shell keeps its gates', async () => {
    assert.equal(await signIn(A.Age11Primary), 'shell');
    await page.waitForSelector('.ls-hero');
    assert.equal(apiCalls.some((c) => c.includes('/api/quest') || c.includes('learning-context')), false, apiCalls.join());
    assert.equal(await page.$('.ls-help'), null);
    await page.click('.ls-more button');
    assert.deepEqual(await page.$$eval('#ls-more a', (els) => els.map((el) => el.getAttribute('href'))), ['#/primary-resources', '#/settings']);
    await page.evaluate(() => { location.hash = '#/dashboard/learning'; });
    await page.waitForSelector('.ls-embed .jx', { timeout: 20000 });
    assert.equal(await page.$('.ls-eight-stages, .ls-catalog-drawer'), null, 'no secondary checklist or catalog');
    await page.evaluate(() => { location.hash = '#/courses'; });
    await page.waitForFunction(() => !document.querySelector('.ls-shell') && document.querySelector('.jx'), { timeout: 20000 });
    await page.evaluate(() => { location.hash = '#/goals'; });
    await page.waitForFunction(() => !document.querySelector('.ls-shell') && document.querySelector('.jx'), { timeout: 20000 });
    await page.evaluate(() => { location.hash = '#/dashboard/universe'; });
    await page.waitForSelector('.ls-shell', { timeout: 20000 });
    assert.equal(await page.$('.ls-world'), null);
  });

  let reflectionId, uploadedTitle = 'Synthetic pond photo';
  await check('portfolio: reflection saves privately and survives a reload', async () => {
    assert.equal(await signIn(A.Age14, '#/dashboard/portfolio'), 'shell');
    await page.waitForSelector('.ls-empty-card, .ls-work');
    await page.click('.ls-reflect button');
    await page.waitForSelector('dialog textarea');
    await page.type('dialog textarea', 'I fixed the wiring by myself and learned why the sensor drifted.');
    await page.click('dialog button[type=submit]');
    await page.waitForFunction(() => !document.querySelector('dialog') && document.querySelectorAll('.ls-work').length >= 1, { timeout: 15000 });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.ls-work', { timeout: 30000 });
    assert(await hasText('.ls-work', 'Private'));
    await page.click('.ls-work button');
    await waitText('dialog', 'fixed the wiring');
    await page.keyboard.press('Escape');
    const space = await call('GET', '/api/learner-space', await token(A.Age14.email));
    reflectionId = space.body.items[0];
    assert.deepEqual(reflectionId.audiences, []);
  });

  await check('portfolio: a real upload through the existing editor reaches Storage and the shell card', async () => {
    const png = path.join(out, 'synthetic.png');
    writeFileSync(png, Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64'));
    await page.evaluate(() => { location.hash = '#/portfolio'; });
    await page.waitForSelector('.lp-work-editor', { timeout: 30000 });
    const kind = await page.evaluateHandle(() => [...document.querySelectorAll('.lp-work-editor label')].find((l) => l.textContent.includes('Work type')).querySelector('select'));
    await kind.select('image');
    const title = await page.evaluateHandle(() => [...document.querySelectorAll('.lp-work-editor label')].find((l) => l.textContent.includes('Work title')).querySelector('input'));
    await title.type(uploadedTitle);
    const file = await page.evaluateHandle(() => [...document.querySelectorAll('.lp-work-editor label')].find((l) => l.textContent.includes('Upload work')).querySelector('input'));
    await file.uploadFile(png);
    await page.waitForFunction(() => document.querySelector('.lp-work-editor')?.textContent.includes('Attached:') || document.querySelector('.lp-error'), { timeout: 30000 });
    assert.equal(await page.$('.lp-error'), null, await page.$eval('.lp-error', (el) => el.textContent).catch(() => ''));
    await page.evaluate(() => [...document.querySelectorAll('.lp-work-editor button[type=submit]')][0].click());
    await page.waitForFunction((t) => [...document.querySelectorAll('.lp-entry')].some((e) => e.textContent.includes(t)), { timeout: 20000 }, uploadedTitle);
    await page.evaluate(() => { location.hash = '#/dashboard/portfolio'; });
    await waitText('.ls-work-grid', uploadedTitle);
    // The emulator can't sign Storage URLs without credentials, so the server returns an empty one
    // by design and the card falls back to its art. The file and its record are what's checked here.
    const stored = (await call('GET', '/api/learner-space', await token(A.Age14.email))).body.items.find((i) => i.title === uploadedTitle);
    assert.equal(stored.kind, 'image');
    assert.equal(stored.media.name, 'synthetic.png');
    assert.equal(await page.$eval('.ls-work-grid', (el) => [...el.querySelectorAll('.ls-work')].find((w) => w.textContent.includes('Synthetic pond photo')).textContent.includes('Private')), true);
  });

  await check('student isolation: private work, shared work and another school through the real API', async () => {
    const owner = await token(A.Age14.email), classmate = await token(A.Age11.email), outsider = await token(A.Outsider.email);
    const space = await call('GET', '/api/learner-space', owner);
    const privateItem = space.body.items.find((i) => i.kind === 'writing');
    assert(privateItem);
    const before = await call('GET', `/api/learner-portfolios/${A.Age14.uid}`, classmate);
    assert((before.body?.items || []).every((i) => i.id !== privateItem.id), 'private work hidden from a classmate');
    const shared = await call('PATCH', `/api/learner-space/items/${privateItem.id}`, owner, { ...privateItem, audiences: ['classmates'] });
    assert.equal(shared.status, 200, JSON.stringify(shared.body));
    const after = await call('GET', `/api/learner-portfolios/${A.Age14.uid}`, classmate);
    assert.equal(after.status, 200);
    assert(after.body.items.some((i) => i.id === privateItem.id), 'shared work visible to a classmate');
    const other = await call('GET', `/api/learner-portfolios/${A.Age14.uid}`, outsider);
    assert((other.body?.items || []).every((i) => i.id !== privateItem.id), `no access from another school (${other.status})`);
    const meA = await call('GET', '/api/me', classmate);
    assert.equal(meA.body.uid, A.Age11.uid);
    assert.equal(JSON.stringify(meA.body).includes(A.Age14.uid), false);
  });

  await check('student isolation: browser rules deny another learner\'s records and all layout authority', async () => {
    assert.equal(await signIn(A.Age11), 'shell');
    const results = await page.evaluate(async (other, me, pid) => {
      const fs = window.firebase.firestore();
      const attempt = async (fn) => { try { await fn(); return 'allowed'; } catch (e) { return e.code; } };
      return {
        otherProgress: await attempt(() => fs.doc(`users/${other}/activityProgress/pbl-program-${pid}`).get()),
        otherAuthority: await attempt(() => fs.doc(`userLayoutAuthority/${other}`).get()),
        ownAuthorityRead: await attempt(() => fs.doc(`userLayoutAuthority/${me}`).get()),
        ownAuthorityWrite: await attempt(() => fs.doc(`userLayoutAuthority/${me}`).set({ layoutOverride: 'lower-secondary' }))
      };
    }, A.Age14.uid, A.Age11.uid, program.id);
    assert.deepEqual(results, { otherProgress: 'permission-denied', otherAuthority: 'permission-denied', ownAuthorityRead: 'permission-denied', ownAuthorityWrite: 'permission-denied' });
  });

  await check('spoofing: self-written age, band and override, storage and URL parameters give no new layout', async () => {
    assert.equal(await signIn(A.Spoofer), 'existing');
    const wrote = await page.evaluate(async (uid) => {
      try { await window.firebase.firestore().doc(`users/${uid}`).set({ dateOfBirth: '2014-01-15', ageBand: '13-15', cohort: 'lower-secondary', yearLevel: 8, layoutOverride: 'lower-secondary', layoutSelection: { contractVersion: 1, layout: 'lower-secondary', reason: 'eligible', verified: true, age: 12 } }, { merge: true }); return 'written'; } catch (e) { return e.code; }
    }, A.Spoofer.uid);
    await page.evaluate(() => { localStorage.setItem('layoutSelection', '{"layout":"lower-secondary"}'); localStorage.setItem('layout', 'lowerSecondary'); });
    await page.goto(`${base}/?emulators=1&layout=lowerSecondary&learner=age14#/dashboard`, { waitUntil: 'domcontentloaded' });
    assert.equal(await waitLayout(), 'existing', `after self-write (${wrote})`);
    await page.waitForFunction(() => true);
    assert.equal(lastMe().layoutSelection.layout, 'existing');
    console.log(`  note: self-write under the current rules was ${wrote}`);
  });

  await check('a failed /api/me keeps the existing layout', async () => {
    await blockLive(['*/api/me']);
    try { assert.equal(await signIn(A.Age14), 'existing'); }
    finally { await blockLive([]); }
  });

  await check('real screenshots: four sections at desktop, tablet and mobile', async () => {
    assert.equal(await signIn(A.Age14), 'shell');
    for (const [size, width, height, mobile] of [['desktop', 1440, 1024, false], ['tablet', 768, 1024, false], ['mobile', 390, 844, true]]) {
      await page.setViewport({ width, height, isMobile: mobile, hasTouch: mobile });
      for (const [section, hash, ready] of [['dashboard', '#/dashboard', '.ls-hero[aria-busy=false]'], ['learning', '#/dashboard/learning', '.ls-course'], ['universe', '#/dashboard/universe', '.ls-continue-item'], ['portfolio', '#/dashboard/portfolio', '.ls-section-head']]) {
        await page.evaluate((h) => { location.hash = h; }, hash);
        await page.waitForSelector(ready, { timeout: 20000 });
        await new Promise((r) => setTimeout(r, 400));
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${section} ${size} overflows`);
        const tall = await page.evaluate(() => document.documentElement.scrollHeight);
        await page.setViewport({ width, height: Math.max(height, tall), isMobile: mobile, hasTouch: mobile });
        await page.screenshot({ path: path.join(out, `${section}-${size}.png`) });
        await page.setViewport({ width, height, isMobile: mobile, hasTouch: mobile });
      }
    }
    await page.setViewport({ width: 1440, height: 1024 });
  });

  await check('no production Firebase request was attempted in the whole run', async () => {
    assert.deepEqual(production, []);
  });
const failed = results.filter(([s]) => s === 'FAIL');
console.log(`\n${results.length - failed.length} of ${results.length} integration checks passed (${retryAttempts.length} retry attempts; ${retried.length} passed on retry).`);
for (const name of retried) console.log(`RETRIED: ${name}`);
for (const [, name, message] of failed) console.log(`FAILED: ${name}\n  ${String(message).slice(0, 400)}`);
if (consoleLog.length) console.log(`Console (${consoleLog.length}):\n${[...new Set(consoleLog)].slice(-25).join('\n')}`);
if (pageErrors.length) console.log(`Page errors (${pageErrors.length}):\n${[...new Set(pageErrors)].slice(0, 12).join('\n').slice(0, 2000)}`);
writeFileSync(path.join(out, 'results.json'), JSON.stringify({ results, retryAttempts, retried, pageErrors: [...new Set(pageErrors)] }, null, 1));
process.exitCode = failed.length ? 1 : 0;
}).catch((error) => {
  console.error(error);
  writeFileSync(path.join(out, 'startup-error.txt'), String(error.stack || error));
  process.exitCode = 1;
});
