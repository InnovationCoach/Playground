#!/usr/bin/env node

/**
 * Capture real screenshots of every dashboard for the staff testing guide.
 *
 * Signs in to the local review build (emulators + `npm run seed:emulator`)
 * with each seeded role, visits each screen in PLAN, and saves a PNG plus a
 * text outline (headings, tabs, buttons) so guide steps match the real UI.
 *
 * Emulator-only: the accounts and password are the seeded review ones.
 *
 * Usage:
 *   node scripts/capture-staff-guide.js            # all roles
 *   ONLY=coach node scripts/capture-staff-guide.js # one role
 */

import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '..', 'docs', 'staff-testing-guide', 'screens');
const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:5173/?emulators=1';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PASSWORD = 'review123';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// step: { name, hash?, click?: text of a button/tab to press, full?: fullPage }
const PLAN = {
  student: {
    email: 'mia@school.edu',
    steps: [
      { name: 'courses', settle: 3000 },
      { name: 'home', hash: '#/home' },
      { name: 'pbl', hash: '#/pbl' },
      { name: 'journey', hash: '#/journey' },
      { name: 'portfolio', hash: '#/portfolio' },
      { name: 'community', hash: '#/community' },
      { name: 'messages', hash: '#/messages' },
      { name: 'settings', hash: '#/settings' }
    ]
  },
  primary: {
    email: 'primary.student@school.edu',
    steps: [{ name: 'home', settle: 3000 }]
  },
  coach: {
    email: 'coach.rivera@school.edu',
    steps: [
      { name: 'dashboard', settle: 4000 },
      { name: 'pbl', hash: '#/pbl' },
      { name: 'resources', hash: '#/primary-resources' },
      { name: 'community', hash: '#/community' },
      { name: 'messages', hash: '#/messages' },
      { name: 'settings', hash: '#/settings' }
    ]
  },
  admin: {
    email: 'admin.test@school.edu',
    steps: [
      { name: 'students', hash: '#/admin/students' },
      { name: 'staff', hash: '#/admin/staff' },
      { name: 'parents', hash: '#/admin/parents' },
      { name: 'new-student', hash: '#/admin/new/students' },
      { name: 'learning', hash: '#/admin/learning' },
      { name: 'materials', hash: '#/admin/materials' },
      { name: 'billing', hash: '#/admin/billing' },
      { name: 'messages', hash: '#/messages' },
      { name: 'settings', hash: '#/settings' }
    ]
  },
  supervisor: {
    email: 'supervisor.test@school.edu',
    steps: [{ name: 'students', hash: '#/admin/students' }]
  },
  parent: {
    email: 'parent.test@school.edu',
    steps: [
      { name: 'portal', settle: 4000 },
      { name: 'settings', hash: '#/settings' }
    ]
  }
};

// Extra steps can be appended per role from a JSON file without editing PLAN.
const EXTRA = path.join(OUT_DIR, '..', 'extra-steps.json');
if (fs.existsSync(EXTRA)) {
  const extra = JSON.parse(fs.readFileSync(EXTRA, 'utf8'));
  for (const [role, steps] of Object.entries(extra)) PLAN[role]?.steps.push(...steps);
}

fs.mkdirSync(OUT_DIR, { recursive: true });
const outline = {};

async function outlinePage(page) {
  return page.evaluate(() => {
    const vis = (el) => el.offsetParent !== null || getComputedStyle(el).position === 'fixed';
    const txt = (el) => (el.innerText || el.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 80);
    const pick = (sel) => [...new Set([...document.querySelectorAll(sel)].filter(vis).map(txt).filter(Boolean))];
    return {
      url: location.hash,
      headings: pick('h1,h2,h3'),
      tabs: pick('[role=tab]'),
      buttons: pick('button,a.gh-btn,[role=button]').slice(0, 60),
      inputs: pick('label').slice(0, 30),
      errors: pick('[role=alert],.gh-error,.error'),
      text: (document.querySelector('main') || document.body).innerText.replace(/\n{2,}/g, '\n').slice(0, 1500)
    };
  });
}

async function clickByText(page, text, scroll = false) {
  return page.evaluate((t, scroll) => {
    const els = [...document.querySelectorAll('button,[role=tab],a,[role=button],tr')].filter((e) => e.offsetParent !== null);
    const label = (e) => (e.innerText || e.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ');
    const el = els.find((e) => label(e) === t) || els.find((e) => label(e).startsWith(t)) || els.find((e) => label(e).includes(t));
    if (!el) return false;
    el.click();
    // Tabs low on a page: bring the tab row to the top so its content is in frame.
    if (scroll) { el.scrollIntoView({ block: 'start' }); window.scrollBy(0, -100); }
    return true;
  }, text, scroll);
}

async function signIn(page, email) {
  await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
  await page.waitForSelector('#li-email', { visible: true, timeout: 20000 });
  await page.type('#li-email', email);
  await page.type('#li-password', PASSWORD);
  await page.click('button[type=submit]');
  await page.waitForFunction(() => !document.querySelector('#li-email'), { timeout: 30000 });
  await sleep(2500);
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 1.5 },
  args: ['--no-sandbox', '--disable-dev-shm-usage']
});

try {
  const roles = process.env.ONLY ? process.env.ONLY.split(',') : Object.keys(PLAN);
  let page = await browser.newPage();

  // Signed-out login page, once.
  if (!process.env.ONLY) {
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
    await page.waitForSelector('#li-email', { visible: true, timeout: 20000 });
    await page.screenshot({ path: path.join(OUT_DIR, 'login.png') });
  }

  for (const role of roles) {
    const { email, steps } = PLAN[role];
    console.log(`\n${role} (${email})`);
    // A fresh incognito context per role, so no session carries over.
    const ctx = await browser.createBrowserContext();
    page = await ctx.newPage();
    try { await signIn(page, email); } catch (e) { console.warn(`  ! sign-in failed: ${e.message}`); continue; }
    for (const step of steps) {
      try {
        if (step.hash !== undefined) {
          await page.evaluate((h) => { location.hash = h; }, step.hash);
          if (step.click) await sleep(3000); // let the screen load before clicking into it
        }
        if (step.click) {
          for (const c of [].concat(step.click)) {
            if (!(await clickByText(page, c, !!step.scroll))) console.warn(`  ! no element "${c}"`);
            await sleep(step.clickSettle || 1200);
          }
        }
        if (step.type) {
          await page.type(step.type.selector, step.type.text);
          await sleep(400);
        }
        await sleep(step.settle || 2200);
        const file = `${role}-${step.name}.png`;
        await page.screenshot({ path: path.join(OUT_DIR, file), fullPage: !!step.full });
        outline[`${role}-${step.name}`] = await outlinePage(page);
        console.log(`  captured ${file}`);
        if (step.escape) { await page.keyboard.press('Escape'); await sleep(500); }
      } catch (e) {
        console.warn(`  ! ${step.name}: ${e.message}`);
      }
    }
  }

  const outFile = path.join(OUT_DIR, '..', 'outline.json');
  const prev = fs.existsSync(outFile) ? JSON.parse(fs.readFileSync(outFile, 'utf8')) : {};
  fs.writeFileSync(outFile, JSON.stringify({ ...prev, ...outline }, null, 2));
} finally {
  await browser.close();
}
