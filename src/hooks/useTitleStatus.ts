import { useEffect } from "react";
import { useSightings, isLive } from "../stores/sightings";
import { useNow } from "./useNow";

const BASE_TITLE = "Otterwatch";
const RAINBOW = ["🔴", "🟠", "🟡", "🟢", "🔵", "🟣"];
const RAINBOW_INTERVAL_MS = 400;

// Prefix the tab title with a status dot so it reads from a background tab: gray when
// quiet, green when one cam is live, and a cycling rainbow on a raft alert (2+ live cams).
// Uses the same liveness as the on-page badge
export function useTitleStatus(): void {
  const sightings = useSightings((s) => s.sightings);
  const now = useNow();

  const liveCams = new Set(
    sightings.filter((s) => isLive(s, now)).map((s) => s.cam_id),
  ).size;

  useEffect(() => {
    if (liveCams >= 2) {
      let i = 0;
      const tick = () => {
        document.title = `${RAINBOW[i % RAINBOW.length]} ${BASE_TITLE}`;
        i += 1;
      };
      tick();
      const id = setInterval(tick, RAINBOW_INTERVAL_MS);
      return () => clearInterval(id);
    }
    document.title = `${liveCams === 1 ? "🟢" : "⚪"} ${BASE_TITLE}`;
  }, [liveCams]);
}
