import { useState } from 'react';
import { joinClassWithCode, JOIN_RESULT } from './joinClass.js';

/**
 * "Join a class" for a learner who already has an account.
 *
 * Shown prominently when they belong to no class, because that state is
 * invisible to them otherwise: everything appears to work, but no teacher can
 * see any of their work. A learner cannot be expected to guess that.
 */
export function JoinClassPanel({ uid, classIds = [], onJoined }) {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  const unattached = classIds.length === 0;

  async function submit(e) {
    e.preventDefault();
    if (!code.trim() || busy) return;

    setBusy(true);
    setResult(null);
    const r = await joinClassWithCode(uid, code, classIds);
    setResult(r);
    setBusy(false);

    if (r.status === JOIN_RESULT.OK) {
      setCode('');
      onJoined?.(r);
    }
  }

  const tone = result
    ? (result.status === JOIN_RESULT.OK ? 'good'
      : result.status === JOIN_RESULT.ALREADY_MEMBER ? 'warn' : 'bad')
    : null;

  return (
    <div className={`join-panel${unattached ? ' join-panel-prompt' : ''}`}>
      <h3>{unattached ? '🎟️ Join your class' : '🎟️ Join another class'}</h3>

      {unattached && (
        <p className="join-panel-why">
          You are not in a class yet, so your teacher cannot see your work. Enter the code
          they gave you to connect your account.
        </p>
      )}

      <form onSubmit={submit} className="join-panel-form">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="ABCD-2345"
          aria-label="Class code"
          autoCapitalize="characters"
          spellCheck={false}
          disabled={busy}
        />
        <button className="btn" type="submit" disabled={busy || !code.trim()}>
          {busy ? 'Checking…' : 'Join'}
        </button>
      </form>

      {result && (
        <p className={`join-panel-msg join-panel-${tone}`} role="status">
          {result.message}
        </p>
      )}
    </div>
  );
}
