import { useEffect } from "react";
import { fetchRecentSightings, subscribeSightings } from "../lib/supabase";
import { useSightings } from "../stores/sightings";
import type { Sighting } from "../types/database";

// Loads recent sightings once, then keeps the store in sync via Realtime. Calls
// onNewSighting for each fresh insert so the UI can toast / notify
export function useRealtimeSightings(onNewSighting?: (s: Sighting) => void) {
  const setAll = useSightings((s) => s.setAll);
  const upsert = useSightings((s) => s.upsert);

  useEffect(() => {
    let active = true;
    fetchRecentSightings().then((rows) => {
      if (active) setAll(rows);
    });

    const unsubscribe = subscribeSightings(
      (row) => {
        upsert(row);
        onNewSighting?.(row);
      },
      (row) => upsert(row),
    );

    return () => {
      active = false;
      unsubscribe();
    };
    // onNewSighting is excluded on purpose; callers pass a stable callback
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setAll, upsert]);
}
