import { useState, useMemo } from 'react';
import {
  COMPETENCIES,
  COMPETENCY_DOMAINS
} from '../../pbl/content/competencies.js';
import { APPROVED_NGS_CATALOG } from '../../../../shared/pblUnitSchema.js';
import { Search, ChevronDown, ChevronRight, Sparkles, Check, X } from 'lucide-react';

export function GroupedCompetencyPicker({
  selectedWeLearnIds = [],
  selectedNgsIds = [],
  onChangeWeLearn,
  onChangeNgs,
  onAiSuggest,
  maxTotal = 20
}) {
  const [search, setSearch] = useState('');
  // Expanded domain groups by default
  const [openDomains, setOpenDomains] = useState({
    ctps: true,
    ct: true,
    sdl: false,
    lc: false,
    ec: false,
    sea: false,
    ent: false,
    ngss: false
  });

  const totalSelected = selectedWeLearnIds.length + selectedNgsIds.length;
  const isMaxReached = totalSelected >= maxTotal;

  const toggleDomain = (domainId) => {
    setOpenDomains((prev) => ({ ...prev, [domainId]: !prev[domainId] }));
  };

  const query = search.trim().toLowerCase();

  // Group WeLearn competencies by domain
  const weLearnByDomain = useMemo(() => {
    const map = {};
    for (const d of COMPETENCY_DOMAINS) {
      map[d.id] = [];
    }
    for (const c of COMPETENCIES) {
      if (
        !query ||
        `${c.code} ${c.title} ${c.statement} ${c.id}`.toLowerCase().includes(query)
      ) {
        if (!map[c.domain]) map[c.domain] = [];
        map[c.domain].push(c);
      }
    }
    return map;
  }, [query]);

  // Filtered NGS standards
  const filteredNgs = useMemo(() => {
    if (!query) return APPROVED_NGS_CATALOG;
    return APPROVED_NGS_CATALOG.filter(
      (item) =>
        `${item.id} ${item.code} ${item.title} ${item.statement}`
          .toLowerCase()
          .includes(query)
    );
  }, [query]);

  const toggleWeLearn = (id) => {
    if (selectedWeLearnIds.includes(id)) {
      onChangeWeLearn(selectedWeLearnIds.filter((item) => item !== id));
    } else {
      if (isMaxReached) return;
      onChangeWeLearn([...selectedWeLearnIds, id]);
    }
  };

  const toggleNgs = (id) => {
    if (selectedNgsIds.includes(id)) {
      onChangeNgs(selectedNgsIds.filter((item) => item !== id));
    } else {
      if (isMaxReached) return;
      onChangeNgs([...selectedNgsIds, id]);
    }
  };

  const handleClearAll = () => {
    onChangeWeLearn([]);
    onChangeNgs([]);
  };

  return (
    <div className="cp-comp-picker-root">
      {/* Sticky Header with Counter, AI Suggest and Search */}
      <div className="cp-comp-header-bar">
        <div className="cp-comp-header-top">
          <div className="cp-comp-counter-wrap">
            <span className="cp-comp-counter-badge" data-full={isMaxReached}>
              Selected: <strong>{totalSelected}</strong>/{maxTotal}
            </span>
            {totalSelected > 0 && (
              <button
                type="button"
                className="cp-btn-ghost-sm"
                onClick={handleClearAll}
                title="Clear selected competencies"
              >
                <X size={12} /> Clear
              </button>
            )}
          </div>

          {onAiSuggest && (
            <button
              type="button"
              className="cp-btn-ai-suggest"
              onClick={onAiSuggest}
              title="Auto-select 5–8 competencies aligned to the current brief"
            >
              <Sparkles size={13} /> AI Suggest 5–8 Competencies
            </button>
          )}
        </div>

        {/* Live Search Box */}
        <div className="cp-comp-search-box">
          <Search size={14} className="cp-search-icon" />
          <input
            type="search"
            className="cp-comp-search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search competencies by code, keyword, or statement..."
            aria-label="Search competencies"
          />
        </div>
      </div>

      {/* Accordion Categories */}
      <div className="cp-comp-categories">
        {COMPETENCY_DOMAINS.map((domain) => {
          const list = weLearnByDomain[domain.id] || [];
          const selectedInGroup = list.filter((c) =>
            selectedWeLearnIds.includes(c.id)
          ).length;
          const isOpen = Boolean(openDomains[domain.id] || query);

          if (query && list.length === 0) return null;

          return (
            <div key={domain.id} className="cp-comp-domain-card">
              <button
                type="button"
                className="cp-comp-domain-toggle"
                onClick={() => toggleDomain(domain.id)}
                aria-expanded={isOpen}
              >
                <div className="cp-comp-domain-title-wrap">
                  {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  <span className="cp-comp-domain-title">{domain.title}</span>
                  <span className="cp-comp-domain-count">
                    ({list.length} available)
                  </span>
                </div>
                {selectedInGroup > 0 && (
                  <span className="cp-comp-group-pill">
                    {selectedInGroup} active
                  </span>
                )}
              </button>

              {isOpen && (
                <div className="cp-comp-card-grid">
                  {list.map((c) => {
                    const isChecked = selectedWeLearnIds.includes(c.id);
                    const disabled = !isChecked && isMaxReached;
                    return (
                      <div
                        key={c.id}
                        className={`cp-comp-card ${isChecked ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
                        onClick={() => !disabled && toggleWeLearn(c.id)}
                        role="checkbox"
                        aria-checked={isChecked}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === ' ' || e.key === 'Enter') {
                            e.preventDefault();
                            if (!disabled) toggleWeLearn(c.id);
                          }
                        }}
                      >
                        <div className="cp-comp-card-check">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={disabled}
                            onChange={() => {}} // Controlled by card click
                            tabIndex={-1}
                          />
                        </div>
                        <div className="cp-comp-card-body">
                          <div className="cp-comp-card-head">
                            <span className="cp-comp-code">{c.code}</span>
                            <strong className="cp-comp-title">{c.title}</strong>
                          </div>
                          <p className="cp-comp-statement">{c.statement}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* NGSS Standards Category */}
        {(!query || filteredNgs.length > 0) && (
          <div className="cp-comp-domain-card">
            <button
              type="button"
              className="cp-comp-domain-toggle"
              onClick={() => toggleDomain('ngss')}
              aria-expanded={Boolean(openDomains.ngss || query)}
            >
              <div className="cp-comp-domain-title-wrap">
                {openDomains.ngss || query ? (
                  <ChevronDown size={16} />
                ) : (
                  <ChevronRight size={16} />
                )}
                <span className="cp-comp-domain-title">
                  Next Generation Science Standards (NGSS)
                </span>
                <span className="cp-comp-domain-count">
                  ({filteredNgs.length} available)
                </span>
              </div>
              {selectedNgsIds.length > 0 && (
                <span className="cp-comp-group-pill">
                  {selectedNgsIds.length} active
                </span>
              )}
            </button>

            {(openDomains.ngss || query) && (
              <div className="cp-comp-card-grid">
                {filteredNgs.map((ngs) => {
                  const isChecked = selectedNgsIds.includes(ngs.id);
                  const disabled = !isChecked && isMaxReached;
                  return (
                    <div
                      key={ngs.id}
                      className={`cp-comp-card ${isChecked ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
                      onClick={() => !disabled && toggleNgs(ngs.id)}
                      role="checkbox"
                      aria-checked={isChecked}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === ' ' || e.key === 'Enter') {
                          e.preventDefault();
                          if (!disabled) toggleNgs(ngs.id);
                        }
                      }}
                    >
                      <div className="cp-comp-card-check">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={disabled}
                          onChange={() => {}}
                          tabIndex={-1}
                        />
                      </div>
                      <div className="cp-comp-card-body">
                        <div className="cp-comp-card-head">
                          <span className="cp-comp-code">{ngs.id}</span>
                          <strong className="cp-comp-title">{ngs.title}</strong>
                        </div>
                        <p className="cp-comp-statement">
                          {ngs.statement || ngs.title}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
