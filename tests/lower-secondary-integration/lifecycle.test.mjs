import test from 'node:test';
import assert from 'node:assert/strict';
import net from 'node:net';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { requireFreePorts, stopChild, withCleanup } from './lifecycle.mjs';

test('occupied listener is rejected and left alive', async () => {
  const listener = net.createServer(socket => socket.end('existing'));
  await new Promise(resolve => listener.listen(0, '127.0.0.1', resolve));
  const port = listener.address().port;
  try {
    await assert.rejects(requireFreePorts([port]), /unavailable/);
    assert.equal(listener.listening, true);
  } finally { await new Promise(resolve => listener.close(resolve)); }
  await requireFreePorts([port]);
});

test('browser setup failure stops the owned API and frees its port', async () => {
  let child, port;
  await assert.rejects(withCleanup(async defer => {
    child = spawn(process.execPath, ['-e', `const n=require('node:net').createServer(); n.listen(0,'127.0.0.1',()=>console.log(n.address().port));`], { stdio: ['ignore', 'pipe', 'pipe'] });
    defer(() => stopChild(child));
    port = Number(String((await once(child.stdout, 'data'))[0]).trim());
    throw new Error('simulated Chrome launch failure');
  }), /simulated Chrome launch failure/);
  assert.notEqual(child.signalCode ?? child.exitCode, null);
  await requireFreePorts([port]);
});

test('cleanup continues after one resource fails to close', async () => {
  const closed = [];
  await assert.rejects(withCleanup(async defer => {
    defer(() => closed.push('API'));
    defer(() => { closed.push('Vite'); throw new Error('close failed'); });
    defer(() => closed.push('Chrome'));
  }), /cleanup failed/);
  assert.deepEqual(closed, ['Chrome', 'Vite', 'API']);
});
