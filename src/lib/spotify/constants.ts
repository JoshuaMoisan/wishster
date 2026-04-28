export const SPOTIFY_AUTH = "https://accounts.spotify.com/authorize";
export const SPOTIFY_TOKEN = "https://accounts.spotify.com/api/token";
export const SPOTIFY_API = "https://api.spotify.com/v1";

export function defaultScopes(): string {
  return (
    process.env.SPOTIFY_SCOPES ??
    "streaming user-read-playback-state user-modify-playback-state user-read-email user-read-private playlist-read-private"
  );
}
