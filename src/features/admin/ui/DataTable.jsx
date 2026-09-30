import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Inbox, CircleAlert } from 'lucide-react';
import { useLocale } from '../../../app/i18n/LocaleProvider.jsx';
import { describeApiError } from '../../../services/api/apiClient.js';
import { pageRange } from './pagination.js';

const PAGE_SIZES = [10, 30, 50, 100];

/**
 * Reusable server-driven table in a card: optional toolbar (search, filters),
 * sortable headers, loading / empty / error states, keyboard-openable rows and
 * "Displaying 1–30 of 129" pagination.
 *
 * It renders; it does not fetch. Pair it with usePagedList, and pass that
 * hook's return value as `list`.
 *
 * columns: [{ key, label, sortKey?, render?(row), mono?, nowrap?, width? }]
 */
export function DataTable({ columns, list, sort, onSortChange, onRowClick, rowKey = (r) => r.uid, caption, emptyText, toolbar }) {
  const { t } = useLocale();
  const { items, loading, error, total, pageIndex, pageSize } = list;
  const range = pageRange({ pageIndex, pageSize, count: items.length, total });
  const sortField = sort?.replace(/^-/, '');
  const sortDesc = sort?.startsWith('-');
  const span = columns.length + (onRowClick ? 1 : 0);

  return (
    <div className="gh-table-card">
      {toolbar && <div className="gh-toolbar" role="search">{toolbar}</div>}
      <div className="gh-table-wrap" aria-busy={loading}>
        <table className="gh-table">
          {caption && <caption style={srOnly}>{caption}</caption>}
          <thead>
            <tr>
              {columns.map((col) => {
                const active = col.sortKey && col.sortKey === sortField;
                const SortIcon = !active ? ArrowUpDown : sortDesc ? ArrowDown : ArrowUp;
                return (
                  <th key={col.key} style={col.width ? { width: col.width } : undefined}
                      aria-sort={active ? (sortDesc ? 'descending' : 'ascending') : undefined}>
                    {col.sortKey && onSortChange ? (
                      <button type="button" className="gh-th-btn" onClick={() => onSortChange(col.sortKey)}>
                        {col.label}
                        <SortIcon size={13} aria-hidden="true" style={{ opacity: active ? 1 : 0.45 }} />
                      </button>
                    ) : col.label}
                  </th>
                );
              })}
              {onRowClick && <th aria-hidden="true" />}
            </tr>
          </thead>
          <tbody>
            {error ? (
              <tr><td colSpan={span} className="gh-table-state">
                <span className="gh-empty-icon" style={{ color: 'var(--gh-red)', background: 'var(--gh-red-50)' }}><CircleAlert size={22} aria-hidden="true" /></span>
                <p style={{ margin: '0 0 0.9rem' }}>{t('table.loadFailed')} {describeApiError(error, t)}</p>
                <button type="button" className="gh-btn gh-btn-sm" onClick={list.reload}>{t('common.retry')}</button>
              </td></tr>
            ) : loading && !items.length ? (
              Array.from({ length: 6 }, (_, i) => (
                <tr key={`sk-${i}`}>
                  {columns.map((c, ci) => <td key={c.key}><div className="gh-skel" style={{ width: ci === 0 ? '70%' : '55%' }} /></td>)}
                  {onRowClick && <td />}
                </tr>
              ))
            ) : !items.length ? (
              <tr><td colSpan={span} className="gh-table-state">
                <span className="gh-empty-icon"><Inbox size={22} aria-hidden="true" /></span>
                <p style={{ margin: 0 }}>{emptyText || t('table.empty')}</p>
              </td></tr>
            ) : (
              items.map((row) => (
                <tr
                  key={rowKey(row)}
                  className={onRowClick ? 'gh-row' : undefined}
                  tabIndex={onRowClick ? 0 : undefined}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  onKeyDown={onRowClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onRowClick(row); } } : undefined}
                  style={loading ? { opacity: 0.55 } : undefined}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={[col.mono && 'gh-mono', col.nowrap && 'gh-nowrap'].filter(Boolean).join(' ') || undefined}>
                      {col.render ? col.render(row) : (row[col.key] ?? '')}
                    </td>
                  ))}
                  {onRowClick && <td className="gh-cell-end"><ChevronRight className="gh-chev" size={18} aria-hidden="true" /></td>}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="gh-pager">
        <span aria-live="polite">{error || (loading && !items.length) ? '' : t('table.displaying', range)}</span>
        <div className="gh-pager-controls">
          <label className="gh-muted" style={{ display: 'flex', gap: '0.45rem', alignItems: 'center' }}>
            {t('table.perPage')}
            <select className="gh-select" value={pageSize} onChange={(e) => list.setPageSize(Number(e.target.value))}>
              {PAGE_SIZES.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          <button type="button" className="gh-btn gh-btn-sm" onClick={list.prev} disabled={!list.hasPrev || loading} aria-label={t('table.previous')}>
            <ChevronLeft size={16} aria-hidden="true" />
          </button>
          <button type="button" className="gh-btn gh-btn-sm" onClick={list.next} disabled={!list.hasNext || loading} aria-label={t('table.next')}>
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}

const srOnly = { position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' };
