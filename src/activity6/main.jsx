/**
 * Standalone Activity 6 page, deployed to its own hosting site so the
 * simulation can go live without releasing the rest of the unfinished
 * working tree. Same Firebase project, same accounts, same data: a learner
 * signs in with their usual WeLearn email and password.
 *
 * Deliberately minimal: sign in, the activity, sign out. No account
 * creation. Accounts are made on the main site.
 */
import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { So2SulfateSimulation } from '../features/activities/so2Sulfate/So2SulfateSimulation.jsx';
import './activity6.css';

const auth = firebase.auth();

function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [state, setState] = useState({ status: 'idle' });

  async function onSubmit(e) {
    e.preventDefault();
    setState({ status: 'busy' });
    try {
      await window.__hearIslandAuthReady;
      await auth.signInWithEmailAndPassword(email.trim(), password);
    } catch (err) {
      const bad = ['auth/invalid-credential', 'auth/wrong-password', 'auth/user-not-found', 'auth/invalid-email', 'auth/invalid-login-credentials'];
      setState({
        status: 'error',
        text: bad.includes(err?.code) ? 'That email and password do not match a WeLearn account.' : 'Sign-in failed. Check your connection and try again.'
      });
    }
  }

  async function onForgot() {
    if (!email.trim()) { setState({ status: 'error', text: 'Type your email first, then choose "Forgot password".' }); return; }
    try {
      await auth.sendPasswordResetEmail(email.trim());
    } catch { /* same message either way, so this cannot be used to probe for accounts */ }
    setState({ status: 'info', text: 'If that email has a WeLearn account, a reset link is on its way.' });
  }

  return (
    <main className="a6-signin">
      <form onSubmit={onSubmit} aria-labelledby="a6-title">
        <span className="a6-eyebrow">WeLearn · Activity 6</span>
        <h1 id="a6-title">SO₂ → Sulfate: Gold Nanoparticle Lab</h1>
        <p>Sign in with your WeLearn account.</p>
        <label>Email<input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
        <label>Password<input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
        {state.text && <p className={state.status === 'error' ? 'a6-err' : 'a6-info'} role="status">{state.text}</p>}
        <button type="submit" disabled={state.status === 'busy'}>{state.status === 'busy' ? 'Signing in…' : 'Sign in'}</button>
        <button type="button" className="a6-link" onClick={onForgot}>Forgot password</button>
      </form>
    </main>
  );
}

function App() {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    let unsub = () => {};
    Promise.resolve(window.__hearIslandAuthReady).then(() => { unsub = auth.onAuthStateChanged((u) => setUser(u || null)); });
    return () => unsub();
  }, []);

  if (user === undefined) return <p className="a6-loading">Loading…</p>;
  if (!user) return <SignIn />;
  return (
    <>
      <header className="a6-bar">
        <span className="a6-brand">WeLearn · Activity 6</span>
        <span className="a6-user">{user.displayName || user.email}</span>
        <button type="button" className="a6-link" onClick={() => auth.signOut()}>Sign out</button>
      </header>
      <So2SulfateSimulation uid={user.uid} />
    </>
  );
}

createRoot(document.getElementById('activity6-root')).render(<StrictMode><App /></StrictMode>);
