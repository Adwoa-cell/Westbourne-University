import { useEffect, useState } from 'react';
import { api } from '../api/client.js';

// Loads GET `path` whenever path or params change. Returns { data, loading, error }.
export function useFetch(path, params) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const key = JSON.stringify(params ?? {});

  useEffect(() => {
    const controller = new AbortController();
    setState((s) => ({ ...s, loading: true, error: null }));
    api
      .get(path, params, controller.signal)
      .then((payload) => setState({ data: payload, loading: false, error: null }))
      .catch((err) => {
        if (err.name !== 'AbortError') setState({ data: null, loading: false, error: err });
      });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, key]);

  return state;
}
