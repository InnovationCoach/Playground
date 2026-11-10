import net from 'node:net';
import { once } from 'node:events';

/** Probe without adopting or stopping an existing listener. */
export async function requireFreePorts(ports) {
  for (const port of ports) {
    const probe = net.createServer();
    try {
      await new Promise((resolve, reject) => {
        probe.once('error', reject);
        probe.listen({ host: '127.0.0.1', port, exclusive: true }, resolve);
      });
    } catch (cause) {
      throw new Error(`Private test port ${port} is unavailable; no existing process was stopped.`, { cause });
    } finally {
      if (probe.listening) await new Promise(resolve => probe.close(resolve));
    }
  }
}

/** Dispose only registered resources, including when setup fails partway through. */
export async function withCleanup(run) {
  const disposers = [];
  let cleaning;
  const cleanup = () => cleaning ||= (async () => {
    const failures = [];
    for (const dispose of disposers.reverse()) {
      try { await dispose(); } catch (error) { failures.push(error); }
    }
    if (failures.length) throw new AggregateError(failures, 'Test resource cleanup failed');
  })();
  const interrupt = () => { cleanup().finally(() => process.exit(130)); };
  process.once('SIGINT', interrupt);
  process.once('SIGTERM', interrupt);
  try { return await run(dispose => disposers.push(dispose)); }
  finally {
    process.off('SIGINT', interrupt);
    process.off('SIGTERM', interrupt);
    await cleanup();
  }
}

/** Wait for our child to exit; never kill another listener on the same port. */
export async function stopChild(child) {
  if (child.exitCode !== null || child.signalCode !== null || !child.pid) return;
  const stopped = once(child, 'exit');
  const timer = setTimeout(() => child.kill('SIGKILL'), 5000);
  child.kill('SIGTERM');
  try { await stopped; } finally { clearTimeout(timer); }
}
