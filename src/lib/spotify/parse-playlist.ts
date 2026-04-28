const PLAYLIST_IN_URL =
  /open\.spotify\.com\/(?:intl-[a-z]{2}\/)?playlist\/([a-zA-Z0-9]+)/;
const PLAYLIST_URI = /^spotify:playlist:([a-zA-Z0-9]+)$/;

export function extractSpotifyPlaylistId(input: string): string | null {
  const s = input.trim();
  const uri = s.match(PLAYLIST_URI);
  if (uri) return uri[1];
  const url = s.match(PLAYLIST_IN_URL);
  if (url) return url[1];
  if (/^[a-zA-Z0-9]{22}$/.test(s)) return s;
  return null;
}
