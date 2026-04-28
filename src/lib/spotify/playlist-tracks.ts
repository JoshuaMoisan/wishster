import { spotifyApiJson } from "./fetch";
import { mapSpotifyTrack, type MappedTrack, type SpotifyTrackApi } from "./map-track";

type PlaylistTrackItem = {
  is_local?: boolean;
  track: unknown;
};

type PlaylistTracksPage = {
  items: PlaylistTrackItem[];
  next: string | null;
};

function isSpotifyTrackApi(t: unknown): t is SpotifyTrackApi {
  if (!t || typeof t !== "object") return false;
  const o = t as Record<string, unknown>;
  if (o.type === "episode") return false;
  if (typeof o.id !== "string" || !o.id) return false;
  if (!Array.isArray(o.artists)) return false;
  const album = o.album;
  if (!album || typeof album !== "object") return false;
  if (typeof (o as { uri?: unknown }).uri !== "string") return false;
  if (typeof (o as { name?: unknown }).name !== "string") return false;
  if (typeof (o as { duration_ms?: unknown }).duration_ms !== "number")
    return false;
  return true;
}

/** Récupère tous les morceaux d’une playlist (pagination), métadonnées mappées. */
export async function fetchAllPlaylistTracksMapped(
  accessToken: string,
  playlistId: string,
): Promise<MappedTrack[]> {
  const out: MappedTrack[] = [];
  let path: string | null =
    `/playlists/${encodeURIComponent(playlistId)}/tracks?limit=50`;

  while (path) {
    const page: PlaylistTracksPage =
      await spotifyApiJson<PlaylistTracksPage>(accessToken, path);
    for (const item of page.items ?? []) {
      if (item.is_local) continue;
      const t = item.track;
      if (!isSpotifyTrackApi(t)) continue;
      out.push(mapSpotifyTrack(t));
    }
    path = page.next?.trim() || null;
  }

  return out;
}
