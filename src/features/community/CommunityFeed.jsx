import { useState, useEffect } from 'react';
import { onPostsChanged } from './communityAPI.js';
import { PostCreator } from './PostCreator.jsx';
import { PostCard } from './PostCard.jsx';
import '../admin/admin.css';
import '../school/coach/coachBoards.css';

// Starters only fill the box; the coach edits before posting.
const COACH_PROMPTS = [
  ['This week', 'This week in our projects: \n• \nRemember to '],
  ['Celebrate work', 'Shout-out to everyone who '],
  ['Deadline reminder', 'Reminder: please add your evidence for  by '],
  ['Ask the class', 'Question for the class: ']
];

const DEV_FALLBACK_POSTS = [
  {
    id: 'dev-post-1',
    authorId: 'coach-sam-id',
    authorName: 'Coach Sam Rivera',
    authorRole: 'teacher',
    text: '🌿 Welcome to Term 3 PBL & STEAM Projects! Remember to log your initial observations in the Explore phase and upload your first sensor telemetry by this Friday. The equipment cages in Lab B are stocked with micro:bits and IR thermometers.',
    createdAt: { toDate: () => new Date(Date.now() - 86400000 * 2) },
    commentCount: 3,
    reactionCount: 12,
    status: 'visible'
  },
  {
    id: 'dev-post-2',
    authorId: 'coach-ada-id',
    authorName: 'Coach Ada Okafor',
    authorRole: 'teacher',
    text: '🏎️ Solar Car Track Testing: The MakerSpace outdoor test track is open Wednesday afternoon for sprint trials. Verify that your gear ratios and panel angle locks are calibrated before time trials.',
    createdAt: { toDate: () => new Date(Date.now() - 86400000 * 1) },
    commentCount: 5,
    reactionCount: 16,
    status: 'visible'
  },
  {
    id: 'dev-post-3',
    authorId: 'coach-evelyn-id',
    authorName: 'Dr. Evelyn Reed',
    authorRole: 'teacher',
    text: '🔬 Plant Microscope Lab: High-PAR grow chambers are calibrated at 6500K. Please log stomata counts under the 400x objective directly to your portfolio activity records.',
    createdAt: { toDate: () => new Date(Date.now() - 3600000 * 4) },
    commentCount: 2,
    reactionCount: 8,
    status: 'visible'
  }
];

export function CommunityFeed({ variant = 'default' }) {
  const coachView = variant === 'coach';
  const [seed, setSeed] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    const isDev = Boolean(import.meta.env?.DEV) && typeof window !== 'undefined' && (
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1'
    ) && Boolean(window.__hearIslandUseEmulators);

    const unsubscribe = onPostsChanged((postsData) => {
      if (!postsData || postsData.length === 0) {
        if (isDev) {
          setPosts(DEV_FALLBACK_POSTS);
        } else {
          setPosts([]);
        }
      } else {
        setPosts(postsData);
      }
      setError(null);
      setLoading(false);
    }, (err) => {
      console.warn('[Community] Live Firestore query failed:', err?.message);
      if (isDev) {
        // Fallback for local preview when live database is blocked or offline
        setPosts(DEV_FALLBACK_POSTS);
        setError(null);
      } else {
        setError(err.message);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handlePostCreated = (newPostId) => {
    // If running with dev fallback, insert local optimistic post
    if (posts.some(p => p.id.startsWith('dev-post-'))) {
      const devPost = {
        id: `dev-post-${Date.now()}`,
        authorId: 'current-user',
        authorName: 'Coach Sam Rivera',
        authorRole: 'teacher',
        text: 'New announcement posted to students.',
        createdAt: { toDate: () => new Date() },
        commentCount: 0,
        reactionCount: 0,
        status: 'visible'
      };
      setPosts(prev => [devPost, ...prev]);
    }
  };

  const showingSamples = posts.some(p => p.id.startsWith('dev-post-'));
  const emptyText = coachView ? 'No posts yet. Your learners will see what you share here, so start with this week’s plan or a shout-out.' : 'No posts yet. Be the first to share!';

  return (
    <div className={coachView ? 'cb-posts' : undefined} style={coachView ? undefined : { maxWidth: 720, margin: '0 auto', padding: '1.75rem 16px' }}>
      {coachView ? (
        <div className="cb-posts-head">
          <div>
            <h2>Posts for students</h2>
            <p>Updates, reminders and celebrations your learners see in their feed.</p>
          </div>
          {showingSamples && <span className="cb-sample">Sample posts · local preview only</span>}
        </div>
      ) : (
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '0.5rem' }}>Posts for students</h1>
          <p style={{ color: 'var(--gh-text-2)', fontSize: '0.9rem' }}>School-wide updates, project guidelines, and collaborative STEAM announcements</p>
          {showingSamples && <span className="cb-sample">Sample posts · local preview only</span>}
        </div>
      )}

      {coachView && (
        <div className="cb-prompts" role="group" aria-label="Post starters">
          {COACH_PROMPTS.map(([label, text]) => <button type="button" key={label} onClick={() => setSeed({ text, at: Date.now() })}>{label}</button>)}
        </div>
      )}

      <PostCreator onPostCreated={handlePostCreated} seed={seed} />

      {error ? (
        <div className="gh-alert gh-alert-error">Could not load posts: {error}</div>
      ) : loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--gh-text-2)' }}>Loading posts…</div>
      ) : posts.length === 0 ? (
        <div className={coachView ? 'cb-empty' : undefined} style={coachView ? undefined : { textAlign: 'center', padding: '2rem', color: 'var(--gh-text-2)' }}>{coachView ? <><h3>Nothing posted yet</h3><div className="cb-empty-text"><p>{emptyText}</p></div></> : emptyText}</div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {posts.map(post => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
