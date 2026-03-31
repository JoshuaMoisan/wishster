type SpotifyArtist = { name: string };
type SpotifyAlbum = { name: string; release_date?: string };
export type SpotifyTrackApi = {
  id: string;
  uri: string;
  name: string;
  artists: SpotifyArtist[];
  album: SpotifyAlbum;
  duration_ms: number;
};

export type MappedTrack = {
  spotify_track_id: string;
  spotify_uri: string;
  title: string;
  artist_name: string;
  album_name: string | null;
  release_date: string | null;
  release_year: number | null;
  duration_ms: number;
};

export function mapSpotifyTrack(t: SpotifyTrackApi): MappedTrack {
  const rd = t.album.release_date ?? null;
  let release_year: number | null = null;
  if (rd && /^\d{4}/.test(rd)) {
    release_year = parseInt(rd.slice(0, 4), 10);
    if (Number.isNaN(release_year)) release_year = null;
  }
  return {
    spotify_track_id: t.id,
    spotify_uri: t.uri,
    title: t.name,
    artist_name: t.artists.map((a) => a.name).join(", "),
    album_name: t.album.name ?? null,
    release_date: rd,
    release_year,
    duration_ms: t.duration_ms,
  };
}
