import { useState } from 'react';
import {
  Link2, CheckCircle2, ShieldCheck, Copy, Check, ExternalLink,
  RefreshCw, Play, BookOpen, AlertCircle
} from 'lucide-react';
import { launchEdmentumCourse } from './edmentumService.js';
import { providerStatus, PROVIDER_STATES } from './providerState.js';
import { SYNTHETIC_EDMENTUM_COURSES } from './fixtures/syntheticEdmentum.js';
import { useSchoolResource } from '../school/useSchoolWorkspace.js';
import { usingEmulators } from '../../firebase.js';
import { buzz } from '../goals/celebrate.js';
import './edmentum.css';

// The synthetic sample catalogue is a development aid only: emulator or Vite dev builds.
const SHOW_SYNTHETIC = usingEmulators || import.meta.env?.DEV === true;

/**
 * Coach/admin Edmentum setup page.
 *
 * Shows what is true: the school's Edmentum connection state from the school
 * service, the platform registration values the server publishes, and a local
 * signing self-test. Passing the self-test proves WeLearn can sign LTI tokens;
 * it does not prove Edmentum has registered WeLearn or that any learner can
 * launch a course.
 */
export function EdmentumIntegrationConsole({ coachUser }) {
  const [copiedKey, setCopiedKey] = useState(null);
  const [diagnosticsRunning, setDiagnosticsRunning] = useState(false);
  const [diagResults, setDiagResults] = useState(null);
  const [launchingCourseId, setLaunchingCourseId] = useState(null);
  const [launchResult, setLaunchResult] = useState(null);

  const context = useSchoolResource('/api/learning-context');
  const status = providerStatus(context.data?.providerStatus?.edmentum, context);
  const ltiConfig = useSchoolResource('/api/lti/config');
  const reg = ltiConfig.data?.registration || {};
  const unavailable = ltiConfig.loading ? 'Loading…' : 'Not available';

  const origin = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : '';
  const ltiParams = [
    { key: 'issuer', label: 'Platform ID / Issuer (iss)', value: reg.issuer },
    { key: 'clientId', label: 'Client ID (aud)', value: reg.clientId },
    { key: 'deploymentId', label: 'Deployment ID', value: reg.deploymentId },
    { key: 'oidcUrl', label: 'OIDC Login Initiation URL', value: reg.oidcAuthUrl },
    { key: 'jwksUrl', label: 'Public Keyset URL (JWKS RFC 7517)', value: reg.jwksUrl },
    { key: 'tokenUrl', label: 'Access Token URL (OAuth 2.0)', value: reg.accessTokenUrl },
    { key: 'agsUrl', label: 'Assignment & Grade Services (AGS)', value: reg.agsLineItemsUrl },
    { key: 'oneroster', label: 'OneRoster 1.1 REST Endpoint', value: origin ? `${origin}/api/oneroster/v1p1` : undefined }
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

  const runDiagnostics = async () => {
    setDiagnosticsRunning(true);
    setDiagResults(null);
    try {
      const res = await fetch('/api/lti/diagnostics', { method: 'POST' });
      const data = res.ok ? await res.json().catch(() => null) : null;
      if (res.ok && Array.isArray(data?.results) && data.results.length) {
        setDiagResults(data.results);
      } else {
        const errorText = res.ok ? 'an empty or unreadable report' : `HTTP ${res.status}`;
        setDiagResults([{ step: 'SELF_TEST', status: 'fail', detail: `The self-test service returned ${errorText}. Nothing was checked.` }]);
      }
    } catch (err) {
      setDiagResults([{ step: 'SELF_TEST', status: 'fail', detail: `Could not reach the self-test service (${err?.message || 'network error'}). Nothing was checked.` }]);
    } finally {
      setDiagnosticsRunning(false);
    }
  };

  const handleTestLaunch = async (course) => {
    setLaunchingCourseId(course.id);
    setLaunchResult(null);
    const result = await launchEdmentumCourse(course, { role: coachUser?.role === 'student' ? undefined : 'coach' });
    setLaunchResult({ ...result, courseTitle: course.title, time: new Date().toLocaleTimeString() });
    setLaunchingCourseId(null);
  };

  const allPassed = diagResults?.length > 0 && diagResults.every((r) => r.status === 'pass');
  const connected = status.state === PROVIDER_STATES.CONNECTED;

  return (
    <div className="ed-console-wrap">
      <header className="ed-header">
        <div className="ed-header-left">
          <div className="ed-brand-logo">
            <Link2 size={26} aria-hidden="true" />
          </div>
          <div>
            <h1 className="ed-title">Edmentum setup</h1>
            <p className="ed-subtitle">
              LTI 1.3 registration values and a local signing self-test.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <span className="ed-status-badge" data-state={status.state} role="status">
            {connected && <span className="ed-pulse-dot" />} School connection: {status.label}
          </span>
          <button
            type="button"
            className="ed-btn-run-diag"
            onClick={runDiagnostics}
            disabled={diagnosticsRunning}
          >
            {diagnosticsRunning ? (
              <>
                <RefreshCw size={15} className="spin" aria-hidden="true" /> Running self-test…
              </>
            ) : (
              <>
                <Play size={15} aria-hidden="true" /> Run signing self-test
              </>
            )}
          </button>
        </div>
      </header>

      <p className="ed-truth-note">
        {status.detail} A passing self-test shows WeLearn can sign LTI tokens; it does not confirm that Edmentum has registered WeLearn or that learners can open courses.
      </p>

      {launchResult && (
        <div className="ed-launch-result" data-ok={launchResult.ok ? 'true' : 'false'} role="alert">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <h4 style={{ margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {launchResult.ok ? <CheckCircle2 size={16} aria-hidden="true" /> : <AlertCircle size={16} aria-hidden="true" />}
              {launchResult.ok ? `Launch token issued: ${launchResult.courseTitle}` : `Launch failed: ${launchResult.courseTitle}`}
            </h4>
            <button type="button" aria-label="Dismiss launch result" onClick={() => setLaunchResult(null)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '1.2rem' }}>&times;</button>
          </div>
          {launchResult.ok ? (
            <div style={{ fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <p style={{ margin: 0 }}><strong>Target URL:</strong> {launchResult.launchUrl}</p>
              <p style={{ margin: 0 }}><strong>Signed token:</strong> <code>{launchResult.idToken.slice(0, 48)}…</code></p>
              <p style={{ margin: 0 }}>The server signed a token at {launchResult.time}. This does not show that Edmentum accepted it.</p>
            </div>
          ) : (
            <p style={{ margin: 0, fontSize: '0.85rem' }}>{launchResult.message}</p>
          )}
        </div>
      )}

      {diagResults && (
        <section className="ed-section-card" aria-label="Self-test results">
          <div className="ed-sec-head">
            <h2 className="ed-sec-title">
              <ShieldCheck size={16} aria-hidden="true" style={{ display: 'inline', marginRight: 6, color: allPassed ? '#3fb950' : '#f85149' }} />
              Signing self-test
            </h2>
            <span style={{ fontSize: '0.75rem', color: allPassed ? '#3fb950' : '#ff7b72', fontWeight: 700 }}>
              {diagResults.filter(r => r.status === 'pass').length} of {diagResults.length} checks passed
            </span>
          </div>
          <div className="ed-diag-list">
            {diagResults.map((r) => (
              <div key={r.step} className={`ed-diag-item ${r.status}`} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.8rem', borderRadius: 6, background: r.status === 'pass' ? 'rgba(46, 160, 67, 0.1)' : 'rgba(248, 81, 73, 0.1)', border: `1px solid ${r.status === 'pass' ? 'rgba(46, 160, 67, 0.3)' : 'rgba(248, 81, 73, 0.3)'}` }}>
                {r.status === 'pass' ? (
                  <CheckCircle2 size={16} color="#3fb950" aria-label="Passed" />
                ) : (
                  <AlertCircle size={16} color="#f85149" aria-label="Failed" />
                )}
                <span className="ed-diag-name" style={{ fontWeight: 700, minWidth: 160, color: r.status === 'pass' ? '#7ee787' : '#ff7b72' }}>{r.step}</span>
                <span className="ed-diag-detail" style={{ color: '#c9d1d9', fontSize: '0.85rem' }}>{r.detail}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="ed-section-card">
        <div className="ed-sec-head">
          <div>
            <h2 className="ed-sec-title">Platform registration values</h2>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: '#8b949e' }}>
              Values the WeLearn server publishes for Edmentum's integration team. Sharing them does not complete registration.
            </p>
          </div>
        </div>

        <div className="ed-params-grid">
          {ltiParams.map((p) => (
            <div key={p.key} className="ed-param-box">
              <span className="ed-param-label">{p.label}</span>
              <div className="ed-param-val-row">
                <span className="ed-param-val">{p.value || unavailable}</span>
                {p.value && (
                  <button
                    type="button"
                    className="ed-btn-copy"
                    onClick={() => handleCopy(p.key, p.value)}
                    aria-label={`Copy ${p.label}`}
                  >
                    {copiedKey === p.key ? <Check size={12} color="#3fb950" aria-hidden="true" /> : <Copy size={12} aria-hidden="true" />}
                    {copiedKey === p.key ? 'Copied' : 'Copy'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="ed-section-card">
        <div className="ed-sec-head">
          <div>
            <h2 className="ed-sec-title">Courses</h2>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: '#8b949e' }}>
              No Edmentum courses have been imported. Course outlines arrive through the reviewed import, not from this page.
            </p>
          </div>
        </div>

        {SHOW_SYNTHETIC && (
          <>
            <p className="ed-synthetic-banner"><BookOpen size={14} aria-hidden="true" /> Synthetic sample courses for the launch self-test. Development only; not a school enrolment.</p>
            <div className="ed-course-grid">
              {SYNTHETIC_EDMENTUM_COURSES.map((course) => (
                <div key={course.id} className="ed-course-card">
                  <div className="ed-course-top">
                    <span className="ed-course-code">{course.code}</span>
                    <span className="ed-course-grade">Synthetic</span>
                  </div>
                  <h3 className="ed-course-title">{course.title}</h3>
                  <div className="ed-course-actions">
                    <button
                      type="button"
                      className="ed-btn-launch"
                      onClick={() => handleTestLaunch(course)}
                      disabled={launchingCourseId === course.id}
                    >
                      {launchingCourseId === course.id ? (
                        <RefreshCw size={13} className="spin" aria-hidden="true" />
                      ) : (
                        <ExternalLink size={13} aria-hidden="true" />
                      )}
                      Request test launch token
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
