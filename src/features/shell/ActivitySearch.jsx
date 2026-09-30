/**
 * The activity search box that replaced the row of activity buttons.
 *
 * Twelve buttons over two rows had stopped being navigation - learners scanned
 * the whole bar to find one activity. Now: type a word or a number, or open the
 * box to see the full list. Follows the ARIA combobox pattern: arrow keys move,
 * Enter opens, Escape closes; "/" or Cmd/Ctrl+K focuses it from anywhere.
 */
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { searchActivities } from './activitySearch.js';
import { Search } from 'lucide-react';
import { ActivityIcon } from './activityIcons.jsx';
import './activitySearch.css';

const splitLabel = (label) => {
  const [icon, ...rest] = label.split(' ');
  const text = rest.join(' ');
  // Split at the FIRST colon only: "Activity 3: Micro:bit Coding" keeps "Micro:bit".
  const at = text.indexOf(':');
  return at === -1
    ? { icon, title: null, name: text }
    : { icon, title: text.slice(0, at), name: text.slice(at + 1).trim() };
};

export function ActivitySearch({ items, current, onNavigate }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);
  const boxRef = useRef(null);
  const listId = useId();

  const results = useMemo(() => searchActivities(items, query), [items, query]);

  useEffect(() => { setActive(0); }, [query]);

  // "/" or Cmd/Ctrl+K from anywhere, unless the learner is typing in a field.
  useEffect(() => {
    const onKey = (e) => {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName) || document.activeElement?.isContentEditable;
      if ((e.key === '/' && !typing) || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (!boxRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open]);

  const choose = (item) => {
    onNavigate(item.id);
    setQuery('');
    setOpen(false);
    inputRef.current?.blur();
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive((a) => Math.min(results.length - 1, a + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
    else if (e.key === 'Enter' && open && results[active]) { e.preventDefault(); choose(results[active]); }
    else if (e.key === 'Escape') { setOpen(false); inputRef.current?.blur(); }
  };

  const currentItem = items.find((i) => i.id === current);

  return (
    <div className="as" ref={boxRef}>
      <div className={`as-field${open ? ' is-open' : ''}`}>
        <Search className="as-icon" size={17} aria-hidden="true" />
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && results[active] ? `${listId}-${results[active].id}` : undefined}
          aria-label="Search activities"
          placeholder={currentItem ? `Now: ${currentItem.label.replace(/^\S+\s/, '')} - search activities…` : 'Search activities…'}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
        />
        <kbd className="as-kbd" aria-hidden="true">/</kbd>
      </div>

      {open ? (
        <ul className="as-list" id={listId} role="listbox" aria-label="Activities">
          {results.length ? results.map((item, i) => {
            const { title, name } = splitLabel(item.label);
            return (
              <li
                key={item.id}
                id={`${listId}-${item.id}`}
                role="option"
                aria-selected={i === active}
                className={`as-item${i === active ? ' is-active' : ''}${item.id === current ? ' is-current' : ''}`}
                onPointerEnter={() => setActive(i)}
                // Select on click, not pointerdown: on an iPad a finger that starts
                // a scroll on the list must not open an activity.
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(item)}
              >
                <ActivityIcon id={item.id} size={36} iconSize={18} radius={9} />
                <span className="as-item-text">
                  <span className="as-item-name">
                    {title ? <span className="as-item-num">{title}</span> : null}{name}
                    {item.id === current ? <span className="as-here">You are here</span> : null}
                  </span>
                  {item.description ? <span className="as-item-desc">{item.description}</span> : null}
                </span>
              </li>
            );
          }) : (
            <li className="as-empty" role="option" aria-selected="false" aria-disabled="true">
              No activity matches "{query}". Try a word like <i>solar</i>, <i>plants</i> or a number.
            </li>
          )}
        </ul>
      ) : null}
    </div>
  );
}
