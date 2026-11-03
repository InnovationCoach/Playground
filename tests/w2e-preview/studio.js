/* WeLearn W2e learning studio — preview interactions.
   Everything here is in-memory demo state. No network, storage, AI, or Firebase. */
(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const root = document.documentElement;
  const reducedMotion = () => root.dataset.motion === 'reduce' || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const icon = (name) => `<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;
  const setStatus = (el, kind, title, text) => {
    el.className = `status status-${kind}`;
    el.innerHTML = `${icon(kind === 'error' ? 'alert' : kind === 'success' ? 'check-circle' : kind === 'paused' ? 'pause' : 'info')}<div>${title ? `<strong>${title}</strong>` : ''}${text}</div>`;
  };
  const clearStatus = (el) => { el.className = 'status'; el.textContent = ''; };

  /* ---------- Notice height drives sticky offsets (works at any zoom/text size) ---------- */
  const notice = document.querySelector('.notice');
  const setNoticeH = () => root.style.setProperty('--notice-h', `${notice.offsetHeight}px`);
  new ResizeObserver(setNoticeH).observe(notice); setNoticeH();

  /* ---------- Brand logo fallback ---------- */
  $('brandLogo').addEventListener('error', () => $('brandLink').classList.add('logo-failed'));

  /* ---------- Sidebar: collapse (desktop) and drawer (narrow) ---------- */
  const shell = $('shell'), sidebar = $('sidebar'), backdrop = $('backdrop');
  const menuBtn = $('menuBtn'), collapseBtn = $('collapseBtn'), closeDrawerBtn = $('closeDrawerBtn');
  const content = document.querySelector('.content');
  const narrow = window.matchMedia('(max-width: 860px)');

  collapseBtn.addEventListener('click', () => {
    const collapsed = shell.classList.toggle('collapsed');
    collapseBtn.setAttribute('aria-expanded', String(!collapsed));
    collapseBtn.setAttribute('aria-label', collapsed ? 'Expand navigation' : 'Collapse navigation');
  });

  function openDrawer() {
    sidebar.classList.add('is-open'); backdrop.classList.add('is-open');
    menuBtn.setAttribute('aria-expanded', 'true'); closeDrawerBtn.hidden = false; content.inert = true;
    (sidebar.querySelector('.nav-link[aria-current="page"]') || sidebar.querySelector('.nav-link')).focus();
  }
  function closeDrawer(restore = true) {
    if (!sidebar.classList.contains('is-open')) return;
    sidebar.classList.remove('is-open'); backdrop.classList.remove('is-open');
    menuBtn.setAttribute('aria-expanded', 'false'); closeDrawerBtn.hidden = true; content.inert = false;
    if (restore) menuBtn.focus();
  }
  menuBtn.addEventListener('click', openDrawer);
  closeDrawerBtn.addEventListener('click', () => closeDrawer());
  backdrop.addEventListener('click', () => closeDrawer());
  sidebar.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sidebar.classList.contains('is-open')) { e.preventDefault(); closeDrawer(); }
    if (e.key === 'Tab' && sidebar.classList.contains('is-open')) {
      const f = $$('a[href], button:not([hidden]), input', sidebar).filter((el) => el.offsetParent !== null);
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  narrow.addEventListener('change', () => { if (!narrow.matches) closeDrawer(false); });

  /* ---------- Views: learner / coach ---------- */
  const learnerEl = $('learner'), coachEl = $('coach');
  const titles = {
    home: ['Home', 'Year 9 · W2e pod'], pbl: ['PBL Studio', 'Three semesters'], steam: ['STEAM Activities', 'Hands-on labs'],
    academic: ['Academic Progress', 'Separate from PBL'], goals: ['My Goals', 'Agreed with your coach'], calendar: ['School Calendar', 'Read-only'],
    coach: ['Coach dashboard', 'Year 9 · W2e pod']
  };
  let isCoach = false;
  function setView(coach) {
    isCoach = coach;
    coachEl.hidden = !coach; learnerEl.hidden = coach;
    $('navLearner').hidden = coach; $('navCoach').hidden = !coach;
    $('viewToggle').hidden = coach;
    $('helpSidebar').hidden = coach;
    $('coachView').setAttribute('aria-pressed', String(coach));
    $('studentView').setAttribute('aria-pressed', String(!coach));
    if (coach) { setTitle('coach'); $('coachTop').focus?.(); window.scrollTo({ top: 0 }); }
    else showPage(currentPage, false);
  }
  $('coachView').addEventListener('click', () => setView(true));
  $('studentView').addEventListener('click', () => setView(false));

  function setTitle(key) { const t = titles[key] || titles.home; $('pageTitle').textContent = t[0]; $('pageSub').textContent = t[1]; document.title = `${t[0]} · W2e learning studio · WeLearn design preview`; }

  /* ---------- Learner pages ---------- */
  let currentPage = 'home';
  const acadLoaded = { done: false };
  function showPage(key, focusHeading = true) {
    currentPage = key;
    $$('#learner .page').forEach((p) => p.classList.toggle('is-active', p.dataset.page === key));
    $$('#navLearner .nav-link').forEach((a) => { if (a.dataset.nav === key) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    setTitle(key);
    if (key === 'academic' && !acadLoaded.done) simulateAcademicLoad();
    window.scrollTo({ top: 0 });
    if (focusHeading) { const h = document.querySelector(`#learner .page[data-page="${key}"] h1`); h?.setAttribute('tabindex', '-1'); h?.focus({ preventScroll: true }); }
    if (history.replaceState) history.replaceState(null, '', `#${key}`);
  }
  document.addEventListener('click', (e) => {
    const link = e.target.closest('[data-nav]');
    if (!link) return;
    e.preventDefault();
    if (isCoach) setView(false);
    showPage(link.dataset.nav);
    closeDrawer(false);
    if (link.dataset.focusNext) focusNextStep();
  });
  function simulateAcademicLoad() {
    const sk = $('acadLoading'), c = $('acadContent');
    sk.hidden = false; c.hidden = true;
    setTimeout(() => { sk.hidden = true; c.hidden = false; acadLoaded.done = true; }, reducedMotion() ? 0 : 600);
  }

  /* Coach in-page navigation */
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-coachnav]');
    if (!a) return;
    e.preventDefault();
    $$('#navCoach .nav-link').forEach((x) => x.removeAttribute('aria-current'));
    a.setAttribute('aria-current', 'page');
    closeDrawer(false);
    const target = $(a.dataset.coachnav);
    target?.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' });
    (target?.querySelector('h1, h2, h3') || target)?.focus?.({ preventScroll: true });
  });
  $$('.tile').forEach((t) => t.addEventListener('click', (e) => { e.preventDefault(); const target = $(t.getAttribute('href').slice(1)); target?.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' }); target?.focus({ preventScroll: true }); }));

  /* ---------- Focus / Explore ---------- */
  function setMode(focus) {
    learnerEl.classList.toggle('is-focus', focus);
    $('focus').setAttribute('aria-pressed', String(focus));
    $('explore').setAttribute('aria-pressed', String(!focus));
    if (focus) stopAutoplay();
  }
  $('focus').addEventListener('click', () => setMode(true));
  $('explore').addEventListener('click', () => setMode(false));

  /* ---------- Motivational slider ---------- */
  const track = $('sliderTrack'), slides = $$('.slide', track), dots = $$('#sliderDots button'), live = $('sliderLive');
  const slider = $('slider'), viewport = $('sliderViewport'), autoplayBox = $('autoplay');
  let index = 0, timer = null;
  function goTo(n, announce = true) {
    index = (n + slides.length) % slides.length;
    track.style.transition = reducedMotion() ? 'none' : '';
    track.style.transform = `translateX(-${index * 100}%)`;
    slides.forEach((s, i) => { s.setAttribute('aria-hidden', String(i !== index)); $$('a, button', s).forEach((el) => { el.tabIndex = i === index ? 0 : -1; }); });
    dots.forEach((d, i) => { if (i === index) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current'); });
    $('slideCount').textContent = `${index + 1} / ${slides.length}`;
    if (announce) live.textContent = `Slide ${index + 1} of ${slides.length}: ${slides[index].querySelector('blockquote').textContent}`;
  }
  $('prevSlide').addEventListener('click', () => { goTo(index - 1); restartAutoplay(); });
  $('nextSlide').addEventListener('click', () => { goTo(index + 1); restartAutoplay(); });
  dots.forEach((d) => d.addEventListener('click', () => { goTo(Number(d.dataset.slide)); restartAutoplay(); }));
  slider.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return;
    if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(index - 1); restartAutoplay(); }
    if (e.key === 'ArrowRight') { e.preventDefault(); goTo(index + 1); restartAutoplay(); }
    if (e.key === 'Home') { e.preventDefault(); goTo(0); }
    if (e.key === 'End') { e.preventDefault(); goTo(slides.length - 1); }
  });
  // Touch / pointer swipe
  let startX = null;
  viewport.addEventListener('pointerdown', (e) => { if (e.pointerType === 'mouse' && e.button !== 0) return; startX = e.clientX; });
  viewport.addEventListener('pointerup', (e) => { if (startX === null) return; const dx = e.clientX - startX; startX = null; if (Math.abs(dx) > 40) { goTo(index + (dx < 0 ? 1 : -1)); restartAutoplay(); } });
  viewport.addEventListener('pointercancel', () => { startX = null; });
  // Optional autoplay: off by default, pauses on hover/focus, disabled under reduced motion
  function startAutoplay() { stopAutoplay(); if (!autoplayBox.checked || reducedMotion()) return; timer = setInterval(() => goTo(index + 1, false), 7000); }
  function stopAutoplay() { if (timer) clearInterval(timer); timer = null; }
  function restartAutoplay() { if (autoplayBox.checked) startAutoplay(); }
  autoplayBox.addEventListener('change', () => { if (autoplayBox.checked) { startAutoplay(); live.textContent = 'Auto-advance on. Slides change every seven seconds and pause while you hover or focus the slider.'; } else { stopAutoplay(); live.textContent = 'Auto-advance off.'; } });
  slider.addEventListener('mouseenter', stopAutoplay); slider.addEventListener('mouseleave', restartAutoplay);
  slider.addEventListener('focusin', stopAutoplay); slider.addEventListener('focusout', (e) => { if (!slider.contains(e.relatedTarget)) restartAutoplay(); });
  document.addEventListener('visibilitychange', () => (document.hidden ? stopAutoplay() : restartAutoplay()));
  function syncAutoplayAvailability() { const off = reducedMotion(); autoplayBox.disabled = off; autoplayBox.parentElement.title = off ? 'Auto-advance is unavailable while reduced motion is on' : ''; if (off) { autoplayBox.checked = false; stopAutoplay(); } }
  window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', syncAutoplayAvailability);
  syncAutoplayAvailability();
  goTo(0, false);
  $$('[data-slide-action]').forEach((b) => b.addEventListener('click', () => {
    const act = b.dataset.slideAction;
    if (act === 'continue') focusNextStep();
    if (act === 'curiosity') openCuriosity();
    if (act === 'evidence') openEvidence();
  }));

  /* ---------- Next step ---------- */
  const steps = $$('.step'), ring = $('progressRing'), taskStatus = $('taskStatus');
  let paused = false;
  function focusNextStep() {
    const el = $('nextStep');
    el.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' });
    $('nextHeading').setAttribute('tabindex', '-1'); $('nextHeading').focus({ preventScroll: true });
  }
  $('continueBtn').addEventListener('click', focusNextStep);
  function updateProgress() {
    const done = steps.filter((s) => s.checked).length, total = steps.length;
    ring.style.setProperty('--p', Math.round((done / total) * 100));
    ring.setAttribute('aria-label', `${done} of ${total} steps done`);
    $('progressText').textContent = `${done}/${total}`;
    if (done === total) setStatus(taskStatus, 'success', 'All three steps are ticked.', 'Show your thinking when you are ready. There is no timer, and you can untick a step to revisit it.');
    else if (!paused) clearStatus(taskStatus);
  }
  steps.forEach((s) => s.addEventListener('change', () => { paused = false; updateProgress(); }));
  $('pause').addEventListener('click', () => {
    paused = !paused;
    if (paused) {
      setStatus(taskStatus, 'paused', 'Paused.', 'Your ticked steps stay here while this page is open. Come back whenever you are ready.');
      $('pause').innerHTML = `${icon('play')}Resume`;
    } else { clearStatus(taskStatus); $('pause').innerHTML = `${icon('pause')}Pause`; updateProgress(); }
  });

  /* ---------- Pacing check-in ---------- */
  $$('[data-energy]').forEach((b) => b.addEventListener('click', () => {
    $$('[data-energy]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    setStatus($('energyResult'), 'info', '', b.dataset.energy);
  }));

  /* ---------- Pod mission ---------- */
  let pod = 6;
  $('podAdd').addEventListener('click', () => {
    if (pod >= 10) return;
    pod += 1;
    const bar = $('podBar'); bar.setAttribute('aria-valuenow', pod); bar.firstElementChild.style.width = `${pod * 10}%`;
    $('podText').textContent = `${pod} of 10 collected together. Every contribution counts; nobody is ranked.`;
    if (pod === 10) { setStatus($('podStatus'), 'success', 'Mission complete.', 'Ten observations, collected by the whole pod. Nice work, everyone.'); $('podAdd').disabled = true; }
    else setStatus($('podStatus'), 'info', '', 'Added to the sample count. Nothing is saved.');
  });

  /* ---------- Dialog helpers (focus restore + Escape via native <dialog>) ---------- */
  let opener = null;
  function openDialog(d) {
    opener = document.activeElement;
    d.showModal();
    const first = d.querySelector('[autofocus], select, textarea, input:not([type=hidden]), .format, button:not([data-close])');
    (first || d.querySelector('button')).focus();
  }
  document.querySelectorAll('dialog').forEach((d) => {
    d.addEventListener('close', () => { if (opener && document.contains(opener)) opener.focus(); opener = null; });
    d.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) d.close(); });
  });
  function openInfo(title, html) { $('dialogTitle').textContent = title; $('dialogContent').innerHTML = html; openDialog($('dialog')); }

  const info = {
    portfolio: ['Sustainable Futures portfolio', '<p>Your Semester 1 evidence stays exactly as you submitted it. Milestone 5 (“Share and reflect”) is open for a final reflection.</p><ul><li>Milestone 1 · Map the problem — reviewed</li><li>Milestone 2 · Investigate — reviewed</li><li>Milestone 3 · Prototype — reviewed</li><li>Milestone 4 · Test and improve — reviewed</li><li>Milestone 5 · Share and reflect — not started</li></ul><p class="muted">Sample portfolio. The live platform keeps the original record IDs.</p>'],
    arachne: ['Project Arachne', '<p>Semester 3 is robotics: how can we design and modify a quadruped robot to navigate diverse and challenging terrains? Biomimicry, hardware, an adaptation lab, locomotion tuning and a final gauntlet.</p><p>It opens when your school publishes the offering for your class. Nothing to do yet.</p><p class="muted">Sample description from the program catalogue.</p>'],
    review: ['Coach evidence review', '<p>Check the explanation against the project rubric. Identify the evidence, ask one useful question, and agree a next step with the learner.</p><p>Outcomes: <strong>Publish feedback</strong> or <strong>Request a revision</strong>. Lesson review stays separate from formal milestone approval.</p><p class="muted">The existing platform supports feedback and revision requests. Audio storage and rubric grading need further implementation.</p>'],
    transcript: ['Transcript · Jordan · 2:40', '<p class="quote">“When I put the insulation on the model house the thermometer dropped more slowly, so the heater would need to run less…”</p><p class="muted">Sample transcript. Real transcripts need a reviewed captioning service and learner consent.</p>']
  };
  document.addEventListener('click', (e) => { const b = e.target.closest('[data-open]'); if (b && info[b.dataset.open]) openInfo(...info[b.dataset.open]); });

  /* ---------- Support request ---------- */
  const requests = [{ who: 'Jordan', a: 'a2', text: 'Explain this a different way', note: 'The insulation graph. I get the numbers but not what the curve means.', when: 'Today 09:12', learner: 'jordan' }];
  function openSupport() { openDialog($('supportDialog')); }
  ['help', 'helpAside', 'helpSidebar', 'heroHelp'].forEach((id) => $(id).addEventListener('click', openSupport));
  $('supportForm').addEventListener('submit', (e) => {
    e.preventDefault();
    requests.push({ who: 'Alex', a: 'a1', text: $('support').value, note: $('supportNote').value.trim(), when: 'Just now', learner: 'alex' });
    $('supportNote').value = '';
    renderRequests();
    $('supportDialog').close();
    setStatus(taskStatus, 'success', 'Added to the demo coach view.', 'No real coach has been notified. Switch to the coach prototype control to see it.');
  });
  function renderRequests() {
    const box = $('requests'); box.replaceChildren();
    const filter = $('learnerSelect').value;
    const visible = requests.filter((r) => filter === 'all' || r.learner === filter);
    $('tileRequests').textContent = requests.length;
    if (!visible.length) {
      box.innerHTML = `<div class="empty">${icon('inbox')}<strong>No open requests</strong><span>Learner requests appear here with their own words. Try one from the learner view.</span></div>`;
      return;
    }
    visible.forEach((r) => {
      const i = requests.indexOf(r);
      const el = document.createElement('div'); el.className = 'item';
      el.innerHTML = `<span class="avatar ${r.a}" aria-hidden="true">${r.who[0]}</span><div><div class="item-head"><h4>${r.who} · ${r.text}</h4><span class="badge badge-request">${icon('inbox')}Request</span></div>${r.note ? `<p class="quote">${escapeHtml(r.note)}</p>` : ''}<p class="muted">${r.when}</p><div class="actions"><button class="btn btn-primary btn-sm" type="button" data-ack="${i}">${icon('check')}Mark check-in complete</button><button class="btn btn-ghost btn-sm" type="button" data-open="review">Open learner context</button></div></div>`;
      box.append(el);
    });
    $$('[data-ack]', box).forEach((b) => b.addEventListener('click', () => { requests.splice(Number(b.dataset.ack), 1); renderRequests(); $('reqHeading').focus(); }));
  }
  const escapeHtml = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- Coach learner filter ---------- */
  $('learnerSelect').addEventListener('change', () => {
    const v = $('learnerSelect').value;
    $$('.learner-row').forEach((row) => { row.hidden = v !== 'all' && row.dataset.learner !== v; });
    const name = v === 'all' ? 'Alex' : v[0].toUpperCase() + v.slice(1);
    $('prefName').textContent = name + '’s';
    $('prefsAlex').hidden = v !== 'all' && v !== 'alex';
    $('prefsEmpty').hidden = !(v !== 'all' && v !== 'alex');
    renderRequests();
  });
  renderRequests();

  /* ---------- Evidence formats ---------- */
  const guidance = {
    'Written explanation': ['Write it down', 'List the three energy users, explain your estimate for the biggest one, and name one thing you are unsure about.', 'pen'],
    'Audio explanation': ['Talk it through', 'Record one to three minutes. Say which space you chose, the three energy users, and why one probably uses the most.', 'mic'],
    'Photo or diagram': ['Show it', 'Add a photo or sketch with labels. A short caption can explain your estimate and your uncertainty.', 'camera'],
    'Video explanation': ['Walk us around', 'A short clip of the space with your voice-over works well. Keep other people out of shot.', 'video'],
    'Code or model': ['Model it', 'Share a spreadsheet, simulation or code that estimates energy use. Explain your assumptions in a comment.', 'code']
  };
  function openEvidence() { openDialog($('evidenceDialog')); }
  $('evidence').addEventListener('click', openEvidence);
  $$('.format').forEach((b) => b.addEventListener('click', () => {
    $$('.format').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    const [title, text, ic] = guidance[b.dataset.format];
    setStatus($('formatResult'), 'info', title, `${text} A coach gives feedback; AI never assigns a grade.`);
    $('formatTools').hidden = false;
    $('dropTitle').textContent = ic === 'mic' || ic === 'video' ? 'Record here, or drop a file' : ic === 'pen' ? 'Write in the studio, or drop a document' : 'Drop a file here or choose one';
    $('recordBtn').hidden = !(ic === 'mic' || ic === 'video');
    $('recordBtn').innerHTML = `${icon(ic)}Record`;
  }));
  ['chooseFile', 'recordBtn'].forEach((id) => $(id).addEventListener('click', () => setStatus($('formatResult'), 'info', 'Not connected in this preview.', 'Uploads and recording need private storage, size and type checks, and transcripts. See the handover for the contract.')));

  /* ---------- Display preferences ---------- */
  $('prefsBtn').addEventListener('click', () => openDialog($('prefsDialog')));
  $('prefCalm').addEventListener('change', (e) => { if (e.target.checked) root.dataset.calm = ''; else delete root.dataset.calm; });
  $('prefMotion').addEventListener('change', (e) => { if (e.target.checked) root.dataset.motion = 'reduce'; else delete root.dataset.motion; syncAutoplayAvailability(); goTo(index, false); });
  $$('#textSize button').forEach((b) => b.addEventListener('click', () => {
    $$('#textSize button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    if (b.dataset.text) root.dataset.text = b.dataset.text; else delete root.dataset.text;
  }));

  /* ---------- Curiosity + example planner ---------- */
  function openCuriosity() {
    openInfo('How does a game use energy?', '<p>Pick a question. You can return to your main project at any time.</p><ul><li>What happens to power use when graphics settings change?</li><li>How could solar energy power a gaming device?</li><li>How does a game simulate a real microgrid?</li></ul><p class="muted">Optional exploration. No score, no deadline.</p>');
  }
  $('curiosity').addEventListener('click', openCuriosity);
  $('planner').addEventListener('click', () => openInfo('Example quest: understand game energy use', '<p class="muted">Prewritten example, not AI-generated. Edit the steps before discussing them with your coach.</p><div class="field"><label for="questSteps">Your plan</label><textarea id="questSteps" style="min-height:190px">1. Choose one game or device.\n2. Find its power use or record an estimate.\n3. Calculate energy for one hour of play.\n4. Explain assumptions in your preferred format.\n5. Ask your coach what to investigate next.</textarea></div><p>Start with step one. Estimates and materials should be checked with your coach.</p>'));

  /* ---------- AI panel (demonstration content only) ---------- */
  const ai = $('aiDrawer');
  let aiOnUse = null;
  function openAi({ title, intro, context, draft, onUse }) {
    $('aiTitleText').textContent = title;
    $('aiIntro').textContent = intro;
    $('aiContext').innerHTML = context.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
    $('aiText').value = draft;
    clearStatus($('aiStatus'));
    aiOnUse = onUse;
    openDialog(ai);
    $('aiText').focus();
  }
  $('aiDiscard').addEventListener('click', () => { $('aiText').value = ''; ai.close(); });
  $('aiUse').addEventListener('click', () => {
    const text = $('aiText').value.trim();
    if (!text) { setStatus($('aiStatus'), 'error', 'Nothing to use.', 'Add some text, or go back to your task.'); return; }
    setStatus($('aiStatus'), 'success', 'Kept with your task in this preview.', 'Nothing is published or sent. In the platform you or your coach would accept a draft explicitly.');
    aiOnUse?.(text);
  });
  $('planAi').addEventListener('click', () => openAi({
    title: 'Help me plan this quest', intro: 'A future assistant would draft steps from approved project content. You edit, then decide.',
    context: [['Project', 'Net Zero Microgrid · Milestone 2'], ['Your question', 'How does a game use energy?'], ['Time you have', 'About 10 minutes today']],
    draft: '1. Pick one device you play on.\n2. Find its power rating on the label or in settings.\n3. Estimate energy for one hour of play (power × time).\n4. Compare it with one campus energy user you observed.\n5. Write one question for your coach.',
    onUse: () => setStatus(taskStatus, 'info', 'Plan kept (preview).', 'Your edited plan would be attached to this task for your coach to see.')
  }));
  $('explainAi').addEventListener('click', () => openAi({
    title: 'Explain this another way', intro: 'Demonstration of a plain-language restatement. Nothing here was generated.',
    context: [['Task', 'Find the campus energy hotspots'], ['Current wording', 'Identify three electricity users and explain which uses the most']],
    draft: 'Think of your chosen room as a small city. Three “citizens” use electricity: maybe lights, a projector, a fridge. Which one is “awake” the longest, and which one works the hardest while it is on? The hardest-working, longest-awake one is probably your hotspot.',
    onUse: (text) => setStatus(taskStatus, 'info', 'Another way to see it', escapeHtml(text))
  }));
  $('deeperAi').addEventListener('click', () => openAi({
    title: 'Suggest a deeper question', intro: 'Demonstration of an optional follow-up question. Not graded, not generated.',
    context: [['Starting question', 'How does a game use energy?'], ['Linked program', 'Net Zero Microgrid']],
    draft: 'If your whole pod played the same game for one hour, how much solar panel area would it take to power that session on a sunny day? What would change on a cloudy one?',
    onUse: () => {}
  }));
  $('draftAi').addEventListener('click', () => openAi({
    title: 'Draft a feedback prompt', intro: 'Demonstration of a coach-facing draft. The coach edits and decides; nothing is sent automatically.',
    context: [['Learner', 'Jordan · Sustainable Futures · Milestone 4'], ['Evidence', 'Audio explanation, insulation and energy demand'], ['Rubric focus', 'Uses observation to support a claim']],
    draft: 'Thanks for talking this through, Jordan. Your explanation of why the heater runs less with insulation is clear. Which of your observations best supports that claim? If you can point to one measurement, you have met the milestone.',
    onUse: () => {}
  }));

  /* ---------- Class-code join (demo validation) ---------- */
  $('joinForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const code = $('joinCode').value.trim().toUpperCase();
    const st = $('joinStatus');
    if (!code) { setStatus(st, 'error', 'Enter a class code.', 'Your coach shares codes in the studio.'); $('joinCode').focus(); return; }
    if (!code.startsWith('SOLAR')) { setStatus(st, 'error', 'Code not recognised in this preview.', 'Check the code with your coach. Codes expire and only work for your class.'); $('joinCode').focus(); return; }
    setStatus(st, 'success', 'Joined Solar Car Lab (sample).', 'In the live platform this is a server-side, rate-limited enrolment. Nothing was saved here.');
  });

  /* ---------- Goals ---------- */
  $('ackGoal').addEventListener('click', () => {
    $('ackGoal').replaceWith(Object.assign(document.createElement('span'), { className: 'badge badge-done', innerHTML: `${icon('check-circle')}Acknowledged` }));
    setStatus($('goalStatus'), 'success', 'Goal acknowledged (sample).', 'Your coach confirms achievement when you get there.');
  });

  /* ---------- Initial route ---------- */
  const hash = location.hash.replace('#', '');
  if (titles[hash] && hash !== 'coach') showPage(hash, false);
  updateProgress();
})();
