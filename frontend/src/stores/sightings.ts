import { create } from "zustand";
import type { Sighting } from "../types/database";

interface SightingsState {
  sightings: Sighting[];
  setAll: (rows: Sighting[]) => void;
  upsert: (row: Sighting) => void;
}

// A sighting counts as "live" when its cam is online (the worker's heartbeat is fresh) and
// either:
//   - it is still open (ended_at null), or
//   - it started in the viewer's current local minute, so a fresh sighting shows live
//     right away even if it already ended this minute
// A row left open by a crashed worker stops counting once the heartbeat goes stale, and the
// worker closes it when it restarts
function startedThisLocalMinute(started: Date, now: Date): boolean {
  return (
    started.getFullYear() === now.getFullYear() &&
    started.getMonth() === now.getMonth() &&
    started.getDate() === now.getDate() &&
    started.getHours() === now.getHours() &&
    started.getMinutes() === now.getMinutes()
  );
}

export const isLive = (
  s: Sighting,
  now: number,
  onlineCams: ReadonlySet<string>,
) => {
  if (!onlineCams.has(s.cam_id)) return false;
  const started = new Date(s.started_at);
  if (Number.isNaN(started.getTime())) return false;
  if (startedThisLocalMinute(started, new Date(now))) return true;
  return s.ended_at === null;
};

export const useSightings = create<SightingsState>((set) => ({
  sightings: [],
  setAll: (rows) => set({ sightings: rows }),
  upsert: (row) =>
    set((state) => {
      const i = state.sightings.findIndex((s) => s.id === row.id);
      if (i === -1) return { sightings: [row, ...state.sightings] };
      const next = state.sightings.slice();
      next[i] = row;
      return { sightings: next };
    }),
}));
