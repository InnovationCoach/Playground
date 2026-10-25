import { useState, useEffect } from 'react';
import {
  Palette, ExternalLink, CheckCircle2, AlertCircle, Sparkles,
  Presentation, FileText, Layout, Image, Copy, Check, LogOut, RefreshCw, Link as LinkIcon, AlertTriangle
} from 'lucide-react';
import { apiRequest } from '../../services/api/apiClient.js';
import './canva.css';

const STARTERS = [
  { title: 'Presentations & pitches', desc: 'Widescreen slides for PBL presentations, elevator pitches and showcase decks.', url: 'https://www.canva.com/create/presentations/', icon: Presentation, tone: 'indigo' },
  { title: 'Infographics & data', desc: 'Data reports, timelines and process diagrams for research findings.', url: 'https://www.canva.com/create/infographics/', icon: Layout, tone: 'sky' },
  { title: 'Posters & course covers', desc: 'Banners for program covers, project campaigns and classroom posters.', url: 'https://www.canva.com/create/posters/', icon: Image, tone: 'violet' },
  { title: 'Whiteboards & mind maps', desc: 'An open canvas for empathy maps, problem ideas and team brainstorms.', url: 'https://www.canva.com/create/whiteboards/', icon: Sparkles, tone: 'rose' },
  { title: 'Reports & worksheets', desc: 'Project portfolios, summary briefs and learner task sheets.', url: 'https://www.canva.com/create/documents/', icon: FileText, tone: 'green' },
  { title: 'Open Canva', desc: 'Go to your Canva home page to find your recent designs.', url: 'https://www.canva.com/', icon: Palette, tone: 'amber' }
];

/** Same rules as the server-side link check: only a Canva view link is accepted. */
export function checkViewLink(raw) {
  const s = String(raw || '').trim();
  if (!s) return { ok: false, reason: 'Paste your Canva link first.' };
  if (/canva\.link/i.test(s)) return { ok: false, reason: 'Short canva.link addresses cannot be used. Open the design and copy the full canva.com/design link.' };
  if (/\/design\/[^/]+\/[^/]+\/edit/i.test(s)) return { ok: false, reason: 'That is an edit link. In Canva choose Share, then Anyone with the link can view, and copy that link.' };
  if (!/^https:\/\/(www\.)?canva\.com\/design\/[A-Za-z0-9_-]{6,40}\/[A-Za-z0-9_-]{6,40}\/view\/?$/.test(s)) {
    return { ok: false, reason: 'That does not look like a Canva view link. It should start with https://www.canva.com/design/.' };
  }
  return { ok: true };
}

