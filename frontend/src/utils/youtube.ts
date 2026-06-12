// Pulls the 11-char video id out of the common YouTube URL shapes
export function youtubeId(url: string): string | null {
  const m = url.match(/(?:v=|youtu\.be\/|embed\/|live\/)([\w-]{11})/);
  return m ? m[1] : null;
}

export function embedUrl(url: string): string | null {
  const id = youtubeId(url);
  return id
    ? `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&enablejsapi=1`
    : null;
}
