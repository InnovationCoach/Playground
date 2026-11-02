import { useId } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Check, CircleDashed, PenLine } from 'lucide-react';
import { codePoints, edgeKey, partStatus, tableTemplate, withCell, withPart } from './missionSession.js';
import { workRows } from './focusFlow.js';

const KIND_LABEL = { text: 'Written explanation', table: 'Table', choice: 'Choice and reason', diagram: 'Route diagram' };
export const partTitle = (partId) => partId.split('-').map((w, i) => (i ? w : w[0].toUpperCase() + w.slice(1))).join(' ');

export function Counter({ value, max = 2000, min = 0 }) {
  const n = codePoints(value);
  const short = min > 0 && codePoints(value.trim()) < min;
  return <small className={`px-count${n > max || short ? ' is-over' : ''}`}>{n.toLocaleString('en-US')} / {max.toLocaleString('en-US')} characters{min ? ` (at least ${min})` : ''}</small>;
}

function StarterButton({ starter, value, onInsert }) {
  if (!starter) return null;
  const used = value.includes(starter);
  return <button type="button" className="px-ghost" disabled={used} onClick={() => onInsert(value.trim() ? `${value.trimEnd()}\n${starter}` : starter)}>
    <PenLine size={14} aria-hidden="true" />{used ? 'Starter added' : 'Add sentence starter'}</button>;
}

/**
 * One notebook part, editable. Every alternative the task accepts stays available and keeps its own content.
 * In `focus` mode a table shows one row at a time (full table on request) and a diagram one stage at a time;
 * `view` / `onView` hold that UI-only position so it is shared wherever the part appears.
 */
export function NotebookPart({ route, partId, work, setWork, disabled, guided, focus = false, view = {}, onView = () => {}, headingId }) {
  const uid = useId();
  const rule = route.requiredParts.find((r) => r.partId === partId);
  const p = work.parts[partId];
  const status = partStatus(route, partId, p);
  const table = tableTemplate(route, partId);
  const diagram = route.diagramTemplates?.[partId];
  const starter = route.sentenceStarters?.[partId] || table?.textStarter || diagram?.textStarter || null;
  const update = (patch) => setWork((w) => withPart(w, partId, patch));
  const hId = headingId || `${uid}-h`;
  return <section className={`px-part${focus ? ' is-focus' : ''}`} aria-labelledby={hId}>
    <header className="px-part-head">
      {focus ? <span className="px-part-name" id={hId}>Notebook · {partTitle(partId)}</span> : <h4 id={hId}>{partTitle(partId)}</h4>}
      <span className={`px-pill ${status.complete ? 'is-done' : 'is-todo'}`}>{status.complete ? <><Check size={13} aria-hidden="true" />Ready to send</> : <><CircleDashed size={13} aria-hidden="true" />In progress</>}</span>
    </header>
    {!focus && <p className="px-criterion"><strong>What your coach looks for:</strong> {rule.evidenceCriterion}</p>}
    <fieldset disabled={disabled} className="px-fieldset">
      <legend className="mx-sr">{partTitle(partId)}</legend>
      {rule.anyOfKinds.length > 1 && <div className="px-format" role="radiogroup" aria-label={`Format for ${partTitle(partId)}`}>
        {rule.anyOfKinds.map((k) => <label key={k}><input type="radio" name={`${uid}-kind`} checked={p.kind === k} onChange={() => update({ kind: k })} />{KIND_LABEL[k]}</label>)}
        <small className="mx-muted">{focus ? 'Both formats count equally. Switching keeps both.' : 'Each format is judged on the same reasoning. Switching keeps what you wrote in both.'}</small>
      </div>}
      {p.kind === 'text' && <TextField id={`${uid}-text`} label={rule.anyOfKinds.length > 1 ? `Your ${partTitle(partId).toLowerCase()} in words` : 'Your answer'}
        value={p.text} onChange={(text) => update({ text })} starter={starter} guided={guided} />}
      {p.kind === 'table' && (p.savedTable ? <SavedTable t={p.savedTable} onReplace={() => update({ savedTable: null })} />
        : focus && !view.fullTable ? <TableRowEditor t={table} cells={p.cells} row={view.row ?? 0} onRow={(row) => onView({ row })} onFull={() => onView({ fullTable: true })}
          onCell={(r, c, v) => setWork((w) => withCell(w, partId, r, c, v))} />
          : <>{focus && <button type="button" className="px-ghost" aria-pressed="true" onClick={() => onView({ fullTable: false })}>Show one row at a time</button>}
            <TableEditor t={table} cells={p.cells} onCell={(r, c, v) => setWork((w) => withCell(w, partId, r, c, v))} /></>)}
      {p.kind === 'choice' && <ChoiceEditor uid={uid} route={route} partId={partId} p={p} update={update} starter={starter} guided={guided} />}
      {p.kind === 'diagram' && <DiagramEditor uid={uid} t={diagram} p={p} update={update} starter={starter} guided={guided} stage={focus ? view.stage ?? 0 : null} onStage={(stage) => onView({ stage })} />}
    </fieldset>
    {/* Focus mode never nags mid-step; the review checklist names what is missing. */}
    {!focus && !status.complete && status.reason && <p className="px-why">{status.reason}</p>}
  </section>;
}

