/**
 * Browser checks and screenshots for the offline fixture preview:
 *   node tests/lower-secondary-preview/check.mjs
 * Starts its own server for the length of the run, unless PREVIEW_URL names one.
 * Any request leaving the preview's origin fails the run. Screenshots prove the
 * layout with synthetic records; they prove nothing about production integrations.
 */
import puppeteer from 'puppeteer-core';
import { createServer } from 'vite';
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const server = process.env.PREVIEW_URL ? null : await createServer({ configFile: path.join(here, 'vite.config.js'), server: { port: 5199, strictPort: true }, logLevel: 'error' });
await server?.listen();
const base = process.env.PREVIEW_URL || 'http://127.0.0.1:5199';
const out = process.env.SHOTS || path.resolve('output/lower-secondary-preview');
mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const page = await browser.newPage();
const errors = [], external = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (message) => { if (message.type() === 'error' && !/favicon|404/.test(message.text())) errors.push(message.text()); });
await page.setRequestInterception(true);
page.on('request', (request) => {
  const url = request.url();
  if (url.startsWith(base) || url.startsWith('data:') || url.startsWith('blob:')) request.continue();
  else { external.push(url); request.abort(); }
});
let passed = 0;
const check = async (name, fn) => { await fn(); passed += 1; console.log(`ok - ${name}`); };
const open = async (query = '', hash = '#/dashboard') => {
  await page.goto('about:blank');
  await page.goto(`${base}/?${query}${hash}`, { waitUntil: 'networkidle2' });
  await page.waitForSelector('[data-testid=fixture-label]');
};
const hasText = (selector, text) => page.$eval(selector, (el, t) => el.textContent.includes(t), text);
const selection = () => page.$eval('[data-testid=selection]', (el) => el.textContent);
const noOverflow = (label) => page.evaluate(() => ({ doc: document.documentElement.scrollWidth, win: innerWidth })).then(({ doc, win }) => assert(doc <= win, `${label}: page is ${doc}px wide in a ${win}px window`));
const smallTargets = () => page.evaluate(() => [...document.querySelectorAll('.ls-shell a, .ls-shell button')].filter((el) => {
  if (el.closest('p') || el.classList.contains('ls-skip')) return false; // inline links in a sentence are exempt
  const box = el.getBoundingClientRect(); return box.width > 0 && box.height < 40;
}).map((el) => el.textContent.trim().slice(0, 30)));

