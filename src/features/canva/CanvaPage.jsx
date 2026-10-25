import { useState, useEffect } from 'react';
import {
  Palette, ExternalLink, CheckCircle2, AlertCircle, Sparkles,
  Presentation, FileText, Layout, Image, Copy, Check, LogOut, RefreshCw, Link as LinkIcon
} from 'lucide-react';
import { apiRequest } from '../../services/api/apiClient.js';
import './canva.css';

const STARTERS = [
  {
    title: 'Presentations & Pitches',
    desc: '16:9 widescreen slides for your PBL presentations, elevator pitches, and showcase decks.',
    url: 'https://www.canva.com/create/presentations/',
    icon: Presentation,
    color: '#818cf8',
    bg: 'rgba(129, 140, 248, 0.15)'
  },
  {
    title: 'Infographics & Data',
    desc: 'Visual data reports, timelines, and process diagrams to communicate research findings.',
    url: 'https://www.canva.com/create/infographics/',
    icon: Layout,
    color: '#38bdf8',
    bg: 'rgba(56, 189, 248, 0.15)'
  },
  {
    title: 'Posters & Course Covers',
    desc: 'Eye-catching graphic banners for program covers, project campaigns, and classroom posters.',
    url: 'https://www.canva.com/create/posters/',
    icon: Image,
    color: '#c084fc',
    bg: 'rgba(192, 132, 252, 0.15)'
  },
  {
    title: 'Whiteboards & Mind Maps',
    desc: 'Infinite canvas for empathy mapping, problem ideation, and collaborative team brainstorming.',
    url: 'https://www.canva.com/create/whiteboards/',
    icon: Sparkles,
    color: '#fb7185',
    bg: 'rgba(251, 113, 133, 0.15)'
  },
  {
    title: 'Reports & Worksheets',
    desc: 'Structured project portfolios, summary briefs, and learner task sheets.',
    url: 'https://www.canva.com/create/documents/',
    icon: FileText,
    color: '#34d399',
    bg: 'rgba(52, 211, 153, 0.15)'
  },
  {
    title: 'Open Canva Workspace',
    desc: 'Jump directly to your personal Canva dashboard to access all recent designs and assets.',
    url: 'https://www.canva.com/',
    icon: Palette,
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.15)'
  }
];

