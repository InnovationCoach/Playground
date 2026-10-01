import { useState } from 'react';
import { ImagePlus, Trash2 } from 'lucide-react';
import { useAuth } from '../../app/AuthProvider.jsx';
import { createPost } from './communityAPI.js';
import { useLocale } from '../../app/i18n/LocaleProvider.jsx';
import '../admin/admin.css';

const ALLOWED_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  video: ['video/mp4', 'video/webm', 'video/quicktime']
};
const MAX_SIZE = 20 * 1024 * 1024; // 20 MB

export function PostCreator({ onPostCreated }) {
  const { user, profile } = useAuth();
  const { t } = useLocale();
  const [text, setText] = useState('');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileSelect = (e) => {
    const selected = Array.from(e.target.files || []);
    const newFiles = [];

    for (const file of selected) {
      if (file.size > MAX_SIZE) {
        setError(`File "${file.name}" exceeds 20 MB limit`);
        continue;
      }

      const isAllowed = Object.values(ALLOWED_TYPES).flat().includes(file.type);
      if (!isAllowed) {
        setError(`File type "${file.type}" not allowed`);
        continue;
      }

      newFiles.push(file);
    }

    setFiles(f => [...f, ...newFiles]);
  };

  const removeFile = (idx) => {
    setFiles(f => f.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim() && files.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      await createPost(user.uid, profile.role, text, files);
      setText('');
      setFiles([]);
      onPostCreated?.();
    } catch (err) {
      setError(err.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="gh-card" style={{ marginBottom: '2rem' }}>
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
        <div className="gh-avatar" style={{ width: 40, height: 40, fontSize: '0.8rem', background: 'var(--gh-purple-50)', color: 'var(--gh-purple)' }}>
          {profile?.displayName?.charAt(0) || '?'}
        </div>
        <textarea
          className="gh-input"
          placeholder="Share an idea, ask a question, or show your work…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={{ minHeight: 80, resize: 'vertical', marginBottom: 0 }}
        />
      </div>

      {files.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
          {files.map((file, idx) => (
            <div key={idx} style={{ position: 'relative', background: 'var(--gh-subtle)', borderRadius: '10px', padding: '0.5rem', fontSize: '0.8rem', wordBreak: 'break-word' }}>
              {file.name}
              <button
                type="button"
                onClick={() => removeFile(idx)}
                style={{ position: 'absolute', top: 2, right: 2, background: 'var(--gh-red)', color: '#fff', border: 'none', borderRadius: '4px', padding: '2px 4px', cursor: 'pointer' }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {error && <div className="gh-alert gh-alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--gh-text-2)', fontSize: '0.9rem' }}>
          <ImagePlus size={18} />
          <span>Add image or video</span>
          <input
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
        </label>
        <button
          type="submit"
          className="gh-btn gh-btn-primary"
          disabled={loading || (!text.trim() && files.length === 0)}
        >
          {loading ? 'Posting…' : 'Post'}
        </button>
      </div>
    </form>
  );
}