export function CanvaPage({ uid, role }) {
  const [connection, setConnection] = useState({ loading: true, connected: false });
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(null); // 'connect' | 'disconnect'
  const [confirmingDisconnect, setConfirmingDisconnect] = useState(false);
  const [linkText, setLinkText] = useState('');
  const [linkCheck, setLinkCheck] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    apiRequest('GET', '/api/canva/connection')
      .then((res) => { if (active) setConnection({ loading: false, connected: !!res?.connected, connectedAt: res?.connectedAt }); })
      .catch(() => { if (active) setConnection({ loading: false, connected: false, error: true }); });
    return () => { active = false; };
  }, [uid]);

  const handleConnect = async () => {
    setStatus(null);
    setBusy('connect');
    try {
      const res = await apiRequest('GET', '/api/canva/oauth/start?format=json');
      if (!res?.url) throw new Error('Canva did not return a sign-in address.');
      window.location.assign(res.url);
    } catch (err) {
      setBusy(null);
      setStatus({ kind: 'error', message: err?.message || 'We could not start the Canva sign-in. Try again in a moment.' });
    }
  };

  const handleDisconnect = async () => {
    setBusy('disconnect');
    setStatus(null);
    try {
      await apiRequest('POST', '/api/canva/disconnect');
      setConnection({ loading: false, connected: false });
      setStatus({ kind: 'success', message: 'Canva is disconnected. Your designs in Canva are unchanged.' });
    } catch (err) {
      setStatus({ kind: 'error', message: err?.message || 'We could not disconnect Canva. Try again.' });
    } finally {
      setBusy(null);
      setConfirmingDisconnect(false);
    }
  };

  const checkLink = (e) => {
    e?.preventDefault();
    setCopied(false);
    setLinkCheck(checkViewLink(linkText));
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(linkText.trim());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setLinkCheck({ ok: false, reason: 'Your browser blocked copying. Select the link and copy it yourself.' });
    }
  };

  const isCoach = role === 'teacher' || role === 'coach' || role === 'admin';
  const connected = connection.connected;

  return (
    <div className="gh-app canva-page">
      <header className="canva-header">
        <span className="canva-eyebrow"><Sparkles size={15} aria-hidden="true" /> Creative tools</span>
        <div className="canva-title-row">
          <h1 className="canva-title"><Palette size={28} aria-hidden="true" /> Canva Studio</h1>
          {connected && <span className="canva-status-pill canva-status-connected"><CheckCircle2 size={15} aria-hidden="true" /> Connected</span>}
        </div>
        <p className="canva-lead">Design posters, slides and showcase material in Canva, then bring the link into your WeLearn project.</p>
      </header>

      <section className="canva-card" aria-labelledby="canva-connection-title">
        <div className="canva-card-header">
          <h2 id="canva-connection-title" className="canva-card-title"><Sparkles size={18} aria-hidden="true" /> Your Canva account</h2>
          {connection.loading ? (
            <span className="canva-status-pill canva-status-muted"><RefreshCw size={14} aria-hidden="true" /> Checking…</span>
          ) : connected ? (
            <span className="canva-status-pill canva-status-connected"><CheckCircle2 size={14} aria-hidden="true" /> Active</span>
          ) : (
            <span className="canva-status-pill canva-status-muted"><AlertCircle size={14} aria-hidden="true" /> Not connected</span>
          )}
        </div>

        <div className="canva-connection-body">
          <div>
            <p className="canva-body-text">
              {connected
                ? 'Connected. Designs you choose can be brought into WeLearn.'
                : 'Connect to bring designs into WeLearn without copying links. You can still use Canva without connecting.'}
            </p>
            {connection.connectedAt && (
              <p className="canva-muted">Connected on {new Date(connection.connectedAt).toLocaleDateString()}</p>
            )}
          </div>

          <div className="canva-connection-actions">
            {connected && !confirmingDisconnect && (
              <button type="button" className="canva-btn canva-btn-danger" onClick={() => setConfirmingDisconnect(true)} disabled={busy !== null}>
                <LogOut size={16} aria-hidden="true" /> Disconnect
              </button>
            )}
            {connected && confirmingDisconnect && (
              <div className="canva-confirm" role="group" aria-label="Confirm disconnect">
                <span>Disconnect your Canva account?</span>
                <button type="button" className="canva-btn canva-btn-danger" onClick={handleDisconnect} disabled={busy !== null}>
                  {busy === 'disconnect' ? 'Disconnecting…' : 'Yes, disconnect'}
                </button>
                <button type="button" className="canva-btn canva-btn-secondary" onClick={() => setConfirmingDisconnect(false)}>Keep connected</button>
              </div>
            )}
            {!connected && !connection.loading && (
              <button type="button" className="canva-btn canva-btn-primary" onClick={handleConnect} disabled={busy !== null}>
                <ExternalLink size={16} aria-hidden="true" /> {busy === 'connect' ? 'Opening Canva…' : 'Connect with Canva'}
              </button>
            )}
          </div>
        </div>

        <div role="status" aria-live="polite">
          {connection.error && <p className="canva-notice canva-notice-warn"><AlertTriangle size={15} aria-hidden="true" /> We could not check your Canva connection. You can still open Canva and add links.</p>}
          {status && <p className={`canva-notice canva-notice-${status.kind}`}>{status.message}</p>}
        </div>
      </section>

      <section className="canva-card" aria-labelledby="canva-starters-title">
        <div className="canva-card-header">
          <h2 id="canva-starters-title" className="canva-card-title"><Palette size={18} aria-hidden="true" /> Start a design</h2>
          <span className="canva-muted">Opens in Canva in a new tab</span>
        </div>
        <ul className="canva-grid">
          {STARTERS.map((s) => {
            const Icon = s.icon;
            return (
              <li key={s.title}>
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="canva-starter-card">
                  <span className={`canva-starter-icon canva-tone-${s.tone}`} aria-hidden="true"><Icon size={20} /></span>
                  <span className="canva-starter-title">{s.title}</span>
                  <span className="canva-starter-desc">{s.desc}</span>
                  <span className="canva-starter-action">Open in Canva <ExternalLink size={14} aria-hidden="true" /></span>
                </a>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="canva-card" aria-labelledby="canva-link-title">
        <div className="canva-card-header">
          <h2 id="canva-link-title" className="canva-card-title"><LinkIcon size={18} aria-hidden="true" /> Add a design to your project</h2>
        </div>
        <ol className="canva-steps">
          <li>In Canva, choose <strong>Share</strong>, then <strong>Anyone with the link can view</strong>.</li>
          <li>Copy the link and paste it below to check it.</li>
          <li>Paste the checked link into your PBL project as evidence{isCoach ? ', or into a class resource.' : '.'}</li>
        </ol>

        <form className="canva-link-form" onSubmit={checkLink}>
          <label className="canva-field">
            <span>Canva view link</span>
            <input type="url" className="canva-input" value={linkText} placeholder="https://www.canva.com/design/…/view"
              onChange={(e) => { setLinkText(e.target.value); setLinkCheck(null); }} />
          </label>
          <div className="canva-link-buttons">
            <button type="submit" className="canva-btn canva-btn-primary" disabled={!linkText.trim()}>Check link</button>
            <button type="button" className="canva-btn canva-btn-secondary" onClick={copyLink} disabled={!linkCheck?.ok}>
              {copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />} {copied ? 'Copied' : 'Copy link'}
            </button>
          </div>
        </form>
        <div role="status" aria-live="polite">
          {linkCheck && linkCheck.ok && <p className="canva-notice canva-notice-success"><CheckCircle2 size={15} aria-hidden="true" /> This is a valid Canva view link.</p>}
          {linkCheck && !linkCheck.ok && <p className="canva-notice canva-notice-error"><AlertCircle size={15} aria-hidden="true" /> {linkCheck.reason}</p>}
        </div>
      </section>

      <section className="canva-card" aria-labelledby="canva-guide-title">
        <div className="canva-card-header">
          <h2 id="canva-guide-title" className="canva-card-title">{isCoach ? 'For coaches' : 'For teams'}</h2>
        </div>
        <ul className="canva-steps">
          {isCoach ? (
            <>
              <li>Make course banners and rubrics with the posters or presentations templates.</li>
              <li>Download the finished design as PNG or JPG, then upload it as a program cover.</li>
              <li>Share an editable link with a class for studio sessions.</li>
            </>
          ) : (
            <>
              <li>Invite teammates to a design by email from inside Canva.</li>
              <li>Work on prototype diagrams and pitch slides together.</li>
              <li>Export the final slides as PDF or PNG for the showcase.</li>
            </>
          )}
        </ul>
      </section>
    </div>
  );
}

export default CanvaPage;
