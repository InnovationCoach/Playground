import { useCallback, useEffect, useRef, useState } from 'react';

/** Run an async loader on mount and whenever `deps` change; `reload()` re-runs it. */
export function useAsync(loader, deps = []) {
  const [state, setState] = useState({ loading: true, error: null, data: null });
  const [key, setKey] = useState(0);
  const requestId = useRef(0);

  useEffect(() => {
    const id = ++requestId.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    loader()
      .then((data) => { if (id === requestId.current) setState({ loading: false, error: null, data }); })
      .catch((error) => { if (id === requestId.current) setState({ loading: false, error, data: null }); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, key]);

  return { ...state, reload: useCallback(() => setKey((k) => k + 1), []), setData: useCallback((data) => setState((s) => ({ ...s, data })), []) };
}
