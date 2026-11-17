import { useRef, useState } from 'react';
import {
  Bold, Italic, Underline, Strikethrough, Code, Link2, AlignLeft, AlignCenter, Eraser,
  Type, Heading, Image as ImageIcon, Images, Video, ExternalLink, FileUp, List, ListOrdered,
  CheckSquare, Table as TableIcon, Wrench, MessageSquare, Minus,
  ArrowUp, ArrowDown, Copy, Trash2, Plus, Upload, RefreshCw, Bot
} from 'lucide-react';
import {
  CONTENT_BLOCK_CATALOG,
  createBlock,
  nextId,
  parseVideoSource,
  formatFileSize
} from './richContentModel.js';
import { uploadProgramMediaFile, uploadProgramAttachmentFile } from './programMediaUpload.js';

const BLOCK_ICONS = {
  richtext: Type,
  heading: Heading,
  image: ImageIcon,
  gallery: Images,
  video: Video,
  link: ExternalLink,
  attachment: FileUp,
  list: List,
  checklist: CheckSquare,
  table: TableIcon,
  activity: Wrench,
  callout: MessageSquare,
  divider: Minus
};

export function RichPhaseEditor({
  milestone,
  phaseIndex,
  onChangeMilestone
}) {
  const [activeRichId, setActiveRichId] = useState(null);
  const [uploadingId, setUploadingId] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const blocks = Array.isArray(milestone?.contentBlocks) ? milestone.contentBlocks : [];

  const updateBlocks = (nextBlocks) => {
    onChangeMilestone({ contentBlocks: nextBlocks });
  };

  const addBlock = (type, overrides = {}) => {
    const blk = createBlock(type, overrides);
    updateBlocks([...blocks, blk]);
  };

  const updateBlock = (blockId, patch) => {
    updateBlocks(blocks.map((b) => (b.id === blockId ? { ...b, ...patch } : b)));
  };

  const moveBlock = (idx, dir) => {
    const target = idx + dir;
    if (target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    const [moved] = next.splice(idx, 1);
    next.splice(target, 0, moved);
    updateBlocks(next);
  };

  const duplicateBlock = (idx) => {
    const src = blocks[idx];
    if (!src) return;
    const clone = JSON.parse(JSON.stringify(src));
    clone.id = nextId('blk');
    const next = [...blocks];
    next.splice(idx + 1, 0, clone);
    updateBlocks(next);
  };

  const deleteBlock = (blockId) => {
    updateBlocks(blocks.filter((b) => b.id !== blockId));
  };

  const execFormat = (cmd, value = null) => {
    if (typeof document === 'undefined') return;
    if (cmd === 'createLink') {
      const url = window.prompt('Enter URL (https://...):', 'https://');
      if (!url || !/^https?:\/\//i.test(url.trim())) return;
      document.execCommand('createLink', false, url.trim());
      return;
    }
    document.execCommand(cmd, false, value);
  };

  const handleUploadImage = async (blockId, file) => {
    if (!file) return;
    setUploadError('');
    setUploadingId(blockId);
    try {
      const res = await uploadProgramMediaFile(file, { kind: 'image' });
      updateBlock(blockId, { url: res.url, alt: file.name.replace(/\.[^.]+$/, '') });
    } catch (err) {
      setUploadError(err?.message || 'Image upload failed.');
    } finally {
      setUploadingId(null);
    }
  };

  const handleUploadGalleryFiles = async (blockId, files) => {
    const list = Array.from(files || []);
    if (!list.length) return;
    setUploadError('');
    setUploadingId(blockId);
    try {
      const uploaded = [];
      for (const file of list.slice(0, 8)) {
        const res = await uploadProgramMediaFile(file, { kind: 'image' });
        uploaded.push({
          id: nextId('img'),
          url: res.url,
          alt: file.name.replace(/\.[^.]+$/, ''),
          caption: ''
        });
      }
      const existing = blocks.find((b) => b.id === blockId)?.items || [];
      updateBlock(blockId, { items: [...existing, ...uploaded] });
    } catch (err) {
      setUploadError(err?.message || 'Gallery upload failed.');
    } finally {
      setUploadingId(null);
    }
  };

  const handleUploadVideo = async (blockId, file) => {
    if (!file) return;
    setUploadError('');
    setUploadingId(blockId);
    try {
      const res = await uploadProgramMediaFile(file, { kind: 'video' });
      updateBlock(blockId, { url: res.url, title: blocks.find((b) => b.id === blockId)?.title || file.name });
    } catch (err) {
      setUploadError(err?.message || 'Video upload failed.');
    } finally {
      setUploadingId(null);
    }
  };

  const handleUploadAttachment = async (blockId, file) => {
    if (!file) return;
    setUploadError('');
    setUploadingId(blockId);
    try {
      const res = await uploadProgramAttachmentFile(file);
      updateBlock(blockId, {
        url: res.url,
        fileName: res.fileName,
        fileSize: res.fileSize,
        mimeType: res.mimeType
      });
    } catch (err) {
      setUploadError(err?.message || 'Document attachment failed.');
    } finally {
      setUploadingId(null);
    }
  };

  if (!milestone) return null;

  return (
    <div className="re-root">
      {/* Phase Metadata Header */}
      <div className="re-phase-meta">
        <div className="re-phase-meta-grid">
          <div className="re-field">
            <label htmlFor={`phase-title-${phaseIndex}`}>Phase {phaseIndex + 1} Title</label>
            <input
              id={`phase-title-${phaseIndex}`}
              type="text"
              className="cp-input"
              value={milestone.title || ''}
              onChange={(e) => onChangeMilestone({ title: e.target.value })}
              placeholder={`Stage ${phaseIndex + 1}: Phase Title`}
            />
          </div>
          <div className="re-field">
            <label htmlFor={`phase-stage-name-${phaseIndex}`}>Phase Label</label>
            <input
              id={`phase-stage-name-${phaseIndex}`}
              type="text"
              className="cp-input"
              value={milestone.stageName || ''}
              onChange={(e) => onChangeMilestone({ stageName: e.target.value })}
              placeholder="e.g. Curiosity & Exploration"
            />
          </div>
          <div className="re-field re-field-sm">
            <label htmlFor={`phase-week-${phaseIndex}`}>Week</label>
            <input
              id={`phase-week-${phaseIndex}`}
              type="number"
              min={1}
              max={24}
              className="cp-input"
              value={milestone.week || phaseIndex + 1}
              onChange={(e) => onChangeMilestone({ week: Number(e.target.value) || 1 })}
            />
          </div>
          <div className="re-field re-field-sm">
            <label htmlFor={`phase-dur-${phaseIndex}`}>Minutes</label>
            <input
              id={`phase-dur-${phaseIndex}`}
              type="number"
              min={15}
              max={600}
              className="cp-input"
              value={milestone.durationMin || 90}
              onChange={(e) => onChangeMilestone({ durationMin: Number(e.target.value) || 90 })}
            />
          </div>
        </div>

        <div className="re-field" style={{ marginTop: '0.65rem' }}>
          <label htmlFor={`phase-goal-${phaseIndex}`}>Phase Description & Learning Goal</label>
          <textarea
            id={`phase-goal-${phaseIndex}`}
            className="cp-input"
            rows={2}
            value={milestone.learningGoal || ''}
            onChange={(e) => onChangeMilestone({ learningGoal: e.target.value })}
            placeholder="Describe what learners will explore, build, and achieve in this phase..."
          />
        </div>
      </div>

      {/* Document-Style Sticky Formatting & Insert Toolbar */}
      <div className="re-toolbar" role="toolbar" aria-label="Document formatting and content blocks">
        <div className="re-toolbar-group" aria-label="Text formatting">
          <button type="button" className="re-tb-btn" title="Bold" onMouseDown={(e) => e.preventDefault()} onClick={() => execFormat('bold')}>
            <Bold size={15} />
          </button>
          <button type="button" className="re-tb-btn" title="Italic" onMouseDown={(e) => e.preventDefault()} onClick={() => execFormat('italic')}>
            <Italic size={15} />
          </button>
          <button type="button" className="re-tb-btn" title="Underline" onMouseDown={(e) => e.preventDefault()} onClick={() => execFormat('underline')}>
            <Underline size={15} />
          </button>
          <button type="button" className="re-tb-btn" title="Strikethrough" onMouseDown={(e) => e.preventDefault()} onClick={() => execFormat('strikeThrough')}>
            <Strikethrough size={15} />
          </button>
          <button type="button" className="re-tb-btn" title="Inline Code" onMouseDown={(e) => e.preventDefault()} onClick={() => execFormat('formatBlock', 'pre')}>
            <Code size={15} />
          </button>
          <button type="button" className="re-tb-btn" title="Insert Link" onMouseDown={(e) => e.preventDefault()} onClick={() => execFormat('createLink')}>
            <Link2 size={15} />
          </button>
          <button type="button" className="re-tb-btn" title="Align Left" onMouseDown={(e) => e.preventDefault()} onClick={() => execFormat('justifyLeft')}>
            <AlignLeft size={15} />
          </button>
          <button type="button" className="re-tb-btn" title="Align Center" onMouseDown={(e) => e.preventDefault()} onClick={() => execFormat('justifyCenter')}>
            <AlignCenter size={15} />
          </button>
          <button type="button" className="re-tb-btn" title="Clear Formatting" onMouseDown={(e) => e.preventDefault()} onClick={() => execFormat('removeFormat')}>
            <Eraser size={15} />
          </button>
        </div>

        <div className="re-toolbar-divider" aria-hidden="true" />

        <div className="re-toolbar-inserts" aria-label="Insert content blocks">
          {CONTENT_BLOCK_CATALOG.map((item) => {
            const Icon = BLOCK_ICONS[item.type] || Plus;
            return (
              <button
                key={item.type}
                type="button"
                className="re-insert-pill"
                title={item.hint}
                onClick={() => addBlock(item.type)}
              >
                <Icon size={13} aria-hidden="true" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {uploadError && (
        <div className="re-error-banner" role="alert">
          <span>{uploadError}</span>
          <button type="button" onClick={() => setUploadError('')}>Dismiss</button>
        </div>
      )}

      {/* Document Canvas */}
      <div className="re-canvas">
        {blocks.length === 0 ? (
          <div className="re-empty-canvas">
            <p>
              <strong>Start building Phase {phaseIndex + 1}</strong> — click any block in the toolbar above (Rich Text, Heading, Image, Gallery, Video, Checklist, Table, Activity, or File) to design this learning phase.
            </p>
            <div className="re-empty-quick-btns">
              <button type="button" className="re-quick-btn" onClick={() => addBlock('richtext', { html: '<p>Write your lesson introduction or instructions here...</p>' })}>
                <Type size={14} /> Add Rich Text
              </button>
              <button type="button" className="re-quick-btn" onClick={() => addBlock('video')}>
                <Video size={14} /> Embed Video
              </button>
              <button type="button" className="re-quick-btn" onClick={() => addBlock('checklist')}>
                <CheckSquare size={14} /> Add Checklist
              </button>
              <button type="button" className="re-quick-btn" onClick={() => addBlock('activity')}>
                <Wrench size={14} /> Add Learning Activity
              </button>
            </div>
          </div>
        ) : (
          blocks.map((block, idx) => {
            const Icon = BLOCK_ICONS[block.type] || Type;
            const meta = CONTENT_BLOCK_CATALOG.find((c) => c.type === block.type);
            const isUploading = uploadingId === block.id;

            return (
              <div
                key={block.id}
                className={`re-block ${activeRichId === block.id ? 'is-focused' : ''}`}
              >
                <div className="re-block-bar">
                  <span className="re-block-badge">
                    <Icon size={13} aria-hidden="true" /> {meta?.label || block.type}
                  </span>
                  <div className="re-block-actions">
                    <button
                      type="button"
                      className="re-act-btn"
                      title="Move up"
                      disabled={idx === 0}
                      onClick={() => moveBlock(idx, -1)}
                    >
                      <ArrowUp size={13} />
                    </button>
                    <button
                      type="button"
                      className="re-act-btn"
                      title="Move down"
                      disabled={idx === blocks.length - 1}
                      onClick={() => moveBlock(idx, 1)}
                    >
                      <ArrowDown size={13} />
                    </button>
                    <button
                      type="button"
                      className="re-act-btn"
                      title="Duplicate block"
                      onClick={() => duplicateBlock(idx)}
                    >
                      <Copy size={13} />
                    </button>
                    <button
                      type="button"
                      className="re-act-btn re-act-danger"
                      title="Delete block"
                      onClick={() => deleteBlock(block.id)}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Block Body Editor */}
                <div className="re-block-body">
                  {block.type === 'heading' && (
                    <div className="re-heading-editor">
                      <select
                        aria-label="Heading level"
                        className="cp-input re-level-select"
                        value={block.level || 2}
                        onChange={(e) => updateBlock(block.id, { level: Number(e.target.value) })}
                      >
                        <option value={1}>H1</option>
                        <option value={2}>H2</option>
                        <option value={3}>H3</option>
                      </select>
                      <input
                        type="text"
                        className={`re-heading-input level-${block.level || 2}`}
                        value={block.text || ''}
                        onChange={(e) => updateBlock(block.id, { text: e.target.value })}
                        placeholder="Section heading..."
                      />
                    </div>
                  )}

                  {block.type === 'richtext' && (
                    <RichTextSurface
                      html={block.html || ''}
                      onFocus={() => setActiveRichId(block.id)}
                      onChange={(html) => updateBlock(block.id, { html })}
                    />
                  )}

                  {block.type === 'image' && (
                    <div className="re-media-editor">
                      <div className="re-upload-row">
                        <label className="re-upload-btn">
                          {isUploading ? <RefreshCw size={14} className="spin" /> : <Upload size={14} />}
                          <span>{isUploading ? 'Uploading…' : 'Upload Image'}</span>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            hidden
                            onChange={(e) => {
                              handleUploadImage(block.id, e.target.files?.[0]);
                              e.target.value = '';
                            }}
                          />
                        </label>
                        <input
                          type="url"
                          className="cp-input"
                          value={block.url || ''}
                          onChange={(e) => updateBlock(block.id, { url: e.target.value })}
                          placeholder="Or paste image URL (https://...)"
                        />
                      </div>
                      {block.url && (
                        <div className="re-img-preview">
                          <img src={block.url} alt={block.alt || 'Preview'} />
                        </div>
                      )}
                      <div className="re-two-col">
                        <input
                          type="text"
                          className="cp-input"
                          value={block.alt || ''}
                          onChange={(e) => updateBlock(block.id, { alt: e.target.value })}
                          placeholder="Alt text (accessibility)"
                        />
                        <input
                          type="text"
                          className="cp-input"
                          value={block.caption || ''}
                          onChange={(e) => updateBlock(block.id, { caption: e.target.value })}
                          placeholder="Caption (optional)"
                        />
                      </div>
                    </div>
                  )}

                  {block.type === 'gallery' && (
                    <div className="re-media-editor">
                      <div className="re-upload-row">
                        <input
                          type="text"
                          className="cp-input"
                          value={block.title || ''}
                          onChange={(e) => updateBlock(block.id, { title: e.target.value })}
                          placeholder="Gallery title (optional)"
                        />
                        <label className="re-upload-btn">
                          {isUploading ? <RefreshCw size={14} className="spin" /> : <Images size={14} />}
                          <span>{isUploading ? 'Uploading…' : 'Add Images'}</span>
                          <input
                            type="file"
                            multiple
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            hidden
                            onChange={(e) => {
                              handleUploadGalleryFiles(block.id, e.target.files);
                              e.target.value = '';
                            }}
                          />
                        </label>
                        <button
                          type="button"
                          className="re-quick-btn"
                          onClick={() => updateBlock(block.id, {
                            items: [...(block.items || []), { id: nextId('img'), url: '', alt: '', caption: '' }]
                          })}
                        >
                          <Plus size={13} /> URL
                        </button>
                      </div>
                      <div className="re-gallery-editor-grid">
                        {(block.items || []).map((item, imgIdx) => (
                          <div key={item.id || imgIdx} className="re-gallery-editor-card">
                            {item.url && <img src={item.url} alt={item.alt || ''} />}
                            <input
                              type="url"
                              className="cp-input"
                              value={item.url || ''}
                              onChange={(e) => {
                                const next = [...(block.items || [])];
                                next[imgIdx] = { ...next[imgIdx], url: e.target.value };
                                updateBlock(block.id, { items: next });
                              }}
                              placeholder="Image URL"
                            />
                            <div style={{ display: 'flex', gap: '0.35rem' }}>
                              <input
                                type="text"
                                className="cp-input"
                                value={item.caption || ''}
                                onChange={(e) => {
                                  const next = [...(block.items || [])];
                                  next[imgIdx] = { ...next[imgIdx], caption: e.target.value };
                                  updateBlock(block.id, { items: next });
                                }}
                                placeholder="Caption"
                              />
                              <button
                                type="button"
                                className="re-act-btn re-act-danger"
                                title="Remove image"
                                onClick={() => updateBlock(block.id, {
                                  items: (block.items || []).filter((_, i) => i !== imgIdx)
                                })}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {block.type === 'video' && (
                    <div className="re-media-editor">
                      <div className="re-upload-row">
                        <input
                          type="url"
                          className="cp-input"
                          value={block.url || ''}
                          onChange={(e) => updateBlock(block.id, { url: e.target.value })}
                          placeholder="Paste YouTube, Vimeo, or MP4/WebM URL..."
                        />
                        <label className="re-upload-btn">
                          {isUploading ? <RefreshCw size={14} className="spin" /> : <Upload size={14} />}
                          <span>{isUploading ? 'Uploading…' : 'Upload Video'}</span>
                          <input
                            type="file"
                            accept="video/mp4,video/webm,video/quicktime"
                            hidden
                            onChange={(e) => {
                              handleUploadVideo(block.id, e.target.files?.[0]);
                              e.target.value = '';
                            }}
                          />
                        </label>
                      </div>
                      <div className="re-two-col">
                        <input
                          type="text"
                          className="cp-input"
                          value={block.title || ''}
                          onChange={(e) => updateBlock(block.id, { title: e.target.value })}
                          placeholder="Video title"
                        />
                        <input
                          type="text"
                          className="cp-input"
                          value={block.caption || ''}
                          onChange={(e) => updateBlock(block.id, { caption: e.target.value })}
                          placeholder="Video caption or watching prompt"
                        />
                      </div>
                      {block.url && (() => {
                        const parsed = parseVideoSource(block.url);
                        if (!parsed) return <small className="re-warn-text">Enter a valid YouTube, Vimeo, or direct MP4/WebM URL.</small>;
                        return parsed.kind === 'iframe' ? (
                          <div className="re-video-preview">
                            <iframe src={parsed.embedUrl} title={block.title || 'Video preview'} allowFullScreen />
                          </div>
                        ) : (
                          <video src={parsed.embedUrl} controls className="re-video-preview-el" />
                        );
                      })()}
                    </div>
                  )}

                  {block.type === 'link' && (
                    <div className="re-media-editor">
                      <div className="re-two-col">
                        <input
                          type="text"
                          className="cp-input"
                          value={block.title || ''}
                          onChange={(e) => updateBlock(block.id, { title: e.target.value })}
                          placeholder="Resource title"
                        />
                        <input
                          type="url"
                          className="cp-input"
                          value={block.url || ''}
                          onChange={(e) => updateBlock(block.id, { url: e.target.value })}
                          placeholder="https://..."
                        />
                      </div>
                      <input
                        type="text"
                        className="cp-input"
                        value={block.description || ''}
                        onChange={(e) => updateBlock(block.id, { description: e.target.value })}
                        placeholder="Short description for students"
                      />
                    </div>
                  )}

                  {block.type === 'attachment' && (
                    <div className="re-media-editor">
                      <div className="re-upload-row">
                        <label className="re-upload-btn">
                          {isUploading ? <RefreshCw size={14} className="spin" /> : <FileUp size={14} />}
                          <span>{isUploading ? 'Attaching…' : 'Upload File (PDF, Doc, Slides)'}</span>
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.txt,.zip"
                            hidden
                            onChange={(e) => {
                              handleUploadAttachment(block.id, e.target.files?.[0]);
                              e.target.value = '';
                            }}
                          />
                        </label>
                        <input
                          type="url"
                          className="cp-input"
                          value={block.url || ''}
                          onChange={(e) => updateBlock(block.id, { url: e.target.value })}
                          placeholder="Or paste cloud file link (Google Drive, OneDrive...)"
                        />
                      </div>
                      <div className="re-two-col">
                        <input
                          type="text"
                          className="cp-input"
                          value={block.fileName || ''}
                          onChange={(e) => updateBlock(block.id, { fileName: e.target.value })}
                          placeholder="Document display name (e.g. Lab Worksheet.pdf)"
                        />
                        <input
                          type="text"
                          className="cp-input"
                          value={block.description || ''}
                          onChange={(e) => updateBlock(block.id, { description: e.target.value })}
                          placeholder={block.fileSize ? `Attached (${formatFileSize(block.fileSize)})` : 'Short description'}
                        />
                      </div>
                    </div>
                  )}

                  {block.type === 'list' && (
                    <div className="re-media-editor">
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <button
                          type="button"
                          className={`re-quick-btn ${block.style !== 'numbered' ? 'is-active' : ''}`}
                          onClick={() => updateBlock(block.id, { style: 'bullet' })}
                        >
                          <List size={13} /> Bullet List
                        </button>
                        <button
                          type="button"
                          className={`re-quick-btn ${block.style === 'numbered' ? 'is-active' : ''}`}
                          onClick={() => updateBlock(block.id, { style: 'numbered' })}
                        >
                          <ListOrdered size={13} /> Numbered List
                        </button>
                      </div>
                      <div className="re-list-items">
                        {(block.items || []).map((item, lIdx) => (
                          <div key={lIdx} className="re-list-row">
                            <span className="re-list-marker">{block.style === 'numbered' ? `${lIdx + 1}.` : '•'}</span>
                            <input
                              type="text"
                              className="cp-input"
                              value={item}
                              onChange={(e) => {
                                const next = [...(block.items || [])];
                                next[lIdx] = e.target.value;
                                updateBlock(block.id, { items: next });
                              }}
                              placeholder="List item..."
                            />
                            <button
                              type="button"
                              className="re-act-btn re-act-danger"
                              onClick={() => updateBlock(block.id, {
                                items: (block.items || []).filter((_, i) => i !== lIdx)
                              })}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          className="re-quick-btn"
                          onClick={() => updateBlock(block.id, { items: [...(block.items || []), ''] })}
                        >
                          <Plus size={13} /> Add Item
                        </button>
                      </div>
                    </div>
                  )}

                  {block.type === 'checklist' && (
                    <div className="re-media-editor">
                      <input
                        type="text"
                        className="cp-input"
                        value={block.title || ''}
                        onChange={(e) => updateBlock(block.id, { title: e.target.value })}
                        placeholder="Checklist heading (e.g. Phase 1 Tasks)"
                      />
                      <div className="re-list-items">
                        {(block.items || []).map((item, cIdx) => (
                          <div key={item.id || cIdx} className="re-list-row">
                            <CheckSquare size={15} style={{ color: 'var(--cp-green)', flexShrink: 0 }} />
                            <input
                              type="text"
                              className="cp-input"
                              value={item.label || ''}
                              onChange={(e) => {
                                const next = [...(block.items || [])];
                                next[cIdx] = { ...next[cIdx], label: e.target.value };
                                updateBlock(block.id, { items: next });
                              }}
                              placeholder="Student task..."
                            />
                            <button
                              type="button"
                              className="re-act-btn re-act-danger"
                              onClick={() => updateBlock(block.id, {
                                items: (block.items || []).filter((_, i) => i !== cIdx)
                              })}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          className="re-quick-btn"
                          onClick={() => updateBlock(block.id, {
                            items: [...(block.items || []), { id: nextId('chk'), label: '', required: true }]
                          })}
                        >
                          <Plus size={13} /> Add Checklist Item
                        </button>
                      </div>
                    </div>
                  )}

                  {block.type === 'table' && (
                    <div className="re-media-editor">
                      <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="re-quick-btn"
                          onClick={() => {
                            const headers = [...(block.headers || []), `Col ${(block.headers?.length || 0) + 1}`];
                            const rows = (block.rows || []).map((r) => [...r, '']);
                            updateBlock(block.id, { headers, rows });
                          }}
                        >
                          <Plus size={13} /> Add Column
                        </button>
                        <button
                          type="button"
                          className="re-quick-btn"
                          onClick={() => {
                            const cols = Math.max(1, (block.headers || []).length);
                            const rows = [...(block.rows || []), Array.from({ length: cols }, () => '')];
                            updateBlock(block.id, { rows });
                          }}
                        >
                          <Plus size={13} /> Add Row
                        </button>
                      </div>
                      <div className="re-table-scroll">
                        <table className="re-table-editor">
                          <thead>
                            <tr>
                              {(block.headers || []).map((h, cIdx) => (
                                <th key={cIdx}>
                                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                                    <input
                                      type="text"
                                      className="cp-input"
                                      value={h}
                                      onChange={(e) => {
                                        const headers = [...(block.headers || [])];
                                        headers[cIdx] = e.target.value;
                                        updateBlock(block.id, { headers });
                                      }}
                                    />
                                    {(block.headers || []).length > 1 && (
                                      <button
                                        type="button"
                                        className="re-act-btn re-act-danger"
                                        title="Remove column"
                                        onClick={() => {
                                          const headers = (block.headers || []).filter((_, i) => i !== cIdx);
                                          const rows = (block.rows || []).map((r) => r.filter((_, i) => i !== cIdx));
                                          updateBlock(block.id, { headers, rows });
                                        }}
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    )}
                                  </div>
                                </th>
                              ))}
                              <th style={{ width: 32 }} />
                            </tr>
                          </thead>
                          <tbody>
                            {(block.rows || []).map((row, rIdx) => (
                              <tr key={rIdx}>
                                {row.map((cell, cIdx) => (
                                  <td key={cIdx}>
                                    <input
                                      type="text"
                                      className="cp-input"
                                      value={cell}
                                      onChange={(e) => {
                                        const rows = (block.rows || []).map((r) => [...r]);
                                        rows[rIdx][cIdx] = e.target.value;
                                        updateBlock(block.id, { rows });
                                      }}
                                    />
                                  </td>
                                ))}
                                <td>
                                  <button
                                    type="button"
                                    className="re-act-btn re-act-danger"
                                    title="Remove row"
                                    onClick={() => updateBlock(block.id, {
                                      rows: (block.rows || []).filter((_, i) => i !== rIdx)
                                    })}
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {block.type === 'activity' && (
                    <div className="re-media-editor">
                      <div className="re-two-col">
                        <input
                          type="text"
                          className="cp-input"
                          value={block.title || ''}
                          onChange={(e) => updateBlock(block.id, { title: e.target.value })}
                          placeholder="Activity title (e.g. Build & Test Sensor Rig)"
                        />
                        <input
                          type="number"
                          min={5}
                          max={300}
                          className="cp-input"
                          value={block.durationMin || 45}
                          onChange={(e) => updateBlock(block.id, { durationMin: Number(e.target.value) || 45 })}
                          placeholder="Duration (minutes)"
                        />
                      </div>
                      <textarea
                        className="cp-input"
                        rows={3}
                        value={block.instructions || ''}
                        onChange={(e) => updateBlock(block.id, { instructions: e.target.value })}
                        placeholder="Step-by-step learning activity instructions..."
                      />
                      <div className="re-two-col">
                        <input
                          type="text"
                          className="cp-input"
                          value={(block.materials || []).join(', ')}
                          onChange={(e) => updateBlock(block.id, {
                            materials: e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                          })}
                          placeholder="Materials (comma-separated)"
                        />
                        <input
                          type="text"
                          className="cp-input"
                          value={block.deliverable || ''}
                          onChange={(e) => updateBlock(block.id, { deliverable: e.target.value })}
                          placeholder="Expected deliverable or evidence"
                        />
                      </div>
                    </div>
                  )}

                  {block.type === 'callout' && (
                    <div className="re-media-editor">
                      <div className="re-two-col">
                        <select
                          className="cp-input"
                          value={block.tone || 'info'}
                          onChange={(e) => updateBlock(block.id, { tone: e.target.value })}
                        >
                          <option value="info">Info Note</option>
                          <option value="tip">Pro Tip</option>
                          <option value="warning">Safety / Important</option>
                          <option value="coach">Coach Guidance</option>
                        </select>
                        <input
                          type="text"
                          className="cp-input"
                          value={block.title || ''}
                          onChange={(e) => updateBlock(block.id, { title: e.target.value })}
                          placeholder="Callout heading"
                        />
                      </div>
                      <textarea
                        className="cp-input"
                        rows={2}
                        value={block.text || ''}
                        onChange={(e) => updateBlock(block.id, { text: e.target.value })}
                        placeholder="Callout message..."
                      />
                    </div>
                  )}

                  {block.type === 'divider' && (
                    <hr className="rc-divider" />
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Coach Intervention Cue */}
      <div className="cp-cue-box" style={{ marginTop: '0.9rem' }}>
        <span className="cp-cue-title">
          <Bot size={13} /> Coach Intervention Cue (Private / Teaching Guide)
        </span>
        <textarea
          className="cp-input"
          rows={2}
          style={{ background: 'transparent', borderColor: 'var(--cp-purple-border)', fontSize: '0.82rem' }}
          value={milestone.coachCue || ''}
          onChange={(e) => onChangeMilestone({ coachCue: e.target.value })}
          placeholder="Optional facilitation cue or scaffolding tip for coaches..."
        />
      </div>
    </div>
  );
}

/**
 * Uncontrolled-cursor contentEditable surface for smooth rich text editing
 * without jumping the caret on every keystroke.
 */
function RichTextSurface({ html, onFocus, onChange }) {
  const ref = useRef(null);
  const lastExternal = useRef(html);

  // Sync only if external html changed while not focused
  if (ref.current && html !== lastExternal.current && document.activeElement !== ref.current) {
    ref.current.innerHTML = html || '';
    lastExternal.current = html;
  }

  return (
    <div
      ref={ref}
      className="re-richtext-surface"
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      aria-multiline="true"
      aria-label="Rich text content"
      data-placeholder="Type formatted content here... Select text and use the toolbar above for bold, italic, links, and alignment."
      dangerouslySetInnerHTML={ref.current ? undefined : { __html: html || '' }}
      onFocus={onFocus}
      onInput={(e) => {
        const next = e.currentTarget.innerHTML;
        lastExternal.current = next;
        onChange(next);
      }}
      onBlur={(e) => {
        const next = e.currentTarget.innerHTML;
        lastExternal.current = next;
        onChange(next);
      }}
    />
  );
}
