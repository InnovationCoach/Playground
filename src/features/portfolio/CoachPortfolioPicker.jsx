import { useState, useEffect } from 'react';
import { Search, Users, ExternalLink, GraduationCap, RefreshCw } from 'lucide-react';
import { auth, db, collection, getDocs, getDoc, doc, query, where } from '../../firebase.js';

export function CoachPortfolioPicker({ coachUser, onSelectStudent }) {
  const [data, setData] = useState({ state: 'loading', learners: [], classes: [] });
  const [classFilter, setClassFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const commit = (value) => { if (!cancelled) setData(value); };
    commit({ state: 'loading', learners: [], classes: [] });

    (async () => {
      try {
        if (!auth.currentUser) throw new Error('Sign-in required');

        let claims = {};
        try {
          const res = await auth.currentUser.getIdTokenResult(true);
          claims = res?.claims || {};
        } catch {
          claims = {};
        }

        const effectiveRole = claims.role || coachUser?.role;
        const isAdmin = ['admin', 'supervisor'].includes(effectiveRole);
        const claimIds = Array.isArray(claims.classIds) ? claims.classIds : (coachUser?.classIds || []);
        const ids = [...new Set(claimIds.filter((id) => typeof id === 'string' && id))];

        if (!isAdmin && !ids.length) {
          commit({ state: 'unassigned', learners: [], classes: [] });
          return;
        }

        // Fetch classes
        let classes = [];
        if (ids.length) {
          classes = await Promise.all(
            ids.map(async (id) => {
              try {
                const snap = await getDoc(doc(db, 'classes', id));
                const exists = typeof snap?.exists === 'function' ? snap.exists() : !!snap?.exists;
                return { id, name: exists ? snap.data().name || id : id };
              } catch {
                return { id, name: id };
              }
            })
          );
        }

        // Fetch students
        const unique = new Map();
        if (isAdmin && !ids.length) {
          const snap = await getDocs(query(collection(db, 'users'), where('role', '==', 'student')));
          snap.docs.forEach((d) => {
            unique.set(d.id, { ...d.data(), uid: d.id });
          });
        } else if (ids.length) {
          const batches = Array.from({ length: Math.ceil(ids.length / 10) }, (_, i) =>
            ids.slice(i * 10, i * 10 + 10)
          );
          const snaps = await Promise.all(
            batches.map((batch) =>
              getDocs(query(collection(db, 'users'), where('classIds', 'array-contains-any', batch))).catch(() => null)
            )
          );
          snaps.forEach((snap) => {
            if (!snap) return;
            snap.docs.forEach((d) => {
              const u = d.data();
              if (u.role === 'student') unique.set(d.id, { ...u, uid: d.id });
            });
          });
        }

        const learners = [...unique.values()];
        learners.sort((a, b) => (a.displayName || a.email || '').localeCompare(b.displayName || b.email || ''));

        commit({ state: 'ready', learners, classes, updatedAt: Date.now() });
      } catch (err) {
        commit({ state: 'error', learners: [], classes: [], error: err.message || 'Unable to load roster.' });
      }
    })();

    return () => { cancelled = true; };
  }, [coachUser?.uid, coachUser?.role, coachUser?.classIds, reload]);

  const activeClasses = data.classes;
  const filteredByClass = data.learners.filter(
    (l) => classFilter === 'all' || l.classIds?.includes(classFilter)
  );
  const q = search.trim().toLowerCase();
  const visibleLearners = filteredByClass.filter((l) =>
    !q || `${l.displayName || ''} ${l.email || ''}`.toLowerCase().includes(q)
  );

  return (
    <div style={{ maxWidth: 1100, margin: '2rem auto', padding: '0 1.25rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--gh-purple)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Coach Portfolio Review
        </span>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0.35rem 0 0.5rem', color: 'var(--gh-heading)' }}>
          Learner Showcase Portfolios
        </h1>
        <p style={{ color: 'var(--gh-text-2, #64748b)', margin: 0, fontSize: '0.95rem', lineHeight: 1.5 }}>
          Select a learner from your roster to review their curated showcase work, reflections, and attachments.
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--gh-surface)',
          padding: '1rem 1.25rem',
          border: '1px solid var(--gh-border)',
          borderRadius: 12,
          marginBottom: '1.5rem'
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
          {activeClasses.length > 0 && (
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>
              <span>Class</span>
              <select
                className="gh-select"
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                style={{ minWidth: 180, padding: '6px 12px', borderRadius: 8 }}
              >
                <option value="all">All assigned classes ({data.learners.length})</option>
                {activeClasses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={16} style={{ position: 'absolute', left: 10, color: 'var(--gh-text-2, #94a3b8)' }} />
            <input
              type="search"
              placeholder="Search learners by name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="gh-input"
              style={{ paddingLeft: 32, minWidth: 260, fontSize: '0.9rem', borderRadius: 8 }}
            />
          </div>
        </div>

        <button
          type="button"
          className="gh-btn gh-btn-ghost"
          disabled={data.state === 'loading'}
          onClick={() => setReload((n) => n + 1)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}
        >
          <RefreshCw size={14} className={data.state === 'loading' ? 'animate-spin' : ''} /> Refresh roster
        </button>
      </div>

      {data.state === 'loading' && (
        <div className="gh-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--gh-text-2)' }}>
          <div className="gh-skel" style={{ width: 140, height: 12, margin: '0 auto 12px' }} />
          <p style={{ margin: 0 }}>Loading learner roster…</p>
        </div>
      )}

      {data.state === 'unassigned' && (
        <div className="gh-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <Users size={32} style={{ color: 'var(--gh-purple)', marginBottom: 12 }} />
          <h2 style={{ fontSize: '1.25rem', margin: '0 0 8px' }}>No Assigned Classes Found</h2>
          <p style={{ color: 'var(--gh-text-2)', maxWidth: 500, margin: '0 auto 16px' }}>
            Your account is verified as a coach, but you have not been assigned to any active classes yet.
            Ask your school administrator to assign your classes to view student portfolios.
          </p>
        </div>
      )}

      {data.state === 'error' && (
        <div className="gh-card" style={{ padding: '2rem', textAlign: 'center', borderColor: '#fca5a5', background: '#fef2f2' }}>
          <p style={{ color: '#b91c1c', margin: '0 0 12px' }}>{data.error}</p>
          <button type="button" className="gh-btn gh-btn-primary" onClick={() => setReload((n) => n + 1)}>
            Try again
          </button>
        </div>
      )}

      {data.state === 'ready' && (
        <>
          {visibleLearners.length === 0 ? (
            <div className="gh-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--gh-text-2)' }}>
              <GraduationCap size={32} style={{ margin: '0 auto 12px', opacity: 0.6 }} />
              <h2 style={{ fontSize: '1.2rem', margin: '0 0 8px', color: 'var(--gh-heading)' }}>
                {search ? 'No matching learners found' : 'No learners in this class'}
              </h2>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>
                {search ? 'Try adjusting your search query or clear the filter.' : 'Learners will appear here once enrolled.'}
              </p>
              {search && (
                <button
                  type="button"
                  className="gh-btn gh-btn-ghost"
                  onClick={() => setSearch('')}
                  style={{ marginTop: 12 }}
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))',
                gap: '1rem'
              }}
            >
              {visibleLearners.map((learner) => {
                const name = learner.displayName || learner.email?.split('@')[0] || 'Learner';
                const initials = name
                  .split(' ')
                  .map((p) => p[0])
                  .filter(Boolean)
                  .slice(0, 2)
                  .join('')
                  .toUpperCase();
                const learnerClasses = data.classes
                  .filter((c) => learner.classIds?.includes(c.id))
                  .map((c) => c.name);

                return (
                  <div
                    key={learner.uid}
                    className="gh-card"
                    style={{
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      borderRadius: 12,
                      border: '1px solid var(--gh-border)',
                      background: 'var(--gh-surface)',
                      transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                        <div
                          style={{
                            width: 42,
                            height: 42,
                            borderRadius: '50%',
                            background: 'var(--gh-purple-50, #f3e8ff)',
                            color: 'var(--gh-purple, #7e22ce)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.95rem',
                            flexShrink: 0
                          }}
                        >
                          {initials}
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                          <h3
                            style={{
                              fontSize: '1rem',
                              fontWeight: 700,
                              margin: 0,
                              color: 'var(--gh-heading)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                          >
                            {name}
                          </h3>
                          <span
                            style={{
                              fontSize: '0.8rem',
                              color: 'var(--gh-text-2, #64748b)',
                              display: 'block',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                          >
                            {learner.email}
                          </span>
                        </div>
                      </div>

                      {learnerClasses.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: '1rem' }}>
                          {learnerClasses.map((cName) => (
                            <span
                              key={cName}
                              style={{
                                fontSize: '0.75rem',
                                padding: '2px 8px',
                                borderRadius: 12,
                                background: 'var(--gh-bg)',
                                color: 'var(--gh-text-2)',
                                border: '1px solid var(--gh-border)'
                              }}
                            >
                              {cName}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div style={{ marginTop: '0.75rem', borderTop: '1px solid var(--gh-border)', paddingTop: '0.75rem' }}>
                      <a
                        href={`#/portfolio/${encodeURIComponent(learner.uid)}`}
                        onClick={(e) => {
                          if (onSelectStudent) {
                            e.preventDefault();
                            onSelectStudent(learner.uid);
                          }
                        }}
                        className="gh-btn gh-btn-primary"
                        style={{
                          width: '100%',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          fontSize: '0.875rem',
                          padding: '8px 12px'
                        }}
                      >
                        Review Portfolio <ExternalLink size={14} />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
