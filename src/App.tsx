import { useCallback, useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import { useRealtimeSightings } from "./hooks/useRealtimeSightings";
import { useToasts } from "./hooks/useToasts";
import { StatusBadge } from "./components/StatusBadge";
import { LiveEmbed } from "./components/LiveEmbed";
import { SightingLog } from "./components/SightingLog";
import { ToastStack } from "./components/Toast";
import { ThemeToggle } from "./components/ThemeToggle";
import { StreamControls } from "./components/StreamControls";
import { CreditLine } from "./components/CreditLine";
import { useNotifyPrefs } from "./stores/notifyPrefs";
import { playChime } from "./utils/chime";
import type { Cam, Sighting } from "./types/database";

const sectionTitle = "text-sm font-medium text-text-muted mb-2";

// Only alert when a cam has been quiet for this long, so an active otter session pings
// once instead of on every sighting
const QUIET_WINDOW_MS = 10 * 60 * 1000;
const lastSeenAt = new Map<string, number>();

export default function App() {
  const { toasts, push, dismiss } = useToasts();
  const [cams, setCams] = useState<Cam[]>([]);

  useEffect(() => {
    supabase
      .from("cams")
      .select("*")
      .eq("enabled", true)
      .order("id")
      .then(({ data }) => setCams(data ?? []));
  }, []);

  const onNewSighting = useCallback(
    (s: Sighting) => {
      // Toast and chime are opt-in per cam
      if (!useNotifyPrefs.getState().isEnabled(s.cam_id)) return;

      // Track every sighting's time, but only alert when this aquarium has been quiet
      // for the whole window, so a continuous otter session pings once, not repeatedly
      const now = Date.now();
      const last = lastSeenAt.get(s.cam_id);
      lastSeenAt.set(s.cam_id, now);
      if (last !== undefined && now - last < QUIET_WINDOW_MS) return;

      const cam = cams.find((c) => c.id === s.cam_id);
      const conf =
        s.confidence != null ? ` (${Math.round(s.confidence * 100)}%)` : "";
      push(`🦦 otter on ${cam?.name ?? s.cam_id}`, `Spotted just now${conf}`);
      // The chime plays from a background tab too, so it works when unfocused. A fully
      // closed tab plays nothing (by design)
      playChime();
    },
    [cams, push],
  );

  useRealtimeSightings(onNewSighting);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <header className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-2xl font-semibold">
          <span className="otter-spin">🦦</span> Otterwatch
        </h1>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <CreditLine />
        </div>
      </header>
      <p className="text-text-dim mb-6 text-sm">
        Live video feed otter detection using one-shot{" "}
        <a
          href="https://docs.ultralytics.com/models/yolo-world/"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-accent-light underline underline-offset-2"
        >
          YOLO-World
        </a>{" "}
        prompting. Enable notifications to get reminded if your favorite otters
        show up (will only ping if otters return after ten minutes).
        <br />
        Please consider supporting these aquariums and their conservation and
        rehabilitation efforts by donating via the 💙!
      </p>

      <div className="mb-6">
        <StatusBadge />
      </div>

      <div className="grid gap-6 lg:grid-cols-[3fr_1fr]">
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-text-muted text-sm font-medium">
              Live ({cams.length})
            </h2>
            <StreamControls />
          </div>
          {cams.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {cams.map((cam) => (
                <LiveEmbed
                  key={cam.id}
                  id={cam.id}
                  youtubeUrl={cam.youtube_url}
                  name={cam.name}
                />
              ))}
            </div>
          ) : (
            <p className="text-text-dim text-sm">No cams configured yet.</p>
          )}
        </section>

        <section>
          <h2 className={sectionTitle}>Recent sightings</h2>
          <SightingLog />
        </section>
      </div>

      <footer className="text-text-dim mt-10 text-xs">
        Made in honor of{" "}
        <a
          href="https://en.wikipedia.org/wiki/Rosa_(sea_otter)"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-accent-light underline underline-offset-2"
        >
          Rosa the sea otter
        </a>{" "}
        ❤️✨
      </footer>

      <ToastStack toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
