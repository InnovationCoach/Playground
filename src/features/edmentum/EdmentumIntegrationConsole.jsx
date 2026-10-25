import { useState, useEffect } from 'react';
import {
  Link2, CheckCircle2, ShieldCheck, Copy, Check, ExternalLink,
  RefreshCw, Play, Sparkles, Layers, BookOpen, AlertCircle, Database, Server
} from 'lucide-react';
import {
  CONNECTED_EDMENTUM_COURSES,
  getEdmentumConfig,
  saveEdmentumConfig,
  recordAgsScore,
  launchEdmentumCourse
} from './edmentumService.js';
import { confettiFrom, buzz } from '../goals/celebrate.js';
import './edmentum.css';

export function EdmentumIntegrationConsole({ coachUser }) {
  const [copiedKey, setCopiedKey] = useState(null);
  const [config, setConfig] = useState(() => getEdmentumConfig());
  const [diagnosticsRunning, setDiagnosticsRunning] = useState(false);
  const [diagResults, setDiagResults] = useState(null);
  const [launchingCourseId, setLaunchingCourseId] = useState(null);
  const [launchResult, setLaunchResult] = useState(null);
  const [passbackStatus, setPassbackStatus] = useState(null);

  const origin = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : 'http://localhost:5173';
  const ltiParams = [
    { key: 'issuer', label: 'Platform ID / Issuer (iss)', value: origin },
    { key: 'clientId', label: 'Client ID (aud)', value: config.clientId || 'welearn-edmentum-client' },
    { key: 'deploymentId', label: 'Deployment ID', value: config.deploymentId || 'welearn-prod-deployment-01' },
    { key: 'oidcUrl', label: 'OIDC Login Initiation URL', value: `${origin}/api/lti/login_initiations` },
    { key: 'jwksUrl', label: 'Public Keyset URL (JWKS RFC 7517)', value: `${origin}/api/lti/jwks` },
    { key: 'tokenUrl', label: 'Access Token URL (OAuth 2.0)', value: `${origin}/api/lti/token` },
    { key: 'agsUrl', label: 'Assignment & Grade Services (AGS)', value: `${origin}/api/lti/ags/lineitems` },
    { key: 'oneroster', label: 'OneRoster 1.1 / 1.2 REST Endpoint', value: `${origin}/api/oneroster/v1p1` }
  ];

  const handleCopy = (key, value) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(value);
      }
    } catch {
      // Fallback
    }
    setCopiedKey(key);
    buzz(15);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const runDiagnostics = async (e) => {
    setDiagnosticsRunning(true);
    setDiagResults(null);
    const triggerEl = e?.currentTarget;

    try {
      const res = await fetch('/api/lti/diagnostics', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setDiagResults(data.results || []);
        buzz([30, 60]);
        if (triggerEl) confettiFrom(triggerEl);
      } else {
        const errorText = await res.text().catch(() => '');
        setDiagResults([
          { step: 'ENDPOINT_HEALTH', status: 'fail', detail: `Backend returned HTTP ${res.status}${errorText ? `: ${errorText.slice(0, 100)}` : ' (Service Unavailable)'}.` },
          { step: 'JWKS_KEYPAIR', status: 'fail', detail: 'Could not verify RS256 keypair due to endpoint error.' },
          { step: 'JWT_SIGNING', status: 'fail', detail: 'Signature validation aborted.' },
          { step: 'LTI_LAUNCH_PAYLOAD', status: 'fail', detail: 'Launch simulation aborted.' },
          { step: 'AGS_GRADE_PASSBACK', status: 'fail', detail: 'AGS pipeline check aborted.' }
        ]);
        buzz(40);
      }
    } catch (err) {
      setDiagResults([
        { step: 'ENDPOINT_CONNECTION', status: 'fail', detail: `Failed to connect to /api/lti/diagnostics (${err?.message || 'Network error'}). Ensure server is running on port 3001.` },
        { step: 'JWKS_KEYPAIR', status: 'fail', detail: 'Endpoint unreachable.' },
        { step: 'JWT_SIGNING', status: 'fail', detail: 'Endpoint unreachable.' },
        { step: 'LTI_LAUNCH_PAYLOAD', status: 'fail', detail: 'Endpoint unreachable.' },
        { step: 'AGS_GRADE_PASSBACK', status: 'fail', detail: 'Endpoint unreachable.' }
      ]);
      buzz(40);
    } finally {
      setDiagnosticsRunning(false);
    }
  };

  const handleTestLaunch = async (courseId) => {
    setLaunchingCourseId(courseId);
    setLaunchResult(null);
    try {
      const result = await launchEdmentumCourse(courseId, {
        uid: coachUser?.uid || 'coach-tester',
        displayName: coachUser?.displayName || 'Coach Donovan',
        role: 'coach'
      });
      buzz(20);
      setLaunchResult({
        courseTitle: result.courseTitle,
        launchUrl: result.launchUrl,
        id_token: result.id_token,
        time: new Date().toLocaleTimeString()
      });
    } catch (err) {
      setLaunchResult({
        error: true,
        message: err.message || 'Launch token generation failed'
      });
    } finally {
      setLaunchingCourseId(null);
    }
  };

  const handleSimulatePassback = (course) => {
    const scoreVal = Math.floor(Math.random() * 11) + 88; // 88 - 98
    const studentUid = 'student-liam-chen';
    recordAgsScore(studentUid, {
      courseId: course.id,
      title: `${course.title}: Unit Mastery Test`,
      scoreGiven: scoreVal,
      scoreMaximum: 100
    });
    setPassbackStatus(`✅ Simulated AGS score passback: ${scoreVal}/100 recorded for Liam Chen in "${course.title}"!`);
    buzz([20, 40]);
    setTimeout(() => setPassbackStatus(null), 5000);
  };

  return (
    <div className="ed-console-wrap">
      {/* Header */}
      <header className="ed-header">
        <div className="ed-header-left">
          <div className="ed-brand-logo">
            <Link2 size={26} />
          </div>
          <div>
            <h1 className="ed-title">Edmentum LTI 1.3 Advantage & Rostering Hub</h1>
            <p className="ed-subtitle">
              Official 1EdTech LTI 1.3 Core, AGS Grade Return & OneRoster Integration Readiness
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className="ed-status-badge">
            <span className="ed-pulse-dot" /> LTI 1.3 & AGS Ready
          </span>
          <button
            type="button"
            className="ed-btn-run-diag"
            onClick={runDiagnostics}
            disabled={diagnosticsRunning}
          >
            {diagnosticsRunning ? (
              <>
                <RefreshCw size={15} className="spin" /> Testing Handshake...
              </>
            ) : (
              <>
                <Play size={15} /> Run LTI Diagnostics
              </>
            )}
          </button>
        </div>
      </header>

      {passbackStatus && (
        <div style={{ background: 'rgba(46, 160, 67, 0.15)', border: '1px solid rgba(46, 160, 67, 0.4)', borderRadius: 8, padding: '0.75rem 1rem', color: '#7ee787', fontSize: '0.85rem' }}>
          <CheckCircle2 size={16} style={{ display: 'inline', marginRight: 6 }} />
          {passbackStatus}
        </div>
      )}

      {launchResult && (
        <div style={{ background: launchResult.error ? 'rgba(248, 81, 73, 0.15)' : 'rgba(56, 189, 248, 0.15)', border: `1px solid ${launchResult.error ? '#f85149' : '#38bdf8'}`, borderRadius: 10, padding: '1rem 1.25rem', color: '#f0f6fc' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <h4 style={{ margin: 0, color: launchResult.error ? '#ff7b72' : '#38bdf8', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={16} /> {launchResult.error ? 'LTI 1.3 Launch Token Request Failed' : `LTI 1.3 Launch Package: ${launchResult.courseTitle}`}
            </h4>
            <button type="button" onClick={() => setLaunchResult(null)} style={{ background: 'none', border: 'none', color: '#8b949e', cursor: 'pointer', fontSize: '1.2rem' }}>&times;</button>
          </div>
          {launchResult.error ? (
            <p style={{ margin: 0, color: '#ff7b72', fontSize: '0.85rem' }}>{launchResult.message}</p>
          ) : (
            <div style={{ fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <p style={{ margin: 0 }}><strong>Target Launch URL:</strong> <a href={launchResult.launchUrl} target="_blank" rel="noreferrer" style={{ color: '#58a6ff' }}>{launchResult.launchUrl}</a></p>
              <p style={{ margin: 0 }}><strong>Authenticated RS256 JWT Token:</strong> <code style={{ background: '#0d1117', padding: '2px 6px', borderRadius: 4, color: '#7ee787' }}>{launchResult.id_token.slice(0, 48)}...</code></p>
              <p style={{ margin: 0, color: '#8b949e' }}>Direct launch token generated and validated at {launchResult.time}.</p>
            </div>
          )}
        </div>
      )}

      {/* Diagnostics Report (if run) */}
      {diagResults && (
        <section className="ed-section-card" aria-label="Diagnostic Results">
          <div className="ed-sec-head">
            <h2 className="ed-sec-title">
              <ShieldCheck size={16} style={{ display: 'inline', marginRight: 6, color: diagResults.every(r => r.status === 'pass') ? '#3fb950' : '#f85149' }} />
              Integration Verification Report
            </h2>
            <span style={{ fontSize: '0.75rem', color: diagResults.every(r => r.status === 'pass') ? '#3fb950' : '#ff7b72', fontWeight: 700 }}>
              {diagResults.filter(r => r.status === 'pass').length}/{diagResults.length} CHECKS PASSED
            </span>
          </div>
          <div className="ed-diag-list">
            {diagResults.map((r) => (
              <div key={r.step} className={`ed-diag-item ${r.status}`} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.8rem', borderRadius: 6, background: r.status === 'pass' ? 'rgba(46, 160, 67, 0.1)' : 'rgba(248, 81, 73, 0.1)', border: `1px solid ${r.status === 'pass' ? 'rgba(46, 160, 67, 0.3)' : 'rgba(248, 81, 73, 0.3)'}` }}>
                {r.status === 'pass' ? (
                  <CheckCircle2 size={16} color="#3fb950" />
                ) : (
                  <AlertCircle size={16} color="#f85149" />
                )}
                <span className="ed-diag-name" style={{ fontWeight: 700, minWidth: 160, color: r.status === 'pass' ? '#7ee787' : '#ff7b72' }}>{r.step}</span>
                <span className="ed-diag-detail" style={{ color: '#c9d1d9', fontSize: '0.85rem' }}>{r.detail}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Registration Parameters for Edmentum */}
      <section className="ed-section-card">
        <div className="ed-sec-head">
          <div>
            <h2 className="ed-sec-title">LMS Platform Registration Parameters</h2>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: '#8b949e' }}>
              Provide these endpoints to Edmentum's integration team (support@edmentum.com) to complete LMS registration.
            </p>
          </div>
        </div>

        <div className="ed-params-grid">
          {ltiParams.map((p) => (
            <div key={p.key} className="ed-param-box">
              <span className="ed-param-label">{p.label}</span>
              <div className="ed-param-val-row">
                <span className="ed-param-val">{p.value}</span>
                <button
                  type="button"
                  className="ed-btn-copy"
                  onClick={() => handleCopy(p.key, p.value)}
                  title="Copy to clipboard"
                >
                  {copiedKey === p.key ? <Check size={12} color="#3fb950" /> : <Copy size={12} />}
                  {copiedKey === p.key ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Connected Edmentum Courseware Catalog */}
      <section className="ed-section-card">
        <div className="ed-sec-head">
          <div>
            <h2 className="ed-sec-title">Connected Edmentum Courseware Catalog ({CONNECTED_EDMENTUM_COURSES.length})</h2>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: '#8b949e' }}>
              Courses ready for secondary student 1-click launch and automated grade return via AGS.
            </p>
          </div>
        </div>

        <div className="ed-course-grid">
          {CONNECTED_EDMENTUM_COURSES.map((course) => (
            <div key={course.id} className="ed-course-card">
              <div className="ed-course-top">
                <span className="ed-course-code">{course.code}</span>
                <span className="ed-course-grade">{course.gradeRange}</span>
              </div>

              <div>
                <h3 className="ed-course-title">{course.title}</h3>
                <p className="ed-course-desc">{course.description}</p>
              </div>

              <div className="ed-standards-row">
                {course.standards.map((std) => (
                  <span key={std} className="ed-std-pill">{std}</span>
                ))}
              </div>

              <div className="ed-course-actions">
                <button
                  type="button"
                  className="ed-btn-launch"
                  onClick={() => handleTestLaunch(course.id)}
                  disabled={launchingCourseId === course.id}
                >
                  {launchingCourseId === course.id ? (
                    <RefreshCw size={13} className="spin" />
                  ) : (
                    <ExternalLink size={13} />
                  )}
                  Test 1-Click Launch
                </button>

                <button
                  type="button"
                  className="ed-btn-simulate-passback"
                  onClick={() => handleSimulatePassback(course)}
                  title="Simulate student completing a test and sending grade over AGS"
                >
                  <Sparkles size={12} /> Test AGS Passback
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
