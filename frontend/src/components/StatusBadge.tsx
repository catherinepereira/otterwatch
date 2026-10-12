import { useSightings, isLive } from "../stores/sightings";
import { useCams, onlineCamIds } from "../stores/cams";
import { useDayNight } from "../hooks/useDayNight";
import { useNow } from "../hooks/useNow";

export function StatusBadge() {
  const now = useNow();
  const sightings = useSightings((s) => s.sightings);
  const cams = useCams((s) => s.cams);
  const online = onlineCamIds(cams, now);
  // Count distinct cams with a live sighting. Per-frame otter counts from a zero-shot
  // detector are unreliable, so a raft is two or more aquariums active at once
  const liveCams = new Set(
    sightings.filter((x) => isLive(x, now, online)).map((x) => x.cam_id),
  ).size;
  const isDay = useDayNight();
  // Cams loaded but none heartbeating: quiet would be a guess, say so instead
  const offline = cams.length > 0 && online.size === 0;

  const label = offline
    ? "detector offline, sightings paused"
    : liveCams === 0
      ? isDay
        ? "otterly quiet..."
        : "otterly quiet... otters are resting 🌙"
      : liveCams === 1
        ? "live otter action happening"
        : "RAFT ALERT! MULTIPLE OTTERS SIGHTED!";

  const raft = liveCams > 1;
  const dotStyle = raft
    ? {
        animation:
          "rainbow 1.2s linear infinite, pulse 1.6s ease-in-out infinite",
      }
    : {
        background:
          liveCams === 1 ? "var(--color-green)" : "var(--color-text-dim)",
        animation:
          liveCams === 1 ? "pulse 1.6s ease-in-out infinite" : undefined,
      };

  return (
    <div className="bg-card border-border flex items-center gap-2 rounded-md border px-3 py-2">
      <span
        className="inline-block h-2.5 w-2.5 rounded-full"
        style={dotStyle}
      />
      <span className="text-sm">{label}</span>
    </div>
  );
}
