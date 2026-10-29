import { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Plus,
  Download,
  Boxes,
  Image as ImageIcon,
  ChevronRight,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Archive,
  RefreshCw
} from 'lucide-react';
import { useLocale } from '../../../app/i18n/LocaleProvider.jsx';
import { Alert } from '../ui/bits.jsx';
import {
  ASSET_CATEGORIES,
  ASSET_STATUSES,
  subscribeAssets
} from './inventoryStore.js';
import { downloadInventoryCsv } from './csv.js';

const PAGE_SIZES = [10, 25, 50, 100];

/**
 * Main Inventory List screen for Equipment Assets.
 *
 * @param {object} props
 * @param {object} props.perms User console permissions
 * @param {function(string): void} props.onOpen Opens asset detail by ID
 * @param {function(): void} props.onCreate Opens asset create form
 * @param {function(object): void} [props.onEdit] Opens asset edit form
 */
export function InventoryList({ perms, onOpen, onCreate, onEdit }) {
  const { t, locale } = useLocale();

  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showRetired, setShowRetired] = useState(false);

  // Sorting
  const [sortField, setSortField] = useState('name');
  const [sortAsc, setSortAsc] = useState(true);

  // Pagination
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(25);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim().toLowerCase());
      setPageIndex(0);
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  // Subscribe to live assets
  useEffect(() => {
    setLoading(true);
    const unsub = subscribeAssets(
      (data) => {
        setAssets(data);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('[InventoryList] Subscription error:', err);
        setError(err.message || 'Failed to load inventory assets');
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  // Compute unique locations for filter dropdown
  const uniqueLocations = useMemo(() => {
    const locSet = new Set();
    assets.forEach((a) => {
      if (a.location && a.location.trim()) {
        locSet.add(a.location.trim());
      }
    });
    return Array.from(locSet).sort();
  }, [assets]);

  // Filtered assets
  const filteredAssets = useMemo(() => {
    return assets.filter((item) => {
      // Search matches name, assetTag, serial
      if (debouncedSearch) {
        const nameMatch = item.name?.toLowerCase().includes(debouncedSearch);
        const tagMatch = item.assetTag?.toLowerCase().includes(debouncedSearch);
        const serialMatch = item.serial?.toLowerCase().includes(debouncedSearch);
        if (!nameMatch && !tagMatch && !serialMatch) return false;
      }

      // Category filter
      if (categoryFilter && item.category !== categoryFilter) {
        return false;
      }

      // Location filter
      if (locationFilter && item.location !== locationFilter) {
        return false;
      }

      // Status filter
      if (statusFilter && item.status !== statusFilter) {
        return false;
      }

      // Retired toggle: if not showing retired, exclude retired items unless explicit status filter is 'retired'
      if (!showRetired && item.status === 'retired' && statusFilter !== 'retired') {
        return false;
      }

      return true;
    });
  }, [assets, debouncedSearch, categoryFilter, locationFilter, statusFilter, showRetired]);

  // Sorted assets
  const sortedAssets = useMemo(() => {
    return [...filteredAssets].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      // Handle nulls
      if (valA === undefined || valA === null) valA = '';
      if (valB === undefined || valB === null) valB = '';

      if (sortField === 'updatedAt' || sortField === 'createdAt') {
        const timeA = valA?.toMillis ? valA.toMillis() : (valA ? new Date(valA).getTime() : 0);
        const timeB = valB?.toMillis ? valB.toMillis() : (valB ? new Date(valB).getTime() : 0);
        return sortAsc ? timeA - timeB : timeB - timeA;
      }

      if (typeof valA === 'string') {
        const comp = valA.localeCompare(String(valB), locale);
        return sortAsc ? comp : -comp;
      }

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [filteredAssets, sortField, sortAsc, locale]);

  // Paged assets
  const totalCount = sortedAssets.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage = Math.min(pageIndex, totalPages - 1);
  const pagedAssets = useMemo(() => {
    const start = currentPage * pageSize;
    return sortedAssets.slice(start, start + pageSize);
  }, [sortedAssets, currentPage, pageSize]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const handleExportCsv = () => {
    const dateStr = new Date().toISOString().slice(0, 10);
    downloadInventoryCsv(filteredAssets, `inventory-${dateStr}.csv`);
  };

  const statusBadgeClass = (status) => {
    switch (status) {
      case 'available':
        return 'gh-badge-available';
      case 'in_use':
        return 'gh-badge-in_use';
      case 'needs_repair':
        return 'gh-badge-needs_repair';
      case 'retired':
        return 'gh-badge-retired';
      default:
        return 'gh-badge-plain';
    }
  };

  return (
    <div className="gh-inventory-list">
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '1.75rem', fontWeight: 800 }}>
            <Boxes size={26} color="var(--gh-purple)" aria-hidden="true" />
            {t('inventory.title')}
          </h1>
          <p className="gh-muted" style={{ margin: '4px 0 0', fontSize: '0.9rem' }}>
            {t('inventory.availableCount', {
              avail: assets.filter((a) => a.status === 'available').length,
              total: assets.length
            })}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="gh-btn"
            onClick={handleExportCsv}
            disabled={!filteredAssets.length}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, minHeight: 44, padding: '0 16px' }}
            title={t('inventory.exportCsv')}
          >
            <Download size={16} aria-hidden="true" />
            {t('inventory.exportCsv')}
          </button>

          {perms?.editInventory && (
            <button
              type="button"
              className="gh-btn gh-btn-primary"
              onClick={onCreate}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, minHeight: 44, padding: '0 18px' }}
            >
              <Plus size={18} aria-hidden="true" />
              {t('inventory.addEquipment')}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: 16 }}>
          <Alert type="error">{error}</Alert>
        </div>
      )}

      {/* Main Table Card */}
      <div className="gh-table-card">
        {/* Toolbar: Search & Filters */}
        <div className="gh-toolbar" role="search" style={{ flexWrap: 'wrap', gap: 12 }}>
          {/* Search Input */}
          <label className="gh-grow gh-input-icon" style={{ minWidth: 220 }}>
            <span style={srOnly}>{t('common.search')}</span>
            <Search size={17} aria-hidden="true" />
            <input
              className="gh-input"
              type="search"
              value={search}
              placeholder={t('inventory.searchPlaceholder')}
              onChange={(e) => setSearch(e.target.value)}
              style={{ minHeight: 42 }}
            />
          </label>

          {/* Category Dropdown */}
          <label className="gh-fixed" style={{ minWidth: 150 }}>
            <span style={srOnly}>{t('inventory.category')}</span>
            <select
              className="gh-select"
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPageIndex(0);
              }}
              style={{ minHeight: 42 }}
            >
              <option value="">{t('inventory.filterCategory')}</option>
              {ASSET_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {t(`inventory.category.${cat}`)}
                </option>
              ))}
            </select>
          </label>

          {/* Location Dropdown */}
          {uniqueLocations.length > 0 && (
            <label className="gh-fixed" style={{ minWidth: 150 }}>
              <span style={srOnly}>{t('inventory.location')}</span>
              <select
                className="gh-select"
                value={locationFilter}
                onChange={(e) => {
                  setLocationFilter(e.target.value);
                  setPageIndex(0);
                }}
                style={{ minHeight: 42 }}
              >
                <option value="">{t('inventory.filterLocation')}</option>
                {uniqueLocations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </label>
          )}

          {/* Status Dropdown */}
          <label className="gh-fixed" style={{ minWidth: 140 }}>
            <span style={srOnly}>{t('inventory.status')}</span>
            <select
              className="gh-select"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPageIndex(0);
              }}
              style={{ minHeight: 42 }}
            >
              <option value="">{t('inventory.filterStatus')}</option>
              {ASSET_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {t(`inventory.status.${st}`)}
                </option>
              ))}
            </select>
          </label>

          {/* Show Retired Checkbox */}
          <label
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              fontSize: '0.875rem',
              cursor: 'pointer',
              userSelect: 'none',
              padding: '0 4px',
              minHeight: 42
            }}
          >
            <input
              type="checkbox"
              checked={showRetired}
              onChange={(e) => {
                setShowRetired(e.target.checked);
                setPageIndex(0);
              }}
              style={{ width: 18, height: 18, cursor: 'pointer', accentColor: 'var(--gh-purple)' }}
            />
            <span>{t('inventory.showRetired')}</span>
          </label>
        </div>

        {/* Responsive Table / Card Container */}
        <div className="gh-table-wrap" aria-busy={loading}>
          <table className="gh-table gh-inventory-table">
            <thead>
              <tr>
                <th style={{ width: 64 }}>{t('inventory.col.photo')}</th>
                <th>
                  <button
                    type="button"
                    className="gh-th-btn"
                    onClick={() => handleSort('name')}
                    style={{ minHeight: 36 }}
                  >
                    {t('inventory.col.name')}
                    {sortField === 'name' && (
                      <span aria-hidden="true" style={{ opacity: 0.8, fontSize: '0.75rem' }}>
                        {sortAsc ? ' ▲' : ' ▼'}
                      </span>
                    )}
                  </button>
                </th>
                <th>{t('inventory.col.category')}</th>
                <th>{t('inventory.col.location')}</th>
                <th style={{ textAlign: 'center' }}>{t('inventory.col.quantity')}</th>
                <th>{t('inventory.col.status')}</th>
                <th>{t('inventory.col.borrower')}</th>
                <th style={{ width: 50 }} aria-hidden="true" />
              </tr>
            </thead>

            <tbody>
              {loading && !assets.length ? (
                Array.from({ length: 5 }, (_, i) => (
                  <tr key={`sk-${i}`}>
                    <td>
                      <div className="gh-skel" style={{ width: 42, height: 42, borderRadius: 6 }} />
                    </td>
                    <td>
                      <div className="gh-skel" style={{ width: '65%', height: 16, marginBottom: 6 }} />
                      <div className="gh-skel" style={{ width: '40%', height: 12 }} />
                    </td>
                    <td><div className="gh-skel" style={{ width: '60%', height: 16 }} /></td>
                    <td><div className="gh-skel" style={{ width: '50%', height: 16 }} /></td>
                    <td><div className="gh-skel" style={{ width: '40%', height: 16, margin: '0 auto' }} /></td>
                    <td><div className="gh-skel" style={{ width: 70, height: 20, borderRadius: 999 }} /></td>
                    <td><div className="gh-skel" style={{ width: '50%', height: 16 }} /></td>
                    <td />
                  </tr>
                ))
              ) : !pagedAssets.length ? (
                <tr>
                  <td colSpan={8} className="gh-table-state" style={{ padding: '48px 16px', textAlign: 'center' }}>
                    <div style={{ color: 'var(--gh-text-3)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                      <Boxes size={36} strokeWidth={1.5} />
                      <p style={{ margin: 0, fontSize: '1rem', fontWeight: 500 }}>
                        {t('inventory.empty')}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                pagedAssets.map((item) => {
                  const loan = item.currentLoan;
                  const hasAvailable = (item.quantityAvailable ?? item.quantity) > 0;

                  return (
                    <tr
                      key={item.id}
                      className="gh-row gh-inventory-row"
                      tabIndex={0}
                      onClick={() => onOpen(item.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onOpen(item.id);
                        }
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      {/* Thumbnail Photo */}
                      <td style={{ verticalAlign: 'middle', width: 64 }}>
                        <div
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 6,
                            overflow: 'hidden',
                            background: 'var(--gh-subtle)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid var(--gh-border)'
                          }}
                        >
                          {item.photo?.url ? (
                            <img
                              src={item.photo.url}
                              alt=""
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              loading="lazy"
                            />
                          ) : (
                            <ImageIcon size={20} color="var(--gh-text-3)" aria-hidden="true" />
                          )}
                        </div>
                      </td>

                      {/* Name & Asset Tag & Serial */}
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--gh-heading)', fontSize: '0.95rem' }}>
                          {item.name}
                        </div>
                        <div style={{ display: 'flex', gap: 8, fontSize: '0.8rem', color: 'var(--gh-text-3)', marginTop: 2 }}>
                          {item.assetTag && (
                            <span className="gh-mono" style={{ background: 'var(--gh-subtle)', padding: '1px 5px', borderRadius: 4 }}>
                              {item.assetTag}
                            </span>
                          )}
                          {item.serial && (
                            <span className="gh-mono">
                              SN: {item.serial}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Category */}
                      <td>
                        <span className="gh-badge gh-badge-plain">
                          {t(`inventory.category.${item.category}`)}
                        </span>
                      </td>

                      {/* Location */}
                      <td>
                        <span style={{ fontSize: '0.875rem', color: 'var(--gh-text-2)' }}>
                          {item.location || '—'}
                        </span>
                      </td>

                      {/* Quantity: available / total */}
                      <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <span
                          style={{
                            fontWeight: 700,
                            color: hasAvailable ? 'var(--gh-green-text)' : 'var(--gh-red)',
                            fontSize: '0.95rem'
                          }}
                        >
                          {item.quantityAvailable ?? item.quantity}
                        </span>
                        <span style={{ color: 'var(--gh-text-3)', margin: '0 3px' }}>/</span>
                        <span style={{ color: 'var(--gh-text-2)' }}>
                          {item.quantity}
                        </span>
                      </td>

                      {/* Status */}
                      <td>
                        <span className={`gh-badge ${statusBadgeClass(item.status)}`}>
                          {t(`inventory.status.${item.status}`)}
                        </span>
                      </td>

                      {/* Current Borrower */}
                      <td>
                        {loan ? (
                          <div style={{ fontSize: '0.85rem' }}>
                            <div style={{ fontWeight: 600, color: 'var(--gh-heading)' }}>
                              {loan.borrowerName}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--gh-purple-text)' }}>
                              {t(`inventory.loan.${loan.borrowerType}`)}
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--gh-text-3)' }}>—</span>
                        )}
                      </td>

                      {/* Row Action Arrow */}
                      <td className="gh-cell-end" style={{ textAlign: 'right' }}>
                        <ChevronRight className="gh-chev" size={18} aria-hidden="true" />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalCount > 0 && (
          <div className="gh-pager">
            <span aria-live="polite">
              {t('table.displaying', {
                start: currentPage * pageSize + 1,
                end: Math.min((currentPage + 1) * pageSize, totalCount),
                total: totalCount
              })}
            </span>

            <div className="gh-pager-controls">
              <label className="gh-muted" style={{ display: 'flex', gap: '0.45rem', alignItems: 'center' }}>
                {t('table.perPage')}
                <select
                  className="gh-select"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPageIndex(0);
                  }}
                  style={{ minHeight: 34 }}
                >
                  {PAGE_SIZES.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                className="gh-btn gh-btn-sm"
                onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
                disabled={currentPage === 0 || loading}
                aria-label={t('table.previous')}
                style={{ minWidth: 36, minHeight: 36 }}
              >
                ‹
              </button>
              <button
                type="button"
                className="gh-btn gh-btn-sm"
                onClick={() => setPageIndex((p) => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage >= totalPages - 1 || loading}
                aria-label={t('table.next')}
                style={{ minWidth: 36, minHeight: 36 }}
              >
                ›
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const srOnly = {
  position: 'absolute',
  width: 1,
  height: 1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap'
};
