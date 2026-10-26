import { useState } from "react";
import { embedUrl } from "../utils/youtube";
import { donateLinks } from "../utils/donateLinks";
import { isMobile } from "../utils/mobile";
import { useNotifyPrefs } from "../stores/notifyPrefs";

interface LiveEmbedProps {
  id: string;
  youtubeUrl: string;
  name: string;
  offline: boolean;
}

export function LiveEmbed({ id, youtubeUrl, name, offline }: LiveEmbedProps) {
  const src = embedUrl(youtubeUrl);
  const donate = donateLinks[id];
  const notifyOn = useNotifyPrefs((s) => s.enabled.has(id));
  const toggleNotify = useNotifyPrefs((s) => s.toggle);
  // phones wait for a tap so four live streams don't load on cellular data
  const [loaded, setLoaded] = useState(() => !isMobile());

  return (
    <div className="border-border bg-card overflow-hidden rounded-lg border">
      <div className="aspect-video">
        {src && !loaded ? (
          <button
            type="button"
            onClick={() => setLoaded(true)}
            aria-label={`Load the ${name} stream`}
            className="text-text-muted hover:text-text-primary flex h-full w-full flex-col items-center justify-center gap-2 transition-colors"
          >
            <svg
              viewBox="0 0 16 16"
              width="28"
              height="28"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M4 2.5v11a.75.75 0 0 0 1.14.64l9-5.5a.75.75 0 0 0 0-1.28l-9-5.5A.75.75 0 0 0 4 2.5Z" />
            </svg>
            <span className="text-sm">Tap to load stream</span>
          </button>
        ) : src ? (
          <iframe
            className="h-full w-full"
            src={src}
            title={name}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div className="text-text-dim flex h-full items-center justify-center">
            no stream
          </div>
        )}
      </div>
      <div className="text-text-muted flex items-center gap-2 px-4 py-2 text-sm">
        <span>{name}</span>
        {offline && (
          <span
            className="text-text-dim text-xs"
            title="The detector is not reading this stream, so sightings here are paused"
          >
            detector offline
          </span>
        )}
        <button
          type="button"
          onClick={() => toggleNotify(id)}
          title={
            notifyOn
              ? `Notifications on for ${name}`
              : `Notify me about ${name}`
          }
          aria-label={
            notifyOn
              ? `Disable notifications for ${name}`
              : `Enable notifications for ${name}`
          }
          aria-pressed={notifyOn}
          className={`ml-auto transition-opacity ${notifyOn ? "opacity-100" : "opacity-60 hover:opacity-100"}`}
        >
          {notifyOn ? "🔔" : "🔕"}
        </button>
        {donate && (
          <a
            href={donate}
            target="_blank"
            rel="noopener noreferrer"
            title={`Support ${name}`}
            aria-label={`Donate to ${name}`}
            className="opacity-80 transition-opacity hover:opacity-100"
          >
            💙
          </a>
        )}
      </div>
    </div>
  );
}
