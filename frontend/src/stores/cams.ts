import { create } from "zustand";
import type { Cam } from "../types/database";

interface CamsState {
  cams: Cam[];
  setCams: (cams: Cam[]) => void;
}

export const useCams = create<CamsState>((set) => ({
  cams: [],
  setCams: (cams) => set({ cams }),
}));

// The worker stamps last_frame_at about once a minute while it reads a cam's stream and
// the site polls every minute, so a stamp this old means the worker or the stream is down
const OFFLINE_AFTER_MS = 5 * 60 * 1000;

export function isOnline(cam: Cam, now: number): boolean {
  if (!cam.last_frame_at) return false;
  return now - new Date(cam.last_frame_at).getTime() < OFFLINE_AFTER_MS;
}

export function onlineCamIds(cams: Cam[], now: number): Set<string> {
  return new Set(cams.filter((c) => isOnline(c, now)).map((c) => c.id));
}
