/**
 * Rich Content Block Model, Sanitizer, Video Parser, and 8-Phase Unit Converters
 * for the WeLearn Spark Coaches Dashboard Program Maker.
 */

import { PBL_STAGES } from './pblUnitSchema.js';

export const PROGRAM_CATEGORIES = [
  'STEM & Robotics',
  'Design Thinking',
  'Sustainability & Climate',
  'Entrepreneurship',
  'Arts & Digital Media',
  'Community Impact',
  'Health & Bioengineering',
  'Computer Science & AI',
  'Custom Interdisciplinary'
];

export const PROGRAM_TONES = [
  { id: 'purple', label: 'Royal Purple', swatch: '#7c3aed' },
  { id: 'sky', label: 'Ocean Sky', swatch: '#0284c7' },
  { id: 'green', label: 'Eco Green', swatch: '#16a34a' },
  { id: 'amber', label: 'Solar Amber', swatch: '#d97706' },
  { id: 'magenta', label: 'Studio Magenta', swatch: '#db2777' },
  { id: 'navy', label: 'Deep Navy', swatch: '#1e3a8a' }
];

export const CONTENT_BLOCK_CATALOG = [
  { type: 'richtext', label: 'Rich Text', hint: 'Formatted paragraphs, bold, italic, links' },
  { type: 'heading', label: 'Heading', hint: 'Section title (H1, H2, H3)' },
  { type: 'image', label: 'Image', hint: 'Upload photo or paste image URL' },
  { type: 'gallery', label: 'Image Gallery', hint: 'Multi-image grid with captions' },
  { type: 'video', label: 'Video', hint: 'YouTube, Vimeo, or MP4/WebM upload' },
  { type: 'link', label: 'External Link', hint: 'Resource card with URL & description' },
  { type: 'attachment', label: 'Document / File', hint: 'Downloadable PDF, slides, or worksheet' },
  { type: 'list', label: 'List', hint: 'Bullet points or numbered steps' },
  { type: 'checklist', label: 'Interactive Checklist', hint: 'Checkable student tasks' },
  { type: 'table', label: 'Table', hint: 'Editable rows & columns' },
  { type: 'activity', label: 'Learning Activity', hint: 'Structured hands-on task & deliverable' },
  { type: 'callout', label: 'Callout / Note', hint: 'Highlighted tip, warning, or coach cue' },
  { type: 'divider', label: 'Divider', hint: 'Visual section separator' }
];

