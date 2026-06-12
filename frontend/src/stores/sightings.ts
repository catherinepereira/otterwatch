import { create } from "zustand";
import type { Sighting } from "../types/database";

interface SightingsState {
  sightings: Sighting[];
  setAll: (rows: Sighting[]) => void;
  upsert: (row: Sighting) => void;
}

// A sighting counts as "live" when either:
//   - it is still open (ended_at null) and started within the last 10 minutes, so a row
//     the worker never patched (crashed mid-sighting) stops counting as live, or
//   - it started in the viewer's current local minute, so a fresh sighting shows live
//     right away even if it already ended this minute
const LIVE_WINDOW_MS = 10 * 60 * 1000;

function startedThisLocalMinute(started: Date, now: Date): boolean {
  return (
    started.getFullYear() === now.getFullYear() &&
    started.getMonth() === now.getMonth() &&
    started.getDate() === now.getDate() &&
    started.getHours() === now.getHours() &&
    started.getMinutes() === now.getMinutes()
  );
}

export const isLive = (s: Sighting, now: number = Date.now()) => {
  const started = new Date(s.started_at);
  if (Number.isNaN(started.getTime())) return false;
  if (startedThisLocalMinute(started, new Date(now))) return true;
  return s.ended_at === null && now - started.getTime() < LIVE_WINDOW_MS;
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
