#!/usr/bin/env node

/**
 * Capture real screenshots of each app section for the project report.
 *
 * Drives the locally installed Chrome via puppeteer-core (no bundled browser).
 * Requires the Vite dev server to be running on the target URL.
 *
 * Usage:
 *   node scripts/capture-screens.js
 *   BASE_URL=http://localhost:5173 node scripts/capture-screens.js
 */

import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '..', 'docs', 'screenshots');
const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const STUDENT = { email: 'demo.student.report@school.edu', password: 'ReportDemo2026!' };
const COACH = { email: 'demo.coach.report@welearn.org', password: 'ReportDemo2026!' };

fs.mkdirSync(OUT_DIR, { recursive: true });

const shots = [];

async function shot(page, name, label, opts = {}) {
  const file = path.join(OUT_DIR, `${name}.png`);
  await page.screenshot({ path: file, ...opts });
  const kb = Math.round(fs.statSync(file).size / 1024);
  shots.push({ name, label, file });
  console.log(`  captured ${name}.png  (${kb} KB)  ${label}`);
}

// The app hides sections with a `hidden` class plus inline display, and the
// auth observer is async - polling is more reliable than a fixed delay.
async function waitForVisible(page, selector, timeout = 15000) {
  try {
    await page.waitForFunction(
      (sel) => {
        const el = document.querySelector(sel);
        if (!el) return false;
        const cs = getComputedStyle(el);
        return cs.display !== 'none' && cs.visibility !== 'hidden' && el.offsetHeight > 0;
      },
      { timeout },
      selector
    );
    return true;
  } catch {
    console.warn(`  ! ${selector} never became visible`);
    return false;
  }
}

async function dismissModals(page) {
  await page.evaluate(() => {
    document.getElementById('goal-setting-modal')?.remove();
    document.querySelectorAll('.modal-overlay, .modal-backdrop').forEach((n) => n.remove());
  });
}

async function authenticate(page, { email, password }, role) {
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => { try { indexedDB.deleteDatabase('firebaseLocalStorageDb'); } catch {} });
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });

  await page.waitForSelector('#auth-form', { visible: true, timeout: 15000 });
  await page.click(role === 'teacher' ? '#role-btn-teacher' : '#role-btn-student');

  // Try sign-in first; fall back to sign-up if the account does not exist yet.
  await page.click('#tab-signin');
  await page.type('#email', email);
  await page.type('#password', password);
  await page.click('#auth-submit-btn');
  await new Promise((r) => setTimeout(r, 4000));

  const signedIn = await page.evaluate(() => {
    const card = document.getElementById('auth-card');
    return !card || getComputedStyle(card).display === 'none';
  });

  if (!signedIn) {
    console.log(`  no existing ${role} account - creating one`);
    await page.click('#tab-signup');
    await page.evaluate(() => {
      ['#email', '#password', '#display-name', '#class-code-input'].forEach((s) => {
        const el = document.querySelector(s);
        if (el) el.value = '';
      });
    });
    await page.type('#display-name', role === 'teacher' ? 'Demo Coach' : 'Demo Student');
    await page.type('#class-code-input', 'Climate Champions 7A');
    await page.type('#email', email);
    await page.type('#password', password);
    await page.click('#auth-submit-btn');
    await new Promise((r) => setTimeout(r, 6000));
  }
  await dismissModals(page);
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 2 },
  args: ['--no-sandbox', '--disable-dev-shm-usage']
});

try {
  const page = await browser.newPage();

  console.log('\n1. Portal / authentication');
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#auth-card', { visible: true, timeout: 15000 });
  await shot(page, '01-portal-login', 'Role-based entry point (Student / Coach)', {
    clip: await page.evaluate(() => {
      const r = document.getElementById('auth-card').getBoundingClientRect();
      return { x: Math.max(0, r.x - 24), y: Math.max(0, r.y - 24), width: r.width + 48, height: r.height + 48 };
    })
  });

  console.log('\n2. Student experience');
  await authenticate(page, STUDENT, 'student');
  await waitForVisible(page, '#dashboard-card');
  await dismissModals(page);
  await shot(page, '02-student-dashboard', 'Student learning dashboard');

  if (await waitForVisible(page, '#home-container', 8000)) {
    await page.evaluate(() => document.getElementById('home-container').scrollIntoView());
    await new Promise((r) => setTimeout(r, 800));
    await shot(page, '03-student-activities', 'Activity catalogue - five STEM missions', { fullPage: true });
  }

  console.log('\n3. Coach experience');
  await authenticate(page, COACH, 'teacher');
  await waitForVisible(page, '#coach-dashboard-card');
  await dismissModals(page);
  // The dashboard issues one query per user plus three subcollection reads
  // each, so it can sit on its loading skeleton for several seconds.
  await page.waitForFunction(
    () => {
      const c = document.getElementById('coach-dashboard-card');
      return c && c.innerText.length > 50 && !c.innerText.includes('Loading');
    },
    { timeout: 60000 }
  ).catch(() => console.warn('  ! coach dashboard still loading at 60s'));
  await new Promise((r) => setTimeout(r, 1500));
  await shot(page, '06-coach-dashboard', 'Coach dashboard - class overview and metrics');
  await shot(page, '07-coach-dashboard-full', 'Coach dashboard - full page', { fullPage: true });

  console.log(`\nDone. ${shots.length} screenshots in docs/screenshots/`);
  fs.writeFileSync(path.join(OUT_DIR, 'manifest.json'), JSON.stringify(shots, null, 2));
} catch (err) {
  console.error('\nCapture failed:', err.message);
  process.exitCode = 1;
} finally {
  await browser.close();
}