export function nextId(prefix = 'blk') {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function createBlock(type, overrides = {}) {
  const id = overrides.id || nextId('blk');
  switch (type) {
    case 'heading':
      return { id, type: 'heading', level: 2, text: '', ...overrides };
    case 'richtext':
      return { id, type: 'richtext', html: '<p></p>', ...overrides };
    case 'image':
      return { id, type: 'image', url: '', alt: '', caption: '', ...overrides };
    case 'gallery':
      return {
        id,
        type: 'gallery',
        title: '',
        items: Array.isArray(overrides.items) ? overrides.items : [],
        ...overrides
      };
    case 'video':
      return { id, type: 'video', url: '', title: '', caption: '', ...overrides };
    case 'link':
      return { id, type: 'link', url: '', title: '', description: '', ...overrides };
    case 'attachment':
      return {
        id,
        type: 'attachment',
        url: '',
        fileName: '',
        fileSize: 0,
        mimeType: '',
        description: '',
        ...overrides
      };
    case 'list':
      return {
        id,
        type: 'list',
        style: 'bullet',
        items: [''],
        ...overrides
      };
    case 'checklist':
      return {
        id,
        type: 'checklist',
        title: 'Phase Checklist',
        items: [{ id: nextId('chk'), label: '', required: true }],
        ...overrides
      };
    case 'table':
      return {
        id,
        type: 'table',
        headers: ['Column 1', 'Column 2', 'Column 3'],
        rows: [['', '', ''], ['', '', '']],
        ...overrides
      };
    case 'activity':
      return {
        id,
        type: 'activity',
        title: '',
        durationMin: 45,
        instructions: '',
        materials: [],
        deliverable: '',
        ...overrides
      };
    case 'callout':
      return {
        id,
        type: 'callout',
        tone: 'info',
        title: '',
        text: '',
        ...overrides
      };
    case 'divider':
      return { id, type: 'divider', ...overrides };
    default:
      return { id, type: 'richtext', html: '<p></p>', ...overrides };
  }
}

export function normalizeContentBlocks(blocks) {
  if (!Array.isArray(blocks)) return [];
  return blocks
    .filter((b) => b && typeof b === 'object' && typeof b.type === 'string')
    .map((b) => {
      const base = createBlock(b.type, b);
      if (base.type === 'richtext') {
        base.html = sanitizeRichHtml(base.html || '');
      }
      if (base.type === 'checklist') {
        base.items = (Array.isArray(base.items) ? base.items : []).map((it) => ({
          id: it?.id || nextId('chk'),
          label: String(it?.label || ''),
          required: it?.required !== false
        }));
      }
      if (base.type === 'gallery') {
        base.items = (Array.isArray(base.items) ? base.items : []).map((it) => ({
          id: it?.id || nextId('img'),
          url: String(it?.url || ''),
          alt: String(it?.alt || ''),
          caption: String(it?.caption || '')
        }));
      }
      if (base.type === 'table') {
        const headers = Array.isArray(base.headers) && base.headers.length ? base.headers.map(String) : ['Column 1', 'Column 2'];
        const rows = Array.isArray(base.rows)
          ? base.rows.map((r) => (Array.isArray(r) ? headers.map((_, i) => String(r[i] ?? '')) : headers.map(() => '')))
          : [headers.map(() => '')];
        base.headers = headers;
        base.rows = rows;
      }
      if (base.type === 'list') {
        base.items = Array.isArray(base.items) ? base.items.map(String) : [''];
        base.style = base.style === 'numbered' ? 'numbered' : 'bullet';
      }
      return base;
    });
}

/**
 * Lightweight, dependency-free HTML sanitizer for rich text blocks.
 * Strips script/style/iframe/object tags, event handlers, and javascript: URLs.
 */
const ALLOWED_TAGS = new Set([
  'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'strike',
  'code', 'pre', 'blockquote', 'ul', 'ol', 'li', 'a',
  'h1', 'h2', 'h3', 'h4', 'span', 'div', 'hr', 'mark', 'sub', 'sup'
]);

export function sanitizeRichHtml(raw) {
  if (typeof raw !== 'string' || !raw.trim()) return '';
  // Remove dangerous blocks completely
  let cleaned = raw
    .replace(/<\s*(script|style|iframe|object|embed|form|input|button|textarea|select|svg|math)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
    .replace(/<\s*(script|style|iframe|object|embed|form|input|button|textarea|select|meta|link|base)[^>]*\/?>/gi, '');

  // Filter tags & attributes
  cleaned = cleaned.replace(/<\/?([a-zA-Z0-9-]+)([^>]*)>/g, (match, tagName, attrs) => {
    const tag = tagName.toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) return '';
    if (match.startsWith('</')) return `</${tag}>`;

    if (tag === 'a') {
      const hrefMatch = /\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(attrs);
      const rawHref = (hrefMatch?.[1] || hrefMatch?.[2] || hrefMatch?.[3] || '').trim();
      const safeHref = /^(https?:|mailto:|#)/i.test(rawHref) ? rawHref : '';
      if (!safeHref) return '<a>';
      const escapedHref = safeHref.replace(/"/g, '&quot;');
      return `<a href="${escapedHref}" target="_blank" rel="noopener noreferrer">`;
    }

    // Preserve safe text-align style only if present
    const alignMatch = /\bstyle\s*=\s*(?:"[^"]*text-align:\s*(left|center|right|justify)[^"]*"|'[^']*text-align:\s*(left|center|right|justify)[^']*')/i.exec(attrs);
    const align = alignMatch?.[1] || alignMatch?.[2];
    if (align) return `<${tag} style="text-align:${align}">`;

    return `<${tag}>`;
  });

  return cleaned;
}

/**
 * Parses a video URL into an embeddable representation.
 * Supports YouTube, Vimeo, Cloudinary video, Firebase Storage, and direct MP4/WebM/OGG.
 */
export function parseVideoSource(rawUrl) {
  const url = String(rawUrl || '').trim();
  if (!url) return null;

  if (url.startsWith('data:video/') || url.startsWith('blob:')) {
    return { kind: 'video', embedUrl: url, originalUrl: url, provider: 'Uploaded Video' };
  }

  let u;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;

  const host = u.hostname.replace(/^www\.|^m\./, '').toLowerCase();

  // YouTube
  let ytId = null;
  if (host === 'youtu.be') {
    ytId = u.pathname.slice(1).split('/')[0];
  } else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    if (u.pathname === '/watch') ytId = u.searchParams.get('v');
    else {
      const m = /^\/(?:shorts|embed|live)\/([^/?]+)/.exec(u.pathname);
      if (m) ytId = m[1];
    }
  }
  if (ytId && /^[A-Za-z0-9_-]{11}$/.test(ytId)) {
    return {
      kind: 'iframe',
      embedUrl: `https://www.youtube-nocookie.com/embed/${ytId}`,
      originalUrl: url,
      provider: 'YouTube'
    };
  }

  // Vimeo
  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const m = /\/(?:video\/)?(\d{5,12})/.exec(u.pathname);
    if (m) {
      return {
        kind: 'iframe',
        embedUrl: `https://player.vimeo.com/video/${m[1]}`,
        originalUrl: url,
        provider: 'Vimeo'
      };
    }
  }

  // Direct video files or Firebase Storage / Cloudinary videos
  if (/\.(mp4|webm|ogg|mov)(\?|$)/i.test(u.pathname) || /\/video\/upload\//i.test(u.pathname) || host.includes('firebasestorage')) {
    return {
      kind: 'video',
      embedUrl: url,
      originalUrl: url,
      provider: 'Direct Video'
    };
  }

  return null;
}

export function isSafeHttpUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) return true;
  try {
    const u = new URL(trimmed);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}

