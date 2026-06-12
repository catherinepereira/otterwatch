import { create } from "zustand";

const STORAGE_KEY = "otterwatch-notify-cams";

function load(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function save(cams: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...cams]));
}

interface NotifyPrefsState {
  enabled: Set<string>;
  isEnabled: (camId: string) => boolean;
  toggle: (camId: string) => void;
}

export const useNotifyPrefs = create<NotifyPrefsState>((set, get) => ({
  enabled: load(),
  isEnabled: (camId) => get().enabled.has(camId),
  toggle: (camId) => {
    const next = new Set(get().enabled);
    if (next.has(camId)) {
      next.delete(camId);
    } else {
      next.add(camId);
    }
    save(next);
    set({ enabled: next });
  },
}));
