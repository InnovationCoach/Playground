import { useState } from 'react';
import { ArrowRight, ArrowUp, ArrowDown } from 'lucide-react';
import { TOOL_IDS, changePage, addPage, removePage } from './workspaceModel.js';
import { TOOL_SLIDES, SLIDES } from './slideModel.js';
import { WIDGETS } from './dashboardModel.js';
import './personalSpace.css';
const titles = Object.fromEntries(WIDGETS.map((widget) => [widget.id, widget.title]));

/** Render a tool in exactly one slide. Keep it mounted even when temporarily hidden. */
export function WorkspaceTools({ prefs, slide, renderWidget }) {
  const page = prefs.pages[prefs.activePage];
  const tools = page.order.filter((id) => TOOL_SLIDES[id] === slide);
  const visible = tools.filter((id) => !page.hidden.includes(id));
  return <div className={`sd-workspace-tools ${page.layout === 'slider' ? 'sd-tools-stack' : ''}`}>
    {tools.map((id) => <article key={id} hidden={page.hidden.includes(id)} className={`sd-tool ps-tool ps-${page.sizes[id]}`} data-tool={id}>
      <h3>{titles[id]}</h3><div className="lh-tool-body">{renderWidget(id)}</div>
    </article>)}
    {!visible.length && <p className="sd-caption">No optional tools shown in this slide for “{page.name}”. Restore them in Creative Space.</p>}
  </div>;
}

/** One arrangement editor for all optional tools; saved legacy pages remain intact. */
export function PersonalSpace({ prefs, update, renderWidget }) {
  const [arranging, setArranging] = useState(false);
  const page = prefs.pages[prefs.activePage];
  const change = (fn) => update((state) => changePage(state, fn));
  const move = (id, direction) => change((current) => {
    const order = [...current.order], index = order.indexOf(id), target = index + direction;
    if (target < 0 || target >= order.length) return current;
    [order[index], order[target]] = [order[target], order[index]];
    return { ...current, order };
  });
  return <div className="ps-space">
    <div className="sd-section-line"><p className="sd-intro">{prefs.tagline || 'Collect an idea. Find your focus. Give your thinking a little room.'}</p><button className="sd-text-button" aria-expanded={arranging} onClick={() => setArranging(!arranging)}>Arrange creative space</button></div>
    <div className="sd-workspace-tabs" role="group" aria-label="Saved personal spaces">{prefs.pages.map((saved, index) => <button type="button" className="sd-button" key={saved.id} aria-pressed={prefs.activePage === index} onClick={() => update((state) => ({ ...state, activePage: index }))}>{saved.name}</button>)}</div>
    {arranging && <section className="sd-arrangement" aria-label="Arrange optional tools">
      <p className="sd-caption">Your saved space controls the optional tools in Creative Space and My Progress. All five pages always stay available.</p>
      <div className="ps-controls"><label>Space name<input maxLength={32} value={page.name} onChange={(event) => change((current) => ({ ...current, name: event.target.value }))} /></label><label>Tool layout<select value={page.layout} onChange={(event) => change((current) => ({ ...current, layout: event.target.value }))}><option value="grid">Grid</option><option value="slider">Single column</option></select></label><button type="button" className="sd-button" disabled={prefs.pages.length >= 5} onClick={() => update(addPage)}>Add space</button><button type="button" className="sd-button" disabled={prefs.pages.length === 1} onClick={() => update((state) => ({ ...state, ...removePage(state) }))}>Remove this space</button></div>
      <ul className="sd-tool-arrangement">{page.order.map((id, index) => <li key={id}>
        <label><input type="checkbox" checked={!page.hidden.includes(id)} onChange={() => change((current) => ({ ...current, hidden: current.hidden.includes(id) ? current.hidden.filter((item) => item !== id) : [...current.hidden, id] }))} /><span>{titles[id]}<small>{SLIDES.find((s) => s.id === TOOL_SLIDES[id]).short}</small></span></label>
        <div><button type="button" className="sd-button" disabled={index === 0} aria-label={`Move ${titles[id]} earlier`} onClick={() => move(id, -1)}><ArrowUp size={15} /></button><button type="button" className="sd-button" disabled={index === TOOL_IDS.length - 1} aria-label={`Move ${titles[id]} later`} onClick={() => move(id, 1)}><ArrowDown size={15} /></button><button type="button" className="sd-button" aria-label={`Resize ${titles[id]}`} onClick={() => change((current) => ({ ...current, sizes: { ...current.sizes, [id]: current.sizes[id] === 'wide' ? 'compact' : 'wide' } }))}>{page.sizes[id] === 'wide' ? 'Compact' : 'Wide'}</button></div>
      </li>)}</ul>
    </section>}
    <div className="sd-creative-links"><a href="#/pbl/portfolio"><strong>My portfolio & reflections</strong><span>Evidence, discoveries and work to be proud of</span><ArrowRight size={20} /></a><a href="#/canva"><strong>Canva Studio</strong><span>Open the existing creative tools and connection status</span><ArrowRight size={20} /></a></div>
    <WorkspaceTools prefs={prefs} slide="creative" renderWidget={renderWidget} />
  </div>;
}