export function formatFileSize(bytes) {
  const n = Number(bytes || 0);
  if (!n) return '';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Creates a fresh, blank 8-phase PBL unit ready for document-style authoring
 * without requiring AI synthesis first.
 */
export function createBlankEightPhaseUnit(coachUid = 'coach') {
  const id = `prog-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  return {
    id,
    unitTitle: 'Untitled Learning Program',
    subtitle: '',
    introduction: '',
    coverImage: '',
    category: PROGRAM_CATEGORIES[0],
    tags: [],
    tone: 'purple',
    theme: PROGRAM_CATEGORIES[0],
    programme: 'WLS',
    duration: '8 stages',
    language: 'en-GB',
    pitchLevel: 'core',
    realProblem: '',
    drivingQuestion: 'How might we design an impactful solution for our community?',
    finalProduct: '',
    status: 'draft',
    authorId: coachUid || 'coach',
    competencies: [],
    targetLearner: { id: 'universal-all', name: 'All Learners', isUniversal: true, appliedAccommodations: [] },
    makerSpaceSpecs: [],
    coachCues: {
      leadCoach: 'Coach',
      assistantCoach: 'Co-Pilot',
      interventionFocus: 'Guide inquiry, support prototype iteration, and celebrate reflection.'
    },
    milestones: PBL_STAGES.map((st) => ({
      id: `phase-${st.stageNumber}`,
      stageNumber: st.stageNumber,
      stageName: st.stageName,
      title: `Stage ${st.stageNumber}: ${st.stageName}`,
      week: st.week,
      durationMin: 90,
      learningGoal: '',
      activities: [],
      makerSpaceTools: [],
      evidencePrompt: 'Submit your milestone evidence or reflection.',
      allowedSubmissions: ['video', 'github', 'prototype', 'note', 'photo'],
      coachCue: '',
      competencies: [],
      contentBlocks: []
    })),
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
}

/**
 * Converts a stored PblProgram (from Firestore or localStorage) back into an
 * editable PblUnit, preserving its exact `id`, all 8 phases, cover, metadata,
 * and rich `contentBlocks` so reopening & editing never creates duplicates.
 */
export function programToUnit(program) {
  if (!program || typeof program !== 'object') return createBlankEightPhaseUnit();
  const rawPhases = Array.isArray(program.phases) && program.phases.length > 0
    ? program.phases
    : PBL_STAGES.map((st) => ({
        id: `phase-${st.stageNumber}`,
        phaseId: `phase-${st.stageNumber}`,
        title: `Stage ${st.stageNumber}: ${st.stageName}`,
        weeks: [st.week, st.week],
        learningGoal: '',
        sessions: []
      }));

  const milestones = rawPhases.map((ph, idx) => {
    const stageNumber = idx + 1;
    const defaultStage = PBL_STAGES[idx] || { stageNumber, stageName: `Phase ${stageNumber}`, week: stageNumber };
    const firstSession = Array.isArray(ph.sessions) && ph.sessions[0] ? ph.sessions[0] : {};
    const week = Array.isArray(ph.weeks) && ph.weeks.length > 0 ? ph.weeks[0] : (firstSession.week || defaultStage.week);
    const rawTitle = ph.title || firstSession.title || `Stage ${stageNumber}: ${defaultStage.stageName}`;
    const stageName = ph.stageName || (rawTitle.includes(':') ? rawTitle.split(':').slice(1).join(':').trim() : defaultStage.stageName);

    return {
      id: ph.id || ph.phaseId || `phase-${stageNumber}`,
      stageNumber,
      stageName,
      title: rawTitle,
      week: Number(week) || stageNumber,
      durationMin: Number(firstSession.durationMin || firstSession.minutes || 90),
      learningGoal: ph.learningGoal || ph.goal || firstSession.learningGoal || '',
      activities: Array.isArray(firstSession.activities) && firstSession.activities.length > 0
        ? firstSession.activities
        : (Array.isArray(ph.tasks) ? ph.tasks : []),
      makerSpaceTools: Array.isArray(firstSession.makerSpaceTools) && firstSession.makerSpaceTools.length > 0
        ? firstSession.makerSpaceTools
        : (Array.isArray(ph.tools) ? ph.tools : []),
      evidencePrompt: firstSession.evidenceToCollect?.prompt
        || (Array.isArray(ph.evidence) && ph.evidence[0])
        || 'Submit your milestone evidence or reflection.',
      allowedSubmissions: Array.isArray(firstSession.allowedSubmissions)
        ? firstSession.allowedSubmissions
        : ['video', 'github', 'prototype'],
      coachCue: ph.coachCue || firstSession.teacherTips || '',
      competencies: Array.isArray(ph.competencies)
        ? ph.competencies.map((c) => (typeof c === 'string' ? { framework: 'welearn', id: c } : c))
        : [],
      contentBlocks: normalizeContentBlocks(ph.contentBlocks)
    };
  });

  return {
    id: program.id || program.slug || nextId('prog'),
    unitTitle: program.title || program.unitTitle || 'Untitled Learning Program',
    subtitle: program.subtitle || '',
    introduction: program.introduction || program.overview || '',
    coverImage: program.coverImage || program.identity?.cover || '',
    category: program.category || program.theme || PROGRAM_CATEGORIES[0],
    tags: Array.isArray(program.tags) ? program.tags : [],
    tone: program.tone || program.identity?.tone || 'purple',
    theme: program.theme || program.category || 'General STEM',
    programme: program.programme || 'WLS',
    duration: program.duration || `${milestones.length} stages`,
    language: program.language || 'en-GB',
    pitchLevel: program.pitchLevel || 'core',
    realProblem: typeof program.realProblem === 'string'
      ? program.realProblem
      : (program.realProblem?.summary || ''),
    drivingQuestion: program.drivingQuestion || '',
    finalProduct: program.finalProduct || '',
    status: program.status === 'published' ? 'published' : 'draft',
    authorId: program.authorId || program.authorUid || 'coach',
    competencies: Array.isArray(program.competencies) ? program.competencies : [],
    targetLearner: program.targetLearner || { id: 'universal-all', name: 'All Learners', isUniversal: true, appliedAccommodations: [] },
    makerSpaceSpecs: Array.isArray(program.makerSpaceSpecs) ? program.makerSpaceSpecs : [],
    coachCues: program.coachCues || {
      leadCoach: 'Coach',
      assistantCoach: 'Co-Pilot',
      interventionFocus: ''
    },
    milestones,
    createdAt: program.createdAt || Date.now(),
    updatedAt: program.updatedAt || Date.now()
  };
}
