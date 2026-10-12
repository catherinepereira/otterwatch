import { useEffect, useState } from "react";

// Re-renders the caller on an interval so time-derived UI (live status, cam heartbeats)
// updates as time passes, not only when the data changes. Default 30s keeps it accurate to
// within half a minute
export function useNow(intervalMs = 30_000): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}
