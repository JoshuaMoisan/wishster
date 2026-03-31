const TRACK_IN_URL =
  /open\.spotify\.com\/(?:intl-[a-z]{2}\/)?track\/([a-zA-Z0-9]+)/;
const TRACK_URI = /^spotify:track:([a-zA-Z0-9]+)$/;

export function extractSpotifyTrackId(input: string): string | null {
  const s = input.trim();
  const uri = s.match(TRACK_URI);
  if (uri) return uri[1];
  const url = s.match(TRACK_IN_URL);
  if (url) return url[1];
  if (/^[a-zA-Z0-9]{22}$/.test(s)) return s;
  return null;
}

export function trackUriFromId(id: string): string {
  return `spotify:track:${id}`;
}