function TextField({ id, label, value, onChange, starter, guided, rows = 5 }) {
  return <div className="px-field">
    <label htmlFor={id}>{label}</label>
    <textarea id={id} rows={rows} value={value} onChange={(e) => onChange(e.target.value)} aria-describedby={`${id}-c`} />
    <div className="px-field-foot"><span id={`${id}-c`}><Counter value={value} /></span>
      <StarterButton starter={starter} value={value} onInsert={onChange} />
    </div>
    {guided && starter && !value && <p className="px-starter-hint">Starter: “{starter}”</p>}
  </div>;
}

function TableEditor({ t, cells, onCell }) {
  return <div className="px-table-wrap">
    <table className="px-table">
      <caption>{t.caption}</caption>
      <thead><tr>{t.columns.map((c) => <th key={c} scope="col">{c}</th>)}</tr></thead>
      <tbody>{t.rows.map((row, r) => <tr key={row.id}>
        {row.cells.map((cell, c) => {
          const rowName = row.cells[0].value || row.id;
          if (!cell.editable) return c === 0 ? <th key={c} scope="row">{cell.value}</th> : <td key={c} className="is-given">{cell.value}</td>;
          return <td key={c}><input value={cells[r][c]} maxLength={200} aria-label={`${rowName}, ${t.columns[c]}`} onChange={(e) => onCell(r, c, e.target.value)} /></td>;
        })}
      </tr>)}</tbody>
    </table>
    <p className="mx-muted">Grey cells are given facts. Fill every blank cell; label any rounding you use.</p>
  </div>;
}

/** Focus mode: one row of the table, with the given facts beside the cells to fill. The full table is one click away. */
function TableRowEditor({ t, cells, row, onRow, onFull, onCell }) {
  const rows = workRows(t);
  const pos = Math.min(Math.max(0, rows.indexOf(rows.includes(row) ? row : rows[0])), rows.length - 1);
  const r = rows[pos];
  const tr = t.rows[r];
  const rowName = tr.cells[0].value || tr.id;
  return <div className="px-rowfocus">
    <p className="px-rowpos"><strong>{t.caption}</strong> · row {pos + 1} of {rows.length}: {rowName}</p>
    {/* R5: a short polite announcement of the newly shown row, never the whole table. */}
    <p className="mx-sr" role="status" aria-live="polite">Row {pos + 1} of {rows.length}: {rowName}</p>
    <div className="px-rowcells">{tr.cells.map((cell, c) => {
      if (c === 0) return null;
      if (!cell.editable) return <p key={c} className="px-given"><span>{t.columns[c]}</span><b>{cell.value}</b></p>;
      return <label key={c} className="px-cell"><span>{t.columns[c]}</span>
        <input value={cells[r][c]} maxLength={200} aria-label={`${rowName}, ${t.columns[c]}`} onChange={(e) => onCell(r, c, e.target.value)} /></label>;
    })}</div>
    <div className="px-row">
      <button type="button" className="px-ghost" disabled={pos === 0} onClick={() => onRow(rows[pos - 1])}><ChevronLeft size={14} aria-hidden="true" />Previous row</button>
      <button type="button" className="px-ghost" disabled={pos === rows.length - 1} onClick={() => onRow(rows[pos + 1])}>Next row<ChevronRight size={14} aria-hidden="true" /></button>
      <button type="button" className="px-ghost" aria-pressed="false" onClick={onFull}>Show full table</button>
    </div>
  </div>;
}

