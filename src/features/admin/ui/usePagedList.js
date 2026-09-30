import { useCallback, useEffect, useRef, useState } from 'react';
import { nextTokens } from './pagination.js';

/**
 * State for a server-paginated list. `fetchPage(query)` must resolve to
 * `{items, nextPageToken, total}`.
 *
 * Changing `query` (filters, sort, search) or the page size goes back to page
 * 1, because a cursor from the old query means nothing under the new one. The
 * page position is stored WITH the query it belongs to, so a new query is on
 * page 1 in the same render - no request is ever sent pairing a new filter
 * with an old cursor.
 */
export function usePagedList(fetchPage, query, { pageSize: initialPageSize = 30 } = {}) {
  const [pageSize, setPageSize] = useState(initialPageSize);
  const navKey = `${JSON.stringify(query)}|${pageSize}`;
  const fresh = { key: navKey, pageIndex: 0, tokens: [null] };
  const [storedNav, setNav] = useState(fresh);
  const nav = storedNav.key === navKey ? storedNav : fresh;

  const [state, setState] = useState({ loading: true, error: null, items: [], total: 0, nextPageToken: null });
  const [reloadKey, setReloadKey] = useState(0);
  const requestId = useRef(0);

  useEffect(() => {
    const id = ++requestId.current;
    const { pageIndex, tokens } = nav;
    setState((s) => ({ ...s, loading: true, error: null }));
    fetchPage({ ...query, pageSize, pageToken: tokens[pageIndex] || undefined })
      .then((res) => {
        // A slower earlier response must not overwrite a newer one (typing in search).
        if (id !== requestId.current) return;
        setState({ loading: false, error: null, items: res.items || [], total: res.total ?? 0, nextPageToken: res.nextPageToken || null });
        setNav((n) => {
          const base = n.key === navKey ? n : { key: navKey, pageIndex, tokens };
          return { ...base, tokens: nextTokens(base.tokens, pageIndex, res.nextPageToken || null) };
        });
      })
      .catch((error) => {
        if (id !== requestId.current) return;
        setState((s) => ({ ...s, loading: false, error }));
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navKey, nav.pageIndex, reloadKey]);

  const move = useCallback((delta) => setNav((n) => {
    const base = n.key === navKey ? n : { key: navKey, pageIndex: 0, tokens: [null] };
    return { ...base, pageIndex: Math.max(0, base.pageIndex + delta) };
  }), [navKey]);

  return {
    ...state,
    pageIndex: nav.pageIndex,
    pageSize,
    setPageSize,
    hasPrev: nav.pageIndex > 0,
    hasNext: !!state.nextPageToken,
    prev: useCallback(() => move(-1), [move]),
    next: useCallback(() => move(1), [move]),
    reload: useCallback(() => setReloadKey((k) => k + 1), [])
  };
}