export function CanvaPage({ uid, role, profile }) {
  const [connection, setConnection] = useState({ loading: true, connected: false });
  const [disconnecting, setDisconnecting] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [pasteLink, setPasteLink] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    async function checkStatus() {
      try {
        const res = await apiRequest('GET', '/api/canva/connection');
        if (active) {
          setConnection({
            loading: false,
            connected: !!res?.connected,
            connectedAt: res?.connectedAt,
            scope: res?.scope
          });
        }
      } catch {
        if (active) {
          setConnection({ loading: false, connected: false });
        }
      }
    }
    checkStatus();
    return () => { active = false; };
  }, []);

  const handleConnect = async () => {
    try {
      setConnecting(true);
      const res = await apiRequest('GET', '/api/canva/oauth/start?format=json');
      if (res?.url) {
        window.location.href = res.url;
      } else {
        window.location.href = '/api/canva/oauth/start';
      }
    } catch {
      window.location.href = '/api/canva/oauth/start';
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect your Canva account?')) return;
    try {
      setDisconnecting(true);
      await apiRequest('POST', '/api/canva/disconnect');
      setConnection({ loading: false, connected: false });
    } catch (err) {
      alert(err.message || 'Failed to disconnect Canva.');
    } finally {
      setDisconnecting(false);
    }
  };

  const copyEmbedCode = () => {
    if (!pasteLink) return;
    navigator.clipboard.writeText(pasteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isCoach = role === 'teacher' || role === 'coach' || role === 'admin';

  return (
    <div className="canva-page">
      <header className="canva-header">
        <span className="canva-eyebrow">
          <Sparkles size={15} aria-hidden="true" />
          Creative Tools
        </span>
        <div className="canva-title-row">
          <h1 className="canva-title">
            <Palette size={32} color="#818cf8" aria-hidden="true" />
            Canva Studio
          </h1>
          {connection.connected && (
            <span className="canva-status-pill canva-status-connected">
              <CheckCircle2 size={15} /> Connected to Canva
            </span>
          )}
        </div>
        <p className="canva-lead">
          Design high-impact pitch decks, infographics, posters, and course artifacts directly in Canva, and link your visual work with WeLearn SPARK.
        </p>
      </header>

      {/* Account Connection Status */}
      <section className="canva-card">
        <div className="canva-card-header">
          <h2 className="canva-card-title">
            <Sparkles size={18} color="#a855f7" />
            Canva Account Connection
          </h2>
          {connection.loading ? (
            <span className="canva-status-pill canva-status-disconnected">
              <RefreshCw size={14} className="spin" /> Checking...
            </span>
          ) : connection.connected ? (
            <span className="canva-status-pill canva-status-connected">
              <CheckCircle2 size={14} /> Active
            </span>
          ) : (
            <span className="canva-status-pill canva-status-disconnected">
              <AlertCircle size={14} /> Not Connected
            </span>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <p style={{ margin: 0, color: '#cbd5e1', fontSize: '0.95rem' }}>
              {connection.connected
                ? `Connected to your Canva account. Designs you authorize can be exported directly into your WeLearn storage.`
                : `Connect your Canva account to export and publish your designs seamlessly into WeLearn.`}
            </p>
            {connection.connectedAt && (
              <p style={{ margin: '0.4rem 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>
                Connected on {new Date(connection.connectedAt).toLocaleDateString()}
              </p>
            )}
          </div>

          <div>
            {connection.connected ? (
              <button
                type="button"
                className="canva-btn canva-btn-danger"
                onClick={handleDisconnect}
                disabled={disconnecting}
              >
                <LogOut size={16} />
                {disconnecting ? 'Disconnecting...' : 'Disconnect Canva'}
              </button>
            ) : (
              <button
                type="button"
                className="canva-btn canva-btn-primary"
                onClick={handleConnect}
                disabled={connecting}
              >
                <ExternalLink size={16} />
                {connecting ? 'Redirecting...' : 'Connect with Canva'}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Quick Design Starters */}
      <section className="canva-card">
        <div className="canva-card-header">
          <h2 className="canva-card-title">
            <Palette size={18} color="#38bdf8" />
            Quick Design Starters
          </h2>
          <span style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Opens directly in Canva</span>
        </div>

        <div className="canva-grid">
          {STARTERS.map((s) => {
            const Icon = s.icon;
            return (
              <a
                key={s.title}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="canva-starter-card"
              >
                <div>
                  <div className="canva-starter-icon" style={{ background: s.bg, color: s.color }}>
                    <Icon size={22} />
                  </div>
                  <h3 className="canva-starter-title">{s.title}</h3>
                  <p className="canva-starter-desc">{s.desc}</p>
                </div>
                <span className="canva-starter-action">
                  Open template <ExternalLink size={14} />
                </span>
              </a>
            );
          })}
        </div>
      </section>

      {/* Guide: How to use Canva in WeLearn */}
      <section className="canva-card">
        <div className="canva-card-header">
          <h2 className="canva-card-title">
            <LinkIcon size={18} color="#34d399" />
            How to use Canva in WeLearn
          </h2>
        </div>

        <div className="canva-guide-grid">
          <div className="canva-guide-card">
            <h3>For Students: Attaching Evidence</h3>
            <ol className="canva-guide-list">
              <li>Open any template above or your design on Canva.</li>
              <li>Click <strong>Share</strong> in the top-right corner of Canva.</li>
              <li>Under <em>Collaboration link</em> or <em>Public view link</em>, choose <strong>Anyone with the link can view</strong>.</li>
              <li>Copy the link and paste it into your <strong>PBL Studio</strong> artifact or submission box.</li>
            </ol>
          </div>

          <div className="canva-guide-card">
            <h3>{isCoach ? 'For Coaches: Program & Course Assets' : 'For PBL Teams: Collaboration'}</h3>
            <ol className="canva-guide-list">
              {isCoach ? (
                <>
                  <li>Create course banners or poster rubrics using Canva's 16:9 or banner templates.</li>
                  <li>Click <strong>Share</strong> &gt; <strong>Download</strong> (as PNG or JPG).</li>
                  <li>Upload the image into your Course Creator / PBL Program Studio as the cover photo.</li>
                  <li>You can also share editable team links with your student cohorts during studio sessions.</li>
                </>
              ) : (
                <>
                  <li>Invite teammates to your Canva design using their email addresses.</li>
                  <li>Collaborate live on your prototype diagrams and pitch slides.</li>
                  <li>Export the final slides as a PDF or image to submit during the Exhibit phase.</li>
                </>
              )}
            </ol>
          </div>
        </div>

        {/* Link helper */}
        <div className="canva-link-helper">
          <h3 style={{ fontSize: '1rem', color: '#e2e8f0', margin: '0 0 0.4rem' }}>
            Canva Link Checker
          </h3>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#94a3b8' }}>
            Paste your Canva share link here to verify it and quickly copy it for your project:
          </p>
          <div className="canva-input-group">
            <input
              type="url"
              className="canva-input"
              placeholder="https://www.canva.com/design/..."
              value={pasteLink}
              onChange={(e) => setPasteLink(e.target.value)}
            />
            <button
              type="button"
              className="canva-btn canva-btn-secondary"
              onClick={copyEmbedCode}
              disabled={!pasteLink}
            >
              {copied ? <Check size={16} color="#4ade80" /> : <Copy size={16} />}
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
          </div>

          {pasteLink && pasteLink.includes('canva.com') && (
            <div className="canva-preview-box">
              <span style={{ fontSize: '0.85rem', color: '#a5b4fc', fontWeight: 600 }}>Valid Canva Link detected:</span>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: '#e0e7ff', wordBreak: 'break-all' }}>
                {pasteLink}
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
export default CanvaPage;
