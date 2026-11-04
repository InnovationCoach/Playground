import { MediaImage, MediaVideo, mediaKind } from '../media/MediaViewer.jsx';
/**
 * Portfolio maker: a design-thinking portfolio built stage by stage.
 *
 * Learners upload evidence and write a reflection for each of the seven PBL
 * stages, then export the whole journey as a PDF (a print-ready document the
 * browser saves as PDF). Uploads reuse the server-validated portfolio pipeline,
 * so file checks, size limits and privacy settings stay exactly the same.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Upload, FileText, Image as ImageIcon, Film, Box, Code2, Link2, Pencil, Trash2, Check, Download, ArrowLeft, Printer, Lightbulb, Lock, Award, ExternalLink } from 'lucide-react';
import { useLocale } from '../../app/i18n/LocaleProvider.jsx';
import { usePersonalization, uploadLearnerFile } from '../personalization/usePersonalization.js';
import { usePblProject } from '../pbl/engine/usePblProject.js';
import { TERM } from '../pbl/content/pblModel.js';
import { STAGES, kindForFile, titleFromFile, wordCount, groupJourney, stageStatus, journeyProgress, reflectionItem } from './journeyModel.js';
import { competencyById, COMPETENCIES } from '../pbl/content/competencies.js';
import { schoolRequest } from '../../services/api/apiClient.js';
import './journey.css';

const KIND_ICON = { image: ImageIcon, recording: Film, model: Box, code: Code2, writing: FileText };

export function JourneyPortfolio({ uid, profile, printView = false }) {
  const { t } = useLocale();
  const space = usePersonalization(uid);
  const { project } = usePblProject(uid, TERM.id);
  const groups = useMemo(() => groupJourney(space.draft.items, project), [space.draft.items, project]);
  const progress = journeyProgress(groups);
  const [stageId, setStageId] = useState(() => STAGES.find((s, i) => progress.statuses[i] !== 'complete')?.id || STAGES[0].id);
  const name = profile?.displayName || '';

  if (space.loading) return <p className="jp" role="status">…</p>;
  if (!space.saved) return <div className="jp"><p className="jp-error" role="alert">{space.error}</p><button type="button" className="jp-btn" onClick={space.reload}>{t('common.retry')}</button></div>;

  if (printView) return <JourneyDocument space={space} groups={groups} progress={progress} name={name} uid={uid} t={t} />;

  const stageIndex = STAGES.findIndex((s) => s.id === stageId);
  const stage = STAGES[stageIndex];
  return (
    <main className="jp" aria-labelledby="jp-title">
      <header className="jp-hero">
        <div className="jp-hero-text">
          <span className="jp-eyebrow">{TERM.theme}</span>
          <h1 id="jp-title">{t('journey.title')}</h1>
          <p>{t('journey.subtitle')}</p>
        </div>
        <div className="jp-hero-side">
          <div className="jp-meter" role="progressbar" aria-label={t('journey.progress', progress)} aria-valuemin={0} aria-valuemax={progress.total} aria-valuenow={progress.done}>
            <div style={{ width: `${(progress.done / progress.total) * 100}%` }} />
          </div>
          <span className="jp-meter-text">{t('journey.progress', progress)}</span>
          <a className="jp-btn jp-btn-primary" href="#/journey/print"><Download size={18} aria-hidden="true" />{t('journey.export')}</a>
        </div>
      </header>

      <nav className="jp-stages" aria-label={t('journey.title')}>
        {STAGES.map((s, i) => (
          <button key={s.id} type="button" className="jp-stage" data-status={progress.statuses[i]} aria-current={s.id === stageId ? 'step' : undefined} onClick={() => setStageId(s.id)}>
            <span className="jp-stage-num" aria-hidden="true">{progress.statuses[i] === 'complete' ? <Check size={16} /> : i + 1}</span>
            <span className="jp-stage-name">{s.title}</span>
            <span className="jp-sr">{t(`journey.${progress.statuses[i]}`)}</span>
          </button>
        ))}
      </nav>

      {(space.error || space.status) && <p className={space.error ? 'jp-error' : 'jp-status'} role={space.error ? 'alert' : 'status'}>{space.error || ''}</p>}

      <section className="jp-panel" aria-labelledby="jp-stage-title">
        <div className="jp-panel-head">
          <span className="jp-eyebrow">{t('journey.stage', { n: stageIndex + 1 })} · {t(`journey.${progress.statuses[stageIndex]}`)}</span>
          <h2 id="jp-stage-title">{stage.title}</h2>
          <p className="jp-goal"><strong>{t('journey.goalLabel')}:</strong> {stage.goal}</p>
          {stage.evidence?.length > 0 && <p className="jp-ideas"><Lightbulb size={16} aria-hidden="true" /><strong>{t('journey.suggested')}:</strong> {stage.evidence.join(' · ')}</p>}
        </div>
        <div className="jp-columns">
          <EvidenceColumn key={`ev-${stage.id}`} stage={stage} group={groups[stage.id]} space={space} uid={uid} t={t} />
          <ReflectionCard key={`rf-${stage.id}`} stage={stage} existing={groups[stage.id].reflection} space={space} t={t} />
        </div>
        <p className="jp-private"><Lock size={14} aria-hidden="true" />{t('journey.private')}</p>
      </section>
    </main>
  );
}

function EvidenceColumn({ stage, group, space, uid, t }) {
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [message, setMessage] = useState('');
  const input = useRef(null);

  async function addFiles(files) {
    setMessage('');
    for (const file of [...files].slice(0, 5)) {
      const kind = kindForFile(file);
      if (!kind) { setMessage(`${file.name}: ${t('journey.dropHint')}`); continue; }
      setUploading(true);
      try {
        const media = await uploadLearnerFile(uid, file, kind);
        await space.saveItem({ kind, title: titleFromFile(file.name), body: '', link: '', media: { path: media.path, name: media.name }, audiences: [], phase: stage.id });
      } catch (error) {
        setMessage(error.message);
      } finally {
        setUploading(false);
      }
    }
  }

  return (
    <div className="jp-card">
      <h3>{t('journey.evidence')}</h3>
      <label className="jp-drop" data-dragging={dragging || undefined}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}>
        <Upload size={26} aria-hidden="true" />
        <span>{uploading ? t('journey.uploading') : t('journey.dropHint')}</span>
        <span className="jp-btn jp-btn-small">{t('journey.chooseFile')}</span>
        <input ref={input} type="file" className="jp-sr" disabled={uploading || space.busy}
          accept="image/jpeg,image/png,image/webp,image/gif,audio/*,video/mp4,video/webm,.glb,.gltf,.obj,.zip,.txt,.py,.js,.ts,.json,.html,.css,.ino"
          multiple onChange={(e) => { const files = e.target.files; addFiles(files); e.target.value = ''; }} />
      </label>
      {message && <p className="jp-error" role="alert">{message}</p>}
      {noteOpen
        ? <EvidenceForm stage={stage} space={space} uid={uid} t={t} onDone={() => setNoteOpen(false)} />
        : <button type="button" className="jp-btn jp-btn-ghost" onClick={() => setNoteOpen(true)}><Link2 size={16} aria-hidden="true" />{t('journey.addNote')}</button>}
      <ul className="jp-evidence">
        {group.evidence.map((item) => <EvidenceCard key={item.id} item={item} stage={stage} space={space} uid={uid} t={t} />)}
        {group.studio.map((entry) => (
          <li key={`studio-${entry.id}`} className="jp-ev jp-ev-studio">
            <span className="jp-ev-icon" aria-hidden="true"><FileText size={20} /></span>
            <div className="jp-ev-body">
              <small>{t('journey.fromStudio')}</small>
              <strong>{entry.title}</strong>
              {entry.body && <p>{entry.body}</p>}
              {entry.link && <a href={entry.link} target="_blank" rel="noopener noreferrer">{entry.link}</a>}
              {entry.competencies?.length > 0 && (
                <div className="jp-ev-competencies" aria-label={t('journey.competencies')}>
                  {entry.competencies.map(cid => {
                    const comp = competencyById(cid);
                    return (
                      <span key={cid} className="jp-comp-badge" title={comp?.statement || comp?.title}>
                        <Award size={12} aria-hidden="true" />
                        {comp ? `${comp.code} ${comp.title}` : cid}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
      {!group.evidence.length && !group.studio.length && <p className="jp-empty">{t('journey.noEvidence')}</p>}
    </div>
  );
}

function EvidenceForm({ stage, item, space, uid, t, onDone }) {
  const [title, setTitle] = useState(item?.title || '');
  const [body, setBody] = useState(item?.body || '');
  const [link, setLink] = useState(item?.link || '');
  const [media, setMedia] = useState(item?.media || null);
  const [kind, setKind] = useState(item?.kind || (item?.media ? 'image' : 'writing'));
  const [competencies, setCompetencies] = useState(item?.competencies || []);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState('');
  const [showAllCompetencies, setShowAllCompetencies] = useState(false);
  const imageInputRef = useRef(null);

  async function handleImageSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageError('');
    setUploadingImage(true);
    try {
      const uploaded = await uploadLearnerFile(uid, file, 'image');
      setMedia({ path: uploaded.path, name: uploaded.name, url: uploaded.url });
      setKind('image');
      if (!title.trim()) {
        setTitle(titleFromFile(file.name));
      }
    } catch (err) {
      setImageError(err?.message || 'Failed to upload image.');
    } finally {
      setUploadingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  }

  function handleRemoveImage() {
    setMedia(null);
    if (kind === 'image') setKind('writing');
  }

  function toggleCompetency(cid) {
    setCompetencies(prev =>
      prev.includes(cid) ? prev.filter(id => id !== cid) : [...prev, cid]
    );
  }

  const stageCompetencyIds = useMemo(() => {
    return [...(stage.competencies || []), ...(stage.stretch || [])];
  }, [stage]);

  return (
    <form className="jp-form" onSubmit={async (e) => {
      e.preventDefault();
      const base = item || { audiences: [], phase: stage.id };
      const itemToSave = {
        ...base,
        kind: media ? (kind || 'image') : (kind === 'image' ? 'writing' : kind),
        title: title.trim(),
        body,
        link: link.trim(),
        media: media ? { path: media.path, name: media.name } : null,
        competencies,
        audiences: item?.audiences || [],
        phase: stage.id
      };
      if (await space.saveItem(itemToSave)) onDone();
    }}>
      <label>{t('journey.titleLabel')}<input required maxLength={160} value={title} onChange={(e) => setTitle(e.target.value)} /></label>

      {/* Upload image to evidence */}
      <div className="jp-form-media">
        <label style={{ display: 'block', marginBottom: 4 }}>{t('journey.uploadImage')}</label>
        {media?.url ? (
          <div className="jp-image-preview-box">
            <img src={media.url} alt={title || 'Evidence preview'} className="jp-form-preview-thumb" />
            <div className="jp-image-preview-actions">
              <span className="jp-muted" style={{ fontSize: 12 }}>{media.name}</span>
              <div className="jp-row">
                <button
                  type="button"
                  className="jp-btn jp-btn-small"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={uploadingImage}
                >
                  <Pencil size={14} aria-hidden="true" />
                  {t('journey.changeImage')}
                </button>
                <button
                  type="button"
                  className="jp-btn jp-btn-small jp-btn-ghost"
                  onClick={handleRemoveImage}
                  disabled={uploadingImage}
                >
                  <Trash2 size={14} aria-hidden="true" />
                  {t('journey.removeImage')}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="jp-image-upload-row">
            <button
              type="button"
              className="jp-btn jp-btn-ghost jp-btn-small"
              onClick={() => imageInputRef.current?.click()}
              disabled={uploadingImage || !uid}
            >
              <ImageIcon size={16} aria-hidden="true" />
              {uploadingImage ? t('journey.uploadingImage') : t('journey.uploadImage')}
            </button>
            <span className="jp-muted" style={{ fontSize: 12 }}>PNG, JPG, WebP, GIF, SVG (up to 20 MB)</span>
          </div>
        )}
        <input
          ref={imageInputRef}
          type="file"
          className="jp-sr"
          accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml,image/avif"
          onChange={handleImageSelect}
          disabled={uploadingImage}
        />
        {imageError && <p className="jp-error" role="alert" style={{ marginTop: 6 }}>{imageError}</p>}
      </div>

      <label>{t('journey.caption')}<textarea maxLength={12000} rows={3} value={body} onChange={(e) => setBody(e.target.value)} /></label>
      <label>{t('journey.link')}<input type="url" pattern="https://.*" value={link} onChange={(e) => setLink(e.target.value)} /></label>

      {/* Link Competencies */}
      <div className="jp-form-competencies">
        <div className="jp-row jp-row-between" style={{ marginBottom: 4 }}>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, margin: 0 }}>
            <Award size={16} aria-hidden="true" />
            {t('journey.linkCompetencies')}
          </label>
          <button
            type="button"
            className="jp-link-btn"
            onClick={() => setShowAllCompetencies(s => !s)}
          >
            {showAllCompetencies ? t('journey.suggestedCompetencies') : t('journey.allCompetencies')}
          </button>
        </div>
        <p className="jp-muted" style={{ fontSize: 12, margin: '0 0 8px' }}>{t('journey.selectCompetenciesHint')}</p>
        <div className="jp-comp-chips" role="group" aria-label={t('journey.competencies')}>
          {(showAllCompetencies ? COMPETENCIES : stageCompetencyIds.map(id => competencyById(id)).filter(Boolean)).map(comp => {
            const isSelected = competencies.includes(comp.id);
            return (
              <button
                key={comp.id}
                type="button"
                className="jp-comp-chip jp-comp-chip-selectable"
                data-selected={isSelected ? 'true' : undefined}
                aria-pressed={isSelected}
                onClick={() => toggleCompetency(comp.id)}
                title={comp.statement || comp.title}
              >
                {isSelected && <Check size={13} aria-hidden="true" />}
                <span className="jp-comp-code">{comp.code}</span>
                <span className="jp-comp-name">{comp.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="jp-row">
        <button type="submit" className="jp-btn jp-btn-primary" disabled={space.busy || uploadingImage}>{t('journey.save')}</button>
        <button type="button" className="jp-btn jp-btn-ghost" onClick={onDone}>{t('journey.cancel')}</button>
      </div>
    </form>
  );
}

function EvidenceCard({ item, stage, space, uid, t }) {
  const [editing, setEditing] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const Icon = KIND_ICON[item.kind] || FileText;
  if (editing) return <li className="jp-ev"><EvidenceForm stage={stage} item={item} space={space} uid={uid} t={t} onDone={() => setEditing(false)} /></li>;
  return (
    <li className="jp-ev">
      {item.kind === 'image' && item.media?.url
        ? <MediaImage className="jp-ev-thumb" src={item.media.url} alt={item.title} />
        : <span className="jp-ev-icon" aria-hidden="true"><Icon size={20} /></span>}
      <div className="jp-ev-body">
        <strong>{item.title}</strong>
        {item.body && <p>{item.body}</p>}
        {item.kind === 'recording' && item.media?.url && (mediaKind(item.media) === 'video'
          ? <MediaVideo src={item.media.url} title={item.title} />
          : <audio controls preload="metadata" src={item.media.url} />)}
        {item.media && !['image', 'recording'].includes(item.kind) && <small>{item.media.name}</small>}
        {item.link && <a href={item.link} target="_blank" rel="noopener noreferrer">{item.link}</a>}

        {item.competencies?.length > 0 && (
          <div className="jp-ev-competencies" aria-label={t('journey.competencies')}>
            {item.competencies.map(cid => {
              const comp = competencyById(cid);
              return (
                <span key={cid} className="jp-comp-badge" title={comp?.statement || comp?.title}>
                  <Award size={12} aria-hidden="true" />
                  {comp ? `${comp.code} ${comp.title}` : cid}
                </span>
              );
            })}
          </div>
        )}

        {confirm
          ? <div className="jp-row" role="alert"><span>{t('journey.confirmRemove', { title: item.title })}</span>
              <button type="button" className="jp-btn jp-btn-danger" disabled={space.busy} onClick={() => space.saveItem(item, true)}>{t('journey.remove')}</button>
              <button type="button" className="jp-btn jp-btn-ghost" onClick={() => setConfirm(false)}>{t('journey.keep')}</button></div>
          : <div className="jp-row">
              <button type="button" className="jp-icon-btn" aria-label={`${t('journey.edit')}: ${item.title}`} title={t('journey.edit')} onClick={() => setEditing(true)}><Pencil size={16} aria-hidden="true" /></button>
              <button type="button" className="jp-icon-btn" aria-label={`${t('journey.remove')}: ${item.title}`} onClick={() => setConfirm(true)}><Trash2 size={16} aria-hidden="true" /></button>
            </div>}
      </div>
    </li>
  );
}

function ReflectionCard({ stage, existing, space, t }) {
  const [text, setText] = useState(existing?.body || '');
  const [saved, setSaved] = useState(false);
  const dirty = text.trim() !== (existing?.body || '').trim();
  return (
    <form className="jp-card jp-reflection" onSubmit={async (e) => {
      e.preventDefault();
      if (await space.saveItem(reflectionItem(stage, text, existing))) setSaved(true);
    }}>
      <h3><label htmlFor={`jp-ref-${stage.id}`}>{t('journey.reflection')}</label></h3>
      <p className="jp-prompts">{t('journey.reflectionPrompts')}</p>
      <textarea id={`jp-ref-${stage.id}`} rows={10} maxLength={12000} value={text} onChange={(e) => { setText(e.target.value); setSaved(false); }} />
      <div className="jp-row jp-row-between">
        <span className="jp-muted">{t('journey.words', { n: wordCount(text) })}</span>
        <span role="status" className="jp-muted">{saved && !dirty ? t('journey.saved') : ''}</span>
        <button type="submit" className="jp-btn jp-btn-primary" disabled={space.busy || !text.trim() || !dirty}>{t('journey.saveReflection')}</button>
      </div>
    </form>
  );
}

/** Print-ready document. The browser's print dialog saves it as a PDF. */
function JourneyDocument({ space, groups, progress, name, uid, t }) {
  const [exportData, setExportData] = useState(null);
  const [downloadingJson, setDownloadingJson] = useState(false);

  useEffect(() => {
    let active = true;
    schoolRequest('GET', '/api/learner-space/journey-export')
      .then(res => { if (active && res?.ok) setExportData(res); })
      .catch(() => { /* fallback to local groups and space */ });
    return () => { active = false; };
  }, [uid]);

  const picture = exportData?.learner?.avatarUrl || space.draft.portfolio?.appearance?.picture?.url || space.draft.dashboard?.appearance?.picture?.url;
  const learnerName = exportData?.learner?.displayName || name || '';
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  // Compute competencies summary across groups if not from API
  const competenciesSummary = useMemo(() => {
    if (exportData?.competenciesSummary?.length) return exportData.competenciesSummary;
    const map = {};
    for (const stage of STAGES) {
      const g = groups[stage.id];
      for (const ev of [...(g?.evidence || []), ...(g?.studio || [])]) {
        for (const cid of (ev.competencies || [])) {
          const comp = competencyById(cid);
          if (!comp) continue;
          if (!map[cid]) map[cid] = { id: cid, code: comp.code, title: comp.title, domain: comp.domain, count: 0 };
          map[cid].count += 1;
        }
      }
    }
    return Object.values(map);
  }, [exportData, groups]);

  useEffect(() => {
    document.body.classList.add('jp-printing');
    window.scrollTo(0, 0);
    return () => document.body.classList.remove('jp-printing');
  }, []);

  async function print() {
    // Wait for images so they appear in the PDF.
    await Promise.all([...document.querySelectorAll('.jd img')].map((img) => (img.complete ? null : img.decode?.().catch(() => null))));
    window.print();
  }

  async function downloadJson() {
    setDownloadingJson(true);
    try {
      const data = exportData || await schoolRequest('GET', '/api/learner-space/journey-export');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `journey-portfolio-${(learnerName || 'export').toLowerCase().replace(/\s+/g, '-')}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.warn('Could not download JSON export:', e?.message);
    } finally {
      setDownloadingJson(false);
    }
  }

  return (
    <div className="jd-wrap">
      <div className="jd-toolbar">
        <a className="jp-btn jp-btn-ghost" href="#/journey"><ArrowLeft size={16} aria-hidden="true" />{t('journey.back')}</a>
        <span className="jp-muted">{t('journey.exportHint')}</span>
        <div className="jp-row">
          <button type="button" className="jp-btn jp-btn-ghost" onClick={downloadJson} disabled={downloadingJson}>
            <Download size={16} aria-hidden="true" />
            {t('journey.exportData')}
          </button>
          <button type="button" className="jp-btn jp-btn-primary" onClick={print}>
            <Printer size={16} aria-hidden="true" />
            {t('journey.print')}
          </button>
        </div>
      </div>

      <article className="jd" aria-label={t('journey.preview')}>
        {/* Cover Page */}
        <section className="jd-cover">
          <div className="jd-cover-badge">
            <span className="jd-eyebrow">{TERM.theme} · {TERM.label}</span>
          </div>
          {picture ? (
            <img className="jd-avatar" src={picture} alt="" />
          ) : (
            <span className="jd-avatar jd-initial" aria-hidden="true">{(learnerName || '?').slice(0, 1)}</span>
          )}
          <h1>{t('journey.printTitle')}</h1>
          <p className="jd-name">{learnerName}</p>
          <p className="jd-question">“{TERM.drivingQuestion}”</p>
          <p className="jd-meta">{t('journey.printGenerated', { date: today })} · {t('journey.progress', progress)}</p>

          {/* Table of contents */}
          <h2 className="jd-contents-title">{t('journey.printContents')}</h2>
          <ol className="jd-contents">
            {STAGES.map((s, i) => (
              <li key={s.id}>
                <span>{i + 1}. {s.title}</span>
                <span className={`jd-status-tag jd-status-${progress.statuses[i]}`}>
                  {t(`journey.${progress.statuses[i]}`)}
                </span>
              </li>
            ))}
          </ol>
        </section>

        {/* Competencies Summary Matrix */}
        {competenciesSummary.length > 0 && (
          <section className="jd-competency-summary-section">
            <span className="jd-eyebrow">{t('journey.competencies')}</span>
            <h2>{t('journey.competencySummary')}</h2>
            <p className="jd-goal">{t('journey.selectCompetenciesHint')}</p>
            <div className="jd-competency-grid">
              {competenciesSummary.map(c => (
                <div key={c.id} className="jd-competency-card">
                  <div className="jd-competency-card-header">
                    <span className="jd-comp-code-badge">{c.code}</span>
                    <span className="jd-comp-count-badge">{c.count} {t('journey.evidence')}</span>
                  </div>
                  <strong>{c.title}</strong>
                  {c.domain && <small className="jd-muted">{c.domain.toUpperCase()}</small>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Stages */}
        {STAGES.map((s, i) => {
          const g = groups[s.id];
          return (
            <section key={s.id} className="jd-stage">
              <div className="jd-stage-head">
                <span className="jd-eyebrow">{t('journey.stage', { n: i + 1 })} · {t(`journey.${progress.statuses[i]}`)}</span>
                <h2>{s.title}</h2>
                <p className="jd-goal"><strong>{t('journey.goalLabel')}:</strong> {s.goal}</p>
              </div>

              <h3>{t('journey.reflection')}</h3>
              <div className="jd-reflection-card">
                <p className="jd-reflection">{g.reflection?.body || t('journey.noReflection')}</p>
              </div>

              <h3>{t('journey.evidence')} ({g.evidence.length + g.studio.length})</h3>
              {!g.evidence.length && !g.studio.length && <p className="jd-muted">{t('journey.noEvidence')}</p>}
              <div className="jd-evidence">
                {g.evidence.map((item) => (
                  <figure key={item.id} className={`jd-ev jd-ev-${item.kind}`}>
                    {item.kind === 'image' && item.media?.url && (
                      <div className="jd-ev-img-wrap">
                        <img src={item.media.url} alt={item.title} />
                      </div>
                    )}
                    <figcaption>
                      <strong>{item.title}</strong>
                      {item.body && <span className="jd-body">{item.body}</span>}
                      {item.competencies?.length > 0 && (
                        <div className="jd-ev-competencies">
                          {item.competencies.map(cid => {
                            const comp = competencyById(cid);
                            return (
                              <span key={cid} className="jd-comp-badge" title={comp?.title}>
                                <Award size={11} aria-hidden="true" />
                                {comp ? `${comp.code} ${comp.title}` : cid}
                              </span>
                            );
                          })}
                        </div>
                      )}
                      {item.media && item.kind !== 'image' && <span className="jd-muted">{t('journey.printMedia', { name: item.media.name })}</span>}
                      {item.link && <span className="jd-link">{item.link}</span>}
                    </figcaption>
                  </figure>
                ))}
                {g.studio.map((entry) => (
                  <figure key={`s-${entry.id}`} className="jd-ev jd-ev-writing jd-ev-studio">
                    <figcaption>
                      <small className="jd-muted">{t('journey.fromStudio')}</small>
                      <strong>{entry.title}</strong>
                      {entry.body && <span className="jd-body">{entry.body}</span>}
                      {entry.competencies?.length > 0 && (
                        <div className="jd-ev-competencies">
                          {entry.competencies.map(cid => {
                            const comp = competencyById(cid);
                            return (
                              <span key={cid} className="jd-comp-badge" title={comp?.title}>
                                <Award size={11} aria-hidden="true" />
                                {comp ? `${comp.code} ${comp.title}` : cid}
                              </span>
                            );
                          })}
                        </div>
                      )}
                      {entry.link && <span className="jd-link">{entry.link}</span>}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </section>
          );
        })}
      </article>
    </div>
  );
}
