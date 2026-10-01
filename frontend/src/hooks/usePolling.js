import { useEffect, useRef } from 'react';

/** Calls `callback` every `intervalMs` while `enabled` and the browser tab is visible. */
export default function usePolling(callback, intervalMs, enabled = true) {
  const saved = useRef(callback);
  useEffect(() => {
    saved.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return undefined;
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') saved.current();
    }, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, enabled]);
}
