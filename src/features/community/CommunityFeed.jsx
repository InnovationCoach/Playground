import { useState, useEffect } from 'react';
import { onPostsChanged } from './communityAPI.js';
import { PostCreator } from './PostCreator.jsx';
import { PostCard } from './PostCard.jsx';
import '../admin/admin.css';

export function CommunityFeed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = onPostsChanged((postsData) => {
      setPosts(postsData);
      setError(null);
      setLoading(false);
    }, (err) => {
      console.error('[Community] Feed failed:', err);
      setError(err.message);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '1.75rem 16px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '0.5rem' }}>Community</h1>
        <p style={{ color: 'var(--gh-text-2)', fontSize: '0.9rem' }}>Share ideas, ask questions, and show your work</p>
      </div>

      <PostCreator onPostCreated={() => {}} />

      {error ? (
        <div className="gh-alert gh-alert-error">Could not load posts: {error}</div>
      ) : loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--gh-text-2)' }}>Loading posts…</div>
      ) : posts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--gh-text-2)' }}>No posts yet. Be the first to share!</div>
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
