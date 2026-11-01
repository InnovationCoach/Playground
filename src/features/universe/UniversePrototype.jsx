import { useEffect, useId, useReducer, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ChevronDown, Compass, Copy, FlaskConical, Gift, Hammer, Leaf, Move, Pause, Play, Plus, Redo2, RotateCcw, RotateCw, Save, Sparkles, Trash2, Undo2, X, Bot } from 'lucide-react';
import { ASSETS, THEMES, PALETTES, BODY_TYPES, TRAITS, ACCESSORIES, MAX_OBJECTS, assetById, hydrateWorld, historyState, starterWorld, universeReducer, position } from './universeModel.js';
import { AssetArt, CreatureArt, CreatureMotion, WorldBackdrop } from './UniverseArt.jsx';
import './universe.css';

const MODES = [['explore', 'Explore', Compass], ['build', 'Build', Hammer], ['creatures', 'Creatures', Bot], ['experiment', 'Experiment', FlaskConical]];
const keyFor = uid => `spark-universe-prototype:v1:${uid || 'sample'}`;
function initialWorld(uid) {
  try { const raw = localStorage.getItem(keyFor(uid)); if (raw) { const parsed = JSON.parse(raw); return { world: hydrateWorld(parsed.world) || starterWorld(), loaded: !!hydrateWorld(parsed.world) }; } } catch { /* A blocked/corrupt browser store must not prevent playing. */ }
  return { world: starterWorld(), loaded: false };
}

export function UniversePrototype({ uid = 'sample', onClose, initialCalm = false, active = true }) {
  return <PrototypeEditor key={uid} uid={uid} onClose={onClose} initialCalm={initialCalm} active={active} />;
}

