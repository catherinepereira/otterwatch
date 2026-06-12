import { embedUrl } from "../utils/youtube";
import { donateLinks } from "../utils/donateLinks";
import { useNotifyPrefs } from "../stores/notifyPrefs";

interface LiveEmbedProps {
  id: string;
  youtubeUrl: string;
  name: string;
}

export function LiveEmbed({ id, youtubeUrl, name }: LiveEmbedProps) {
  const src = embedUrl(youtubeUrl);
  const donate = donateLinks[id];
  const notifyOn = useNotifyPrefs((s) => s.enabled.has(id));
  const toggleNotify = useNotifyPrefs((s) => s.toggle);

  return (
    <div className="border-border bg-card overflow-hidden rounded-lg border">
      <div className="aspect-video">
        {src ? (
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
