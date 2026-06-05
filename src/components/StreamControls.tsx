import { useState } from "react";

function command(func: string, args: unknown = "") {
  const message = JSON.stringify({ event: "command", func, args });
  document.querySelectorAll("iframe").forEach((frame) => {
    frame.contentWindow?.postMessage(message, "https://www.youtube.com");
  });
}

const btn =
  "flex h-7 w-7 items-center justify-center rounded-md border border-border text-text-muted transition-colors hover:border-accent hover:text-text-primary";

export function StreamControls() {
  const [paused, setPaused] = useState(false);

  const togglePlay = () => {
    command(paused ? "playVideo" : "pauseVideo");
    setPaused((p) => !p);
  };

  // Seeking past the end snaps each player to the live edge, pulling any drifted or
  // resumed stream back to live
  const syncToLive = () => {
    command("playVideo");
    command("seekTo", [99999999, true]);
    setPaused(false);
  };

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={togglePlay}
        aria-label={paused ? "Play all streams" : "Pause all streams"}
        title={paused ? "Play all" : "Pause all"}
        className={btn}
      >
        {paused ? <PlayIcon /> : <PauseIcon />}
      </button>
      <button
        type="button"
        onClick={syncToLive}
        aria-label="Sync all streams to live"
        title="Sync to live"
        className={btn}
      >
        <SyncIcon />
      </button>
    </div>
  );
}

function PauseIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      width="13"
      height="13"
      fill="currentColor"
      aria-hidden="true"
    >
      <rect x="3" y="2.5" width="3.5" height="11" rx="1" />
      <rect x="9.5" y="2.5" width="3.5" height="11" rx="1" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      width="13"
      height="13"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M4 2.5v11a.75.75 0 0 0 1.14.64l9-5.5a.75.75 0 0 0 0-1.28l-9-5.5A.75.75 0 0 0 4 2.5Z" />
    </svg>
  );
}

function SyncIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      width="13"
      height="13"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M13.65 2.35A7.95 7.95 0 0 0 8 0C3.58 0 0 3.58 0 8h2a6 6 0 0 1 10.24-4.24L10 6h6V0l-2.35 2.35ZM14 8a6 6 0 0 1-10.24 4.24L6 10H0v6l2.35-2.35A7.95 7.95 0 0 0 8 16c4.42 0 8-3.58 8-8h-2Z" />
    </svg>
  );
}
