import { useState } from "react";
import { useSightings, isLive } from "../stores/sightings";
import { ImagePreview } from "./ImagePreview";
import type { Sighting } from "../types/database";

const rowClass =
  "flex items-center gap-3 rounded-md border border-border bg-card p-2";

function timeLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// Only flash "live" when the sighting started this minute, so a row that never got its
// ended_at patched (e.g. the worker restarted mid-sighting) does not pulse forever
function startedThisMinute(iso: string): boolean {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate() &&
    d.getHours() === now.getHours() &&
    d.getMinutes() === now.getMinutes()
  );
}

function SightingRow({
  s,
  onPreview,
}: {
  s: Sighting;
  onPreview: (src: string) => void;
}) {
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
        <div className="bg-elevated h-12 w-20 rounded-sm" />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-sm">
          <span>🦦 {s.cam_id}</span>
          {isLive(s) && startedThisMinute(s.started_at) && (
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
  const [preview, setPreview] = useState<string | null>(null);

  if (sightings.length === 0) {
    return <p className="text-text-dim text-sm">No sightings yet.</p>;
  }

  return (
    <>
      <ul className="flex flex-col gap-2">
        {sightings.slice(0, MAX_SHOWN).map((s) => (
          <SightingRow key={s.id} s={s} onPreview={setPreview} />
        ))}
      </ul>
      {preview && (
        <ImagePreview src={preview} onClose={() => setPreview(null)} />
      )}
    </>
  );
}
