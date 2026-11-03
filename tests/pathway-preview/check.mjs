import puppeteer from 'puppeteer-core';
import { mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';

const output = new URL('../../output/competency-pathway-20261101/', import.meta.url).pathname;
await mkdir(output, { recursive: true });
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const page = await browser.newPage();
const errors = [], external = [];
page.on('pageerror', e => errors.push(e.message));
page.on('request', req => { if (/^https?:/.test(req.url()) && !req.url().startsWith('http://127.0.0.1:5190/')) external.push(req.url()); });
async function click(text) {
  await page.evaluate(text => [...document.querySelectorAll('button')].find(b => b.textContent.includes(text))?.click(), text);
}
try {
  await page.setViewport({ width: 1280, height: 1000 });
  await page.goto('http://127.0.0.1:5190/tests/pathway-preview/', { waitUntil: 'networkidle0' });
  await page.waitForSelector('.lp-options article');
  await page.screenshot({ path: `${output}desktop.png`, fullPage: true });
  await page.setViewport({ width: 390, height: 844 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'Mobile layout overflows');
  await page.screenshot({ path: `${output}mobile.png`, fullPage: true });
  await click('Choose this quest');
  await page.waitForFunction(() => document.body.textContent.includes('In progress — awaiting competency assessment'));
  await click('Coach view');
  await click('Make sample reviewed evidence available');
  await page.waitForSelector('form[aria-label="Assess competency"] select option[value="sample-program:sample-evidence"]');
  await page.select('form[aria-label="Assess competency"] label:nth-of-type(2) select', 'sample-program:sample-evidence');
  await page.select('form[aria-label="Assess competency"] label:nth-of-type(3) select', 'ctps-06');
  await page.type('form[aria-label="Assess competency"] textarea', 'The learner compares options and aligns priorities with their goal.');
  await click('Save competency decision');
  await page.waitForFunction(() => document.body.textContent.includes('Competencies confirmed by your coach'));
  assert.deepEqual(errors, []); assert.deepEqual(external, []);
  console.log('Desktop/mobile layout, learner choice and coach assessment passed. No browser errors or external data requests.');
  console.log(output);
} finally { await browser.close(); }
