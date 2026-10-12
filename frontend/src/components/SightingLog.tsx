import { useState } from "react";
import { useSightings, isLive } from "../stores/sightings";
import { useCams, onlineCamIds } from "../stores/cams";
import { useNow } from "../hooks/useNow";
import { ImagePreview } from "./ImagePreview";
import type { Sighting } from "../types/database";

const rowClass =
  "flex items-center gap-3 rounded-md border border-border bg-card p-2";

function timeLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function SightingRow({
  s,
  live,
  onPreview,
}: {
  s: Sighting;
  live: boolean;
  onPreview: (src: string) => void;
}) {
  // A live sighting has no thumbnail yet: it is uploaded from the peak frame on end. Show
  // a pending marker in the slot the image will fill so the row does not look empty
  const pending = !s.thumbnail && live;

  return (
    <li className={rowClass} style={{ animation: "slideIn 0.2s ease-out" }}>
      {s.thumbnail ? (
        <img
          src={s.thumbnail}
          alt=""
          onClick={() => onPreview(s.thumbnail!)}
          className="h-12 w-20 cursor-pointer rounded-sm object-cover transition-opacity hover:opacity-80"
        />
      ) : (
        <div
          className="bg-elevated text-text-dim flex h-12 w-20 items-center justify-center rounded-sm"
          aria-label={pending ? "thumbnail pending" : undefined}
          title={pending ? "capturing thumbnail…" : undefined}
        >
          {pending && <span className="otter-spin text-base">⏳</span>}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-sm">
          <span>🦦 {s.cam_id}</span>
          {live && (
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              aria-label="live"
              style={{
                background: "var(--color-green)",
                animation: "pulse 1.6s ease-in-out infinite",
              }}
            />
          )}
        </div>
        <div className="text-text-dim text-xs">
          {timeLabel(s.started_at)}
          {s.confidence != null && ` · ${Math.round(s.confidence * 100)}%`}
        </div>
      </div>
    </li>
  );
}

const MAX_SHOWN = 10;

export function SightingLog() {
  const sightings = useSightings((s) => s.sightings);
  const cams = useCams((s) => s.cams);
  const now = useNow();
  const [preview, setPreview] = useState<string | null>(null);

  if (sightings.length === 0) {
    return <p className="text-text-dim text-sm">No sightings yet.</p>;
  }

  // Live sightings float to the top, within each group the store's newest-first order
  // (started_at descending) is preserved by the stable sort
  const online = onlineCamIds(cams, now);
  const live = (s: Sighting) => isLive(s, now, online);
  const ordered = sightings
    .map((s) => ({ s, live: live(s) }))
    .sort((a, b) => Number(b.live) - Number(a.live));

  return (
    <>
      <ul className="flex flex-col gap-2">
        {ordered.slice(0, MAX_SHOWN).map(({ s, live }) => (
          <SightingRow key={s.id} s={s} live={live} onPreview={setPreview} />
        ))}
      </ul>
      {preview && (
        <ImagePreview src={preview} onClose={() => setPreview(null)} />
      )}
    </>
  );
}
