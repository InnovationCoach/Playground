import { useState, useEffect } from 'react';
import { Heart, MessageCircle, Flag } from 'lucide-react';
import { useAuth } from '../../app/AuthProvider.jsx';
import { likePost, unlikePost, hasUserLiked, addComment, getComments, onCommentsChanged, deletePost } from './communityAPI.js';
import { ReportModal } from './ReportModal.jsx';
import '../admin/admin.css';

export function PostCard({ post }) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    if (user) {
      hasUserLiked(post.id, user.uid).then(setLiked);
    }
  }, [post.id, user]);

  useEffect(() => {
    if (showComments) {
      const unsubscribe = onCommentsChanged(post.id, setComments);
      return unsubscribe;
    }
  }, [showComments, post.id]);

  const handleLike = async () => {
    try {
      if (liked) {
        await unlikePost(post.id, user.uid);
        setLiked(false);
      } else {
        await likePost(post.id, user.uid);
        setLiked(true);
      }
    } catch (err) {
      console.error('Like failed:', err);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      await addComment(post.id, user.uid, user.role || 'student', commentText);
      setCommentText('');
    } catch (err) {
      console.error('Comment failed:', err);
    }
  };

  const isAuthor = user?.uid === post.authorId;
  const canDelete = isAuthor || user?.role === 'admin' || user?.role === 'teacher';

  const handleDelete = async () => {
    if (confirm('Delete this post?')) {
      try {
        await deletePost(post.id);
      } catch (err) {
        console.error('Delete failed:', err);
      }
    }
  };

  return (
    <div className="gh-card">
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
        <div className="gh-avatar" style={{ width: 40, height: 40, fontSize: '0.8rem', background: 'var(--gh-purple-50)', color: 'var(--gh-purple)' }}>
          {post.authorId.charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, color: 'var(--gh-text)' }}>{post.authorId}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--gh-text-3)' }}>{post.createdAt?.toDate?.().toLocaleDateString?.() || 'Just now'}</div>
        </div>
        {canDelete && (
          <button
            onClick={handleDelete}
            style={{ background: 'transparent', border: 'none', color: 'var(--gh-red)', cursor: 'pointer', padding: '4px' }}
          >
            ✕
          </button>
        )}
      </div>

      <p style={{ marginBottom: '1rem', color: 'var(--gh-text)', lineHeight: 1.5 }}>{post.text}</p>

      {post.media?.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.5rem', marginBottom: '1rem' }}>
          {post.media.map((m, i) => (
            m.type === 'image' ? (
              <img key={i} src={m.url} alt="Post media" style={{ maxWidth: '100%', height: 'auto', borderRadius: '10px', maxHeight: 200 }} />
            ) : (
              <video key={i} src={m.url} controls style={{ maxWidth: '100%', height: 'auto', borderRadius: '10px', maxHeight: 200 }} />
            )
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: '1.5rem', padding: '0.75rem 0', borderTop: '1px solid var(--gh-border)', borderBottom: '1px solid var(--gh-border)', marginBottom: '1rem' }}>
        <button
          onClick={handleLike}
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', color: liked ? 'var(--gh-red)' : 'var(--gh-text-2)', fontSize: '0.9rem' }}
        >
          <Heart size={18} fill={liked ? 'currentColor' : 'none'} />
          {post.reactionCount || 0}
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--gh-text-2)', fontSize: '0.9rem' }}
        >
          <MessageCircle size={18} />
          {post.commentCount || 0}
        </button>
        <button
          onClick={() => setShowReportModal(true)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: 'auto', color: 'var(--gh-text-3)', fontSize: '0.9rem' }}
        >
          <Flag size={18} />
        </button>
      </div>

      {showComments && (
        <div>
          <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '1rem' }}>
            {comments.map(comment => (
              <div key={comment.id} style={{ background: 'var(--gh-subtle)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.9rem' }}>
                <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{comment.authorId}</div>
                <div>{comment.text}</div>
              </div>
            ))}
          </div>
          <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              className="gh-input"
              placeholder="Add a comment…"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              style={{ flex: 1, minHeight: 36, marginBottom: 0 }}
            />
            <button type="submit" className="gh-btn gh-btn-primary" style={{ minHeight: 36 }}>Post</button>
          </form>
        </div>
      )}

      <ReportModal isOpen={showReportModal} onClose={() => setShowReportModal(false)} targetPath={`posts/${post.id}`} targetType="post" />
    </div>
  );
}
