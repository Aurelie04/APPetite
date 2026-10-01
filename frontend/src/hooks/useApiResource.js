import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

/** Loads `fetcher(token)` on mount; signs the user out if the session has expired. */
export default function useApiResource(fetcher) {
  const { token, logout } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(await fetcher(token));
    } catch (err) {
      if (err.status === 401) logout();
      else setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [fetcher, token, logout]);

  /** Background refresh: keeps the current data on failure instead of showing an error. */
  const refresh = useCallback(async () => {
    try {
      setData(await fetcher(token));
      setError('');
    } catch (err) {
      if (err.status === 401) logout();
    }
  }, [fetcher, token, logout]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, setData, error, loading, reload: load, refresh };
}