function SavedTable({ t, onReplace }) {
  return <div className="px-table-wrap">
    <p className="px-note">This table was saved in a different layout. It is kept exactly as it was sent.</p>
    <ReadTable caption={t.caption} columns={t.columns} rows={t.rows} />
    <button type="button" className="px-ghost" onClick={onReplace}>Use the current table layout instead</button>
  </div>;
}

export function choiceLabel(route, partId, id) {
  return route?.choiceLabels?.[partId]?.find((c) => c.id === id)?.label || id;
}

function ChoiceEditor({ uid, route, partId, p, update, starter, guided }) {
  const options = route.choiceOptions?.[partId] || [];
  return <div className="px-field">
    <fieldset className="mx-choices"><legend>Your recommendation</legend>
      {options.map((id) => <label key={id}><input type="radio" name={`${uid}-choice`} value={id} checked={p.selectedId === id} onChange={() => update({ selectedId: id })} />{choiceLabel(route, partId, id)}</label>)}
    </fieldset>
    <TextField id={`${uid}-reason`} label="Your reason" value={p.reason} onChange={(reason) => update({ reason })} starter={starter} guided={guided} rows={4} />
  </div>;
}

const STAGES = ['Places', 'Links', 'In words'];

function DiagramEditor({ uid, t, p, update, starter, guided, stage = null, onStage }) {
  const has = (id) => p.nodeIds.includes(id);
  const toggleNode = (id) => update({ nodeIds: has(id) ? p.nodeIds.filter((n) => n !== id) : [...p.nodeIds, id] });
  const toggleEdge = (k) => update({ edgeKeys: p.edgeKeys.includes(k) ? p.edgeKeys.filter((e) => e !== k) : [...p.edgeKeys, k] });
  const nodes = t.nodeVocabulary.filter((n) => has(n.id));
  const edges = t.edgeVocabulary.filter((e) => p.edgeKeys.includes(edgeKey(e)) && has(e.fromId) && has(e.toId));
  // Focus mode shows one stage at a time (places, links, description); every stage stays one click away.
  const show = (i) => stage === null || stage === i;
  return <div className="px-diagram">
    {stage === null ? <p className="mx-muted">{t.learnerAction}</p>
      : <div className="px-stages" role="group" aria-label="Diagram stage">{STAGES.map((name, i) => <button key={name} type="button" aria-pressed={stage === i} onClick={() => onStage(i)}>{i + 1}. {name}</button>)}</div>}
    {show(0) && <fieldset className="px-checks"><legend>Places in the route</legend>
      {t.nodeVocabulary.map((n) => <label key={n.id}><input type="checkbox" checked={has(n.id)} onChange={() => toggleNode(n.id)} />{n.label}</label>)}
    </fieldset>}
    {show(1) && <fieldset className="px-checks"><legend>Relationships</legend>
      {t.edgeVocabulary.map((e) => {
        const k = edgeKey(e), from = t.nodeVocabulary.find((n) => n.id === e.fromId), to = t.nodeVocabulary.find((n) => n.id === e.toId);
        const ready = has(e.fromId) && has(e.toId);
        return <label key={k} className={ready ? '' : 'is-off'}><input type="checkbox" disabled={!ready} checked={p.edgeKeys.includes(k) && ready} onChange={() => toggleEdge(k)} />
          {from.label} → {to.label} <em>({e.label})</em>{!ready && <span className="mx-sr"> (add both places first)</span>}</label>;
      })}
    </fieldset>}
    {stage === null ? <DiagramPicture caption={t.caption} nodes={nodes} edges={edges} />
      : <details className="px-optional"><summary>See the diagram so far</summary><DiagramPicture caption={t.caption} nodes={nodes} edges={edges} /></details>}
    {show(2) && <TextField id={`${uid}-desc`} label="Describe the route in words (required)" value={p.description} onChange={(description) => update({ description })} starter={starter} guided={guided} rows={4} />}
    {stage !== null && stage < 2 && <button type="button" className="px-ghost" onClick={() => onStage(stage + 1)}>Next stage: {STAGES[stage + 1]}<ChevronRight size={14} aria-hidden="true" /></button>}
  </div>;
}