function PrototypeEditor({ uid, onClose, initialCalm, active }) {
  const [initial] = useState(() => initialWorld(uid));
  const [state, dispatch] = useReducer(universeReducer, initial.world, historyState);
  const world = state.world;
  const [mode, setMode] = useState('build'), [category, setCategory] = useState('nature'), [selected, setSelected] = useState(null);
  const [notice, setNotice] = useState(initial.loaded ? 'Your browser-saved prototype is ready.' : 'Welcome to your moon garden. Pick something from the tray to start.'), [saveError, setSaveError] = useState('');
  const [saved, setSaved] = useState(initial.loaded ? JSON.stringify(initial.world) : ''), [rewardOpen, setRewardOpen] = useState(false);
  const [gravity, setGravity] = useState('normal'), [running, setRunning] = useState(false), [resetTick, setResetTick] = useState(0), [stepTick, setStepTick] = useState(0);
  const [calm, setCalm] = useState(() => initialCalm || !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  const [dragPreview, setDragPreview] = useState(null);
  const stage = useRef(null), drag = useRef(null);
  const prefix = useId().replace(/:/g, '');
  const dirty = saved !== JSON.stringify(world);
  const selectedObject = selected === 'creature' ? world.creature : world.objects.find(o => o.id === selected);
  const selectedName = selected === 'creature' ? world.creature.name : assetById(selectedObject?.asset)?.name;
  const visibleAssets = ASSETS.filter(a => a.category === category && (!a.reward || world.sampleReward === a.id));

  useEffect(() => { if (selected && !selectedObject) setSelected(null); }, [selected, selectedObject]);
  useEffect(() => { if (initialCalm) { setCalm(true); setRunning(false); } }, [initialCalm]);
  useEffect(() => {
    const query = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const respectMotion = e => { if (e.matches) { setCalm(true); setRunning(false); } };
    query?.addEventListener?.('change', respectMotion);
    return () => query?.removeEventListener?.('change', respectMotion);
  }, []);

  function save() {
    try {
      localStorage.setItem(keyFor(uid), JSON.stringify({ world, savedAt: new Date().toISOString() }));
      setSaved(JSON.stringify(world)); setSaveError(''); setNotice('Prototype saved in this browser. It is not synced to your school account.'); return true;
    } catch { setSaveError('This browser could not save the prototype. Keep this page open to retain your work.'); return false; }
  }
  function add(asset) {
    if (world.objects.length >= MAX_OBJECTS) { setNotice('Your island has 40 objects. Remove one to make room.'); return; }
    const id = crypto.randomUUID(); dispatch({ type: 'add', asset, id }); setSelected(id); setMode('build');
    setNotice(`${assetById(asset).name} placed. Drag it or use the arrow keys and position controls.`);
  }
  function point(event) {
    const p = stage.current.createSVGPoint(); p.x = event.clientX; p.y = event.clientY;
    return p.matrixTransform(stage.current.getScreenCTM().inverse());
  }
  function startDrag(event, id) {
    event.stopPropagation(); setSelected(id);
    if (mode !== 'build') return;
    event.preventDefault();
    const p = point(event), item = id === 'creature' ? world.creature : world.objects.find(o => o.id === id);
    drag.current = { id, dx: p.x - item.x, dy: p.y - item.y, pointer: event.pointerId };
    stage.current.setPointerCapture?.(event.pointerId);
  }
  function moveDrag(event) {
    if (!drag.current || drag.current.pointer !== event.pointerId) return;
    event.stopPropagation(); const p = point(event);
    setDragPreview({ id: drag.current.id, ...position(p.x - drag.current.dx, p.y - drag.current.dy) });
  }
  function finishDrag(event) {
    if (!drag.current || drag.current.pointer !== event.pointerId) return;
    event.stopPropagation(); const p = point(event);
    dispatch({ type: 'move', id: drag.current.id, x: p.x - drag.current.dx, y: p.y - drag.current.dy });
    setNotice('Position updated. Undo is always available.'); drag.current = null; setDragPreview(null);
  }
  function keyMove(event, id) {
    if (['Enter', ' '].includes(event.key)) { event.preventDefault(); setSelected(id); if (id === 'creature') setMode('creatures'); return; }
    if (mode !== 'build') return;
    const vectors = { ArrowLeft: [-12, 0], ArrowRight: [12, 0], ArrowUp: [0, -12], ArrowDown: [0, 12] };
    if (vectors[event.key]) {
      event.preventDefault(); event.stopPropagation(); setSelected(id);
      const item = id === 'creature' ? world.creature : world.objects.find(o => o.id === id), [dx, dy] = vectors[event.key];
      dispatch({ type: 'move', id, x: item.x + dx, y: item.y + dy });
    }
  }
  function selectMode(next) { setMode(next); if (next !== 'experiment') setRunning(false); setNotice(next === 'build' ? 'Pick an object below, then move it wherever you like.' : next === 'creatures' ? `Meet ${world.creature.name}. Make them your own.` : next === 'experiment' ? 'Make a prediction. Choose gravity, then run the experiment.' : 'Take a look around. Select a place or meet your creature.'); }
  function claim(reward) {
    dispatch({ type: 'reward', reward });
    if (reward === 'star-hat') dispatch({ type: 'creature', patch: { accessory: 'star-hat' } });
    else if (world.objects.length < MAX_OBJECTS) dispatch({ type: 'add', asset: reward, id: crypto.randomUUID() });
    setRewardOpen(false); setMode(reward === 'star-hat' ? 'creatures' : 'build'); setCategory('rewards');
    setNotice(`Sample ${reward === 'star-hat' ? 'star hat' : assetById(reward).name} unlocked. This demonstration uses no learning progress or XP.`);
  }

  const placed = [...world.objects.map(o => ({ ...o, isCreature: false })), { ...world.creature, id: 'creature', isCreature: true }].sort((a, b) => a.y - b.y);
  return <section className="up" data-calm={calm} aria-label="My Universe playable prototype">
    <div className="up-prototype-banner"><span><Sparkles size={14} /> PLAYABLE PROTOTYPE</span><p>Sample world · saves only in this browser · no real rewards or AI</p></div>
    <header className="up-heading"><div><span className="up-eyebrow">MY SPARK UNIVERSE</span><h2>A little world. Entirely yours.</h2><p>Build something unexpected. Meet someone strange. See what happens next.</p></div>{onClose && <button className="up-quiet" onClick={() => { if (save()) onClose(); }}><ArrowLeft size={15}/>Back to Universe</button>}</header>
    <div className="up-commandbar"><nav aria-label="Universe modes">{MODES.map(([id,label,Icon]) => <button type="button" key={id} aria-pressed={mode === id} onClick={() => selectMode(id)}><Icon size={17}/>{label}</button>)}</nav><div className="up-save-tools"><span className="up-save-state">{dirty ? 'Unsaved changes' : 'Saved locally'}</span><button type="button" className="up-save" onClick={save}><Save size={16}/><span>Save locally</span></button></div></div>
    {saveError && <p role="alert" className="up-error">{saveError}</p>}
    <div className="up-layout"><div className="up-world-column">
      <div className="up-canvas-frame" data-scene-theme={world.theme}><div className="up-scene-heading"><label className="up-world-name"><span className="up-eyebrow">WORLD 01</span><EditableName label="World name" value={world.name} maxLength={40} onCommit={name => dispatch({ type: 'name', name })}/></label><span className="up-scene-chip"><span/>{THEMES.find(t => t.id === world.theme).name}</span></div>
        <svg ref={stage} className="up-scene" data-mode={mode} viewBox="0 0 1000 600" role="group" aria-label="Interactive floating island. Select objects to inspect. In Build mode use arrow keys to move focused objects."
          onPointerMove={moveDrag} onPointerUp={finishDrag} onPointerCancel={() => { drag.current = null; setDragPreview(null); }}>
          <WorldBackdrop theme={world.theme} prefix={prefix}/>
          {placed.map(item => {
            const p = dragPreview?.id === item.id ? dragPreview : item;
            return <g key={item.id} data-world-object={item.id} transform={`translate(${p.x} ${p.y})`} tabIndex="0" role="button" aria-label={item.isCreature ? `Creature ${world.creature.name}` : `${assetById(item.asset).name}, placed object`} aria-pressed={selected === item.id}
              onPointerDown={e => startDrag(e, item.id)} onClick={() => setSelected(item.id)} onKeyDown={e => keyMove(e, item.id)}>
              <ellipse cy="2" rx={item.isCreature ? 37 : 43} ry="10" fill="#626882" opacity=".13"/>
              {selected === item.id && <ellipse cy="3" rx={item.isCreature ? 46 : 58} ry="17" fill="none" stroke="#8250a0" strokeWidth="2.5" strokeDasharray="5 4"/>}
              <g transform={`rotate(${item.rotation || 0}) scale(${item.scale || 1})`}>
                {item.isCreature ? <CreatureMotion creature={world.creature} gravity={gravity} running={running && active} calm={calm} resetTick={resetTick} stepTick={stepTick}/> : <AssetArt type={item.asset}/>}
              </g>
            </g>;
          })}
        </svg>
        <div className="up-scene-bottom"><span><span className="up-pulse"/> {running && !calm ? `${gravity === 'normal' ? 'Earth-like' : gravity === 'low' ? 'Low' : 'Zero'} gravity · experiment running` : mode === 'build' ? 'Your world is ready for a little rearranging.' : `${world.creature.name} is ${world.creature.trait}.`}</span><div><button type="button" aria-label="Undo last change" disabled={!state.past.length} onClick={() => dispatch({ type: 'undo' })}><Undo2 size={17}/></button><button type="button" aria-label="Redo last change" disabled={!state.future.length} onClick={() => dispatch({ type: 'redo' })}><Redo2 size={17}/></button></div></div>
      </div>

      {mode === 'build' && <section className="up-inventory" aria-label="Building inventory"><div className="up-section-heading"><div><h3>A few things to make it yours</h3><p>Pick to place. Drag to arrange. Arrow keys work too.</p></div><span>{world.objects.length} / {MAX_OBJECTS} objects</span></div><div className="up-inventory-tabs" aria-label="Item categories">{[['nature','Nature'],['build','Structures'],['details','Little details'],['rewards','Sample unlock']].map(([id,label]) => <button type="button" aria-pressed={category === id} key={id} onClick={() => setCategory(id)}>{id === 'rewards' && <Gift size={13}/>} {label}</button>)}</div>
        {category === 'rewards' && !world.sampleReward ? <div className="up-locked"><Gift size={23}/><div><strong>What might you unlock next?</strong><p>Try a sample reward choice. Real learning rewards are not connected.</p></div><button type="button" className="up-primary" onClick={() => setRewardOpen(true)}>Try a sample unlock<ArrowRight size={14}/></button></div> : <div className="up-assets">{visibleAssets.map(a => <button type="button" key={a.id} aria-label={`Place ${a.name}`} onClick={() => add(a.id)} disabled={world.objects.length >= MAX_OBJECTS}><svg viewBox="-75 -145 150 165" aria-hidden="true"><AssetArt type={a.id}/></svg><span>{a.name}</span><Plus size={13}/></button>)}{category === 'rewards' && world.sampleReward === 'star-hat' && <p className="up-caption">Your sample star hat is in Creatures → Accessories.</p>}</div>}
      </section>}
      {mode === 'explore' && <div className="up-explore-note"><Compass size={24}/><div><h3>There’s no right way to make a universe.</h3><p>Give yours a name, arrange a cozy corner, or see how {world.creature.name} handles a gravity surprise.</p></div><button type="button" className="up-primary" onClick={() => selectMode('experiment')}>Try an experiment<ArrowRight size={15}/></button></div>}
      {mode === 'creatures' && <div className="up-creature-quote"><span>“</span><div><strong>{world.creature.trait === 'sleepy' ? 'I support your ideas. Horizontally.' : world.creature.trait === 'energetic' ? 'What if we bounced? Just a little. Or a lot.' : 'Is that a moon fern? Can I keep it?'}</strong><p>{world.creature.name} · {world.creature.trait === 'energetic' ? 'an' : 'a'} {world.creature.trait} little {world.creature.body}</p></div><span className="up-caption">Scripted character · not AI</span></div>}
      {mode === 'experiment' && <div className="up-experiment-note"><FlaskConical size={24}/><div><h3>A tiny “what if?” lab</h3><p>This is a playful gravity sandbox, not a scientific physics model. Try the same creature at different settings. What changes?</p></div></div>}
      <p className="up-live-status" role="status" aria-live="polite">{notice}</p>
    </div>

    <aside className="up-inspector" aria-label="Universe controls">
      {mode === 'creatures' ? <><div className="up-panel-title"><Bot size={19}/><h3>Someone entirely new</h3></div><div className="up-creature-portrait"><svg viewBox="-80 -135 160 160" aria-hidden="true"><CreatureArt creature={world.creature}/></svg><span>YOUR CREATION</span></div>
        <label className="up-field">Their name<EditableName label="Creature name" maxLength={24} value={world.creature.name} onCommit={name => dispatch({ type: 'creature', patch: { name } })}/></label>
        <label className="up-field">Body<select value={world.creature.body} onChange={e => dispatch({ type: 'creature', patch: { body: e.target.value } })}>{BODY_TYPES.map(b => <option key={b}>{b}</option>)}</select></label>
        <fieldset className="up-palette"><legend>Color</legend>{PALETTES.map(p => <button key={p.id} type="button" aria-label={p.label} aria-pressed={world.creature.palette === p.id} onClick={() => dispatch({ type: 'creature', patch: { palette: p.id } })} style={{ background: p.color }}>{world.creature.palette === p.id && <Check size={17}/>}</button>)}</fieldset>
        <label className="up-field">Personality<select value={world.creature.trait} onChange={e => dispatch({ type: 'creature', patch: { trait: e.target.value } })}>{TRAITS.map(t => <option key={t}>{t}</option>)}</select></label>
        <label className="up-field">Accessory<select value={world.creature.accessory} onChange={e => dispatch({ type: 'creature', patch: { accessory: e.target.value } })}>{[...ACCESSORIES, ...(world.sampleReward === 'star-hat' ? ['star-hat'] : [])].map(a => <option key={a}>{a}</option>)}</select></label><p className="up-caption">Personality changes the pace of your creature’s movements in the experiment.</p>
      </> : mode === 'experiment' ? <><div className="up-panel-title"><FlaskConical size={19}/><h3>What if gravity changed?</h3></div><span className="up-sandbox-label">PLAY SANDBOX</span><p className="up-panel-copy">How high do you think {world.creature.name} will bounce? Pick a setting and find out.</p><fieldset className="up-gravity"><legend>Gravity</legend>{[['normal','Earth-like','A small bounce'],['low','Low gravity','A much bigger leap'],['zero','Float mode','Drift and tumble']].map(([id,label,desc]) => <label key={id}><input type="radio" name="universe-gravity" checked={gravity === id} onChange={() => setGravity(id)}/><span><strong>{label}</strong><small>{desc}</small></span><span className="up-radio-dot"/></label>)}</fieldset>
        <button type="button" className="up-primary up-full" disabled={calm} onClick={() => setRunning(!running)}>{running ? <Pause size={16}/> : <Play size={16}/>} {running ? 'Pause experiment' : 'Run experiment'}</button>
        <div className="up-experiment-actions"><button type="button" className="up-quiet" onClick={() => { setRunning(false); setResetTick(n => n + 1); setStepTick(0); }}> <RotateCcw size={14}/>Reset motion</button><button type="button" className="up-quiet" onClick={() => { setRunning(false); setStepTick(n => n + 1); }}>One step<ArrowRight size={14}/></button></div>
        <p className="up-caption">{calm ? 'Calm motion is on. Use One step to explore without continuous animation.' : 'The world stays yours. Reset motion never removes your creations.'}</p><div className="up-think"><Sparkles size={16}/><strong>Something to wonder</strong><p>Does a sleepy creature move differently from an energetic one?</p></div>
      </> : <><div className="up-panel-title"><Sparkles size={19}/><h3>{selectedName || 'Set the atmosphere'}</h3></div>
        {mode === 'build' && selectedObject && <div className="up-selected-controls"><span className="up-eyebrow">SELECTED OBJECT</span><p className="up-caption">Drag in the scene, use arrow keys, or adjust here.</p><label className="up-field">Horizontal position<input type="range" min="110" max="890" value={selectedObject.x} onChange={e => dispatch({ type: 'move', id: selected, x: Number(e.target.value), y: selectedObject.y })}/></label><label className="up-field">Depth<input type="range" min="210" max="475" value={selectedObject.y} onChange={e => dispatch({ type: 'move', id: selected, x: selectedObject.x, y: Number(e.target.value) })}/></label>
          {selected !== 'creature' ? <><label className="up-field">Size<input type="range" min=".6" max="1.5" step=".1" value={selectedObject.scale} onChange={e => dispatch({ type: 'object', id: selected, scale: Number(e.target.value) })}/></label><div className="up-object-actions"><button type="button" aria-label="Rotate selected object" onClick={() => dispatch({ type: 'object', id: selected, rotation: selectedObject.rotation >= 150 ? -180 : selectedObject.rotation + 30 })}><RotateCw size={17}/></button><button type="button" aria-label="Duplicate selected object" disabled={world.objects.length >= MAX_OBJECTS} onClick={() => add(selectedObject.asset)}><Copy size={17}/></button><button type="button" aria-label="Remove selected object" onClick={() => { dispatch({ type: 'remove', id: selected }); setSelected(null); setNotice('Object removed. Undo brings it back.'); }}><Trash2 size={17}/></button></div></> : <button type="button" className="up-quiet" onClick={() => selectMode('creatures')}>Customize {world.creature.name}<ArrowRight size={14}/></button>}
        </div>}
        <fieldset className="up-theme-picker"><legend>World theme</legend>{THEMES.map(t => <button type="button" data-scene-theme={t.id} key={t.id} aria-pressed={world.theme === t.id} onClick={() => dispatch({ type: 'theme', theme: t.id })}><span/><strong>{t.name}</strong>{world.theme === t.id && <Check size={14}/>}</button>)}</fieldset>
        <details className="up-object-list"><summary>Placed objects ({world.objects.length + 1})<ChevronDown size={14}/></summary><div>{[...world.objects.map(o => ({ id: o.id, name: assetById(o.asset).name })), { id: 'creature', name: world.creature.name }].map(o => <button type="button" aria-pressed={selected === o.id} key={o.id} onClick={() => { setSelected(o.id); setMode('build'); }}>{o.name}<Move size={12}/></button>)}</div></details>
      </>}
      <div className="up-panel-footer"><label className="up-calm"><input type="checkbox" checked={calm} onChange={e => { setCalm(e.target.checked); if (e.target.checked) setRunning(false); }}/><Leaf size={15}/>Calm motion</label><button type="button" className="up-reset" onClick={() => { dispatch({ type: 'reset' }); setSelected(null); setRunning(false); setResetTick(n => n + 1); setNotice('Starter world restored. Undo returns your previous world.'); }}>Restore starter world<RotateCcw size={13}/></button></div>
    </aside></div>
    <footer className="up-footer"><span><span className="up-spark">✦</span> Your imagination has room to grow.</span><button type="button" onClick={() => setRewardOpen(true)} disabled={!!world.sampleReward}><Gift size={14}/>{world.sampleReward ? 'Sample unlock claimed' : 'Preview a reward choice'}</button></footer>
    {rewardOpen && <SampleRewardDialog onClose={() => setRewardOpen(false)} onClaim={claim} claimed={world.sampleReward}/>}
  </section>;
}

function EditableName({ label, value, maxLength, onCommit }) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  return <input aria-label={label} maxLength={maxLength} value={draft} onChange={e => setDraft(e.target.value)} onBlur={() => { const next = draft.trim() || value; setDraft(next); if (next !== value) onCommit(next); }} onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }}/>;
}

