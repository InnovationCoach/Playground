import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

const base = { ...process.env };
for (const key of ['GCLOUD_PROJECT','GOOGLE_CLOUD_PROJECT','FIRESTORE_EMULATOR_HOST','FIREBASE_AUTH_EMULATOR_HOST','GOOGLE_APPLICATION_CREDENTIALS']) delete base[key];
const local = { GCLOUD_PROJECT:'demo-universe-entry-test', FIRESTORE_EMULATOR_HOST:'127.0.0.1:8188', FIREBASE_AUTH_EMULATOR_HOST:'127.0.0.1:9299' };
for (const [name, overrides] of [
  ['missing emulator hosts', {GCLOUD_PROJECT:local.GCLOUD_PROJECT}],
  ['missing project', {FIRESTORE_EMULATOR_HOST:local.FIRESTORE_EMULATOR_HOST,FIREBASE_AUTH_EMULATOR_HOST:local.FIREBASE_AUTH_EMULATOR_HOST}],
  ['non-demo project', {...local,GCLOUD_PROJECT:'non-demo-project'}],
  ['credential-bearing environment', {...local,GOOGLE_APPLICATION_CREDENTIALS:'/not-a-real-credential-file'}]
]) {
  test(`explicit fixture server refuses ${name} before listening`, () => {
    const child=spawnSync(process.execPath,['server/emulator-index.js'],{env:{...base,...overrides},encoding:'utf8',timeout:10000});
    assert.equal(child.status,1,child.error?.message || child.stderr);
    assert.match(child.stderr,/Refusing to start emulator server/);
    assert.doesNotMatch(child.stdout,/Emulator Server running/);
  });
}
