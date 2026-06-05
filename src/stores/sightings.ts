import { create } from "zustand";
import type { Sighting } from "../types/database";

interface SightingsState {
  sightings: Sighting[];
  setAll: (rows: Sighting[]) => void;
  upsert: (row: Sighting) => void;
}

// A sighting is "live" while its ended_at is null
export const isLive = (s: Sighting) => s.ended_at === null;

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
