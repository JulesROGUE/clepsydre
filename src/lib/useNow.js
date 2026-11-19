import { useEffect, useState } from 'react';

/** Date courante, rafraîchie toutes les `intervalMs` millisecondes. */
export function useNow(intervalMs) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}
