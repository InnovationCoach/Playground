import { useState } from 'react';
import { COMPETENCIES, COMPETENCY_DOMAINS } from '../../pbl/content/competencies.js';

export function ProgramCompetencyPicker({ value = [], onChange }) {
  const [search, setSearch] = useState('');
  const [domain, setDomain] = useState('');
  const query = search.trim().toLowerCase();
  const visible = COMPETENCIES.filter(c => (!domain || c.domain === domain) &&
    (!query || `${c.title} ${c.statement} ${c.code} ${c.id}`.toLowerCase().includes(query)));
  const selected = COMPETENCIES.filter(c => value.includes(c.id));
  return <fieldset className="sw-field"><legend>PBL competencies for this activity</legend>
    <p>Use the existing WeLearn framework. Choose up to 20 competencies that this activity develops.</p>
    <label className="sw-field"><span>Search competencies</span><input type="search" value={search} onChange={e => setSearch(e.target.value)} /></label>
    <label className="sw-field"><span>Competency domain</span><select value={domain} onChange={e => setDomain(e.target.value)}><option value="">All domains</option>{COMPETENCY_DOMAINS.map(d => <option key={d.id} value={d.id}>{d.title}</option>)}</select></label>
    <p aria-live="polite">{value.length} selected{selected.length ? `: ${selected.map(c => c.title).join(', ')}` : ''}</p>
    <details><summary>Choose competencies ({visible.length} matches)</summary>
      {!visible.length && <p>No matching competencies. Try another search.</p>}
      {visible.map(c => <label key={c.id} className="sw-field"><span>
        <input type="checkbox" checked={value.includes(c.id)} disabled={!value.includes(c.id) && value.length >= 20}
          onChange={e => onChange(e.target.checked ? [...value, c.id] : value.filter(id => id !== c.id))} />
        {' '}{c.code} · {c.title} ({c.id})
      </span><small>{c.statement}</small></label>)}
    </details>
  </fieldset>;
}
