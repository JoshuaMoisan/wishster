export type Card = {
  id: string;
  slug: string;
  input_title: string;
  input_artist: string | null;
  spotify_track_id: string;
  spotify_uri: string;
  title: string;
  artist_name: string;
  album_name: string | null;
  release_date: string | null;
  release_year: number | null;
  duration_ms: number | null;
  qr_url: string;
  is_active: boolean;
  created_at: string;
};

export type CardInsert = Omit<Card, "id" | "created_at">;

export type CardReveal = Pick<
  Card,
  "title" | "artist_name" | "release_date" | "release_year"
>;

export type PlayPayload = {
  slug: string;
  spotifyUri: string;
  durationMs: number | null;
};
