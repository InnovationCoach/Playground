#!/usr/bin/env node

/**
 * Capture the student goal-setting flow for the project report.
 *
 * Creates a throwaway student, walks the four-step wizard, and photographs the
 * wizard and the resulting goals dashboard. Run with the dev server up.
 */

import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'docs', 'screenshots');
const BASE = process.env.BASE_URL || 'http://localhost:5173';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const EMAIL = `goalshot.${Date.now()}@school.edu`;
const PW = 'GoalShot2026!';

fs.mkdirSync(OUT, { recursive: true });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new',
  defaultViewport: { width: 1280, height: 1400, deviceScaleFactor: 1.5 },
  args: ['--no-sandbox']
});

async function shot(page, name, label, sel) {
  const file = path.join(OUT, `${name}.png`);
  const clip = sel && await page.evaluate((s) => {
    const el = document.querySelector(s);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    // clamp to the viewport - an out-of-bounds clip crashes the screenshot
    const x = Math.max(0, r.x - 16), y = Math.max(0, r.y - 16);
    return {
      x, y,
      width: Math.min(r.width + 32, window.innerWidth - x),
      height: Math.min(r.height + 32, window.innerHeight - y)
    };
  }, sel);
  await page.screenshot(clip ? { path: file, clip } : { path: file });
  console.log(`  ${name}.png  ${Math.round(fs.statSync(file).size / 1024)} KB  ${label}`);
}

try {
  const page = await browser.newPage();
  const click = (s) => page.evaluate((x) => document.querySelector(x)?.click(), s);

  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#auth-form', { visible: true, timeout: 15000 });
  await page.click('#role-btn-student');
  await page.click('#tab-signup');
  await page.type('#display-name', 'Goal Demo Student');
  await page.type('#class-code-input', 'Climate Champions 7A');
  await page.type('#email', EMAIL);
  await page.type('#password', PW);
  await page.click('#auth-submit-btn');

  await page.waitForSelector('#goal-setting-modal', { visible: true, timeout: 25000 });
  await wait(1200);
  await shot(page, '08-goal-wizard-step1', 'Goal wizard, step 1 of 4', '#goal-setting-modal');

  await click('[data-path="climate"]'); await wait(800);
  await page.evaluate(() => document.getElementById('topic-list')?.children[0]?.click()); await wait(600);
  await shot(page, '09-goal-wizard-topics', 'Goal wizard, topic selection', '#goal-setting-modal');

  await click('#goal-btn-next'); await wait(700);
  await click('[data-days="14"]'); await wait(800);
  await page.type('#goal-input', 'Build a working climate model'); await click('#goal-add-btn'); await wait(400);
  await page.type('#goal-input', 'Present findings to the class'); await click('#goal-add-btn'); await wait(600);
  await shot(page, '10-goal-wizard-goals', 'Goal wizard, step 4 with goals entered', '#goal-setting-modal');

  await click('#goal-btn-finish');
  await page.waitForFunction(
    () => {
      const c = document.getElementById('goals-dashboard-container');
      return c && c.innerText.includes('Daily Reminder');
    },
    { timeout: 20000 }
  );
  await wait(1200);
  await shot(page, '11-student-goals-dashboard', 'Student goals dashboard with daily reminder', '#goals-dashboard-container');

  console.log('\nDone.');
} catch (err) {
  console.error('\nFailed:', err.message);
  process.exitCode = 1;
} finally {
  await browser.close();
}