const SECTIONS = { dashboard: '#/dashboard', learning: '#/dashboard/learning', universe: '#/dashboard/universe', portfolio: '#/dashboard/portfolio' };
const WIDTHS = { desktop: [1440, 1024], tablet: [768, 1024], mobile: [390, 844] };
try {
  await check('all four sections fit and are screenshotted at every width, offline', async () => {
    for (const [size, [width, height]] of Object.entries(WIDTHS)) {
      await page.setViewport({ width, height, isMobile: size === 'mobile', hasTouch: size === 'mobile' });
      for (const [section, hash] of Object.entries(SECTIONS)) {
        await open('', hash);
        await page.waitForSelector(`.ls-nav a[aria-current=page][href="${hash}"]`);
        await noOverflow(`${section} ${size}`);
        assert.deepEqual(await smallTargets(), [], `${section} ${size}: touch targets under 40px`);
        // Grow the window rather than use fullPage, so fixed bars sit where a learner sees them.
        const tall = await page.evaluate(() => document.documentElement.scrollHeight);
        await page.setViewport({ width, height: Math.max(height, tall), isMobile: size === 'mobile', hasTouch: size === 'mobile' });
        await page.screenshot({ path: path.join(out, `${section}-${size}.png`) });
        await page.setViewport({ width, height, isMobile: size === 'mobile', hasTouch: size === 'mobile' });
      }
    }
    await page.setViewport({ width: 1440, height: 1024 });
  });

  await check('selection matrix: only eligible accounts get the shell', async () => {
    const expected = { age11: 'eligible', age14: 'eligible', age11primary: 'eligible', overrideOn: 'override-lower-secondary', age15: 'older', older: 'older', under11: 'outside-rollout', missing: 'missing', invalid: 'invalid', ambiguous: 'ambiguous', unverified: 'missing', overrideOff: 'override-existing', overrideUnder: 'outside-rollout' };
    for (const [learner, reason] of Object.entries(expected)) {
      await open(`learner=${learner}`);
      assert((await selection()).includes(`(${reason})`), `${learner}: ${await selection()}`);
      const shell = await page.$('.ls-shell');
      assert.equal(!!shell, ['eligible', 'override-lower-secondary'].includes(reason), `${learner} shell`);
    }
  });

  await check('reload and deep link keep the section', async () => {
    await open('', '#/dashboard/universe');
    assert(await hasText('h1', 'My Universe'));
    await page.reload({ waitUntil: 'networkidle2' });
    assert(await hasText('h1', 'My Universe'));
  });

  await check('a non-shell route stays with its own screen', async () => {
    await open('', '#/courses');
    assert.equal(await page.$('.ls-shell'), null);
  });

  await check('keyboard: skip link, visible focus, More menu opens and Escape returns focus', async () => {
    await open();
    await page.focus('.ls-skip');
    assert.equal(await page.evaluate(() => document.activeElement.className), 'ls-skip');
    await page.focus('.ls-more button');
    await page.keyboard.press('Enter');
    await page.waitForSelector('#ls-more');
    assert(await page.$eval('#ls-more', (el) => el.querySelectorAll('a').length >= 10));
    await page.screenshot({ path: path.join(out, 'more-menu-desktop.png') });
    await page.keyboard.press('Tab');
    assert(await page.evaluate(() => !!document.activeElement.closest('#ls-more')));
    const outline = await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle);
    assert.notEqual(outline, 'none', 'focus ring visible');
    await page.keyboard.press('Escape');
    assert.equal(await page.$('#ls-more'), null);
    assert(await page.evaluate(() => document.activeElement.classList.contains('ls-disclosure-button')));
  });

  await check('mobile bottom bar and More menu fit', async () => {
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await open();
    await page.tap('.ls-more button');
    await page.waitForSelector('#ls-more');
    await noOverflow('more mobile');
    await page.screenshot({ path: path.join(out, 'more-menu-mobile.png') });
    await page.setViewport({ width: 1440, height: 1024 });
  });

  await check('Calm mode stops motion, reduces density, and is per account', async () => {
    await open();
    const animated = () => page.$$eval('.ls-shell *', (els) => els.filter((el) => getComputedStyle(el).animationName !== 'none').length);
    assert((await animated()) > 0, 'decorative motion on by default');
    await page.click('[role=switch]');
    await page.waitForSelector('.ls-calm');
    assert.equal(await animated(), 0);
    assert.equal(await page.$eval('.ls-hero-art', (el) => getComputedStyle(el).display), 'none');
    await page.screenshot({ path: path.join(out, 'dashboard-calm-desktop.png'), fullPage: true });
    await page.reload({ waitUntil: 'networkidle2' });
    await page.waitForSelector('.ls-calm');
    await open('learner=age11');
    assert.equal(await page.$('.ls-calm'), null, 'another account is unaffected');
    await open();
    await page.waitForSelector('.ls-calm');
    await page.click('[role=switch]');
  });

  await check('prefers-reduced-motion removes animation', async () => {
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    await open();
    assert.equal(await page.$$eval('.ls-shell *', (els) => els.filter((el) => getComputedStyle(el).animationName !== 'none').length), 0);
    await page.emulateMediaFeatures([]);
  });

  await check('quest off, quest failed and quest loading never show numbers', async () => {
    await open('quest=off');
    assert(await hasText('.ls-progress', 'switched on'));
    assert.equal(await hasText('.ls-progress', 'XP'), false);
    assert.equal(await page.evaluate(() => window.__fixtureCalls.includes('GET /api/quest/me')), false);
    await open('quest=error');
    assert(await hasText('.ls-progress', 'couldn’t be loaded'));
    assert.equal(await hasText('.ls-progress', 'Level'), false);
    await page.screenshot({ path: path.join(out, 'state-progress-error.png') });
    await open('quest=loading');
    assert(await hasText('.ls-progress', 'Loading'));
  });

  await check('course states: loading, error with retry, empty, mixed warnings', async () => {
    await open('state=loading', SECTIONS.learning);
    assert(await hasText('.ls-courses', 'Loading'));
    await open('state=error', SECTIONS.learning);
    assert(await page.$('.ls-courses .ls-retry'));
    await page.screenshot({ path: path.join(out, 'state-courses-error.png') });
    await open('state=empty', SECTIONS.learning);
    assert(await hasText('.ls-courses', 'No current project'));
    await open('state=mixed', SECTIONS.learning);
    assert(await hasText('.ls-courses', 'Session numbers were corrected'));
    assert(await hasText('.ls-courses', 'Progress could not be loaded'));
    await page.screenshot({ path: path.join(out, 'state-courses-mixed.png'), fullPage: true });
  });

  await check('progress parity: dashboard and learning show the same record', async () => {
    await open('goals=none');
    await page.waitForFunction(() => document.querySelector('.ls-hero')?.textContent.includes('2 of 6 sessions marked complete'));
    assert.equal(await page.$eval('.ls-hero a', (el) => el.getAttribute('href')), '#/pbl/programs/fixture-river-study/plan');
    await page.click('.ls-nav a[href="#/dashboard/learning"]');
    await page.waitForSelector('.ls-courses');
    assert(await hasText('.ls-courses', '2 of 6 sessions marked complete'));
    assert.equal(await page.evaluate(() => window.__fixtureCalls.filter((c) => c === 'courses').length), 1, 'one shared read');
  });

  await check('continuation links use the real course id', async () => {
    await open('state=empty');
    await open('', SECTIONS.universe);
    assert.equal(await page.$eval('.ls-continue-item', (el) => el.getAttribute('href')), '#/pbl/programs/fixture-river-study/plan');
  });

  await check('portfolio: real items, audiences, view, private reflection, empty and error', async () => {
    await open('', SECTIONS.portfolio);
    await page.waitForSelector('.ls-work');
    assert.equal((await page.$$('.ls-work')).length, 3);
    await page.click('.ls-work button');
    await page.waitForSelector('dialog[open]');
    await page.screenshot({ path: path.join(out, 'portfolio-view-work.png') });
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.querySelector('dialog'));
    await page.click('.ls-reflect button');
    await page.waitForSelector('dialog textarea');
    await page.type('dialog textarea', 'I fixed the wiring by myself today.');
    await page.click('dialog button[type=submit]');
    await page.waitForFunction(() => !document.querySelector('dialog') && document.querySelectorAll('.ls-work').length === 4);
    assert(await hasText('.ls-work', 'Private'));
    await open('space=empty', SECTIONS.portfolio);
    await page.waitForSelector('.ls-empty-card');
    await open('space=error', SECTIONS.portfolio);
    await page.waitForSelector('.ls-retry');
    await page.screenshot({ path: path.join(out, 'state-portfolio-error.png') });
  });

  await check('a new learner sees honest empty states and the join-a-class panel', async () => {
    await open('learner=age12new');
    await page.waitForSelector('.ls-hero');
    assert.equal(await page.$('.ls-dash-main input') !== null, true, 'join a class is offered');
    await page.screenshot({ path: path.join(out, 'state-new-learner.png'), fullPage: true });
  });

  await check('a primary account keeps its gates', async () => {
    await open('learner=age11primary');
    assert.equal(await page.evaluate(() => (window.__fixtureCalls || []).some((c) => c === 'courses' || c.includes('/api/quest'))), false);
    await page.click('.ls-more button');
    assert.deepEqual(await page.$$eval('#ls-more a', (els) => els.map((el) => el.getAttribute('href'))), ['#/primary-resources', '#/settings']);
    await page.keyboard.press('Escape');
    await page.click('.ls-nav a[href="#/dashboard/universe"]');
    await page.waitForFunction(() => document.querySelector('h1')?.textContent === 'My Universe');
    assert.equal(await page.$('.ls-world'), null);
  });

  await check('the development label is always visible, and nothing left the origin', async () => {
    await open();
    assert(await hasText('[data-testid=fixture-label]', 'OFFLINE FIXTURE PREVIEW'));
    assert.deepEqual(external, [], `External requests: ${external.join(', ')}`);
    assert.deepEqual(errors, [], `Page errors: ${errors.join('\n')}`);
  });
  console.log(`\n${passed} checks passed. Screenshots: ${out}`);
} finally {
  await browser.close();
  await server?.close();
}
