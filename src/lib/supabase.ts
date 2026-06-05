import { createClient } from "@supabase/supabase-js";
import type { Database, Sighting } from "../types/database";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient<Database>(url, anonKey);

// Columns the log renders. Naming them keeps the initial payload lean
// instead of pulling every column with select('*')
const SIGHTING_COLS =
  "id, cam_id, started_at, ended_at, confidence, thumbnail, detector";

// Fetch the most recent sightings for the initial render. Realtime takes over after
export async function fetchRecentSightings(limit = 50): Promise<Sighting[]> {
  const { data, error } = await supabase
    .from("sightings")
    .select(SIGHTING_COLS)
    .order("started_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

// Subscribe to inserts (new sightings) and updates (a sighting ending). The worker
// writes the rows, Supabase pushes them here. Returns an unsubscribe function
export function subscribeSightings(
  onInsert: (s: Sighting) => void,
  onUpdate: (s: Sighting) => void,
): () => void {
  const channel = supabase
    .channel("sightings")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "sightings" },
      (payload) => onInsert(payload.new as Sighting),
    )
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "sightings" },
      (payload) => onUpdate(payload.new as Sighting),
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