/** The route drawn from selections (code-owned layout), always with its text equivalent beside it. */
export function DiagramPicture({ caption, nodes, edges }) {
  const w = 160, gap = 40, h = 54;
  const width = Math.max(1, nodes.length) * (w + gap) - gap + 16;
  const x = (i) => 8 + i * (w + gap);
  const idx = new Map(nodes.map((n, i) => [n.id, i]));
  return <figure className="px-figure">
    <svg viewBox={`0 0 ${width} ${h + 40}`} role="img" aria-label={`${caption}. ${nodes.length} places, ${edges.length} relationships; listed below.`}>
      <defs><marker id="px-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#9bd2ff" /></marker></defs>
      {edges.map((e) => {
        const a = idx.get(e.fromId), b = idx.get(e.toId);
        const y = 8 + h / 2, x1 = a < b ? x(a) + w : x(a), x2 = a < b ? x(b) : x(b) + w;
        const bend = Math.abs(a - b) > 1 ? `M${x(a) + w / 2} ${8 + h} V${h + 30} H${x(b) + w / 2} V${8 + h + 2}` : `M${x1} ${y} H${x2}`;
        return <path key={edgeKey(e)} d={bend} fill="none" stroke="#9bd2ff" strokeWidth="1.5" markerEnd="url(#px-arrow)" />;
      })}
      {nodes.map((n, i) => <g key={n.id}><rect x={x(i)} y="8" width={w} height={h} rx="10" fill="#12294a" stroke="#96d700" />
        <text x={x(i) + w / 2} y={8 + h / 2 + 4} textAnchor="middle" fontSize="11.5" fill="#eaf2ff">{n.label.length > 26 ? `${n.label.slice(0, 25)}…` : n.label}</text></g>)}
    </svg>
    <figcaption>{caption}</figcaption>
    <DiagramList nodes={nodes} edges={edges} />
  </figure>;
}

function DiagramList({ nodes, edges }) {
  const label = (id) => nodes.find((n) => n.id === id)?.label || id;
  return <div className="px-diagram-list">
    <p><strong>Places:</strong> {nodes.length ? nodes.map((n) => n.label).join(', ') : 'none chosen yet'}</p>
    {edges.length > 0 ? <ol>{edges.map((e) => <li key={edgeKey(e)}>{label(e.fromId)} → {label(e.toId)} ({e.label})</li>)}</ol> : <p className="mx-muted">No relationships chosen yet.</p>}
  </div>;
}

export function ReadTable({ caption, columns, rows }) {
  return <div className="px-table-wrap"><table className="px-table is-read">
    {caption && <caption>{caption}</caption>}
    <thead><tr>{columns.map((c, i) => <th key={i} scope="col">{c}</th>)}</tr></thead>
    <tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => (j === 0 ? <th key={j} scope="row">{c}</th> : <td key={j}>{c}</td>))}</tr>)}</tbody>
  </table></div>;
}

/** Sent evidence, read-only (learner history and coach review). `route` may be null for an unknown version. */
export function EvidenceView({ evidence, route }) {
  if (!Array.isArray(evidence) || !evidence.length) return <p className="mx-muted">No notebook parts were sent with this attempt.</p>;
  return <div className="px-evidence">{evidence.map((e) => <section key={e.partId} className="px-evidence-part">
    <h5>{partTitle(e.partId)} <small>· {KIND_LABEL[e.kind] || e.kind}</small></h5>
    {e.kind === 'text' && <p className="px-pre">{e.text}</p>}
    {e.kind === 'table' && <ReadTable caption={e.caption} columns={e.columns} rows={e.rows} />}
    {e.kind === 'choice' && <><p><strong>{choiceLabel(route, e.partId, e.selectedId)}</strong></p><p className="px-pre">{e.reason}</p></>}
    {e.kind === 'diagram' && <><DiagramList nodes={e.nodes || []} edges={e.edges || []} /><p className="px-pre">{e.description}</p></>}
  </section>)}</div>;
}
