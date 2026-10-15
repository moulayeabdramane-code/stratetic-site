import { useCallback, useEffect, useRef, useState } from 'react';

/** Routeur minimal par hash (#/documents/12) — aucune dépendance. */
export function useRoute() {
  const read = () => (window.location.hash.replace(/^#/, '') || '/').split('?')[0];
  const [path, setPath] = useState(read);
  useEffect(() => {
    const on = () => setPath(read());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return path;
}

export const navigate = (path) => { window.location.hash = path; };

/** Valeur retardée (saisie -> requête). */
export function useDebounced(value, delay = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

/** Charge une ressource ; renvoie [data, reload, error, loading]. */
export function useLoad(fn, deps = []) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }));
    try {
      const data = await fnRef.current();
      setState({ data, error: null, loading: false });
    } catch (error) {
      setState({ data: null, error, loading: false });
    }
  }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, deps);
  return [state.data, load, state.error, state.loading];
}

/** Préférence locale tolérante (localStorage peut être indisponible). */
export function useLocalPref(key, initial) {
  const [v, setV] = useState(() => {
    try { const s = localStorage.getItem(key); return s == null ? initial : JSON.parse(s); } catch { return initial; }
  });
  const set = useCallback((next) => {
    setV(next);
    try { localStorage.setItem(key, JSON.stringify(next)); } catch { /* ignoré */ }
  }, [key]);
  return [v, set];
}
