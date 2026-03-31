/**
 * URL absolue vers /api/spotify/login pour que les cookies OAuth soient posés
 * sur le même hôte que SPOTIFY_REDIRECT_URI (ex. 127.0.0.1, pas localhost).
 */
export function spotifyLoginUrl(returnTo: string): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "").trim();
  const rt = encodeURIComponent(
    returnTo.startsWith("/") && !returnTo.startsWith("//")
      ? returnTo
      : "/",
  );
  if (!raw) {
    return `/api/spotify/login?returnTo=${rt}`;
  }
  return `${raw}/api/spotify/login?returnTo=${rt}`;
}