function SampleRewardDialog({ onClose, onClaim, claimed }) {
  const dialog = useRef(null);
  useEffect(() => { const opener = document.activeElement; dialog.current.showModal(); return () => opener?.focus?.(); }, []);
  return <dialog className="up-reward-dialog" ref={dialog} aria-labelledby="up-reward-title" onCancel={e => { e.preventDefault(); onClose(); }}><button type="button" className="up-dialog-close" aria-label="Close sample rewards" onClick={onClose}><X size={20}/></button><span className="up-reward-icon"><Gift size={25}/></span><span className="up-eyebrow">A PREVIEW OF WHAT’S POSSIBLE</span><h2 id="up-reward-title">A little more universe.<br/>Your choice.</h2><p>This is a sample unlock. No learning progress was assessed and no XP was awarded.</p>{claimed ? <p>Your sample reward is already available in this prototype.</p> : <div className="up-reward-choices">{[['moon','Mini moon','A tiny orbit of your own.'],['waterfall','Waterfall kit','A quiet corner, with a little flow.'],['star-hat','Creature star hat','An excellent hat for big ideas.']].map(([id,label,text]) => <button type="button" key={id} aria-label={`Try ${label}`} onClick={() => onClaim(id)}><svg viewBox="-75 -145 150 165" aria-hidden="true">{id === 'star-hat' ? <CreatureArt creature={{ body: 'blob', palette: 'purple', trait: 'curious', accessory: 'star-hat' }}/> : <AssetArt type={id}/>}</svg><strong>{label}</strong><span>{text}</span><small>Choose sample<ArrowRight size={13}/></small></button>)}</div>}<small className="up-caption">Sample choice saves only with this browser prototype. Real rewards need the future verified-progress service.</small></dialog>;
}
